"use client"

import AmbassadorProductionWorkspace from "./ambassador-production-workspace"
import type { AmbassadorWorkspaceMode } from "@/lib/market-os/ambassadors/types"

export default function AmbassadorSubpage({ mode, id }: { mode: "create" | "detail" | "edit" | "delete"; id?: string }) {
  return <AmbassadorProductionWorkspace mode={mode as AmbassadorWorkspaceMode} id={id} />
}
