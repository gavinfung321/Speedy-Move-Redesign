import { NextResponse } from "next/server";
import { gbpAuthUrl, gbpState } from "@/lib/gbp-auth";

export async function GET() {
  const state = gbpState();
  const response = NextResponse.redirect(gbpAuthUrl(state));
  response.cookies.set("gbp_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return response;
}
