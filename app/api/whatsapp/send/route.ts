import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp/templates";
import prisma from "@/lib/db";
import { logAudit } from "@/lib/audit/logger";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { borrowerId, loanId, templateType, customMessage, language = "both" } = body;

    const borrower = await prisma.borrower.findUnique({
      where: { id: borrowerId },
      include: {
        loans: {
          where: { status: { in: ["ACTIVE", "OVERDUE"] } },
          take: 1,
        },
      },
    });

    if (!borrower) {
      return NextResponse.json({ error: "Borrower not found" }, { status: 404 });
    }

    const targetLoan = loanId
      ? await prisma.loan.findUnique({ where: { id: loanId } })
      : borrower.loans[0];

    const businessPhoneSetting = await prisma.businessSetting.findUnique({
      where: { key: "BUSINESS_PHONE" },
    });
    const businessNameSetting = await prisma.businessSetting.findUnique({
      where: { key: "BUSINESS_NAME" },
    });

    let messageBody = customMessage || "";
    let templateName = templateType || "CUSTOM_MESSAGE";

    if (templateType && (WHATSAPP_TEMPLATES as any)[templateType]) {
      const templateFn = (WHATSAPP_TEMPLATES as any)[templateType];
      messageBody = templateFn({
        borrowerName: borrower.fullName,
        loanCode: targetLoan?.loanCode || "",
        amount: targetLoan?.totalOutstanding || 0,
        dueDate: new Date(),
        businessName: businessNameSetting?.value || "Rohit Kagdewad Lending Management",
        businessPhone: businessPhoneSetting?.value || "+91 96652 69105",
        language,
      });
    }

    const result = await sendWhatsAppMessage({
      borrowerId: borrower.id,
      loanId: targetLoan?.id,
      phone: borrower.phone,
      templateName,
      messageBody,
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entityType: "WHATSAPP_MESSAGE",
      entityId: result.id,
      newValues: { recipient: borrower.fullName, template: templateName, language },
    });

    return NextResponse.json({ success: true, message: result });
  } catch (error: any) {
    console.error("WhatsApp send error:", error);
    return NextResponse.json({ error: "Failed to send WhatsApp message" }, { status: 500 });
  }
}
