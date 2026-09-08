/**
 * Marathi (मराठी) & English Bilingual Localization Dictionary & Message Generator
 * Rohit Kagdewad Lending Management System
 */

export const marathiTerms = {
  appName: "रोहित कागदेवाड कर्ज व्यवस्थापन",
  dashboard: "डॅशबोर्ड (मुख्य पृष्ठ)",
  borrowers: "कर्जदार यादी",
  newBorrower: "+ नवीन कर्जदार",
  loans: "कर्ज खाती",
  newLoan: "+ नवीन कर्ज",
  payments: "हप्ते जमा / पावती",
  duesToday: "आज देय हप्ते",
  overdue: "थकबाकी यादी",
  reports: "आर्थिक अहवाल",
  settings: "सेटिंग्ज",
  whatsapp: "व्हॉट्सॲप मेसेजिंग",
  
  // Financial terms
  principal: "मुद्दल",
  interest: "व्याज",
  totalDue: "एकूण देय",
  totalPaid: "एकूण जमा",
  outstanding: "बाकी रक्कम",
  penalty: "दंड आकारणी",
  receipt: "पावती",
  installment: "हप्ता",
  dueDate: "देय तारीख",
  flatInterest: "सरळ व्याज (Flat Rate)",
  reducingInterest: "घटती शिल्लक व्याज (Reducing Balance)",
  
  // Modes
  cash: "रोख (Cash)",
  upi: "युपीआय (UPI)",
  bankTransfer: "बँक ट्रान्सफर (NEFT/IMPS)",
  cheque: "धनादेश (Cheque)",
};

/**
 * Bilingual WhatsApp & SMS Message Formatter
 */
export interface MessageTemplateData {
  borrowerName: string;
  amount: string;
  dueDate?: string;
  receiptNumber?: string;
  loanCode?: string;
  balanceRemaining?: string;
  penaltyAmount?: string;
  businessName?: string;
  businessPhone?: string;
  receiptDownloadUrl?: string;
}

export const bilingualTemplates = {
  /**
   * 1. Payment Receipt (पावती)
   */
  receipt: (data: MessageTemplateData, lang: "en" | "mr" | "both" = "both"): string => {
    const business = data.businessName || "Rohit Kagdewad Lending";
    const phone = data.businessPhone || "+91 96652 69105";

    const downloadSectionMr = data.receiptDownloadUrl
      ? `\n📥 *डिजिटल पावती डाऊनलोड करा (Download Receipt):*\n${data.receiptDownloadUrl}\n`
      : "";

    const downloadSectionEn = data.receiptDownloadUrl
      ? `\n📥 *Download Official Digital Receipt:*\n${data.receiptDownloadUrl}\n`
      : "";

    const mrText = `*पावती - रक्कम प्राप्त झाली* ✅\n\n` +
      `नमस्कार *${data.borrowerName}*,\n` +
      `तुमची *₹${data.amount}* रक्कम यशस्वीरित्या जमा झाली आहे.\n\n` +
      `📄 पावती क्र.: *${data.receiptNumber || "-"}*\n` +
      `🔖 कर्ज खाते: *${data.loanCode || "-"}*\n` +
      `💰 उर्वरित बाकी: *₹${data.balanceRemaining || "0.00"}*\n` +
      downloadSectionMr +
      `\nधन्यवाद,\n*${business}*\n📞 संपर्क: ${phone}`;

    const enText = `*PAYMENT RECEIPT CONFIRMATION* ✅\n\n` +
      `Dear *${data.borrowerName}*,\n` +
      `We have received your payment of *₹${data.amount}*.\n\n` +
      `📄 Receipt No: *${data.receiptNumber || "-"}*\n` +
      `🔖 Loan ID: *${data.loanCode || "-"}*\n` +
      `💰 Outstanding Balance: *₹${data.balanceRemaining || "0.00"}*\n` +
      downloadSectionEn +
      `\nThank you,\n*${business}*\n📞 ${phone}`;

    if (lang === "mr") return mrText;
    if (lang === "en") return enText;
    return `${mrText}\n\n━━━━━━━━━━━━━━━\n\n${enText}`;
  },

  /**
   * 2. Upcoming Due Date Reminder (हप्ता देय स्मरणपत्र)
   */
  dueReminder: (data: MessageTemplateData, lang: "en" | "mr" | "both" = "both"): string => {
    const business = data.businessName || "Rohit Kagdewad Lending";
    const phone = data.businessPhone || "+91 96652 69105";

    const mrText = `*हप्ता देय स्मरणपत्र* 📅\n\n` +
      `नमस्कार *${data.borrowerName}*,\n` +
      `तुमच्या कर्ज खात्याचा हप्ता देय आहे:\n\n` +
      `💵 देय रक्कम: *₹${data.amount}*\n` +
      `📆 देय तारीख: *${data.dueDate || "आज"}*\n` +
      `🔖 कर्ज खाते: *${data.loanCode || "-"}*\n\n` +
      `कृपया वेळेवर भरणा करून दंड टाळा.\n\n` +
      `*${business}*\n📞 संपर्क: ${phone}`;

    const enText = `*INSTALLMENT DUE REMINDER* 📅\n\n` +
      `Dear *${data.borrowerName}*,\n` +
      `This is a reminder that your loan installment is due:\n\n` +
      `💵 Amount Due: *₹${data.amount}*\n` +
      `📆 Due Date: *${data.dueDate || "Today"}*\n` +
      `🔖 Loan ID: *${data.loanCode || "-"}*\n\n` +
      `Please make timely payment to avoid late fees.\n\n` +
      `*${business}*\n📞 ${phone}`;

    if (lang === "mr") return mrText;
    if (lang === "en") return enText;
    return `${mrText}\n\n━━━━━━━━━━━━━━━\n\n${enText}`;
  },

  /**
   * 3. Overdue Notice (थकबाकी सूचना)
   */
  overdueNotice: (data: MessageTemplateData, lang: "en" | "mr" | "both" = "both"): string => {
    const business = data.businessName || "Rohit Kagdewad Lending";
    const phone = data.businessPhone || "+91 96652 69105";

    const mrText = `*तात्काळ थकबाकी सूचना* ⚠️\n\n` +
      `नमस्कार *${data.borrowerName}*,\n` +
      `तुमच्या कर्ज खात्याचा हप्ता देय तारखेपासून थकला आहे.\n\n` +
      `💵 थकीत रक्कम: *₹${data.amount}*\n` +
      (data.penaltyAmount ? `⚠️ लेट फी दंड: *₹${data.penaltyAmount}*\n` : "") +
      `🔖 कर्ज खाते: *${data.loanCode || "-"}*\n\n` +
      `कृपया आजच संपर्क करून थकीत रक्कम जमा करावी.\n\n` +
      `*${business}*\n📞 संपर्क: ${phone}`;

    const enText = `*URGENT OVERDUE PAYMENT NOTICE* ⚠️\n\n` +
      `Dear *${data.borrowerName}*,\n` +
      `Your loan installment is currently OVERDUE.\n\n` +
      `💵 Overdue Amount: *₹${data.amount}*\n` +
      (data.penaltyAmount ? `⚠️ Late Fee Penalty: *₹${data.penaltyAmount}*\n` : "") +
      `🔖 Loan ID: *${data.loanCode || "-"}*\n\n` +
      `Please clear the overdue balance immediately.\n\n` +
      `*${business}*\n📞 ${phone}`;

    if (lang === "mr") return mrText;
    if (lang === "en") return enText;
    return `${mrText}\n\n━━━━━━━━━━━━━━━\n\n${enText}`;
  },

  /**
   * 4. Loan Disbursal Welcome (नवीन कर्ज वाटप)
   */
  disbursalWelcome: (data: MessageTemplateData, lang: "en" | "mr" | "both" = "both"): string => {
    const business = data.businessName || "Rohit Kagdewad Lending";
    const phone = data.businessPhone || "+91 96652 69105";

    const mrText = `*कर्ज वाटप यशस्वी* 🎉\n\n` +
      `नमस्कार *${data.borrowerName}*,\n` +
      `तुमचे *₹${data.amount}* चे कर्ज यशस्वीरित्या मंजूर आणि वितरित करण्यात आले आहे.\n\n` +
      `🔖 कर्ज खाते क्र.: *${data.loanCode || "-"}*\n` +
      `📆 पहिला हप्ता तारीख: *${data.dueDate || "-"}*\n\n` +
      `आपल्या आर्थिक सहकार्याबद्दल धन्यवाद!\n\n` +
      `*${business}*\n📞 संपर्क: ${phone}`;

    const enText = `*LOAN DISBURSAL CONFIRMATION* 🎉\n\n` +
      `Dear *${data.borrowerName}*,\n` +
      `Your loan of *₹${data.amount}* has been successfully disbursed.\n\n` +
      `🔖 Loan ID: *${data.loanCode || "-"}*\n` +
      `📆 First Due Date: *${data.dueDate || "-"}*\n\n` +
      `Thank you for banking with us!\n\n` +
      `*${business}*\n📞 ${phone}`;

    if (lang === "mr") return mrText;
    if (lang === "en") return enText;
    return `${mrText}\n\n━━━━━━━━━━━━━━━\n\n${enText}`;
  },

  /**
   * 5. Owner Real-Time Cashier Collection Alert (रोहित यांच्यासाठी सूचना)
   */
  ownerCollectionAlert: (cashierName: string, borrowerName: string, amount: string, mode: string, receiptNo: string): string => {
    return `*नवीन वसुली जमा (Payment Alert)* 💰\n\n` +
      `👤 कर्जदार: *${borrowerName}*\n` +
      `💵 रक्कम: *₹${amount}* (${mode})\n` +
      `📄 पावती क्र.: *${receiptNo}*\n` +
      `👨‍💼 ऑपरेटर: *${cashierName}*\n` +
      `⏰ वेळ: ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
  }
};
