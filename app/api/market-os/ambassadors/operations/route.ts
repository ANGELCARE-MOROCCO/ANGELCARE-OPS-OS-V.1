import { ambassadorJson, readBody } from "@/lib/market-os/ambassadors/api"
import {
  createAmbassadorEntity,
  loadAmbassadorWorkspaceSnapshot,
  updateAmbassadorEntity,
} from "@/lib/market-os/ambassadors/server"
import type { AmbassadorEntity } from "@/lib/market-os/ambassadors/types"

export const dynamic = "force-dynamic"

const SUPPORTED: AmbassadorEntity[] = [
  "ambassadors",
  "territories",
  "missions",
  "recruitment",
  "onboarding",
  "training",
  "goals",
  "incentives",
  "reports",
  "settings",
]

const tableToEntity: Record<string, AmbassadorEntity> = {
  market_os_ambassadors: "ambassadors",
  market_os_ambassador_territories: "territories",
  market_os_ambassador_missions: "missions",
  market_os_ambassador_recruitment: "recruitment",
  market_os_ambassador_onboarding: "onboarding",
  market_os_ambassador_training: "training",
  market_os_ambassador_kpis: "goals",
  market_os_ambassador_incentives: "incentives",
  market_os_ambassador_reports: "reports",
}

export async function GET() {
  return ambassadorJson(await loadAmbassadorWorkspaceSnapshot())
}

export async function POST(request: Request) {
  const body = await readBody(request)
  const entity = (body.entity || tableToEntity[String(body.table || "")]) as AmbassadorEntity | undefined
  if (!entity || !SUPPORTED.includes(entity)) {
    return ambassadorJson({ ok: false, error: "Unsupported Ambassador operations entity" }, 400)
  }
  const row = (body.row && typeof body.row === "object" ? body.row : body) as Record<string, unknown>
  if (typeof row.id === "string" && row.id) {
    return ambassadorJson(await updateAmbassadorEntity(entity, row.id, row, String(body.action || "operations_upsert")))
  }
  return ambassadorJson(await createAmbassadorEntity(entity, row))
}
