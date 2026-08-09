"use client"

import { useCallback, useEffect, useState } from "react"
import type { ProspectDossierPayload, ProspectEnterpriseMode, ProspectEnterprisePayload } from "./types"

async function readJson(response: Response) {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || "Le service Revenue Command n’a pas pu répondre.")
  }
  return payload
}

export function useProspectEnterpriseData(mode: ProspectEnterpriseMode, recordId?: string) {
  const [portfolio, setPortfolio] = useState<ProspectEnterprisePayload | null>(null)
  const [dossier, setDossier] = useState<ProspectDossierPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const refresh = useCallback(async (background = false) => {
    background ? setRefreshing(true) : setLoading(true)
    setError("")
    try {
      const portfolioPromise = fetch(`/api/revenue-command-center/prospects/enterprise?view=${encodeURIComponent(mode)}`, {
        cache: "no-store",
      }).then(readJson)
      const dossierPromise = recordId
        ? fetch(`/api/revenue-command-center/prospects/${encodeURIComponent(recordId)}`, { cache: "no-store" }).then(readJson)
        : Promise.resolve(null)
      const [portfolioPayload, dossierPayload] = await Promise.all([portfolioPromise, dossierPromise])
      setPortfolio(portfolioPayload as ProspectEnterprisePayload)
      setDossier(dossierPayload as ProspectDossierPayload | null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Chargement impossible.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [mode, recordId])

  useEffect(() => {
    void refresh(false)
  }, [refresh])

  useEffect(() => {
    const listener = () => void refresh(true)
    window.addEventListener("rcc-prospects-canonical-refresh", listener)
    return () => window.removeEventListener("rcc-prospects-canonical-refresh", listener)
  }, [refresh])

  return { portfolio, dossier, loading, refreshing, error, refresh }
}

export async function mutateRevenueEndpoint(url: string, method: "POST" | "PATCH" | "DELETE", body?: Record<string, unknown>) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const payload = await readJson(response)
  window.dispatchEvent(new CustomEvent("rcc-prospects-canonical-refresh"))
  return payload
}
