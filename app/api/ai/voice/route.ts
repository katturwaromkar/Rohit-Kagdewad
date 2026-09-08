import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { generateVoiceScript, VoiceReminderType, VoiceTone } from "@/lib/ai/voice";
import { getBorrowerLivePendingSummary } from "@/lib/ai/voiceCalling";

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
      type = "DUE_TODAY",
      language = "mr",
      tone = "POLITE",
      customAmount,
    } = body;

    let borrowerName = "Customer";
    let phone = "9665269105";
    let amount: number = typeof customAmount === "number" ? customAmount : 0;
    let dueDate: Date | undefined;
    let loanCode: string | undefined;
    let daysOverdue = 0;
    let pendingBreakdown: any = null;

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
        phone = inst.loan.borrower.phone;
        amount = Math.max(0, inst.totalDue - inst.totalPaid);
        dueDate = inst.dueDate;
        loanCode = inst.loan.loanCode;

        if (inst.status === "OVERDUE") {
          const now = new Date();
          const instDue = new Date(inst.dueDate);
          daysOverdue = Math.max(1, Math.floor((now.getTime() - instDue.getTime()) / (1000 * 60 * 60 * 24)));
        }
      }
    } else if (borrowerId) {
      const summary = await getBorrowerLivePendingSummary(borrowerId);
      if (summary) {
        borrowerName = summary.fullName;
        phone = summary.phone;
        loanCode = summary.primaryLoanCode;
        dueDate = summary.earliestDueDate || undefined;
        daysOverdue = summary.daysOverdue;
        pendingBreakdown = {
          totalOverdueAmount: summary.totalOverdueAmount,
          totalDueTodayAmount: summary.totalDueTodayAmount,
          totalUpcomingAmount: summary.totalUpcomingAmount,
          totalOutstanding: summary.totalOutstanding,
          overdueCount: summary.overdueCount,
          activeLoansCount: summary.activeLoansCount,
        };

        if (customAmount && typeof customAmount === "number") {
          amount = customAmount;
        } else {
          amount = summary.effectivePendingAmount;
        }
      }
    }

    const voiceData = generateVoiceScript(type as VoiceReminderType, {
      borrowerName,
      amount: amount || 5000,
      dueDate,
      loanCode,
      daysOverdue,
      businessName: process.env.NEXT_PUBLIC_BUSINESS_NAME || "रोहित कागदेवाड प्रायव्हेट लेंडिंग",
      businessPhone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || "+91 96652 69105",
      language: language as "mr" | "en",
      tone: tone as VoiceTone,
    });

    return NextResponse.json({
      success: true,
      borrowerName,
      phone,
      amount,
      dueDate,
      loanCode,
      daysOverdue,
      pendingBreakdown,
      ...voiceData,
    });
  } catch (error: any) {
    console.error("AI Voice API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate voice reminder script." },
      { status: 500 }
    );
  }
}

