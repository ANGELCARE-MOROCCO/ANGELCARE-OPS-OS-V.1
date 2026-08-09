"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { normalizeProspect, type RCCProspect } from "./types"

const supabase = createClient()

export function useLiveProspects() {
  const [prospects, setProspects] = useState<RCCProspect[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError("")

    const { data, error } = await supabase
      .from("revenue_prospects")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(5000)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setProspects((data || []).map(normalizeProspect))
    setLastSync(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
    const channel = supabase
      .channel("rcc-live-prospects-canonical")
      .on("postgres_changes", { event: "*", schema: "public", table: "revenue_prospects" }, () => void refresh())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refresh])

  const byId = useMemo(() => {
    const map = new Map<string, RCCProspect>()
    prospects.forEach((p) => map.set(p.id, p))
    return map
  }, [prospects])

  return { prospects, byId, loading, error, lastSync, refresh, source: "revenue_prospects" as const }
}
