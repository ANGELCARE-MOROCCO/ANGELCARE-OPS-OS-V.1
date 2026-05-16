"use client"

import CanonicalRevenueWorkspace from "@/components/revenue-command-center/CanonicalRevenueWorkspace"

export type RevenuePageKey = string

export default function UltimateRevenueExecutionPage({ pageKey, workspace, recordId }: { pageKey?: string; workspace?: string; recordId?: string }) {
  return <CanonicalRevenueWorkspace workspace={workspace || pageKey || "command"} recordId={recordId} />
}
