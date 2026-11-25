import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src");
  let photo: URL;
  try {
    photo = new URL(src || "");
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (photo.protocol !== "https:" || photo.hostname !== "lh3.googleusercontent.com") {
    return new NextResponse(null, { status: 400 });
  }

  const image = await fetch(photo, { next: { revalidate: 86400 } });
  if (!image.ok) return new NextResponse(null, { status: 404 });

  return new NextResponse(await image.arrayBuffer(), {
    headers: {
      "Content-Type": image.headers.get("content-type") || "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
