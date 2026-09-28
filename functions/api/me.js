import { sha256B64Url } from "../_shared/crypto.js";
import { SESSION_COOKIE, getCookie, reply } from "../_shared/cookies.js";

export async function onRequestGet({ request, env }) {
  const sid = getCookie(request, SESSION_COOKIE);
  if (!sid) return reply(401, { error: "unauthorized" }, { json: true });

  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare(
    "SELECT email, display_name FROM sessions WHERE id_hash = ? AND expires_at > ?"
  ).bind(await sha256B64Url(sid), now).first();
  if (!row) return reply(401, { error: "unauthorized" }, { json: true });

  return reply(200, { email: row.email, displayName: row.display_name }, { json: true });
}
