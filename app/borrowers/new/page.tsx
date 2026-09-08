"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { validateIndianPhone, validatePAN, validateAadhaar } from "@/lib/validations";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Briefcase,
  ShieldCheck,
  AlertCircle,
  FileText,
} from "lucide-react";

export default function NewBorrowerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    alternatePhone: "",
    email: "",
    dob: "",
    aadhaarNumber: "",
    panNumber: "",
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
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field error on edit
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleBlur = (field: string) => {
    if (field === "phone") {
      const res = validateIndianPhone(formData.phone);
      if (!res.isValid) setFieldErrors((prev) => ({ ...prev, phone: res.message }));
    }
    if (field === "panNumber" && formData.panNumber) {
      const res = validatePAN(formData.panNumber);
      if (!res.isValid) setFieldErrors((prev) => ({ ...prev, panNumber: res.message }));
    }
    if (field === "aadhaarNumber" && formData.aadhaarNumber) {
      const res = validateAadhaar(formData.aadhaarNumber);
      if (!res.isValid) setFieldErrors((prev) => ({ ...prev, aadhaarNumber: res.message }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Client-side validations
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      errors.fullName = "Full name must be at least 2 characters (नाव किमान २ अक्षरे असावे)";
    }

    const phoneRes = validateIndianPhone(formData.phone);
    if (!phoneRes.isValid) {
      errors.phone = phoneRes.message;
    }

    if (formData.alternatePhone) {
      const altPhoneRes = validateIndianPhone(formData.alternatePhone);
      if (!altPhoneRes.isValid) errors.alternatePhone = altPhoneRes.message;
    }

    if (!formData.address.trim()) {
      errors.address = "Address is required (पत्ता आवश्यक आहे)";
    }

    if (formData.panNumber) {
      const panRes = validatePAN(formData.panNumber);
      if (!panRes.isValid) errors.panNumber = panRes.message;
    }

    if (formData.aadhaarNumber) {
      const aadhRes = validateAadhaar(formData.aadhaarNumber);
      if (!aadhRes.isValid) errors.aadhaarNumber = aadhRes.message;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMsg("Please correct the errors highlighted in red below.");
      return;
    }

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
            <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-slate-700 bg-slate-900 text-slate-300">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Add New Borrower (नवीन कर्जदार नोंदणी)
            </h1>
            <p className="text-xs text-slate-400">
              Register borrower identity, residential contact, KYC proofs, and guarantor records.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-xl bg-red-950/70 border border-red-800/80 p-4 flex items-start gap-3 text-red-300 text-xs shadow-lg animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Personal & Primary Contact */}
          <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader className="py-3.5 px-5 bg-slate-800/40 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-400" />
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-white">
                  Personal & Contact Details (वैयक्तिक तपशील)
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Full Name (पूर्ण नाव) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="e.g. Rajesh Pandurang Sharma"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full rounded-lg border bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
                    fieldErrors.fullName
                      ? "border-red-500 focus:ring-red-500/20"
                      : "border-slate-700 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
                {fieldErrors.fullName && (
                  <p className="mt-1 text-[11px] text-red-400">{fieldErrors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Primary Mobile Number (मोबाईल नंबर) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 font-medium">
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
                    onBlur={() => handleBlur("phone")}
                    className={`w-full rounded-lg border bg-slate-950 pl-12 pr-3.5 py-2.5 text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
                      fieldErrors.phone
                        ? "border-red-500 focus:ring-red-500/20"
                        : "border-slate-700 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="mt-1 text-[11px] text-red-400">{fieldErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Alternate Mobile (पर्यायी मोबाईल)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    name="alternatePhone"
                    maxLength={10}
                    placeholder="9822114456"
                    value={formData.alternatePhone}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-12 pr-3.5 py-2.5 text-sm font-mono text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Email Address (ईमेल पत्ता)
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="borrower@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* KYC IDs: Aadhaar & PAN */}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Aadhaar Card No. (आधार कार्ड नंबर - १२ अंक)
                </label>
                <input
                  type="text"
                  name="aadhaarNumber"
                  maxLength={12}
                  placeholder="e.g. 123456789012"
                  value={formData.aadhaarNumber}
                  onChange={handleChange}
                  onBlur={() => handleBlur("aadhaarNumber")}
                  className={`w-full rounded-lg border bg-slate-950 px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
                    fieldErrors.aadhaarNumber
                      ? "border-red-500 focus:ring-red-500/20"
                      : "border-slate-700 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
                {fieldErrors.aadhaarNumber && (
                  <p className="mt-1 text-[11px] text-red-400">{fieldErrors.aadhaarNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  PAN Card No. (पॅन कार्ड नंबर)
                </label>
                <input
                  type="text"
                  name="panNumber"
                  maxLength={10}
                  placeholder="e.g. ABCDE1234F"
                  value={formData.panNumber}
                  onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                  onBlur={() => handleBlur("panNumber")}
                  className={`w-full rounded-lg border bg-slate-950 px-3.5 py-2.5 text-sm font-mono uppercase text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
                    fieldErrors.panNumber
                      ? "border-red-500 focus:ring-red-500/20"
                      : "border-slate-700 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
                {fieldErrors.panNumber && (
                  <p className="mt-1 text-[11px] text-red-400">{fieldErrors.panNumber}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Residential Address */}
          <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader className="py-3.5 px-5 bg-slate-800/40 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-400" />
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-white">
                  Residential Address (राहण्याचा पत्ता)
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-3">
                <label className="block text-slate-300 font-medium mb-1.5">
                  Street Address / Landmark (घर क्र., रस्ता, खूण) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  required
                  placeholder="Shop No. / House No., Shivaji Nagar Market"
                  value={formData.address}
                  onChange={handleChange}
                  className={`w-full rounded-lg border bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
                    fieldErrors.address
                      ? "border-red-500 focus:ring-red-500/20"
                      : "border-slate-700 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
                {fieldErrors.address && (
                  <p className="mt-1 text-[11px] text-red-400">{fieldErrors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  City / Town (शहर / गाव)
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  State (राज्य)
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  PIN Code (पिन कोड)
                </label>
                <input
                  type="text"
                  name="pincode"
                  maxLength={6}
                  placeholder="431601"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Occupation & Income */}
          <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader className="py-3.5 px-5 bg-slate-800/40 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-400" />
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-white">
                  Occupation & Income (व्यवसाय व उत्पन्न)
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Occupation (व्यवसाय)
                </label>
                <input
                  type="text"
                  name="occupation"
                  placeholder="e.g. Kirana Store Owner / Farmer / Driver"
                  value={formData.occupation}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Business / Firm Name (दुकानाचे / पेढीचे नाव)
                </label>
                <input
                  type="text"
                  name="businessDetails"
                  placeholder="e.g. Shri Ganesh Provision Store"
                  value={formData.businessDetails}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Approx. Monthly Income (मासिक उत्पन्न ₹)
                </label>
                <input
                  type="number"
                  name="monthlyIncome"
                  placeholder="e.g. 50000"
                  value={formData.monthlyIncome}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Reference & Guarantor */}
          <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader className="py-3.5 px-5 bg-slate-800/40 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-white">
                  Reference & Guarantor (ओळख व जामीनदार)
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Reference Person (ओळखीची व्यक्ती)
                </label>
                <input
                  type="text"
                  name="referenceName"
                  placeholder="e.g. Vikas Pawar"
                  value={formData.referenceName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Reference Mobile (ओळख मोबाईल)
                </label>
                <input
                  type="tel"
                  name="referencePhone"
                  maxLength={10}
                  placeholder="9822998877"
                  value={formData.referencePhone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Relationship (नातेसंबंध)
                </label>
                <input
                  type="text"
                  name="referenceRelation"
                  placeholder="Neighbor / Business Friend"
                  value={formData.referenceRelation}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Guarantor Name (जामीनदाराचे नाव)
                </label>
                <input
                  type="text"
                  name="guarantorName"
                  placeholder="Guarantor Full Name"
                  value={formData.guarantorName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Guarantor Mobile (जामीनदार मोबाईल)
                </label>
                <input
                  type="tel"
                  name="guarantorPhone"
                  maxLength={10}
                  placeholder="9822001122"
                  value={formData.guarantorPhone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Guarantor Address (जामीनदार पत्ता)
                </label>
                <input
                  type="text"
                  name="guarantorAddress"
                  placeholder="Guarantor Address"
                  value={formData.guarantorAddress}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-300 font-medium mb-1.5">
                  Internal Remarks / Notes (महत्वाच्या नोंदी)
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Add confidential notes on borrower reliability, gold/property security..."
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/borrowers">
              <Button type="button" variant="outline" size="md" className="h-10 px-4 border-slate-700 text-slate-300">
                Cancel (रद्द करा)
              </Button>
            </Link>
            <Button
              type="submit"
              size="md"
              isLoading={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 px-6 min-w-[150px] shadow-lg shadow-blue-600/20"
            >
              Save Borrower (जतन करा)
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
