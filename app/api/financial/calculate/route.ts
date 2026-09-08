import { NextRequest, NextResponse } from "next/server";
import { generateLoanSchedule } from "@/lib/financial";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = generateLoanSchedule({
      principalAmount: body.principalAmount || 0,
      interestRate: body.interestRate || 0,
      interestType: body.interestType || "FLAT_RATE",
      repaymentFrequency: body.repaymentFrequency || "MONTHLY",
      tenurePeriods: Number(body.tenurePeriods) || 1,
      disbursementDate: body.disbursementDate || new Date().toISOString().split("T")[0],
      firstDueDate: body.firstDueDate || new Date().toISOString().split("T")[0],
      processingFee: body.processingFee || 0,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Calculate schedule error:", error);
    return NextResponse.json({ error: "Calculation failed" }, { status: 400 });
  }
}
