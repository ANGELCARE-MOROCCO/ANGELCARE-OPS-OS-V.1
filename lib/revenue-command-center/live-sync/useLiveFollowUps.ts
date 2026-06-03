"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { normalizeFollowUp, type RCCFollowUp } from "./types"

const supabase = createClient()

export function useLiveFollowUps(entityId?: string) {
  const [followUps, setFollowUps] = useState<RCCFollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError("")

    let query = supabase.from("revenue_follow_ups").select("*").order("updated_at", { ascending: false }).limit(5000)
    if (entityId) query = query.eq("entity_id", entityId)
    const { data, error } = await query

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setFollowUps((data || []).map(normalizeFollowUp))
    setLastSync(new Date())
    setLoading(false)
  }, [entityId])

  useEffect(() => {
    void refresh()
    const channel = supabase
      .channel(`rcc-live-followups-canonical-${entityId || "all"}`)
      .on(
        "postgres_changes",
        entityId
          ? { event: "*", schema: "public", table: "revenue_follow_ups", filter: `entity_id=eq.${entityId}` }
          : { event: "*", schema: "public", table: "revenue_follow_ups" },
        () => void refresh(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [entityId, refresh])

  const byEntityId = useMemo(() => {
    const map = new Map<string, RCCFollowUp[]>()
    followUps.forEach((followUp) => {
      const list = map.get(followUp.entityId) || []
      list.push(followUp)
      map.set(followUp.entityId, list)
    })
    return map
  }, [followUps])

  return { followUps, byEntityId, loading, error, lastSync, refresh, source: "revenue_follow_ups" as const }
}
