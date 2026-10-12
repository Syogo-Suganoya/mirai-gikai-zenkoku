import { type NextRequest, NextResponse } from "next/server";
import {
  getVisitorSecret,
  signVisitorId,
  VISITOR_COOKIE_MAX_AGE,
  VISITOR_COOKIE_NAME,
  verifyVisitorToken,
} from "./visitor-token";

/**
 * 匿名 ID の Cookie がなければ発行する（本家の Supabase 匿名ログインの置き換え）。
 *
 * 発行したリクエスト自体でもサーバー側から読めるよう、リクエストの Cookie にも書き込んでから
 * 次へ渡す。DB の anonymous_visitors の行は、使うとき（チャット・インタビューなど）に作る。
 */
export async function ensureVisitorCookie(
  request: NextRequest
): Promise<NextResponse> {
  const secret = getVisitorSecret();
  const current = request.cookies.get(VISITOR_COOKIE_NAME)?.value;
  if (await verifyVisitorToken(current, secret)) {
    return NextResponse.next({ request });
  }

  const token = await signVisitorId(crypto.randomUUID(), secret);
  request.cookies.set(VISITOR_COOKIE_NAME, token);
  const response = NextResponse.next({ request });
  response.cookies.set(VISITOR_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: VISITOR_COOKIE_MAX_AGE,
  });
  return response;
}
