"use client"

import type { AppointmentRecord } from "@/lib/revenue-command-center/appointments-command-store"

export const APPOINTMENT_TYPES = [
  "meeting",
  "follow_up_call",
  "demo_presentation",
  "site_visit",
  "contract_discussion",
  "budget_discussion",
  "strategic_partnership",
  "onboarding",
  "renewal",
  "escalation",
]

export function nowLocalInput(offsetHours = 1) {
  const d = new Date()
  d.setHours(d.getHours() + offsetHours, 0, 0, 0)
  return d.toISOString().slice(0, 16)
}

export function addMinutes(value: string, minutes: number) {
  const d = new Date(value || new Date())
  d.setMinutes(d.getMinutes() + minutes)
  return d.toISOString().slice(0, 16)
}

export function dateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10)
}

export function timeLabel(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export function dateLabel(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
}

export function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase()).join("") || "AC"
}

export function typeLabel(type: string) {
  return type.split("_").map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(" ")
}

export function statusTone(status: string) {
  if (status === "confirmed" || status === "completed") return "bg-emerald-500/15 text-emerald-200 border-emerald-400/20"
  if (status === "pending" || status === "scheduled") return "bg-amber-500/15 text-amber-200 border-amber-400/20"
  if (status === "cancelled" || status === "no_show") return "bg-red-500/15 text-red-200 border-red-400/20"
  return "bg-blue-500/15 text-blue-200 border-blue-400/20"
}

export function typeTone(type: string) {
  if (type.includes("meeting")) return "bg-violet-500/15 text-violet-200 border-violet-400/20"
  if (type.includes("call")) return "bg-emerald-500/15 text-emerald-200 border-emerald-400/20"
  if (type.includes("demo")) return "bg-amber-500/15 text-amber-200 border-amber-400/20"
  if (type.includes("site")) return "bg-blue-500/15 text-blue-200 border-blue-400/20"
  if (type.includes("contract")) return "bg-red-500/15 text-red-200 border-red-400/20"
  return "bg-cyan-500/15 text-cyan-200 border-cyan-400/20"
}

export function filterAppointments(
  appointments: AppointmentRecord[],
  filters: { query: string; typeFilter: string; statusFilter: string; ownerFilter: string },
) {
  const q = filters.query.trim().toLowerCase()
  return appointments.filter((appt) => {
    if (filters.typeFilter !== "all" && appt.appointment_type !== filters.typeFilter) return false
    if (filters.statusFilter !== "all" && appt.status !== filters.statusFilter) return false
    if (filters.ownerFilter !== "all" && appt.owner !== filters.ownerFilter) return false
    if (!q) return true
    return [appt.title, appt.entity_name, appt.entity_city, appt.owner, appt.status, appt.appointment_type]
      .join(" ")
      .toLowerCase()
      .includes(q)
  })
}
