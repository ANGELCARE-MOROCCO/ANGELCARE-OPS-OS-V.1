import { NextResponse } from "next/server"
import { refferQSnapshot } from "@/lib/market-os/refferq/refferq-data"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    ok: true,
    module: "refferq",
    replacedModule: "market-os-ambassadors",
    snapshot: refferQSnapshot,
  })
}
