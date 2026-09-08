import { z } from "zod";

// Strict Indian Regex Patterns
export const phoneRegex = /^[6-9]\d{9}$/;
export const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const aadhaarRegex = /^\d{12}$/;
export const pincodeRegex = /^\d{6}$/;

/**
 * Real-time KYC and format validation helper functions
 */
export function validateIndianPhone(phone: string): { isValid: boolean; message: string } {
  const cleaned = phone.replace(/\D/g, "");
  if (!cleaned) return { isValid: false, message: "Mobile number is required (मोबाईल नंबर आवश्यक आहे)" };
  if (cleaned.length !== 10) return { isValid: false, message: "Must be exactly 10 digits (१० अंकी नंबर असावा)" };
  if (!phoneRegex.test(cleaned)) return { isValid: false, message: "Must start with 6, 7, 8, or 9 (६, ७, ८ किंवा ९ ने सुरू व्हावा)" };
  return { isValid: true, message: "" };
}

export function validatePAN(pan: string): { isValid: boolean; message: string } {
  if (!pan) return { isValid: true, message: "" }; // Optional
  const upper = pan.trim().toUpperCase();
  if (!panRegex.test(upper)) {
    return { isValid: false, message: "Invalid PAN format (e.g. ABCDE1234F) (अवैध पॅन फॉरमॅट)" };
  }
  return { isValid: true, message: "" };
}

export function validateAadhaar(aadhaar: string): { isValid: boolean; message: string } {
  if (!aadhaar) return { isValid: true, message: "" }; // Optional
  const cleaned = aadhaar.replace(/\D/g, "");
  if (cleaned.length !== 12) {
    return { isValid: false, message: "Aadhaar must be exactly 12 digits (आधार १२ अंकी असावा)" };
  }
  return { isValid: true, message: "" };
}

// Zod Schemas for API routes and form submissions
export const borrowerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters (नाव किमान २ अक्षरे असावे)").max(100),
  phone: z.string().regex(phoneRegex, "Must be a valid 10-digit Indian mobile number (e.g. 9876543210)"),
  alternatePhone: z.string().regex(phoneRegex, "Must be a valid 10-digit Indian mobile number").optional().or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  dob: z.string().optional().or(z.literal("")),
  address: z.string().min(3, "Address is required (पत्ता आवश्यक आहे)"),
  city: z.string().default("Nanded"),
  state: z.string().default("Maharashtra"),
  pincode: z.string().regex(pincodeRegex, "Must be a 6-digit PIN code").optional().or(z.literal("")),
  occupation: z.string().optional().or(z.literal("")),
  businessDetails: z.string().optional().or(z.literal("")),
  monthlyIncome: z.coerce.number().min(0, "Monthly income cannot be negative").optional(),
  referenceName: z.string().optional().or(z.literal("")),
  referencePhone: z.string().optional().or(z.literal("")),
  referenceRelation: z.string().optional().or(z.literal("")),
  guarantorName: z.string().optional().or(z.literal("")),
  guarantorPhone: z.string().optional().or(z.literal("")),
  guarantorAddress: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE", "OVERDUE", "BLACKLISTED"]).default("ACTIVE"),
  notes: z.string().optional().or(z.literal("")),
});

export const loanSchema = z.object({
  borrowerId: z.string().min(1, "Please select a borrower"),
  principalAmount: z.coerce.number().positive("Principal amount must be greater than 0 (मुद्दल रक्कम ० पेक्षा जास्त असावी)"),
  interestRate: z.coerce.number().min(0, "Interest rate cannot be negative (व्याजदर ऋण असू शकत नाही)"),
  interestType: z.enum(["FLAT_RATE", "REDUCING_BALANCE"]),
  repaymentFrequency: z.enum(["DAILY", "WEEKLY", "BI_WEEKLY", "MONTHLY"]),
  tenurePeriods: z.coerce.number().int().positive("Tenure must be at least 1 installment (किमान १ हप्ता आवश्यक)"),
  disbursementDate: z.string().min(1, "Disbursement date is required"),
  firstDueDate: z.string().min(1, "First due date is required"),
  processingFee: z.coerce.number().min(0).default(0),
  lateFeeRatePerDay: z.coerce.number().min(0).default(0),
  gracePeriodDays: z.coerce.number().int().min(0).default(0),
  notes: z.string().optional().or(z.literal("")),
  collateralInfo: z.string().optional().or(z.literal("")),
});

export const paymentSchema = z.object({
  loanId: z.string().min(1, "Please select a loan"),
  borrowerId: z.string().min(1, "Please select a borrower"),
  amount: z.coerce.number().positive("Payment amount must be greater than 0 (जमा रक्कम ० पेक्षा जास्त असावी)"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMode: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "OTHER"]),
  referenceNumber: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  idempotencyKey: z.string().optional(),
});

export const paymentReversalSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
  reason: z.string().min(5, "Reversal reason must be at least 5 characters (रद्द करण्याचे कारण किमान ५ अक्षरे असावे)"),
});

export const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum(["OWNER", "STAFF", "COLLECTION_AGENT"]),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).default("ACTIVE"),
  permissions: z.array(z.string()).default([]),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
