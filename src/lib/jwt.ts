/**
 * Decode JWT payload without verifying signature (client-side identity only).
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json =
      typeof atob === 'function'
        ? decodeURIComponent(
            Array.from(atob(padded))
              .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
              .join(''),
          )
        : // Node / Hermes Buffer fallback
          (globalThis as { Buffer?: { from: (s: string, enc: string) => { toString: (e: string) => string } } })
            .Buffer?.from(padded, 'base64')
            .toString('utf8') ?? '';
    if (!json) return null;
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Resolve user id claim from typical ASP.NET / OIDC JWT shapes. */
export function getUserIdFromAccessToken(token: string | null | undefined): string | null {
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const candidates = [
    payload.sub,
    payload.uid,
    payload.userId,
    payload.UserId,
    payload[
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
    ],
    payload['nameid'],
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}
