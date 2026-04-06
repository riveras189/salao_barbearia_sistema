import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

function buildLoginUrl(request: NextRequest) {
  return new URL("/login", request.url);
}

export async function GET(request: NextRequest) {
  await clearSession();
  return NextResponse.redirect(buildLoginUrl(request));
}

export async function POST(request: NextRequest) {
  await clearSession();
  return NextResponse.redirect(buildLoginUrl(request));
}
