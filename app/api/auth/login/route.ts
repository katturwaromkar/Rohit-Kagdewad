import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { comparePassword, signToken, setSessionCookie } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = loginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validated.data;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Invalid credentials or account inactive" },
        { status: 401 }
      );
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Parse custom permissions
    let permissionsList: string[] = [];
    try {
      permissionsList = JSON.parse(user.permissions || "[]");
    } catch {
      permissionsList = [];
    }

    const sessionPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      permissions: permissionsList,
    };

    const token = signToken(sessionPayload);
    await setSessionCookie(token);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Audit log
    await logAudit({
      userId: user.id,
      action: "LOGIN",
      entityType: "USER",
      entityId: user.id,
      newValues: { email: user.email, role: user.role },
    });

    return NextResponse.json({
      success: true,
      user: sessionPayload,
    });
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
