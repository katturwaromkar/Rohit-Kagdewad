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
    const { borrowerId, loanId, templateType, customMessage } = body;

    const borrower = await prisma.borrower.findUnique({
      where: { id: borrowerId },
    });

    if (!borrower) {
      return NextResponse.json({ error: "Borrower not found" }, { status: 404 });
    }

    let loan = null;
    if (loanId) {
      loan = await prisma.loan.findUnique({
        where: { id: loanId },
      });
    }

    let messageBody = customMessage || "";
    let templateName = templateType || "CUSTOM_MESSAGE";

    if (templateType && (WHATSAPP_TEMPLATES as any)[templateType]) {
      const templateFn = (WHATSAPP_TEMPLATES as any)[templateType];
      messageBody = templateFn({
        borrowerName: borrower.fullName,
        loanCode: loan?.loanCode || "",
        amount: loan?.totalOutstanding || 0,
        dueDate: new Date(),
      });
    }

    const result = await sendWhatsAppMessage({
      borrowerId: borrower.id,
      loanId: loan?.id,
      phone: borrower.phone,
      templateName,
      messageBody,
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entityType: "WHATSAPP_MESSAGE",
      entityId: result.id,
      newValues: { recipient: borrower.fullName, template: templateName },
    });

    return NextResponse.json({ success: true, message: result });
  } catch (error: any) {
    console.error("WhatsApp send error:", error);
    return NextResponse.json({ error: "Failed to send WhatsApp message" }, { status: 500 });
  }
}
