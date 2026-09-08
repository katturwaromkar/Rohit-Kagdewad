export * from "./types";
export * from "./flat-interest";
export * from "./reducing-balance";
export * from "./allocator";
export * from "./reversal";

import { LoanCalculationInput, LoanCalculationResult } from "./types";
import { calculateFlatInterestSchedule } from "./flat-interest";
import { calculateReducingBalanceSchedule } from "./reducing-balance";

export function generateLoanSchedule(input: LoanCalculationInput): LoanCalculationResult {
  if (input.interestType === "REDUCING_BALANCE") {
    return calculateReducingBalanceSchedule(input);
  }
  return calculateFlatInterestSchedule(input);
}
