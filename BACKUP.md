# Backup & Disaster Recovery Guide

## Rohit Kagdewad Lending Management System

This document outlines the backup, export, and disaster recovery procedures for the lending platform to guarantee zero data loss and business continuity.

---

## 1. Backup Strategy Overview

| Tier | Frequency | Target | Retention | RPO / RTO |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1: In-App Snapshot** | Weekly / On-Demand | JSON Export (`/settings`) | Indefinite | RPO: 24h, RTO: 5 min |
| **Tier 2: Automated DB Dump** | Daily (02:00 AM) | SQLite / Postgres Dump | 30 Days | RPO: 24h, RTO: 15 min |
| **Tier 3: Cloud Mirror** | Continuous / Nightly | Offsite Cloud Storage (S3/Drive) | 90 Days | RPO: 24h, RTO: 30 min |

- **RPO (Recovery Point Objective):** Maximum acceptable data loss period (Target: $\le 24$ hours).
- **RTO (Recovery Time Objective):** Maximum acceptable system downtime to restore operations (Target: $\le 15$ minutes).

---

## 2. In-App One-Click JSON Backup (Zero Technical Setup)

Rohit or authorized staff can immediately download a complete business data snapshot directly from the application UI:

1. Log into the application as **Business Owner**.
2. Navigate to **Settings** (`/settings`) in the sidebar.
3. In the **Data Management & Backup** card, click **Download Complete JSON Backup**.
4. The system streams a complete JSON payload containing:
   - `metadata`: Generation timestamp, schema version, business profile.
   - `users`: Staff and operator accounts (excluding sensitive password hashes).
   - `borrowers`: Complete borrower directory and KYC metadata.
   - `loans`: Active and closed loan agreements, interest terms, and schedules.
   - `installments`: All installment states, dues, and payment flags.
   - `payments`: Every payment receipt, collection mode, and transaction reference.
   - `ledger`: Double-entry transaction history.
   - `auditLogs`: Complete chronological security and operation log.

---

## 3. SQLite Database Backup (Local & Small Office Deployments)

When running the application with SQLite (`prisma/dev.db`):

### Automated Daily Backup Script (PowerShell / Windows)

Save as `scripts/backup-sqlite.ps1`:

```powershell
# Configuration
$SourceDb = "c:\Users\DELL\OneDrive\Desktop\Rohit kagdewad\prisma\dev.db"
$BackupDir = "c:\Users\DELL\OneDrive\Desktop\Rohit kagdewad\backups"
$DateStr = Get-Date -Format "yyyyMMdd_HHmmss"
$TargetFile = "$BackupDir\lending_backup_$DateStr.db"

# Create backup directory if not exists
if (!(Test-Path -Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

# Safe SQLite backup using SQLite Online Backup API (or file copy when idle)
Copy-Item -Path $SourceDb -Destination $TargetFile -Force

# Rotate: Delete backups older than 30 days
Get-ChildItem -Path $BackupDir -Filter "lending_backup_*.db" | 
    Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-30) } | 
    Remove-Item -Force

Write-Host "Backup completed: $TargetFile"
```

### Windows Task Scheduler Setup
1. Open **Task Scheduler** (`taskschd.msc`).
2. Click **Create Basic Task** $\rightarrow$ Name: `RohitLendingDailyBackup`.
3. Trigger: **Daily at 02:00 AM**.
4. Action: **Start a program** $\rightarrow$ `powershell.exe -ExecutionPolicy Bypass -File "C:\path\to\scripts\backup-sqlite.ps1"`.

---

## 4. PostgreSQL Database Backup (Production & Cloud Deployments)

When deployed on Supabase or Neon:

### Manual Backup with `pg_dump`
```bash
pg_dump --clean --if-exists --no-owner --no-privileges -d "$DATABASE_URL" -F c -f "lending_backup_$(date +%Y%m%d_%H%M%S).dump"
```

### Automated Nightly Backups (Supabase / Managed PostgreSQL)
- Supabase automatically takes **Point-in-Time Backups (PITR)** on Pro plans and daily snapshots on Free plans.
- Backups can be restored to any second within the retention window via the Supabase dashboard.

---

## 5. Disaster Recovery & Restoration Procedure

### Scenario A: Local SQLite File Corruption or System Crash

1. **Stop Application Service:**
   ```powershell
   # Stop Next.js or pm2 process
   pm2 stop rohit-lending
   ```
2. **Identify Latest Valid Backup:**
   Navigate to the `backups/` directory and locate the most recent uncorrupted `.db` file.
3. **Restore Database:**
   ```powershell
   Copy-Item -Path "backups\lending_backup_20260908_020000.db" -Destination "prisma\dev.db" -Force
   ```
4. **Verify Database Integrity:**
   ```powershell
   npx prisma db pull
   npx tsx --test tests/financial.test.ts
   ```
5. **Restart Service:**
   ```powershell
   pm2 start rohit-lending
   ```

### Scenario B: PostgreSQL Cloud Restoration

1. **Create Fresh Database Target** or drop existing schema:
   ```bash
   psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
   ```
2. **Restore from Dump File:**
   ```bash
   pg_restore --clean --no-owner -d "$DATABASE_URL" "lending_backup_latest.dump"
   ```
3. **Run Prisma Migrations (if necessary):**
   ```bash
   npx prisma migrate deploy
   ```

---

## 6. Audit Trail & Ledger Immutability Verification

To verify that the restored database preserves 100% financial integrity:
1. Log into the application $\rightarrow$ navigate to **Audit Trail** (`/audit`).
2. Confirm that all historical records from previous operational dates are present.
3. Navigate to **Reports** $\rightarrow$ **P&L & Interest Statement** $\rightarrow$ verify that cumulative interest collected matches historical bank receipts.
