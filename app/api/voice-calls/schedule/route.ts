import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { scheduleVoiceCall, getBorrowerLivePendingSummary } from "@/lib/ai/voiceCalling";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      borrowerId,
      borrowerName,
      phone,
      loanCode,
      scheduledDate,
      scheduledTime,
      customAmount,
      dueDate,
      language = "mr",
      tone = "POLITE",
      callNotes,
    } = body;

    if (!borrowerId || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { error: "Borrower, scheduled date, and scheduled time are required." },
        { status: 400 }
      );
    }

    // Fetch live pending dues if amount not explicitly specified
    let finalAmount = customAmount;
    let finalName = borrowerName;
    let finalPhone = phone;
    let finalLoanCode = loanCode;
    let finalDueDate = dueDate;

    const summary = await getBorrowerLivePendingSummary(borrowerId);
    if (summary) {
      finalName = finalName || summary.fullName;
      finalPhone = finalPhone || summary.phone;
      finalLoanCode = finalLoanCode || summary.primaryLoanCode;
      finalDueDate = finalDueDate || summary.earliestDueDate;
      if (typeof finalAmount !== "number" || finalAmount <= 0) {
        finalAmount = summary.effectivePendingAmount;
      }
    }

    if (!finalName || !finalPhone) {
      return NextResponse.json(
        { error: "Borrower details not found." },
        { status: 404 }
      );
    }

    const callRecord = await scheduleVoiceCall({
      borrowerId,
      borrowerName: finalName,
      phone: finalPhone,
      loanCode: finalLoanCode,
      scheduledDate,
      scheduledTime,
      pendingAmount: finalAmount || 0,
      dueDate: finalDueDate,
      language,
      tone,
      callNotes,
    });

    return NextResponse.json({
      success: true,
      message: "AI Voice Call successfully scheduled.",
      call: callRecord,
    });
  } catch (error: any) {
    console.error("Schedule voice call error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to schedule AI voice call." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Call ID is required." }, { status: 400 });
    }

    await prisma.scheduledVoiceCall.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({
      success: true,
      message: "Scheduled call cancelled successfully.",
    });
  } catch (error: any) {
    console.error("Cancel voice call error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to cancel scheduled voice call." },
      { status: 500 }
    );
  }
}
