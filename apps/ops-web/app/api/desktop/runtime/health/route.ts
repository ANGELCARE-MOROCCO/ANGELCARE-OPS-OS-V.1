import { NextResponse } from "next/server"
import { ANGELCARE_DESKTOP_RELEASE } from "@/lib/desktop/release"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      data: {
        desktop_version: ANGELCARE_DESKTOP_RELEASE.version,
        desktop_contract: ANGELCARE_DESKTOP_RELEASE.contract,
        service: "angelcare-ops-web",
        capability: "angelcare-desktop-runtime",
        contractVersion: ANGELCARE_DESKTOP_RELEASE.governanceContract,
        buildNumber: ANGELCARE_DESKTOP_RELEASE.buildNumber,
        channel: ANGELCARE_DESKTOP_RELEASE.channel,
        desktopFeatures: {
          whatsappWebContentsView: true,
          whatsappPersistentSession: true,
          whatsappSessionControl: true,
          whatsappExplicitActivation: true,
          whatsappRegistrationRecovery: true,
          whatsappCleanReenrolment: true,
          acPlusWorkspaces: true,
          runtimeModeAwareWorkspaceControls: true,
          splitRecompositionWhileActive: true,
          splitModes: [2, 3, 4],
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
        "X-AngelCare-Desktop-Contract": ANGELCARE_DESKTOP_RELEASE.contract,
        "X-AngelCare-Desktop-Version": ANGELCARE_DESKTOP_RELEASE.version,
      },
    },
  )
}
