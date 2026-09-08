import Decimal from "decimal.js";
import { addDays, addWeeks, addMonths, format } from "date-fns";
import { 
  LoanCalculationInput, 
  LoanCalculationResult, 
  CalculatedInstallment, 
  RepaymentFrequencyType 
} from "./types";

// Configure Decimal precision
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export function calculateFlatInterestSchedule(input: LoanCalculationInput): LoanCalculationResult {
  const principal = new Decimal(input.principalAmount || 0);
  const annualRate = new Decimal(input.interestRate || 0); // Annual % e.g. 24
  const periods = Math.max(1, parseInt(String(input.tenurePeriods), 10));
  const processingFee = new Decimal(input.processingFee || 0);
  const startDate = new Date(input.firstDueDate || input.disbursementDate);

  // Determine tenure in fractions of a year
  let tenureInYears: Decimal;
  switch (input.repaymentFrequency) {
    case "DAILY":
      tenureInYears = new Decimal(periods).dividedBy(365);
      break;
    case "WEEKLY":
      tenureInYears = new Decimal(periods).dividedBy(52);
      break;
    case "BI_WEEKLY":
      tenureInYears = new Decimal(periods).dividedBy(26);
      break;
    case "MONTHLY":
    default:
      tenureInYears = new Decimal(periods).dividedBy(12);
      break;
  }

  // Total flat interest = P * (R / 100) * T
  const totalInterest = principal
    .times(annualRate.dividedBy(100))
    .times(tenureInYears)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const totalAmount = principal.plus(totalInterest);

  const basePrincipalPerPeriod = principal.dividedBy(periods).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const baseInterestPerPeriod = totalInterest.dividedBy(periods).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const installments: CalculatedInstallment[] = [];
  let principalSum = new Decimal(0);
  let interestSum = new Decimal(0);
  let runningPrincipal = principal;

  for (let i = 1; i <= periods; i++) {
    // Calculate due date
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

    let pDue: Decimal;
    let iDue: Decimal;

    if (i === periods) {
      // Last installment reconciles exact remaining penny discrepancies
      pDue = principal.minus(principalSum);
      iDue = totalInterest.minus(interestSum);
    } else {
      pDue = basePrincipalPerPeriod;
      iDue = baseInterestPerPeriod;
      principalSum = principalSum.plus(pDue);
      interestSum = interestSum.plus(iDue);
    }

    const tDue = pDue.plus(iDue);
    runningPrincipal = runningPrincipal.minus(pDue);

    installments.push({
      installmentNumber: i,
      dueDate: format(dueDateObj, "yyyy-MM-dd"),
      principalDue: pDue.toFixed(2),
      interestDue: iDue.toFixed(2),
      feeDue: "0.00",
      totalDue: tDue.toFixed(2),
      remainingPrincipal: Decimal.max(0, runningPrincipal).toFixed(2),
      status: "UPCOMING",
    });
  }

  const standardInstallmentAmount = installments.length > 0 ? installments[0].totalDue : "0.00";

  return {
    principalAmount: principal.toFixed(2),
    totalInterestExpected: totalInterest.toFixed(2),
    processingFee: processingFee.toFixed(2),
    totalAmountExpected: totalAmount.toFixed(2),
    installmentAmount: standardInstallmentAmount,
    installments,
  };
}
