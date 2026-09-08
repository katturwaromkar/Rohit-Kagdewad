import prisma from "../db";
import { headers } from "next/headers";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "REVERSE" | "EXPORT" | "LOGIN" | "STATUS_CHANGE" | "REMINDER_TRIGGERED";
export type AuditEntity = "USER" | "BORROWER" | "BORROWER_DOCUMENT" | "LOAN" | "INSTALLMENT" | "PAYMENT" | "LEDGER" | "SETTING" | "WHATSAPP_MESSAGE";

export interface LogAuditInput {
  userId?: string | null;
  action: AuditAction;
  entityType: AuditEntity;
  entityId: string;
  oldValues?: any;
  newValues?: any;
}

export async function logAudit(input: LogAuditInput) {
  try {
    let ipAddress = "127.0.0.1";
    let userAgent = "Direct/Server";

    try {
      const headerStore = headers();
      ipAddress = headerStore.get("x-forwarded-for") || headerStore.get("x-real-ip") || "127.0.0.1";
      userAgent = headerStore.get("user-agent") || "Web Client";
    } catch {
      // Direct action outside HTTP context
    }

    await prisma.auditLog.create({
      data: {
        userId: input.userId || null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        oldValues: input.oldValues ? JSON.stringify(input.oldValues) : null,
        newValues: input.newValues ? JSON.stringify(input.newValues) : null,
        ipAddress: String(ipAddress).slice(0, 100),
        userAgent: String(userAgent).slice(0, 255),
      },
    });
  } catch (error) {
    console.error("Audit logging error (non-fatal):", error);
  }
}
