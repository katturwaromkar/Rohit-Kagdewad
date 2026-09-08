import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp/templates";
import { startOfDay, endOfDay, addDays, isSameDay } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get("authorization");
    const secretFromParam = searchParams.get("key");

    const expectedSecret = process.env.CRON_SECRET || "rk-lending-cron-secure-2026";
    const providedSecret = authHeader?.replace("Bearer ", "") || secretFromParam;

    // Verify secret
    if (providedSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized cron request" }, { status: 401 });
    }

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    let processedCount = 0;
    let sentCount = 0;
    let skippedCount = 0;

    // 1. Mark past unpaid installments as OVERDUE
    await prisma.installment.updateMany({
      where: {
        dueDate: { lt: todayStart },
        status: { in: ["UPCOMING", "DUE_TODAY", "PARTIAL"] },
      },
      data: {
        status: "OVERDUE",
      },
    });

    // 2. Process Due Today Installments
    const dueTodayInsts = await prisma.installment.findMany({
      where: {
        status: { in: ["DUE_TODAY", "UPCOMING", "PARTIAL"] },
        dueDate: { gte: todayStart, lte: todayEnd },
      },
      include: {
        loan: { include: { borrower: true } },
      },
    });

    for (const inst of dueTodayInsts) {
      processedCount++;
      // Idempotency: Skip if reminder already sent today
      if (inst.lastReminderSentAt && isSameDay(new Date(inst.lastReminderSentAt), today)) {
        skippedCount++;
        continue;
      }

      const unpaid = Math.max(0, inst.totalDue - inst.totalPaid);
      if (unpaid <= 0) continue;

      const body = WHATSAPP_TEMPLATES.DUE_TODAY({
        borrowerName: inst.loan.borrower.fullName,
        loanCode: inst.loan.loanCode,
        amount: unpaid,
        dueDate: inst.dueDate,
      });

      await sendWhatsAppMessage({
        borrowerId: inst.loan.borrower.id,
        loanId: inst.loan.id,
        phone: inst.loan.borrower.phone,
        templateName: "DUE_TODAY",
        messageBody: body,
      });

      await prisma.installment.update({
        where: { id: inst.id },
        data: {
          lastReminderSentAt: new Date(),
          status: "DUE_TODAY",
        },
      });

      sentCount++;
    }

    // 3. Process Overdue Installments
    const overdueInsts = await prisma.installment.findMany({
      where: {
        status: "OVERDUE",
      },
      include: {
        loan: { include: { borrower: true } },
      },
    });

    for (const inst of overdueInsts) {
      processedCount++;
      if (inst.lastReminderSentAt && isSameDay(new Date(inst.lastReminderSentAt), today)) {
        skippedCount++;
        continue;
      }

      const unpaid = Math.max(0, inst.totalDue - inst.totalPaid);
      if (unpaid <= 0) continue;

      const body = WHATSAPP_TEMPLATES.OVERDUE_NOTICE({
        borrowerName: inst.loan.borrower.fullName,
        loanCode: inst.loan.loanCode,
        amount: unpaid,
        dueDate: inst.dueDate,
      });

      await sendWhatsAppMessage({
        borrowerId: inst.loan.borrower.id,
        loanId: inst.loan.id,
        phone: inst.loan.borrower.phone,
        templateName: "OVERDUE_NOTICE",
        messageBody: body,
      });

      await prisma.installment.update({
        where: { id: inst.id },
        data: { lastReminderSentAt: new Date() },
      });

      sentCount++;
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        processedCount,
        sentCount,
        skippedCount,
      },
    });
  } catch (error: any) {
    console.error("Reminder cron error:", error);
    return NextResponse.json({ error: "Reminder cron execution failed" }, { status: 500 });
  }
}
