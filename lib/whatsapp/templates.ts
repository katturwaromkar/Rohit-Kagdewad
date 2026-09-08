import { formatCurrency, formatDate } from "../utils";

export interface TemplateParams {
  borrowerName: string;
  loanCode?: string;
  amount?: number | string;
  dueDate?: string | Date;
  receiptNumber?: string;
  businessName?: string;
  businessPhone?: string;
  daysOverdue?: number;
}

export const WHATSAPP_TEMPLATES = {
  LOAN_DISBURSED: (p: TemplateParams) =>
    `Hello ${p.borrowerName},\n\nYour loan (${p.loanCode}) of ${formatCurrency(p.amount)} has been successfully disbursed by ${p.businessName || "Rohit Kagdewad Lending"}.\n\nFirst Due Date: ${formatDate(p.dueDate)}\n\nThank you for choosing us.\nFor support: ${p.businessPhone || "+91 98765 43210"}`,

  DUE_IN_2_DAYS: (p: TemplateParams) =>
    `Hello ${p.borrowerName},\n\nThis is a friendly reminder that your upcoming installment of ${formatCurrency(p.amount)} for Loan ${p.loanCode} is due on ${formatDate(p.dueDate)}.\n\nPlease keep the amount ready for payment.\n\nThank you,\n${p.businessName || "Rohit Kagdewad Lending"}`,

  DUE_TODAY: (p: TemplateParams) =>
    `Hello ${p.borrowerName},\n\nYour loan payment of ${formatCurrency(p.amount)} (Loan ID: ${p.loanCode}) is DUE TODAY (${formatDate(p.dueDate)}).\n\nPlease make the payment via UPI or Cash.\n\nThank you,\n${p.businessName || "Rohit Kagdewad Lending"} (${p.businessPhone || "+91 98765 43210"})`,

  OVERDUE_NOTICE: (p: TemplateParams) =>
    `URGENT OVERDUE NOTICE\n\nDear ${p.borrowerName},\nYour payment of ${formatCurrency(p.amount)} for Loan ${p.loanCode} is ${p.daysOverdue || "now"} DAYS OVERDUE.\n\nPlease clear the pending amount immediately to avoid late fee penalties.\n\n${p.businessName || "Rohit Kagdewad Lending"} - ${p.businessPhone || "+91 98765 43210"}`,

  PAYMENT_RECEIPT: (p: TemplateParams) =>
    `Payment Confirmation - ${p.businessName || "Rohit Kagdewad Lending"}\n\nDear ${p.borrowerName},\nWe have received your payment of ${formatCurrency(p.amount)}.\nReceipt No: ${p.receiptNumber}\nDate: ${formatDate(new Date())}\n\nThank you for your payment!`,

  LOAN_SETTLED: (p: TemplateParams) =>
    `Loan Closure Confirmation\n\nDear ${p.borrowerName},\nCongratulations! Your loan ${p.loanCode} has been fully settled and closed with zero outstanding balance.\n\nThank you for your excellent relationship.\n${p.businessName || "Rohit Kagdewad Lending"}`,
};
