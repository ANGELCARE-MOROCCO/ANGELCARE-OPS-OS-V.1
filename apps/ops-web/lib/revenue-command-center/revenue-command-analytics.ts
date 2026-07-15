"use client"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export type RevenueCommandAnalytics = {
  total_prospects: number
  active_prospects: number
  pipeline_value_mad: number
  total_tasks: number
  open_tasks: number
  completed_tasks: number
  overdue_tasks: number
  total_appointments: number
  scheduled_appointments: number
  completed_appointments: number
  missed_appointments: number
  unread_notifications: number
  total_events: number
}

export async function loadRevenueCommandAnalytics() {
  const { data, error } = await supabase.from("revenue_command_analytics_view").select("*").single()
  if (error) throw error
  return data as RevenueCommandAnalytics
}

export async function runRevenueSmokeTest() {
  const { data, error } = await supabase.rpc("revenue_command_smoke_test")
  if (error) throw error
  return data
}

export function subscribeRevenueAnalytics(onChange: () => void) {
  const channel = supabase
    .channel("revenue-analytics")
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_prospects" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_tasks" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_appointments" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_notifications" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_events" }, onChange)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
