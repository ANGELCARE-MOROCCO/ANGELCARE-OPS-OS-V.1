"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { normalizeAppointment, type RCCAppointment } from "./types"

const supabase = createClient()

async function loadAppointments(entityId?: string) {
  let query = supabase.from("revenue_appointments").select("*").order("appointment_at", { ascending: true }).limit(5000)
  if (entityId) query = query.eq("entity_id", entityId)
  return query
}

export function useLiveAppointments(entityId?: string) {
  const [appointments, setAppointments] = useState<RCCAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError("")

    const { data, error } = await loadAppointments(entityId)
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setAppointments((data || []).map(normalizeAppointment))
    setLastSync(new Date())
    setLoading(false)
  }, [entityId])

  useEffect(() => {
    void refresh()
    const channel = supabase
      .channel(`rcc-live-appointments-canonical-${entityId || "all"}`)
      .on(
        "postgres_changes",
        entityId
          ? { event: "*", schema: "public", table: "revenue_appointments", filter: `entity_id=eq.${entityId}` }
          : { event: "*", schema: "public", table: "revenue_appointments" },
        () => void refresh(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [entityId, refresh])

  const byEntityId = useMemo(() => {
    const map = new Map<string, RCCAppointment[]>()
    appointments.forEach((appointment) => {
      const list = map.get(appointment.entityId) || []
      list.push(appointment)
      map.set(appointment.entityId, list)
    })
    return map
  }, [appointments])

  return { appointments, byEntityId, loading, error, lastSync, refresh, source: "revenue_appointments" as const }
}
