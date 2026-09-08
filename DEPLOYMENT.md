# Vercel & Production Deployment Guide

This guide walks through deploying **Rohit Kagdewad Lending Management System** to **Vercel** with **Supabase PostgreSQL**.

---

## 1. Supabase PostgreSQL Database Setup

1. Log in to [Supabase](https://supabase.com) and create a new project (e.g. `rohit-lending-prod`).
2. Go to **Project Settings $\rightarrow$ Database**.
3. Copy the **Connection String**:
   - **Transaction Pooler (Port 6543):** Use for `DATABASE_URL`
   - **Direct Connection (Port 5432):** Use for `DIRECT_URL` (for migrations)

---

## 2. Vercel Deployment Steps

1. Push your repository to your private GitHub organization/account.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New $\rightarrow$ Project** and select your repository.
3. Configure the **Environment Variables** in Vercel:

| Variable | Description | Example / Note |
| :--- | :--- | :--- |
| `DATABASE_URL` | Supabase Pooler Connection URL | `postgresql://postgres.[ref]:[pwd]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Supabase Direct Connection URL | `postgresql://postgres:[pwd]@db.[ref].supabase.co:5432/postgres` |
| `AUTH_SECRET` | 32+ character random secret | Generate with `openssl rand -base64 32` |
| `JWT_EXPIRATION` | Session validity duration | `7d` |
| `CRON_SECRET` | Secret token to guard `/api/cron/reminders` | `generate-random-secret-key-for-cron` |
| `NEXT_PUBLIC_BUSINESS_NAME` | Business Name | `Rohit Kagdewad Lending Management` |
| `NEXT_PUBLIC_BUSINESS_OWNER` | Owner Name | `Rohit Kagdewad` |
| `NEXT_PUBLIC_BUSINESS_PHONE` | Contact Number | `+91 98765 43210` |
| `NEXT_PUBLIC_BUSINESS_CITY` | Business City | `Nanded, Maharashtra` |
| `NEXT_PUBLIC_CURRENCY_SYMBOL` | Currency Symbol | `₹` |
| `NEXT_PUBLIC_TIMEZONE` | Timezone | `Asia/Kolkata` |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta WhatsApp Phone ID | From Meta Developers Portal |
| `WHATSAPP_BUSINESS_ACCOUNT_ID`| Meta WABA ID | From Meta Developers Portal |
| `WHATSAPP_ACCESS_TOKEN` | Meta System User Token | Permanent token from Meta Business Manager |
| `WHATSAPP_VERIFY_TOKEN` | Custom webhook challenge secret | `rk_lending_webhook_secret_2026` |

4. Click **Deploy**. Vercel will run `prisma generate && next build` automatically.

---

## 3. Post-Deployment Database Initialization

After the first deployment completes, run the seed script to create the default owner account in your production Supabase database:
```bash
# On your local machine with DATABASE_URL set to production:
npx prisma db push
npx tsx scripts/seed.ts
```

---

## 4. Vercel Cron Configuration (`vercel.json`)

To trigger automated daily reminders at 09:00 AM IST (03:30 AM UTC):
```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "30 3 * * *"
    }
  ]
}
```
Vercel will automatically invoke the endpoint daily with the configured Authorization header.
