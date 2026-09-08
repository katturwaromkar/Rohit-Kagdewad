import Decimal from "decimal.js";
import { InstallmentStatusType } from "./types";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export interface ReversalAllocationInput {
  installmentId: string;
  installmentNumber: number;
  principalAmount: number | string | Decimal;
  interestAmount: number | string | Decimal;
  feeAmount: number | string | Decimal;
}

export interface InstallmentStateForReversal {
  id: string;
  installmentNumber: number;
  dueDate: Date | string;
  totalDue: number | string | Decimal;
  principalPaid: number | string | Decimal;
  interestPaid: number | string | Decimal;
  feePaid: number | string | Decimal;
  totalPaid: number | string | Decimal;
}

export interface ReversalResultItem {
  installmentId: string;
  installmentNumber: number;
  newPrincipalPaid: string;
  newInterestPaid: string;
  newFeePaid: string;
  newTotalPaid: string;
  newStatus: InstallmentStatusType;
}

export function calculateReversalRollback(
  allocations: ReversalAllocationInput[],
  installments: InstallmentStateForReversal[],
  currentDate: Date = new Date()
): ReversalResultItem[] {
  const todayStr = currentDate.toISOString().split("T")[0];
  const results: ReversalResultItem[] = [];

  const instMap = new Map<string, InstallmentStateForReversal>();
  for (const inst of installments) {
    instMap.set(inst.id, inst);
  }

  for (const alloc of allocations) {
    const inst = instMap.get(alloc.installmentId);
    if (!inst) continue;

    const pPaid = Decimal.max(0, new Decimal(inst.principalPaid).minus(new Decimal(alloc.principalAmount)));
    const iPaid = Decimal.max(0, new Decimal(inst.interestPaid).minus(new Decimal(alloc.interestAmount)));
    const fPaid = Decimal.max(0, new Decimal(inst.feePaid).minus(new Decimal(alloc.feeAmount)));
    const tPaid = pPaid.plus(iPaid).plus(fPaid);
    const totalDue = new Decimal(inst.totalDue);
    const dueDateStr = new Date(inst.dueDate).toISOString().split("T")[0];

    let newStatus: InstallmentStatusType;
    if (tPaid.greaterThanOrEqualTo(totalDue)) {
      newStatus = "PAID";
    } else if (tPaid.greaterThan(0)) {
      newStatus = "PARTIAL";
    } else if (dueDateStr < todayStr) {
      newStatus = "OVERDUE";
    } else if (dueDateStr === todayStr) {
      newStatus = "DUE_TODAY";
    } else {
      newStatus = "UPCOMING";
    }

    results.push({
      installmentId: inst.id,
      installmentNumber: inst.installmentNumber,
      newPrincipalPaid: pPaid.toFixed(2),
      newInterestPaid: iPaid.toFixed(2),
      newFeePaid: fPaid.toFixed(2),
      newTotalPaid: tPaid.toFixed(2),
      newStatus,
    });
  }

  return results;
}
