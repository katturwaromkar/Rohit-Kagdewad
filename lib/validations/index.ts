import { z } from "zod";

// Indian 10-digit mobile number validator
export const phoneRegex = /^[6-9]\d{9}$/;

export const borrowerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  phone: z.string().regex(phoneRegex, "Must be a valid 10-digit Indian mobile number (e.g. 9876543210)"),
  alternatePhone: z.string().regex(phoneRegex, "Must be a valid 10-digit Indian mobile number").optional().or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  dob: z.string().optional().or(z.literal("")),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().default("Nanded"),
  state: z.string().default("Maharashtra"),
  pincode: z.string().regex(/^\d{6}$/, "Must be a 6-digit PIN code").optional().or(z.literal("")),
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
  borrowerId: z.string().uuid("Invalid borrower ID"),
  principalAmount: z.coerce.number().positive("Principal amount must be greater than 0"),
  interestRate: z.coerce.number().min(0, "Interest rate cannot be negative"), // Annual %
  interestType: z.enum(["FLAT_RATE", "REDUCING_BALANCE"]),
  repaymentFrequency: z.enum(["DAILY", "WEEKLY", "BI_WEEKLY", "MONTHLY"]),
  tenurePeriods: z.coerce.number().int().positive("Tenure periods must be at least 1"),
  disbursementDate: z.string().min(1, "Disbursement date is required"),
  firstDueDate: z.string().min(1, "First due date is required"),
  processingFee: z.coerce.number().min(0).default(0),
  lateFeeRatePerDay: z.coerce.number().min(0).default(0),
  gracePeriodDays: z.coerce.number().int().min(0).default(0),
  notes: z.string().optional().or(z.literal("")),
  collateralInfo: z.string().optional().or(z.literal("")),
});

export const paymentSchema = z.object({
  loanId: z.string().uuid("Invalid loan ID"),
  borrowerId: z.string().uuid("Invalid borrower ID"),
  amount: z.coerce.number().positive("Payment amount must be greater than 0"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMode: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "OTHER"]),
  referenceNumber: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  idempotencyKey: z.string().optional(),
});

export const paymentReversalSchema = z.object({
  paymentId: z.string().uuid("Invalid payment ID"),
  reason: z.string().min(5, "Reversal reason must be at least 5 characters"),
});

export const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
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
