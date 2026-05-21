import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/getUser"
import { createClient } from "@/lib/supabase/server"
import { syncPunchToHrAttendance } from "@/lib/hr-attendance-sync/repository"

type AttendanceAction = "shift_in" | "shift_out" | "lunch_start" | "lunch_end"
type LiveStatus = "none" | "in" | "out" | "pause" | "back" | "error"

type AnyRecord = Record<string, any>

export const dynamic = "force-dynamic"

const ACTION_ALIASES: Record<string, AttendanceAction> = {
  shift_in: "shift_in",
  punch_in: "shift_in",
  check_in: "shift_in",
  clock_in: "shift_in",
  in: "shift_in",
  shift_out: "shift_out",
  punch_out: "shift_out",
  check_out: "shift_out",
  clock_out: "shift_out",
  out: "shift_out",
  lunch_start: "lunch_start",
  break_start: "lunch_start",
  pause: "lunch_start",
  lunch_end: "lunch_end",
  break_end: "lunch_end",
  return: "lunch_end",
  back: "lunch_end",
}

const NEXT_STATUS: Record<AttendanceAction, LiveStatus> = {
  shift_in: "in",
  shift_out: "out",
  lunch_start: "pause",
  lunch_end: "back",
}

function todayCasablanca() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Casablanca",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

function normalizeAction(value: unknown): AttendanceAction | null {
  return ACTION_ALIASES[String(value || "").trim().toLowerCase()] || null
}

function canUseNewEngineError(message: string) {
  const m = message.toLowerCase()
  return !(
    m.includes("does not exist") ||
    m.includes("could not find") ||
    m.includes("schema cache") ||
    m.includes("column") ||
    m.includes("relation") ||
    m.includes("foreign key") ||
    m.includes("violates")
  )
}

async function resolveUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const appUser = (await getCurrentUser().catch(() => null)) as { id?: string } | null
  if (appUser?.id) return appUser.id

  const { data } = await supabase.auth.getUser().catch(() => ({ data: null as any }))
  return data?.user?.id || null
}

async function resolveStaff(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: direct } = await supabase
    .from("hr_staff_profiles")
    .select("id, full_name, name, department, position, user_id")
    .eq("user_id", userId)
    .maybeSingle()
    .catch(() => ({ data: null }))

  if (direct) return direct as AnyRecord

  const { data: appUser } = await supabase
    .from("app_users")
    .select("id, full_name, name, email, department, job_title")
    .eq("id", userId)
    .maybeSingle()
    .catch(() => ({ data: null }))

  return appUser
    ? {
        id: null,
        user_id: userId,
        full_name: appUser.full_name || appUser.name || appUser.email || "Staff member",
        department: appUser.department || null,
        position: appUser.job_title || null,
      }
    : { id: null, user_id: userId, full_name: "Staff member" }
}

function applyActionToPatch(action: AttendanceAction, now: string, mode: "new" | "legacy") {
  if (mode === "new") {
    if (action === "shift_in") return { check_in: now, check_out: null, lunch_start: null, lunch_end: null, status: "in_progress" }
    if (action === "shift_out") return { check_out: now, status: "completed" }
    if (action === "lunch_start") return { lunch_start: now, status: "in_progress" }
    return { lunch_end: now, status: "in_progress" }
  }

  if (action === "shift_in") return { punch_in_at: now, punch_out_at: null, status: "in_progress" }
  if (action === "shift_out") return { punch_out_at: now, status: "completed" }
  if (action === "lunch_start") return { break_started_at: now, status: "on_break" }
  return { break_ended_at: now, status: "in_progress" }
}

async function tryNewHrAttendance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: { userId: string; action: AttendanceAction; now: string; day: string; source: string; staff: AnyRecord },
) {
  const base = {
    user_id: input.userId,
    staff_profile_id: input.staff?.id || null,
    staff_name: input.staff?.full_name || input.staff?.name || "Staff member",
    attendance_date: input.day,
    source: input.source,
    validation_status: "auto_synced",
    updated_at: input.now,
    ...applyActionToPatch(input.action, input.now, "new"),
  }

  const { data: existing, error: readError } = await supabase
    .from("hr_attendance_records")
    .select("id")
    .eq("user_id", input.userId)
    .eq("attendance_date", input.day)
    .maybeSingle()

  if (readError) throw readError

  if (existing?.id) {
    const { error } = await supabase.from("hr_attendance_records").update(base).eq("id", existing.id)
    if (error) throw error
    return existing.id as string
  }

  const { data, error } = await supabase
    .from("hr_attendance_records")
    .insert({ ...base, created_at: input.now })
    .select("id")
    .single()

  if (error) throw error
  return data?.id as string | undefined
}

async function tryLegacyHrAttendanceRecords(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: { userId: string; action: AttendanceAction; now: string; day: string; source: string; staff: AnyRecord },
) {
  const staffId = input.staff?.id || input.userId
  const base = {
    user_id: input.userId,
    staff_id: staffId,
    work_date: input.day,
    source_table: input.source,
    updated_at: input.now,
    ...applyActionToPatch(input.action, input.now, "legacy"),
  }

  const { data: existing, error: readError } = await supabase
    .from("hr_attendance_records")
    .select("id")
    .eq("staff_id", staffId)
    .eq("work_date", input.day)
    .maybeSingle()

  if (readError) throw readError

  if (existing?.id) {
    const { error } = await supabase.from("hr_attendance_records").update(base).eq("id", existing.id)
    if (error) throw error
    return existing.id as string
  }

  const { data, error } = await supabase
    .from("hr_attendance_records")
    .insert({ ...base, created_at: input.now })
    .select("id")
    .single()

  if (error) throw error
  return data?.id as string | undefined
}

async function tryLegacyHrAttendance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: { userId: string; action: AttendanceAction; now: string; day: string; source: string; staff: AnyRecord },
) {
  const staffId = input.staff?.id || input.userId
  const base = {
    user_id: input.userId,
    staff_id: staffId,
    work_date: input.day,
    source: input.source,
    updated_at: input.now,
    ...applyActionToPatch(input.action, input.now, "legacy"),
  }

  const { data: existing, error: readError } = await supabase
    .from("hr_attendance")
    .select("id")
    .eq("staff_id", staffId)
    .eq("work_date", input.day)
    .maybeSingle()

  if (readError) throw readError

  if (existing?.id) {
    const { error } = await supabase.from("hr_attendance").update(base).eq("id", existing.id)
    if (error) throw error
    return existing.id as string
  }

  const { data, error } = await supabase
    .from("hr_attendance")
    .insert({ ...base, created_at: input.now })
    .select("id")
    .single()

  if (error) throw error
  return data?.id as string | undefined
}

async function safeLog(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: { userId: string; staff: AnyRecord; action: AttendanceAction; now: string; source: string },
) {
  await supabase
    .from("app_attendance_logs")
    .insert({
      user_id: input.userId,
      staff_profile_id: input.staff?.id || null,
      action: input.action,
      source: input.source,
      validation_status: "compatibility_accepted",
      created_at: input.now,
    })
    .then(() => null, () => null)

  await supabase
    .from("hr_activity_timeline")
    .insert({
      entity_type: "attendance",
      entity_id: input.staff?.id || input.userId,
      title: `Attendance ${input.action.replaceAll("_", " ")}`,
      description: `${input.staff?.full_name || input.staff?.name || "Staff member"} used ${input.source}.`,
      actor_id: input.userId,
      created_at: input.now,
    })
    .then(() => null, () => null)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json().catch(() => ({}))
  const action = normalizeAction(body.action)

  if (!action) {
    return NextResponse.json({ ok: false, error: "Invalid attendance action" }, { status: 400 })
  }

  const userId = await resolveUserId(supabase)
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized attendance session. Please refresh and sign in again." }, { status: 401 })
  }

  const source = String(body.source || "overhead_panel")

  // First try the full Phase 08 enterprise engine. This preserves all hardening when schema is ready.
  try {
    const result = await syncPunchToHrAttendance({
      userId,
      action,
      note: body.note || null,
      source,
      force: Boolean(body.force),
      deviceContext: {
        userAgent: request.headers.get("user-agent"),
        origin: request.headers.get("origin"),
        referer: request.headers.get("referer"),
      },
    })
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    // Business-rule errors should still be shown instead of silently bypassed.
    if (canUseNewEngineError(message)) {
      return NextResponse.json({ ok: false, error: message }, { status: 409 })
    }
  }

  // Compatibility fallback for databases that still have mixed HR attendance column names.
  const now = new Date().toISOString()
  const day = todayCasablanca()
  const staff = await resolveStaff(supabase, userId)
  const attempts: string[] = []

  for (const writer of [tryNewHrAttendance, tryLegacyHrAttendanceRecords, tryLegacyHrAttendance]) {
    try {
      const recordId = await writer(supabase, { userId, action, now, day, source, staff })
      await safeLog(supabase, { userId, staff, action, now, source })
      return NextResponse.json({
        ok: true,
        compatibilityMode: true,
        attendance_date: day,
        action,
        status: NEXT_STATUS[action],
        message: `Attendance synced from overhead panel.${recordId ? ` Record ${recordId}.` : ""}`,
        record: { id: recordId || null },
        canPunch: {
          shift_in: action === "shift_out",
          shift_out: action !== "shift_out" && action !== "lunch_start",
          lunch_start: action === "shift_in" || action === "lunch_end",
          lunch_end: action === "lunch_start",
        },
        workedMinutes: 0,
        breakMinutes: 0,
      })
    } catch (error) {
      attempts.push(error instanceof Error ? error.message : String(error))
    }
  }

  return NextResponse.json(
    {
      ok: false,
      error: "Attendance punch failed after compatibility fallback.",
      details: attempts.slice(-3),
    },
    { status: 409 },
  )
}
