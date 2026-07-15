import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return null

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

function clean(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : ""
}

function uniqRows(rows: any[]) {
  const seen = new Set<string>()
  const out: any[] = []

  for (const row of rows) {
    const key = String(row?.id || `${row?.resource_id}-${row?.employee_id}-${row?.employee_name}-${row?.course_title}`)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(row)
  }

  return out
}

function toTrainingStatus(status: string) {
  const v = clean(status).toLowerCase()

  if (["validé", "valide", "validated", "approved", "passed", "complété", "complete", "completed"].some((x) => v.includes(x))) return "completed"
  if (["retard", "delayed", "overdue"].some((x) => v.includes(x))) return "delayed"
  if (["progress", "cours", "in_progress"].some((x) => v.includes(x))) return "in_progress"
  if (["planifié", "planned", "scheduled", "en attente", "pending"].some((x) => v.includes(x))) return "scheduled"
  if (["failed", "échoué", "echec", "retake"].some((x) => v.includes(x))) return "failed"

  return "not_started"
}

function scoreFromAction(action: any) {
  const amount = clean(action?.amount)
  const notes = clean(action?.notes)
  const raw = amount || notes.match(/score\s*[:=]?\s*([0-9]{1,3})/i)?.[1] || ""
  const n = Number(String(raw).replace("%", ""))

  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null
}

export async function GET(request: Request) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, rows: [], error: "Supabase env missing" }, { status: 200 })
  }

  const db = supabase

  const url = new URL(request.url)
  const employeeId = clean(url.searchParams.get("employeeId"))
  const employeeName = clean(url.searchParams.get("employeeName"))
  const email = clean(url.searchParams.get("email"))

  const rows: any[] = []

  async function readByEmployeeId(value: string) {
    if (!value) return
    const { data } = await db
      .from("hr_training_course_assignments")
      .select("*")
      .eq("employee_id", value)
      .order("due_at", { ascending: true })
      .limit(200)

    if (Array.isArray(data)) rows.push(...data)
  }

  async function readByEmployeeName(value: string) {
    if (!value) return
    const { data } = await db
      .from("hr_training_course_assignments")
      .select("*")
      .ilike("employee_name", `%${value}%`)
      .order("due_at", { ascending: true })
      .limit(200)

    if (Array.isArray(data)) rows.push(...data)
  }

  await readByEmployeeId(employeeId)
  await readByEmployeeId(email)
  await readByEmployeeName(employeeName)

  return NextResponse.json({
    ok: true,
    rows: uniqRows(rows),
  })
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase env missing" }, { status: 200 })
  }

  const body = await request.json().catch(() => ({}))
  const employeeId = clean(body.employeeId)
  const employeeName = clean(body.employeeName)
  const email = clean(body.email)
  const actions = Array.isArray(body.actions) ? body.actions : []

  const results: any[] = []

  for (const action of actions) {
    if (clean(action?.category) !== "training") continue

    const actionId = clean(action?.id)
    const assignmentId = actionId.startsWith("training-sync-") ? actionId.replace("training-sync-", "") : ""
    const status = toTrainingStatus(clean(action?.status))
    const score = scoreFromAction(action)
    const dueDate = clean(action?.due_date)
    const notes = clean(action?.notes)

    const payload = {
      employee_id: employeeId || email || null,
      employee_name: employeeName || null,
      course_title: clean(action?.title) || "Employee 360 training action",
      trainer_name: clean(action?.owner) || "HR AngelCare",
      status,
      score_percent: score,
      due_at: dueDate ? `${dueDate}T23:59:00` : null,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    }

    if (assignmentId) {
      const { data, error } = await supabase
        .from("hr_training_course_assignments")
        .update(payload)
        .eq("id", assignmentId)
        .select("*")
        .maybeSingle()

      results.push({ id: assignmentId, ok: !error, data, error: error?.message })
    } else {
      const { data, error } = await supabase
        .from("hr_training_course_assignments")
        .insert({
          ...payload,
          resource_id: `employee-360-${employeeId || email || employeeName || Date.now()}`,
          position_title: clean(body.positionTitle) || "Employee 360",
          pass_score: 75,
          attempt_count: 0,
          session_mode: "employee_360",
        })
        .select("*")
        .maybeSingle()

      results.push({ ok: !error, data, error: error?.message })
    }
  }

  return NextResponse.json({ ok: true, results })
}
