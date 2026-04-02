/**
 * Client-side JWT expiry check (payload only; not cryptographic verification).
 * Malformed tokens are treated as expired.
 */
function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    return JSON.parse(atob(base64)) as { exp?: number };
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string | null | undefined): boolean {
  if (!token || token.length === 0) {
    return true;
  }
  const decode = decodeJwtPayload(token);
  if (!decode || typeof decode.exp !== "number") {
    return true;
  }
  return decode.exp * 1000 < Date.now();
}
