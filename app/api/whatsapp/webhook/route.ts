import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET for Meta Webhook verification challenge
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "rk_lending_webhook_secret_2026";

  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification token mismatch" }, { status: 403 });
}

// POST for message delivery status updates
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if this is a WhatsApp status update event
    if (body.object === "whatsapp_business_account" && body.entry) {
      for (const entry of body.entry) {
        if (entry.changes) {
          for (const change of entry.changes) {
            const value = change.value;
            if (value && value.statuses) {
              for (const statusObj of value.statuses) {
                const messageId = statusObj.id;
                const statusStr = statusObj.status; // "sent", "delivered", "read", "failed"

                let mappedStatus = "SENT";
                let updateData: any = {};

                if (statusStr === "delivered") {
                  mappedStatus = "DELIVERED";
                  updateData = { status: "DELIVERED", deliveredAt: new Date() };
                } else if (statusStr === "read") {
                  mappedStatus = "READ";
                  updateData = { status: "READ", readAt: new Date() };
                } else if (statusStr === "failed") {
                  mappedStatus = "FAILED";
                  updateData = { status: "FAILED", errorMessage: statusObj.errors?.[0]?.title || "Delivery failed" };
                }

                if (messageId) {
                  await prisma.whatsAppMessage.updateMany({
                    where: { providerMessageId: messageId },
                    data: updateData,
                  });
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
