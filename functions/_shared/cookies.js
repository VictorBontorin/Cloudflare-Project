export const TX_COOKIE = "__Host-oauth-tx";
export const SESSION_COOKIE = "__Host-session";

export function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > -1 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

export const txCookie = (v) =>
  `${TX_COOKIE}=${v}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`;
export const clearTxCookie = () =>
  `${TX_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
export const sessionCookie = (v) =>
  `${SESSION_COOKIE}=${v}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`;
export const clearSessionCookie = () =>
  `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

// Resposta sempre com no-store; aceita varios Set-Cookie e Location opcional
export function reply(status, body = null, { cookies = [], location = null, json = false } = {}) {
  const headers = new Headers({ "Cache-Control": "no-store" });
  for (const c of cookies) headers.append("Set-Cookie", c);
  if (location) headers.set("Location", location);
  if (json) headers.set("Content-Type", "application/json");
  return new Response(json ? JSON.stringify(body) : body, { status, headers });
}
