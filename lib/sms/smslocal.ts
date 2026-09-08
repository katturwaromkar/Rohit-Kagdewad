/**
 * SMSLocal.in DLT-Compliant SMS Gateway Integration
 * Handles transactional, reminder, and receipt SMS dispatch
 * API format: https://app.smslocal.in/api/smsapi?key={KEY}&route={ROUTE}&sender={SENDER}&number={NUMBERS}&sms={MESSAGE}&templateid={TEMPLATE_ID}
 */

import prisma from "@/lib/db";
import { formatCurrency, formatDate } from "../utils";

export interface SendSMSOptions {
  numbers: string | string[];
  message: string;
  templateId?: string;
  senderId?: string;
  route?: string;
  apiKey?: string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  response?: string;
  error?: string;
  isMock?: boolean;
}

export type SMSReminderType =
  | "DUE_TODAY"
  | "DUE_IN_2_DAYS"
  | "OVERDUE"
  | "RECEIPT"
  | "WELCOME"
  | "CUSTOM";

export interface SMSTemplateParams {
  type: SMSReminderType;
  borrowerName: string;
  amount: number | string;
  dueDate?: string | Date;
  loanCode?: string;
  receiptNumber?: string;
  daysOverdue?: number;
  businessName?: string;
  businessPhone?: string;
}

/**
 * Normalizes 10-digit Indian phone numbers
 */
export function normalizeIndianMobile(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return cleaned.slice(2);
  }
  if (cleaned.length > 10) {
    return cleaned.slice(-10);
  }
  return cleaned;
}

/**
 * Generates standard DLT-compliant SMS templates
 */
export function generateSMSText(params: SMSTemplateParams): {
  message: string;
  templateKey: string;
  defaultTemplateId: string;
  charCount: number;
} {
  const business = params.businessName || "Rohit Kagdewad Lending";
  const phone = params.businessPhone || "9665269105";
  const numAmount =
    typeof params.amount === "number"
      ? params.amount
      : parseFloat(String(params.amount).replace(/[^0-9.]/g, "")) || 0;
  const formattedInr = numAmount.toLocaleString("en-IN");
  const dateStr = params.dueDate
    ? typeof params.dueDate === "string"
      ? params.dueDate
      : formatDate(params.dueDate, "dd-MM-yyyy")
    : "today";

  let message = "";
  let defaultTemplateId = "";

  switch (params.type) {
    case "DUE_TODAY":
      message = `Dear ${params.borrowerName}, your loan installment of Rs.${formattedInr} for loan ${params.loanCode || "account"} is due today (${dateStr}). Please pay to avoid late fee. Contact: ${phone}. ${business}`;
      defaultTemplateId = "1207160000000001";
      break;

    case "DUE_IN_2_DAYS":
      message = `Dear ${params.borrowerName}, reminder: your loan installment of Rs.${formattedInr} (${params.loanCode || "loan"}) is due on ${dateStr}. Please keep funds ready. Contact: ${phone}. ${business}`;
      defaultTemplateId = "1207160000000002";
      break;

    case "OVERDUE":
      message = `URGENT: Dear ${params.borrowerName}, your loan ${params.loanCode || ""} installment of Rs.${formattedInr} is OVERDUE by ${params.daysOverdue || 1} days. Clear immediately to prevent penalty. Call ${phone}. ${business}`;
      defaultTemplateId = "1207160000000003";
      break;

    case "RECEIPT":
      message = `Dear ${params.borrowerName}, payment of Rs.${formattedInr} received against loan ${params.loanCode || ""}. Receipt No: ${params.receiptNumber || "REC"}. Thank you. ${business}`;
      defaultTemplateId = "1207160000000004";
      break;

    case "WELCOME":
      message = `Dear ${params.borrowerName}, your loan ${params.loanCode || ""} of Rs.${formattedInr} is approved & disbursed. Thank you for choosing ${business}. Contact: ${phone}`;
      defaultTemplateId = "1207160000000005";
      break;

    default:
      message = `Dear ${params.borrowerName}, update regarding your loan account with ${business}. Amount: Rs.${formattedInr}. For queries contact: ${phone}`;
      defaultTemplateId = "1207160000000000";
  }

  return {
    message,
    templateKey: params.type,
    defaultTemplateId,
    charCount: message.length,
  };
}

/**
 * Fetch SMS settings from database or environment
 */
export async function getSMSSettings() {
  const settings = await prisma.businessSetting.findMany({
    where: {
      key: {
        in: [
          "SMS_LOCAL_API_KEY",
          "SMS_LOCAL_SENDER_ID",
          "SMS_LOCAL_ROUTE",
          "SMS_LOCAL_ENABLED",
          "SMS_LOCAL_DLT_DUE_TODAY",
          "SMS_LOCAL_DLT_OVERDUE",
          "SMS_LOCAL_DLT_RECEIPT",
          "SMS_LOCAL_DLT_WELCOME",
        ],
      },
    },
  });

  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }

  return {
    apiKey: map["SMS_LOCAL_API_KEY"] || process.env.SMS_LOCAL_API_KEY || "",
    senderId: map["SMS_LOCAL_SENDER_ID"] || process.env.SMS_LOCAL_SENDER_ID || "RHTKAG",
    route: map["SMS_LOCAL_ROUTE"] || process.env.SMS_LOCAL_ROUTE || "4",
    enabled: map["SMS_LOCAL_ENABLED"] !== "false",
    dltDueToday: map["SMS_LOCAL_DLT_DUE_TODAY"] || "",
    dltOverdue: map["SMS_LOCAL_DLT_OVERDUE"] || "",
    dltReceipt: map["SMS_LOCAL_DLT_RECEIPT"] || "",
    dltWelcome: map["SMS_LOCAL_DLT_WELCOME"] || "",
  };
}

/**
 * Send SMS via SMSLocal.in Gateway API
 */
export async function sendSMSLocal(options: SendSMSOptions): Promise<SMSResponse> {
  const config = await getSMSSettings();

  const apiKey = options.apiKey || config.apiKey;
  const senderId = options.senderId || config.senderId || "RHTKAG";
  const route = options.route || config.route || "4";
  const templateId = options.templateId || "";

  // Normalize numbers (single or comma-separated)
  const rawList = Array.isArray(options.numbers) ? options.numbers : [options.numbers];
  const cleanedList = rawList
    .map((n) => normalizeIndianMobile(n))
    .filter((n) => n.length === 10);

  if (cleanedList.length === 0) {
    return {
      success: false,
      error: "No valid 10-digit mobile numbers provided.",
    };
  }

  const numberString = cleanedList.join(",");

  // Fallback Mock Mode if API Key is not configured
  if (!apiKey || apiKey.trim() === "" || apiKey === "Account key" || apiKey === "YOUR_API_KEY") {
    console.log(
      `[SMSLocal Gateway - Simulation Mode] SMS dispatched to ${numberString}: "${options.message}" (Template: ${templateId || "N/A"})`
    );
    return {
      success: true,
      messageId: `MOCK-SMS-${Date.now()}`,
      response: `Simulated dispatch to ${numberString}. Configure SMS_LOCAL_API_KEY in Settings to send live carrier SMS.`,
      isMock: true,
    };
  }

  try {
    const queryParams = new URLSearchParams({
      key: apiKey.trim(),
      route: route.trim(),
      sender: senderId.trim(),
      number: numberString,
      sms: options.message,
    });

    if (templateId) {
      queryParams.append("templateid", templateId.trim());
    }

    const apiUrl = `https://app.smslocal.in/api/smsapi?${queryParams.toString()}`;

    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
      },
    });

    const responseText = await res.text();

    if (!res.ok) {
      return {
        success: false,
        error: `Gateway HTTP Error ${res.status}: ${responseText}`,
      };
    }

    // Parse SMSLocal response format
    let isSuccess = false;
    let messageId: string | undefined;

    try {
      const json = JSON.parse(responseText);
      if (json.status === "success" || json.code === "100" || json.response === "success") {
        isSuccess = true;
        messageId = json.messageid || json.msgid || json.data?.messageid;
      } else {
        isSuccess = !json.error;
      }
    } catch {
      // If response is plain text like "SMS-SHOOT-ID/..." or "success"
      if (
        responseText.toLowerCase().includes("success") ||
        responseText.toLowerCase().includes("sent") ||
        responseText.toLowerCase().includes("submitted") ||
        responseText.match(/^[0-9a-zA-Z_-]+$/)
      ) {
        isSuccess = true;
        messageId = responseText.trim();
      }
    }

    return {
      success: isSuccess || res.ok,
      messageId: messageId || `SMS-${Date.now()}`,
      response: responseText,
    };
  } catch (err: any) {
    console.error("SMSLocal API Network Error:", err);
    return {
      success: false,
      error: err.message || "Network error connecting to SMSLocal gateway.",
    };
  }
}
