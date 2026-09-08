import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", req.url), 303);
  response.cookies.delete("rk_lending_session");
  return response;
}

export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", req.url), 303);
  response.cookies.delete("rk_lending_session");
  return response;
}
