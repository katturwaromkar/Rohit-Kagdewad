import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { borrowerSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit/logger";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const borrower = await prisma.borrower.findUnique({
      where: { id: params.id },
      include: {
        loans: {
          include: {
            installments: {
              orderBy: { installmentNumber: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
        ledgerEntries: {
          orderBy: { entryDate: "desc" },
        },
        documents: {
          orderBy: { uploadedAt: "desc" },
        },
        messages: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!borrower) {
      return NextResponse.json({ error: "Borrower not found" }, { status: 404 });
    }

    return NextResponse.json({ borrower });
  } catch (error) {
    console.error("Fetch borrower error:", error);
    return NextResponse.json({ error: "Failed to fetch borrower" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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
    const existing = await prisma.borrower.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Borrower not found" }, { status: 404 });
    }

    // Check if phone was changed and already used by another borrower
    if (data.phone !== existing.phone) {
      const phoneInUse = await prisma.borrower.findUnique({
        where: { phone: data.phone },
      });
      if (phoneInUse) {
        return NextResponse.json(
          { error: "Another borrower already has this mobile number." },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.borrower.update({
      where: { id: params.id },
      data: {
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
        status: data.status,
        notes: data.notes || null,
      },
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      entityType: "BORROWER",
      entityId: updated.id,
      oldValues: existing,
      newValues: updated,
    });

    return NextResponse.json({ success: true, borrower: updated });
  } catch (error) {
    console.error("Update borrower error:", error);
    return NextResponse.json({ error: "Failed to update borrower" }, { status: 500 });
  }
}
