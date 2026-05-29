import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const imageUrl = req.nextUrl.searchParams.get("url");
  if (!imageUrl) return new NextResponse("Missing url", { status: 400 });

  try {
    const res = await fetch(imageUrl, { cache: "no-store" });
    if (!res.ok) return new NextResponse("Fetch failed", { status: 502 });

    const blob = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const filename = `photo.${ext}`;

    return new NextResponse(blob, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse("Error fetching image", { status: 500 });
  }
}
