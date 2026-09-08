import React from "react";
import Link from "next/link";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp/templates";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  ShieldCheck,
  Phone,
  RefreshCw,
} from "lucide-react";
import { VoiceReminderStudio } from "@/components/ai/VoiceReminderStudio";
import { WhatsAppDispatcher } from "./WhatsAppDispatcher";
import { Mic, Sparkles } from "lucide-react";

export default async function WhatsAppCenterPage({
  searchParams,
}: {
  searchParams?: { borrowerId?: string; tab?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [messages, rawBorrowers, totalSent, totalDelivered, totalFailed] = await Promise.all([
    prisma.whatsAppMessage.findMany({
      include: {
        borrower: true,
        loan: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.borrower.findMany({
      where: { status: { in: ["ACTIVE", "OVERDUE"] } },
      include: {
        loans: {
          where: { status: "ACTIVE" },
          include: {
            installments: {
              where: { status: { in: ["PENDING", "OVERDUE"] } },
              orderBy: { dueDate: "asc" },
              take: 1,
            },
          },
          take: 1,
        },
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.whatsAppMessage.count({ where: { status: { in: ["SENT", "DELIVERED", "READ"] } } }),
    prisma.whatsAppMessage.count({ where: { status: { in: ["DELIVERED", "READ"] } } }),
    prisma.whatsAppMessage.count({ where: { status: "FAILED" } }),
  ]);

  const borrowers = rawBorrowers.map((b) => {
    const activeLoan = b.loans[0];
    const nextInstallment = activeLoan?.installments[0];
    return {
      id: b.id,
      fullName: b.fullName,
      phone: b.phone,
      borrowerCode: b.borrowerCode,
      activeLoanCode: activeLoan?.loanCode,
      dueAmount: nextInstallment ? Number(nextInstallment.totalDue) : 0,
      dueDate: nextInstallment ? nextInstallment.dueDate.toISOString() : undefined,
    };
  });

  const templatesList = [
    {
      key: "DUE_TODAY",
      name: "Payment Due Today",
      desc: "Sent on morning of due date with amount and payment details.",
      preview: WHATSAPP_TEMPLATES.DUE_TODAY({
        borrowerName: "Rajesh Sharma",
        loanCode: "LN-2026-001",
        amount: 11000,
        dueDate: new Date(),
      }),
    },
    {
      key: "OVERDUE_NOTICE",
      name: "Overdue Warning Notice",
      desc: "Sent when an installment is overdue with late fee warning.",
      preview: WHATSAPP_TEMPLATES.OVERDUE_NOTICE({
        borrowerName: "Anil Deshmukh",
        loanCode: "LN-2026-002",
        amount: 18450,
        daysOverdue: 14,
      }),
    },
    {
      key: "PAYMENT_RECEIPT",
      name: "Payment Confirmation Receipt",
      desc: "Triggered immediately when payment is recorded by cashier.",
      preview: WHATSAPP_TEMPLATES.PAYMENT_RECEIPT({
        borrowerName: "Rajesh Sharma",
        amount: 11000,
        receiptNumber: "REC-202609-0001",
      }),
    },
    {
      key: "LOAN_DISBURSED",
      name: "Loan Origination Notice",
      desc: "Sent when a new loan is approved and disbursed.",
      preview: WHATSAPP_TEMPLATES.LOAN_DISBURSED({
        borrowerName: "Pooja Shinde",
        loanCode: "LN-2026-003",
        amount: 30000,
        dueDate: new Date(),
      }),
    },
  ];

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                WhatsApp Business Cloud API Command Center
              </h1>
              <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold">
                Official Meta Graph API v20.0
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Automate borrower payment reminders, overdue notices, and instant digital receipts.
            </p>
          </div>
        </div>

        {/* Transmission Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3.5 bg-white border-slate-200">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              Total Messages Dispatched
            </span>
            <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
              {totalSent}
            </div>
          </Card>

          <Card className="p-3.5 bg-white border-slate-200">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              Confirmed Delivered
            </span>
            <div className="text-lg font-bold text-emerald-600 font-mono mt-0.5">
              {totalDelivered}
            </div>
          </Card>

          <Card className="p-3.5 bg-white border-slate-200">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              Delivery Failures
            </span>
            <div className="text-lg font-bold text-slate-700 font-mono mt-0.5">
              {totalFailed}
            </div>
          </Card>

          <Card className="p-3.5 bg-white border-slate-200">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              Idempotency Deduplication
            </span>
            <div className="text-sm font-bold text-blue-600 mt-0.5 flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" />
              <span>Active Guard</span>
            </div>
          </Card>
        </div>

        {/* AI Voice Reminders Studio (Indian Female Voice) */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="p-1 rounded-lg bg-pink-500/10 text-pink-500">
                  <Mic className="h-4 w-4" />
                </span>
                <span>AI Voice Reminder Studio (भारतीय स्त्री आवाज)</span>
                <span className="text-[10px] font-semibold bg-gradient-to-r from-pink-500 to-rose-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> New AI Feature
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Generate spoken voice reminders in natural Indian Female tone (मराठी / Indian English) with live speech preview and 1-tap WhatsApp dispatch.
              </p>
            </div>
          </div>

          <VoiceReminderStudio
            borrowers={borrowers}
            initialBorrowerId={searchParams?.borrowerId}
          />
        </div>

        {/* Interactive Dispatcher & Cron Simulation Client Component */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Standard WhatsApp Text Dispatcher & Scheduled Automation
          </h2>
          <WhatsAppDispatcher borrowers={borrowers} />
        </div>

        {/* Standard Templates Preview Grid */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Approved Message Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templatesList.map((tpl) => (
              <Card key={tpl.key} className="bg-white border-slate-200">
                <CardHeader className="py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-semibold text-slate-800">
                      {tpl.name}
                    </CardTitle>
                    <span className="text-[10px] text-slate-400">{tpl.desc}</span>
                  </div>
                  <span className="font-mono text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                    {tpl.key}
                  </span>
                </CardHeader>
                <CardContent className="p-3.5">
                  <pre className="text-[11px] font-sans text-slate-700 whitespace-pre-wrap bg-emerald-50/40 p-3 rounded-lg border border-emerald-200/60 leading-relaxed">
                    {tpl.preview}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Message Delivery Log */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Message Transmission & Delivery History
            </h2>
            <Link href="/whatsapp" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              <span>Refresh Log</span>
            </Link>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Template</th>
                    <th className="px-4 py-3">Message Snippet</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Meta Message ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {messages.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono">
                        {formatDate(m.createdAt, "dd MMM yyyy, hh:mm a")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{m.borrower.fullName}</div>
                        <div className="text-[10px] font-mono text-slate-400">+91 {m.recipientPhone}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {m.templateName}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={m.messageBody}>
                        {m.messageBody}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge status={m.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-400 truncate max-w-[140px]">
                        {m.providerMessageId || "-"}
                      </td>
                    </tr>
                  ))}
                  {messages.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No WhatsApp notifications sent yet. Use the dispatcher above to send your first message.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
