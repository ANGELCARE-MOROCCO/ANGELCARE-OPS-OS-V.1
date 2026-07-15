import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    ok: true,
    namespace: "market-os/refferq",
    mounted: true,
  })
}
