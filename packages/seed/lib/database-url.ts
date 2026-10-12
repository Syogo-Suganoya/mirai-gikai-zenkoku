/**
 * DATABASE_URL がローカルの PostgreSQL を指しているかを判定する。
 * ローカル以外（Neon など）でデータを全部消したり、固定パスワードの管理者を作ったりしないためのガード。
 */
export function isLocalDatabaseUrl(rawUrl: string | undefined): boolean {
  if (!rawUrl) return false;
  let hostname: string;
  try {
    hostname = new URL(rawUrl).hostname;
  } catch {
    return false;
  }
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  const isIpv4Loopback = /^127(\.\d{1,3}){3}$/.test(host);
  return host === "localhost" || host === "::1" || isIpv4Loopback;
}
