import Decimal from "decimal.js";
import { PaymentAllocationResult, PaymentAllocationItem, InstallmentStatusType } from "./types";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export interface InstallmentForAllocation {
  id: string;
  installmentNumber: number;
  dueDate: Date | string;
  principalDue: number | string | Decimal;
  interestDue: number | string | Decimal;
  feeDue: number | string | Decimal;
  totalDue: number | string | Decimal;
  principalPaid: number | string | Decimal;
  interestPaid: number | string | Decimal;
  feePaid: number | string | Decimal;
  totalPaid: number | string | Decimal;
  status: string;
}

/**
 * Standard fintech loan payment allocation algorithm:
 * Allocates incoming funds chronologically (oldest installment first).
 * For each installment: Fee -> Interest -> Principal.
 * Excess rolls over to subsequent installments.
 */
export function allocatePayment(
  paymentAmount: number | string | Decimal,
  installments: InstallmentForAllocation[],
  currentDate: Date = new Date()
): PaymentAllocationResult {
  let remainingPayment = new Decimal(paymentAmount);
  const totalReceived = new Decimal(paymentAmount);

  // Sort installments chronologically by installment number
  const sorted = [...installments].sort((a, b) => a.installmentNumber - b.installmentNumber);

  let totalPrincipalAllocated = new Decimal(0);
  let totalInterestAllocated = new Decimal(0);
  let totalFeeAllocated = new Decimal(0);

  const allocationMap = new Map<string, {
    installmentId: string;
    installmentNumber: number;
    principal: Decimal;
    interest: Decimal;
    fee: Decimal;
    newStatus: InstallmentStatusType;
  }>();

  for (const inst of sorted) {
    allocationMap.set(inst.id, {
      installmentId: inst.id,
      installmentNumber: inst.installmentNumber,
      principal: new Decimal(0),
      interest: new Decimal(0),
      fee: new Decimal(0),
      newStatus: inst.status as InstallmentStatusType,
    });
  }

  // Iterate installment by installment chronologically
  for (const inst of sorted) {
    if (remainingPayment.isZero() || remainingPayment.lessThanOrEqualTo(0)) break;

    const record = allocationMap.get(inst.id)!;

    // 1. Pay unpaid fee on this installment
    const feeDue = new Decimal(inst.feeDue || 0);
    const feePaid = new Decimal(inst.feePaid || 0);
    const unpaidFee = Decimal.max(0, feeDue.minus(feePaid));

    if (unpaidFee.greaterThan(0) && remainingPayment.greaterThan(0)) {
      const allocate = Decimal.min(remainingPayment, unpaidFee);
      remainingPayment = remainingPayment.minus(allocate);
      totalFeeAllocated = totalFeeAllocated.plus(allocate);
      record.fee = record.fee.plus(allocate);
    }

    // 2. Pay unpaid interest on this installment
    const interestDue = new Decimal(inst.interestDue || 0);
    const interestPaid = new Decimal(inst.interestPaid || 0);
    const unpaidInterest = Decimal.max(0, interestDue.minus(interestPaid));

    if (unpaidInterest.greaterThan(0) && remainingPayment.greaterThan(0)) {
      const allocate = Decimal.min(remainingPayment, unpaidInterest);
      remainingPayment = remainingPayment.minus(allocate);
      totalInterestAllocated = totalInterestAllocated.plus(allocate);
      record.interest = record.interest.plus(allocate);
    }

    // 3. Pay unpaid principal on this installment
    const principalDue = new Decimal(inst.principalDue || 0);
    const principalPaid = new Decimal(inst.principalPaid || 0);
    const unpaidPrincipal = Decimal.max(0, principalDue.minus(principalPaid));

    if (unpaidPrincipal.greaterThan(0) && remainingPayment.greaterThan(0)) {
      const allocate = Decimal.min(remainingPayment, unpaidPrincipal);
      remainingPayment = remainingPayment.minus(allocate);
      totalPrincipalAllocated = totalPrincipalAllocated.plus(allocate);
      record.principal = record.principal.plus(allocate);
    }
  }

  // Determine updated status for each installment
  const todayStr = currentDate.toISOString().split("T")[0];
  const items: PaymentAllocationItem[] = [];

  for (const inst of sorted) {
    const record = allocationMap.get(inst.id)!;
    const priorTotalPaid = new Decimal(inst.totalPaid || 0);
    const thisAllocatedTotal = record.principal.plus(record.interest).plus(record.fee);
    const newTotalPaid = priorTotalPaid.plus(thisAllocatedTotal);
    const totalDue = new Decimal(inst.totalDue || 0);
    const dueDateStr = new Date(inst.dueDate).toISOString().split("T")[0];

    let newStatus: InstallmentStatusType;
    if (newTotalPaid.greaterThanOrEqualTo(totalDue)) {
      newStatus = "PAID";
    } else if (newTotalPaid.greaterThan(0)) {
      newStatus = "PARTIAL";
    } else if (dueDateStr < todayStr) {
      newStatus = "OVERDUE";
    } else if (dueDateStr === todayStr) {
      newStatus = "DUE_TODAY";
    } else {
      newStatus = "UPCOMING";
    }

    if (thisAllocatedTotal.greaterThan(0)) {
      items.push({
        installmentId: inst.id,
        installmentNumber: inst.installmentNumber,
        principalAllocated: record.principal.toFixed(2),
        interestAllocated: record.interest.toFixed(2),
        feeAllocated: record.fee.toFixed(2),
        totalAllocated: thisAllocatedTotal.toFixed(2),
        newStatus,
      });
    }
  }

  return {
    totalPaid: totalReceived.toFixed(2),
    totalPrincipalAllocated: totalPrincipalAllocated.toFixed(2),
    totalInterestAllocated: totalInterestAllocated.toFixed(2),
    totalFeeAllocated: totalFeeAllocated.toFixed(2),
    unallocatedExcess: remainingPayment.toFixed(2),
    allocations: items,
  };
}
