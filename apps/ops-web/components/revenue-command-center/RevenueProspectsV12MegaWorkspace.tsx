"use client"

import CanonicalRevenueWorkspace from "./CanonicalRevenueWorkspace"

export default function RevenueProspectsV12MegaWorkspace({ workspace, recordId, mode }: { workspace?: string; recordId?: string; mode?: string }) {
  return <CanonicalRevenueWorkspace workspace={workspace || mode || "prospects"} recordId={recordId} />
}
