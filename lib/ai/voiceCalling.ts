/**
 * AI Automated Voice Calling Engine for Rohit Kagdewad Lending Platform
 * Handles live borrower pending dues calculation, scheduled voice calls,
 * Marathi phone dialog synthesis, and call execution lifecycle.
 */

import prisma from "@/lib/db";
import { generateVoiceScript, VoiceReminderType, VoiceTone } from "./voice";
import { formatDate } from "../utils";

export interface LiveBorrowerPendingSummary {
  borrowerId: string;
  borrowerCode: string;
  fullName: string;
  phone: string;
  alternatePhone: string | null;
  city: string;
  activeLoansCount: number;
  loanCodes: string[];
  primaryLoanCode: string;
  totalPrincipal: number;
  totalOutstanding: number;
  totalOverdueAmount: number;
  totalDueTodayAmount: number;
  totalUpcomingAmount: number;
  effectivePendingAmount: number; // Highest priority amount to collect (Overdue -> Due Today -> Upcoming/Outstanding)
  overdueCount: number;
  dueTodayCount: number;
  upcomingCount: number;
  earliestDueDate: Date | null;
  daysOverdue: number;
  reminderType: VoiceReminderType;
}

/**
 * Accurately calculate live pending and overdue amounts for a specific borrower
 * across all active loans and installments.
 */
export async function getBorrowerLivePendingSummary(
  borrowerId: string
): Promise<LiveBorrowerPendingSummary | null> {
  const borrower = await prisma.borrower.findUnique({
    where: { id: borrowerId },
    include: {
      loans: {
        where: { status: { in: ["ACTIVE", "OVERDUE"] } },
        include: {
          installments: {
            where: { status: { in: ["DUE_TODAY", "OVERDUE", "UPCOMING"] } },
            orderBy: { dueDate: "asc" },
          },
        },
      },
    },
  });

  if (!borrower) return null;

  let totalPrincipal = 0;
  let totalOutstanding = 0;
  let totalOverdueAmount = 0;
  let totalDueTodayAmount = 0;
  let totalUpcomingAmount = 0;
  let overdueCount = 0;
  let dueTodayCount = 0;
  let upcomingCount = 0;
  let earliestDueDate: Date | null = null;
  let maxDaysOverdue = 0;
  const loanCodes: string[] = [];

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  borrower.loans.forEach((loan) => {
    loanCodes.push(loan.loanCode);
    totalPrincipal += loan.principalAmount;
    totalOutstanding += loan.totalOutstanding;

    loan.installments.forEach((inst) => {
      const remainingDue = Math.max(0, inst.totalDue - inst.totalPaid);
      const instDueDate = new Date(inst.dueDate);
      instDueDate.setHours(0, 0, 0, 0);

      if (!earliestDueDate || instDueDate < earliestDueDate) {
        earliestDueDate = instDueDate;
      }

      if (inst.status === "OVERDUE" || instDueDate < now) {
        totalOverdueAmount += remainingDue;
        overdueCount += 1;
        const diffDays = Math.max(
          1,
          Math.floor((now.getTime() - instDueDate.getTime()) / (1000 * 60 * 60 * 24))
        );
        if (diffDays > maxDaysOverdue) {
          maxDaysOverdue = diffDays;
        }
      } else if (inst.status === "DUE_TODAY" || instDueDate.getTime() === now.getTime()) {
        totalDueTodayAmount += remainingDue;
        dueTodayCount += 1;
      } else {
        totalUpcomingAmount += remainingDue;
        upcomingCount += 1;
      }
    });
  });

  // Determine effective priority pending amount
  let effectivePendingAmount = 0;
  let reminderType: VoiceReminderType = "DUE_TODAY";

  if (totalOverdueAmount > 0) {
    effectivePendingAmount = totalOverdueAmount;
    reminderType = "OVERDUE_ALERT";
  } else if (totalDueTodayAmount > 0) {
    effectivePendingAmount = totalDueTodayAmount;
    reminderType = "DUE_TODAY";
  } else if (totalUpcomingAmount > 0) {
    effectivePendingAmount = totalUpcomingAmount;
    reminderType = "DUE_IN_2_DAYS";
  } else {
    effectivePendingAmount = totalOutstanding;
    reminderType = totalOutstanding > 0 ? "DUE_TODAY" : "LOAN_WELCOME";
  }

  return {
    borrowerId: borrower.id,
    borrowerCode: borrower.borrowerCode,
    fullName: borrower.fullName,
    phone: borrower.phone,
    alternatePhone: borrower.alternatePhone,
    city: borrower.city,
    activeLoansCount: borrower.loans.length,
    loanCodes,
    primaryLoanCode: loanCodes[0] || "LN-AUTO",
    totalPrincipal,
    totalOutstanding,
    totalOverdueAmount,
    totalDueTodayAmount,
    totalUpcomingAmount,
    effectivePendingAmount,
    overdueCount,
    dueTodayCount,
    upcomingCount,
    earliestDueDate,
    daysOverdue: maxDaysOverdue,
    reminderType,
  };
}

/**
 * Generate complete Marathi conversational phone script for live interactive voice calling
 */
export function generateMarathiCallDialogue(params: {
  borrowerName: string;
  pendingAmount: number;
  dueDate?: Date | string | null;
  loanCode?: string;
  daysOverdue?: number;
  tone?: VoiceTone;
  businessName?: string;
  businessPhone?: string;
}) {
  const business = params.businessName || "रोहित कागदेवाड प्रायव्हेट लेंडिंग";
  const phone = params.businessPhone || "9665269105";
  const formattedAmount = params.pendingAmount.toLocaleString("en-IN");
  const formattedDate = params.dueDate
    ? typeof params.dueDate === "string"
      ? params.dueDate
      : formatDate(params.dueDate, "dd MMMM yyyy")
    : "आज";

  const isUrgent = params.tone === "URGENT" || (params.daysOverdue && params.daysOverdue > 0);

  // Script parts for natural in-call pauses and dialog turns
  const dialogue = {
    greeting: `नमस्कार ${params.borrowerName} जी! मी ${business} यांच्या कार्यालयातून बोलत आहे.`,
    loanDetails: `आपल्या कर्ज खात्याचा (क्रमांक: ${params.loanCode || "LN-MAIN"}) हप्ता रुपये ${formattedAmount} बाकी आहे.`,
    dueDateWarning: isUrgent
      ? `हा हप्ता तारीख ${formattedDate} रोजी देय होता आणि सध्या थकीत आहे. पुढील कायदेशीर कारवाई व विलंब शुल्क टाळण्यासाठी कृपया आजच भरणा करा.`
      : `हा हप्ता भरण्याची अंतिम तारीख ${formattedDate} आहे. कृपया वेळेत भरणा करून सहकार्य करावे.`,
    paymentInstruction: `आपण ही रक्कम गुगल पे, फोनपे किंवा थेट आमच्या कार्यालयात येऊन रोख जमा करू शकता. अधिक माहितीसाठी संपर्क क्रमांक आहे: ${phone}.`,
    closing: `धन्यवाद ${params.borrowerName} जी, आपला दिवस चांगला जावो!`,
  };

  const fullSpokenScript = `${dialogue.greeting} ${dialogue.loanDetails} ${dialogue.dueDateWarning} ${dialogue.paymentInstruction} ${dialogue.closing}`;

  return {
    dialogue,
    fullSpokenScript,
    whatsappNoteText: `🎙️ *AI व्हॉईस कॉल संदेश (Marathi Audio)*\n\n` +
      `नमस्कार *${params.borrowerName}*,\n\n` +
      `📢 *थकीत हप्ता:* ₹${formattedAmount}\n` +
      `📅 *अंतिम तारीख:* ${formattedDate}\n` +
      `🔢 *कर्ज क्रमांक:* ${params.loanCode || "N/A"}\n\n` +
      `💬 *कॉल संदेश सारांश:* "${fullSpokenScript}"\n\n` +
      `🏢 *${business}*\n` +
      `📞 *संपर्क:* ${phone}`,
  };
}

/**
 * Schedule a new automated AI voice call in database
 */
export async function scheduleVoiceCall(input: {
  borrowerId: string;
  borrowerName: string;
  phone: string;
  loanCode?: string;
  scheduledDate: Date | string;
  scheduledTime: string;
  pendingAmount: number;
  dueDate?: Date | string | null;
  language?: string;
  tone?: VoiceTone;
  callNotes?: string;
}) {
  const dateObj = new Date(input.scheduledDate);

  const { fullSpokenScript } = generateMarathiCallDialogue({
    borrowerName: input.borrowerName,
    pendingAmount: input.pendingAmount,
    dueDate: input.dueDate,
    loanCode: input.loanCode,
    tone: input.tone || "POLITE",
  });

  return await prisma.scheduledVoiceCall.create({
    data: {
      borrowerId: input.borrowerId,
      borrowerName: input.borrowerName,
      phone: input.phone,
      loanCode: input.loanCode || null,
      scheduledDate: dateObj,
      scheduledTime: input.scheduledTime,
      pendingAmount: input.pendingAmount,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      language: input.language || "mr",
      tone: input.tone || "POLITE",
      spokenScript: fullSpokenScript,
      callNotes: input.callNotes || null,
      status: "SCHEDULED",
    },
  });
}

/**
 * List scheduled and past voice calls with filters
 */
export async function listScheduledVoiceCalls(params?: {
  status?: string;
  borrowerId?: string;
  limit?: number;
}) {
  const where: any = {};
  if (params?.status && params.status !== "ALL") {
    where.status = params.status;
  }
  if (params?.borrowerId) {
    where.borrowerId = params.borrowerId;
  }

  return await prisma.scheduledVoiceCall.findMany({
    where,
    orderBy: [
      { scheduledDate: "asc" },
      { scheduledTime: "asc" },
      { createdAt: "desc" },
    ],
    take: params?.limit || 100,
  });
}

/**
 * Mark a scheduled call as completed/executed with notes
 */
export async function markVoiceCallExecuted(
  callId: string,
  callNotes?: string,
  status: "COMPLETED" | "MISSED" | "CANCELLED" = "COMPLETED"
) {
  return await prisma.scheduledVoiceCall.update({
    where: { id: callId },
    data: {
      status,
      callNotes: callNotes || undefined,
      executedAt: new Date(),
    },
  });
}
