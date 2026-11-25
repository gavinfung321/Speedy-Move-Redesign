import { NextRequest, NextResponse } from "next/server";
import { exchangeGbpCode, saveGbpRefreshToken } from "@/lib/gbp-auth";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const error = url.searchParams.get("error");
  if (error) {
    return html(`Google returned ${error}. Close this tab and start the sign-in again.`);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const saved = request.cookies.get("gbp_oauth_state")?.value;
  if (!code || !state || state !== saved) {
    return html("The sign-in could not be confirmed. Close this tab and start again.");
  }

  try {
    const tokens = await exchangeGbpCode(code);
    if (!tokens.refresh_token) {
      return html("Google did not return a refresh token. Start the sign-in again and approve every prompt.");
    }
    saveGbpRefreshToken(tokens.refresh_token);
    const accounts = await listAccounts(tokens.access_token);
    const response = html(
      accounts
        ? `Signed in. Listing access is saved. Google returned ${accounts}.`
        : "Signed in. Listing access is saved.",
    );
    response.cookies.delete("gbp_oauth_state");
    return response;
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "The sign-in failed.";
    return html(message);
  }
}

async function listAccounts(accessToken: string) {
  const response = await fetch("https://mybusiness.googleapis.com/v4/accounts", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return "";
  const payload = (await response.json()) as { accounts?: { accountName?: string; name?: string }[] };
  const names = (payload.accounts ?? [])
    .map((account) => account.accountName || account.name)
    .filter(Boolean);
  return names.join(", ");
}

function html(message: string) {
  const body = `<!doctype html><meta name="robots" content="noindex"><title>Google reviews</title><main style="max-width:36rem;margin:4rem auto;padding:0 1rem;font-family:Inter,sans-serif;color:#1e1912"><h1>Google reviews</h1><p>${escapeHtml(message)}</p></main>`;
  return new NextResponse(body, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (character) => {
    const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
    return map[character];
  });
}
