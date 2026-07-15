
"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { revenueLoadEntityControls } from "./revenue-action-engine"
import type { RevenueEntityType } from "./revenue-types"

const supabase = createClient()

export function useRevenueEntityControls(entityType: RevenueEntityType, entityId: string) {
  const [data, setData] = useState<any>({
    tasks: [],
    appointments: [],
    comments: [],
    documents: [],
    contacts: [],
    events: [],
  })
  const [status, setStatus] = useState<"connecting" | "live" | "fallback">("connecting")
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)

  const refresh = useCallback(async () => {
    if (!entityId) return
    try {
      const next = await revenueLoadEntityControls(entityType, entityId)
      setData(next)
      setStatus("live")
      setLastSyncAt(new Date())
    } catch (error) {
      console.warn("Revenue entity controls fallback", error)
      setStatus("fallback")
    }
  }, [entityType, entityId])

  useEffect(() => {
    refresh()
    if (!entityId) return

    const channel = supabase
      .channel(`revenue-entity-${entityType}-${entityId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "revenue_tasks", filter: `entity_id=eq.${entityId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "revenue_appointments", filter: `entity_id=eq.${entityId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "revenue_comments", filter: `entity_id=eq.${entityId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "revenue_documents", filter: `entity_id=eq.${entityId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "revenue_contacts", filter: `entity_id=eq.${entityId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "revenue_events", filter: `entity_id=eq.${entityId}` }, refresh)
      .subscribe((state) => {
        if (state === "SUBSCRIBED") setStatus("live")
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [entityType, entityId, refresh])

  return { data, status, lastSyncAt, refresh }
}
