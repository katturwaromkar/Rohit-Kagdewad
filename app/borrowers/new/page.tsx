"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Briefcase,
  Users,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export default function NewBorrowerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    alternatePhone: "",
    email: "",
    dob: "",
    address: "",
    city: "Nanded",
    state: "Maharashtra",
    pincode: "",
    occupation: "",
    businessDetails: "",
    monthlyIncome: "",
    referenceName: "",
    referencePhone: "",
    referenceRelation: "",
    guarantorName: "",
    guarantorPhone: "",
    guarantorAddress: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/borrowers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to create borrower.");
        setIsSubmitting(false);
        return;
      }

      router.push(`/borrowers/${data.borrower.id}`);
      router.refresh();
    } catch (err) {
      setErrorMsg("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center gap-3">
          <Link href="/borrowers">
            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Add New Borrower
            </h1>
            <p className="text-xs text-slate-500">
              Register borrower identity, residential contact, and guarantor details.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3 text-red-800 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Personal & Primary Contact */}
          <Card>
            <CardHeader className="py-4 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm">Personal & Contact Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="e.g. Rajesh Pandurang Sharma"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    required
                    maxLength={10}
                    placeholder="9822114455"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 pl-10 pr-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alternate Mobile (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    name="alternatePhone"
                    maxLength={10}
                    placeholder="9822114456"
                    value={formData.alternatePhone}
                    onChange={handleChange}
                    className="w-full rounded-md border border-slate-300 pl-10 pr-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="borrower@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Residential Address */}
          <Card>
            <CardHeader className="py-4 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm">Residential / Permanent Address</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Street Address / Landmark <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  required
                  placeholder="House No., Street name, Near Landmark"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City / Town
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PIN Code
                </label>
                <input
                  type="text"
                  name="pincode"
                  maxLength={6}
                  placeholder="431601"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Occupation & Income */}
          <Card>
            <CardHeader className="py-4 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm">Occupation & Income</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Occupation / Profession
                </label>
                <input
                  type="text"
                  name="occupation"
                  placeholder="e.g. Kirana Shop Owner / Farmer / Driver"
                  value={formData.occupation}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business / Workplace Name
                </label>
                <input
                  type="text"
                  name="businessDetails"
                  placeholder="e.g. Shri Ganesh Provision Store"
                  value={formData.businessDetails}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Approx. Monthly Income (₹)
                </label>
                <input
                  type="number"
                  name="monthlyIncome"
                  placeholder="e.g. 50000"
                  value={formData.monthlyIncome}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Reference & Guarantor */}
          <Card>
            <CardHeader className="py-4 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm">Reference Person & Guarantor</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference Person Name
                </label>
                <input
                  type="text"
                  name="referenceName"
                  placeholder="e.g. Vikas Pawar"
                  value={formData.referenceName}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference Mobile
                </label>
                <input
                  type="tel"
                  name="referencePhone"
                  maxLength={10}
                  placeholder="9822998877"
                  value={formData.referencePhone}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Relationship
                </label>
                <input
                  type="text"
                  name="referenceRelation"
                  placeholder="Neighbor / Brother / Friend"
                  value={formData.referenceRelation}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guarantor Full Name
                </label>
                <input
                  type="text"
                  name="guarantorName"
                  placeholder="Guarantor Name"
                  value={formData.guarantorName}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guarantor Mobile
                </label>
                <input
                  type="tel"
                  name="guarantorPhone"
                  maxLength={10}
                  placeholder="9822001122"
                  value={formData.guarantorPhone}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guarantor Address
                </label>
                <input
                  type="text"
                  name="guarantorAddress"
                  placeholder="Guarantor Location"
                  value={formData.guarantorAddress}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Internal Remarks / Notes
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Add confidential notes on borrower reliability, repayment behavior..."
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/borrowers">
              <Button type="button" variant="outline" size="md">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              size="md"
              isLoading={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
            >
              Save Borrower
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
