import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { listScheduledVoiceCalls } from "@/lib/ai/voiceCalling";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "ALL";
    const borrowerId = searchParams.get("borrowerId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const calls = await listScheduledVoiceCalls({
      status,
      borrowerId,
      limit,
    });

    return NextResponse.json({
      success: true,
      calls,
    });
  } catch (error: any) {
    console.error("List voice calls error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to list scheduled voice calls." },
      { status: 500 }
    );
  }
}
