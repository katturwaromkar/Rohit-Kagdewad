/**
 * AI Indian Female Voice Reminder Engine
 * Provides natural spoken Marathi & Indian English speech synthesis scripts,
 * voice configurations, and WhatsApp voice note messaging payloads.
 */

import { formatCurrency, formatDate, getAppBaseUrl } from "../utils";

export type VoiceReminderType =
  | "DUE_TODAY"
  | "DUE_IN_2_DAYS"
  | "UPCOMING_2_DAYS"
  | "OVERDUE_ALERT"
  | "OVERDUE"
  | "PAYMENT_RECEIPT"
  | "RECEIPT"
  | "LOAN_WELCOME"
  | "WELCOME"
  | "PHONE_CALL_REMINDER";

export type VoiceTone = "POLITE" | "FORMAL" | "URGENT";

export interface VoiceScriptParams {
  type?: VoiceReminderType;
  borrowerName: string;
  amount: number | string;
  dueDate?: string | Date;
  loanCode?: string;
  receiptNumber?: string;
  receiptDownloadUrl?: string;
  overdueDays?: number;
  daysOverdue?: number;
  businessName?: string;
  businessPhone?: string;
  language?: "mr" | "en";
  tone?: VoiceTone;
  voiceSpeed?: number;
}

export interface VoiceScriptResult {
  script: string;
  spokenText: string;
  language: "mr" | "en";
  langCode: string; // "mr-IN" | "en-IN"
  suggestedRate: number; // 0.85 - 1.0 for natural cadence
  suggestedPitch: number; // 1.05 - 1.2 for natural female tone
  whatsappText: string;
  whatsappTranscript: string;
  durationSec: number;
}

/**
 * Normalizes reminder type to canonical enum
 */
function normalizeReminderType(type: VoiceReminderType): "DUE_TODAY" | "DUE_IN_2_DAYS" | "OVERDUE_ALERT" | "PAYMENT_RECEIPT" | "LOAN_WELCOME" | "PHONE_CALL_REMINDER" {
  if (type === "OVERDUE" || type === "OVERDUE_ALERT") return "OVERDUE_ALERT";
  if (type === "DUE_IN_2_DAYS" || type === "UPCOMING_2_DAYS") return "DUE_IN_2_DAYS";
  if (type === "PAYMENT_RECEIPT" || type === "RECEIPT") return "PAYMENT_RECEIPT";
  if (type === "LOAN_WELCOME" || type === "WELCOME") return "LOAN_WELCOME";
  if (type === "PHONE_CALL_REMINDER") return "PHONE_CALL_REMINDER";
  return "DUE_TODAY";
}

/**
 * Generate natural spoken scripts tailored for Indian female voice synthesis
 */
export function generateVoiceScript(
  typeOrParams: VoiceReminderType | VoiceScriptParams,
  maybeParams?: VoiceScriptParams
): VoiceScriptResult {
  let type: VoiceReminderType;
  let params: VoiceScriptParams;

  if (typeof typeOrParams === "string") {
    type = typeOrParams;
    params = maybeParams || { borrowerName: "Borrower", amount: 0 };
  } else {
    params = typeOrParams;
    type = params.type || "DUE_TODAY";
  }

  const canonicalType = normalizeReminderType(type);
  const lang = params.language || "mr";
  const tone = params.tone || (canonicalType === "OVERDUE_ALERT" ? "URGENT" : "POLITE");
  const business = params.businessName || "रोहित कागदेवाड प्रायव्हेट लेंडिंग";
  const businessEn = params.businessName || "Rohit Kagdewad Private Lending";
  const phone = params.businessPhone || "+91 96652 69105";

  const numAmount = typeof params.amount === "number" ? params.amount : parseFloat(String(params.amount).replace(/[^0-9.]/g, "")) || 0;
  const formattedInr = numAmount.toLocaleString("en-IN");
  const dateStr = params.dueDate ? (typeof params.dueDate === "string" ? params.dueDate : formatDate(params.dueDate, "dd MMMM yyyy")) : "आज";

  const baseUrl = getAppBaseUrl();
  const receiptUrl =
    params.receiptDownloadUrl ||
    (params.receiptNumber ? `${baseUrl}/receipts/${params.receiptNumber}` : undefined);

  if (lang === "mr") {
    // मराठी (Marathi Spoken Scripts)
    let script = "";
    switch (canonicalType) {
      case "DUE_TODAY":
        script = `नमस्कार ${params.borrowerName} जी. मी ${business} यांच्या कार्यालयातून बोलत आहे. आपल्या कर्ज खात्याचा रुपये ${formattedInr} चा हप्ता आज देय आहे. वेळेवर भरणा करून आपले सिबिल रेकॉर्ड उत्तम ठेवावे. भरणा करण्यासाठी संपर्क क्रमांक ${phone}. धन्यवाद!`;
        break;

      case "DUE_IN_2_DAYS":
        script = `नमस्कार ${params.borrowerName} जी. ${business} यांच्याकडून एक पूर्वसूचना. आपल्या कर्ज खात्याचा रुपये ${formattedInr} चा हप्ता येत्या दोन दिवसांत म्हणजेच तारीख ${dateStr} रोजी देय आहे. कृपया आवश्यक रकमेची पूर्वतयारी ठेवावी. धन्यवाद!`;
        break;

      case "OVERDUE_ALERT":
        script = `तात्काळ सूचना: नमस्कार ${params.borrowerName} जी. आपल्या कर्ज खात्याचा रुपये ${formattedInr} चा हप्ता थकला आहे. अतिरिक्त दंड आकारणी आणि कायदेशीर कारवाई टाळण्यासाठी, कृपया आजच ${phone} या क्रमांकावर संपर्क साधून हप्ता जमा करावा.`;
        break;

      case "PHONE_CALL_REMINDER":
        script = `नमस्कार ${params.borrowerName} जी! मी ${business} कार्यालयातून फोन केला आहे. आपल्या कर्ज खात्याचा एकूण देय हप्ता रुपये ${formattedInr} असून तारीख ${dateStr} पर्यंत भरणे बाकी आहे. अधिक माहिती व ऑनलाईन पेमेंटसाठी संपर्क करा: ${phone}. धन्यवाद!`;
        break;

      case "PAYMENT_RECEIPT":
        script = `नमस्कार ${params.borrowerName} जी. आपल्याकडून रुपये ${formattedInr} ची हप्ता रक्कम यशस्वीरीत्या जमा झाली आहे. पावती क्रमांक ${params.receiptNumber || "REC-" + Date.now().toString().slice(-4)}. ${business} सोबत सहकार्य केल्याबद्दल मनःपूर्वक धन्यवाद!`;
        break;

      case "LOAN_WELCOME":
        script = `अभिनंदन ${params.borrowerName} जी! आपले रुपये ${formattedInr} चे कर्ज यशस्वीरीत्या मंजूर होऊन वाटप करण्यात आले आहे. कर्ज क्रमांक ${params.loanCode || ""}. आपल्या आर्थिक प्रगतीसाठी ${business} सदैव आपल्या पाठीशी आहे. धन्यवाद!`;
        break;

      default:
        script = `नमस्कार ${params.borrowerName} जी. ${business} यांच्याकडून हे स्मरणपत्र. अधिक माहितीसाठी संपर्क करा: ${phone}.`;
    }

    const receiptLinkSection = receiptUrl
      ? `\n\n📥 *डिजिटल पावती डाऊनलोड करा (Download Receipt):*\n${receiptUrl}`
      : "";

    const whatsappText = `🎙️ *AI Voice Reminder (व्हाईस मेसेज)*\n\n` +
      `नमस्कार *${params.borrowerName}*,\n\n` +
      `📢 *संदेश:* ${script}` +
      receiptLinkSection +
      `\n\n🏢 *${business}*\n` +
      `📞 संपर्क: ${phone}`;

    return {
      script,
      spokenText: script,
      language: "mr",
      langCode: "mr-IN",
      suggestedRate: tone === "URGENT" ? 0.95 : 0.88,
      suggestedPitch: 1.15,
      whatsappText,
      whatsappTranscript: whatsappText,
      durationSec: Math.round(script.length / 14),
    };
  } else {
    // English (Indian Accent Spoken Scripts)
    let script = "";
    switch (canonicalType) {
      case "DUE_TODAY":
        script = `Hello ${params.borrowerName}. This is an automated payment reminder from ${businessEn}. Your scheduled installment of Rupees ${formattedInr} is due today. Please complete your repayment to keep your loan account in good standing. For assistance, contact ${phone}. Thank you!`;
        break;

      case "DUE_IN_2_DAYS":
        script = `Hello ${params.borrowerName}. This is a gentle reminder from ${businessEn}. Your loan installment of Rupees ${formattedInr} is due in two days on ${dateStr}. Please keep the funds ready for smooth repayment. Thank you!`;
        break;

      case "OVERDUE_ALERT":
        script = `Urgent Payment Notice for ${params.borrowerName}. Your loan installment of Rupees ${formattedInr} is currently overdue. To prevent late penalty charges and negative credit reporting, please clear the dues immediately or contact ${phone} today.`;
        break;

      case "PHONE_CALL_REMINDER":
        script = `Hello ${params.borrowerName}. This is an automated call from ${businessEn}. Your loan pending balance of Rupees ${formattedInr} is due for payment on ${dateStr}. Please make payment or reach us at ${phone}. Thank you!`;
        break;

      case "PAYMENT_RECEIPT":
        script = `Hello ${params.borrowerName}. We have successfully received your payment of Rupees ${formattedInr}. Receipt number is ${params.receiptNumber || "REC-" + Date.now().toString().slice(-4)}. Thank you for your prompt repayment with ${businessEn}!`;
        break;

      case "LOAN_WELCOME":
        script = `Congratulations ${params.borrowerName}! Your loan of Rupees ${formattedInr} has been successfully disbursed under loan code ${params.loanCode || ""}. We thank you for choosing ${businessEn} for your financial needs.`;
        break;

      default:
        script = `Hello ${params.borrowerName}. This is a reminder from ${businessEn}. Please contact ${phone} for your loan details.`;
    }

    const receiptLinkSection = receiptUrl
      ? `\n\n📥 *Download Digital Receipt PDF:*\n${receiptUrl}`
      : "";

    const whatsappText = `🎙️ *AI Voice Reminder (Voice Note)*\n\n` +
      `Hello *${params.borrowerName}*,\n\n` +
      `📢 *Audio Transcript:* "${script}"` +
      receiptLinkSection +
      `\n\n🏢 *${businessEn}*\n` +
      `📞 Contact: ${phone}`;

    return {
      script,
      spokenText: script,
      language: "en",
      langCode: "en-IN",
      suggestedRate: tone === "URGENT" ? 0.98 : 0.9,
      suggestedPitch: 1.12,
      whatsappText,
      whatsappTranscript: whatsappText,
      durationSec: Math.round(script.length / 15),
    };
  }
}

