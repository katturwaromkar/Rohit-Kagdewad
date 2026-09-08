# Operator & Business Owner Handbook

## Rohit Kagdewad Lending Management System

This handbook is designed for **Rohit Kagdewad** (Business Owner) and authorized staff members. It provides step-by-step instructions for daily operations, loan origination, cashiering, payment reversals, overdue management, and financial reporting.

---

## 1. System Access & Roles

The system enforces strict **Role-Based Access Control (RBAC)** to ensure data security and prevent unauthorized financial adjustments:

| Role | Permitted Actions | Restricted Actions |
| :--- | :--- | :--- |
| **Business Owner (Rohit)** | Full system control: Loan origination, payment collection, payment reversals, staff management, audit log inspection, business settings, database backup. | None. |
| **Staff** | Borrower management, loan creation, payment collection, receipt generation, view dues/overdue, send WhatsApp reminders. | Cannot reverse payments, edit system settings, or manage staff accounts. |
| **Collection Agent** | View dues queue, view borrower contacts, record payment collections, view assigned overdue accounts. | Cannot approve loans, view overall P&L, perform reversals, or modify staff. |

---

## 2. Daily Opening Routine (Recommended 10-Minute Workflow)

Every business morning, Rohit or the head cashier should follow this 3-step opening procedure:

```
[ Step 1: Check Dashboard KPIs ]
       │
       ▼
[ Step 2: Review Cashier Queue (Dues Today) ]
       │
       ▼
[ Step 3: Trigger / Verify Daily WhatsApp Reminders ]
```

1. **Check Dashboard Overview (`/`):**
   - Check **Total Active Capital**, **Expected Collection Today**, and **Total Overdue**.
   - Review the **Today's Collection vs Target** progress bar.
2. **Review Cashier Queue (`/dues`):**
   - Switch between **Due Today**, **Due Tomorrow**, and **Due This Week** tabs.
   - Click the green **WhatsApp** icon next to any borrower to send an immediate payment reminder or one-click WhatsApp web link.
3. **Check WhatsApp Hub (`/whatsapp`):**
   - Verify automated reminder delivery logs.
   - Send custom quick messages or check borrower message histories.

---

## 3. Borrower Onboarding & KYC

To add a new customer:

1. Click **+ New Borrower** button in the top navigation or sidebar (`/borrowers/new`).
2. Fill in the mandatory fields:
   - **Full Name** & **Mobile Number** (ensure 10-digit Indian phone format, e.g., `9876543210`).
   - **ID Type & Number** (Aadhaar, PAN Card, Voter ID, Driving License).
   - **Residential / Business Address**, City, State, Pincode.
   - **Guarantor / Reference** name, phone number, and relationship.
   - **Credit Limit & Notes** (Internal risk notes).
3. Click **Save Borrower Record**.
4. You are redirected to the **7-Tab Borrower 360° Profile** (`/borrowers/[id]`):
   - **Overview:** Contact details, total borrowed, current outstanding, and repayment health score.
   - **Loans:** History of all active, closed, and pending loans.
   - **Payments:** Chronological payment receipts.
   - **Ledger:** Transparent running balance ledger with running totals.
   - **Documents:** KYC proof files, signed agreements, and collateral photos.
   - **WhatsApp Logs:** Automated and manual communication log with delivery status.
   - **Audit Trail:** Detailed record of every change made to this customer.

---

## 4. Loan Origination & Disbursement

To issue a new loan to an onboarded borrower:

1. Navigate to **Loans** $\rightarrow$ **+ New Loan** (`/loans/new`).
2. Select the **Borrower** from the searchable dropdown.
3. Configure the **Financial Terms**:
   - **Principal Amount (₹):** e.g., `₹1,00,000`.
   - **Interest Method:**
     - `Flat Interest`: Simple interest applied over tenure. Total interest is calculated upfront.
     - `Reducing Balance`: Standard amortizing EMI calculation based on outstanding principal.
   - **Annual Interest Rate (%):** e.g., `18%` or `24%`.
   - **Tenure & Period:** e.g., `12 Months`, `52 Weeks`, or `90 Days`.
   - **Repayment Frequency:** `Monthly`, `Weekly`, `Bi-Weekly`, or `Daily`.
   - **Processing Fee & Penalty Rate:** Optional upfront fees and daily late penalty percentage.
4. **Live Amortization Preview:**
   - The interactive calculator updates in real-time as you adjust parameters.
   - Review Total Interest, Total Repayable, Regular Installment Amount, and full installment-by-installment schedule.
5. Click **Create & Disburse Loan**.
   - The system creates the loan agreement, generates all installment records in the database, writes a disbursement debit entry to the borrower ledger, and logs an immutable audit event.

---

## 5. Payment Collection & Receipt Issuance

When a borrower makes a payment (Cash, UPI, Bank Transfer, Cheque):

1. Click **Collect Payment** (`/payments`) from the sidebar or header quick-action button.
2. Select the **Borrower** and their **Active Loan**.
3. Enter the **Collected Amount (₹)**, **Payment Mode**, **Transaction Reference ID** (e.g., UPI UTR number), and **Collection Date**.
4. **Automatic Waterfall Allocation Preview:**
   - The engine automatically simulates the exact allocation order:
     1. Unpaid Late Penalty Fees
     2. Accrued Interest
     3. Principal Amortization
   - If the payment exceeds the current due installment, excess funds automatically cascade into future principal balances.
5. Click **Record Payment & Generate Receipt**.
6. The system presents the **Payment Receipt Modal** (`/payments/[id]/receipt`):
   - **Thermal POS Print:** Formatted for 58mm / 80mm compact bluetooth thermal printers.
   - **A4 Standard Print:** Formal corporate receipt layout.
   - **WhatsApp Receipt Button:** Directly sends the receipt breakdown and current balance statement to the borrower's WhatsApp phone number.

---

## 6. Payment Reversals (Owner Authorization Only)

If a payment was recorded mistakenly or a cheque bounced:

> [!CAUTION]
> Hard deleting payments is strictly prohibited to preserve ledger integrity. Reversals create compensating ledger entries and restore installment balances.

1. Only **Rohit Kagdewad** (`rohit@lending.com`) can perform reversals.
2. Navigate to **Payments** (`/payments`) or the borrower's **Payments** tab.
3. Locate the payment transaction and click the red **Reverse** button.
4. Enter the mandatory **Reason for Reversal** (e.g., `Cheque bounced - ICICI bank ref #98213`).
5. Click **Confirm Reversal**.
6. The system atomically:
   - Sets the payment status to `REVERSED`.
   - Reverses all installment allocations, restoring unpaid dues.
   - Inserts a balancing debit adjustment in the borrower's running ledger.
   - Logs an audit event with the operator IP, timestamp, and reason.

---

## 7. Overdue Aging & Recovery Management

Navigate to **Overdue Accounts** (`/overdue`):

The system categorizes all delinquent accounts into 5 aging buckets:
- **1 – 7 Days Overdue (Grace / Early Notice):** Send gentle automated WhatsApp reminders.
- **8 – 30 Days Overdue (Moderate Risk):** Staff phone follow-up.
- **31 – 60 Days Overdue (Elevated Risk):** Formal notice & guarantor contact.
- **61 – 90 Days Overdue (High Risk):** Physical visit / recovery warning.
- **90+ Days Overdue (Default / Legal):** Legal demand notice & recovery escalation.

Each row features one-click contact shortcuts (WhatsApp, Phone Call, Profile view).

---

## 8. Financial Reports & Exporting

Navigate to **Reports** (`/reports`) to access 5 core reports:

1. **Collections Register:** Daily/monthly breakdown of all cash, UPI, and bank collections with cashier attribution.
2. **P&L & Interest Statement:** Gross loan interest earned, penalties collected, and net operational revenue.
3. **Disbursement Summary:** Monthly capital deployment trends.
4. **Overdue Aging Report:** Snapshot of portfolio risk across all aging buckets.
5. **Portfolio Performance:** Overall repayment efficiency, NPA ratio, and active portfolio health.

**Export Options:**
- Click **Export CSV / Excel** for external accounting integration in Tally, QuickBooks, or MS Excel.
- Click **Print / PDF Report** for formal board or tax audit presentations.
