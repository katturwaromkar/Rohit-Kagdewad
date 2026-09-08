import prisma from "../db";
import { cleanPhoneNumber } from "../utils";

export interface SendWhatsAppInput {
  borrowerId: string;
  loanId?: string;
  phone: string;
  templateName: string;
  messageBody: string;
}

export async function sendWhatsAppMessage(input: SendWhatsAppInput) {
  const cleaned = cleanPhoneNumber(input.phone);
  const recipient = `91${cleaned}`;

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  let providerMessageId: string | null = null;
  let status: "SENT" | "FAILED" = "SENT";
  let errorMessage: string | null = null;

  // If live Cloud API credentials are configured, execute Meta Graph API call
  if (token && phoneNumberId) {
    try {
      const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipient,
          type: "text",
          text: { body: input.messageBody },
        }),
      });

      const data = await res.json();
      if (res.ok && data.messages && data.messages.length > 0) {
        providerMessageId = data.messages[0].id;
        status = "SENT";
      } else {
        status = "FAILED";
        errorMessage = data.error?.message || "WhatsApp Cloud API error";
      }
    } catch (err: any) {
      status = "FAILED";
      errorMessage = err.message || "Network error connecting to Meta WhatsApp API";
    }
  } else {
    // Simulator mode when credentials are not yet entered by owner
    providerMessageId = `sim_wamid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    status = "SENT";
  }

  // Record into WhatsAppMessage database table
  const record = await prisma.whatsAppMessage.create({
    data: {
      borrowerId: input.borrowerId,
      loanId: input.loanId || null,
      recipientPhone: cleaned,
      templateName: input.templateName,
      messageBody: input.messageBody,
      status,
      providerMessageId,
      errorMessage,
      sentAt: status === "SENT" ? new Date() : null,
    },
  });

  return record;
}
