import React from "react";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ReportsViewer } from "./ReportsViewer";

interface ReportsPageProps {
  searchParams: {
    reportType?: string;
    startDate?: string;
    endDate?: string;
  };
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const reportType = searchParams.reportType || "COLLECTIONS";
  const startDate = searchParams.startDate || "";
  const endDate = searchParams.endDate || "";

  // Fetch data for reports
  const [payments, loans, borrowers, overdueInstallments] = await Promise.all([
    prisma.payment.findMany({
      where: { status: "SUCCESS" },
      include: {
        borrower: true,
        loan: true,
        collectedBy: true,
      },
      orderBy: { paymentDate: "desc" },
    }),
    prisma.loan.findMany({
      include: {
        borrower: true,
        createdBy: true,
        installments: true,
      },
      orderBy: { disbursementDate: "desc" },
    }),
    prisma.borrower.findMany({
      include: {
        loans: true,
        payments: true,
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.installment.findMany({
      where: { status: "OVERDUE" },
      include: {
        loan: {
          include: {
            borrower: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Financial Reports & Audit Statements (अहवाल व ताळेबंद)
              </h1>
              <span className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-xs font-semibold text-slate-300 font-mono">
                Accounting Ready
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Generate daily collection sheets, monthly P&L interest registers, loan disbursement books, and aging exposure matrices.
            </p>
          </div>
        </div>

        {/* Client Interactive Report Generator with CSV Export */}
        <ReportsViewer
          payments={payments}
          loans={loans}
          borrowers={borrowers}
          overdueInstallments={overdueInstallments}
          initialReportType={reportType}
        />
      </div>
    </AppShell>
  );
}
