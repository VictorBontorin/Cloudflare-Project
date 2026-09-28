import { randomB64Url, sha256B64Url } from "../../_shared/crypto.js";
import { txCookie, reply } from "../../_shared/cookies.js";
import { getProvider } from "../../_shared/providers.js";

export async function onRequestGet({ params, env }) {
  const p = getProvider(params.provider, env);
  if (!p) return reply(404, "Not found");

  const txId = randomB64Url();
  const state = randomB64Url();
  const verifier = randomB64Url();
  const nonce = p.name === "google" ? randomB64Url() : null;
  const now = Math.floor(Date.now() / 1000);

  // limpeza oportunista de transacoes vencidas
  await env.DB.prepare("DELETE FROM oauth_transactions WHERE expires_at < ?").bind(now).run();
  await env.DB.prepare(
    "INSERT INTO oauth_transactions (id_hash, provider, state_hash, nonce, code_verifier, expires_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(
    await sha256B64Url(txId), p.name, await sha256B64Url(state), nonce, verifier, now + 600
  ).run();

  const q = new URLSearchParams({
    client_id: p.clientId,
    redirect_uri: p.redirectUri,
    response_type: "code",
    state,
    code_challenge: await sha256B64Url(verifier),
    code_challenge_method: "S256",
  });
  if (p.name === "google") {
    q.set("scope", "openid email profile");
    q.set("nonce", nonce);
  }

  return reply(302, null, { cookies: [txCookie(txId)], location: `${p.authUrl}?${q}` });
}
