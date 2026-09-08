import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { paymentReversalSchema } from "@/lib/validations";
import { calculateReversalRollback } from "@/lib/financial";
import { logAudit } from "@/lib/audit/logger";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Payment reversals are restricted to Super Admin / Owner
    if (user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Forbidden: Only the Business Owner can reverse financial transactions." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = paymentReversalSchema.safeParse({
      paymentId: params.id,
      reason: body.reason,
    });

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        allocations: true,
        loan: {
          include: {
            installments: true,
          },
        },
        borrower: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "REVERSED") {
      return NextResponse.json({ error: "Payment is already reversed." }, { status: 400 });
    }

    // Calculate rollback values using financial calculation engine
    const allocationsInput = payment.allocations.map((a) => {
      const inst = payment.loan.installments.find((i) => i.id === a.installmentId);
      return {
        installmentId: a.installmentId,
        installmentNumber: inst ? inst.installmentNumber : 1,
        principalAmount: a.principalAmount,
        interestAmount: a.interestAmount,
        feeAmount: a.feeAmount,
      };
    });

    const installmentsInput = payment.loan.installments.map((i) => ({
      id: i.id,
      installmentNumber: i.installmentNumber,
      dueDate: i.dueDate,
      totalDue: i.totalDue,
      principalPaid: i.principalPaid,
      interestPaid: i.interestPaid,
      feePaid: i.feePaid,
      totalPaid: i.totalPaid,
    }));

    const rollbackResults = calculateReversalRollback(
      allocationsInput,
      installmentsInput,
      new Date()
    );

    // Atomic Reversal Transaction
    const reversed = await prisma.$transaction(async (tx) => {
      // 1. Mark Payment as REVERSED
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "REVERSED",
          reversedAt: new Date(),
          reversedById: user.id,
          reversalReason: validated.data.reason,
        },
      });

      // 2. Rollback Installment states
      for (const res of rollbackResults) {
        await tx.installment.update({
          where: { id: res.installmentId },
          data: {
            principalPaid: parseFloat(res.newPrincipalPaid),
            interestPaid: parseFloat(res.newInterestPaid),
            feePaid: parseFloat(res.newFeePaid),
            totalPaid: parseFloat(res.newTotalPaid),
            status: res.newStatus,
            paidAt: null,
          },
        });
      }

      // 3. Restore Loan balances
      const restoredPrincipalOut = payment.loan.principalOutstanding + payment.principalAllocated;
      const restoredInterestOut = payment.loan.interestOutstanding + payment.interestAllocated;
      const restoredTotalOut = payment.loan.totalOutstanding + payment.amount;

      const hasOverdueInst = rollbackResults.some((r) => r.newStatus === "OVERDUE");
      const updatedLoanStatus = hasOverdueInst ? "OVERDUE" : "ACTIVE";

      await tx.loan.update({
        where: { id: payment.loanId },
        data: {
          principalOutstanding: restoredPrincipalOut,
          interestOutstanding: restoredInterestOut,
          totalOutstanding: restoredTotalOut,
          status: updatedLoanStatus,
        },
      });

      // 4. Update Borrower status if overdue restored
      if (hasOverdueInst) {
        await tx.borrower.update({
          where: { id: payment.borrowerId },
          data: { status: "OVERDUE" },
        });
      }

      // 5. Compensating Debit Ledger Entry
      const lastEntry = await tx.ledgerEntry.findFirst({
        where: { borrowerId: payment.borrowerId },
        orderBy: { entryDate: "desc" },
      });
      const previousBalance = lastEntry ? lastEntry.runningBalance : 0;
      const newRunningBalance = previousBalance + payment.amount;

      await tx.ledgerEntry.create({
        data: {
          borrowerId: payment.borrowerId,
          loanId: payment.loanId,
          paymentId: payment.id,
          entryType: "PAYMENT_REVERSAL",
          debit: payment.amount,
          credit: 0,
          runningBalance: newRunningBalance,
          description: `Payment Reversal for ${payment.receiptNumber}: ${validated.data.reason}`,
          referenceNo: `REV-${payment.receiptNumber}`,
          entryDate: new Date(),
        },
      });

      return updatedPayment;
    });

    // Audit log
    await logAudit({
      userId: user.id,
      action: "REVERSE",
      entityType: "PAYMENT",
      entityId: payment.id,
      oldValues: { status: "SUCCESS", amount: payment.amount },
      newValues: {
        status: "REVERSED",
        reason: validated.data.reason,
        reversedBy: user.name,
      },
    });

    return NextResponse.json({ success: true, payment: reversed });
  } catch (error: any) {
    console.error("Payment reversal error:", error);
    return NextResponse.json(
      { error: "Failed to reverse payment. Transaction aborted." },
      { status: 500 }
    );
  }
}
