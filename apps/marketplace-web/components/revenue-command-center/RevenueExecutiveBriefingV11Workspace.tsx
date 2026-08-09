"use client"

import CanonicalRevenueWorkspace from "./CanonicalRevenueWorkspace"

export default function RevenueExecutiveBriefingV11Workspace({ workspace, recordId, mode }: { workspace?: string; recordId?: string; mode?: string }) {
  return <CanonicalRevenueWorkspace workspace={workspace || mode || "executive"} recordId={recordId} />
}
