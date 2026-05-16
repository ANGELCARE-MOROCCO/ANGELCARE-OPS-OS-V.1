"use client"

import CanonicalRevenueWorkspace from "@/components/revenue-command-center/CanonicalRevenueWorkspace"

export default function RevenueCommandFinalWorkspace({ workspace, recordId, mode }: { workspace?: string; recordId?: string; mode?: string }) {
  return <CanonicalRevenueWorkspace workspace={workspace || mode || "command"} recordId={recordId} />
}
