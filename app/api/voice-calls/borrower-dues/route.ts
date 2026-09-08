import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { getBorrowerLivePendingSummary } from "@/lib/ai/voiceCalling";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const borrowerId = searchParams.get("borrowerId");

    if (borrowerId) {
      const summary = await getBorrowerLivePendingSummary(borrowerId);
      if (!summary) {
        return NextResponse.json({ error: "Borrower not found." }, { status: 404 });
      }
      return NextResponse.json({ success: true, summary });
    }

    // Otherwise return list of all active borrowers with their live pending balance
    const borrowers = await prisma.borrower.findMany({
      where: { status: { in: ["ACTIVE", "OVERDUE"] } },
      select: {
        id: true,
        borrowerCode: true,
        fullName: true,
        phone: true,
        city: true,
        loans: {
          where: { status: { in: ["ACTIVE", "OVERDUE"] } },
          select: {
            loanCode: true,
            totalOutstanding: true,
            installments: {
              where: { status: { in: ["DUE_TODAY", "OVERDUE", "UPCOMING"] } },
              select: {
                id: true,
                dueDate: true,
                totalDue: true,
                totalPaid: true,
                status: true,
              },
              orderBy: { dueDate: "asc" },
            },
          },
        },
      },
      orderBy: { fullName: "asc" },
      take: 100,
    });

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const summaries = borrowers.map((b) => {
      let totalOverdue = 0;
      let totalDueToday = 0;
      let totalOutstanding = 0;
      let earliestDueDate: Date | null = null;
      let maxDaysOverdue = 0;
      const loanCodes: string[] = [];

      b.loans.forEach((loan) => {
        loanCodes.push(loan.loanCode);
        totalOutstanding += loan.totalOutstanding;
        loan.installments.forEach((inst) => {
          const rem = Math.max(0, inst.totalDue - inst.totalPaid);
          const instDue = new Date(inst.dueDate);
          instDue.setHours(0, 0, 0, 0);

          if (!earliestDueDate || instDue < earliestDueDate) {
            earliestDueDate = instDue;
          }

          if (inst.status === "OVERDUE" || instDue < now) {
            totalOverdue += rem;
            const diff = Math.max(1, Math.floor((now.getTime() - instDue.getTime()) / (1000 * 60 * 60 * 24)));
            if (diff > maxDaysOverdue) maxDaysOverdue = diff;
          } else if (inst.status === "DUE_TODAY" || instDue.getTime() === now.getTime()) {
            totalDueToday += rem;
          }
        });
      });

      const effectivePending = totalOverdue > 0 ? totalOverdue : (totalDueToday > 0 ? totalDueToday : totalOutstanding);

      return {
        id: b.id,
        borrowerCode: b.borrowerCode,
        fullName: b.fullName,
        phone: b.phone,
        city: b.city,
        loanCodes,
        primaryLoanCode: loanCodes[0] || "LN-AUTO",
        totalOverdue,
        totalDueToday,
        totalOutstanding,
        effectivePending,
        earliestDueDate,
        daysOverdue: maxDaysOverdue,
      };
    });

    return NextResponse.json({
      success: true,
      borrowers: summaries,
    });
  } catch (error: any) {
    console.error("Fetch borrower live dues error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch borrower dues." },
      { status: 500 }
    );
  }
}
