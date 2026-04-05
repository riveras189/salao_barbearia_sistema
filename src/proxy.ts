import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const protectedMatchers = [
  "/dashboard",
  "/clientes",
  "/profissionais",
  "/funcionarios",
  "/empresa",
  "/servicos",
  "/produtos",
  "/estoque",
  "/agenda",
  "/comandas",
  "/financeiro",
  "/relatorios",
  "/usuarios",
  "/site",
  "/auditoria",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedMatchers.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("salao_session")?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clientes/:path*",
    "/profissionais/:path*",
    "/funcionarios/:path*",
    "/empresa/:path*",
    "/servicos/:path*",
    "/produtos/:path*",
    "/estoque/:path*",
    "/agenda/:path*",
    "/comandas/:path*",
    "/financeiro/:path*",
    "/relatorios/:path*",
    "/usuarios/:path*",
    "/site/:path*",
    "/auditoria/:path*",
  ],
};