import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type AnyRecord = Record<string, any>

const SOURCES = [
  { table: 'carelink_dispatch_assignments', role: 'dispatch_assignment_overlay' },
  { table: 'carelink_missions', role: 'mission_source_candidate' },
  { table: 'carelink_ops_missions', role: 'mission_source_candidate' },
  { table: 'mission_dossiers', role: 'mission_dossier_candidate' },
  { table: 'carelink_mission_dossiers', role: 'mission_dossier_candidate' },
  { table: 'missions', role: 'mission_source_candidate' },
  { table: 'carelink_submissions', role: 'submission_source_candidate' },
  { table: 'caregivers', role: 'caregiver_source' },
  { table: 'carelink_agent_app_access', role: 'mobile_access_source' },
  { table: 'carelink_agent_roster_preferences', role: 'roster_source' },
  { table: 'carelink_schedule_events', role: 'schedule_source' },
  { table: 'carelink_dispatch_notifications', role: 'dispatch_notifications' },
  { table: 'carelink_dispatch_action_logs', role: 'dispatch_audit_log' },
]

const FIELD_GROUPS: Record<string, string[]> = {
  missionIdentity: ['id', 'mission_id', 'dossier_id', 'uuid', 'code', 'mission_code'],
  missionDetails: ['title', 'mission_title', 'service_title', 'service_type', 'mission_type', 'family_name', 'client_name', 'parent_name'],
  timing: ['start_at', 'scheduled_start_at', 'mission_start_at', 'start_date', 'mission_date', 'scheduled_date', 'end_at', 'scheduled_end_at', 'mission_end_at'],
  status: ['status', 'current_status', 'lifecycle_status', 'dispatch_status', 'assignment_status', 'validation_status'],
  assignment: ['caregiver_id', 'agent_id', 'assignee_id', 'primary_caregiver_id', 'caregiver_name', 'agent_name', 'assignee_name'],
  route: ['route_from', 'route_to', 'departure_zone', 'arrival_zone', 'transport_mode', 'transport'],
  geography: ['city', 'zone', 'location_city', 'location_zone', 'service_city', 'service_zone'],
}

function matchedFields(keys: string[]) {
  const out: Record<string, string[]> = {}
  Object.entries(FIELD_GROUPS).forEach(([group, candidates]) => {
    out[group] = candidates.filter((key) => keys.includes(key))
  })
  return out
}

export async function GET() {
  const supabase = await createClient()

  const allSources = await Promise.all(
    SOURCES.map(async (source) => {
      try {
        const { data, error, count } = await (supabase as any)
          .from(source.table)
          .select('*', { count: 'exact' })
          .limit(3)

        if (error) {
          return { table: source.table, role: source.role, exists: false, count: 0, error: error.message, sampleKeys: [], mappedFields: {} }
        }

        const rows = Array.isArray(data) ? data : []
        const keys = Array.from(new Set(rows.flatMap((row: AnyRecord) => Object.keys(row || {})))).sort()

        return {
          table: source.table,
          role: source.role,
          exists: true,
          count: count ?? rows.length,
          sampleRows: rows.length,
          sampleKeys: keys,
          mappedFields: matchedFields(keys),
        }
      } catch (error) {
        return {
          table: source.table,
          role: source.role,
          exists: false,
          count: 0,
          error: error instanceof Error ? error.message : 'Unknown audit error',
          sampleKeys: [],
          mappedFields: {},
        }
      }
    }),
  )

  const active = allSources.filter((source: any) => source.exists && source.count > 0)

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    sourceOfTruthCandidates: active,
    allSources,
    recommendation: {
      missions: active.filter((x: any) => String(x.role).includes('mission') || String(x.role).includes('dossier') || String(x.role).includes('submission')),
      caregivers: active.filter((x: any) => x.role === 'caregiver_source'),
      assignments: active.filter((x: any) => x.role === 'dispatch_assignment_overlay'),
      notifications: active.filter((x: any) => x.role === 'dispatch_notifications'),
    },
  })
}
