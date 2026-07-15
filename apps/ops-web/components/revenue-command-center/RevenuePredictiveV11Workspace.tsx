"use client"

import CanonicalRevenueWorkspace from "./CanonicalRevenueWorkspace"

export default function RevenuePredictiveV11Workspace({ workspace, recordId, mode }: { workspace?: string; recordId?: string; mode?: string }) {
  return <CanonicalRevenueWorkspace workspace={workspace || mode || "predictive"} recordId={recordId} />
}
