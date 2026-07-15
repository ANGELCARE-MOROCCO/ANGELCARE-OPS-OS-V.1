"use client"

import AmbassadorProductionWorkspace from "./ambassador-production-workspace"
import type { AmbassadorWorkspaceMode } from "@/lib/market-os/ambassadors/types"

const modeMap: Record<string, AmbassadorWorkspaceMode> = {
  "command-center": "overview",
  intelligence: "performance",
  "execution-center": "missions",
}

export default function AmbassadorPhase3CommandCenter({ mode = "command-center" }: { mode?: string }) {
  return <AmbassadorProductionWorkspace mode={modeMap[mode] || "overview"} />
}
