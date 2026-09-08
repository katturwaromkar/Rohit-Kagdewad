import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { loanSchema } from "@/lib/validations";
import { generateLoanSchedule } from "@/lib/financial";
import { logAudit } from "@/lib/audit/logger";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "ALL";
    const borrowerId = searchParams.get("borrowerId") || "";

    const where: any = {};
    if (status !== "ALL") {
      where.status = status;
    }
    if (borrowerId) {
      where.borrowerId = borrowerId;
    }

    const loans = await prisma.loan.findMany({
      where,
      include: {
        borrower: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            borrowerCode: true,
            city: true,
          },
        },
        installments: {
          orderBy: { installmentNumber: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ loans });
  } catch (error) {
    console.error("Fetch loans error:", error);
    return NextResponse.json({ error: "Failed to fetch loans" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = loanSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Verify borrower exists
    const borrower = await prisma.borrower.findUnique({
      where: { id: data.borrowerId },
    });
    if (!borrower) {
      return NextResponse.json({ error: "Borrower not found" }, { status: 404 });
    }

    // Generate schedule using financial engine
    const scheduleResult = generateLoanSchedule({
      principalAmount: data.principalAmount,
      interestRate: data.interestRate,
      interestType: data.interestType,
      repaymentFrequency: data.repaymentFrequency,
      tenurePeriods: data.tenurePeriods,
      disbursementDate: data.disbursementDate,
      firstDueDate: data.firstDueDate,
      processingFee: data.processingFee,
    });

    // Auto-generate loan code: LN-YYYY-XXX
    const year = new Date().getFullYear();
    const count = await prisma.loan.count();
    const loanCode = `LN-${year}-${String(count + 1).padStart(3, "0")}`;

    const principalAmt = parseFloat(scheduleResult.principalAmount);
    const totalInterest = parseFloat(scheduleResult.totalInterestExpected);
    const totalExpected = parseFloat(scheduleResult.totalAmountExpected);
    const processingFee = parseFloat(scheduleResult.processingFee);

    // Atomic database transaction
    const createdLoan = await prisma.$transaction(async (tx) => {
      // 1. Create Loan
      const loan = await tx.loan.create({
        data: {
          loanCode,
          borrowerId: data.borrowerId,
          principalAmount: principalAmt,
          interestRate: data.interestRate,
          interestType: data.interestType,
          repaymentFrequency: data.repaymentFrequency,
          tenurePeriods: data.tenurePeriods,
          disbursementDate: new Date(data.disbursementDate),
          firstDueDate: new Date(data.firstDueDate),
          processingFee: processingFee,
          lateFeeRatePerDay: data.lateFeeRatePerDay || 0,
          gracePeriodDays: data.gracePeriodDays || 0,
          totalInterestExpected: totalInterest,
          totalAmountExpected: totalExpected,
          principalOutstanding: principalAmt,
          interestOutstanding: totalInterest,
          totalOutstanding: totalExpected,
          status: "ACTIVE",
          notes: data.notes || null,
          collateralInfo: data.collateralInfo || null,
          createdById: user.id,
        },
      });

      // 2. Create Repayment Schedule Installments
      await tx.installment.createMany({
        data: scheduleResult.installments.map((inst) => ({
          loanId: loan.id,
          installmentNumber: inst.installmentNumber,
          dueDate: new Date(inst.dueDate),
          principalDue: parseFloat(inst.principalDue),
          interestDue: parseFloat(inst.interestDue),
          feeDue: 0,
          totalDue: parseFloat(inst.totalDue),
          principalPaid: 0,
          interestPaid: 0,
          feePaid: 0,
          totalPaid: 0,
          status: "UPCOMING",
        })),
      });

      // 3. Create Disbursement Ledger Entry
      // Calculate previous running balance for this borrower
      const lastEntry = await tx.ledgerEntry.findFirst({
        where: { borrowerId: data.borrowerId },
        orderBy: { entryDate: "desc" },
      });
      const previousBalance = lastEntry ? lastEntry.runningBalance : 0;
      const newRunningBalance = previousBalance + totalExpected;

      await tx.ledgerEntry.create({
        data: {
          borrowerId: data.borrowerId,
          loanId: loan.id,
          entryType: "DISBURSEMENT",
          debit: totalExpected,
          credit: 0,
          runningBalance: newRunningBalance,
          description: `Loan Disbursed ${loanCode} (Principal ${principalAmt} + Interest ${totalInterest})`,
          entryDate: new Date(data.disbursementDate),
        },
      });

      return loan;
    });

    // Audit log
    await logAudit({
      userId: user.id,
      action: "CREATE",
      entityType: "LOAN",
      entityId: createdLoan.id,
      newValues: {
        loanCode,
        borrower: borrower.fullName,
        principal: principalAmt,
        totalExpected,
      },
    });

    return NextResponse.json({ success: true, loan: createdLoan });
  } catch (error: any) {
    console.error("Create loan error:", error);
    return NextResponse.json(
      { error: "Failed to create loan. Transaction aborted." },
      { status: 500 }
    );
  }
}
