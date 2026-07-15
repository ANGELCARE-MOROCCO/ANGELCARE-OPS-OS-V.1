"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { normalizeTask, type RCCTask } from "./types"

const supabase = createClient()

export function useLiveTasks(entityId?: string) {
  const [tasks, setTasks] = useState<RCCTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError("")

    let query = supabase.from("revenue_tasks").select("*").order("updated_at", { ascending: false }).limit(5000)
    if (entityId) query = query.eq("entity_id", entityId)
    const { data, error } = await query

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setTasks((data || []).map(normalizeTask))
    setLastSync(new Date())
    setLoading(false)
  }, [entityId])

  useEffect(() => {
    void refresh()
    const channel = supabase
      .channel(`rcc-live-tasks-canonical-${entityId || "all"}`)
      .on(
        "postgres_changes",
        entityId
          ? { event: "*", schema: "public", table: "revenue_tasks", filter: `entity_id=eq.${entityId}` }
          : { event: "*", schema: "public", table: "revenue_tasks" },
        () => void refresh(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [entityId, refresh])

  const byEntityId = useMemo(() => {
    const map = new Map<string, RCCTask[]>()
    tasks.forEach((task) => {
      const list = map.get(task.entityId) || []
      list.push(task)
      map.set(task.entityId, list)
    })
    return map
  }, [tasks])

  return { tasks, byEntityId, loading, error, lastSync, refresh, source: "revenue_tasks" as const }
}
