"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { normalizePartnership, type RCCPartnership } from "./types"

const supabase = createClient()

export function useLivePartnerships() {
  const [partnerships, setPartnerships] = useState<RCCPartnership[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError("")

    const { data, error } = await supabase
      .from("revenue_partnerships")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(5000)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setPartnerships((data || []).map(normalizePartnership))
    setLastSync(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
    const channel = supabase
      .channel("rcc-live-partnerships-canonical")
      .on("postgres_changes", { event: "*", schema: "public", table: "revenue_partnerships" }, () => void refresh())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refresh])

  const byId = useMemo(() => {
    const map = new Map<string, RCCPartnership>()
    partnerships.forEach((partnership) => map.set(partnership.id, partnership))
    return map
  }, [partnerships])

  return { partnerships, byId, loading, error, lastSync, refresh, source: "revenue_partnerships" as const }
}
