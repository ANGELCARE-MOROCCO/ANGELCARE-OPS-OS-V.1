import { createClient } from '@/lib/supabase/server'
import type { MissionControlRecord, MissionDossier, MissionEvent, MissionRow } from './types'
import { getServiceCharacteristic } from './service-characteristics'

import { resolvedMissionCode } from '@/lib/missions/mission-codes'

function applyLiveMissionDbFilter(query: any) {
  return query
    .or('is_archived.is.null,is_archived.eq.false')
    .not('status', 'in', '(deleted,archived,cancelled)')
    .not('lifecycle_stage', 'in', '(deleted,archived,cancelled)')
    .not('dossier_status', 'in', '(deleted,archived,cancelled)')
}

function liveMissionRowVisible(row: any) {
  if (!row) return false
  const status = String(row.status || row.lifecycle_stage || row.lifecycleStage || row.dossier_status || row.dossierStatus || '').toLowerCase()
  if (row.is_archived === true || row.isArchived === true) return false
  if (status.includes('deleted') || status.includes('archived') || status.includes('cancelled')) return false
  return true
}

function filterLiveMissionRows<T = any>(rows: T[] | null | undefined): T[] {
  return Array.isArray(rows) ? rows.filter((row: any) => liveMissionRowVisible(row)) : []
}



function __carelinkMissionVisible(row: any) {
  if (!row) return false
  const status = String(row.status || row.lifecycle_stage || row.lifecycleStage || row.dossier_status || row.dossierStatus || '').toLowerCase()
  if (row.is_archived === true || row.isArchived === true) return false
  if (status.includes('deleted') || status.includes('cancelled') || status.includes('archived')) return false
  return true
}

function __carelinkFilterVisibleMissions<T = any>(rows: T[] | null | undefined): T[] {
  return Array.isArray(rows) ? rows.filter((row: any) => __carelinkMissionVisible(row)) : []
}


function __carelinkMissionIsVisible(row: any) {
  if (!row) return false
  const status = String(row.status || row.lifecycle_stage || row.lifecycleStage || row.dossier_status || row.dossierStatus || '').toLowerCase()
  if (row.is_archived === true || row.isArchived === true) return false
  if (status.includes('deleted') || status.includes('archived') || status.includes('cancelled')) return false
  return true
}

function text(value: unknown, fallback = '—'): string {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function personName(obj: Record<string, unknown> | null | undefined, fallback: string): string {
  if (!obj) return fallback
  return text(obj.full_name || obj.name || obj.display_name || obj.family_name || obj.primary_contact_name, fallback)
}

export function missionToControlRecord(row: MissionRow, children: MissionRow[] = []): MissionControlRecord {
  const serviceType = text(row.service_type, 'Service AngelCare')
  const characteristic = getServiceCharacteristic(serviceType)
  const missionKind = (row.mission_kind || 'single') as MissionControlRecord['missionKind']
  const completed = children.filter((child) => child.status === 'completed' || child.lifecycle_stage === 'completed').length
  const upcoming = children.filter((child) => child.status !== 'completed' && child.status !== 'cancelled').length
  return {
    id: Number(row.id),
    code: resolvedMissionCode(row as any, { total: children.length }),
    title: missionKind === 'dossier' ? `Dossier · ${serviceType}` : serviceType,
    missionKind,
    status: text(row.status, 'draft'),
    lifecycleStage: text(row.lifecycle_stage, text(row.status, 'draft')),
    serviceType,
    serviceFamily: text(row.service_family, characteristic.serviceFamily),
    dateLabel: text(row.mission_date, 'Non planifiée'),
    timeLabel: [row.start_time, row.end_time].filter(Boolean).join(' → ') || 'Horaire à définir',
    city: text(row.city, 'Ville non définie'),
    zone: text(row.zone, 'Zone non définie'),
    familyName: personName(row.families as Record<string, unknown> | null, 'Famille non liée'),
    caregiverName: personName(row.caregivers as Record<string, unknown> | null, row.caregiver_id ? `Caregiver #${row.caregiver_id}` : 'Non assignée'),
    caregiverId: row.caregiver_id ? Number(row.caregiver_id) : null,
    familyId: row.family_id ? Number(row.family_id) : null,
    urgency: text(row.urgency, 'normal'),
    priority: text(row.ops_priority, text(row.urgency, 'normal')),
    readinessStatus: text(row.readiness_status, 'pending'),
    validationStatus: text(row.validation_status, 'pending'),
    reportStatus: text(row.report_status, 'not_required'),
    riskLevel: text(row.risk_level, 'normal'),
    subMissionCount: children.length,
    completedSubMissionCount: completed,
    upcomingSubMissionCount: upcoming,
  }
}

export async function listMissionRows(filters: { includeArchived?: boolean; parentMissionId?: number | null } = {}): Promise<MissionRow[]> {
  const supabase = await createClient()
  let query = supabase
    .from('missions')
    .select('*')
    .or('is_archived.is.null,is_archived.eq.false')
    .not('status', 'in', '(deleted,archived,cancelled)')
    .not('lifecycle_stage', 'in', '(deleted,archived,cancelled)')
    .not('dossier_status', 'in', '(deleted,archived,cancelled)')
    .order('mission_date', { ascending: true, nullsFirst: false })
    .order('start_time', { ascending: true, nullsFirst: false })
    .limit(500)

  if (!filters.includeArchived) query = query.or('is_archived.is.null,is_archived.eq.false')
  if (typeof filters.parentMissionId === 'number') query = query.eq('parent_mission_id', filters.parentMissionId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return filterLiveMissionRows(data) as MissionRow[]
}

export async function listMissionControlRecords(): Promise<MissionControlRecord[]> {
  const rows = filterLiveMissionRows(await listMissionRows())
  const byParent = new Map<number, MissionRow[]>()
  rows.forEach((row) => {
    if (row.parent_mission_id) {
      const key = Number(row.parent_mission_id)
      byParent.set(key, [...(byParent.get(key) || []), row])
    }
  })
  return rows.map((row) => missionToControlRecord(row, byParent.get(Number(row.id)) || []))
}

export async function getMissionRow(id: number): Promise<MissionRow | null> {
  const supabase = await createClient()
  const { data, error } = await applyLiveMissionDbFilter(supabase.from('missions').select('*')).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data as MissionRow | null
}


export async function getMissionDossier(id: number): Promise<MissionDossier | null> {
  const supabase = await createClient()

  const sortRows = (rows: any[]) =>
    [...(Array.isArray(rows) ? rows : [])].sort((a, b) => {
      const av = Number(a?.sort_order ?? a?.line_order ?? a?.order ?? a?.occurrence_index ?? 0)
      const bv = Number(b?.sort_order ?? b?.line_order ?? b?.order ?? b?.occurrence_index ?? 0)
      if (av !== bv) return av - bv
      return String(a?.id ?? '').localeCompare(String(b?.id ?? ''))
    })

  const asArray = (value: any): any[] => {
    if (Array.isArray(value)) return value
    if (Array.isArray(value?.rows)) return value.rows
    if (Array.isArray(value?.items)) return value.items
    if (Array.isArray(value?.data)) return value.data
    return []
  }

  const readJson = (value: any) => {
    if (!value) return {}
    if (typeof value === 'object') return value
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return {}
      }
    }
    return {}
  }

  const fetchRows = async (table: string, ids: number[]) => {
    const cleanIds = ids.filter((item) => Number.isFinite(item))
    if (!cleanIds.length) return []

    const result = await supabase
      .from(table)
      .select('*')
      .in('mission_id', cleanIds)

    if (result.error) {
      console.warn(`Unable to load ${table} for mission dossier`, result.error.message)
      return []
    }

    return Array.isArray(result.data) ? result.data : []
  }

  const requestedResult = await supabase
    .from('missions')
    .select('*')
    .or('is_archived.is.null,is_archived.eq.false')
    .not('status', 'in', '(deleted,archived,cancelled)')
    .not('lifecycle_stage', 'in', '(deleted,archived,cancelled)')
    .not('dossier_status', 'in', '(deleted,archived,cancelled)')
    .neq('is_archived', true)
    .not('status', 'in', '(deleted,cancelled,archived)')
    .not('lifecycle_stage', 'in', '(deleted,cancelled,archived)')
    .not('dossier_status', 'in', '(deleted,cancelled,archived)')
    .eq('id', id)
    .maybeSingle()

  if (requestedResult.error || !requestedResult.data) return null

  const requestedMission: any = requestedResult.data
  const parentId = Number(
    requestedMission.parent_mission_id ||
    requestedMission.parentMissionId ||
    requestedMission.parent_id ||
    requestedMission.parentId ||
    requestedMission.id ||
    id
  )

  let parentMission: any = requestedMission

  if (Number.isFinite(parentId) && parentId !== id) {
    const parentResult = await supabase
      .from('missions')
      .select('*')
      .eq('id', parentId)
      .maybeSingle()

    if (!parentResult.error && parentResult.data) {
      parentMission = parentResult.data
    }
  }

  const childrenResult = Number.isFinite(parentId)
    ? await supabase
        .from('missions')
        .select('*')
        .neq('is_archived', true)
        .not('status', 'in', '(deleted,cancelled,archived)')
        .not('lifecycle_stage', 'in', '(deleted,cancelled,archived)')
        .not('dossier_status', 'in', '(deleted,cancelled,archived)')
        .or(`id.eq.${parentId},parent_mission_id.eq.${parentId}`)
    : { data: [requestedMission], error: null }

  const allMissionRows: any[] = Array.isArray(childrenResult.data) && !childrenResult.error
    ? childrenResult.data
    : [parentMission, requestedMission]

  const subMissions = allMissionRows.filter((row) => Number(row?.id) !== Number(parentMission?.id))
  const codedSubMissions = subMissions.map((row, index) => ({
    ...row,
    code: resolvedMissionCode(row, { index, total: subMissions.length }),
    missionCode: resolvedMissionCode(row, { index, total: subMissions.length }),
    mission_reference: resolvedMissionCode(row, { index, total: subMissions.length }),
  }))

  const missionIds = Array.from(new Set([
    Number(id),
    Number(parentId),
    Number(parentMission?.id),
    ...allMissionRows.map((row) => Number(row?.id)),
  ].filter((value) => Number.isFinite(value))))

  const [
    routesRows,
    allowanceRecords,
    programRows,
    parameterRows,
    parameterDayRows,
    reportRows,
  ] = await Promise.all([
    fetchRows('mission_routes', missionIds),
    fetchRows('mission_allowances', missionIds),
    fetchRows('mission_program_lines', missionIds),
    fetchRows('mission_parameters', missionIds),
    fetchRows('mission_parameter_days', missionIds),
    fetchRows('carelink_mission_reports', missionIds),
  ])

  const reports = [...reportRows].sort((a: any, b: any) =>
    String(b?.submitted_at || b?.created_at || '').localeCompare(String(a?.submitted_at || a?.created_at || ''))
  )

  const report = reports[0] || null
  const recurrenceRule = readJson(parentMission?.recurrence_rule || parentMission?.recurrenceRule)
  const liveEditSnapshot = readJson(recurrenceRule.liveEditSnapshot || recurrenceRule.live_edit_snapshot)

  const reportMetadata = readJson(report?.metadata)
  const reportMobileBrief = readJson(
    reportMetadata.mobileBrief ||
    reportMetadata.mobile_brief ||
    reportMetadata.brief ||
    reportMetadata.dossier ||
    reportMetadata.payload
  )

  const mobileBrief = Object.keys(liveEditSnapshot).length
    ? readJson(liveEditSnapshot.mobileBrief || liveEditSnapshot)
    : reportMobileBrief

  const allowanceRowsFromRecords = allowanceRecords.flatMap((record: any) => {
    const manualNotes = readJson(record?.manual_notes)
    const metadata = readJson(record?.metadata)
    const rows =
      asArray(manualNotes.rows).length ? asArray(manualNotes.rows) :
      asArray(manualNotes.allowances).length ? asArray(manualNotes.allowances) :
      asArray(metadata.rows).length ? asArray(metadata.rows) :
      asArray(metadata.allowances).length ? asArray(metadata.allowances) :
      []

    return rows.length ? rows : [record]
  })

  const snapshotRoutes = asArray(liveEditSnapshot.routes || mobileBrief.routes || mobileBrief.routeRows || mobileBrief.mission_routes || mobileBrief.transportRoutes)
  const snapshotAllowances = asArray(liveEditSnapshot.allowanceRows || liveEditSnapshot.allowances || mobileBrief.allowanceRows || mobileBrief.allowances || mobileBrief.payments || mobileBrief.compensations)
  const snapshotProgram = asArray(liveEditSnapshot.programLines || liveEditSnapshot.activities || mobileBrief.programLines || mobileBrief.program || mobileBrief.activities || mobileBrief.activityRows || mobileBrief.mission_program_lines)

  const routes = sortRows(snapshotRoutes.length ? snapshotRoutes : routesRows)
  const allowanceRows = sortRows(snapshotAllowances.length ? snapshotAllowances : allowanceRowsFromRecords)
  const programLines = sortRows(snapshotProgram.length ? snapshotProgram : programRows)

  const parameters =
    parameterRows.find((row: any) => Number(row?.mission_id) === Number(parentMission?.id)) ||
    parameterRows[0] ||
    null

  return {
    raw: parentMission,
    parent: parentMission,
    mission: parentMission,
    clickedMission: requestedMission,
    requestedMission,
    subMissions: typeof codedSubMissions !== 'undefined' ? codedSubMissions : subMissions,
    submissions: typeof codedSubMissions !== 'undefined' ? codedSubMissions : subMissions,
    routes,
    mission_routes: routes,
    allowances: allowanceRecords,
    mission_allowances: allowanceRecords,
    allowanceRows,
    mission_allowances_rows: allowanceRows,
    programLines,
    mission_program_lines: programLines,
    activities: programLines,
    parameters,
    parameterDays: sortRows(parameterDayRows),
    mission_parameter_days: sortRows(parameterDayRows),
    report,
    reports,
    mobileBrief,
    liveEditSnapshot,
  } as unknown as MissionDossier
}

export async function patchMission(id: number, patch: Record<string, unknown>): Promise<MissionRow> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('missions').update(patch).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  return data as MissionRow
}
