import { readFileSync } from "node:fs";
import path from "node:path";
import { gbpClient } from "@/lib/gbp-auth";

const STAR_VALUE: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

type GoogleReview = {
  reviewer?: { displayName?: string; profilePhotoUrl?: string };
  starRating?: string;
  comment?: string;
  createTime?: string;
  updateTime?: string;
};

type ReviewsPayload = {
  reviews?: GoogleReview[];
  averageRating?: number;
  totalReviewCount?: number;
  nextPageToken?: string;
};

export type HomepageReviews = {
  averageRating: number;
  totalReviewCount: number;
  reviews: { name: string; stars: number; text: string; photo: string; when: string }[];
};

function refreshToken() {
  if (process.env.GBP_REFRESH_TOKEN) return process.env.GBP_REFRESH_TOKEN;
  try {
    const file = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    const raw = file.match(/^GBP_REFRESH_TOKEN=(.*)$/m)?.[1];
    if (!raw) return "";
    return raw.startsWith('"') ? (JSON.parse(raw) as string) : raw;
  } catch {
    return "";
  }
}

async function accessToken() {
  const refresh = refreshToken();
  if (!refresh) return "";
  const { id, secret } = gbpClient();
  const body = new URLSearchParams({
    client_id: id,
    client_secret: secret,
    refresh_token: refresh,
    grant_type: "refresh_token",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const payload = (await response.json()) as { access_token?: string };
  return response.ok ? payload.access_token || "" : "";
}

function originalComment(comment: string) {
  const original = "(Original)";
  const translated = "(Translated by Google)";
  let text = comment;
  if (text.includes(original)) text = text.slice(text.lastIndexOf(original) + original.length);
  const translatedAt = text.indexOf(translated);
  if (translatedAt >= 0) text = text.slice(0, translatedAt);
  return text.replace(/^\(Translated by Google\)\s*/i, "").trim();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    if (char === "&") return "&amp;";
    if (char === "<") return "&lt;";
    if (char === ">") return "&gt;";
    if (char === '"') return "&quot;";
    return "&#x27;";
  });
}

function starSpans(score: number) {
  return Array.from({ length: 5 }, (_, index) => {
    const fill = Math.max(0, Math.min(1, score - index)) * 100;
    return `<span style="--fill:${fill}%"></span>`;
  }).join("");
}

function relativeDate(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return { label: "", iso: "" };
  const elapsed = Date.now() - then;
  if (elapsed < 0) return { label: "today", iso };
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const format = new Intl.RelativeTimeFormat("en", { numeric: "always" });
  if (elapsed < hour) return { label: format.format(-Math.max(1, Math.round(elapsed / minute)), "minute"), iso };
  if (elapsed < day) return { label: format.format(-Math.round(elapsed / hour), "hour"), iso };
  if (elapsed < 7 * day) return { label: format.format(-Math.round(elapsed / day), "day"), iso };
  if (elapsed < 30 * day) return { label: format.format(-Math.max(1, Math.round(elapsed / (7 * day))), "week"), iso };
  if (elapsed < 365 * day) return { label: format.format(-Math.max(1, Math.round(elapsed / (30.44 * day))), "month"), iso };
  return { label: format.format(-Math.max(1, Math.round(elapsed / (365.25 * day))), "year"), iso };
}

function skipReviewer(name: string) {
  const clean = name.trim().toLowerCase().replace(/\.$/, "");
  return clean.includes("@") || ["justine si", "lila", "happy shopper", "jonathan k"].includes(clean);
}

function photoUrl(url: string | undefined) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}

const googleWordmark = `<svg class="google-wordmark" viewBox="0 0 272 92" role="img" aria-label="Google"><path fill="#EA4335" d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/><path fill="#FBBC05" d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/><path fill="#4285F4" d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z"/><path fill="#34A853" d="M225 3v65h-9.5V3h9.5z"/><path fill="#EA4335" d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z"/><path fill="#4285F4" d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z"/></svg>`;

export function reviewDateLabel(iso: string) {
  return relativeDate(iso).label;
}

export const googleCardMark = `<svg class="google-g" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>`;

export function googleReviewsHtml(data: HomepageReviews) {
  const rating = data.averageRating.toFixed(1);
  const cards = data.reviews
    .map((review) => {
      const photo = photoUrl(review.photo);
      const portrait = photo
        ? `<img src="${escapeHtml(`/api/gbp/photo/?src=${encodeURIComponent(photo)}`)}" alt="" width="40" height="40">`
        : `<span class="review-avatar" aria-hidden="true">${escapeHtml(review.name.slice(0, 1).toUpperCase())}</span>`;
      const posted = relativeDate(review.when);
      const when = posted.label
        ? `<time datetime="${escapeHtml(posted.iso)}">${escapeHtml(posted.label)}</time>`
        : "";
      return `<blockquote>
${googleCardMark}
<div class="google-person">${portrait}<span><strong>${escapeHtml(review.name)}</strong>${when}</span></div>
<p class="review-stars" role="img" aria-label="${review.stars} out of 5 stars">${starSpans(review.stars)}</p>
<p class="google-text">${escapeHtml(review.text)}</p>
</blockquote>`;
    })
    .join("");

  const arrow = (direction: "prev" | "next", label: string, path: string) =>
    `<button type="button" class="google-arrow google-arrow-${direction}" aria-label="${label}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;

  const scoreArrow = `<svg class="google-score-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6.5 15 12l-5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const score = `<strong>${rating}</strong><span class="review-stars" role="img" aria-label="${rating} out of 5 stars">${starSpans(data.averageRating)}</span><span class="google-count">${data.totalReviewCount.toLocaleString("en-HK")} Google reviews</span>${googleWordmark}<span class="google-view">View on Google${scoreArrow}</span>`;
  const profile = `<a class="google-score" href="https://share.google/3IVMyLSjZERIBvTpV" target="_blank" rel="noopener noreferrer">${score}</a>`;

  return `<div class="google-live">
${profile}
<div class="google-carousel">
${arrow("prev", "Previous reviews", "M14.5 6.5 9 12l5.5 5.5")}
<div class="google-grid google-track">${cards}</div>
${arrow("next", "Next reviews", "M9.5 6.5 15 12l-5.5 5.5")}
</div>
</div>`;
}

async function speedyMoveLocation(token: string) {
  const headers = { Authorization: `Bearer ${token}` };
  const accountsResponse = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
    headers,
    cache: "no-store",
  });
  if (!accountsResponse.ok) return null;
  const accounts = (await accountsResponse.json()) as { accounts?: { name: string }[] };

  for (const account of accounts.accounts || []) {
    const url = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`);
    url.searchParams.set("readMask", "name,title");
    url.searchParams.set("pageSize", "20");
    const locationsResponse = await fetch(url, { headers, cache: "no-store" });
    if (!locationsResponse.ok) continue;
    const locations = (await locationsResponse.json()) as { locations?: { name: string; title?: string }[] };
    const location = (locations.locations || []).find((item) => item.title?.includes("Speedy Move"));
    if (!location) continue;
    return {
      accountId: account.name.split("/")[1],
      locationId: location.name.split("/").pop() || "",
    };
  }
  return null;
}

export async function loadGoogleReviews(): Promise<HomepageReviews | null> {
  try {
    const token = await accessToken();
    if (!token) return null;
    const listing = await speedyMoveLocation(token);
    if (!listing?.accountId || !listing.locationId) return null;

    const headers = { Authorization: `Bearer ${token}` };
    const picked: HomepageReviews["reviews"] = [];
    let averageRating = 0;
    let totalReviewCount = 0;
    let pageToken = "";

    for (let page = 0; page < 3 && picked.length < 6; page += 1) {
      const url = new URL(
        `https://mybusiness.googleapis.com/v4/accounts/${listing.accountId}/locations/${listing.locationId}/reviews`,
      );
      url.searchParams.set("pageSize", "50");
      url.searchParams.set("orderBy", "updateTime desc");
      if (pageToken) url.searchParams.set("pageToken", pageToken);
      const response = await fetch(url, { headers, cache: "no-store" });
      if (!response.ok) return null;
      const payload = (await response.json()) as ReviewsPayload;
      averageRating = payload.averageRating ?? averageRating;
      totalReviewCount = payload.totalReviewCount ?? totalReviewCount;
      for (const review of payload.reviews || []) {
        const text = originalComment(review.comment || "");
        const stars = STAR_VALUE[review.starRating || ""] || 0;
        const name = review.reviewer?.displayName?.trim() || "Google user";
        if (!text || !stars || skipReviewer(name)) continue;
        picked.push({
          name,
          stars,
          text,
          photo: review.reviewer?.profilePhotoUrl || "",
          when: review.createTime || review.updateTime || "",
        });
        if (picked.length === 6) break;
      }
      pageToken = payload.nextPageToken || "";
      if (!pageToken) break;
    }

    if (!totalReviewCount) return null;
    return { averageRating, totalReviewCount, reviews: picked };
  } catch {
    return null;
  }
}
