import { sha256B64Url } from "../_shared/crypto.js";
import { SESSION_COOKIE, getCookie, clearSessionCookie, reply } from "../_shared/cookies.js";

export async function onRequestPost({ request, env }) {
  if (request.headers.get("Origin") !== env.PUBLIC_BASE_URL) {
    return reply(403, "Origem invalida.");
  }
  const sid = getCookie(request, SESSION_COOKIE);
  if (sid) {
    await env.DB.prepare("DELETE FROM sessions WHERE id_hash = ?")
      .bind(await sha256B64Url(sid)).run();
  }
  return reply(303, null, {
    cookies: [clearSessionCookie()],
    location: `${env.PUBLIC_BASE_URL}/`,
  });
}

export function onRequest() {
  const r = reply(405, "Metodo nao permitido.");
  r.headers.set("Allow", "POST");
  return r;
}
