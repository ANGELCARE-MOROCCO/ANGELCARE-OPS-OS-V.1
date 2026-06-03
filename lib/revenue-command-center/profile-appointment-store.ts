"use client"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export async function loadProspectProfileAppointments(prospectId: string) {
  const response = await fetch(`/api/revenue-command-center/appointments?prospectId=${encodeURIComponent(prospectId)}&includeArchived=false&limit=1000`, {
    cache: "no-store",
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload?.ok === false) throw new Error(payload?.error || "Unable to load prospect appointments")
  return payload.appointments || payload.data || payload.items || []
}

export function subscribeProspectProfileAppointments(prospectId: string, onChange: () => void) {
  const channel = supabase
    .channel(`profile-appointments-${prospectId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "revenue_appointments" },
      onChange,
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
