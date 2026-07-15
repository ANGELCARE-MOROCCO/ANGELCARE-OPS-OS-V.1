"use client"

import AmbassadorProductionWorkspace from "./ambassador-production-workspace"
import type { AmbassadorWorkspaceMode } from "@/lib/market-os/ambassadors/types"

const modeMap: Record<string, AmbassadorWorkspaceMode> = {
  settings: "settings",
  programs: "overview",
  compliance: "overview",
  proofs: "missions",
  rewards: "incentives",
  training: "training",
}

export default function AmbassadorPhase2ExecutionWorkspace({ mode = "settings" }: { mode?: string }) {
  return <AmbassadorProductionWorkspace mode={modeMap[mode] || "overview"} />
}
