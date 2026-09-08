import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/logger";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.businessSetting.findMany();
  const settingsMap: Record<string, string> = {};
  for (const s of settings) {
    settingsMap[s.key] = s.value;
  }

  return NextResponse.json({ settings: settingsMap });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden: Owner access required" }, { status: 403 });
    }

    const body = await req.json();

    for (const [key, value] of Object.entries(body)) {
      if (typeof value === "string" || typeof value === "number") {
        await prisma.businessSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        });
      }
    }

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      entityType: "SETTING",
      entityId: "SYSTEM_SETTINGS",
      newValues: body,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save settings error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
