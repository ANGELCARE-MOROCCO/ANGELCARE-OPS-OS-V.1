import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      data: {
        service: "angelcare-ops-web",
        capability: "angelcare-desktop-runtime",
        contractVersion: "2.0.0",
        desktopFeatures: {
          whatsappWebContentsView: true,
          whatsappPersistentSession: true,
          whatsappSessionControl: true,
          whatsappAutomation: false,
          whatsappDomAccess: false,
        },
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
        deploymentId: process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA || null,
        time: new Date().toISOString(),
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-AngelCare-Desktop-Contract": "2.0.0",
      },
    },
  )
}
