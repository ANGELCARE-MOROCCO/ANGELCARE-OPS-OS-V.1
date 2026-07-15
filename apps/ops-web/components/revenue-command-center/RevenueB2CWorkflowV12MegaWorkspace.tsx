"use client"

import CanonicalRevenueWorkspace from "./CanonicalRevenueWorkspace"

export default function RevenueB2CWorkflowV12MegaWorkspace({ workspace, recordId, mode }: { workspace?: string; recordId?: string; mode?: string }) {
  return <CanonicalRevenueWorkspace workspace={workspace || mode || "b2c"} recordId={recordId} />
}
