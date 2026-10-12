/**
 * 住民の匿名 ID を Cookie に入れるための署名・検証（純粋関数。Edge と Node の両方で動く）。
 *
 * Cookie の値は `<uuid>.<HMAC-SHA256(uuid) の base64url>`。
 * 署名を付けるのは、他人の匿名 ID を Cookie に書き込んでチャットの利用枠や
 * インタビューの持ち主になりすますのを防ぐため。
 */

export const VISITOR_COOKIE_NAME = "mg_visitor";
/** 匿名 ID の有効期間（1年） */
export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = "";
  for (const b of new Uint8Array(bytes)) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function hmac(value: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return toBase64Url(
    await crypto.subtle.sign("HMAC", key, encoder.encode(value))
  );
}

/** 長さに依存しない比較（署名の比較に使う） */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signVisitorId(
  visitorId: string,
  secret: string
): Promise<string> {
  return `${visitorId}.${await hmac(visitorId, secret)}`;
}

/** 署名が正しければ匿名 ID を返す。改ざん・形式違いは null */
export async function verifyVisitorToken(
  token: string | undefined,
  secret: string
): Promise<string | null> {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const visitorId = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!UUID_RE.test(visitorId)) return null;
  const expected = await hmac(visitorId, secret);
  return safeEqual(signature, expected) ? visitorId : null;
}

/** 署名の鍵。本番では VISITOR_COOKIE_SECRET が必須 */
export function getVisitorSecret(): string {
  const secret = process.env.VISITOR_COOKIE_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("環境変数 VISITOR_COOKIE_SECRET が設定されていません");
  }
  return "local-development-visitor-secret";
}
