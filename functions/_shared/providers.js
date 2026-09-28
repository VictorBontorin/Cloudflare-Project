const CONFIG = {
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    idKey: "GOOGLE_CLIENT_ID",
    secretKey: "GOOGLE_CLIENT_SECRET",
  },
  github: {
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    idKey: "GITHUB_CLIENT_ID",
    secretKey: "GITHUB_CLIENT_SECRET",
  },
};

// Retorna null para qualquer provedor que nao seja google ou github
export function getProvider(name, env) {
  if (typeof name !== "string" || !Object.hasOwn(CONFIG, name)) return null;
  const c = CONFIG[name];
  return {
    name,
    authUrl: c.authUrl,
    tokenUrl: c.tokenUrl,
    clientId: env[c.idKey],
    clientSecret: env[c.secretKey],
    redirectUri: `${env.PUBLIC_BASE_URL}/oauth/callback/${name}`,
  };
}
