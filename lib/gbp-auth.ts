import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const gbpRedirectUri =
  process.env.GBP_REDIRECT_URI ?? "http://localhost:3000/api/gbp/callback";

export const gbpScope = "https://www.googleapis.com/auth/business.manage";

export function gbpClient() {
  const id = process.env.GBP_CLIENT_ID;
  const secret = process.env.GBP_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error("GBP_CLIENT_ID and GBP_CLIENT_SECRET are missing from .env.local.");
  }
  return { id, secret };
}

export function gbpState() {
  return randomBytes(24).toString("hex");
}

export function gbpAuthUrl(state: string) {
  const { id } = gbpClient();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", id);
  url.searchParams.set("redirect_uri", gbpRedirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", gbpScope);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return url;
}

export async function exchangeGbpCode(code: string) {
  const { id, secret } = gbpClient();
  const body = new URLSearchParams({
    code,
    client_id: id,
    client_secret: secret,
    redirect_uri: gbpRedirectUri,
    grant_type: "authorization_code",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || "Google did not return an access token.");
  }
  return { access_token: payload.access_token, refresh_token: payload.refresh_token };
}

export function saveGbpRefreshToken(token: string) {
  const file = path.join(process.cwd(), ".env.local");
  const current = readFileSync(file, "utf8");
  const line = `GBP_REFRESH_TOKEN=${JSON.stringify(token)}`;
  const next = /^GBP_REFRESH_TOKEN=.*$/m.test(current)
    ? current.replace(/^GBP_REFRESH_TOKEN=.*$/m, line)
    : `${current.trimEnd()}\n${line}\n`;
  writeFileSync(file, next);
}
