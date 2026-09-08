"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Landmark,
  Percent,
  MessageSquare,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Download,
  Send,
  Loader2,
  Radio,
} from "lucide-react";

interface SettingsFormProps {
  initialSettings: Record<string, string>;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    BUSINESS_NAME: initialSettings["BUSINESS_NAME"] || "Rohit Kagdewad Lending Management",
    OWNER_NAME: initialSettings["OWNER_NAME"] || "Rohit Kagdewad",
    BUSINESS_PHONE: initialSettings["BUSINESS_PHONE"] || "+91 96652 69105",
    BUSINESS_ADDRESS: initialSettings["BUSINESS_ADDRESS"] || "Station Road, Nanded, Maharashtra - 431601",
    TIMEZONE: initialSettings["TIMEZONE"] || "Asia/Kolkata",
    CURRENCY_SYMBOL: initialSettings["CURRENCY_SYMBOL"] || "₹",
    DEFAULT_LATE_FEE_RATE: initialSettings["DEFAULT_LATE_FEE_RATE"] || "0.1",
    DEFAULT_GRACE_PERIOD_DAYS: initialSettings["DEFAULT_GRACE_PERIOD_DAYS"] || "3",
    DEFAULT_INTEREST_RATE: initialSettings["DEFAULT_INTEREST_RATE"] || "24",
    // SMSLocal.in DLT Gateway Settings
    SMS_LOCAL_API_KEY: initialSettings["SMS_LOCAL_API_KEY"] || "",
    SMS_LOCAL_SENDER_ID: initialSettings["SMS_LOCAL_SENDER_ID"] || "RHTKAG",
    SMS_LOCAL_ROUTE: initialSettings["SMS_LOCAL_ROUTE"] || "4",
    SMS_LOCAL_DLT_DUE_TODAY: initialSettings["SMS_LOCAL_DLT_DUE_TODAY"] || "",
    SMS_LOCAL_DLT_OVERDUE: initialSettings["SMS_LOCAL_DLT_OVERDUE"] || "",
    SMS_LOCAL_DLT_RECEIPT: initialSettings["SMS_LOCAL_DLT_RECEIPT"] || "",
    SMS_LOCAL_DLT_WELCOME: initialSettings["SMS_LOCAL_DLT_WELCOME"] || "",
    // WhatsApp Cloud API Settings
    WHATSAPP_PHONE_NUMBER_ID: initialSettings["WHATSAPP_PHONE_NUMBER_ID"] || "",
    WHATSAPP_BUSINESS_ACCOUNT_ID: initialSettings["WHATSAPP_BUSINESS_ACCOUNT_ID"] || "",
    WHATSAPP_ACCESS_TOKEN: initialSettings["WHATSAPP_ACCESS_TOKEN"] || "",
    WHATSAPP_VERIFY_TOKEN: initialSettings["WHATSAPP_VERIFY_TOKEN"] || "rk_lending_webhook_secret_2026",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Test SMS State
  const [testPhone, setTestPhone] = useState("");
  const [isTestingSMS, setIsTestingSMS] = useState(false);
  const [testSMSResult, setTestSMSResult] = useState<{ success?: boolean; message?: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg("");
    setErrorMsg("");
    setIsSaving(true);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        setErrorMsg("Failed to save configuration.");
        setIsSaving(false);
        return;
      }

      setStatusMsg("Business and gateway settings saved successfully.");
      setIsSaving(false);
      router.refresh();
    } catch {
      setErrorMsg("Network error saving settings.");
      setIsSaving(false);
    }
  };

  const handleTestSMS = async () => {
    if (!testPhone) {
      alert("Please enter a 10-digit mobile number for test SMS.");
      return;
    }

    setIsTestingSMS(true);
    setTestSMSResult(null);

    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: testPhone,
          templateType: "DUE_TODAY",
          isTest: true,
          customMessage: `Test SMS from ${formData.BUSINESS_NAME} via SMSLocal.in Gateway. System operational at ${new Date().toLocaleTimeString()}.`,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setTestSMSResult({
          success: true,
          message: data.isMock
            ? "Simulated Test SMS Successful! (Configure live SMS_LOCAL_API_KEY above for live carrier delivery)."
            : "Live Carrier SMS dispatched successfully via SMSLocal.in!",
        });
      } else {
        setTestSMSResult({
          success: false,
          message: data.error || "SMS dispatch failed.",
        });
      }
    } catch {
      setTestSMSResult({
        success: false,
        message: "Network error sending test SMS.",
      });
    } finally {
      setIsTestingSMS(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const [bRes, lRes, pRes] = await Promise.all([
        fetch("/api/borrowers"),
        fetch("/api/loans"),
        fetch("/api/payments"),
      ]);

      const [bData, lData, pData] = await Promise.all([
        bRes.json(),
        lRes.json(),
        pRes.json(),
      ]);

      const backupObj = {
        exportedAt: new Date().toISOString(),
        business: formData.BUSINESS_NAME,
        borrowers: bData.borrowers,
        loans: lData.loans,
        payments: pData.payments,
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `rohit_lending_backup_${new Date().toISOString().split("T")[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch {
      alert("Failed to export backup data.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {statusMsg && (
        <div className="rounded-xl bg-emerald-950/80 border border-emerald-800 p-3.5 text-emerald-300 text-xs flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl bg-rose-950/80 border border-rose-800 p-3.5 text-rose-300 text-xs flex items-center gap-2 shadow-lg">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Section 1: Business Profile */}
      <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
        <CardHeader className="py-3.5 px-4 sm:px-5 bg-slate-950/70 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-blue-400" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-white">
              Enterprise Business Profile (संस्था माहिती)
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-200 font-semibold mb-1.5">
              Business Name (संस्थेचे नाव)
            </label>
            <input
              type="text"
              name="BUSINESS_NAME"
              value={formData.BUSINESS_NAME}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white font-medium placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-200 font-semibold mb-1.5">
              Proprietor / Owner Name (मालकाचे नाव)
            </label>
            <input
              type="text"
              name="OWNER_NAME"
              value={formData.OWNER_NAME}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white font-medium placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-200 font-semibold mb-1.5">
              Official Contact Mobile (पावती व एसएमएससाठी संपर्क)
            </label>
            <input
              type="text"
              name="BUSINESS_PHONE"
              value={formData.BUSINESS_PHONE}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 font-mono text-white font-medium placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-200 font-semibold mb-1.5">
              Business Office Address (पत्ता)
            </label>
            <input
              type="text"
              name="BUSINESS_ADDRESS"
              value={formData.BUSINESS_ADDRESS}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white font-medium placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Default Lending & Late Fee Policies */}
      <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
        <CardHeader className="py-3.5 px-4 sm:px-5 bg-slate-950/70 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-blue-400" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-white">
              Default Lending & Late Fee Rules (व्याज व लेट फी नियम)
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-200 font-semibold mb-1.5">
              Default Annual Interest Rate (% p.a.)
            </label>
            <input
              type="number"
              step="0.1"
              name="DEFAULT_INTEREST_RATE"
              value={formData.DEFAULT_INTEREST_RATE}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 font-mono text-white font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-200 font-semibold mb-1.5">
              Late Fee Daily Accrual (% / day)
            </label>
            <input
              type="number"
              step="0.01"
              name="DEFAULT_LATE_FEE_RATE"
              value={formData.DEFAULT_LATE_FEE_RATE}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 font-mono text-white font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-200 font-semibold mb-1.5">
              Grace Period (Days Before Penalties)
            </label>
            <input
              type="number"
              name="DEFAULT_GRACE_PERIOD_DAYS"
              value={formData.DEFAULT_GRACE_PERIOD_DAYS}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 font-mono text-white font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 3: SMSLocal.in DLT-Compliant SMS Gateway Integration */}
      <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
        <CardHeader className="py-3.5 px-4 sm:px-5 bg-slate-950/70 border-b border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-blue-400" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-white">
                SMSLocal.in DLT SMS Gateway (एसएमएस गेटवे)
              </CardTitle>
            </div>
            <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-blue-950/90 text-blue-400 border border-blue-800 self-start sm:self-auto font-medium">
              https://app.smslocal.in/api/smsapi
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-4 text-xs">
          <p className="text-slate-300">
            Configure your SMSLocal.in Account Key, approved Sender ID / Header, and DLT Template IDs to dispatch instant automated SMS reminders and receipts.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-200 font-semibold mb-1.5">
                Account Key / API Key (की)
              </label>
              <input
                type="password"
                name="SMS_LOCAL_API_KEY"
                placeholder="Enter SMSLocal Account Key"
                value={formData.SMS_LOCAL_API_KEY}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 font-mono text-white font-medium placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-200 font-semibold mb-1.5">
                Approved Sender ID / Header
              </label>
              <input
                type="text"
                name="SMS_LOCAL_SENDER_ID"
                placeholder="e.g. RHTKAG, RKFUND"
                maxLength={6}
                value={formData.SMS_LOCAL_SENDER_ID}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 font-mono text-white font-medium uppercase placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-200 font-semibold mb-1.5">
                Route Code
              </label>
              <input
                type="text"
                name="SMS_LOCAL_ROUTE"
                placeholder="e.g. 4 (Transactional / OTP)"
                value={formData.SMS_LOCAL_ROUTE}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 font-mono text-white font-medium placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* DLT Template IDs */}
          <div className="pt-2 border-t border-slate-800">
            <h4 className="font-semibold text-slate-200 text-xs mb-2.5">
              DLT Approved Template IDs (नमुना आयडी)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-300 text-[11px] font-medium mb-1">
                  Due Today Template ID
                </label>
                <input
                  type="text"
                  name="SMS_LOCAL_DLT_DUE_TODAY"
                  placeholder="e.g. 120716..."
                  value={formData.SMS_LOCAL_DLT_DUE_TODAY}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 font-mono text-white font-medium placeholder:text-slate-500 focus:border-blue-500 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-[11px] font-medium mb-1">
                  Overdue Notice Template ID
                </label>
                <input
                  type="text"
                  name="SMS_LOCAL_DLT_OVERDUE"
                  placeholder="e.g. 120716..."
                  value={formData.SMS_LOCAL_DLT_OVERDUE}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 font-mono text-white font-medium placeholder:text-slate-500 focus:border-blue-500 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-[11px] font-medium mb-1">
                  Payment Receipt Template ID
                </label>
                <input
                  type="text"
                  name="SMS_LOCAL_DLT_RECEIPT"
                  placeholder="e.g. 120716..."
                  value={formData.SMS_LOCAL_DLT_RECEIPT}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 font-mono text-white font-medium placeholder:text-slate-500 focus:border-blue-500 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-[11px] font-medium mb-1">
                  Loan Sanction / Welcome ID
                </label>
                <input
                  type="text"
                  name="SMS_LOCAL_DLT_WELCOME"
                  placeholder="e.g. 120716..."
                  value={formData.SMS_LOCAL_DLT_WELCOME}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 font-mono text-white font-medium placeholder:text-slate-500 focus:border-blue-500 focus:outline-none text-xs"
                />
              </div>
            </div>
          </div>

          {/* Test SMS Dispatcher */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-emerald-400" />
                Test SMS Gateway Connection
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Live Gateway Verification</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                placeholder="Enter 10-digit mobile number for test..."
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs font-mono text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
              <Button
                type="button"
                onClick={handleTestSMS}
                disabled={isTestingSMS}
                size="sm"
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-10 px-4 gap-1.5 shrink-0 shadow-md"
              >
                {isTestingSMS ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Send Test SMS</span>
              </Button>
            </div>

            {testSMSResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 font-medium ${
                  testSMSResult.success
                    ? "bg-emerald-950/80 border border-emerald-800 text-emerald-300"
                    : "bg-rose-950/80 border border-rose-800 text-rose-300"
                }`}
              >
                {testSMSResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                )}
                <span>{testSMSResult.message}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Official WhatsApp Business Cloud API Settings */}
      <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
        <CardHeader className="py-3.5 px-4 sm:px-5 bg-slate-950/70 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-emerald-400" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-white">
              Meta WhatsApp Business Cloud API Integration
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-4 text-xs">
          <p className="text-slate-300">
            Obtain credentials from your Meta for Developers App (WhatsApp Product &rarr; API Setup).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-200 font-semibold mb-1.5">
                WhatsApp Phone Number ID
              </label>
              <input
                type="text"
                name="WHATSAPP_PHONE_NUMBER_ID"
                placeholder="e.g. 104293819283719"
                value={formData.WHATSAPP_PHONE_NUMBER_ID}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 font-mono text-white font-medium placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-200 font-semibold mb-1.5">
                WhatsApp Business Account ID (WABA)
              </label>
              <input
                type="text"
                name="WHATSAPP_BUSINESS_ACCOUNT_ID"
                placeholder="e.g. 204918291028371"
                value={formData.WHATSAPP_BUSINESS_ACCOUNT_ID}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 font-mono text-white font-medium placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-200 font-semibold mb-1.5">
              System User Permanent Access Token
            </label>
            <input
              type="password"
              name="WHATSAPP_ACCESS_TOKEN"
              placeholder="EAAB..."
              value={formData.WHATSAPP_ACCESS_TOKEN}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 font-mono text-white font-medium placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-200 font-semibold mb-1.5">
              Webhook Verification Secret Token
            </label>
            <input
              type="text"
              name="WHATSAPP_VERIFY_TOKEN"
              value={formData.WHATSAPP_VERIFY_TOKEN}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 font-mono text-white font-medium placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Changes Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleExportBackup}
          className="gap-1.5 text-xs text-slate-300 border-slate-700 bg-slate-900 hover:bg-slate-800 font-medium"
        >
          <Download className="h-4 w-4" />
          <span>Export Full Portfolio Backup (JSON)</span>
        </Button>

        <Button
          type="submit"
          size="md"
          isLoading={isSaving}
          className="bg-blue-600 hover:bg-blue-500 text-white min-w-[160px] font-semibold shadow-lg shadow-blue-600/20"
        >
          Save All Settings
        </Button>
      </div>
    </form>
  );
}
