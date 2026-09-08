# Rohit Kagdewad Lending Management System

A full-stack, fintech-grade lending and borrower repayment management SaaS platform built specifically for **Rohit Kagdewad**.

Designed with clean typography, compact information density, decimal-safe financial calculations, double-entry-style ledgers, official Meta WhatsApp Business Cloud API integration, daily automated reminder crons, and immutable audit logs.

---

## ⚡ Core Features

- **Borrower Relationship Management:** Complete KYC profiles, occupation details, references, guarantor contacts, identity documents, and individual borrower ledgers.
- **Loan Origination Wizard:** Supports both **Flat / Simple Interest** and **Reducing Balance (Amortized EMI)** models across Monthly, Weekly, Bi-Weekly, and Daily schedules with live interactive calculation preview.
- **Payment Collection & Auto-Allocation:** Chronological allocation engine prioritizing Late Fees $\rightarrow$ Interest $\rightarrow$ Principal with support for Cash, UPI, Bank Transfer, and Cheque.
- **Printable & Shareable Receipts:** Generates unique receipt identifiers (`REC-YYYYMM-XXXX`) with A4/80mm Thermal print formats and instant WhatsApp sharing.
- **Today's Dues & Cashier Worklist:** 1-tap Call, 1-tap WhatsApp reminder, and 1-tap payment collection.
- **Overdue Aging Matrix:** Categorizes overdue exposure into 5 distinct aging buckets (1–7d, 8–30d, 31–60d, 61–90d, 90+d).
- **Collection Calendar:** Interactive monthly grid of scheduled installment dues and received collections.
- **Official WhatsApp Business Cloud API:** Meta Graph API v20.0 integration with approved templates (`LOAN_DISBURSED`, `DUE_IN_2_DAYS`, `DUE_TODAY`, `OVERDUE_NOTICE`, `PAYMENT_RECEIPT`, `LOAN_SETTLED`), real-time webhook status delivery tracking, and deduplicated daily reminder cron job (`/api/cron/reminders`).
- **Owner Payment Reversals:** Owner-only payment reversal mechanism with mandatory audit reason, atomic installment balance rollback, and compensating ledger entries.
- **Financial Reports & Analytics:** Daily collections register, P&L interest realization, loan disbursement register, overdue aging matrix, borrower portfolio statements with 1-click CSV/Excel and PDF exports.
- **Immutable Audit Trail:** Comprehensive activity logging of all mutations, disbursements, collections, reversals, and staff logins.
- **Mobile PWA & Responsive Shell:** Touch-friendly layout with drawer, bottom tab navigation bar, and no horizontal overflow.

---

## 🛠️ Technology Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript (Strict Mode), Tailwind CSS, Lucide React
- **Backend:** Next.js Server Actions, Route Handlers, Zod Validation
- **Database & ORM:** PostgreSQL / Supabase, SQLite local support, Prisma ORM
- **Financial Arithmetic:** `decimal.js` for penny-exact financial accuracy
- **Notifications:** Meta WhatsApp Business Cloud API v20.0
- **Security:** Bcrypt, JWT session cookies, RBAC, CSRF/XSS protection, Security HTTP Headers

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Initialize & Seed Database
```bash
npx prisma db push
npx tsx scripts/seed.ts
```

### 4. Run Financial Unit Tests
```bash
npm test
```

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Default Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Owner / Super Admin** | `rohit@lending.com` | `Password@123` | Full governance, payment reversals, audit logs, staff management, settings |
| **Staff / Loan Officer** | `staff@lending.com` | `Password@123` | Borrower management, loan creation, payment collection, dues |

---

## 📚 Complete Documentation Suite

- [SETUP.md](file:///c:/Users/DELL/OneDrive/Desktop/Rohit%20kagdewad/SETUP.md) - Complete local & server setup instructions
- [DATABASE.md](file:///c:/Users/DELL/OneDrive/Desktop/Rohit%20kagdewad/DATABASE.md) - Database schema architecture and entity relationship model
- [DEPLOYMENT.md](file:///c:/Users/DELL/OneDrive/Desktop/Rohit%20kagdewad/DEPLOYMENT.md) - Vercel & Supabase production deployment guide
- [WHATSAPP_SETUP.md](file:///c:/Users/DELL/OneDrive/Desktop/Rohit%20kagdewad/WHATSAPP_SETUP.md) - Meta WhatsApp Business Cloud API & Webhook setup
- [SECURITY.md](file:///c:/Users/DELL/OneDrive/Desktop/Rohit%20kagdewad/SECURITY.md) - Security architecture, RBAC, and data privacy policies
- [BACKUP.md](file:///c:/Users/DELL/OneDrive/Desktop/Rohit%20kagdewad/BACKUP.md) - Disaster recovery, database backups, and data export
- [ADMIN_GUIDE.md](file:///c:/Users/DELL/OneDrive/Desktop/Rohit%20kagdewad/ADMIN_GUIDE.md) - Owner operational handbook for daily lending management
- [TESTING.md](file:///c:/Users/DELL/OneDrive/Desktop/Rohit%20kagdewad/TESTING.md) - Automated test cases and financial calculation verification
