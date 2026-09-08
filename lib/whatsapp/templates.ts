import { formatCurrency, formatDate } from "../utils";
import { bilingualTemplates } from "../i18n/marathi";

export interface TemplateParams {
  borrowerName: string;
  loanCode?: string;
  amount?: number | string;
  dueDate?: string | Date;
  receiptNumber?: string;
  businessName?: string;
  businessPhone?: string;
  daysOverdue?: number;
  balanceRemaining?: string | number;
  penaltyAmount?: string | number;
  language?: "en" | "mr" | "both";
}

export const WHATSAPP_TEMPLATES = {
  LOAN_DISBURSED: (p: TemplateParams) => {
    return bilingualTemplates.disbursalWelcome(
      {
        borrowerName: p.borrowerName,
        amount: typeof p.amount === "number" ? p.amount.toLocaleString("en-IN") : String(p.amount || "0"),
        dueDate: p.dueDate ? formatDate(p.dueDate) : undefined,
        loanCode: p.loanCode,
        businessName: p.businessName || "Rohit Kagdewad Lending Management",
        businessPhone: p.businessPhone || "+91 96652 69105",
      },
      p.language || "both"
    );
  },

  DUE_IN_2_DAYS: (p: TemplateParams) => {
    return bilingualTemplates.dueReminder(
      {
        borrowerName: p.borrowerName,
        amount: typeof p.amount === "number" ? p.amount.toLocaleString("en-IN") : String(p.amount || "0"),
        dueDate: p.dueDate ? formatDate(p.dueDate) : undefined,
        loanCode: p.loanCode,
        businessName: p.businessName || "Rohit Kagdewad Lending Management",
        businessPhone: p.businessPhone || "+91 96652 69105",
      },
      p.language || "both"
    );
  },

  DUE_TODAY: (p: TemplateParams) => {
    return bilingualTemplates.dueReminder(
      {
        borrowerName: p.borrowerName,
        amount: typeof p.amount === "number" ? p.amount.toLocaleString("en-IN") : String(p.amount || "0"),
        dueDate: p.dueDate ? formatDate(p.dueDate) : "आज (Today)",
        loanCode: p.loanCode,
        businessName: p.businessName || "Rohit Kagdewad Lending Management",
        businessPhone: p.businessPhone || "+91 96652 69105",
      },
      p.language || "both"
    );
  },

  OVERDUE_NOTICE: (p: TemplateParams) => {
    return bilingualTemplates.overdueNotice(
      {
        borrowerName: p.borrowerName,
        amount: typeof p.amount === "number" ? p.amount.toLocaleString("en-IN") : String(p.amount || "0"),
        penaltyAmount: p.penaltyAmount ? String(p.penaltyAmount) : undefined,
        loanCode: p.loanCode,
        businessName: p.businessName || "Rohit Kagdewad Lending Management",
        businessPhone: p.businessPhone || "+91 96652 69105",
      },
      p.language || "both"
    );
  },

  PAYMENT_RECEIPT: (p: TemplateParams) => {
    return bilingualTemplates.receipt(
      {
        borrowerName: p.borrowerName,
        amount: typeof p.amount === "number" ? p.amount.toLocaleString("en-IN") : String(p.amount || "0"),
        receiptNumber: p.receiptNumber,
        loanCode: p.loanCode,
        balanceRemaining: typeof p.balanceRemaining === "number" ? p.balanceRemaining.toLocaleString("en-IN") : String(p.balanceRemaining || "0.00"),
        businessName: p.businessName || "Rohit Kagdewad Lending Management",
        businessPhone: p.businessPhone || "+91 96652 69105",
      },
      p.language || "both"
    );
  },

  LOAN_SETTLED: (p: TemplateParams) => {
    const business = p.businessName || "Rohit Kagdewad Lending Management";
    const phone = p.businessPhone || "+91 96652 69105";
    return `*कर्ज खाते पूर्ण भरणा व बंद (Loan Settled)* 🎖️\n\n` +
      `नमस्कार *${p.borrowerName}*,\n` +
      `तुमचे *${p.loanCode || ""}* कर्ज खाते पूर्णपणे भरले असून शून्य बाकीसह बंद करण्यात आले आहे.\n\n` +
      `आपल्या उत्तम सहकार्याबद्दल धन्यवाद!\n\n` +
      `*${business}*\n📞 ${phone}`;
  },
};
