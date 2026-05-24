import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/getUser"
import { createClient } from "@/lib/supabase/server"

type AttendanceStatus = "none" | "in" | "out" | "pause" | "back" | "error"
type PunchAction = "shift_in" | "shift_out" | "lunch_start" | "lunch_end"
type AnyRow = Record<string, any>

export const dynamic = "force-dynamic"

function todayCasablanca() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Casablanca",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

async function resolveUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    const appUser = (await getCurrentUser().catch(() => null)) as { id?: string } | null
    if (appUser?.id) return appUser.id
  } catch {}

  try {
    const { data } = await supabase.auth.getUser()
    return data?.user?.id || null
  } catch {
    return null
  }
}

function readTime(row: AnyRow | null | undefined, keys: string[]) {
  if (!row) return null
  for (const key of keys) {
    const value = row[key]
    if (value) return String(value)
  }
  return null
}

function deriveStatus(row: AnyRow | null): AttendanceStatus {
  if (!row) return "none"

  const checkIn = readTime(row, ["check_in", "punch_in_at", "check_in_at", "clock_in_at", "start_time", "started_at"])
  const checkOut = readTime(row, ["check_out", "punch_out_at", "check_out_at", "clock_out_at", "end_time", "ended_at"])
  const lunchStart = readTime(row, ["lunch_start", "break_started_at", "break_start", "pause_started_at"])
  const lunchEnd = readTime(row, ["lunch_end", "break_ended_at", "break_end", "pause_ended_at"])

  if (checkIn && checkOut) return "out"
  if (lunchStart && !lunchEnd) return "pause"
  if (checkIn && lunchStart && lunchEnd && !checkOut) return "back"
  if (checkIn && !checkOut) return "in"
  return "none"
}

function canPunchFor(status: AttendanceStatus): Record<PunchAction, boolean> {
  return {
    shift_in: status === "none" || status === "out" || status === "error",
    shift_out: status === "in" || status === "back",
    lunch_start: status === "in" || status === "back",
    lunch_end: status === "pause",
  }
}

function messageFor(status: AttendanceStatus, row: AnyRow | null) {
  const checkIn = readTime(row, ["check_in", "punch_in_at", "check_in_at", "clock_in_at", "start_time", "started_at"])
  const checkOut = readTime(row, ["check_out", "punch_out_at", "check_out_at", "clock_out_at", "end_time", "ended_at"])
  const lunchStart = readTime(row, ["lunch_start", "break_started_at", "break_start", "pause_started_at"])

  if (status === "none") return "Ready to punch in."
  if (status === "in") return `Shift active${checkIn ? ` since ${new Date(checkIn).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : ""}.`
  if (status === "pause") return `Break active${lunchStart ? ` since ${new Date(lunchStart).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : ""}.`
  if (status === "back") return "Returned from break. Shift remains active."
  if (status === "out") return `Shift completed${checkOut ? ` at ${new Date(checkOut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : ""}.`
  return "Attendance status needs review, but punch in remains available."
}

function minutesBetween(a?: string | null, b?: string | null) {
  if (!a || !b) return 0
  const start = new Date(a).getTime()
  const end = new Date(b).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0
  return Math.floor((end - start) / 60000)
}

function workedMinutes(row: AnyRow | null) {
  if (!row) return 0
  const checkIn = readTime(row, ["check_in", "punch_in_at", "check_in_at", "clock_in_at", "start_time", "started_at"])
  const checkOut = readTime(row, ["check_out", "punch_out_at", "check_out_at", "clock_out_at", "end_time", "ended_at"])
  const lunchStart = readTime(row, ["lunch_start", "break_started_at", "break_start", "pause_started_at"])
  const lunchEnd = readTime(row, ["lunch_end", "break_ended_at", "break_end", "pause_ended_at"])
  const end = checkOut || new Date().toISOString()
  return Math.max(0, minutesBetween(checkIn, end) - minutesBetween(lunchStart, lunchEnd || new Date().toISOString()))
}

async function readByAttempts(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, day: string) {
  const attempts: Array<() => Promise<AnyRow | null>> = [
    async () => {
      const { data, error } = await supabase.from("hr_attendance_records").select("*").eq("user_id", userId).eq("attendance_date", day).order("updated_at", { ascending: false }).limit(1).maybeSingle()
      if (error) throw error
      return data || null
    },
    async () => {
      const { data, error } = await supabase.from("hr_attendance_records").select("*").eq("user_id", userId).eq("work_date", day).order("updated_at", { ascending: false }).limit(1).maybeSingle()
      if (error) throw error
      return data || null
    },
    async () => {
      const { data, error } = await supabase.from("hr_attendance").select("*").eq("user_id", userId).eq("work_date", day).order("updated_at", { ascending: false }).limit(1).maybeSingle()
      if (error) throw error
      return data || null
    },
  ]

  for (const attempt of attempts) {
    try {
      const row = await attempt()
      if (row) return row
    } catch {}
  }
  return null
}

export async function GET() {
  const supabase = await createClient()
  const userId = await resolveUserId(supabase)

  if (!userId) {
    return NextResponse.json({
      ok: true,
      status: "none",
      message: "Attendance ready. Sign-in mapping will attach server-side if available.",
      canPunch: canPunchFor("none"),
      workedMinutes: 0,
      breakMinutes: 0,
      fallbackMode: true,
    })
  }

  const day = todayCasablanca()
  const row = await readByAttempts(supabase, userId, day)
  const status = deriveStatus(row)

  return NextResponse.json({
    ok: true,
    compatibilityMode: true,
    attendance_date: day,
    status,
    message: messageFor(status, row),
    record: row,
    canPunch: canPunchFor(status),
    workedMinutes: workedMinutes(row),
    breakMinutes: 0,
  })
}
