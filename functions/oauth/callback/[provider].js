import { randomB64Url, sha256B64Url, safeEqual } from "../../_shared/crypto.js";
import {
  TX_COOKIE, getCookie, clearTxCookie, sessionCookie, reply,
} from "../../_shared/cookies.js";
import { getProvider } from "../../_shared/providers.js";
import { verifyGoogleIdToken } from "../../_shared/oidc.js";

// VERSAO DE DIAGNOSTICO (temporaria): mostra a etapa que falhou.
const fail = (status = 400, why = "") =>
  reply(status, `Falha na autenticacao.${why ? " [" + why + "]" : ""}`, {
    cookies: [clearTxCookie()],
  });

async function githubIdentity(tokens, p) {
  if (!tokens.access_token || String(tokens.token_type).toLowerCase() !== "bearer") {
    throw new Error("token");
  }
  const apiHeaders = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2026-03-10",
    "User-Agent": "oauth-pages-lab",
  };
  const res = await fetch("https://api.github.com/user", {
    headers: { ...apiHeaders, Authorization: `Bearer ${tokens.access_token}` },
  });
  if (res.status !== 200) throw new Error("user-" + res.status);
  const user = await res.json();
  if (!Number.isInteger(user.id)) throw new Error("id");

  // revoga a autorizacao inteira antes de criar a sessao local
  const revoke = await fetch(`https://api.github.com/applications/${p.clientId}/grant`, {
    method: "DELETE",
    headers: {
      ...apiHeaders,
      Authorization: `Basic ${btoa(`${p.clientId}:${p.clientSecret}`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ access_token: tokens.access_token }),
  });
  if (revoke.status !== 204) throw new Error("revogacao-" + revoke.status);

  return {
    issuer: "https://github.com",
    subject: String(user.id),
    email: user.email ?? null,
    displayName: user.name ?? user.login ?? null,
  };
}

export async function onRequestGet({ request, params, env }) {
  const p = getProvider(params.provider, env);
  if (!p) return reply(404, "Not found");

  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (url.searchParams.has("error") || !code || !state) return fail(400, "A-parametros");

    const tx = getCookie(request, TX_COOKIE);
    if (!tx) return fail(400, "B-sem-cookie");

    // localiza e apaga a transacao numa unica operacao (uso unico)
    const now = Math.floor(Date.now() / 1000);
    const row = await env.DB.prepare(
      "DELETE FROM oauth_transactions WHERE id_hash = ? AND expires_at > ? RETURNING provider, state_hash, nonce, code_verifier"
    ).bind(await sha256B64Url(tx), now).first();
    if (!row || row.provider !== p.name) return fail(400, "C-transacao");
    if (!safeEqual(row.state_hash, await sha256B64Url(state))) return fail(400, "D-state");

    // troca do codigo (nao registrar corpo nem resposta)
    const body = new URLSearchParams({
      client_id: p.clientId,
      client_secret: p.clientSecret,
      code,
      redirect_uri: p.redirectUri,
      code_verifier: row.code_verifier,
    });
    if (p.name === "google") body.set("grant_type", "authorization_code");
    const tokenRes = await fetch(p.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body,
    });
    if (!tokenRes.ok) return fail(502, "E-troca-" + tokenRes.status);
    const tokens = await tokenRes.json();

    const identity = p.name === "google"
      ? await verifyGoogleIdToken(tokens.id_token, { clientId: p.clientId, nonce: row.nonce })
      : await githubIdentity(tokens, p);

    // sessao opaca (somente depois da identidade confirmada)
    const sid = randomB64Url();
    await env.DB.prepare(
      "INSERT INTO sessions (id_hash, issuer, subject, email, display_name, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      await sha256B64Url(sid), identity.issuer, identity.subject,
      identity.email, identity.displayName, now + 28800, now
    ).run();

    return reply(302, null, {
      cookies: [sessionCookie(sid), clearTxCookie()],
      location: `${env.PUBLIC_BASE_URL}/`,
    });
  } catch (e) {
    return fail(400, "F-" + (e && e.message));
  }
}
