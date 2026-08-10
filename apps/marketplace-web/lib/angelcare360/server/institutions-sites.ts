import { createHash, randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { Angelcare360AccessError, getAngelcare360AccessContext } from '@/lib/angelcare360/server/context'
import { recordAngelcare360AuditEventServer } from '@/lib/angelcare360/server/audit'
import type {
  InstitutionAreaActionKey,
  InstitutionAreaActionRequest,
  InstitutionAreaActionResult,
  InstitutionAreaSnapshot,
  InstitutionAttentionItem,
  InstitutionDocument,
  InstitutionHistoryEvent,
  InstitutionHumanStatus,
  InstitutionKind,
  InstitutionNote,
  InstitutionRecord,
  InstitutionRequirement,
  InstitutionTask,
  InstitutionTone,
} from '@/types/angelcare360/institutions-sites'

type Db = Awaited<ReturnType<typeof createClient>>
type Row = Record<string, unknown>

const EDIT_ACCESS = new Set(['super_admin', 'direction', 'administration', 'qualite'])
const APPROVAL_ACCESS = new Set(['super_admin', 'direction', 'administration'])

function row(value: unknown): Row {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {}
}

function rows(value: unknown): Row[] {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object').map((item) => item as Row) : []
}

function text(value: unknown, fallback = ''): string {
  return value === null || value === undefined ? fallback : String(value)
}

function optionalText(value: unknown): string | null {
  const valueText = text(value).trim()
  return valueText || null
}

function numeric(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function boolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (value === 'true' || value === 1 || value === '1') return true
  if (value === 'false' || value === 0 || value === '0') return false
  return fallback
}

function now() {
  return new Date().toISOString()
}

function stableHash(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function idempotency(value: unknown, fallback: unknown) {
  return optionalText(value) || stableHash(fallback)
}

async function requireAreaContext(options?: { approve?: boolean }) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) throw new Angelcare360AccessError('Aucun établissement actif n’est disponible.', 403)
  if (!EDIT_ACCESS.has(context.access.accessLevel)) throw new Angelcare360AccessError('Cet espace est réservé à l’administration de l’établissement.', 403)
  if (options?.approve && !APPROVAL_ACCESS.has(context.access.accessLevel)) throw new Angelcare360AccessError('La validation de la direction est nécessaire.', 403)
  return context
}

async function safeRows(db: Db, table: string, schoolId: string, options?: { order?: string; ascending?: boolean; limit?: number }) {
  try {
    let query = db.from(table).select('*').eq('school_id', schoolId)
    if (options?.order) query = query.order(options.order, { ascending: options.ascending ?? false })
    if (options?.limit) query = query.limit(options.limit)
    const { data, error } = await query
    return error ? [] : rows(data)
  } catch {
    return []
  }
}

async function safeSchoolRow(db: Db, schoolId: string) {
  const { data, error } = await db.from('angelcare360_schools').select('*').eq('id', schoolId).single()
  if (error) throw new Error('Les informations de l’établissement ne peuvent pas être chargées.')
  return row(data)
}

function humanStatus(kind: InstitutionKind, technicalStatus: string, metadata: Row, requirements: InstitutionRequirement[]): InstitutionHumanStatus {
  const state = text(metadata.governance_state, technicalStatus)
  if (state === 'archived' || technicalStatus === 'archived') return 'archived'
  if (state === 'closed' || (kind === 'site' && technicalStatus === 'closed')) return 'closed'
  if (state === 'closing') return 'closing'
  if (state === 'suspended' || technicalStatus === 'suspended') return 'suspended'
  if (state === 'active' || technicalStatus === 'active') return 'open'
  const blockers = requirements.filter((item) => item.applicable && item.blocking && !item.passed)
  if (!blockers.length && requirements.some((item) => item.applicable)) return 'ready_to_open'
  if (requirements.filter((item) => item.passed).length > 1) return 'preparing'
  return 'to_complete'
}

function toneForStatus(status: InstitutionHumanStatus): InstitutionTone {
  if (status === 'open' || status === 'ready_to_open') return 'verified'
  if (status === 'suspended' || status === 'closing') return 'decision'
  if (status === 'closed' || status === 'archived') return 'neutral'
  return 'warning'
}

function statusExplanation(status: InstitutionHumanStatus) {
  const labels: Record<InstitutionHumanStatus, string> = {
    to_complete: 'Les informations essentielles doivent encore être complétées.',
    preparing: 'La préparation est en cours. Quelques éléments restent à terminer.',
    ready_to_open: 'Tous les éléments nécessaires sont prêts pour la validation de l’ouverture.',
    open: 'L’établissement est ouvert et fonctionne normalement dans le système.',
    suspended: 'L’établissement est temporairement suspendu. Les dossiers existants restent conservés.',
    closing: 'La fermeture est en préparation et les dépendances doivent être vérifiées.',
    closed: 'L’établissement est fermé. Son historique reste disponible.',
    archived: 'L’établissement est archivé et conservé uniquement pour consultation autorisée.',
  }
  return labels[status]
}

function requirement(input: Omit<InstitutionRequirement, 'status'>): InstitutionRequirement {
  return {
    ...input,
    status: !input.applicable ? 'not_applicable' : input.passed ? 'complete' : input.blocking ? 'blocked' : 'to_complete',
  }
}

function documentStatus(item: Row): InstitutionDocument['status'] {
  const metadata = row(item.metadata_json)
  const expiresAt = optionalText(metadata.expires_at)
  if (expiresAt && Date.parse(expiresAt) < Date.now()) return 'expired'
  if (text(item.status) === 'verified' || item.verified_at) return 'verified'
  if (text(item.status) === 'archived') return 'replaced'
  return 'to_verify'
}

function mapDocument(item: Row): InstitutionDocument {
  const metadata = row(item.metadata_json)
  return {
    id: text(item.id),
    title: text(item.title, 'Document'),
    category: text(item.category, 'administratif'),
    status: documentStatus(item),
    fileName: optionalText(item.file_name),
    filePath: optionalText(item.file_path),
    createdAt: optionalText(item.created_at),
    updatedAt: optionalText(item.updated_at),
    expiresAt: optionalText(metadata.expires_at),
    uploadedByLabel: optionalText(metadata.uploaded_by_label),
    verifiedByLabel: optionalText(metadata.verified_by_label),
  }
}

function mapTask(item: Row): InstitutionTask {
  return {
    id: text(item.id),
    title: text(item.title),
    description: optionalText(item.description),
    state: text(item.state, 'open') as InstitutionTask['state'],
    priority: text(item.priority, 'normal') as InstitutionTask['priority'],
    ownerUserId: optionalText(item.owner_user_id),
    ownerLabel: optionalText(item.owner_label),
    dueAt: optionalText(item.due_at),
    sourceType: optionalText(item.source_type),
    sourceId: optionalText(item.source_id),
    createdAt: text(item.created_at, now()),
    updatedAt: text(item.updated_at, now()),
  }
}

function mapNote(item: Row): InstitutionNote {
  return {
    id: text(item.id),
    body: text(item.body),
    important: boolean(item.important),
    authorLabel: text(item.author_label, 'Équipe administrative'),
    createdAt: text(item.created_at, now()),
  }
}

function historyEvent(item: Row, fallback: string): InstitutionHistoryEvent {
  return {
    id: text(item.id, stableHash(item)),
    label: text(item.label || item.action || item.to_state, fallback),
    detail: optionalText(item.detail || item.reason),
    actorLabel: optionalText(item.actor_label || row(item.metadata_json).actor_label),
    createdAt: text(item.created_at || item.effective_at, now()),
    tone: text(item.tone, 'neutral') as InstitutionTone,
  }
}

function institutionRequirements(input: {
  record: Row
  kind: InstitutionKind
  currentYear: Row | undefined
  classes: Row[]
  activeUsers: number
  documents: InstitutionDocument[]
  tasks: InstitutionTask[]
}): InstitutionRequirement[] {
  const metadata = row(input.record.metadata_json)
  const isRoot = input.kind === 'school'
  const contactComplete = Boolean(optionalText(input.record.phone || metadata.phone) && optionalText(input.record.email || metadata.email))
  const responsible = optionalText(metadata.responsible_label || metadata.setup_owner_label || metadata.coordinator_label)
  const relevantClasses = input.classes.filter((item) => {
    if (isRoot) return !optionalText(row(item.metadata_json).site_id)
    return optionalText(row(item.metadata_json).site_id) === text(input.record.id)
  })
  const capacityComplete = relevantClasses.length > 0 && relevantClasses.every((item) => numeric(item.capacity) > 0)
  const verifiedDocuments = input.documents.filter((item) => item.status === 'verified').length
  return [
    requirement({ key: 'identity', label: 'Informations de l’établissement', explanation: 'Le nom, le type et la ville permettent d’identifier correctement l’établissement.', passed: Boolean(optionalText(input.record.name) && optionalText(input.record.city)), applicable: true, blocking: true, sourceType: input.kind, sourceId: text(input.record.id), actionLabel: 'Compléter les informations', actionKey: input.kind === 'school' ? 'institution.update_information' : 'site.update_information', exactHref: null, ownerLabel: responsible, dueAt: null }),
    requirement({ key: 'contact', label: 'Coordonnées principales', explanation: 'Un téléphone et un e-mail sont nécessaires pour les échanges administratifs.', passed: contactComplete, applicable: true, blocking: true, sourceType: input.kind, sourceId: text(input.record.id), actionLabel: 'Mettre à jour les coordonnées', actionKey: input.kind === 'school' ? 'institution.update_information' : 'site.update_information', exactHref: null, ownerLabel: responsible, dueAt: null }),
    requirement({ key: 'responsible', label: isRoot ? 'Responsable administratif' : 'Coordinateur du site', explanation: 'Une personne doit être clairement responsable du suivi administratif.', passed: Boolean(responsible), applicable: true, blocking: true, sourceType: input.kind, sourceId: text(input.record.id), actionLabel: isRoot ? 'Attribuer un responsable' : 'Attribuer un coordinateur', actionKey: isRoot ? 'institution.assign_responsible' : 'site.assign_coordinator', exactHref: null, ownerLabel: responsible, dueAt: null }),
    requirement({ key: 'academic_year', label: 'Année scolaire active', explanation: 'L’établissement a besoin d’une année scolaire active pour accueillir les enfants.', passed: Boolean(input.currentYear), applicable: isRoot, blocking: true, sourceType: 'academic_year', sourceId: optionalText(input.currentYear?.id), actionLabel: 'Configurer l’année scolaire', actionKey: null, exactHref: '/angelcare-360-command-center/administration?plane=academic-structure&view=academic-years&source=institutions', ownerLabel: responsible, dueAt: null }),
    requirement({ key: 'classes', label: 'Classes préparées', explanation: 'Au moins une classe doit être disponible avant l’ouverture opérationnelle.', passed: relevantClasses.length > 0, applicable: isRoot, blocking: true, sourceType: 'class', sourceId: null, actionLabel: 'Créer ou vérifier les classes', actionKey: null, exactHref: '/angelcare-360-command-center/administration?plane=classes-capacity&view=classes&source=institutions', ownerLabel: responsible, dueAt: null }),
    requirement({ key: 'capacity', label: 'Capacité des classes', explanation: 'Chaque classe active doit avoir une capacité définie.', passed: capacityComplete, applicable: isRoot && relevantClasses.length > 0, blocking: true, sourceType: 'class', sourceId: null, actionLabel: 'Voir les classes sans capacité', actionKey: null, exactHref: '/angelcare-360-command-center/administration?plane=classes-capacity&view=capacity&filter=unconfigured&source=institutions', ownerLabel: responsible, dueAt: null }),
    requirement({ key: 'users', label: 'Accès administratifs', explanation: 'Au moins un compte autorisé doit pouvoir administrer l’établissement.', passed: input.activeUsers > 0, applicable: true, blocking: true, sourceType: 'user', sourceId: null, actionLabel: 'Vérifier les accès', actionKey: null, exactHref: '/angelcare-360-command-center/administration?plane=roles-permissions&view=users&source=institutions', ownerLabel: responsible, dueAt: null }),
    requirement({ key: 'documents', label: 'Documents administratifs', explanation: 'Les documents nécessaires doivent être ajoutés et vérifiés.', passed: verifiedDocuments > 0, applicable: true, blocking: false, sourceType: 'document', sourceId: null, actionLabel: 'Ajouter ou vérifier un document', actionKey: 'institution.request_document', exactHref: null, ownerLabel: responsible, dueAt: null }),
  ]
}

function attentionFromRequirements(record: Row, kind: InstitutionKind, requirements: InstitutionRequirement[]): InstitutionAttentionItem[] {
  return requirements.filter((item) => item.applicable && !item.passed).map((item) => ({
    id: `${kind}:${text(record.id)}:${item.key}`,
    institutionId: text(record.id),
    institutionKind: kind,
    title: item.label,
    explanation: item.explanation,
    consequence: item.blocking ? 'Cet élément empêche encore l’ouverture ou la validation complète.' : 'Cet élément doit être complété pour garder le dossier administratif à jour.',
    severity: item.blocking ? 'blocking' : 'warning',
    tone: item.blocking ? 'critical' : 'warning',
    ownerLabel: item.ownerLabel,
    dueAt: item.dueAt,
    recommendedActionLabel: item.actionLabel || 'Ouvrir le dossier concerné',
    actionKey: item.actionKey,
    exactHref: item.exactHref,
    sourceType: item.sourceType || kind,
    sourceId: item.sourceId,
  }))
}

async function buildInstitutionRecord(input: {
  db: Db
  schoolId: string
  record: Row
  kind: InstitutionKind
  currentYear: Row | undefined
  classes: Row[]
  students: Row[]
  activeUsers: number
  sitesCount: number
  allDocuments: Row[]
  allTasks: Row[]
  allNotes: Row[]
  lifecycle: Row[]
  auditRows: Row[]
}): Promise<InstitutionRecord> {
  const id = text(input.record.id)
  const metadata = row(input.record.metadata_json)
  const relevantDocuments = input.allDocuments.filter((item) => text(item.documentable_id) === id).map(mapDocument)
  const relevantTasks = input.allTasks.filter((item) => text(item.institution_id) === id).map(mapTask)
  const relevantNotes = input.allNotes.filter((item) => text(item.institution_id) === id).map(mapNote)
  const requirements = institutionRequirements({ record: input.record, kind: input.kind, currentYear: input.currentYear, classes: input.classes, activeUsers: input.activeUsers, documents: relevantDocuments, tasks: relevantTasks })
  const status = humanStatus(input.kind, text(input.record.status, 'draft'), metadata, requirements)
  const attention = attentionFromRequirements(input.record, input.kind, requirements)
  const relevantClasses = input.classes.filter((item) => input.kind === 'school' ? !optionalText(row(item.metadata_json).site_id) : optionalText(row(item.metadata_json).site_id) === id)
  const capacity = relevantClasses.reduce((sum, item) => sum + numeric(item.capacity), 0)
  const activeChildren = input.kind === 'school'
    ? input.students.filter((item) => text(item.status) === 'active' && !optionalText(row(item.metadata_json).site_id)).length
    : input.students.filter((item) => text(item.status) === 'active' && optionalText(row(item.metadata_json).site_id) === id).length
  const complete = requirements.filter((item) => item.applicable && item.passed).length
  const required = requirements.filter((item) => item.applicable).length
  const next = attention[0]
  const history = [
    ...input.lifecycle.filter((item) => text(item.institution_id) === id).map((item) => historyEvent({ ...item, label: lifecycleLabel(text(item.to_state)) }, 'Étape de l’établissement mise à jour')),
    ...input.auditRows.filter((item) => text(item.entity_id) === id).map((item) => historyEvent(item, 'Dossier mis à jour')),
  ].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 100)
  return {
    id,
    kind: input.kind,
    parentSchoolId: input.kind === 'site' ? text(input.record.school_id, input.schoolId) : null,
    code: text(input.record.school_code || input.record.site_code),
    name: text(input.record.name),
    legalName: optionalText(input.record.legal_name || metadata.legal_name),
    schoolType: text(input.record.school_type || input.record.site_type, input.kind === 'school' ? 'école' : 'site'),
    city: optionalText(input.record.city),
    address: optionalText(input.record.address || metadata.address),
    phone: optionalText(input.record.phone || metadata.phone),
    email: optionalText(input.record.email || metadata.email),
    website: optionalText(input.record.website || metadata.website),
    timezone: text(input.record.timezone, 'Africa/Casablanca'),
    operatingHours: optionalText(metadata.operating_hours),
    publicDescription: optionalText(metadata.public_description),
    responsibleUserId: optionalText(metadata.responsible_user_id || metadata.setup_owner_user_id),
    responsibleLabel: optionalText(metadata.responsible_label || metadata.setup_owner_label),
    coordinatorUserId: optionalText(metadata.coordinator_user_id),
    coordinatorLabel: optionalText(metadata.coordinator_label),
    status,
    technicalStatus: text(input.record.status),
    statusExplanation: statusExplanation(status),
    tone: toneForStatus(status),
    currentAcademicYearId: input.kind === 'school' ? optionalText(input.currentYear?.id) : optionalText(metadata.academic_year_id || input.currentYear?.id),
    currentAcademicYearLabel: input.kind === 'school' ? optionalText(input.currentYear?.label) : optionalText(metadata.academic_year_label || input.currentYear?.label),
    activeChildren,
    classesCount: relevantClasses.length,
    capacity,
    activeUsers: input.activeUsers,
    sitesCount: input.kind === 'school' ? input.sitesCount : 0,
    requirementsComplete: complete,
    requirementsRequired: required,
    blockersCount: attention.filter((item) => item.severity === 'blocking').length,
    warningsCount: attention.filter((item) => item.severity === 'warning').length,
    nextActionLabel: next?.recommendedActionLabel || (status === 'open' ? 'Aucune action nécessaire' : 'Vérifier le dossier'),
    nextActionKey: next?.actionKey || null,
    updatedAt: optionalText(input.record.updated_at),
    requirements,
    attention,
    documents: relevantDocuments,
    tasks: relevantTasks,
    notes: relevantNotes,
    history,
  }
}

function lifecycleLabel(state: string) {
  const labels: Record<string, string> = {
    draft: 'Dossier créé',
    preparing: 'Préparation commencée',
    ready: 'Établissement prêt à ouvrir',
    active: 'Établissement ouvert',
    suspended: 'Établissement temporairement suspendu',
    reopening_review: 'Réouverture en cours de vérification',
    closing: 'Fermeture en préparation',
    closed: 'Établissement fermé',
    archived: 'Établissement archivé',
  }
  return labels[state] || 'État de l’établissement mis à jour'
}

export async function getInstitutionsSitesSnapshot(): Promise<InstitutionAreaSnapshot> {
  const context = await requireAreaContext()
  const db = await createClient()
  const schoolId = context.school!.id
  const [school, sites, academicYears, classes, students, staff, userRoles, documents, tasks, notes, lifecycle, auditRows] = await Promise.all([
    safeSchoolRow(db, schoolId),
    safeRows(db, 'angelcare360_governance_sites', schoolId, { order: 'created_at', ascending: true, limit: 100 }),
    safeRows(db, 'angelcare360_academic_years', schoolId, { order: 'starts_on', ascending: false, limit: 20 }),
    safeRows(db, 'angelcare360_classes', schoolId, { order: 'order_index', ascending: true, limit: 1000 }),
    safeRows(db, 'angelcare360_students', schoolId, { order: 'created_at', ascending: false, limit: 5000 }),
    safeRows(db, 'angelcare360_staff', schoolId, { order: 'full_name', ascending: true, limit: 1000 }),
    safeRows(db, 'angelcare360_user_roles', schoolId, { order: 'created_at', ascending: false, limit: 1000 }),
    safeRows(db, 'angelcare360_documents', schoolId, { order: 'created_at', ascending: false, limit: 1000 }),
    safeRows(db, 'angelcare360_institution_tasks', schoolId, { order: 'updated_at', ascending: false, limit: 1000 }),
    safeRows(db, 'angelcare360_institution_notes', schoolId, { order: 'created_at', ascending: false, limit: 1000 }),
    safeRows(db, 'angelcare360_governance_institution_lifecycle_events', schoolId, { order: 'effective_at', ascending: false, limit: 500 }),
    safeRows(db, 'angelcare360_audit_logs', schoolId, { order: 'created_at', ascending: false, limit: 500 }),
  ])
  const currentYear = academicYears.find((item) => text(item.status) === 'active') || academicYears.find((item) => boolean(item.is_current))
  const activeUsers = new Set(userRoles.filter((item) => text(item.status) === 'active').map((item) => text(item.app_user_id))).size
  const base = { db, schoolId, currentYear, classes, students, activeUsers, allDocuments: documents, allTasks: tasks, allNotes: notes, lifecycle, auditRows }
  const institutionRecords = await Promise.all([
    buildInstitutionRecord({ ...base, record: school, kind: 'school', sitesCount: sites.length }),
    ...sites.map((site) => buildInstitutionRecord({ ...base, record: site, kind: 'site' as const, sitesCount: 0 })),
  ])
  const attention = institutionRecords.flatMap((item) => item.attention)
  const openCount = institutionRecords.filter((item) => item.status === 'open').length
  const readyCount = institutionRecords.filter((item) => item.status === 'ready_to_open').length
  const suspendedCount = institutionRecords.filter((item) => item.status === 'suspended').length
  const title = sites.length ? 'Mes établissements' : 'Mon établissement'
  const subtitle = sites.length
    ? 'Suivez vos établissements et sites, terminez leur préparation et gardez chaque responsabilité claire.'
    : 'Retrouvez ce qui demande votre attention et terminez les tâches administratives sans quitter votre dossier.'
  return {
    generatedAt: now(),
    mode: sites.length ? 'multi' : 'single',
    title,
    subtitle,
    viewer: {
      userId: context.user.id,
      displayName: context.user.full_name || context.user.name || context.user.email || 'Utilisateur',
      roleLabel: context.access.roleLabel,
      canEdit: EDIT_ACCESS.has(context.access.accessLevel),
      canApproveOpening: APPROVAL_ACCESS.has(context.access.accessLevel),
      canSuspend: APPROVAL_ACCESS.has(context.access.accessLevel),
      canClose: APPROVAL_ACCESS.has(context.access.accessLevel),
      canAssign: EDIT_ACCESS.has(context.access.accessLevel),
      canViewHistory: context.access.canSeeAuditData,
    },
    institutions: institutionRecords,
    attention,
    directory: {
      staff: staff.map((item) => ({ id: text(item.id), label: text(item.full_name, text(item.staff_code)), secondary: optionalText(item.staff_code) || optionalText(item.staff_type) })),
      users: staff.filter((item) => Boolean(item.portal_app_user_id)).map((item) => ({ id: text(item.portal_app_user_id), label: text(item.full_name, text(item.staff_code)), secondary: 'Compte utilisateur' })),
    },
    metrics: [
      { key: 'attention', label: 'Éléments à régler', value: String(attention.length), detail: `${attention.filter((item) => item.severity === 'blocking').length} empêchent une validation complète`, tone: attention.some((item) => item.severity === 'blocking') ? 'critical' : attention.length ? 'warning' : 'verified', view: 'attention' },
      { key: 'open', label: 'Ouverts', value: String(openCount), detail: `${institutionRecords.length} dossier(s) au total`, tone: 'verified', view: 'schools' },
      { key: 'ready', label: 'Prêts à ouvrir', value: String(readyCount), detail: readyCount ? 'Validation finale possible' : 'Aucune ouverture en attente', tone: readyCount ? 'decision' : 'neutral', view: 'openings' },
      { key: 'suspended', label: 'Suspendus', value: String(suspendedCount), detail: suspendedCount ? 'Réouverture à préparer' : 'Aucune suspension active', tone: suspendedCount ? 'warning' : 'neutral', view: 'openings' },
      { key: 'sites', label: 'Sites', value: String(sites.length), detail: sites.length ? 'Rattachés à votre établissement principal' : 'Mode établissement unique', tone: sites.length ? 'active' : 'neutral', view: 'sites' },
    ],
    warnings: [],
  }
}

async function currentInstitution(db: Db, schoolId: string, id: string, kind: InstitutionKind) {
  if (kind === 'school') {
    if (id !== schoolId) throw new Angelcare360AccessError('Établissement hors de votre périmètre.', 403)
    return safeSchoolRow(db, schoolId)
  }
  const { data, error } = await db.from('angelcare360_governance_sites').select('*').eq('school_id', schoolId).eq('id', id).single()
  if (error) throw new Error('Le site demandé est introuvable.')
  return row(data)
}

async function audit(input: { schoolId: string; action: string; entityType: string; entityId: string; before?: Row; after?: Row; metadata?: Row; severity?: 'info' | 'notice' | 'warning' | 'critical' }) {
  await recordAngelcare360AuditEventServer({
    schoolId: input.schoolId,
    module: 'institutions_sites',
    action: input.action,
    category: 'settings',
    entityType: input.entityType,
    entityId: input.entityId,
    beforeData: input.before || {},
    afterData: input.after || {},
    metadata: input.metadata || {},
    severity: input.severity || 'info',
  })
}

async function updateInstitution(db: Db, schoolId: string, id: string, kind: InstitutionKind, updates: Row, metadataUpdates: Row) {
  const before = await currentInstitution(db, schoolId, id, kind)
  const metadata = { ...row(before.metadata_json), ...metadataUpdates }
  const table = kind === 'school' ? 'angelcare360_schools' : 'angelcare360_governance_sites'
  let query = db.from(table).update({ ...updates, metadata_json: metadata, updated_at: now() }).eq('id', id)
  if (kind === 'site') query = query.eq('school_id', schoolId)
  const { data, error } = await query.select('*').single()
  if (error) throw new Error('La modification n’a pas pu être enregistrée.')
  return { before, after: row(data) }
}

async function addLifecycleEvent(db: Db, input: { schoolId: string; institutionId: string; fromState: string; toState: string; reason: string | null; userId: string; effectiveAt: string }) {
  await db.from('angelcare360_governance_institution_lifecycle_events').insert({
    school_id: input.schoolId,
    institution_id: input.institutionId,
    from_state: input.fromState,
    to_state: input.toState,
    effective_at: input.effectiveAt,
    reason: input.reason,
    actor_user_id: input.userId,
  })
}

function actionNeedsApproval(action: InstitutionAreaActionKey) {
  return ['institution.open', 'site.open', 'institution.suspend', 'institution.reopen', 'institution.close', 'institution.archive', 'site.suspend', 'site.reopen', 'site.close'].includes(action)
}

export async function executeInstitutionAreaAction(request: InstitutionAreaActionRequest): Promise<InstitutionAreaActionResult> {
  const context = await requireAreaContext({ approve: actionNeedsApproval(request.actionKey) })
  const db = await createClient()
  const schoolId = context.school!.id
  const userId = context.user.id
  const key = idempotency(request.idempotencyKey, request)
  const existing = await safeRows(db, 'angelcare360_institution_action_receipts', schoolId, { order: 'created_at', limit: 500 })
  const replay = existing.find((item) => text(item.idempotency_key) === key)
  if (replay) return { ok: true, state: 'replayed', message: text(replay.message, 'Cette action a déjà été appliquée.'), institutionId: request.institutionId, result: row(replay.result_json) }
  const current = await currentInstitution(db, schoolId, request.institutionId, request.institutionKind)
  const metadata = row(current.metadata_json)
  const payload = row(request.payload)
  const effectiveAt = optionalText(request.effectiveAt) || now()
  const reason = optionalText(request.reason)
  let message = 'Modification enregistrée.'
  let result: Row = {}

  if (request.actionKey === 'institution.update_information' || request.actionKey === 'site.update_information') {
    const commonUpdates: Row = {
      name: optionalText(payload.name) || current.name,
      city: payload.city === undefined ? current.city : optionalText(payload.city),
      timezone: optionalText(payload.timezone) || current.timezone || 'Africa/Casablanca',
    }
    if (request.institutionKind === 'school') Object.assign(commonUpdates, {
      legal_name: payload.legalName === undefined ? current.legal_name : optionalText(payload.legalName),
      school_type: optionalText(payload.schoolType) || current.school_type,
      address: payload.address === undefined ? current.address : optionalText(payload.address),
      phone: payload.phone === undefined ? current.phone : optionalText(payload.phone),
      email: payload.email === undefined ? current.email : optionalText(payload.email),
      website: payload.website === undefined ? current.website : optionalText(payload.website),
    })
    const outcome = await updateInstitution(db, schoolId, request.institutionId, request.institutionKind, commonUpdates, {
      address: optionalText(payload.address), phone: optionalText(payload.phone), email: optionalText(payload.email), website: optionalText(payload.website), operating_hours: optionalText(payload.operatingHours), public_description: optionalText(payload.publicDescription),
    })
    message = 'Les informations de l’établissement ont été mises à jour.'
    result = outcome.after
    await audit({ schoolId, action: request.actionKey, entityType: request.institutionKind, entityId: request.institutionId, before: outcome.before, after: outcome.after })
  } else if (request.actionKey === 'institution.assign_responsible' || request.actionKey === 'site.assign_coordinator') {
    const label = optionalText(payload.personLabel)
    if (!label) throw new Error('Sélectionnez la personne responsable.')
    const metadataUpdate = request.institutionKind === 'school'
      ? { responsible_user_id: optionalText(payload.personUserId), responsible_label: label, setup_owner_user_id: optionalText(payload.personUserId), setup_owner_label: label }
      : { coordinator_user_id: optionalText(payload.personUserId), coordinator_label: label, setup_owner_user_id: optionalText(payload.personUserId), setup_owner_label: label }
    const outcome = await updateInstitution(db, schoolId, request.institutionId, request.institutionKind, {}, metadataUpdate)
    message = request.institutionKind === 'school' ? `${label} est maintenant responsable du dossier administratif.` : `${label} est maintenant coordinateur du site.`
    result = outcome.after
    await audit({ schoolId, action: request.actionKey, entityType: request.institutionKind, entityId: request.institutionId, before: outcome.before, after: outcome.after })
  } else if (request.actionKey === 'site.create') {
    const siteCode = optionalText(payload.code)
    const name = optionalText(payload.name)
    if (!siteCode || !name) throw new Error('Le code et le nom du site sont obligatoires.')
    const { data, error } = await db.from('angelcare360_governance_sites').insert({
      school_id: schoolId, site_code: siteCode, name, site_type: optionalText(payload.schoolType) || 'site', city: optionalText(payload.city), country: optionalText(payload.country) || 'Maroc', timezone: optionalText(payload.timezone) || 'Africa/Casablanca', status: 'draft', metadata_json: { governance_state: 'draft', address: optionalText(payload.address), phone: optionalText(payload.phone), email: optionalText(payload.email), operating_hours: optionalText(payload.operatingHours), setup_owner_user_id: optionalText(payload.personUserId), setup_owner_label: optionalText(payload.personLabel) }, created_by: userId, updated_by: userId,
    }).select('*').single()
    if (error) throw new Error(error.message.includes('duplicate') ? 'Ce code de site existe déjà.' : 'Le site n’a pas pu être créé.')
    message = 'Le nouveau site a été créé. Vous pouvez maintenant terminer sa préparation.'
    result = row(data)
    request.institutionId = text(row(data).id)
    await audit({ schoolId, action: request.actionKey, entityType: 'site', entityId: request.institutionId, after: row(data) })
  } else if (request.actionKey === 'institution.note.add') {
    const body = optionalText(payload.body)
    if (!body) throw new Error('Écrivez une note avant de l’enregistrer.')
    const { data, error } = await db.from('angelcare360_institution_notes').insert({ school_id: schoolId, institution_id: request.institutionId, institution_kind: request.institutionKind, body, important: boolean(payload.important), author_user_id: userId, author_label: context.user.full_name || context.user.name || context.user.email || 'Équipe administrative' }).select('*').single()
    if (error) throw new Error('La note n’a pas pu être enregistrée.')
    message = 'La note a été ajoutée au dossier.'
    result = row(data)
  } else if (request.actionKey.startsWith('institution.task.')) {
    if (request.actionKey === 'institution.task.assign' && !request.taskId) {
      const title = optionalText(payload.title)
      if (!title) throw new Error('Le titre de la tâche est obligatoire.')
      const { data, error } = await db.from('angelcare360_institution_tasks').insert({ school_id: schoolId, institution_id: request.institutionId, institution_kind: request.institutionKind, title, description: optionalText(payload.description), state: optionalText(payload.ownerLabel) ? 'assigned' : 'open', priority: optionalText(payload.priority) || 'normal', owner_user_id: optionalText(payload.ownerUserId), owner_label: optionalText(payload.ownerLabel), due_at: optionalText(payload.dueAt), source_type: optionalText(payload.sourceType), source_id: optionalText(payload.sourceId), created_by: userId, updated_by: userId }).select('*').single()
      if (error) throw new Error('La tâche n’a pas pu être créée.')
      message = optionalText(payload.ownerLabel) ? `La tâche a été attribuée à ${text(payload.ownerLabel)}.` : 'La tâche a été ajoutée au dossier.'
      result = row(data)
    } else {
      if (!request.taskId) throw new Error('La tâche concernée est introuvable.')
      const stateMap: Partial<Record<InstitutionAreaActionKey, string>> = { 'institution.task.start': 'in_progress', 'institution.task.complete': 'completed', 'institution.task.reopen': 'reopened', 'institution.task.assign': 'assigned' }
      const update: Row = { state: stateMap[request.actionKey], updated_by: userId, updated_at: now() }
      if (request.actionKey === 'institution.task.assign') Object.assign(update, { owner_user_id: optionalText(payload.ownerUserId), owner_label: optionalText(payload.ownerLabel), due_at: optionalText(payload.dueAt) })
      if (request.actionKey === 'institution.task.complete') Object.assign(update, { completed_by: userId, completed_at: now(), completion_note: reason })
      const { data, error } = await db.from('angelcare360_institution_tasks').update(update).eq('school_id', schoolId).eq('id', request.taskId).select('*').single()
      if (error) throw new Error('La tâche n’a pas pu être mise à jour.')
      message = request.actionKey === 'institution.task.complete' ? 'La tâche est terminée.' : request.actionKey === 'institution.task.reopen' ? 'La tâche a été réouverte.' : request.actionKey === 'institution.task.start' ? 'La tâche est maintenant en cours.' : 'La responsabilité a été mise à jour.'
      result = row(data)
    }
  } else if (request.actionKey === 'institution.request_document') {
    const title = optionalText(payload.title) || 'Document administratif à fournir'
    const { data, error } = await db.from('angelcare360_institution_tasks').insert({ school_id: schoolId, institution_id: request.institutionId, institution_kind: request.institutionKind, title, description: optionalText(payload.description) || 'Ajouter puis vérifier le document demandé.', state: optionalText(payload.ownerLabel) ? 'assigned' : 'open', priority: 'high', owner_user_id: optionalText(payload.ownerUserId), owner_label: optionalText(payload.ownerLabel), due_at: optionalText(payload.dueAt), source_type: 'document', created_by: userId, updated_by: userId }).select('*').single()
    if (error) throw new Error('La demande de document n’a pas pu être créée.')
    message = 'La demande de document a été ajoutée au dossier.'
    result = row(data)
  } else if (request.actionKey === 'institution.verify_document') {
    if (!request.documentId) throw new Error('Le document concerné est introuvable.')
    const { data, error } = await db.from('angelcare360_documents').update({ status: 'verified', verified_by: userId, verified_at: now(), updated_by: userId, updated_at: now(), metadata_json: { verified_by_label: context.user.full_name || context.user.name || context.user.email || 'Administration', verification_note: reason } }).eq('school_id', schoolId).eq('id', request.documentId).select('*').single()
    if (error) throw new Error('Le document n’a pas pu être vérifié.')
    message = 'Le document a été vérifié.'
    result = row(data)
  } else if (request.actionKey === 'institution.prepare_opening' || request.actionKey === 'institution.request_opening_approval') {
    const snapshot = await getInstitutionsSitesSnapshot()
    const record = snapshot.institutions.find((item) => item.id === request.institutionId)
    if (!record) throw new Error('Le dossier de l’établissement est introuvable.')
    const blockers = record.requirements.filter((item) => item.applicable && item.blocking && !item.passed).map((item) => item.label)
    const reviewState = blockers.length ? 'blocked' : request.actionKey === 'institution.request_opening_approval' ? 'approval_requested' : 'ready'
    const { data, error } = await db.from('angelcare360_institution_reviews').insert({ school_id: schoolId, institution_id: request.institutionId, institution_kind: request.institutionKind, review_type: 'opening', state: reviewState, summary_json: { blockers, requirements: record.requirements }, requested_by: userId, requested_at: now(), reason }).select('*').single()
    if (error) throw new Error('La vérification d’ouverture n’a pas pu être enregistrée.')
    if (blockers.length) return { ok: true, state: 'blocked', message: `L’ouverture ne peut pas encore être validée. ${blockers.length} élément(s) restent à compléter.`, institutionId: request.institutionId, blockers, result: row(data) }
    message = request.actionKey === 'institution.request_opening_approval' ? 'La demande de validation a été transmise à la direction.' : 'Le dossier est prêt pour la validation de l’ouverture.'
    result = row(data)
  } else if (['institution.open', 'site.open', 'institution.suspend', 'institution.reopen', 'institution.begin_closure', 'institution.close', 'institution.archive', 'site.suspend', 'site.reopen', 'site.begin_closure', 'site.close'].includes(request.actionKey)) {
    const snapshot = await getInstitutionsSitesSnapshot()
    const record = snapshot.institutions.find((item) => item.id === request.institutionId)
    if (!record) throw new Error('Le dossier concerné est introuvable.')
    if (['institution.open', 'site.open'].includes(request.actionKey) && record.blockersCount > 0) return { ok: true, state: 'blocked', message: 'L’établissement ne peut pas encore être ouvert.', institutionId: request.institutionId, blockers: record.requirements.filter((item) => item.blocking && !item.passed).map((item) => item.label) }
    if (['institution.close', 'site.close'].includes(request.actionKey)) {
      const blockers = [record.activeChildren ? `${record.activeChildren} enfant(s) actif(s)` : null, record.classesCount ? `${record.classesCount} classe(s) active(s)` : null, record.tasks.some((task) => !['completed', 'cancelled'].includes(task.state)) ? 'des tâches administratives encore ouvertes' : null].filter(Boolean) as string[]
      if (blockers.length) return { ok: true, state: 'blocked', message: 'Le dossier ne peut pas encore être fermé.', institutionId: request.institutionId, blockers }
    }
    const targetMap: Record<string, { status: string; state: string; message: string }> = {
      'institution.open': { status: 'active', state: 'active', message: 'L’établissement est maintenant ouvert dans le système.' },
      'site.open': { status: 'active', state: 'active', message: 'Le site est maintenant ouvert dans le système.' },
      'institution.suspend': { status: 'suspended', state: 'suspended', message: 'L’établissement est temporairement suspendu.' },
      'institution.reopen': { status: 'active', state: 'active', message: 'L’établissement est de nouveau ouvert.' },
      'institution.begin_closure': { status: text(current.status), state: 'closing', message: 'La préparation de la fermeture a commencé.' },
      'institution.close': { status: 'inactive', state: 'closed', message: 'L’établissement est fermé. Son historique reste disponible.' },
      'institution.archive': { status: 'archived', state: 'archived', message: 'L’établissement est archivé.' },
      'site.suspend': { status: 'suspended', state: 'suspended', message: 'Le site est temporairement suspendu.' },
      'site.reopen': { status: 'active', state: 'active', message: 'Le site est de nouveau ouvert.' },
      'site.begin_closure': { status: text(current.status), state: 'closing', message: 'La préparation de la fermeture du site a commencé.' },
      'site.close': { status: 'closed', state: 'closed', message: 'Le site est fermé. Son historique reste disponible.' },
    }
    const target = targetMap[request.actionKey]
    if (!target) throw new Error('Cette action n’est pas disponible.')
    if (['institution.suspend', 'site.suspend', 'institution.begin_closure', 'site.begin_closure', 'institution.close', 'site.close'].includes(request.actionKey) && !reason) throw new Error('Expliquez la raison de cette décision.')
    const outcome = await updateInstitution(db, schoolId, request.institutionId, request.institutionKind, { status: target.status, updated_by: userId }, { governance_state: target.state, governance_effective_at: effectiveAt, governance_reason: reason })
    await addLifecycleEvent(db, { schoolId, institutionId: request.institutionId, fromState: text(metadata.governance_state, text(current.status)), toState: target.state, reason, userId, effectiveAt })
    message = target.message
    result = outcome.after
    await audit({ schoolId, action: request.actionKey, entityType: request.institutionKind, entityId: request.institutionId, before: outcome.before, after: outcome.after, metadata: { reason, effectiveAt }, severity: target.state === 'suspended' || target.state === 'closed' ? 'notice' : 'info' })
  } else {
    throw new Error('Cette action n’est pas encore disponible dans ce dossier.')
  }

  try {
    await db.from('angelcare360_institution_action_receipts').insert({ school_id: schoolId, institution_id: request.institutionId, institution_kind: request.institutionKind, action_key: request.actionKey, idempotency_key: key, message, result_json: result, actor_user_id: userId })
  } catch {
    // Receipt is an idempotency safeguard; business action remains authoritative if the optional table is unavailable.
  }
  return { ok: true, state: 'completed', message, institutionId: request.institutionId, result }
}

export async function getInstitutionSiteDetail(id: string, kind: InstitutionKind) {
  const snapshot = await getInstitutionsSitesSnapshot()
  const record = snapshot.institutions.find((item) => item.id === id && item.kind === kind)
  if (!record) throw new Angelcare360AccessError('Le dossier demandé est introuvable ou hors de votre périmètre.', 404)
  return record
}
