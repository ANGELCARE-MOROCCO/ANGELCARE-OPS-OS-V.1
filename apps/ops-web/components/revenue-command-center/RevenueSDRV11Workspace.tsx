"use client"

import CanonicalRevenueWorkspace from "./CanonicalRevenueWorkspace"

export default function RevenueSDRV11Workspace({ workspace, recordId, mode }: { workspace?: string; recordId?: string; mode?: string }) {
  return <CanonicalRevenueWorkspace workspace={workspace || mode || "sdr"} recordId={recordId} />
}
