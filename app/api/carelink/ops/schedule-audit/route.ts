import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type AnyRecord = Record<string, any>

const SOURCES = [
  { table: 'carelink_schedule_events', role: 'schedule_manual_blocks' },
  { table: 'carelink_missions', role: 'missions_candidate' },
  { table: 'carelink_ops_missions', role: 'missions_candidate' },
  { table: 'mission_dossiers', role: 'mission_dossiers_candidate' },
  { table: 'carelink_mission_dossiers', role: 'mission_dossiers_candidate' },
  { table: 'missions', role: 'missions_candidate' },
  { table: 'carelink_submissions', role: 'submissions_candidate' },
  { table: 'caregivers', role: 'caregivers_source' },
  { table: 'carelink_agent_app_access', role: 'mobile_access' },
  { table: 'carelink_agent_roster_preferences', role: 'roster_preferences' },
  { table: 'carelink_agent_payment_configs', role: 'payment_config' },
  { table: 'carelink_agent_payment_validations', role: 'payment_validations' },
  { table: 'carelink_agent_training_plans', role: 'training_plans' },
]

const FIELD_GROUPS: Record<string, string[]> = {
  id: ['id', 'mission_id', 'dossier_id', 'uuid', 'code'],
  title: ['title', 'mission_title', 'service_title', 'service_type', 'mission_code', 'code'],
  start: ['start_at', 'starts_at', 'scheduled_start_at', 'mission_start_at', 'service_start_at', 'start_date', 'mission_date', 'scheduled_date', 'service_date', 'date'],
  end: ['end_at', 'ends_at', 'scheduled_end_at', 'mission_end_at', 'service_end_at', 'end_date', 'due_at', 'due_date'],
  status: ['status', 'current_status', 'lifecycle_status', 'validation_status', 'review_status', 'approval_status'],
  caregiver: ['caregiver_id', 'agent_id', 'assignee_id', 'primary_caregiver_id', 'caregiver_name', 'agent_name', 'assignee_name'],
  city: ['city', 'location_city', 'base_city', 'service_city', 'client_city'],
  zone: ['zone', 'location_zone', 'base_zone', 'service_zone', 'client_zone'],
  route: ['route_from', 'route_to', 'departure_zone', 'arrival_zone', 'transport_mode', 'transport'],
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

  const results = await Promise.all(
    SOURCES.map(async (source) => {
      try {
        const { data, error, count } = await (supabase as any)
          .from(source.table)
          .select('*', { count: 'exact' })
          .limit(3)

        if (error) {
          return {
            table: source.table,
            role: source.role,
            exists: false,
            count: 0,
            error: error.message,
            sampleKeys: [],
            mappedFields: {},
          }
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

  const activeSources = results.filter((item: any) => item.exists && item.count > 0)

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    sourceOfTruthCandidates: activeSources,
    allSources: results,
    recommendation: {
      missions: activeSources.filter((x: any) => String(x.role).includes('missions') || String(x.role).includes('dossier') || String(x.role).includes('submission')),
      caregivers: activeSources.filter((x: any) => x.role === 'caregivers_source'),
      schedules: activeSources.filter((x: any) => x.role === 'schedule_manual_blocks'),
    },
  })
}
