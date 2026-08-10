import { createClient } from '@/lib/supabase/server'
import {
  getAngelcare360AccessContext,
  requireAngelcare360Permission,
} from '@/lib/angelcare360/server/context'
import {
  checkAngelcare360ClassCapacityForAdmission,
  convertAngelcare360ApplicationToPeopleRecords,
  getAngelcare360AdmissionsOverview,
} from '@/lib/angelcare360/server/admissions'
import { recordAngelcare360AuditEventServer } from '@/lib/angelcare360/server/audit'
import type {
  Angelcare360Area9Attention,
  Angelcare360Area9CommandData,
  Angelcare360Area9JourneyLane,
  Angelcare360Area9Metric,
  Angelcare360Area9MutationRequest,
  Angelcare360Area9MutationResult,
  Angelcare360Area9Record,
  Angelcare360Area9Tone,
  Angelcare360Area9View,
} from '@/types/angelcare360/admissions-area9'

type Row = Record<string, any>
type SupabaseClient = Awaited<ReturnType<typeof createClient>>

const VIEWS: Angelcare360Area9View[] = [
  'today',
  'inquiries',
  'families',
  'visits',
  'applications',
  'documents',
  'evaluations',
  'decisions',
  'waiting-list',
  'offers',
  'enrollments',
  'onboarding',
  'attention',
  'history',
]

const MUTATION_PERMISSIONS: Record<string, string> = {
  'admission_inquiry.create': 'admissions.create',
  'admission_inquiry.update': 'admissions.update',
  'admission_inquiry.assign': 'admissions.assign',
  'admission_inquiry.contact': 'admissions.update',
  'admission_inquiry.schedule_followup': 'admissions.update',
  'admission_inquiry.close': 'admissions.update',
  'admission_inquiry.reactivate': 'admissions.update',
  'admission_inquiry.merge_review': 'admissions.update',
  'admission_family.create': 'admissions.create',
  'admission_family.update': 'admissions.update',
  'admission_family.link_contact': 'admissions.update',
  'admission_family.add_candidate': 'admissions.update',
  'admission_family.request_verification': 'admissions.update',
  'admission_candidate.create': 'admissions.create',
  'admission_candidate.update': 'admissions.update',
  'admission_candidate.match_existing': 'admissions.update',
  'admission_candidate.request_identity_review': 'admissions.update',
  'admission_visit.create': 'admissions.create',
  'admission_visit.confirm': 'admissions.update',
  'admission_visit.reschedule': 'admissions.update',
  'admission_visit.remind': 'admissions.notify',
  'admission_visit.check_in': 'admissions.update',
  'admission_visit.complete': 'admissions.update',
  'admission_visit.cancel': 'admissions.update',
  'admission_visit.record_no_show': 'admissions.update',
  'admission_application.create': 'admissions.create',
  'admission_application.update': 'admissions.update',
  'admission_application.submit': 'admissions.update',
  'admission_application.assign': 'admissions.assign',
  'admission_application.request_information': 'admissions.update',
  'admission_application.mark_ready': 'admissions.update',
  'admission_application.withdraw': 'admissions.update',
  'admission_application.archive': 'admissions.audit',
  'admission_application.reopen': 'admissions.update',
  'admission_document.request': 'admissions.create',
  'admission_document.receive': 'admissions.update',
  'admission_document.verify': 'admissions.update',
  'admission_document.reject': 'admissions.approve',
  'admission_document.replace': 'admissions.update',
  'admission_document.mark_not_applicable': 'admissions.update',
  'admission_evaluation.create': 'admissions.create',
  'admission_evaluation.assign': 'admissions.assign',
  'admission_evaluation.record': 'admissions.update',
  'admission_evaluation.request_information': 'admissions.update',
  'admission_evaluation.complete': 'admissions.update',
  'admission_evaluation.reopen': 'admissions.update',
  'admission_place.preview': 'admissions.view',
  'admission_place.recommend': 'admissions.view',
  'admission_place.request_exception': 'admissions.update',
  'admission_waitlist.add': 'admissions.create',
  'admission_waitlist.update': 'admissions.update',
  'admission_waitlist.confirm_interest': 'admissions.update',
  'admission_waitlist.reorder': 'admissions.approve',
  'admission_waitlist.offer_alternative': 'admissions.update',
  'admission_waitlist.remove': 'admissions.update',
  'admission_waitlist.reactivate': 'admissions.update',
  'admission_decision.prepare': 'admissions.create',
  'admission_decision.request_review': 'admissions.update',
  'admission_decision.request_approval': 'admissions.approve',
  'admission_decision.approve': 'admissions.approve',
  'admission_decision.condition': 'admissions.approve',
  'admission_decision.waitlist': 'admissions.approve',
  'admission_decision.defer': 'admissions.update',
  'admission_decision.reject': 'admissions.approve',
  'admission_decision.withdraw': 'admissions.update',
  'admission_offer.prepare': 'admissions.create',
  'admission_offer.review': 'admissions.update',
  'admission_offer.approve': 'admissions.approve',
  'admission_offer.send': 'admissions.notify',
  'admission_offer.resend': 'admissions.notify',
  'admission_offer.record_response': 'admissions.update',
  'admission_offer.expire': 'admissions.update',
  'admission_offer.withdraw': 'admissions.update',
  'admission_reservation.preview': 'admissions.view',
  'admission_reservation.create': 'admissions.create',
  'admission_reservation.extend': 'admissions.approve',
  'admission_reservation.confirm': 'admissions.update',
  'admission_reservation.expire': 'admissions.update',
  'admission_reservation.release': 'admissions.approve',
  'admission_reservation.cancel': 'admissions.update',
  'admission_enrollment.preview': 'admissions.view',
  'admission_enrollment.validate': 'admissions.approve',
  'admission_enrollment.request_approval': 'admissions.approve',
  'admission_enrollment.convert': 'admissions.approve',
  'admission_enrollment.retry_handover': 'admissions.update',
  'admission_enrollment.cancel': 'admissions.update',
  'admission_onboarding.create': 'admissions.create',
  'admission_onboarding.assign': 'admissions.assign',
  'admission_onboarding.complete_task': 'admissions.update',
  'admission_onboarding.reopen_task': 'admissions.update',
  'admission_onboarding.confirm_readiness': 'admissions.approve',
  'admission_issue.assign': 'admissions.assign',
  'admission_issue.resolve': 'admissions.update',
  'admission_issue.reopen': 'admissions.update',
  'admission_note.add': 'admissions.create',
  'admission_evidence.request': 'admissions.create',
  'admission_topup.request': 'admissions.create',
}

function text(value: unknown, fallback = '') {
  if (value === null || value === undefined) return fallback
  const normalized = String(value).trim()
  return normalized || fallback
}

function optional(value: unknown) {
  const normalized = text(value)
  return normalized || null
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function iso(value: unknown) {
  const raw = text(value)
  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function dateCode() {
  return new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
}

function normalizeView(value?: string | null): Angelcare360Area9View {
  return VIEWS.includes(value as Angelcare360Area9View)
    ? (value as Angelcare360Area9View)
    : 'today'
}

function metadata(row: Row) {
  return row?.metadata_json && typeof row.metadata_json === 'object'
    ? (row.metadata_json as Row)
    : {}
}

function childName(row: Row) {
  const meta = metadata(row)
  return text(
    row.student_full_name ||
      [row.child_first_name || meta.child_first_name, row.child_last_name || meta.child_last_name]
        .filter(Boolean)
        .join(' '),
    'Enfant candidat',
  )
}

function contactName(row: Row) {
  const meta = metadata(row)
  return text(
    row.parent_name ||
      [row.parent_first_name || meta.parent_first_name, row.parent_last_name || meta.parent_last_name]
        .filter(Boolean)
        .join(' '),
    'Contact à confirmer',
  )
}

function stageLabel(stage: string) {
  const labels: Record<string, string> = {
    new: 'Nouvelle demande',
    contacted: 'Premier contact',
    qualified: 'Besoin compris',
    application_open: 'Candidature ouverte',
    open: 'Candidature ouverte',
    in_review: 'En évaluation',
    ready: 'Prête pour décision',
    approved: 'Admise',
    accepted: 'Admise',
    conditional: 'Admise sous conditions',
    waitlisted: 'Liste d’attente',
    rejected: 'Refusée',
    offer: 'Offre préparée',
    sent: 'Offre envoyée',
    reserved: 'Place réservée',
    converted: 'Inscription confirmée',
    onboarding: 'Accueil à préparer',
    integrated: 'Intégrée',
    archived: 'Archivée',
    scheduled: 'Rendez-vous planifié',
    confirmed: 'Rendez-vous confirmé',
    completed: 'Réalisé',
    pending: 'À traiter',
    verified: 'Vérifié',
    missing: 'Manquant',
    active: 'Active',
  }
  return labels[stage] || stage.replaceAll('_', ' ')
}

function toneForStage(stage: string): Angelcare360Area9Tone {
  if (['approved', 'accepted', 'converted', 'integrated', 'verified', 'completed'].includes(stage)) return 'emerald'
  if (['rejected', 'expired', 'blocked', 'critical'].includes(stage)) return 'red'
  if (['waitlisted', 'conditional', 'pending', 'missing', 'in_review'].includes(stage)) return 'amber'
  if (['decision', 'offer', 'sent', 'reserved'].includes(stage)) return 'violet'
  if (['archived', 'withdrawn', 'cancelled'].includes(stage)) return 'graphite'
  if (['new', 'contacted', 'scheduled', 'confirmed'].includes(stage)) return 'cyan'
  return 'navy'
}

function recordFromLead(row: Row): Angelcare360Area9Record {
  const meta = metadata(row)
  const stage = text(row.status, 'new')
  return {
    id: `lead:${row.id}`,
    sourceId: String(row.id),
    kind: 'inquiry',
    reference: text(row.lead_code, `DEM-${String(row.id).slice(0, 8)}`),
    title: childName(row),
    subtitle: `${contactName(row)} · ${text(row.desired_level || meta.desired_level, 'Programme à préciser')}`,
    candidateName: childName(row),
    contactName: contactName(row),
    stage,
    stageLabel: stageLabel(stage),
    tone: toneForStage(stage),
    owner: optional(row.responsible_staff_id || row.assigned_staff_id),
    programme: optional(row.desired_level || meta.desired_level),
    intake: optional(meta.target_intake || meta.desired_start_date),
    source: optional(row.source_channel || meta.source_channel),
    preferredChannel: optional(meta.preferred_channel || (row.parent_phone ? 'Téléphone' : row.parent_email ? 'Email' : null)),
    nextAction: optional(row.next_action || meta.next_action),
    dueAt: iso(row.next_action_at || meta.next_action_at),
    updatedAt: iso(row.updated_at || row.created_at),
    completion: stage === 'converted' ? 100 : stage === 'application_open' ? 42 : stage === 'qualified' ? 28 : stage === 'contacted' ? 16 : 8,
    missingCount: null,
    flags: [
      !row.parent_phone && !row.parent_email ? 'Coordonnées à compléter' : '',
      !row.next_action && !meta.next_action ? 'Prochaine action absente' : '',
      stage === 'new' ? 'Premier contact attendu' : '',
    ].filter(Boolean),
    metadata: { phone: row.parent_phone, email: row.parent_email, notes: row.notes || meta.notes },
  }
}

function recordFromApplication(row: Row): Angelcare360Area9Record {
  const meta = metadata(row)
  const stage = text(row.status || row.decision_status || row.application_stage, 'open')
  const missing = numberValue(row.missing_document_count || meta.missing_document_count, 0)
  return {
    id: `application:${row.id}`,
    sourceId: String(row.id),
    kind: 'application',
    reference: text(row.application_code, `DOS-${String(row.id).slice(0, 8)}`),
    title: childName(row),
    subtitle: `${contactName(row)} · ${text(row.application_stage, 'Candidature')}`,
    candidateName: childName(row),
    contactName: contactName(row),
    stage,
    stageLabel: stageLabel(stage),
    tone: toneForStage(stage),
    owner: optional(row.responsible_staff_id),
    programme: optional(meta.requested_class_code || meta.desired_level),
    intake: optional(meta.target_intake || row.application_date),
    source: optional(meta.source),
    preferredChannel: optional(meta.preferred_channel),
    nextAction: optional(row.next_action),
    dueAt: iso(row.next_action_at),
    updatedAt: iso(row.updated_at || row.created_at),
    completion: stage === 'converted' ? 100 : stage === 'approved' ? 84 : stage === 'in_review' ? 62 : missing > 0 ? 44 : 72,
    missingCount: missing,
    flags: [
      missing > 0 ? `${missing} pièce${missing > 1 ? 's' : ''} manquante${missing > 1 ? 's' : ''}` : '',
      stage === 'approved' && !row.converted_at ? 'Inscription à confirmer' : '',
      stage === 'in_review' ? 'Décision à préparer' : '',
    ].filter(Boolean),
    metadata: {
      decisionReason: row.decision_reason,
      academicYearId: row.academic_year_id,
      classId: row.class_id,
      sectionId: row.section_id,
      leadId: row.lead_id,
    },
  }
}

function recordFromTable(row: Row, kind: Angelcare360Area9Record['kind']): Angelcare360Area9Record {
  const stage = text(row.status || row.state, 'pending')
  const candidate = text(row.candidate_label || row.candidate_name, 'Enfant candidat')
  const contact = text(row.contact_label || row.family_label, 'Famille à confirmer')
  return {
    id: `${kind}:${row.id}`,
    sourceId: String(row.id),
    kind,
    reference: text(row.reference_code || row.visit_code || row.offer_code || row.reservation_code, `${kind.slice(0, 3).toUpperCase()}-${String(row.id).slice(0, 8)}`),
    title: text(row.title, candidate),
    subtitle: text(row.subtitle, `${contact} · ${stageLabel(stage)}`),
    candidateName: candidate,
    contactName: contact,
    stage,
    stageLabel: stageLabel(stage),
    tone: toneForStage(stage),
    owner: optional(row.owner_user_id || row.assigned_user_id),
    institution: optional(row.institution_label || row.site_label),
    programme: optional(row.programme_label || row.programme_key),
    intake: optional(row.intake_label || row.intake_key),
    source: optional(row.source_channel),
    preferredChannel: optional(row.preferred_channel),
    nextAction: optional(row.next_action),
    dueAt: iso(row.due_at || row.scheduled_at || row.expires_at),
    updatedAt: iso(row.updated_at || row.created_at),
    completion: row.completion_percent === null || row.completion_percent === undefined ? null : numberValue(row.completion_percent),
    missingCount: row.missing_count === null || row.missing_count === undefined ? null : numberValue(row.missing_count),
    flags: Array.isArray(row.flags) ? row.flags.map(String) : [],
    metadata: metadata(row),
  }
}

async function safeRows(client: SupabaseClient, table: string, schoolId: string, limit = 400) {
  try {
    const { data, error } = await client
      .from(table)
      .select('*')
      .eq('school_id', schoolId)
      .order('updated_at', { ascending: false })
      .limit(limit)
    if (error) return [] as Row[]
    return (data || []) as Row[]
  } catch {
    return [] as Row[]
  }
}

async function safeHistoryRows(client: SupabaseClient, schoolId: string) {
  try {
    const { data } = await client
      .from('angelcare360_area9_history')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
      .limit(180)
    return (data || []) as Row[]
  } catch {
    return [] as Row[]
  }
}

function makeRecordsByView(records: Angelcare360Area9Record[]) {
  const empty = () => [] as Angelcare360Area9Record[]
  const result: Record<Angelcare360Area9View, Angelcare360Area9Record[]> = {
    today: empty(), inquiries: empty(), families: empty(), visits: empty(), applications: empty(), documents: empty(), evaluations: empty(), decisions: empty(),
    'waiting-list': empty(), offers: empty(), enrollments: empty(), onboarding: empty(), attention: empty(), history: empty(),
  }
  for (const record of records) {
    if (record.kind === 'inquiry') result.inquiries.push(record)
    if (record.kind === 'family' || record.kind === 'candidate' || record.kind === 'inquiry') result.families.push(record)
    if (record.kind === 'visit') result.visits.push(record)
    if (record.kind === 'application') result.applications.push(record)
    if (record.kind === 'document') result.documents.push(record)
    if (record.kind === 'evaluation') result.evaluations.push(record)
    if (record.kind === 'decision') result.decisions.push(record)
    if (record.kind === 'waitlist') result['waiting-list'].push(record)
    if (record.kind === 'offer' || record.kind === 'reservation') result.offers.push(record)
    if (record.kind === 'enrollment') result.enrollments.push(record)
    if (record.kind === 'onboarding') result.onboarding.push(record)
    if (record.kind === 'issue') result.attention.push(record)
    if (record.kind === 'history') result.history.push(record)
    const due = record.dueAt ? new Date(record.dueAt).getTime() : 0
    const recent = record.updatedAt ? Date.now() - new Date(record.updatedAt).getTime() < 1000 * 60 * 60 * 24 * 3 : false
    if (record.flags.length || (due > 0 && due < Date.now()) || recent) result.today.push(record)
  }
  for (const view of VIEWS) result[view] = result[view].slice(0, 180)
  return result
}

function buildAttention(records: Angelcare360Area9Record[]): Angelcare360Area9Attention[] {
  const output: Angelcare360Area9Attention[] = []
  for (const record of records) {
    const overdue = record.dueAt ? new Date(record.dueAt).getTime() < Date.now() : false
    if (record.stage === 'new') {
      output.push({
        id: `first-response:${record.id}`,
        title: `${record.title} attend un premier contact`,
        detail: record.subtitle,
        consequence: 'La famille peut abandonner avant même la visite.',
        nextAction: 'Contacter la famille et enregistrer la prochaine étape.',
        tone: 'amber',
        record,
      })
    }
    if ((record.missingCount || 0) > 0) {
      output.push({
        id: `missing:${record.id}`,
        title: `${record.title} possède un dossier incomplet`,
        detail: `${record.missingCount} exigence(s) restent à compléter.`,
        consequence: 'La décision ou l’inscription peut rester bloquée.',
        nextAction: 'Ouvrir les pièces et envoyer une demande ciblée.',
        tone: 'amber',
        record,
      })
    }
    if (overdue) {
      output.push({
        id: `overdue:${record.id}`,
        title: `Action en retard · ${record.title}`,
        detail: record.nextAction || record.stageLabel,
        consequence: 'Le délai de traitement admissions est dépassé.',
        nextAction: 'Traiter maintenant ou réattribuer avec une nouvelle échéance.',
        tone: 'red',
        dueAt: record.dueAt,
        record,
      })
    }
    for (const flag of record.flags) {
      if (output.some((item) => item.record?.id === record.id && item.title.includes(flag))) continue
      if (flag.toLowerCase().includes('absente') || flag.toLowerCase().includes('bloqu')) {
        output.push({
          id: `flag:${record.id}:${flag}`,
          title: flag,
          detail: record.subtitle,
          consequence: 'Le parcours ne peut pas progresser de manière fiable.',
          nextAction: record.nextAction || 'Ouvrir le dossier et corriger la cause.',
          tone: 'red',
          record,
        })
      }
    }
  }
  return output.slice(0, 80)
}

function count(records: Angelcare360Area9Record[], predicate: (record: Angelcare360Area9Record) => boolean) {
  return records.filter(predicate).length
}

function buildMetrics(records: Angelcare360Area9Record[], attention: Angelcare360Area9Attention[]): Angelcare360Area9Metric[] {
  return [
    { key: 'new', label: 'Nouvelles demandes', value: count(records, (r) => r.kind === 'inquiry' && r.stage === 'new'), detail: 'Familles à contacter', view: 'inquiries', tone: 'cyan' },
    { key: 'visits', label: 'Visites à venir', value: count(records, (r) => r.kind === 'visit' && ['scheduled', 'confirmed'].includes(r.stage)), detail: 'Rendez-vous planifiés', view: 'visits', tone: 'navy' },
    { key: 'applications', label: 'Candidatures actives', value: count(records, (r) => r.kind === 'application' && !['converted', 'archived', 'rejected'].includes(r.stage)), detail: 'Dossiers en progression', view: 'applications', tone: 'violet' },
    { key: 'documents', label: 'Pièces manquantes', value: records.reduce((sum, r) => sum + (r.missingCount || 0), 0), detail: 'Exigences à sécuriser', view: 'documents', tone: 'amber' },
    { key: 'decisions', label: 'Décisions attendues', value: count(records, (r) => r.kind === 'application' && ['in_review', 'ready'].includes(r.stage)) + count(records, (r) => r.kind === 'decision' && ['pending', 'prepared'].includes(r.stage)), detail: 'Autorité requise', view: 'decisions', tone: 'violet' },
    { key: 'reservations', label: 'Réservations actives', value: count(records, (r) => r.kind === 'reservation' && ['reserved', 'active'].includes(r.stage)), detail: 'Places temporairement sécurisées', view: 'offers', tone: 'emerald' },
    { key: 'enrollments', label: 'Prêtes à inscrire', value: count(records, (r) => r.kind === 'application' && ['approved', 'accepted'].includes(r.stage)) + count(records, (r) => r.kind === 'enrollment' && ['validated', 'ready'].includes(r.stage)), detail: 'Handover disponible', view: 'enrollments', tone: 'emerald' },
    { key: 'attention', label: 'À régler', value: attention.length, detail: 'Blocages et délais', view: 'attention', tone: attention.length ? 'red' : 'emerald' },
  ]
}

function buildLanes(records: Angelcare360Area9Record[]): Angelcare360Area9JourneyLane[] {
  const definitions: Array<Omit<Angelcare360Area9JourneyLane, 'count' | 'records'> & { match: (record: Angelcare360Area9Record) => boolean }> = [
    { key: 'contact', label: 'Premier contact', description: 'Comprendre le besoin et engager la famille.', tone: 'cyan', match: (r) => r.kind === 'inquiry' && ['new', 'contacted', 'qualified'].includes(r.stage) },
    { key: 'visit', label: 'Visite & échange', description: 'Créer la confiance et confirmer le projet.', tone: 'navy', match: (r) => r.kind === 'visit' || (r.kind === 'inquiry' && r.stage === 'qualified') },
    { key: 'application', label: 'Candidature', description: 'Réunir les informations et pièces requises.', tone: 'amber', match: (r) => r.kind === 'application' && ['open', 'in_review'].includes(r.stage) },
    { key: 'decision', label: 'Décision', description: 'Évaluer, autoriser et expliquer.', tone: 'violet', match: (r) => r.kind === 'decision' || (r.kind === 'application' && ['ready', 'approved', 'waitlisted', 'rejected'].includes(r.stage)) },
    { key: 'offer', label: 'Offre & place', description: 'Proposer, réserver et surveiller l’échéance.', tone: 'violet', match: (r) => ['offer', 'reservation', 'waitlist'].includes(r.kind) },
    { key: 'enrollment', label: 'Inscription', description: 'Valider les conditions et effectuer le handover.', tone: 'emerald', match: (r) => r.kind === 'enrollment' || (r.kind === 'application' && r.stage === 'converted') },
    { key: 'welcome', label: 'Accueil', description: 'Préparer un premier jour impeccable.', tone: 'emerald', match: (r) => r.kind === 'onboarding' },
  ]
  return definitions.map(({ match, ...definition }) => {
    const laneRecords = records.filter(match).slice(0, 8)
    return { ...definition, count: records.filter(match).length, records: laneRecords }
  })
}

function entitlementIncludes(context: Awaited<ReturnType<typeof getAngelcare360AccessContext>>, fragments: string[]) {
  if (!context) return false
  const values = [
    ...(context.runtimeEntitlements.enabledModules || []),
    ...(context.runtimeEntitlements.enabledCapabilities || []),
    ...(context.runtimeEntitlements.enabledFeatures || []),
    ...(context.runtimeEntitlements.enabledServices || []),
    ...(context.runtimeEntitlements.enabledOperations || []),
  ].map((value) => String(value).toLowerCase())
  return fragments.some((fragment) => values.some((value) => value.includes(fragment)))
}

export async function loadAngelcare360Area9AdmissionsCommand(options?: {
  view?: string | null
  selectedId?: string | null
}): Promise<Angelcare360Area9CommandData> {
  const context = await requireAngelcare360Permission('admissions.view')
  const client = await createClient()
  const schoolId = context.school!.id
  const selectedView = normalizeView(options?.view)

  const [overview, leads, applications, journeys, visits, documentRequests, evaluations, waitingList, decisions, offers, reservations, enrollments, onboardingPlans, issues, history] = await Promise.all([
    getAngelcare360AdmissionsOverview().catch(() => null),
    safeRows(client, 'angelcare360_admission_leads', schoolId),
    safeRows(client, 'angelcare360_admission_applications', schoolId),
    safeRows(client, 'angelcare360_area9_journeys', schoolId),
    safeRows(client, 'angelcare360_area9_visits', schoolId),
    safeRows(client, 'angelcare360_area9_document_requests', schoolId),
    safeRows(client, 'angelcare360_area9_evaluations', schoolId),
    safeRows(client, 'angelcare360_area9_waitlist_entries', schoolId),
    safeRows(client, 'angelcare360_area9_decisions', schoolId),
    safeRows(client, 'angelcare360_area9_offers', schoolId),
    safeRows(client, 'angelcare360_area9_reservations', schoolId),
    safeRows(client, 'angelcare360_area9_enrollment_runs', schoolId),
    safeRows(client, 'angelcare360_area9_onboarding_plans', schoolId),
    safeRows(client, 'angelcare360_area9_issues', schoolId),
    safeHistoryRows(client, schoolId),
  ])

  const records: Angelcare360Area9Record[] = [
    ...leads.map(recordFromLead),
    ...applications.map(recordFromApplication),
    ...journeys.map((row) => recordFromTable(row, 'family')),
    ...visits.map((row) => recordFromTable(row, 'visit')),
    ...documentRequests.map((row) => recordFromTable(row, 'document')),
    ...evaluations.map((row) => recordFromTable(row, 'evaluation')),
    ...waitingList.map((row) => recordFromTable(row, 'waitlist')),
    ...decisions.map((row) => recordFromTable(row, 'decision')),
    ...offers.map((row) => recordFromTable(row, 'offer')),
    ...reservations.map((row) => recordFromTable(row, 'reservation')),
    ...enrollments.map((row) => recordFromTable(row, 'enrollment')),
    ...onboardingPlans.map((row) => recordFromTable(row, 'onboarding')),
    ...issues.map((row) => recordFromTable(row, 'issue')),
    ...history.map((row) => recordFromTable(row, 'history')),
  ]

  const attention = buildAttention(records)
  const recordsByView = makeRecordsByView(records)
  recordsByView.attention = attention.map((item) => item.record).filter(Boolean) as Angelcare360Area9Record[]
  const selectedRecord = options?.selectedId
    ? records.find((record) => record.id === options.selectedId || record.sourceId === options.selectedId) || null
    : null

  const permissions = context.permissions
  const can = (action: string) => context.access.accessLevel === 'super_admin' || permissions.has(action) || permissions.has('admissions.*') || context.primaryRoleKey === 'ceo'

  return {
    generatedAt: new Date().toISOString(),
    school: {
      id: schoolId,
      name: context.school!.name,
      timezone: context.schoolSettings?.default_timezone || context.school!.timezone || 'Africa/Casablanca',
    },
    academicYear: {
      id: context.academicYear?.id || null,
      label: context.academicYear?.label || 'Année scolaire à confirmer',
    },
    selectedView,
    metrics: buildMetrics(records, attention),
    lanes: buildLanes(records),
    recordsByView,
    attention,
    selectedRecord,
    capabilities: {
      canCreate: can('admissions.create'),
      canUpdate: can('admissions.update'),
      canApprove: can('admissions.approve'),
      canExport: can('admissions.export') || can('audit.export'),
      hasAdvancedAdmissions: entitlementIncludes(context, ['admission', 'enrollment']),
      hasMultiSiteWaitingList: entitlementIncludes(context, ['multi-site', 'multisite', 'waiting']),
      hasAutomatedReminders: entitlementIncludes(context, ['automation', 'reminder', 'notification']),
    },
    readiness: {
      academicYear: Boolean(context.academicYear?.id),
      applicationRequirements: Boolean(overview?.setupReadiness?.documentReady || documentRequests.length),
      capacityAuthority: Boolean(overview?.setupReadiness?.classReady || overview?.availableClassCount),
      decisionAuthority: can('admissions.approve'),
      auditAuthority: true,
    },
  }
}

async function findReceipt(client: SupabaseClient, schoolId: string, operation: string, idempotencyKey: string) {
  const { data } = await client
    .from('angelcare360_area9_action_receipts')
    .select('*')
    .eq('school_id', schoolId)
    .eq('action_key', operation)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()
  return data as Row | null
}

async function writeReceipt(
  client: SupabaseClient,
  args: {
    schoolId: string
    operation: string
    idempotencyKey: string
    recordId?: string | null
    actorUserId: string
    outcome: string
    result: Row
  },
) {
  const { data, error } = await client
    .from('angelcare360_area9_action_receipts')
    .insert({
      school_id: args.schoolId,
      action_key: args.operation,
      idempotency_key: args.idempotencyKey,
      target_id: args.recordId || null,
      actor_user_id: args.actorUserId,
      outcome: args.outcome,
      result_json: args.result,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return String(data.id)
}

async function writeHistory(
  client: SupabaseClient,
  args: {
    schoolId: string
    academicYearId?: string | null
    operation: string
    actorUserId: string
    targetType: string
    targetId?: string | null
    title: string
    summary: string
    before?: Row | null
    after?: Row | null
  },
) {
  await client.from('angelcare360_area9_history').insert({
    school_id: args.schoolId,
    academic_year_id: args.academicYearId || null,
    operation_key: args.operation,
    actor_user_id: args.actorUserId,
    target_type: args.targetType,
    target_id: args.targetId || null,
    title: args.title,
    summary: args.summary,
    before_json: args.before || {},
    after_json: args.after || {},
  })
}

function tableForOperation(operation: string) {
  if (operation.startsWith('admission_visit.')) return 'angelcare360_area9_visits'
  if (operation.startsWith('admission_document.') || operation === 'admission_evidence.request') return 'angelcare360_area9_document_requests'
  if (operation.startsWith('admission_evaluation.')) return 'angelcare360_area9_evaluations'
  if (operation.startsWith('admission_waitlist.')) return 'angelcare360_area9_waitlist_entries'
  if (operation.startsWith('admission_decision.')) return 'angelcare360_area9_decisions'
  if (operation.startsWith('admission_offer.')) return 'angelcare360_area9_offers'
  if (operation.startsWith('admission_reservation.')) return 'angelcare360_area9_reservations'
  if (operation.startsWith('admission_enrollment.')) return 'angelcare360_area9_enrollment_runs'
  if (operation === 'admission_onboarding.complete_task' || operation === 'admission_onboarding.reopen_task') return 'angelcare360_area9_onboarding_tasks'
  if (operation.startsWith('admission_onboarding.')) return 'angelcare360_area9_onboarding_plans'
  if (operation.startsWith('admission_issue.') || operation === 'admission_topup.request') return 'angelcare360_area9_issues'
  if (operation === 'admission_note.add') return 'angelcare360_area9_notes'
  return 'angelcare360_area9_journeys'
}

function statusForOperation(operation: string, payload: Row) {
  if (payload.status) return text(payload.status)
  const action = operation.split('.').pop() || 'updated'
  const statuses: Record<string, string> = {
    create: 'active', update: 'active', assign: 'active', contact: 'contacted', schedule_followup: 'active', close: 'archived', reactivate: 'active', merge_review: 'pending',
    confirm: 'confirmed', reschedule: 'scheduled', remind: 'scheduled', check_in: 'checked_in', complete: 'completed', cancel: 'cancelled', record_no_show: 'no_show', submit: 'in_review', mark_ready: 'ready', withdraw: 'withdrawn', archive: 'archived',
    request: 'requested', request_information: 'requested', receive: 'received', verify: 'verified', reject: 'rejected', replace: 'replaced', mark_not_applicable: 'not_applicable', reopen: 'active', add: 'active', confirm_interest: 'confirmed', reorder: 'active', offer_alternative: 'alternative_offered', remove: 'removed',
    prepare: 'prepared', request_review: 'pending', request_approval: 'pending', approve: 'approved', approve_conclusion: 'approved', condition: 'conditional', waitlist: 'waitlisted', defer: 'deferred', send: 'sent', resend: 'sent', expire: 'expired',
    record_response: text(payload.responseStatus, 'responded'), preview: 'previewed', recommend: 'recommended', request_exception: 'pending', extend: 'active', release: 'released', validate: 'validated', convert: 'converted', retry_handover: 'processing',
    complete_task: 'active', reopen_task: 'active', confirm_readiness: 'integrated', resolve: 'resolved', request_evidence: 'requested',
  }
  return statuses[action] || 'active'
}

async function mutateLegacyInquiry(client: SupabaseClient, schoolId: string, actorUserId: string, operation: string, request: Angelcare360Area9MutationRequest) {
  const payload = request.payload || {}
  if (operation === 'admission_inquiry.create') {
    const leadCode = text(payload.leadCode, `DEM-${dateCode()}`)
    const { data, error } = await client
      .from('angelcare360_admission_leads')
      .insert({
        school_id: schoolId,
        lead_code: leadCode,
        parent_name: text(payload.contactName, 'Contact à confirmer'),
        parent_phone: optional(payload.phone),
        parent_email: optional(payload.email),
        student_full_name: text(payload.candidateName, 'Enfant candidat'),
        child_first_name: optional(payload.childFirstName) || optional(payload.candidateName),
        child_last_name: optional(payload.childLastName),
        child_date_of_birth: optional(payload.birthDate),
        relationship_type: optional(payload.relationshipType),
        desired_level: optional(payload.programme),
        source_channel: text(payload.source, 'manual'),
        status: 'new',
        priority: text(payload.priority, 'normal'),
        next_action: text(payload.nextAction, 'Contacter la famille'),
        next_action_at: iso(payload.dueAt),
        notes: optional(payload.notes),
        created_by: actorUserId,
        updated_by: actorUserId,
        metadata_json: {
          target_intake: optional(payload.intake),
          preferred_channel: optional(payload.preferredChannel),
          consent_state: text(payload.consentState, 'pending'),
        },
      })
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    return data as Row
  }

  const id = request.sourceId || request.recordId?.replace(/^lead:/, '')
  if (!id) throw new Error('La demande admissions à modifier est introuvable.')
  const { data: before } = await client.from('angelcare360_admission_leads').select('*').eq('school_id', schoolId).eq('id', id).maybeSingle()
  if (!before) throw new Error('La demande admissions est introuvable.')
  const update: Row = { updated_by: actorUserId, updated_at: new Date().toISOString() }
  if (operation === 'admission_inquiry.contact') {
    update.status = 'contacted'
    update.contacted_at = new Date().toISOString()
    update.next_action = text(payload.nextAction, 'Proposer une visite')
    update.next_action_at = iso(payload.dueAt)
  } else if (operation === 'admission_inquiry.schedule_followup') {
    update.next_action = text(payload.nextAction, 'Relancer la famille')
    update.next_action_at = iso(payload.dueAt) || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  } else if (operation === 'admission_inquiry.assign') {
    update.responsible_staff_id = optional(payload.ownerUserId)
  } else if (operation === 'admission_inquiry.close') {
    update.status = 'archived'
  } else if (operation === 'admission_inquiry.reactivate') {
    update.status = 'contacted'
    update.next_action = text(payload.nextAction, 'Recontacter la famille')
    update.next_action_at = iso(payload.dueAt)
  } else {
    const mapping: Record<string, string> = {
      contactName: 'parent_name',
      phone: 'parent_phone',
      email: 'parent_email',
      candidateName: 'student_full_name',
      childFirstName: 'child_first_name',
      childLastName: 'child_last_name',
      birthDate: 'child_date_of_birth',
      relationshipType: 'relationship_type',
      programme: 'desired_level',
      source: 'source_channel',
      priority: 'priority',
      nextAction: 'next_action',
      notes: 'notes',
      status: 'status',
      ownerUserId: 'responsible_staff_id',
    }
    for (const [inputKey, column] of Object.entries(mapping)) {
      if (payload[inputKey] !== undefined) update[column] = optional(payload[inputKey])
    }
    if (payload.dueAt !== undefined) update.next_action_at = iso(payload.dueAt)
    const metadata = { ...((before.metadata_json || {}) as Row) }
    if (payload.intake !== undefined) metadata.target_intake = optional(payload.intake)
    if (payload.preferredChannel !== undefined) metadata.preferred_channel = optional(payload.preferredChannel)
    if (payload.consentState !== undefined) metadata.consent_state = text(payload.consentState, 'pending')
    update.metadata_json = metadata
  }
  const { data, error } = await client.from('angelcare360_admission_leads').update(update).eq('school_id', schoolId).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  return { ...(data as Row), __before: before }
}

async function mutateLegacyApplication(client: SupabaseClient, schoolId: string, academicYearId: string | null, actorUserId: string, operation: string, request: Angelcare360Area9MutationRequest) {
  const payload = request.payload || {}
  if (operation === 'admission_application.create') {
    const code = text(payload.applicationCode, `DOS-${dateCode()}`)
    const { data, error } = await client
      .from('angelcare360_admission_applications')
      .insert({
        school_id: schoolId,
        application_code: code,
        lead_id: optional(request.sourceId || payload.leadId),
        academic_year_id: optional(payload.academicYearId) || academicYearId,
        child_first_name: optional(payload.childFirstName),
        child_last_name: optional(payload.childLastName),
        child_date_of_birth: optional(payload.birthDate),
        parent_first_name: optional(payload.parentFirstName) || optional(payload.contactName),
        parent_last_name: optional(payload.parentLastName),
        phone: optional(payload.phone),
        email: optional(payload.email),
        application_stage: 'draft',
        status: 'open',
        priority: text(payload.priority, 'normal'),
        next_action: 'Compléter la candidature',
        next_action_at: iso(payload.dueAt),
        created_by: actorUserId,
        updated_by: actorUserId,
        metadata_json: {
          source: optional(payload.source),
          requested_class_code: optional(payload.programme),
          target_intake: optional(payload.intake),
        },
      })
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    return data as Row
  }
  const id = request.sourceId || request.recordId?.replace(/^application:/, '')
  if (!id) throw new Error('La candidature à modifier est introuvable.')
  const { data: before } = await client.from('angelcare360_admission_applications').select('*').eq('school_id', schoolId).eq('id', id).maybeSingle()
  if (!before) throw new Error('La candidature est introuvable.')
  const update: Row = { updated_by: actorUserId, updated_at: new Date().toISOString() }
  if (operation === 'admission_application.submit') {
    update.application_stage = 'submitted'
    update.status = 'in_review'
    update.next_action = 'Préparer l’évaluation'
  } else if (operation === 'admission_application.mark_ready') {
    update.application_stage = 'decision_ready'
    update.status = 'in_review'
    update.next_action = 'Enregistrer la décision'
  } else if (operation === 'admission_application.assign') {
    update.responsible_staff_id = optional(payload.ownerUserId)
  } else if (operation === 'admission_application.request_information') {
    update.next_action = text(payload.nextAction, 'Obtenir les informations manquantes')
    update.next_action_at = iso(payload.dueAt)
    update.status = 'open'
  } else if (operation === 'admission_application.withdraw') {
    update.status = 'archived'
    update.decision_reason = text(payload.reason, 'Retrait demandé par la famille')
  } else if (operation === 'admission_application.archive') {
    update.status = 'archived'
  } else if (operation === 'admission_application.reopen') {
    update.status = 'open'
    update.next_action = text(payload.nextAction, 'Reprendre la candidature')
    update.next_action_at = iso(payload.dueAt)
  } else {
    const mapping: Record<string, string> = {
      childFirstName: 'child_first_name',
      childLastName: 'child_last_name',
      birthDate: 'child_date_of_birth',
      parentFirstName: 'parent_first_name',
      parentLastName: 'parent_last_name',
      phone: 'phone',
      email: 'email',
      priority: 'priority',
      nextAction: 'next_action',
      status: 'status',
      applicationStage: 'application_stage',
      decisionReason: 'decision_reason',
      ownerUserId: 'responsible_staff_id',
    }
    for (const [inputKey, column] of Object.entries(mapping)) {
      if (payload[inputKey] !== undefined) update[column] = optional(payload[inputKey])
    }
    if (payload.dueAt !== undefined) update.next_action_at = iso(payload.dueAt)
    const metadata = { ...((before.metadata_json || {}) as Row) }
    if (payload.programme !== undefined) metadata.requested_class_code = optional(payload.programme)
    if (payload.intake !== undefined) metadata.target_intake = optional(payload.intake)
    if (payload.source !== undefined) metadata.source = optional(payload.source)
    update.metadata_json = metadata
  }
  const { data, error } = await client.from('angelcare360_admission_applications').update(update).eq('school_id', schoolId).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  return { ...(data as Row), __before: before }
}

async function upsertArea9Record(client: SupabaseClient, args: {
  table: string
  schoolId: string
  academicYearId: string | null
  actorUserId: string
  operation: string
  request: Angelcare360Area9MutationRequest
}) {
  const payload = args.request.payload || {}
  const existingId = args.request.sourceId || args.request.recordId?.split(':').pop() || null
  const status = statusForOperation(args.operation, payload)
  const row: Row = {
    school_id: args.schoolId,
    academic_year_id: args.academicYearId,
    status,
    candidate_label: text(payload.candidateName, 'Enfant candidat'),
    contact_label: text(payload.contactName, 'Famille à confirmer'),
    title: text(payload.title, text(payload.candidateName, 'Dossier admissions')),
    subtitle: optional(payload.subtitle),
    owner_user_id: optional(payload.ownerUserId),
    next_action: optional(payload.nextAction),
    due_at: iso(payload.dueAt),
    source_channel: optional(payload.source),
    preferred_channel: optional(payload.preferredChannel),
    programme_key: optional(payload.programme),
    intake_key: optional(payload.intake),
    lead_id: optional(payload.leadId),
    application_id: optional(payload.applicationId),
    completion_percent: payload.completion === undefined ? null : numberValue(payload.completion),
    missing_count: payload.missingCount === undefined ? null : numberValue(payload.missingCount),
    metadata_json: { ...payload, operation: args.operation },
    updated_by: args.actorUserId,
    updated_at: new Date().toISOString(),
  }
  if (args.operation.endsWith('.create') || args.operation.endsWith('.add') || args.operation.endsWith('.prepare') || args.operation.endsWith('.request')) {
    row.reference_code = text(payload.referenceCode, `${args.table.replace('angelcare360_area9_', '').slice(0, 3).toUpperCase()}-${dateCode()}`)
    row.created_by = args.actorUserId
    const { data, error } = await client.from(args.table).insert(row).select('*').single()
    if (error) throw new Error(error.message)
    return data as Row
  }
  if (!existingId) {
    row.reference_code = text(payload.referenceCode, `${args.table.replace('angelcare360_area9_', '').slice(0, 3).toUpperCase()}-${dateCode()}`)
    row.created_by = args.actorUserId
    const { data, error } = await client.from(args.table).insert(row).select('*').single()
    if (error) throw new Error(error.message)
    return data as Row
  }
  const { data: before } = await client.from(args.table).select('*').eq('school_id', args.schoolId).eq('id', existingId).maybeSingle()
  if (!before) throw new Error('L’élément admissions ciblé est introuvable.')
  const { data, error } = await client.from(args.table).update(row).eq('school_id', args.schoolId).eq('id', existingId).select('*').single()
  if (error) throw new Error(error.message)
  return { ...(data as Row), __before: before }
}

export async function executeAngelcare360Area9Operation(request: Angelcare360Area9MutationRequest): Promise<Angelcare360Area9MutationResult> {
  if (!request.operation || !MUTATION_PERMISSIONS[request.operation]) {
    return { ok: false, operation: request.operation || 'unknown', message: 'Opération admissions inconnue.', error: 'UNKNOWN_OPERATION' }
  }
  if (!request.idempotencyKey || request.idempotencyKey.length < 8) {
    return { ok: false, operation: request.operation, message: 'La clé d’intégrité de l’action est absente.', error: 'IDEMPOTENCY_REQUIRED' }
  }

  const permission = MUTATION_PERMISSIONS[request.operation]
  const context = await requireAngelcare360Permission(permission)
  const client = await createClient()
  const schoolId = context.school!.id
  const actorUserId = context.user.id
  const existingReceipt = await findReceipt(client, schoolId, request.operation, request.idempotencyKey)
  if (existingReceipt) {
    const previous = (existingReceipt.result_json || {}) as Row
    return {
      ok: existingReceipt.outcome === 'success',
      operation: request.operation,
      receiptId: String(existingReceipt.id),
      recordId: optional(existingReceipt.target_id) || undefined,
      message: text(previous.message, 'Action déjà exécutée sans duplication.'),
      refreshedAt: new Date().toISOString(),
    }
  }

  let record: Row
  let targetType = tableForOperation(request.operation).replace('angelcare360_area9_', '')
  try {
    if (request.operation.startsWith('admission_inquiry.')) {
      record = await mutateLegacyInquiry(client, schoolId, actorUserId, request.operation, request)
      targetType = 'admission_lead'
    } else if (request.operation.startsWith('admission_application.')) {
      record = await mutateLegacyApplication(client, schoolId, context.academicYear?.id || null, actorUserId, request.operation, request)
      targetType = 'admission_application'
    } else if (request.operation === 'admission_enrollment.convert') {
      const applicationId = request.sourceId || request.recordId?.replace(/^application:/, '') || text(request.payload?.applicationId)
      if (!applicationId) throw new Error('La candidature à convertir est introuvable.')
      const { data: application } = await client.from('angelcare360_admission_applications').select('*').eq('school_id', schoolId).eq('id', applicationId).maybeSingle()
      if (!application) throw new Error('La candidature à convertir est introuvable.')
      const applicationMetadata = metadata(application as Row)
      const classId = optional(request.payload?.classId) || optional(application.class_id) || optional(applicationMetadata.requested_class_id)
      const sectionId = optional(request.payload?.sectionId) || optional(application.section_id)
      const capacity = await checkAngelcare360ClassCapacityForAdmission({ schoolId, classId, sectionId })
      if (capacity.warning && !Boolean(request.payload?.capacityOverride)) throw new Error(capacity.warning)

      const { data: run, error: runError } = await client.from('angelcare360_area9_enrollment_runs').insert({
        school_id: schoolId,
        academic_year_id: context.academicYear?.id || application.academic_year_id || null,
        application_id: applicationId,
        candidate_label: childName(application as Row),
        contact_label: contactName(application as Row),
        title: `Conversion · ${childName(application as Row)}`,
        reference_code: `INS-${dateCode()}`,
        status: 'processing',
        completion_percent: 15,
        metadata_json: { started_from: 'area9', requested_payload: request.payload || {} },
        created_by: actorUserId,
        updated_by: actorUserId,
      }).select('*').single()
      if (runError) throw new Error(runError.message)
      const conversion = await convertAngelcare360ApplicationToPeopleRecords({
        applicationId,
        schoolId,
        classId,
        sectionId,
        idempotencyKey: request.idempotencyKey,
        ...(request.payload || {}),
      })
      const succeeded = Boolean((conversion as Row)?.ok)
      await client.from('angelcare360_area9_enrollment_runs').update({
        status: succeeded ? 'converted' : 'failed',
        completion_percent: succeeded ? 100 : 35,
        metadata_json: { started_from: 'area9', conversion_result: conversion },
        updated_by: actorUserId,
        updated_at: new Date().toISOString(),
      }).eq('id', run.id)
      await client.from('angelcare360_area9_handover_outcomes').insert([
        { school_id: schoolId, enrollment_run_id: run.id, handover_domain: 'student_360', status: succeeded ? 'ready' : 'blocked', result_json: conversion },
        { school_id: schoolId, enrollment_run_id: run.id, handover_domain: 'family_360', status: succeeded ? 'verification_required' : 'blocked', result_json: conversion },
        { school_id: schoolId, enrollment_run_id: run.id, handover_domain: 'class_placement', status: succeeded ? 'ready' : 'blocked', result_json: conversion },
      ])
      if (!succeeded) throw new Error(text((conversion as Row)?.error, 'La conversion n’a pas pu être terminée.'))
      record = { ...run, status: 'converted', completion_percent: 100, conversion_result: conversion }
      targetType = 'enrollment_run'
    } else {
      record = await upsertArea9Record(client, {
        table: tableForOperation(request.operation),
        schoolId,
        academicYearId: context.academicYear?.id || null,
        actorUserId,
        operation: request.operation,
        request,
      })
    }

    const before = (record.__before || null) as Row | null
    const cleanRecord = { ...record }
    delete cleanRecord.__before
    const targetId = text(cleanRecord.id || request.sourceId || request.recordId)
    const message = `Action terminée · ${request.operation.replaceAll('_', ' ').replaceAll('.', ' · ')}`
    await writeHistory(client, {
      schoolId,
      academicYearId: context.academicYear?.id || null,
      operation: request.operation,
      actorUserId,
      targetType,
      targetId,
      title: request.operation,
      summary: message,
      before,
      after: cleanRecord,
    })
    const receiptId = await writeReceipt(client, {
      schoolId,
      operation: request.operation,
      idempotencyKey: request.idempotencyKey,
      recordId: targetId,
      actorUserId,
      outcome: 'success',
      result: { message, record: cleanRecord },
    })

    await recordAngelcare360AuditEventServer({
      category: 'admissions',
      module: 'admissions',
      action: request.operation,
      schoolId,
      actorUserId,
      actorRole: context.primaryRoleKey || context.access.accessLevel,
      entityType: targetType,
      entityId: targetId,
      severity: 'info',
      beforeData: before || undefined,
      afterData: cleanRecord,
      metadata: { area: 9, idempotencyKey: request.idempotencyKey, receiptId },
    }).catch(() => null)

    return {
      ok: true,
      operation: request.operation,
      receiptId,
      recordId: targetId,
      message,
      refreshedAt: new Date().toISOString(),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'L’action admissions a échoué.'
    try {
      const receiptId = await writeReceipt(client, {
        schoolId,
        operation: request.operation,
        idempotencyKey: request.idempotencyKey,
        recordId: request.sourceId || request.recordId || null,
        actorUserId,
        outcome: 'failed',
        result: { message, error: 'OPERATION_FAILED' },
      })
      return { ok: false, operation: request.operation, receiptId, message, error: 'OPERATION_FAILED', refreshedAt: new Date().toISOString() }
    } catch {
      return { ok: false, operation: request.operation, message, error: 'OPERATION_FAILED', refreshedAt: new Date().toISOString() }
    }
  }
}
