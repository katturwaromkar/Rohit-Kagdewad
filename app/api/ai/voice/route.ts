import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { generateVoiceScript, VoiceReminderType, VoiceTone } from "@/lib/ai/voice";

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
          },
        },
      });

      if (borrower) {
        borrowerName = borrower.fullName;
        phone = borrower.phone;
        const activeLoan = borrower.loans[0];
        if (activeLoan) {
          loanCode = activeLoan.loanCode;
          const nextInst = activeLoan.installments[0];
          if (nextInst) {
            amount = Math.max(0, nextInst.totalDue - nextInst.totalPaid);
            dueDate = nextInst.dueDate;
          } else {
            amount = activeLoan.totalOutstanding;
          }
        }
      }
    }

    const voiceData = generateVoiceScript(type as VoiceReminderType, {
      borrowerName,
      amount: amount || 5000,
      dueDate,
      loanCode,
      businessName: process.env.NEXT_PUBLIC_BUSINESS_NAME || "Rohit Kagdewad Lending Management",
      businessPhone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || "+91 96652 69105",
      language: language as "mr" | "en",
      tone: tone as VoiceTone,
    });

    return NextResponse.json({
      success: true,
      borrowerName,
      phone,
      amount,
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
