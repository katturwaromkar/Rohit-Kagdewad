import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { markVoiceCallExecuted } from "@/lib/ai/voiceCalling";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { callId, callNotes, status = "COMPLETED" } = body;

    if (!callId) {
      return NextResponse.json({ error: "Call ID is required." }, { status: 400 });
    }

    const updated = await markVoiceCallExecuted(
      callId,
      callNotes,
      status as "COMPLETED" | "MISSED" | "CANCELLED"
    );

    return NextResponse.json({
      success: true,
      message: `Call marked as ${status}.`,
      call: updated,
    });
  } catch (error: any) {
    console.error("Execute voice call error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update voice call status." },
      { status: 500 }
    );
  }
}
