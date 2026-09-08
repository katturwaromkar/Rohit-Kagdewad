"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { UserPlus, UserCheck, KeyRound, AlertCircle, CheckCircle2 } from "lucide-react";

interface StaffManagerProps {
  initialStaff: any[];
}

export function StaffManager({ initialStaff }: StaffManagerProps) {
  const router = useRouter();
  const [staffList, setStaffList] = useState(initialStaff);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "Password@123",
    role: "STAFF" as "STAFF" | "COLLECTION_AGENT",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    permissions: [
      "borrowers.view",
      "borrowers.create",
      "borrowers.edit",
      "loans.view",
      "payments.view",
      "payments.create",
      "dues.view",
      "whatsapp.send",
    ],
  });

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to add staff member.");
        setIsSubmitting(false);
        return;
      }

      setStaffList([data.user, ...staffList]);
      setIsModalOpen(false);
      setSuccessMsg("Staff account created successfully.");
      setIsSubmitting(false);
      router.refresh();
    } catch (err) {
      setErrorMsg("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {successMsg && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm font-semibold"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add New Staff User</span>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Staff Name</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">System Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Active</th>
                <th className="px-4 py-3">Created On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {staffList.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-semibold text-slate-900">{s.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-800">{s.email}</td>
                  <td className="px-4 py-3 font-mono">{s.phone ? `+91 ${s.phone}` : "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.role === "OWNER" ? "bg-slate-900 text-white" : "bg-blue-100 text-blue-800"}`}>
                      {s.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={s.status} />
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {s.lastLoginAt ? formatDate(s.lastLoginAt, "dd MMM yyyy, hh:mm a") : "Never"}
                  </td>
                  <td className="px-4 py-3 font-mono">{formatDate(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Staff or Collection Agent"
        description="Create credentials and assign access permissions."
      >
        <form onSubmit={handleAddStaff} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="rounded-md bg-red-50 border border-red-200 p-2.5 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Suresh Patil"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-md border border-slate-300 p-2 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="staff@lending.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-md border border-slate-300 p-2 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="9823456789"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-md border border-slate-300 p-2 font-mono focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Initial Password
              </label>
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-md border border-slate-300 p-2 font-mono focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Role Assignment
              </label>
              <select
                value={formData.role}
                onChange={(e: any) => setFormData({ ...formData, role: e.target.value })}
                className="w-full rounded-md border border-slate-300 p-2 font-medium focus:border-blue-600 focus:outline-none"
              >
                <option value="STAFF">Staff / Loan Officer</option>
                <option value="COLLECTION_AGENT">Field Collection Agent</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Create Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
