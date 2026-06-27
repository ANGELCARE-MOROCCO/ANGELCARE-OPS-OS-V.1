import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type AnyRecord = Record<string, any>

const SOURCES = [
  { table: 'mission_dossiers', role: 'primary_dossier_candidate' },
  { table: 'carelink_mission_dossiers', role: 'primary_dossier_candidate' },
  { table: 'carelink_missions', role: 'mission_candidate' },
  { table: 'carelink_ops_missions', role: 'mission_candidate' },
  { table: 'missions', role: 'mission_candidate' },
  { table: 'carelink_submissions', role: 'submission_candidate' },
  { table: 'carelink_schedule_events', role: 'schedule_projection' },
  { table: 'carelink_dispatch_assignments', role: 'dispatch_projection' },
  { table: 'caregivers', role: 'caregiver_source' },
  { table: 'carelink_mission_workflow_states', role: 'mission_workflow_overlay' },
  { table: 'carelink_mission_action_logs', role: 'mission_audit_logs' },
  { table: 'carelink_mission_notifications', role: 'mission_notifications' },
]

const FIELD_GROUPS: Record<string, string[]> = {
  identity: ['id', 'uuid', 'code', 'mission_code', 'dossier_number', 'dossier_id', 'reference'],
  client: ['client_name', 'family_name', 'parent_name', 'customer_name', 'client_city', 'client_address'],
  service: ['title', 'service_type', 'service_category', 'mission_type', 'category', 'designation'],
  dates: ['start_at', 'end_at', 'scheduled_start_at', 'scheduled_end_at', 'mission_date', 'scheduled_date', 'service_date', 'start_time', 'end_time'],
  lifecycle: ['status', 'current_status', 'lifecycle_status', 'dispatch_status', 'validation_status', 'report_status', 'payment_status'],
  assignment: ['caregiver_id', 'agent_id', 'assignee_id', 'primary_caregiver_id', 'caregiver_name', 'agent_name', 'assigned_agent'],
  route: ['route_from', 'route_to', 'departure_zone', 'arrival_zone', 'transport_mode', 'transport', 'city', 'zone'],
  finance: ['hourly_rate', 'mission_rate', 'allowance_total', 'payment_status', 'amount', 'currency'],
  dossierSections: ['routes', 'sub_missions', 'program_lines', 'allowances', 'parameters', 'transport_details', 'mobile_brief'],
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
      primaryDossiers: activeSources.filter((x: any) => x.role === 'primary_dossier_candidate'),
      missionRecords: activeSources.filter((x: any) => String(x.role).includes('mission') || String(x.role).includes('submission')),
      dispatchProjection: activeSources.filter((x: any) => x.role === 'dispatch_projection'),
      scheduleProjection: activeSources.filter((x: any) => x.role === 'schedule_projection'),
      workflowOverlay: activeSources.filter((x: any) => x.role === 'mission_workflow_overlay'),
    },
  })
}
