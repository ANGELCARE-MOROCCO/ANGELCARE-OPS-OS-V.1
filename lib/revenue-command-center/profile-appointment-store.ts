"use client"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export async function loadProspectProfileAppointments(prospectId: string) {
  const { data, error } = await supabase
    .from("revenue_appointment_command_view")
    .select("*")
    .eq("entity_id", prospectId)
    .order("appointment_at", { ascending: true })

  if (error) throw error
  return data || []
}

export function subscribeProspectProfileAppointments(prospectId: string, onChange: () => void) {
  const channel = supabase
    .channel(`profile-appointments-${prospectId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "revenue_appointments", filter: `entity_id=eq.${prospectId}` },
      onChange,
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
