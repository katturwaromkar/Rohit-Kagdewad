import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { dispatchOutboundVoiceCall, getBorrowerLivePendingSummary } from "@/lib/ai/voiceCalling";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      phone,
      borrowerName,
      borrowerId,
      scheduledCallId,
      loanCode,
      pendingAmount,
      dueDate,
      daysOverdue,
      tone = "POLITE",
      language = "mr",
      isTest = false,
    } = body;

    let finalPhone = phone;
    let finalBorrowerName = borrowerName;
    let finalAmount = typeof pendingAmount === "number" ? pendingAmount : 0;
    let finalLoanCode = loanCode;
    let finalDueDate = dueDate;
    let finalDaysOverdue = daysOverdue;

    // If borrowerId is provided, fetch real-time pending dues if not given
    if (borrowerId && (!finalPhone || !finalBorrowerName || finalAmount <= 0)) {
      const liveSummary = await getBorrowerLivePendingSummary(borrowerId);
      if (liveSummary) {
        finalPhone = finalPhone || liveSummary.phone;
        finalBorrowerName = finalBorrowerName || liveSummary.fullName;
        finalAmount = finalAmount > 0 ? finalAmount : liveSummary.effectivePendingAmount;
        finalLoanCode = finalLoanCode || liveSummary.primaryLoanCode;
        finalDueDate = finalDueDate || liveSummary.earliestDueDate;
        finalDaysOverdue = finalDaysOverdue !== undefined ? finalDaysOverdue : liveSummary.daysOverdue;
      }
    }

    if (!finalPhone) {
      return NextResponse.json(
        { error: "Recipient mobile phone number is required." },
        { status: 400 }
      );
    }

    if (!finalBorrowerName) {
      finalBorrowerName = "सन्माननीय ग्राहक";
    }

    const result = await dispatchOutboundVoiceCall({
      phone: finalPhone,
      borrowerName: finalBorrowerName,
      pendingAmount: finalAmount,
      dueDate: finalDueDate,
      loanCode: finalLoanCode,
      daysOverdue: finalDaysOverdue,
      tone,
      language,
      borrowerId,
      scheduledCallId,
      isTest,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Dispatch outbound voice call error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to dispatch outbound telephony voice call." },
      { status: 500 }
    );
  }
}
