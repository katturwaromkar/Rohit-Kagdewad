# Official Meta WhatsApp Business Cloud API Integration Guide

This application integrates directly with the **Official Meta WhatsApp Business Cloud API (Graph API v20.0)** to dispatch automated loan payment reminders, overdue notices, and payment receipts.

---

## 1. Meta Developer Account & App Creation

1. Go to [Meta for Developers](https://developers.facebook.com) and log in.
2. Click **My Apps $\rightarrow$ Create App**.
3. Select **Other $\rightarrow$ Business** as the app type.
4. Name your App: `Rohit Lending Notifications`.
5. Under **Add products to your app**, locate **WhatsApp** and click **Set up**.

---

## 2. Obtain WhatsApp Credentials

1. In the left navigation, click **WhatsApp $\rightarrow$ API Setup**.
2. Copy the following credentials into your `.env` or application **Settings**:
   - **Phone Number ID:** (e.g. `104293819283719`) $\rightarrow$ `WHATSAPP_PHONE_NUMBER_ID`
   - **WhatsApp Business Account ID:** (e.g. `204918291028371`) $\rightarrow$ `WHATSAPP_BUSINESS_ACCOUNT_ID`
   - **Temporary Access Token:** (For testing) $\rightarrow$ `WHATSAPP_ACCESS_TOKEN`

---

## 3. Generate Permanent System User Token

For production 24/7 reminder automation without token expiration:
1. Open [Meta Business Manager](https://business.facebook.com/settings).
2. Go to **Users $\rightarrow$ System Users**.
3. Click **Add** and create a system user named `LendingBot` with Admin role.
4. Click **Generate Token**, select your App, and enable permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. Select **Never** for token expiration and copy the permanent access token.

---

## 4. Webhook Configuration for Delivery Tracking

1. Go to **WhatsApp $\rightarrow$ Configuration $\rightarrow$ Webhook**.
2. Set **Callback URL**: `https://your-domain.vercel.app/api/whatsapp/webhook`
3. Set **Verify Token**: `rk_lending_webhook_secret_2026` (must match `WHATSAPP_VERIFY_TOKEN` in `.env`).
4. Click **Verify and Save**.
5. Under **Webhook fields**, click **Manage** and subscribe to:
   - `messages` (delivers sent, delivered, read, and failed status updates directly to your database).

---

## 5. Approved Templates Configuration

In Meta WhatsApp Manager, create templates matching the application keys:
1. `due_today_notice`
2. `overdue_payment_notice`
3. `payment_receipt_notification`
4. `loan_disbursal_confirmation`

---

## 6. Automated Daily Reminders Cron

The reminder processor runs via `/api/cron/reminders?key=YOUR_CRON_SECRET` daily.
- Automatically prevents duplicate notifications to the same borrower on the same calendar day.
- Logs all sent notifications into the `WhatsAppMessage` database table.
