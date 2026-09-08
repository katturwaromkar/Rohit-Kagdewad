import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { paymentSchema } from "@/lib/validations";
import { allocatePayment } from "@/lib/financial";
import { logAudit } from "@/lib/audit/logger";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp/templates";
import { bilingualTemplates } from "@/lib/i18n/marathi";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const borrowerId = searchParams.get("borrowerId") || "";
    const loanId = searchParams.get("loanId") || "";
    const mode = searchParams.get("mode") || "";
    const status = searchParams.get("status") || "ALL";

    const where: any = {};
    if (borrowerId) where.borrowerId = borrowerId;
    if (loanId) where.loanId = loanId;
    if (mode && mode !== "ALL") where.paymentMode = mode;
    if (status !== "ALL") where.status = status;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        borrower: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            borrowerCode: true,
          },
        },
        loan: {
          select: {
            id: true,
            loanCode: true,
            totalOutstanding: true,
          },
        },
        collectedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        allocations: true,
      },
      orderBy: { paymentDate: "desc" },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Fetch payments error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = paymentSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Fetch active loan and unpaid/partially paid installments
    const loan = await prisma.loan.findUnique({
      where: { id: data.loanId },
      include: {
        installments: {
          orderBy: { installmentNumber: "asc" },
        },
        borrower: true,
      },
    });

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    // Allocate payment across installments chronologically
    const installmentsForAllocation = loan.installments.map((i) => ({
      id: i.id,
      installmentNumber: i.installmentNumber,
      dueDate: i.dueDate,
      principalDue: i.principalDue,
      interestDue: i.interestDue,
      feeDue: i.feeDue,
      totalDue: i.totalDue,
      principalPaid: i.principalPaid,
      interestPaid: i.interestPaid,
      feePaid: i.feePaid,
      totalPaid: i.totalPaid,
      status: i.status,
    }));

    const allocationResult = allocatePayment(
      data.amount,
      installmentsForAllocation,
      new Date(data.paymentDate)
    );

    // Generate unique receipt number: REC-YYYYMM-XXXX
    const now = new Date(data.paymentDate);
    const yearMonth = format(now, "yyyyMM");
    const count = await prisma.payment.count();
    const receiptNumber = `REC-${yearMonth}-${String(count + 1).padStart(4, "0")}`;

    const principalAllocated = parseFloat(allocationResult.totalPrincipalAllocated);
    const interestAllocated = parseFloat(allocationResult.totalInterestAllocated);
    const feeAllocated = parseFloat(allocationResult.totalFeeAllocated);
    const totalPaymentAmt = parseFloat(allocationResult.totalPaid);

    // Atomic Database Transaction
    const recordedPayment = await prisma.$transaction(async (tx) => {
      // 1. Create Payment
      const payment = await tx.payment.create({
        data: {
          receiptNumber,
          loanId: data.loanId,
          borrowerId: data.borrowerId,
          amount: totalPaymentAmt,
          principalAllocated,
          interestAllocated,
          lateFeeAllocated: feeAllocated,
          paymentDate: new Date(data.paymentDate),
          paymentMode: data.paymentMode,
          referenceNumber: data.referenceNumber || null,
          notes: data.notes || null,
          collectedById: user.id,
          status: "SUCCESS",
          idempotencyKey: data.idempotencyKey || null,
        },
      });

      // 2. Update each affected Installment & create PaymentAllocation records
      for (const alloc of allocationResult.allocations) {
        const inst = loan.installments.find((i) => i.id === alloc.installmentId);
        if (!inst) continue;

        const newPPaid = inst.principalPaid + parseFloat(alloc.principalAllocated);
        const newIPaid = inst.interestPaid + parseFloat(alloc.interestAllocated);
        const newFPaid = inst.feePaid + parseFloat(alloc.feeAllocated);
        const newTPaid = inst.totalPaid + parseFloat(alloc.totalAllocated);

        await tx.installment.update({
          where: { id: alloc.installmentId },
          data: {
            principalPaid: newPPaid,
            interestPaid: newIPaid,
            feePaid: newFPaid,
            totalPaid: newTPaid,
            status: alloc.newStatus,
            paidAt: alloc.newStatus === "PAID" ? new Date(data.paymentDate) : null,
          },
        });

        await tx.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            installmentId: alloc.installmentId,
            principalAmount: parseFloat(alloc.principalAllocated),
            interestAmount: parseFloat(alloc.interestAllocated),
            feeAmount: parseFloat(alloc.feeAllocated),
            totalAmount: parseFloat(alloc.totalAllocated),
          },
        });
      }

      // 3. Update Loan Outstanding Balance & Status
      const newPrincipalOut = Math.max(0, loan.principalOutstanding - principalAllocated);
      const newInterestOut = Math.max(0, loan.interestOutstanding - interestAllocated);
      const newTotalOut = Math.max(0, loan.totalOutstanding - totalPaymentAmt);

      // Check if any overdue installments remain
      const remainingOverdue = await tx.installment.count({
        where: {
          loanId: loan.id,
          status: "OVERDUE",
        },
      });

      let updatedLoanStatus = loan.status;
      if (newTotalOut <= 0.01) {
        updatedLoanStatus = "PAID_OFF";
      } else if (remainingOverdue > 0) {
        updatedLoanStatus = "OVERDUE";
      } else {
        updatedLoanStatus = "ACTIVE";
      }

      await tx.loan.update({
        where: { id: loan.id },
        data: {
          principalOutstanding: newPrincipalOut,
          interestOutstanding: newInterestOut,
          totalOutstanding: newTotalOut,
          status: updatedLoanStatus,
        },
      });

      // 4. Update Borrower Status if no other overdue loans
      if (loan.borrower.status === "OVERDUE") {
        const otherOverdues = await tx.loan.count({
          where: {
            borrowerId: loan.borrowerId,
            status: "OVERDUE",
          },
        });
        if (otherOverdues === 0) {
          await tx.borrower.update({
            where: { id: loan.borrowerId },
            data: { status: "ACTIVE" },
          });
        }
      }

      // 5. Create Ledger Entry
      const lastEntry = await tx.ledgerEntry.findFirst({
        where: { borrowerId: data.borrowerId },
        orderBy: { entryDate: "desc" },
      });
      const previousBalance = lastEntry ? lastEntry.runningBalance : 0;
      const newRunningBalance = Math.max(0, previousBalance - totalPaymentAmt);

      await tx.ledgerEntry.create({
        data: {
          borrowerId: data.borrowerId,
          loanId: data.loanId,
          paymentId: payment.id,
          entryType: "PAYMENT",
          debit: 0,
          credit: totalPaymentAmt,
          runningBalance: newRunningBalance,
          description: `Payment Received (${data.paymentMode}) - Principal ₹${principalAllocated} + Interest ₹${interestAllocated}`,
          referenceNo: receiptNumber,
          entryDate: new Date(data.paymentDate),
        },
      });

      return payment;
    });

    // 6. Send Automated Bilingual WhatsApp Receipt to Borrower
    try {
      const waMessage = WHATSAPP_TEMPLATES.PAYMENT_RECEIPT({
        borrowerName: loan.borrower.fullName,
        amount: totalPaymentAmt,
        receiptNumber,
        loanCode: loan.loanCode,
        balanceRemaining: Math.max(0, loan.totalOutstanding - totalPaymentAmt),
        language: "both",
      });

      await sendWhatsAppMessage({
        borrowerId: loan.borrower.id,
        loanId: loan.id,
        phone: loan.borrower.phone,
        templateName: "PAYMENT_RECEIPT",
        messageBody: waMessage,
      });
    } catch (waErr) {
      console.error("WhatsApp auto-receipt error (non-blocking):", waErr);
    }

    // 7. Instant Alert to Rohit Kagdewad (Owner)
    try {
      const ownerAlertText = bilingualTemplates.ownerCollectionAlert(
        user.name,
        loan.borrower.fullName,
        totalPaymentAmt.toLocaleString("en-IN"),
        data.paymentMode,
        receiptNumber
      );
      await sendWhatsAppMessage({
        borrowerId: loan.borrower.id,
        loanId: loan.id,
        phone: "9665269105",
        templateName: "OWNER_ALERT",
        messageBody: ownerAlertText,
      });
    } catch (ownerAlertErr) {
      console.error("Owner alert error (non-blocking):", ownerAlertErr);
    }

    // Audit log
    await logAudit({
      userId: user.id,
      action: "CREATE",
      entityType: "PAYMENT",
      entityId: recordedPayment.id,
      newValues: {
        receiptNumber,
        borrower: loan.borrower.fullName,
        amount: totalPaymentAmt,
        paymentMode: data.paymentMode,
      },
    });

    return NextResponse.json({ success: true, payment: recordedPayment, receiptNumber });
  } catch (error: any) {
    console.error("Payment recording error:", error);
    return NextResponse.json(
      { error: "Failed to record payment. Transaction rolled back." },
      { status: 500 }
    );
  }
}
