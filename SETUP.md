# Setup & Installation Guide

Complete instructions for setting up **Rohit Kagdewad Lending Management System** on local machines or dedicated cloud environments.

---

## 1. Prerequisites

- **Node.js:** v18.17.0+ or v20.x / v22.x / v24.x
- **Package Manager:** `npm` (v9+) or `pnpm` / `yarn`
- **Database:** PostgreSQL (v14+) or Supabase PostgreSQL instance (Local development works out of the box with SQLite `dev.db`)

---

## 2. Step-by-Step Installation

### Step 1: Clone or Open Repository
```bash
cd "c:/Users/DELL/OneDrive/Desktop/Rohit kagdewad"
```

### Step 2: Install Node Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create your local `.env` file:
```env
# Database
DATABASE_URL="file:./dev.db"

# JWT Authentication
AUTH_SECRET="your-secure-32-char-random-secret-key"
JWT_EXPIRATION="7d"

# Business Information
NEXT_PUBLIC_BUSINESS_NAME="Rohit Kagdewad Lending Management"
NEXT_PUBLIC_BUSINESS_OWNER="Rohit Kagdewad"
NEXT_PUBLIC_BUSINESS_PHONE="+91 98765 43210"
NEXT_PUBLIC_BUSINESS_CITY="Nanded, Maharashtra"
NEXT_PUBLIC_CURRENCY_SYMBOL="₹"
NEXT_PUBLIC_TIMEZONE="Asia/Kolkata"

# Automated Cron Guard Secret
CRON_SECRET="rk-lending-cron-secure-2026"

# Meta WhatsApp Cloud API (Optional - enter when ready)
WHATSAPP_PHONE_NUMBER_ID=""
WHATSAPP_BUSINESS_ACCOUNT_ID=""
WHATSAPP_ACCESS_TOKEN=""
WHATSAPP_VERIFY_TOKEN="rk_lending_webhook_secret_2026"
```

### Step 4: Synchronize Database Schema
```bash
npx prisma db push
```

### Step 5: Seed Initial Realistic Records
```bash
npx tsx scripts/seed.ts
```

### Step 6: Start Local Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000` and sign in with `rohit@lending.com` / `Password@123`.

---

## 3. Production Build & Test Commands

- **Run Automated Financial Test Suite:**
  ```bash
  npx tsx --test tests/financial.test.ts
  ```
- **Compile Production Next.js Bundle:**
  ```bash
  npm run build
  ```
- **Start Production Server:**
  ```bash
  npm start
  ```
