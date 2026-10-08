import { createClient } from '@/lib/supabase/server'
import { requireAngelcare360Permission } from '@/lib/angelcare360/server/context'
import { recordAngelcare360AuditEventServer } from '@/lib/angelcare360/server/audit'
import type {
  TrustCase,
  TrustCaseEvent,
  TrustCommunicationRecord,
  TrustFlowBucket,
  TrustMutationResult,
  TrustPersonRef,
  TrustResolutionPriority,
  TrustResolutionSnapshot,
  TrustResolutionStatus,
} from '@/types/angelcare360/trust-resolution'

type Row = Record<string, any>
const MODULE = 'reclamations'
const STATUSES: TrustResolutionStatus[] = ['new','open','in_review','in_progress','assigned','waiting_parent','waiting_internal','resolved','closed','archived']
const PRIORITIES: TrustResolutionPriority[] = ['low','normal','medium','high','urgent','critical']
const OPEN_STATUSES = new Set<TrustResolutionStatus>(['new','open','in_review','in_progress','assigned','waiting_parent','waiting_internal'])

function s(value: unknown, fallback = '') { return value === null || value === undefined ? fallback : String(value) }
function nullable(value: unknown) { const valueString = s(value).trim(); return valueString ? valueString : null }
function object(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {} }
function array(value: unknown): unknown[] { return Array.isArray(value) ? value : [] }
function nowIso() { return new Date().toISOString() }
function hoursSince(value: unknown) { const time = new Date(s(value)).getTime(); return Number.isFinite(time) ? Math.max(0, Math.round((Date.now() - time) / 3600000)) : 0 }
function casablancaDate(value = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Casablanca' }).format(value) }
function labelStatus(status: string) {
  return ({new:'Nouvelle',open:'Ouverte',in_review:'En qualification',in_progress:'En traitement',assigned:'Assignée',waiting_parent:'Attente famille',waiting_internal:'Attente interne',resolved:'Résolue',closed:'Clôturée',archived:'Archivée'} as Record<string,string>)[status] || status
}
function labelPriority(priority: string) {
  return ({low:'Faible',normal:'Normale',medium:'Moyenne',high:'Haute',urgent:'Urgente',critical:'Critique'} as Record<string,string>)[priority] || priority
}
function labelCategory(category: string) {
  return ({general:'Général',communication:'Communication',billing:'Facturation',attendance:'Présence',teacher:'Équipe pédagogique',safety:'Sécurité',transport:'Transport',quality:'Qualité',admissions:'Admissions',other:'Autre'} as Record<string,string>)[category] || category || 'Non classée'
}

async function access(permission: string, schoolId?: string | null) {
  const ctx = await requireAngelcare360Permission(permission, { schoolId })
  if (!ctx.school) throw new Error('Aucun établissement actif n’est disponible.')
  return ctx
}

async function audit(input: { schoolId: string; action: string; entityId: string; severity?: 'debug'|'info'|'notice'|'warning'|'critical'; metadata?: Record<string,unknown> }) {
  try {
    await recordAngelcare360AuditEventServer({
      category: 'claims', module: MODULE, action: input.action, schoolId: input.schoolId,
      entityType: 'reclamation', entityId: input.entityId, severity: input.severity || 'info', metadata: input.metadata,
    })
  } catch {}
}

async function rows(client: any, table: string, columns: string, schoolId: string, order = 'created_at') {
  const { data, error } = await client.from(table).select(columns).eq('school_id', schoolId).order(order, { ascending: false }).range(0, 4999)
  if (error) throw new Error(`${table}: ${error.message}`)
  return (data || []) as Row[]
}

function person(row: Row | undefined, kind: 'parent'|'student'|'staff'): TrustPersonRef | null {
  if (!row) return null
  return {
    id: s(row.id), label: s(row.full_name || [row.first_name,row.last_name].filter(Boolean).join(' '), kind === 'student' ? 'Élève' : kind === 'parent' ? 'Parent' : 'Collaborateur'),
    code: nullable(row.parent_code || row.student_code || row.staff_code), phone: nullable(row.phone), email: nullable(row.email),
    role: nullable(kind === 'staff' ? row.department || row.staff_type : kind === 'parent' ? 'Parent / tuteur' : 'Élève'),
  }
}

function normalizeStoredEvents(caseId: string, value: unknown, fallbackType: string): TrustCaseEvent[] {
  return array(value).map((item, index) => {
    const row = object(item)
    const status = s(row.status || row.to_status)
    return {
      id: s(row.id, `${caseId}-${fallbackType}-${index}`), caseId, eventType: s(row.event_type, fallbackType),
      label: s(row.label, status ? `Statut · ${labelStatus(status)}` : fallbackType === 'internal_note' ? 'Note interne' : 'Mise à jour'),
      note: nullable(row.note || row.notes || row.summary), actorLabel: nullable(row.actor_label || row.author_label),
      at: s(row.at || row.created_at || row.timestamp, nowIso()), metadata: object(row.metadata),
    }
  }).sort((a,b) => b.at.localeCompare(a.at))
}

function normalizeCommunications(caseId: string, metadata: Record<string, unknown>): TrustCommunicationRecord[] {
  return array(metadata.communications).map((item, index) => {
    const row = object(item)
    const truth = s(row.deliveryTruth || row.delivery_truth, 'recorded')
    const allowed = ['prepared','recorded','provider_accepted','delivered','failed','unknown']
    return {
      id: s(row.id, `${caseId}-comm-${index}`), at: s(row.at || row.created_at, nowIso()), channel: s(row.channel, 'manual'),
      direction: (['outbound','inbound','internal'].includes(s(row.direction)) ? s(row.direction) : 'outbound') as TrustCommunicationRecord['direction'],
      authorLabel: nullable(row.authorLabel || row.author_label), recipientLabel: nullable(row.recipientLabel || row.recipient_label),
      purpose: nullable(row.purpose), note: nullable(row.note || row.message),
      deliveryTruth: (allowed.includes(truth) ? truth : 'unknown') as TrustCommunicationRecord['deliveryTruth'],
    }
  }).sort((a,b) => b.at.localeCompare(a.at))
}

function normalizeAudit(row: Row): TrustCaseEvent {
  const metadata = object(row.metadata)
  return {
    id: s(row.id), caseId: s(row.entity_id), eventType: s(row.action), label: s(row.action).replace(/^reclamations?\./,'').replaceAll('.',' · '),
    note: nullable(metadata.note || metadata.summary || metadata.reason), actorLabel: nullable(row.actor_role), at: s(row.created_at), metadata,
  }
}

export async function getTrustResolutionSnapshot(options?: { schoolId?: string | null }): Promise<TrustResolutionSnapshot> {
  const ctx = await access('reclamations.view', options?.schoolId)
  const client = await createClient()
  const schoolId = ctx.school!.id

  const [claimRows, parentRows, studentRows, staffRows, auditResponse] = await Promise.all([
    rows(client, 'angelcare360_reclamations', '*', schoolId, 'updated_at'),
    rows(client, 'angelcare360_parents', 'id,parent_code,full_name,first_name,last_name,email,phone,whatsapp,status', schoolId, 'full_name'),
    rows(client, 'angelcare360_students', 'id,student_code,full_name,first_name,last_name,status', schoolId, 'full_name'),
    rows(client, 'angelcare360_staff', 'id,staff_code,full_name,first_name,last_name,email,phone,department,staff_type,status', schoolId, 'full_name'),
    client.from('angelcare360_audit_logs').select('id,action,entity_type,entity_id,severity,actor_role,created_at,metadata,module').eq('school_id', schoolId).in('module', ['reclamations','claims','parenttrust']).order('created_at', { ascending: false }).limit(1000),
  ])

  const parentById = new Map<string, Row>(parentRows.map((row: Row) => [s(row.id), row] as [string, Row]))
  const studentById = new Map<string, Row>(studentRows.map((row: Row) => [s(row.id), row] as [string, Row]))
  const staffById = new Map<string, Row>(staffRows.map((row: Row) => [s(row.id), row] as [string, Row]))
  const auditRows = ((auditResponse.data || []) as Row[]).map(normalizeAudit)
  const auditByCase = new Map<string, TrustCaseEvent[]>()
  for (const event of auditRows) auditByCase.set(event.caseId, [...(auditByCase.get(event.caseId) || []), event])

  const cases: TrustCase[] = claimRows.map((row: Row) => {
    const metadata = object(row.metadata_json)
    const dueAt = nullable(metadata.due_at)
    const status = (STATUSES.includes(s(row.status) as TrustResolutionStatus) ? s(row.status) : 'open') as TrustResolutionStatus
    const priority = (PRIORITIES.includes(s(row.priority) as TrustResolutionPriority) ? s(row.priority) : 'medium') as TrustResolutionPriority
    const internalNotes = normalizeStoredEvents(s(row.id), row.internal_notes_json, 'internal_note')
    const statusHistory = normalizeStoredEvents(s(row.id), row.status_history_json, 'status_changed')
    const caseAudit = auditByCase.get(s(row.id)) || []
    const allEvents = [...statusHistory, ...internalNotes, ...caseAudit].sort((a,b) => b.at.localeCompare(a.at))
    const lastAt = allEvents[0]?.at || s(row.updated_at || row.created_at)
    return {
      id: s(row.id), code: s(row.reclamation_code, 'Réclamation'), subject: s(row.subject, 'Réclamation sans objet'), description: s(row.description),
      category: s(row.category, 'general'), priority, status, reporterRole: nullable(row.reporter_role),
      reporter: person(parentById.get(s(row.submitted_by_parent_id)), 'parent') || person(staffById.get(s(row.submitted_by_staff_id)), 'staff') || person(studentById.get(s(row.submitted_by_student_id)), 'student'),
      student: person(studentById.get(s(row.submitted_by_student_id)), 'student'), assignedStaff: person(staffById.get(s(row.assigned_staff_id)), 'staff'),
      createdAt: s(row.created_at), updatedAt: s(row.updated_at), assignedAt: nullable(row.assigned_at), resolvedAt: nullable(row.resolved_at), closedAt: nullable(row.closed_at),
      resolutionSummary: nullable(row.resolution_summary || row.resolution_notes), nextAction: nullable(metadata.next_action), dueAt, sourceChannel: nullable(metadata.source_channel),
      ageHours: hoursSince(row.created_at), waitingHours: hoursSince(lastAt), overdue: Boolean(dueAt && new Date(dueAt).getTime() < Date.now() && OPEN_STATUSES.has(status)),
      internalNotes, statusHistory, communications: normalizeCommunications(s(row.id), metadata), metadata,
    }
  })

  const today = casablancaDate()
  const metrics = {
    open: cases.filter(item => OPEN_STATUSES.has(item.status)).length,
    urgent: cases.filter(item => OPEN_STATUSES.has(item.status) && ['urgent','critical'].includes(item.priority)).length,
    overdue: cases.filter(item => item.overdue).length,
    unassigned: cases.filter(item => OPEN_STATUSES.has(item.status) && !item.assignedStaff).length,
    waitingParent: cases.filter(item => item.status === 'waiting_parent').length,
    waitingInternal: cases.filter(item => item.status === 'waiting_internal').length,
    resolutionReady: cases.filter(item => item.status === 'resolved' && Boolean(item.resolutionSummary)).length,
    closedToday: cases.filter(item => item.closedAt && casablancaDate(new Date(item.closedAt)) === today).length,
    createdToday: cases.filter(item => casablancaDate(new Date(item.createdAt)) === today).length,
  }

  const flowKeys: Array<[string,string,TrustResolutionStatus[]]> = [
    ['new','Nouvelles',['new','open']], ['qualification','Qualification',['in_review']], ['treatment','Traitement',['in_progress','assigned']],
    ['waiting','En attente',['waiting_parent','waiting_internal']], ['resolved','Résolues',['resolved']], ['closed','Clôturées',['closed']],
  ]
  const flow: TrustFlowBucket[] = flowKeys.map(([key,label,statuses]) => ({ key, label, count: cases.filter(item => statuses.includes(item.status)).length }))
  const categoryCounts = new Map<string, number>()
  for (const item of cases) categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1)
  const categories = [...categoryCounts.entries()].map(([key,count]) => ({ key, label: labelCategory(key), count })).sort((a,b) => b.count - a.count)

  const score = (item: TrustCase) => (item.priority === 'critical' ? 100 : item.priority === 'urgent' ? 80 : item.priority === 'high' ? 60 : 20) + (item.overdue ? 50 : 0) + (!item.assignedStaff ? 25 : 0) + Math.min(item.waitingHours, 72)
  const interventionQueue = cases.filter(item => OPEN_STATUSES.has(item.status)).sort((a,b) => score(b) - score(a)).slice(0, 12)

  return {
    schoolId, schoolName: ctx.school!.name, generatedAt: nowIso(), cases, staff: staffRows.map((row: Row) => person(row,'staff')!).filter(Boolean),
    parents: parentRows.map((row: Row) => person(row,'parent')!).filter(Boolean), students: studentRows.map((row: Row) => person(row,'student')!).filter(Boolean),
    audit: auditRows, metrics, flow, categories, interventionQueue,
  }
}

export async function getTrustResolutionCase(caseId: string, options?: { schoolId?: string | null }) {
  const snapshot = await getTrustResolutionSnapshot(options)
  const item = snapshot.cases.find(row => row.id === caseId)
  if (!item) return null
  const chronology = [...item.statusHistory, ...item.internalNotes, ...snapshot.audit.filter(event => event.caseId === caseId)].sort((a,b) => b.at.localeCompare(a.at))
  return { snapshot, item, chronology }
}

function errorResult(error: unknown): TrustMutationResult { return { ok:false, error: error instanceof Error ? error.message : s(error, 'Erreur Réclamations.') } }

async function loadCase(client: any, schoolId: string, id: string) {
  const { data, error } = await client.from('angelcare360_reclamations').select('*').eq('school_id', schoolId).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Réclamation introuvable dans cet établissement.')
  return data as Row
}

function historyEntry(status: string, note: string | null, actorLabel: string | null) {
  return { id: crypto.randomUUID(), event_type:'status_changed', status, label:`Statut · ${labelStatus(status)}`, note, actor_label:actorLabel, at:nowIso() }
}
function noteEntry(note: string, actorLabel: string | null) { return { id:crypto.randomUUID(), event_type:'internal_note', label:'Note interne', note, actor_label:actorLabel, at:nowIso() } }

export async function trustResolutionMutation(input: Record<string, unknown>): Promise<TrustMutationResult> {
  const action = s(input.action)
  const schoolIdInput = nullable(input.schoolId)
  const ctx = await access('reclamations.manage', schoolIdInput)
  const client = await createClient()
  const schoolId = ctx.school!.id
  const actor = ctx.user.id
  const actorLabel = nullable((ctx.user as any).full_name || (ctx.user as any).email || (ctx.user as any).name)

  try {
    if (action === 'case.create') {
      const subject = s(input.subject).trim(); const description = s(input.description).trim()
      if (!subject || !description) return { ok:false, error:'Objet et description sont requis.' }
      const code = `REC-${casablancaDate().replaceAll('-','')}-${crypto.randomUUID().slice(0,8).toUpperCase()}`
      const priority = PRIORITIES.includes(s(input.priority) as TrustResolutionPriority) ? s(input.priority) : 'medium'
      const metadata = { source_channel:s(input.sourceChannel,'manual'), next_action:nullable(input.nextAction), due_at:nullable(input.dueAt), source:'sanila_trust_resolution' }
      const initial = historyEntry('new', 'Réclamation créée depuis SANILA Trust Resolution.', actorLabel)
      const { data, error } = await client.from('angelcare360_reclamations').insert({
        school_id:schoolId, reclamation_code:code, reporter_role:nullable(input.reporterRole), subject, description,
        category:nullable(input.category) || 'general', priority, status:'new', submitted_by_parent_id:nullable(input.parentId), submitted_by_student_id:nullable(input.studentId),
        assigned_staff_id:nullable(input.assignedStaffId), assigned_at:nullable(input.assignedStaffId) ? nowIso() : null,
        created_by:actor, updated_by:actor, metadata_json:metadata, internal_notes_json:[], status_history_json:[initial],
      }).select('id').single()
      if (error) return errorResult(error)
      const id = s(data?.id); if (id) await audit({ schoolId, action:'reclamations.case.create', entityId:id, severity:'notice', metadata:{ code, priority, category:input.category } })
      return { ok:true, id }
    }

    const id = s(input.id)
    if (!id) return { ok:false, error:'Identifiant de réclamation requis.' }
    const current = await loadCase(client, schoolId, id)

    if (action === 'case.assign') {
      const assignedStaffId = nullable(input.assignedStaffId)
      if (assignedStaffId) {
        const { count } = await client.from('angelcare360_staff').select('id',{head:true,count:'exact'}).eq('school_id',schoolId).eq('id',assignedStaffId)
        if (!count) return { ok:false, error:'Le collaborateur sélectionné n’appartient pas à cet établissement.' }
      }
      const history = [...array(current.status_history_json), { id:crypto.randomUUID(), event_type:'assigned', label:assignedStaffId ? 'Responsable assigné' : 'Responsable retiré', note:nullable(input.note), actor_label:actorLabel, at:nowIso(), assigned_staff_id:assignedStaffId }]
      const { error } = await client.from('angelcare360_reclamations').update({ assigned_staff_id:assignedStaffId, assigned_at:assignedStaffId ? nowIso() : null, updated_by:actor, status_history_json:history }).eq('school_id',schoolId).eq('id',id)
      if (error) return errorResult(error)
      await audit({ schoolId, action:'reclamations.case.assign', entityId:id, metadata:{ assignedStaffId, note:nullable(input.note) } })
      return { ok:true, id }
    }

    if (action === 'case.note') {
      const note = s(input.note).trim(); if (!note) return { ok:false, error:'La note interne ne peut pas être vide.' }
      const notes = [...array(current.internal_notes_json), noteEntry(note, actorLabel)]
      const { error } = await client.from('angelcare360_reclamations').update({ internal_notes_json:notes, updated_by:actor }).eq('school_id',schoolId).eq('id',id)
      if (error) return errorResult(error)
      await audit({ schoolId, action:'reclamations.case.internal_note', entityId:id, metadata:{ note } })
      return { ok:true, id }
    }

    if (action === 'case.communication') {
      const requestedTruth = s(input.deliveryTruth, 'recorded')
      const manuallyRecordableTruth = new Set(['prepared','recorded','unknown'])
      if (!manuallyRecordableTruth.has(requestedTruth)) {
        return { ok:false, error:'Ce module ne peut pas certifier manuellement un état fournisseur. Utilisez uniquement Préparé, Enregistré ou Inconnu.' }
      }
      const metadata = object(current.metadata_json)
      const communications = [...array(metadata.communications), {
        id:crypto.randomUUID(), at:nowIso(), channel:s(input.channel,'manual'), direction:s(input.direction,'outbound'),
        authorLabel:actorLabel, recipientLabel:nullable(input.recipientLabel), purpose:nullable(input.purpose), note:nullable(input.note),
        deliveryTruth:requestedTruth,
      }]
      const { error } = await client.from('angelcare360_reclamations').update({ metadata_json:{...metadata,communications}, updated_by:actor }).eq('school_id',schoolId).eq('id',id)
      if (error) return errorResult(error)
      await audit({ schoolId, action:'reclamations.case.communication_recorded', entityId:id, metadata:{ channel:s(input.channel), deliveryTruth:requestedTruth } })
      return { ok:true, id }
    }

    if (action === 'case.update') {
      const priority = s(input.priority || current.priority)
      const status = s(input.status || current.status)
      if (!PRIORITIES.includes(priority as TrustResolutionPriority)) return { ok:false, error:'Priorité invalide.' }
      if (!STATUSES.includes(status as TrustResolutionStatus)) return { ok:false, error:'Statut invalide.' }
      const metadata = { ...object(current.metadata_json), next_action:nullable(input.nextAction) ?? nullable(object(current.metadata_json).next_action), due_at:nullable(input.dueAt) ?? nullable(object(current.metadata_json).due_at) }
      const history = status !== s(current.status) ? [...array(current.status_history_json), historyEntry(status, nullable(input.note), actorLabel)] : array(current.status_history_json)
      const update: Row = { priority, status, category:nullable(input.category) || nullable(current.category), metadata_json:metadata, status_history_json:history, updated_by:actor }
      if (status === 'resolved') { update.resolved_at = current.resolved_at || nowIso(); update.resolution_summary = nullable(input.resolutionSummary) || nullable(current.resolution_summary) || nullable(input.note) }
      if (status === 'closed') { update.closed_at = current.closed_at || nowIso(); update.resolved_at = current.resolved_at || nowIso(); update.resolution_summary = nullable(input.resolutionSummary) || nullable(current.resolution_summary) || nullable(input.note) }
      if (!['resolved','closed'].includes(status) && ['resolved','closed'].includes(s(current.status))) { update.closed_at = null }
      const { error } = await client.from('angelcare360_reclamations').update(update).eq('school_id',schoolId).eq('id',id)
      if (error) return errorResult(error)
      await audit({ schoolId, action:'reclamations.case.update', entityId:id, severity:['urgent','critical'].includes(priority)?'warning':'info', metadata:{ priority,status,category:update.category,nextAction:metadata.next_action,dueAt:metadata.due_at } })
      return { ok:true, id }
    }

    return { ok:false, error:'Action Trust Resolution inconnue.' }
  } catch (error) { return errorResult(error) }
}

export const TRUST_STATUS_LABEL = labelStatus
export const TRUST_PRIORITY_LABEL = labelPriority
export const TRUST_CATEGORY_LABEL = labelCategory
