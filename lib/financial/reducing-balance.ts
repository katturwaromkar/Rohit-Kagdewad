import Decimal from "decimal.js";
import { addDays, addWeeks, addMonths, format } from "date-fns";
import { 
  LoanCalculationInput, 
  LoanCalculationResult, 
  CalculatedInstallment, 
  RepaymentFrequencyType 
} from "./types";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export function calculateReducingBalanceSchedule(input: LoanCalculationInput): LoanCalculationResult {
  const principal = new Decimal(input.principalAmount || 0);
  const annualRate = new Decimal(input.interestRate || 0); // e.g. 18 for 18% p.a.
  const periods = Math.max(1, parseInt(String(input.tenurePeriods), 10));
  const processingFee = new Decimal(input.processingFee || 0);
  const startDate = new Date(input.firstDueDate || input.disbursementDate);

  let periodsPerYear = 12;
  switch (input.repaymentFrequency) {
    case "DAILY":
      periodsPerYear = 365;
      break;
    case "WEEKLY":
      periodsPerYear = 52;
      break;
    case "BI_WEEKLY":
      periodsPerYear = 26;
      break;
    case "MONTHLY":
    default:
      periodsPerYear = 12;
      break;
  }

  const periodRate = annualRate.dividedBy(100).dividedBy(periodsPerYear);

  let emi: Decimal;
  if (periodRate.isZero()) {
    emi = principal.dividedBy(periods).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  } else {
    // EMI = P * r * (1+r)^n / ((1+r)^n - 1)
    const onePlusRToN = new Decimal(1).plus(periodRate).pow(periods);
    const numerator = principal.times(periodRate).times(onePlusRToN);
    const denominator = onePlusRToN.minus(1);
    emi = numerator.dividedBy(denominator).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }

  let remainingPrincipal = principal;
  let totalInterestAccumulated = new Decimal(0);
  const installments: CalculatedInstallment[] = [];

  for (let i = 1; i <= periods; i++) {
    let dueDateObj: Date;
    switch (input.repaymentFrequency) {
      case "DAILY":
        dueDateObj = addDays(startDate, i - 1);
        break;
      case "WEEKLY":
        dueDateObj = addWeeks(startDate, i - 1);
        break;
      case "BI_WEEKLY":
        dueDateObj = addWeeks(startDate, (i - 1) * 2);
        break;
      case "MONTHLY":
      default:
        dueDateObj = addMonths(startDate, i - 1);
        break;
    }

    let iDue: Decimal;
    let pDue: Decimal;

    if (i === periods) {
      // Last installment closes out exact remaining balance
      iDue = remainingPrincipal.times(periodRate).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      pDue = remainingPrincipal;
      remainingPrincipal = new Decimal(0);
    } else {
      iDue = remainingPrincipal.times(periodRate).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      pDue = emi.minus(iDue);
      if (pDue.greaterThan(remainingPrincipal)) {
        pDue = remainingPrincipal;
      }
      remainingPrincipal = remainingPrincipal.minus(pDue);
    }

    const tDue = pDue.plus(iDue);
    totalInterestAccumulated = totalInterestAccumulated.plus(iDue);

    installments.push({
      installmentNumber: i,
      dueDate: format(dueDateObj, "yyyy-MM-dd"),
      principalDue: pDue.toFixed(2),
      interestDue: iDue.toFixed(2),
      feeDue: "0.00",
      totalDue: tDue.toFixed(2),
      remainingPrincipal: Decimal.max(0, remainingPrincipal).toFixed(2),
      status: "UPCOMING",
    });
  }

  const totalAmount = principal.plus(totalInterestAccumulated);

  return {
    principalAmount: principal.toFixed(2),
    totalInterestExpected: totalInterestAccumulated.toFixed(2),
    processingFee: processingFee.toFixed(2),
    totalAmountExpected: totalAmount.toFixed(2),
    installmentAmount: emi.toFixed(2),
    installments,
  };
}
