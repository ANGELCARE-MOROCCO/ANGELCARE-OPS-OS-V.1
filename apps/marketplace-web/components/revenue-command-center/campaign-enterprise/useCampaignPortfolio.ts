"use client"

import { useCallback, useEffect, useState } from "react"
import type { CampaignPortfolio } from "./types"

type LoadState = { data: CampaignPortfolio | null; loading: boolean; error: string | null }

export function useCampaignPortfolio(campaignId?: string | null) {
  const [state, setState] = useState<LoadState>({ data: null, loading: true, error: null })
  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }))
    try {
      const query = campaignId ? `?campaignId=${encodeURIComponent(campaignId)}` : ""
      const response = await fetch(`/api/revenue-command-center/campaign-enterprise/portfolio${query}`, { cache: "no-store" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) throw new Error(payload?.error || "Impossible de charger le portefeuille campagnes.")
      setState({ data: payload?.data || payload, loading: false, error: null })
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error instanceof Error ? error.message : String(error) }))
    }
  }, [campaignId])
  useEffect(() => { void load() }, [load])
  return { ...state, refresh: load }
}

export async function campaignMutation(endpoint: string, method: "POST" | "PATCH", body: Record<string, unknown>) {
  const response = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload?.ok === false) throw new Error(payload?.error || "La commande campagne a échoué.")
  return payload?.data || payload
}
