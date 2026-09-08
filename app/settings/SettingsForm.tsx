"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Landmark,
  Percent,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Database,
  Download,
} from "lucide-react";

interface SettingsFormProps {
  initialSettings: Record<string, string>;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    BUSINESS_NAME: initialSettings["BUSINESS_NAME"] || "Rohit Kagdewad Lending Management",
    OWNER_NAME: initialSettings["OWNER_NAME"] || "Rohit Kagdewad",
    BUSINESS_PHONE: initialSettings["BUSINESS_PHONE"] || "+91 98765 43210",
    BUSINESS_ADDRESS: initialSettings["BUSINESS_ADDRESS"] || "Station Road, Nanded, Maharashtra - 431601",
    TIMEZONE: initialSettings["TIMEZONE"] || "Asia/Kolkata",
    CURRENCY_SYMBOL: initialSettings["CURRENCY_SYMBOL"] || "₹",
    DEFAULT_LATE_FEE_RATE: initialSettings["DEFAULT_LATE_FEE_RATE"] || "0.1",
    DEFAULT_GRACE_PERIOD_DAYS: initialSettings["DEFAULT_GRACE_PERIOD_DAYS"] || "3",
    DEFAULT_INTEREST_RATE: initialSettings["DEFAULT_INTEREST_RATE"] || "24",
    WHATSAPP_PHONE_NUMBER_ID: initialSettings["WHATSAPP_PHONE_NUMBER_ID"] || "",
    WHATSAPP_BUSINESS_ACCOUNT_ID: initialSettings["WHATSAPP_BUSINESS_ACCOUNT_ID"] || "",
    WHATSAPP_ACCESS_TOKEN: initialSettings["WHATSAPP_ACCESS_TOKEN"] || "",
    WHATSAPP_VERIFY_TOKEN: initialSettings["WHATSAPP_VERIFY_TOKEN"] || "rk_lending_webhook_secret_2026",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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

      setStatusMsg("Business settings updated successfully.");
      setIsSaving(false);
      router.refresh();
    } catch {
      setErrorMsg("Network error saving settings.");
      setIsSaving(false);
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
    } catch (err) {
      alert("Failed to export backup data.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {statusMsg && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Section 1: Business Profile */}
      <Card className="bg-white border-slate-200">
        <CardHeader className="py-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              Enterprise Business Profile
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Business Name
            </label>
            <input
              type="text"
              name="BUSINESS_NAME"
              value={formData.BUSINESS_NAME}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 p-2 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Proprietor / Owner Name
            </label>
            <input
              type="text"
              name="OWNER_NAME"
              value={formData.OWNER_NAME}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 p-2 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Official Contact Mobile (for Receipts & SMS)
            </label>
            <input
              type="text"
              name="BUSINESS_PHONE"
              value={formData.BUSINESS_PHONE}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 p-2 font-mono focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Business Office Address
            </label>
            <input
              type="text"
              name="BUSINESS_ADDRESS"
              value={formData.BUSINESS_ADDRESS}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 p-2 focus:border-blue-600 focus:outline-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Default Lending & Late Fee Policies */}
      <Card className="bg-white border-slate-200">
        <CardHeader className="py-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              Default Lending & Late Fee Rules
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Default Annual Interest Rate (% p.a.)
            </label>
            <input
              type="number"
              step="0.1"
              name="DEFAULT_INTEREST_RATE"
              value={formData.DEFAULT_INTEREST_RATE}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 p-2 font-mono focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Late Fee Daily Accrual (% / day)
            </label>
            <input
              type="number"
              step="0.01"
              name="DEFAULT_LATE_FEE_RATE"
              value={formData.DEFAULT_LATE_FEE_RATE}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 p-2 font-mono focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Grace Period (Days Before Penalties)
            </label>
            <input
              type="number"
              name="DEFAULT_GRACE_PERIOD_DAYS"
              value={formData.DEFAULT_GRACE_PERIOD_DAYS}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 p-2 font-mono focus:border-blue-600 focus:outline-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Official WhatsApp Business Cloud API Settings */}
      <Card className="bg-white border-slate-200">
        <CardHeader className="py-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-emerald-600" />
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              Meta WhatsApp Business Cloud API Integration
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4 text-xs">
          <p className="text-slate-500">
            Obtain credentials from your Meta for Developers App (WhatsApp Product &rarr; API Setup).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                WhatsApp Phone Number ID
              </label>
              <input
                type="text"
                name="WHATSAPP_PHONE_NUMBER_ID"
                placeholder="e.g. 104293819283719"
                value={formData.WHATSAPP_PHONE_NUMBER_ID}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-300 p-2 font-mono focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                WhatsApp Business Account ID (WABA)
              </label>
              <input
                type="text"
                name="WHATSAPP_BUSINESS_ACCOUNT_ID"
                placeholder="e.g. 204918291028371"
                value={formData.WHATSAPP_BUSINESS_ACCOUNT_ID}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-300 p-2 font-mono focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              System User Permanent Access Token
            </label>
            <input
              type="password"
              name="WHATSAPP_ACCESS_TOKEN"
              placeholder="EAAB..."
              value={formData.WHATSAPP_ACCESS_TOKEN}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 p-2 font-mono focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Webhook Verification Secret Token
            </label>
            <input
              type="text"
              name="WHATSAPP_VERIFY_TOKEN"
              value={formData.WHATSAPP_VERIFY_TOKEN}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 p-2 font-mono focus:border-blue-600 focus:outline-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Changes Button */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleExportBackup}
          className="gap-1.5 text-xs text-slate-700 border-slate-300"
        >
          <Download className="h-4 w-4" />
          <span>Export Full Portfolio Backup (JSON)</span>
        </Button>

        <Button
          type="submit"
          size="md"
          isLoading={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px] font-semibold shadow-sm"
        >
          Save All Settings
        </Button>
      </div>
    </form>
  );
}
