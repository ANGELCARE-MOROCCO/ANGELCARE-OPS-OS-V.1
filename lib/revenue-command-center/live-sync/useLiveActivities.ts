"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { normalizeActivity, type RCCActivity } from "./types"

const supabase = createClient()

export function useLiveActivities(entityId?: string) {
  const [activities, setActivities] = useState<RCCActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError("")

    let query = supabase.from("revenue_activities").select("*").order("created_at", { ascending: false }).limit(500)
    if (entityId) query = query.eq("entity_id", entityId)
    const { data, error } = await query

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setActivities((data || []).map(normalizeActivity))
    setLastSync(new Date())
    setLoading(false)
  }, [entityId])

  useEffect(() => {
    void refresh()
    const channel = supabase
      .channel(`rcc-live-activities-canonical-${entityId || "all"}`)
      .on(
        "postgres_changes",
        entityId
          ? { event: "*", schema: "public", table: "revenue_activities", filter: `entity_id=eq.${entityId}` }
          : { event: "*", schema: "public", table: "revenue_activities" },
        () => void refresh(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [entityId, refresh])

  return { activities, loading, error, lastSync, refresh, source: "revenue_activities" as const }
}
