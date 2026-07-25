"use client"

import { useCallback, useEffect, useState } from "react"
import type { EngagementPortfolio } from "./types"

const EMPTY: EngagementPortfolio = {
  appointments: [], participants: [], statusHistory: [], agendaItems: [], preparationItems: [], attendance: [], notes: [], objections: [], decisions: [], commitments: [], outcomes: [], followUps: [], noShows: [], recoveryAttempts: [], communicationThreads: [], communicationEvents: [], deliveryEvents: [], tasks: [],
  summary: { total:0, today:0, upcoming:0, confirmationPending:0, preparationPending:0, live:0, completed:0, noShows:0, recoveryOpen:0, highValue:0, atRisk:0, conversionRate:0, confirmedRate:0, commercialValueMad:0, valueAtRiskMad:0, openCommitments:0, waitingExternal:0 },
  schema: {}, syncedAt: new Date(0).toISOString(),
}

export function useEngagementPortfolio(experience: string, appointmentId?: string | null) {
  const [data, setData] = useState<EngagementPortfolio>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ experience })
      if (appointmentId) params.set("appointmentId", appointmentId)
      const response = await fetch(`/api/revenue-command-center/engagement/portfolio?${params.toString()}`, { cache: "no-store" })
      const body = await response.json().catch(() => ({}))
      if (!response.ok || !body.ok) throw new Error(body.error || "Impossible de charger le portefeuille d’engagement.")
      setData(body as EngagementPortfolio)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }, [experience, appointmentId])

  useEffect(() => { void refresh() }, [refresh])
  return { data, loading, error, refresh }
}

export async function engagementMutation(path: string, input: Record<string, unknown>, method = "POST") {
  const response = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) })
  const body = await response.json().catch(() => ({}))
  if (!response.ok || !body.ok) throw new Error(body.error || "L’opération n’a pas pu être exécutée.")
  return body
}
