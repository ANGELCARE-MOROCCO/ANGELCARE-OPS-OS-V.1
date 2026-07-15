export type MissionCodeLike = {
  id?: string | number | null
  code?: string | null
  missionCode?: string | null
  mission_code?: string | null
  missionReference?: string | null
  mission_reference?: string | null
  dossierReference?: string | null
  dossier_reference?: string | null
  parentMissionId?: string | number | null
  parent_mission_id?: string | number | null
  missionKind?: string | null
  mission_kind?: string | null
  occurrenceIndex?: string | number | null
  occurrence_index?: string | number | null
  order?: string | number | null
  sort_order?: string | number | null
  line_order?: string | number | null
  recurrenceRule?: unknown
  recurrence_rule?: unknown
}

export function parseMissionJson(value: unknown): Record<string, any> {
  if (!value) return {}
  if (typeof value === 'object') return value as Record<string, any>
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }
  return {}
}

export function stripMissionCodeSuffix(value: unknown) {
  return String(value || '').trim().replace(/\*(S|\d+)$/i, '')
}

export function cleanMissionCode(value: unknown) {
  const text = String(value || '').trim()
  if (!text || /^pending/i.test(text) || /^draft$/i.test(text)) return ''
  return text
}

export function missionBaseCode(row: MissionCodeLike | null | undefined) {
  const item: any = row || {}
  const recurrenceRule = parseMissionJson(item.recurrence_rule || item.recurrenceRule)
  const snapshot = parseMissionJson(recurrenceRule.liveEditSnapshot || recurrenceRule.live_edit_snapshot)

  const existing =
    cleanMissionCode(snapshot.dossierCode) ||
    cleanMissionCode(snapshot.baseCode) ||
    cleanMissionCode(item.dossier_reference) ||
    cleanMissionCode(item.dossierReference) ||
    cleanMissionCode(item.mission_reference) ||
    cleanMissionCode(item.missionReference) ||
    cleanMissionCode(item.mission_code) ||
    cleanMissionCode(item.missionCode) ||
    cleanMissionCode(item.code)

  if (existing) return stripMissionCodeSuffix(existing)

  const id = item.parent_mission_id || item.parentMissionId || item.id
  return id ? `CARE-${id}` : 'CARE-DRAFT'
}

export function missionOccurrenceIndex(row: MissionCodeLike | null | undefined, fallbackIndex = 0) {
  const item: any = row || {}
  const recurrenceRule = parseMissionJson(item.recurrence_rule || item.recurrenceRule)

  const value =
    item.occurrence_index ??
    item.occurrenceIndex ??
    recurrenceRule.occurrenceIndex ??
    item.order ??
    item.sort_order ??
    item.line_order ??
    fallbackIndex + 1

  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : fallbackIndex + 1
}

export function resolvedMissionCode(
  row: MissionCodeLike | null | undefined,
  options: { index?: number; total?: number; forceSingle?: boolean } = {},
) {
  const item: any = row || {}

  const direct =
    cleanMissionCode(item.mission_reference) ||
    cleanMissionCode(item.missionReference) ||
    cleanMissionCode(item.mission_code) ||
    cleanMissionCode(item.missionCode) ||
    cleanMissionCode(item.code)

  if (direct && /\*(S|\d+)$/i.test(direct)) return direct

  const base = missionBaseCode(item)
  const linkedCount = Number(
    item.linkedMissionCount ??
    item.linked_mission_count ??
    parseMissionJson(item.recurrence_rule || item.recurrenceRule).linkedMissionCount ??
    parseMissionJson(item.recurrence_rule || item.recurrenceRule).linked_mission_count ??
    0
  )

  const total = Math.max(Number(options.total || linkedCount || 0), 0)

  const parentId = item.parent_mission_id || item.parentMissionId
  const kind = String(item.mission_kind || item.missionKind || '').toLowerCase()

  if (options.forceSingle || kind === 'single' || (!parentId && total <= 1 && kind !== 'dossier')) {
    return `${base}*S`
  }

  if (parentId || kind === 'sub_mission' || kind === 'submission') {
    return `${base}*${missionOccurrenceIndex(item, options.index || 0)}`
  }

  if (total > 1 || kind === 'dossier') return base

  return `${base}*S`
}

export function resolvedSessionCode(baseCode: string, index: number, total: number) {
  const base = stripMissionCodeSuffix(baseCode || 'CARE-DRAFT')
  return total <= 1 ? `${base}*S` : `${base}*${index + 1}`
}
