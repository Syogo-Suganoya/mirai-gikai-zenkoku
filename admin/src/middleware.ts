import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** features/auth/server/lib/session.ts の SESSION_COOKIE と同じ名前 */
const SESSION_COOKIE = "admin_session";

/**
 * ログイン Cookie が無ければログイン画面へ送る。
 * middleware では Cookie の有無だけを見る。セッションの有効性は各ページ・Server Action で
 * DB と照合する（requireUserPage / requireUser）。
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // MCP エンドポイントは Bearer トークンで独自に認証する。
  // NOTE: `startsWith("/api/mcp")` だと `/api/mcpfoo` も一致するため、境界を意識した比較にする。
  if (pathname === "/api/mcp" || pathname.startsWith("/api/mcp/")) {
    return NextResponse.next();
  }
  if (pathname === "/login") {
    return NextResponse.next();
  }

  if (!request.cookies.has(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
