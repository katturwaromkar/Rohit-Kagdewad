# Security Policy & Architecture

Security architecture, data protection policies, and defense-in-depth measures implemented across the Rohit Kagdewad Lending Management platform.

---

## 1. Authentication & Session Governance

- **Password Hashing:** Passwords are never stored in plaintext. They are salted and hashed using `bcrypt` (10 rounds).
- **Session Tokens:** Signed JWT tokens using HMAC-SHA256 with server-side `AUTH_SECRET` (minimum 32 characters).
- **Cookie Flags:** `httpOnly: true`, `sameSite: "lax"`, and `secure: true` in production environments to prevent cross-site scripting (XSS) token exfiltration.
- **Session Expiry:** Automatic session invalidation after 7 days of inactivity.

---

## 2. Role-Based Access Control (RBAC)

The system implements granular authorization boundaries:
- **`OWNER` (Rohit Kagdewad):** Unrestricted administrative control across all records, financial reversals, staff user management, system settings, and audit logs.
- **`STAFF` (Loan Officers):** Permitted to register borrowers, originate loans, record payments, and view daily collection worklists. Prohibited from reversing payments, modifying core business policies, or managing other staff.
- **`COLLECTION_AGENT`:** Restricted strictly to viewing assigned collections and logging payments.

Every API route and server mutation validates role permissions on the server before executing queries.

---

## 3. Financial Transaction Defense & Idempotency

- **Atomic Transactions:** All payment collections, schedule adjustments, and reversals execute inside atomic database transactions (`prisma.$transaction`).
- **Idempotency Keys:** Unique idempotency tokens guard against accidental duplicate submissions caused by network retries or rapid double-clicking.
- **No Hard Deletes:** Financial records (Payments, Loans, Installments) are never hard-deleted. Corrections are strictly handled through compensating reversal transactions with recorded audit reasons.

---

## 4. Input Sanitization & Validation

- **Zod Schema Validation:** Every incoming API payload is validated against strict Zod schemas on the server.
- **Phone Number Validation:** Validates 10-digit Indian mobile format (`/^[6-9]\d{9}$/`).
- **Financial Validation:** Prevents negative principals, invalid interest rates, negative payments, and past due date distortions.

---

## 5. HTTP Security Headers (`next.config.mjs`)

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` (guarantees private lending data is never indexed by search engines)

---

## 6. Immutable Audit Trail

Every mutation writes an immutable record to the `AuditLog` table containing:
- Author User ID & Role
- Action Type (`CREATE`, `UPDATE`, `DELETE`, `REVERSE`, `LOGIN`)
- Entity Type & Entity ID
- JSON snapshot of old state vs new state
- Client IP Address & User Agent
