import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type AnyRecord = Record<string, any>

const SOURCES = [
  { table: 'missions', role: 'canonical_missions' },
  { table: 'carelink_mission_workflow_states', role: 'mission_workflow' },
  { table: 'carelink_mission_action_logs', role: 'mission_action_logs' },
  { table: 'carelink_mission_notifications', role: 'mission_notifications' },
  { table: 'carelink_dispatch_assignments', role: 'dispatch_assignments' },
  { table: 'carelink_dispatch_action_logs', role: 'dispatch_action_logs' },
  { table: 'carelink_dispatch_notifications', role: 'dispatch_notifications' },
  { table: 'carelink_schedule_events', role: 'schedule_manual_blocks' },
  { table: 'carelink_schedule_workflow_states', role: 'schedule_workflow' },
  { table: 'carelink_schedule_action_logs', role: 'schedule_action_logs' },
  { table: 'carelink_schedule_notifications', role: 'schedule_notifications' },
  { table: 'caregivers', role: 'caregivers' },
  { table: 'carelink_agent_app_access', role: 'agent_mobile_access' },
  { table: 'carelink_agent_notifications', role: 'agent_notifications' },
  { table: 'carelink_agent_action_logs', role: 'agent_action_logs' },
]

const FIELD_GROUPS: Record<string, string[]> = {
  missionIdentity: ['id', 'mission_code', 'mission_reference', 'dossier_reference'],
  missionDates: ['mission_date', 'start_time', 'end_time', 'scheduled_start', 'scheduled_end', 'actual_start_at', 'actual_end_at'],
  missionLifecycle: ['status', 'lifecycle_stage', 'dispatch_status', 'validation_status', 'report_status', 'readiness_status', 'sla_status'],
  assignment: ['caregiver_id', 'backup_caregiver_id', 'staff_id', 'staff_status'],
  territory: ['city', 'zone', 'home_address', 'personal_address'],
  route: ['route_lines', 'transport_config'],
  dossier: ['program_lines', 'allowance_config', 'parameter_config', 'missionnaire_data'],
  workflow: ['mission_id', 'source_type', 'source_id', 'current_status', 'last_action', 'canonical_bridge_status'],
  notifications: ['audience_type', 'is_read', 'delivery_status', 'priority', 'action_type'],
}

function fields(keys: string[]) {
  return Object.fromEntries(
    Object.entries(FIELD_GROUPS).map(([group, candidates]) => [
      group,
      candidates.filter((key) => keys.includes(key)),
    ]),
  )
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
          mappedFields: fields(keys),
        }
      } catch (error) {
        return {
          table: source.table,
          role: source.role,
          exists: false,
          count: 0,
          error: error instanceof Error ? error.message : 'Unknown overview audit error',
          sampleKeys: [],
          mappedFields: {},
        }
      }
    }),
  )

  const activeSources = allSources.filter((source: any) => source.exists && source.count > 0)

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    sourceOfTruth: {
      missions: activeSources.find((source: any) => source.table === 'missions') || null,
      dispatch: activeSources.find((source: any) => source.table === 'carelink_dispatch_assignments') || null,
      schedule: activeSources.find((source: any) => source.table === 'carelink_schedule_events') || null,
      agents: activeSources.find((source: any) => source.table === 'caregivers') || null,
    },
    activeSources,
    allSources,
  })
}
