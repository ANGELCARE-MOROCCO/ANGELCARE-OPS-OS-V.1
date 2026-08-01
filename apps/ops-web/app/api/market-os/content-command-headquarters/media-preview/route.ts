import { NextRequest, NextResponse } from "next/server"
import { requireContentHeadquartersUser, contentHeadquartersApiError } from "@/lib/market-os/content-command-headquarters/auth"
import { fetchExternalMediaMetadata, proxyExternalMedia } from "@/lib/market-os/content-command-headquarters/media-preview-service"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    await requireContentHeadquartersUser("view")
    const mode = request.nextUrl.searchParams.get("mode") || "metadata"
    const url = request.nextUrl.searchParams.get("url") || ""
    if (!url) throw new Error("MEDIA_URL_REQUIRED")
    if (mode === "proxy") {
      const result = await proxyExternalMedia(url, request.headers.get("range"))
      return new Response(result.body, { status: result.status, headers: result.headers })
    }
    const metadata = await fetchExternalMediaMetadata(url)
    return NextResponse.json({ ok: true, metadata, source: "content_command_secure_media_preview" }, { headers: { "cache-control": "private, max-age=300" } })
  } catch (error) { return contentHeadquartersApiError(error) }
}
