"use client"

import { useCallback, useEffect, useState } from "react"
import type { ExecutionPortfolio } from "./types"

const EMPTY: ExecutionPortfolio = {
  tasks: [], activities: [], assignments: [], dependencies: [], evidence: [], approvals: [], blockers: [], escalations: [], checklists: [], comments: [], workload: [],
  summary: { total:0, open:0, inProgress:0, waiting:0, blocked:0, overdue:0, approvalRequired:0, completed:0, unassigned:0, evidenceMissing:0, commercialValueAtRiskMad:0, completionRate:0 },
  schema: {}, syncedAt: new Date(0).toISOString(),
}

export function useExecutionPortfolio(experience: string, taskId?: string | null) {
  const [data, setData] = useState<ExecutionPortfolio>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ experience })
      if (taskId) params.set("taskId", taskId)
      const response = await fetch(`/api/revenue-command-center/execution/portfolio?${params.toString()}`, { cache: "no-store" })
      const body = await response.json()
      if (!response.ok || !body.ok) throw new Error(body.error || "Impossible de charger le portefeuille d’exécution.")
      setData(body as ExecutionPortfolio)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }, [experience, taskId])

  useEffect(() => { void refresh() }, [refresh])
  return { data, loading, error, refresh }
}

export async function executionMutation(path: string, input: Record<string, unknown>, method = "POST") {
  const response = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) })
  const body = await response.json().catch(() => ({}))
  if (!response.ok || !body.ok) throw new Error(body.error || "L’opération n’a pas pu être exécutée.")
  return body
}
