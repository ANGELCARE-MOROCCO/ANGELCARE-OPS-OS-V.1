import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "hr-production",
    module: "hr",
    endpoint: "/api/hr/health",
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: {
      api: "online",
      routing: "available",
      productionLayer: "enabled",
    },
  })
}
