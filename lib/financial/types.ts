export type InterestCalculationMethod = "FLAT_RATE" | "REDUCING_BALANCE";

export type RepaymentFrequencyType = "DAILY" | "WEEKLY" | "BI_WEEKLY" | "MONTHLY";

export type InstallmentStatusType = 
  | "UPCOMING" 
  | "DUE_TODAY" 
  | "PARTIAL" 
  | "PAID" 
  | "OVERDUE" 
  | "WAIVED";

export interface LoanCalculationInput {
  principalAmount: number | string;
  interestRate: number | string; // Annual percentage (e.g. 24 for 24% p.a., or 2% per month = 24% p.a.)
  interestType: InterestCalculationMethod;
  repaymentFrequency: RepaymentFrequencyType;
  tenurePeriods: number; // e.g. 6 months, 12 weeks, 30 days
  disbursementDate: Date | string;
  firstDueDate: Date | string;
  processingFee?: number | string;
  lateFeeRatePerDay?: number | string; // % per day or flat
  gracePeriodDays?: number;
}

export interface CalculatedInstallment {
  installmentNumber: number;
  dueDate: string; // ISO string (YYYY-MM-DD)
  principalDue: string; // Decimal string representation e.g. "1000.00"
  interestDue: string;
  feeDue: string;
  totalDue: string;
  remainingPrincipal: string;
  status: InstallmentStatusType;
}

export interface LoanCalculationResult {
  principalAmount: string;
  totalInterestExpected: string;
  processingFee: string;
  totalAmountExpected: string;
  installmentAmount: string; // Standard per-installment amount
  installments: CalculatedInstallment[];
}

export interface PaymentAllocationItem {
  installmentId: string;
  installmentNumber: number;
  principalAllocated: string;
  interestAllocated: string;
  feeAllocated: string;
  totalAllocated: string;
  newStatus: InstallmentStatusType;
}

export interface PaymentAllocationResult {
  totalPaid: string;
  totalPrincipalAllocated: string;
  totalInterestAllocated: string;
  totalFeeAllocated: string;
  unallocatedExcess: string;
  allocations: PaymentAllocationItem[];
}
