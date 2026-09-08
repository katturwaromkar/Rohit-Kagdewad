import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { sendSMSLocal, generateSMSText, SMSReminderType, getSMSSettings } from "@/lib/sms/smslocal";
import { logAudit } from "@/lib/audit/logger";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      borrowerId,
      installmentId,
      loanId,
      phone,
      templateType = "DUE_TODAY",
      customMessage,
      customTemplateId,
      isTest = false,
    } = body;

    // Handle Test SMS
    if (isTest && phone) {
      const testMsg = customMessage || "Test SMS from Rohit Kagdewad Lending Management System via SMSLocal Gateway.";
      const res = await sendSMSLocal({
        numbers: phone,
        message: testMsg,
        templateId: customTemplateId,
      });

      return NextResponse.json({
        success: res.success,
        messageId: res.messageId,
        response: res.response,
        error: res.error,
        isMock: res.isMock,
      });
    }

    let recipientPhone = phone;
    let borrowerName = "Customer";
    let amount = 0;
    let dueDate: Date | undefined;
    let loanCode: string | undefined;
    let receiptNumber: string | undefined;
    let daysOverdue: number | undefined;

    if (installmentId) {
      const inst = await prisma.installment.findUnique({
        where: { id: installmentId },
        include: {
          loan: {
            include: {
              borrower: true,
            },
          },
        },
      });

      if (inst) {
        borrowerName = inst.loan.borrower.fullName;
        recipientPhone = inst.loan.borrower.phone;
        amount = Math.max(0, inst.totalDue - inst.totalPaid);
        dueDate = inst.dueDate;
        loanCode = inst.loan.loanCode;
        if (inst.status === "OVERDUE") {
          const diffTime = Math.abs(new Date().getTime() - new Date(inst.dueDate).getTime());
          daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      }
    } else if (borrowerId) {
      const borrower = await prisma.borrower.findUnique({
        where: { id: borrowerId },
        include: {
          loans: {
            where: { status: { in: ["ACTIVE", "OVERDUE"] } },
            include: {
              installments: {
                where: { status: { in: ["DUE_TODAY", "OVERDUE", "UPCOMING"] } },
                orderBy: { dueDate: "asc" },
                take: 1,
              },
            },
            take: 1,
          },
        },
      });

      if (borrower) {
        borrowerName = borrower.fullName;
        recipientPhone = borrower.phone;
        const activeLoan = borrower.loans[0];
        const nextInst = activeLoan?.installments[0];
        if (nextInst) {
          amount = Math.max(0, nextInst.totalDue - nextInst.totalPaid);
          dueDate = nextInst.dueDate;
          loanCode = activeLoan.loanCode;
        }
      }
    }

    if (!recipientPhone) {
      return NextResponse.json({ error: "No recipient phone number found." }, { status: 400 });
    }

    const config = await getSMSSettings();

    // Generate message content
    let messageToSend = customMessage;
    let templateIdToSend = customTemplateId;

    if (!messageToSend) {
      const tpl = generateSMSText({
        type: (templateType as SMSReminderType) || "DUE_TODAY",
        borrowerName,
        amount,
        dueDate,
        loanCode,
        receiptNumber,
        daysOverdue,
      });

      messageToSend = tpl.message;

      // Select DLT template ID from config if available
      if (templateType === "DUE_TODAY" && config.dltDueToday) {
        templateIdToSend = config.dltDueToday;
      } else if (templateType === "OVERDUE" && config.dltOverdue) {
        templateIdToSend = config.dltOverdue;
      } else if (templateType === "RECEIPT" && config.dltReceipt) {
        templateIdToSend = config.dltReceipt;
      } else if (templateType === "WELCOME" && config.dltWelcome) {
        templateIdToSend = config.dltWelcome;
      } else {
        templateIdToSend = tpl.defaultTemplateId;
      }
    }

    const smsResult = await sendSMSLocal({
      numbers: recipientPhone,
      message: messageToSend,
      templateId: templateIdToSend,
    });

    // Audit log
    await logAudit({
      userId: user.id,
      action: "CREATE",
      entityType: "SETTING",
      entityId: `SMS-${Date.now()}`,
      newValues: {
        recipientPhone,
        templateType,
        messageBody: messageToSend,
        result: smsResult,
      },
    });

    return NextResponse.json({
      success: smsResult.success,
      messageId: smsResult.messageId,
      response: smsResult.response,
      error: smsResult.error,
      isMock: smsResult.isMock,
      recipientPhone,
      message: messageToSend,
    });
  } catch (error: any) {
    console.error("SMS Send API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to dispatch SMS" }, { status: 500 });
  }
}
