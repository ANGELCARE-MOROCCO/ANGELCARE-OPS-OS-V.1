import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function emptyPayload() {
  return {
    ok: true,
    source: 'live',
    generatedAt: new Date(0).toISOString(),
    kpis: [],
    missions: [],
    dossiers: [],
    lanes: [],
    validation: [],
    risks: [],
    reports: [],
    audit: [],
    families: [],
    caregivers: [],
  }
}

function normalizeStatus(value: unknown) {
  return String(value || '').toLowerCase()
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: missions, error: missionsError } = await supabase
      .from('missions')
      .select('*')
      .order('mission_date', { ascending: true })
      .limit(250)

    if (missionsError) throw missionsError

    const rows = missions || []

    const familyIds = Array.from(
      new Set(rows.map((m: any) => m.family_id).filter(Boolean)),
    )

    const caregiverIds = Array.from(
      new Set(rows.map((m: any) => m.caregiver_id).filter(Boolean)),
    )

    const { data: families } = familyIds.length
      ? await supabase.from('families').select('*').in('id', familyIds)
      : { data: [] as any[] }

    const { data: caregivers } = caregiverIds.length
      ? await supabase.from('caregivers').select('*').in('id', caregiverIds)
      : { data: [] as any[] }

    const familyById = new Map((families || []).map((row: any) => [row.id, row]))
    const caregiverById = new Map((caregivers || []).map((row: any) => [row.id, row]))

    const records = rows.map((mission: any) => ({
      ...mission,
      family: mission.family_id ? familyById.get(mission.family_id) || null : null,
      caregiver: mission.caregiver_id ? caregiverById.get(mission.caregiver_id) || null : null,
    }))

    const dossiers = records.filter((m: any) => normalizeStatus(m.mission_kind) === 'dossier')

    const lanes = [
      {
        key: 'draft',
        label: 'Created',
        items: records.filter((m: any) => ['draft', 'created'].includes(normalizeStatus(m.status))),
      },
      {
        key: 'assigned',
        label: 'Assigned',
        items: records.filter((m: any) => normalizeStatus(m.status) === 'assigned'),
      },
      {
        key: 'confirmed',
        label: 'Accepted',
        items: records.filter((m: any) => ['confirmed', 'accepted'].includes(normalizeStatus(m.status))),
      },
      {
        key: 'in_progress',
        label: 'In Progress',
        items: records.filter((m: any) => normalizeStatus(m.status) === 'in_progress'),
      },
      {
        key: 'validation',
        label: 'Validation',
        items: records.filter((m: any) => normalizeStatus(m.validation_status) === 'pending'),
      },
      {
        key: 'completed',
        label: 'Closed',
        items: records.filter((m: any) => normalizeStatus(m.status) === 'completed'),
      },
    ]

    return NextResponse.json(
      {
        ...emptyPayload(),
        generatedAt: new Date().toISOString(),
        missions: records,
        dossiers,
        lanes,
        families: families || [],
        caregivers: caregivers || [],
        kpis: [
          { key: 'total', label: 'Total Missions', value: records.length },
          { key: 'dossiers', label: 'Dossiers', value: dossiers.length },
          { key: 'unassigned', label: 'Unassigned', value: records.filter((m: any) => !m.caregiver_id).length },
          { key: 'validation', label: 'Pending Validation', value: records.filter((m: any) => normalizeStatus(m.validation_status) === 'pending').length },
        ],
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return NextResponse.json(
      {
        ...emptyPayload(),
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown missions control-center error',
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
