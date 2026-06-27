import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type AnyRecord = Record<string, any>

const SOURCES = [
  { table: 'caregivers', role: 'caregiver_profile_source' },
  { table: 'carelink_agent_app_access', role: 'mobile_access_source' },
  { table: 'carelink_agent_roster_preferences', role: 'roster_preferences_source' },
  { table: 'carelink_agent_payment_configs', role: 'payment_config_source' },
  { table: 'carelink_agent_payment_validations', role: 'payment_validation_source' },
  { table: 'carelink_agent_training_plans', role: 'training_plan_source' },
  { table: 'carelink_missions', role: 'mission_history_candidate' },
  { table: 'carelink_ops_missions', role: 'mission_history_candidate' },
  { table: 'mission_dossiers', role: 'mission_dossier_candidate' },
  { table: 'carelink_mission_dossiers', role: 'mission_dossier_candidate' },
  { table: 'missions', role: 'mission_history_candidate' },
  { table: 'carelink_submissions', role: 'submission_candidate' },
  { table: 'carelink_agent_notifications', role: 'agent_notifications' },
  { table: 'carelink_agent_action_logs', role: 'agent_action_audit' },
]

const FIELD_GROUPS: Record<string, string[]> = {
  identity: ['id', 'full_name', 'name', 'display_name', 'phone', 'mobile', 'email', 'city', 'zone', 'status', 'current_status'],
  skills: ['skills', 'skill_tags', 'competencies', 'languages', 'mission_types', 'academy_certified', 'special_needs_capable'],
  mobile: ['auth_user_id', 'email', 'access_status', 'access_level', 'mobile_enabled', 'can_view_missions', 'can_accept_missions', 'can_submit_reports', 'can_view_payments'],
  roster: ['preferred_days', 'preferred_time_blocks', 'preferred_zones', 'blocked_days', 'max_daily_hours', 'max_weekly_hours', 'max_distance_km'],
  finance: ['hourly_rate', 'hourly_rate_mad', 'payment_mode', 'currency', 'allowance_rules', 'bank_or_wallet', 'finance_status', 'amount', 'validated_at'],
  training: ['training_path', 'required_tracks', 'completed_tracks', 'training_status', 'compliance_status'],
  missions: ['mission_id', 'caregiver_id', 'agent_id', 'assignee_id', 'start_at', 'end_at', 'mission_date', 'status', 'validation_status'],
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

  const activeSources = results.filter((item: any) => item.exists && item.count > 0)

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    sourceOfTruthCandidates: activeSources,
    allSources: results,
    recommendation: {
      caregivers: activeSources.filter((x: any) => x.role === 'caregiver_profile_source'),
      mobileAccess: activeSources.filter((x: any) => x.role === 'mobile_access_source'),
      roster: activeSources.filter((x: any) => x.role === 'roster_preferences_source'),
      finance: activeSources.filter((x: any) => x.role.includes('payment')),
      training: activeSources.filter((x: any) => x.role === 'training_plan_source'),
      missions: activeSources.filter((x: any) => String(x.role).includes('mission') || String(x.role).includes('submission')),
      notifications: activeSources.filter((x: any) => x.role === 'agent_notifications'),
    },
  })
}
