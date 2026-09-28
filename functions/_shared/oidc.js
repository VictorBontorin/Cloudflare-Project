import { fromB64Url } from "./crypto.js";

const DISCOVERY = "https://accounts.google.com/.well-known/openid-configuration";
const ISSUER = "https://accounts.google.com";
const decodePart = (p) => JSON.parse(new TextDecoder().decode(fromB64Url(p)));

export async function verifyGoogleIdToken(idToken, { clientId, nonce }) {
  // 1. tres partes
  const parts = typeof idToken === "string" ? idToken.split(".") : [];
  if (parts.length !== 3 || parts.some((p) => !p)) throw new Error("formato");

  // 2. cabecalho com alg RS256
  const header = decodePart(parts[0]);
  if (header.alg !== "RS256" || !header.kid) throw new Error("alg");

  // 3. descoberta OIDC do emissor esperado
  const disc = await (await fetch(DISCOVERY)).json();
  if (disc.issuer !== ISSUER) throw new Error("descoberta");

  // 4-5. JWKS e chave pelo kid
  const jwks = await (await fetch(disc.jwks_uri)).json();
  const jwk = (jwks.keys || []).find((k) => k.kid === header.kid && k.kty === "RSA");
  if (!jwk) throw new Error("kid");

  // 6-7. importar a chave e verificar a assinatura
  const key = await crypto.subtle.importKey(
    "jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]
  );
  const ok = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5", key, fromB64Url(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
  );
  if (!ok) throw new Error("assinatura");

  // 8. iss, aud, exp, iat, nonce
  const c = decodePart(parts[1]);
  const now = Math.floor(Date.now() / 1000);
  const aud = Array.isArray(c.aud) ? c.aud : [c.aud];
  if (c.iss !== ISSUER && c.iss !== "accounts.google.com") throw new Error("iss");
  if (!clientId || !aud.includes(clientId)) throw new Error("aud");
  if (typeof c.exp !== "number" || c.exp <= now) throw new Error("exp");
  if (typeof c.iat !== "number" || c.iat > now + 60) throw new Error("iat");
  if (!nonce || c.nonce !== nonce) throw new Error("nonce");
  if (typeof c.sub !== "string" || !c.sub) throw new Error("sub");

  return {
    issuer: ISSUER,
    subject: c.sub,
    email: c.email ?? null,
    displayName: c.name ?? c.email ?? null,
  };
}
