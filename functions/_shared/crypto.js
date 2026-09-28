export function toB64Url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromB64Url(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/")
    .padEnd(Math.ceil(str.length / 4) * 4, "=");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

// 32 bytes aleatorios -> 43 caracteres Base64URL
export function randomB64Url() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toB64Url(bytes);
}

// SHA-256 em Base64URL (code_challenge, resumo de cookie, resumo de state)
export async function sha256B64Url(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return toB64Url(new Uint8Array(digest));
}

export function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
