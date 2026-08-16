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

function lower(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

export async function loadRevenueCommandAnalytics(): Promise<RevenueCommandAnalytics> {
  const [prospects, tasks, appointments, notifications, events] = await Promise.all([
    supabase.from('revenue_prospects').select('status,value_mad,archived_at'),
    supabase.from('revenue_tasks').select('status,due_date,completed_at,archived_at'),
    supabase.from('revenue_appointments').select('status,archived_at'),
    supabase.from('revenue_notifications').select('status,archived_at'),
    supabase.from('revenue_events').select('id'),
  ])

  const error = prospects.error || tasks.error || appointments.error || notifications.error || events.error
  if (error) throw error

  const prospectRows = prospects.data || []
  const taskRows = tasks.data || []
  const appointmentRows = appointments.data || []
  const notificationRows = notifications.data || []
  const today = new Date().toISOString().slice(0, 10)

  return {
    total_prospects: prospectRows.length,
    active_prospects: prospectRows.filter((row: any) => !row.archived_at && !['lost', 'archived', 'closed'].includes(lower(row.status))).length,
    pipeline_value_mad: prospectRows.reduce((sum: number, row: any) => sum + Number(row.value_mad || 0), 0),
    total_tasks: taskRows.length,
    open_tasks: taskRows.filter((row: any) => !row.archived_at && !['done', 'completed', 'cancelled', 'archived'].includes(lower(row.status))).length,
    completed_tasks: taskRows.filter((row: any) => Boolean(row.completed_at) || ['done', 'completed'].includes(lower(row.status))).length,
    overdue_tasks: taskRows.filter((row: any) => !row.completed_at && row.due_date && String(row.due_date) < today && !['done', 'completed', 'cancelled', 'archived'].includes(lower(row.status))).length,
    total_appointments: appointmentRows.length,
    scheduled_appointments: appointmentRows.filter((row: any) => !row.archived_at && ['scheduled', 'confirmed', 'pending'].includes(lower(row.status))).length,
    completed_appointments: appointmentRows.filter((row: any) => ['completed', 'done'].includes(lower(row.status))).length,
    missed_appointments: appointmentRows.filter((row: any) => ['missed', 'no_show', 'no-show'].includes(lower(row.status))).length,
    unread_notifications: notificationRows.filter((row: any) => !row.archived_at && ['unread', 'new'].includes(lower(row.status))).length,
    total_events: (events.data || []).length,
  }
}

export async function runRevenueSmokeTest() {
  const probes = await Promise.all([
    supabase.from('revenue_prospects').select('id', { count: 'exact', head: true }),
    supabase.from('revenue_tasks').select('id', { count: 'exact', head: true }),
    supabase.from('revenue_appointments').select('id', { count: 'exact', head: true }),
  ])
  const error = probes.find((probe) => probe.error)?.error
  if (error) throw error
  return { ok: true, source: 'canonical-paid-schema', checked_at: new Date().toISOString() }
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
