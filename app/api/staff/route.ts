import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/session";
import { staffSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit/logger";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden: Owner access only" }, { status: 403 });
  }

  const staffList = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      role: true,
      status: true,
      permissions: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ staff: staffList });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden: Owner access only" }, { status: 403 });
    }

    const body = await req.json();
    const validated = staffSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email address already exists." },
        { status: 409 }
      );
    }

    const defaultPassword = data.password || "Password@123";
    const passwordHash = await hashPassword(defaultPassword);

    const newStaff = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        phone: data.phone || null,
        name: data.name,
        passwordHash,
        role: data.role,
        status: data.status,
        permissions: JSON.stringify(data.permissions || []),
      },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entityType: "USER",
      entityId: newStaff.id,
      newValues: { name: newStaff.name, email: newStaff.email, role: newStaff.role },
    });

    return NextResponse.json({ success: true, user: newStaff });
  } catch (error) {
    console.error("Create staff error:", error);
    return NextResponse.json({ error: "Failed to create staff user" }, { status: 500 });
  }
}
