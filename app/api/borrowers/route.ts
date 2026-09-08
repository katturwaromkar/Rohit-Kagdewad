import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { borrowerSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit/logger";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (query) {
      where.OR = [
        { fullName: { contains: query } },
        { phone: { contains: query } },
        { borrowerCode: { contains: query } },
        { city: { contains: query } },
        { occupation: { contains: query } },
      ];
    }

    const borrowers = await prisma.borrower.findMany({
      where,
      include: {
        loans: {
          select: {
            id: true,
            loanCode: true,
            principalAmount: true,
            totalOutstanding: true,
            status: true,
          },
        },
        _count: {
          select: {
            loans: true,
            payments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ borrowers });
  } catch (error) {
    console.error("Fetch borrowers error:", error);
    return NextResponse.json({ error: "Failed to fetch borrowers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = borrowerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Check duplicate phone
    const existing = await prisma.borrower.findUnique({
      where: { phone: data.phone },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A borrower with this mobile number already exists." },
        { status: 409 }
      );
    }

    // Auto-generate borrower code: BOR-YYYY-XXX
    const year = new Date().getFullYear();
    const count = await prisma.borrower.count();
    const borrowerCode = `BOR-${year}-${String(count + 1).padStart(3, "0")}`;

    const newBorrower = await prisma.borrower.create({
      data: {
        borrowerCode,
        fullName: data.fullName,
        phone: data.phone,
        alternatePhone: data.alternatePhone || null,
        email: data.email || null,
        dob: data.dob ? new Date(data.dob) : null,
        address: data.address,
        city: data.city || "Nanded",
        state: data.state || "Maharashtra",
        pincode: data.pincode || null,
        occupation: data.occupation || null,
        businessDetails: data.businessDetails || null,
        monthlyIncome: data.monthlyIncome || null,
        referenceName: data.referenceName || null,
        referencePhone: data.referencePhone || null,
        referenceRelation: data.referenceRelation || null,
        guarantorName: data.guarantorName || null,
        guarantorPhone: data.guarantorPhone || null,
        guarantorAddress: data.guarantorAddress || null,
        status: data.status || "ACTIVE",
        notes: data.notes || null,
      },
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entityType: "BORROWER",
      entityId: newBorrower.id,
      newValues: { code: borrowerCode, name: data.fullName, phone: data.phone },
    });

    return NextResponse.json({ success: true, borrower: newBorrower });
  } catch (error: any) {
    console.error("Create borrower error:", error);
    return NextResponse.json({ error: "Failed to create borrower" }, { status: 500 });
  }
}
