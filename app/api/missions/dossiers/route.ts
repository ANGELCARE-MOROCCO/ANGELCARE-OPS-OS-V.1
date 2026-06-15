import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { distributeMissionDossier } from '@/lib/missions/dossier-distribution'

import { resolvedMissionCode } from '@/lib/missions/mission-codes'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function parsePositiveIntId(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const text = String(value).trim()
  if (!text || text === 'null' || text === 'undefined' || text === 'NaN') return null
  const number = Number(text)
  return Number.isSafeInteger(number) && number > 0 ? number : null
}

function normalizeSessionIds(rows: unknown[]) {
  return rows.map((row: any) => ({
    ...row,
    caregiverId: parsePositiveIntId(row?.caregiverId ?? row?.caregiver_id),
  }))
}

async function ensureRowExists(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  id: number | null,
  label: string,
) {
  if (!id) return null

  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new Error(`${label} validation failed: ${error.message}`)
  }

  if (!data?.id) {
    throw new Error(`${label} #${id} does not exist in public.${table}. Refresh the modal options and select a live ${label.toLowerCase()}.`)
  }

  return id
}



export async function GET() {
  try {
    const { createClient } = await import('@supabase/supabase-js')

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      return Response.json({
        ok: false,
        error: 'Supabase env missing',
        missions: [],
        dossiers: [],
        records: [],
      }, { status: 200 })
    }

    const supabase = createClient(url, key, { auth: { persistSession: false } })

    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(250)

    if (error) throw error

    const missions = (data || []).map((row: any) => ({
      ...row,
      code: resolvedMissionCode(row),
      missionCode: resolvedMissionCode(row),
      mission_reference: resolvedMissionCode(row),
      title: row.service_type || row.designation || 'Mission dossier',
      serviceType: row.service_type || row.designation || 'Mission dossier',
      familyName: row.client_name || `Family #${row.family_id || '—'}`,
      clientName: row.client_name || `Family #${row.family_id || '—'}`,
      caregiverName: row.caregiver_id ? `Agent #${row.caregiver_id}` : 'Unassigned',
      agentName: row.caregiver_id ? `Agent #${row.caregiver_id}` : 'Unassigned',
      city: row.city || '—',
      zone: row.zone || '—',
      lifecycleStage: row.lifecycle_stage || row.status || 'created',
      dispatchStatus: row.dispatch_status || row.status || 'unassigned',
      status: row.status || row.lifecycle_stage || 'created',
      riskLevel: row.risk_level || 'normal',
      scheduledStart: row.scheduled_start || row.mission_date || row.created_at,
      scheduledEnd: row.scheduled_end || row.mission_date || row.created_at,
      createdAt: row.created_at,
    }))

    return Response.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      missions,
      dossiers: missions,
      records: missions,
      data: {
        missions,
        dossiers: missions,
        records: missions,
      },
      summary: {
        total: missions.length,
        assigned: missions.filter((m: any) => m.caregiver_id).length,
        unassigned: missions.filter((m: any) => !m.caregiver_id).length,
      },
    }, { status: 200 })
  } catch (error) {
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load missions',
      missions: [],
      dossiers: [],
      records: [],
    }, { status: 200 })
  }
}


export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const serviceType = String(body.serviceType || body.service_type || '').trim()

    if (!serviceType) {
      return NextResponse.json({ ok: false, error: 'serviceType is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const familyIdRaw = body.familyId ?? body.family_id ?? null
    const caregiverIdRaw = body.caregiverId ?? body.caregiver_id ?? null
    const backupCaregiverIdRaw = body.backupCaregiverId ?? body.backup_caregiver_id ?? null

    const familyId = parsePositiveIntId(familyIdRaw)
    const caregiverId = parsePositiveIntId(caregiverIdRaw)
    const backupCaregiverId = parsePositiveIntId(backupCaregiverIdRaw)

    if (familyIdRaw && !familyId) {
      return NextResponse.json({ ok: false, error: `Invalid familyId received: ${String(familyIdRaw)}` }, { status: 400 })
    }

    if (caregiverIdRaw && !caregiverId) {
      return NextResponse.json({ ok: false, error: `Invalid caregiverId received: ${String(caregiverIdRaw)}` }, { status: 400 })
    }

    if (backupCaregiverIdRaw && !backupCaregiverId) {
      return NextResponse.json({ ok: false, error: `Invalid backupCaregiverId received: ${String(backupCaregiverIdRaw)}` }, { status: 400 })
    }

    await ensureRowExists(supabase, 'families', familyId, 'Family')
    await ensureRowExists(supabase, 'caregivers', caregiverId, 'Caregiver')
    await ensureRowExists(supabase, 'caregivers', backupCaregiverId, 'Backup caregiver')

    const data = await distributeMissionDossier({
      requestId: body.requestId || body.request_id || null,
      familyId,
      caregiverId,
      backupCaregiverId,
      serviceType,
      missionDate: body.missionDate || body.mission_date || null,
      startTime: body.startTime || body.start_time || null,
      endTime: body.endTime || body.end_time || null,
      city: body.city || null,
      zone: body.zone || null,
      notes: body.notes || null,
      riskLevel: body.riskLevel || body.risk_level || null,
      urgency: body.urgency || null,
      internalProcedureLevel: body.internalProcedureLevel || body.internal_procedure_level || null,
      transportRequired: body.transportRequired || body.transport_required || null,
      language: body.language || null,
      requiredSkills: Array.isArray(body.requiredSkills)
        ? body.requiredSkills
        : Array.isArray(body.required_skills)
          ? body.required_skills
          : [],
      recurrenceType: body.recurrenceType || body.recurrence_type || null,
      recurrenceRule: typeof body.recurrenceRule === 'object' && body.recurrenceRule ? body.recurrenceRule : {},
      recurrenceStartDate: body.recurrenceStartDate || null,
      recurrenceEndDate: body.recurrenceEndDate || null,
      assignNow: Boolean(body.assignNow ?? body.assign_now),
      sessions: Array.isArray(body.sessions) ? normalizeSessionIds(body.sessions) : [],
      routes: Array.isArray(body.routes) ? body.routes : [],
      allowances: Array.isArray(body.allowances) ? body.allowances : [],
      activities: Array.isArray(body.activities) ? body.activities : [],
      parameters: typeof body.parameters === 'object' && body.parameters ? body.parameters : null,
    })

    return NextResponse.json(
      { ok: true, data: data.parent || data.mission || data, distribution: data },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Dossier creation failed' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
