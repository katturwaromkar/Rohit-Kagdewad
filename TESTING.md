# Testing & Quality Assurance Guide

## Rohit Kagdewad Lending Management System

This document outlines the testing strategy, financial precision test cases, regression verification steps, and boundary scenarios implemented to guarantee 100% financial correctness and stability.

---

## 1. Automated Financial Test Suite

The core financial math engine is located in `lib/financial/` and is strictly tested against penny-rounding drift, zero balances, compound repayment waterfalls, and payment reversals.

### Running Automated Unit Tests
```bash
npx tsx --test tests/financial.test.ts
```

### Test Coverage Overview

| Test Case | Module | Description | Expected Outcome |
| :--- | :--- | :--- | :--- |
| **TC-01: Flat Interest Schedule** | `flat-interest.ts` | 100,000 principal at 12% flat for 12 months. | Total Interest: ₹12,000.00; Total Repayable: ₹112,000.00; 12 equal EMIs of ₹9,333.33 (final EMI adjusted for zero penny drift). |
| **TC-02: Reducing Balance EMI** | `reducing-balance.ts` | 100,000 principal at 12% reducing for 12 months. | Monthly EMI: ₹8,884.88; Cumulative principal amortized: exactly ₹100,000.00; Ending balance: ₹0.00. |
| **TC-03: Waterfall Payment Allocation** | `allocator.ts` | Single payment of ₹10,000 applied to an installment with ₹200 fee, ₹1,000 interest, and ₹8,000 principal due. | Allocated: ₹200 Fee $\rightarrow$ ₹1,000 Interest $\rightarrow$ ₹8,000 Principal. Installment marked fully paid (`isPaid = true`). |
| **TC-04: Partial Payment Allocation** | `allocator.ts` | Payment of ₹500 against ₹1,000 interest and ₹8,000 principal. | Allocated: ₹0 Fee $\rightarrow$ ₹500 Interest $\rightarrow$ ₹0 Principal. Installment remains active (`isPaid = false`). |
| **TC-05: Multi-Installment Advance Payment** | `allocator.ts` | Payment of ₹20,000 against two ₹9,000 EMIs. | Fully settles Installment #1 (₹9,000), fully settles Installment #2 (₹9,000), and records remaining ₹2,000 as advance credit against Installment #3 principal. |
| **TC-06: Payment Reversal Rollback** | `reversal.ts` | Reversal of a ₹10,000 payment that settled ₹200 fee, ₹1,000 interest, and ₹8,800 principal. | Installment unpaid balances restored: Fee +₹200, Interest +₹1,000, Principal +₹8,800. `isPaid` flipped to `false`. |
| **TC-07: Daily & Weekly Frequency Schedules** | `flat-interest.ts` | Micro-lending schedule: ₹10,000 for 100 days at daily frequency. | Exactly 100 daily installments generated with consistent calendar increments and precise rounding. |

---

## 2. Boundary & Edge Case Scenarios

The engine handles these critical boundary conditions:

### 1. Zero-Penny Drift Adjustment
- In floating point divisions (e.g., $100,000 / 3 = 33,333.3333...$), rounding each installment to 2 decimal places can accumulate a discrepancy of several pennies.
- **Engine Solution:** The engine calculates the total planned sum of regular installments, determines the delta ($\Delta = \text{TotalRepayable} - \sum \text{Installments}_{1..N-1}$), and automatically adjusts the final installment ($N$) to ensure the mathematical sum equals the exact repayable amount to the penny.

### 2. High Interest / Short Tenure Micro-loans
- Daily and weekly loans with high turnaround are bounded by strict date increment algorithms that account for month-end transitions (e.g., Feb 28/29, 30-day vs 31-day months, leap years).

### 3. Overpayment / Early Payoff
- When a borrower pays more than the total remaining loan balance, the excess amount is clearly identified as `excessCredit` and logged in the borrower ledger as unallocated credit rather than being lost.

---

## 3. Manual End-to-End Test Matrix

Before deploying updates to production, execute the following manual test matrix:

### Flow 1: Authentication & Authorization
1. Log in as `rohit@lending.com` $\rightarrow$ verify access to all features, staff management, settings, and reversal buttons.
2. Log in as `staff@lending.com` $\rightarrow$ verify that `/settings`, `/staff`, and payment reversal buttons are disabled/restricted with `403 Forbidden` messages.

### Flow 2: Complete Loan Lifecycle
1. Create a borrower named **Test Borrower** (`/borrowers/new`).
2. Create a loan for ₹50,000 at 18% Flat for 6 months (`/loans/new`).
3. Check the schedule: 6 installments of ₹9,083.33.
4. Record a partial payment of ₹5,000 (`/payments`).
   - Check receipt generated at `/payments/[id]/receipt`.
   - Check borrower ledger at `/borrowers/[id]` $\rightarrow$ verify credit entry of ₹5,000.
5. Record remaining ₹4,083.33 to close Installment #1.
   - Verify Installment #1 status changes to `PAID`.
6. Reverse the payment of ₹5,000 with reason "Test reversal".
   - Verify Installment #1 returns to `PARTIAL`.
   - Verify ledger debit adjustment is recorded.
   - Verify audit log contains entry under `/audit`.

### Flow 3: WhatsApp Automation & Reminders
1. Open the WhatsApp Simulator (`/whatsapp`).
2. Select a borrower and trigger an **Upcoming Due Reminder** template.
3. Verify message is added to the delivery log.
4. Open the interactive WhatsApp link on mobile or browser.

### Flow 4: Financial Reports Export
1. Navigate to `/reports`.
2. Select **Collections Register** $\rightarrow$ click **Export CSV / Excel**.
3. Open the downloaded `.csv` file in Excel and confirm that all columns (Receipt No, Date, Borrower, Loan No, Amount, Mode) match database records.
4. Click **Print / PDF Report** $\rightarrow$ verify the clean, printer-friendly CSS layout without navigation bars or buttons.

---

## 4. Performance & Reliability Checks

- **Database Query Optimization:** All borrower, loan, and payment queries use Prisma indexed relations (`foreign keys` on `borrowerId`, `loanId`, `userId`).
- **Bundle Size:** Next.js production build First Load JS is lightweight ($\approx 114$ kB), guaranteeing snappy 60fps mobile transitions.
- **Strict Decimal Arithmetic:** `decimal.js` is bundled in all server-side API endpoints, eliminating IEEE 754 binary floating-point errors.
