import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: {
      note: "SEO analytics endpoint ready for Search Console / GA4 / Supabase integration.",
      source: "local-first-v2",
    },
  })
}
