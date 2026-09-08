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
  Smartphone,
  RefreshCw,
} from "lucide-react";
import { VoiceReminderStudio } from "@/components/ai/VoiceReminderStudio";
import { VoiceCallingAgent } from "@/components/ai/VoiceCallingAgent";
import { WhatsAppDispatcher } from "./WhatsAppDispatcher";
import { SMSDispatcher } from "@/components/sms/SMSDispatcher";

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
      name: "Payment Due Today (आज देय हप्ता)",
      desc: "Sent on morning of due date with installment amount and payment details.",
      preview: WHATSAPP_TEMPLATES.DUE_TODAY({
        borrowerName: "Rajesh Sharma",
        loanCode: "LN-2026-001",
        amount: 11000,
        dueDate: new Date(),
      }),
    },
    {
      key: "OVERDUE_NOTICE",
      name: "Overdue Warning Notice (थकबाकी सूचना)",
      desc: "Sent when an installment is overdue with late penalty warning.",
      preview: WHATSAPP_TEMPLATES.OVERDUE_NOTICE({
        borrowerName: "Anil Deshmukh",
        loanCode: "LN-2026-002",
        amount: 18450,
        daysOverdue: 14,
      }),
    },
    {
      key: "PAYMENT_RECEIPT",
      name: "Payment Confirmation Receipt (पावती)",
      desc: "Triggered immediately when payment is recorded by cashier.",
      preview: WHATSAPP_TEMPLATES.PAYMENT_RECEIPT({
        borrowerName: "Rajesh Sharma",
        amount: 11000,
        receiptNumber: "REC-202609-0001",
      }),
    },
    {
      key: "LOAN_DISBURSED",
      name: "Loan Origination Notice (कर्ज वाटप)",
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
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Communications Hub (SMS, AI Voice Calls & WhatsApp)
              </h1>
              <span className="rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 text-xs font-semibold font-mono">
                Marathi AI + SMSLocal
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Automated borrower payment reminders, Marathi AI voice calling, DLT SMS notices, spoken voice notes, and digital receipts.
            </p>
          </div>
        </div>

        {/* Transmission Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4 border-slate-800 bg-slate-900/90">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              Total Messages Dispatched
            </span>
            <div className="text-xl font-bold text-white font-mono mt-1">
              {totalSent}
            </div>
          </Card>

          <Card className="p-4 border-slate-800 bg-slate-900/90">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              Confirmed Delivered
            </span>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
              {totalDelivered}
            </div>
          </Card>

          <Card className="p-4 border-slate-800 bg-slate-900/90">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              Delivery Failures
            </span>
            <div className="text-xl font-bold text-rose-400 font-mono mt-1">
              {totalFailed}
            </div>
          </Card>

          <Card className="p-4 border-slate-800 bg-slate-900/90">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              Idempotency Deduplication
            </span>
            <div className="text-sm font-bold text-blue-400 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              <span>Active Guard</span>
            </div>
          </Card>
        </div>

        {/* AI Automated Marathi Voice Calling Agent */}
        <div className="space-y-3">
          <VoiceCallingAgent preselectedBorrowerId={searchParams?.borrowerId} />
        </div>

        {/* Voice Reminders Studio */}
        <div className="space-y-3">
          <VoiceReminderStudio
            borrowers={borrowers}
            initialBorrowerId={searchParams?.borrowerId}
          />
        </div>

        {/* SMSLocal.in SMS Dispatcher */}
        <div className="space-y-3">
          <SMSDispatcher borrowers={borrowers} />
        </div>

        {/* Standard Dispatcher & Cron Simulation Component */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">
              Standard WhatsApp Text Dispatcher & Scheduled Automation
            </h2>
          </div>
          <WhatsAppDispatcher borrowers={borrowers} />
        </div>

        {/* Standard Templates Preview Grid */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white">
            Approved Message Templates (नमुने)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templatesList.map((tpl) => (
              <Card key={tpl.key} className="border-slate-800 bg-slate-900/90">
                <CardHeader className="py-3 px-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-bold text-white">
                      {tpl.name}
                    </CardTitle>
                    <span className="text-[10px] text-slate-400">{tpl.desc}</span>
                  </div>
                  <span className="font-mono text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                    {tpl.key}
                  </span>
                </CardHeader>
                <CardContent className="p-4">
                  <pre className="text-[11px] font-sans text-slate-300 whitespace-pre-wrap bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
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
            <h2 className="text-sm font-bold text-white">
              Message Transmission & Delivery History
            </h2>
            <Link href="/whatsapp" className="text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              <span>Refresh Log</span>
            </Link>
          </div>

          <Card className="overflow-hidden border-slate-800 bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Template</th>
                    <th className="px-4 py-3">Message Snippet</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Meta Message ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {messages.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {formatDate(m.createdAt, "dd MMM yyyy, hh:mm a")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{m.borrower.fullName}</div>
                        <div className="text-[10px] font-mono text-slate-400">+91 {m.recipientPhone}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-200">
                        {m.templateName}
                      </td>
                      <td className="px-4 py-3 text-slate-300 max-w-xs truncate" title={m.messageBody}>
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
