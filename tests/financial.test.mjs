import { test, describe } from "node:test";
import assert from "node:assert/strict";
import Decimal from "decimal.js";

// Load compiled or pure TS/JS logic
import { calculateFlatInterestSchedule } from "../lib/financial/flat-interest.ts";
import { calculateReducingBalanceSchedule } from "../lib/financial/reducing-balance.ts";
import { allocatePayment } from "../lib/financial/allocator.ts";
import { calculateReversalRollback } from "../lib/financial/reversal.ts";

describe("Financial Calculation Engine Tests", () => {
  test("Flat Rate Interest: ₹50,000 at 24% p.a. for 5 months", () => {
    const result = calculateFlatInterestSchedule({
      principalAmount: "50000.00",
      interestRate: "24.00", // 24% p.a. (2% per month)
      interestType: "FLAT_RATE",
      repaymentFrequency: "MONTHLY",
      tenurePeriods: 5,
      disbursementDate: "2026-09-01",
      firstDueDate: "2026-10-01",
      processingFee: "500.00",
    });

    // 50,000 * 0.24 * (5/12) = 5,000 total interest
    assert.equal(result.principalAmount, "50000.00");
    assert.equal(result.totalInterestExpected, "5000.00");
    assert.equal(result.totalAmountExpected, "55000.00");
    assert.equal(result.installments.length, 5);

    // Sum of principal and interest must match exactly with zero penny drift
    let sumPrincipal = new Decimal(0);
    let sumInterest = new Decimal(0);
    for (const inst of result.installments) {
      sumPrincipal = sumPrincipal.plus(new Decimal(inst.principalDue));
      sumInterest = sumInterest.plus(new Decimal(inst.interestDue));
      assert.equal(inst.totalDue, new Decimal(inst.principalDue).plus(new Decimal(inst.interestDue)).toFixed(2));
    }

    assert.equal(sumPrincipal.toFixed(2), "50000.00");
    assert.equal(sumInterest.toFixed(2), "5000.00");
    assert.equal(result.installments[4].remainingPrincipal, "0.00");
  });

  test("Reducing Balance (EMI): ₹100,000 at 18% p.a. for 6 months", () => {
    const result = calculateReducingBalanceSchedule({
      principalAmount: "100000.00",
      interestRate: "18.00",
      interestType: "REDUCING_BALANCE",
      repaymentFrequency: "MONTHLY",
      tenurePeriods: 6,
      disbursementDate: "2026-09-01",
      firstDueDate: "2026-10-01",
    });

    assert.equal(result.principalAmount, "100000.00");
    assert.equal(result.installments.length, 6);

    let sumPrincipal = new Decimal(0);
    let sumInterest = new Decimal(0);
    for (const inst of result.installments) {
      sumPrincipal = sumPrincipal.plus(new Decimal(inst.principalDue));
      sumInterest = sumInterest.plus(new Decimal(inst.interestDue));
    }

    // Exact principal repaid must be ₹100,000.00
    assert.equal(sumPrincipal.toFixed(2), "100000.00");
    assert.equal(sumInterest.toFixed(2), result.totalInterestExpected);
    assert.equal(result.installments[5].remainingPrincipal, "0.00");
  });

  test("Payment Allocation: Fees -> Interest -> Principal hierarchy", () => {
    const installments = [
      {
        id: "inst-1",
        installmentNumber: 1,
        dueDate: "2026-09-01",
        principalDue: "10000.00",
        interestDue: "1000.00",
        feeDue: "200.00",
        totalDue: "11200.00",
        principalPaid: "0.00",
        interestPaid: "0.00",
        feePaid: "0.00",
        totalPaid: "0.00",
        status: "OVERDUE",
      },
      {
        id: "inst-2",
        installmentNumber: 2,
        dueDate: "2026-10-01",
        principalDue: "10000.00",
        interestDue: "1000.00",
        feeDue: "0.00",
        totalDue: "11000.00",
        principalPaid: "0.00",
        interestPaid: "0.00",
        feePaid: "0.00",
        totalPaid: "0.00",
        status: "UPCOMING",
      },
    ];

    // Pay ₹5,000: should cover ₹200 fee, ₹1,000 interest, and ₹3,800 principal of inst-1
    const allocResult = allocatePayment("5000.00", installments, new Date("2026-09-15"));

    assert.equal(allocResult.totalPaid, "5000.00");
    assert.equal(allocResult.totalFeeAllocated, "200.00");
    assert.equal(allocResult.totalInterestAllocated, "1000.00");
    assert.equal(allocResult.totalPrincipalAllocated, "3800.00");
    assert.equal(allocResult.unallocatedExcess, "0.00");

    assert.equal(allocResult.allocations.length, 1);
    assert.equal(allocResult.allocations[0].installmentId, "inst-1");
    assert.equal(allocResult.allocations[0].newStatus, "PARTIAL");
    assert.equal(allocResult.allocations[0].totalAllocated, "5000.00");
  });

  test("Payment Allocation: Full payment covering multiple installments", () => {
    const installments = [
      {
        id: "inst-1",
        installmentNumber: 1,
        dueDate: "2026-08-01",
        principalDue: "5000.00",
        interestDue: "500.00",
        feeDue: "0.00",
        totalDue: "5500.00",
        principalPaid: "0.00",
        interestPaid: "0.00",
        feePaid: "0.00",
        totalPaid: "0.00",
        status: "OVERDUE",
      },
      {
        id: "inst-2",
        installmentNumber: 2,
        dueDate: "2026-09-01",
        principalDue: "5000.00",
        interestDue: "500.00",
        feeDue: "0.00",
        totalDue: "5500.00",
        principalPaid: "0.00",
        interestPaid: "0.00",
        feePaid: "0.00",
        totalPaid: "0.00",
        status: "DUE_TODAY",
      },
    ];

    // Pay ₹11,000: covers both installments completely
    const allocResult = allocatePayment("11000.00", installments, new Date("2026-09-01"));

    assert.equal(allocResult.totalPaid, "11000.00");
    assert.equal(allocResult.totalInterestAllocated, "1000.00");
    assert.equal(allocResult.totalPrincipalAllocated, "10000.00");
    assert.equal(allocResult.allocations.length, 2);
    assert.equal(allocResult.allocations[0].newStatus, "PAID");
    assert.equal(allocResult.allocations[1].newStatus, "PAID");
  });

  test("Payment Reversal: Correct rollback of paid balances and statuses", () => {
    const allocations = [
      {
        installmentId: "inst-1",
        installmentNumber: 1,
        principalAmount: "3800.00",
        interestAmount: "1000.00",
        feeAmount: "200.00",
      },
    ];

    const currentInstallments = [
      {
        id: "inst-1",
        installmentNumber: 1,
        dueDate: "2026-08-01",
        totalDue: "11200.00",
        principalPaid: "3800.00",
        interestPaid: "1000.00",
        feePaid: "200.00",
        totalPaid: "5000.00",
      },
    ];

    const reversalResults = calculateReversalRollback(allocations, currentInstallments, new Date("2026-09-08"));
    assert.equal(reversalResults.length, 1);
    assert.equal(reversalResults[0].newPrincipalPaid, "0.00");
    assert.equal(reversalResults[0].newInterestPaid, "0.00");
    assert.equal(reversalResults[0].newFeePaid, "0.00");
    assert.equal(reversalResults[0].newTotalPaid, "0.00");
    assert.equal(reversalResults[0].newStatus, "OVERDUE");
  });
});
