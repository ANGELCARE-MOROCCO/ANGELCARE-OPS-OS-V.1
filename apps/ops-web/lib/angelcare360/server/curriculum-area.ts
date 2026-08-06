import { createHash, randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { Angelcare360AccessError, getAngelcare360AccessContext } from '@/lib/angelcare360/server/context'
import { recordAngelcare360AuditEventServer } from '@/lib/angelcare360/server/audit'
import type {
  CurriculumActionKey,
  CurriculumActionRequest,
  CurriculumActionResult,
  CurriculumAttentionItem,
  CurriculumBinding,
  CurriculumCoverageState,
  CurriculumDossierKind,
  CurriculumFrameworkRecord,
  CurriculumHistoryEvent,
  CurriculumLifecycle,
  CurriculumNote,
  CurriculumProductAccess,
  CurriculumResourceRecord,
  CurriculumSnapshot,
  CurriculumSubjectRecord,
  CurriculumTask,
  CurriculumTone,
  CurriculumVariationRecord,
  EvaluationPolicyRecord,
  LearningObjective,
  SubjectVersion,
} from '@/types/angelcare360/curriculum-area'

type Db = Awaited<ReturnType<typeof createClient>>
type Row = Record<string, unknown>

const EDIT_ACCESS = new Set(['super_admin', 'direction', 'administration', 'pedagogie', 'qualite'])
const APPROVAL_ACCESS = new Set(['super_admin', 'direction', 'pedagogie'])
const COMMERCIAL_ACCESS = new Set(['super_admin', 'direction', 'administration'])
const IMMUTABLE_VERSION_STATES = new Set(['active', 'replaced', 'retired', 'archived'])

function row(value: unknown): Row { return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {} }
function rows(value: unknown): Row[] { return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object').map((item) => item as Row) : [] }
function text(value: unknown, fallback = ''): string { return value === null || value === undefined ? fallback : String(value) }
function optionalText(value: unknown): string | null { const result = text(value).trim(); return result || null }
function numeric(value: unknown, fallback = 0): number { const result = Number(value); return Number.isFinite(result) ? result : fallback }
function boolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (value === true || value === 'true' || value === 1 || value === '1') return true
  if (value === false || value === 'false' || value === 0 || value === '0') return false
  return fallback
}
function stringArray(value: unknown): string[] { return Array.isArray(value) ? value.map(String).filter(Boolean) : typeof value === 'string' ? value.split(',').map((item) => item.trim()).filter(Boolean) : [] }
function now() { return new Date().toISOString() }
function dateOnly() { return now().slice(0, 10) }
function stableHash(value: unknown) { return createHash('sha256').update(JSON.stringify(value)).digest('hex') }
function required(value: unknown, label: string) { const result = optionalText(value); if (!result) throw new Error(`${label} est obligatoire.`); return result }
function idempotency(value: unknown, fallback: unknown) { return optionalText(value) || stableHash(fallback) }
function unique(values: string[]) { return Array.from(new Set(values.filter(Boolean))) }

async function requireAreaContext(options?: { approve?: boolean; commercial?: boolean }) {
  const context = await getAngelcare360AccessContext()
  const school = context?.school
  if (!school) throw new Angelcare360AccessError('Aucun établissement actif n’est disponible.', 403)
  if (!EDIT_ACCESS.has(context.access.accessLevel)) throw new Angelcare360AccessError('Cet espace est réservé aux utilisateurs autorisés à organiser le programme pédagogique.', 403)
  if (options?.approve && !APPROVAL_ACCESS.has(context.access.accessLevel)) throw new Angelcare360AccessError('La validation de la direction pédagogique est nécessaire.', 403)
  if (options?.commercial && !COMMERCIAL_ACCESS.has(context.access.accessLevel)) throw new Angelcare360AccessError('Une personne autorisée doit demander l’activation commerciale.', 403)
  return { ...context, school }
}

async function safeRows(db: Db, table: string, schoolId: string, options?: { order?: string; ascending?: boolean; limit?: number }) {
  try {
    let query = db.from(table).select('*').eq('school_id', schoolId)
    if (options?.order) query = query.order(options.order, { ascending: options.ascending ?? false })
    if (options?.limit) query = query.limit(options.limit)
    const { data, error } = await query
    return error ? [] : rows(data)
  } catch { return [] }
}

async function safeRow(db: Db, table: string, schoolId: string, id: string) {
  const { data, error } = await db.from(table).select('*').eq('school_id', schoolId).eq('id', id).single()
  if (error) throw new Error('Le dossier demandé est introuvable ou n’est plus disponible.')
  return row(data)
}

function lifecycle(value: unknown, fallback: CurriculumLifecycle = 'draft'): CurriculumLifecycle {
  const normalized = text(value, fallback)
  if (['draft', 'review', 'ready', 'active', 'change_prepared', 'scheduled', 'replaced', 'retired', 'archived'].includes(normalized)) return normalized as CurriculumLifecycle
  if (normalized === 'published') return 'active'
  if (normalized === 'inactive') return 'retired'
  return fallback
}

function lifecycleLabel(value: CurriculumLifecycle) {
  const labels: Record<CurriculumLifecycle, string> = {
    draft: 'Brouillon', review: 'À vérifier', ready: 'Prête à utiliser', active: 'Active', change_prepared: 'Modification préparée', scheduled: 'Modification programmée', replaced: 'Remplacée', retired: 'Retirée du programme', archived: 'Archivée',
  }
  return labels[value]
}

function toneForLifecycle(value: CurriculumLifecycle): CurriculumTone {
  if (value === 'active' || value === 'ready') return 'verified'
  if (value === 'review' || value === 'draft') return 'warning'
  if (value === 'change_prepared' || value === 'scheduled') return 'decision'
  return 'neutral'
}

function coverageLabel(value: CurriculumCoverageState) {
  const labels: Record<CurriculumCoverageState, string> = {
    complete: 'Complet', complete_with_note: 'Complet avec remarque', missing: 'À compléter', version_update: 'Version à mettre à jour', teacher_missing: 'Enseignant à affecter', evaluation_missing: 'Évaluation à définir', resource_missing: 'Ressource manquante', blocked: 'Bloqué', not_applicable: 'Non applicable',
  }
  return labels[value]
}

function toneForCoverage(value: CurriculumCoverageState): CurriculumTone {
  if (value === 'complete') return 'verified'
  if (value === 'blocked') return 'critical'
  if (value === 'not_applicable') return 'neutral'
  if (value === 'complete_with_note') return 'active'
  return 'warning'
}

function pedagogicalType(value: unknown): CurriculumSubjectRecord['pedagogicalType'] {
  const normalized = text(value)
  if (['required_subject', 'optional_subject', 'learning_domain', 'activity', 'specialised_programme', 'workshop', 'language_programme', 'cross_project'].includes(normalized)) return normalized as CurriculumSubjectRecord['pedagogicalType']
  return 'required_subject'
}

function pedagogicalTypeLabel(value: CurriculumSubjectRecord['pedagogicalType']) {
  const labels: Record<CurriculumSubjectRecord['pedagogicalType'], string> = {
    required_subject: 'Matière obligatoire', optional_subject: 'Matière optionnelle', learning_domain: 'Domaine d’apprentissage', activity: 'Activité pédagogique', specialised_programme: 'Programme spécialisé', workshop: 'Atelier complémentaire', language_programme: 'Programme linguistique', cross_project: 'Projet transversal',
  }
  return labels[value]
}

function evaluationMethod(value: unknown): EvaluationPolicyRecord['method'] {
  const normalized = text(value)
  if (['continuous_observation', 'competency_scale', 'numeric_grade', 'descriptive', 'portfolio', 'project', 'participation', 'none'].includes(normalized)) return normalized as EvaluationPolicyRecord['method']
  return 'continuous_observation'
}

function evaluationMethodLabel(value: EvaluationPolicyRecord['method']) {
  const labels: Record<EvaluationPolicyRecord['method'], string> = {
    continuous_observation: 'Observation continue', competency_scale: 'Compétence acquise / en cours / à renforcer', numeric_grade: 'Note chiffrée', descriptive: 'Appréciation descriptive', portfolio: 'Portfolio', project: 'Projet', participation: 'Participation', none: 'Aucune évaluation formelle',
  }
  return labels[value]
}

function resourceState(value: unknown): CurriculumResourceRecord['state'] {
  const normalized = text(value)
  if (['available', 'review', 'missing', 'restricted', 'expired', 'replaced', 'archived'].includes(normalized)) return normalized as CurriculumResourceRecord['state']
  return normalized === 'active' || normalized === 'verified' ? 'available' : 'review'
}

function resourceStateLabel(value: CurriculumResourceRecord['state']) {
  const labels: Record<CurriculumResourceRecord['state'], string> = { available: 'Disponible', review: 'À vérifier', missing: 'Manquante', restricted: 'Accès limité', expired: 'Licence expirée', replaced: 'Remplacée', archived: 'Archivée' }
  return labels[value]
}

function toneForResource(value: CurriculumResourceRecord['state']): CurriculumTone {
  if (value === 'available') return 'verified'
  if (value === 'missing' || value === 'expired') return 'critical'
  if (value === 'restricted') return 'decision'
  return 'warning'
}

function mapTask(item: Row): CurriculumTask {
  return { id: text(item.id), subjectId: optionalText(item.subject_id), curriculumId: optionalText(item.curriculum_id), issueId: optionalText(item.issue_id), title: text(item.title), description: optionalText(item.description), state: text(item.state, 'open') as CurriculumTask['state'], priority: text(item.priority, 'normal') as CurriculumTask['priority'], ownerUserId: optionalText(item.owner_user_id), ownerLabel: optionalText(item.owner_label), dueAt: optionalText(item.due_at), createdAt: text(item.created_at, now()), updatedAt: text(item.updated_at, now()) }
}

function mapNote(item: Row): CurriculumNote {
  return { id: text(item.id), subjectId: optionalText(item.subject_id), curriculumId: optionalText(item.curriculum_id), issueId: optionalText(item.issue_id), body: text(item.body), important: boolean(item.important), authorLabel: text(item.author_label, 'Équipe pédagogique'), createdAt: text(item.created_at, now()) }
}

function mapHistory(item: Row, fallback = 'Mise à jour du programme pédagogique'): CurriculumHistoryEvent {
  return { id: text(item.id, stableHash(item)), label: text(item.label || item.action || item.event_type, fallback), detail: optionalText(item.detail || item.reason), actorLabel: optionalText(item.actor_label || item.actor_role || row(item.metadata_json).actor_label), createdAt: text(item.created_at || item.effective_at, now()), tone: text(item.severity) === 'critical' ? 'critical' : text(item.severity) === 'warning' ? 'warning' : 'neutral', sourceType: optionalText(item.entity_type || item.source_type), sourceId: optionalText(item.entity_id || item.source_id) }
}

function productAccess(context: Awaited<ReturnType<typeof requireAreaContext>>): CurriculumProductAccess {
  const entitlement = context.runtimeEntitlements
  const enabled = [...entitlement.enabledModules, ...entitlement.enabledCapabilities, ...entitlement.enabledFeatures, ...entitlement.enabledServices]
  const restricted = [...entitlement.restrictedModules, ...entitlement.restrictedCapabilities, ...entitlement.restrictedFeatures, ...entitlement.restrictedServices]
  const relevant = (value: string) => /curriculum|programme|montessori|bilingual|language|stem|assessment|resource/i.test(value)
  const enabledCurriculumCodes = unique(enabled.filter(relevant))
  const restrictedCurriculumCodes = unique(restricted.map((item) => item.key).filter(relevant))
  const provisioning = entitlement.provisioning.filter((item) => relevant(`${item.itemType} ${item.itemKey}`))
  const availableOffers: CurriculumProductAccess['availableOffers'] = provisioning.map((item) => ({
    code: item.itemKey,
    label: item.itemKey.replace(/[._-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
    state: item.state === 'active' || item.state === 'provisioned' ? 'activated' as const : item.state === 'trial' ? 'trial' as const : item.state === 'expired' ? 'expired' as const : item.state === 'available' ? 'available' as const : 'unavailable' as const,
    exactCatalogueHref: `/angelcare-360-operator/platform?workspace=product&section=curriculum&item=${encodeURIComponent(item.itemKey)}&school=${context.school.id}`,
  }))
  enabledCurriculumCodes.forEach((code) => {
    if (!availableOffers.some((item) => item.code === code)) availableOffers.push({ code, label: code.replace(/[._-]+/g, ' '), state: 'included', exactCatalogueHref: null })
  })
  restrictedCurriculumCodes.forEach((code) => {
    if (!availableOffers.some((item) => item.code === code)) availableOffers.push({ code, label: code.replace(/[._-]+/g, ' '), state: 'available', exactCatalogueHref: `/angelcare-360-operator/platform?workspace=product&section=curriculum&item=${encodeURIComponent(code)}&school=${context.school.id}` })
  })
  return { packageVersionId: entitlement.packageVersionId, packageVersionName: entitlement.packageVersionName, enabledCurriculumCodes, restrictedCurriculumCodes, availableOffers }
}

async function audit(input: { schoolId: string; action: string; entityType: string; entityId: string | null; before?: Row; after?: Row; metadata?: Row; severity?: 'info' | 'warning' | 'critical' }) {
  await recordAngelcare360AuditEventServer({ schoolId: input.schoolId, module: 'curriculum_area', action: input.action, category: 'settings', entityType: input.entityType, entityId: input.entityId, beforeData: input.before || {}, afterData: input.after || {}, metadata: input.metadata || {}, severity: input.severity || 'info' })
}

function makeAttention(input: Omit<CurriculumAttentionItem, 'resolved'> & { resolved?: boolean }): CurriculumAttentionItem { return { ...input, resolved: input.resolved ?? false } }

export async function getCurriculumSnapshot(): Promise<CurriculumSnapshot> {
  const context = await requireAreaContext()
  const db = await createClient()
  const schoolId = context.school.id
  const [subjectRows, yearRows, periodRows, classRows, sectionRows, classSubjectRows, assignmentRows, assessmentRows, reportCardRows, curriculumRows, curriculumVersionRows, subjectVersionRows, bindingRows, objectiveRows, policyRows, resourceBindingRows, variationRows, findingRows, taskRows, noteRows, institutionRows, siteRows, staffRows, documentRows, auditRows] = await Promise.all([
    safeRows(db, 'angelcare360_subjects', schoolId, { order: 'name', ascending: true, limit: 5000 }),
    safeRows(db, 'angelcare360_academic_years', schoolId, { order: 'starts_on', ascending: false, limit: 100 }),
    safeRows(db, 'angelcare360_terms', schoolId, { order: 'starts_on', ascending: true, limit: 500 }),
    safeRows(db, 'angelcare360_classes', schoolId, { order: 'name', ascending: true, limit: 10000 }),
    safeRows(db, 'angelcare360_sections', schoolId, { order: 'name', ascending: true, limit: 10000 }),
    safeRows(db, 'angelcare360_class_subjects', schoolId, { order: 'created_at', ascending: false, limit: 50000 }),
    safeRows(db, 'angelcare360_teacher_assignments', schoolId, { order: 'created_at', ascending: false, limit: 50000 }),
    safeRows(db, 'angelcare360_assessments', schoolId, { order: 'created_at', ascending: false, limit: 50000 }),
    safeRows(db, 'angelcare360_report_cards', schoolId, { order: 'created_at', ascending: false, limit: 50000 }),
    safeRows(db, 'angelcare360_curriculum_frameworks', schoolId, { order: 'updated_at', ascending: false, limit: 5000 }),
    safeRows(db, 'angelcare360_curriculum_framework_versions', schoolId, { order: 'version_number', ascending: false, limit: 10000 }),
    safeRows(db, 'angelcare360_subject_versions', schoolId, { order: 'version_number', ascending: false, limit: 20000 }),
    safeRows(db, 'angelcare360_curriculum_bindings', schoolId, { order: 'created_at', ascending: false, limit: 50000 }),
    safeRows(db, 'angelcare360_learning_objectives', schoolId, { order: 'sequence_order', ascending: true, limit: 100000 }),
    safeRows(db, 'angelcare360_evaluation_policy_versions', schoolId, { order: 'updated_at', ascending: false, limit: 10000 }),
    safeRows(db, 'angelcare360_curriculum_resource_bindings', schoolId, { order: 'created_at', ascending: false, limit: 50000 }),
    safeRows(db, 'angelcare360_curriculum_variations', schoolId, { order: 'updated_at', ascending: false, limit: 10000 }),
    safeRows(db, 'angelcare360_curriculum_coverage_findings', schoolId, { order: 'updated_at', ascending: false, limit: 50000 }),
    safeRows(db, 'angelcare360_curriculum_tasks', schoolId, { order: 'updated_at', ascending: false, limit: 20000 }),
    safeRows(db, 'angelcare360_curriculum_notes', schoolId, { order: 'created_at', ascending: false, limit: 20000 }),
    safeRows(db, 'angelcare360_institutions', schoolId, { order: 'created_at', ascending: true, limit: 500 }),
    safeRows(db, 'angelcare360_governance_sites', schoolId, { order: 'created_at', ascending: true, limit: 500 }),
    safeRows(db, 'angelcare360_staff', schoolId, { order: 'full_name', ascending: true, limit: 10000 }),
    safeRows(db, 'angelcare360_documents', schoolId, { order: 'created_at', ascending: false, limit: 50000 }),
    safeRows(db, 'angelcare360_audit_logs', schoolId, { order: 'created_at', ascending: false, limit: 3000 }),
  ])
  const currentYear = yearRows.find((item) => boolean(item.is_current)) || yearRows.find((item) => text(item.status) === 'active') || yearRows[0] || null
  const currentYearId = optionalText(currentYear?.id)
  const classMap = new Map(classRows.map((item) => [text(item.id), item]))
  const sectionMap = new Map(sectionRows.map((item) => [text(item.id), item]))
  const subjectMap = new Map(subjectRows.map((item) => [text(item.id), item]))
  const curriculumMap = new Map(curriculumRows.map((item) => [text(item.id), item]))
  const yearMap = new Map(yearRows.map((item) => [text(item.id), item]))
  const siteMap = new Map(siteRows.map((item) => [text(item.id), item]))
  const staffMap = new Map(staffRows.map((item) => [text(item.id), item]))
  const tasks = taskRows.map(mapTask)
  const notes = noteRows.map(mapNote)
  const history = auditRows.map((item) => mapHistory(item)).filter((item) => !item.sourceType || /subject|curriculum|evaluation|resource|programme/i.test(item.sourceType || item.label))

  const objectives: LearningObjective[] = objectiveRows.map((item) => ({
    id: text(item.id), subjectId: optionalText(item.subject_id), curriculumId: optionalText(item.curriculum_id), title: text(item.title), description: optionalText(item.description), levelLabel: optionalText(item.level_label), expectedPeriodId: optionalText(item.expected_period_id), expectedPeriodLabel: optionalText(periodRows.find((period) => text(period.id) === text(item.expected_period_id))?.name), required: boolean(item.required, true), observableResult: optionalText(item.observable_result), competencyCode: optionalText(item.competency_code), sequenceOrder: numeric(item.sequence_order), effectiveFrom: optionalText(item.effective_from), effectiveTo: optionalText(item.effective_to), state: lifecycle(item.state),
  }))

  const versions: SubjectVersion[] = subjectVersionRows.map((item) => {
    const state = lifecycle(item.state)
    return { id: text(item.id), subjectId: text(item.subject_id), versionLabel: text(item.version_label, `Version ${numeric(item.version_number, 1)}`), versionNumber: numeric(item.version_number, 1), state, stateLabel: lifecycleLabel(state), effectiveFrom: optionalText(item.effective_from), effectiveTo: optionalText(item.effective_to), applicableLevels: stringArray(item.applicable_levels), expectedWeeklyHours: item.expected_weekly_hours === null ? null : numeric(item.expected_weekly_hours), evaluationPolicyId: optionalText(item.evaluation_policy_id), resourceIds: stringArray(item.resource_ids), changeReason: optionalText(item.change_reason), replacesVersionId: optionalText(item.replaces_version_id), approvedByLabel: optionalText(item.approved_by_label), createdAt: text(item.created_at, now()) }
  })

  const evaluationPolicies: EvaluationPolicyRecord[] = policyRows.map((item) => {
    const method = evaluationMethod(item.method)
    const life = lifecycle(item.state)
    const subject = subjectMap.get(text(item.subject_id))
    const curriculum = curriculumMap.get(text(item.curriculum_id))
    const issueIds = findingRows.filter((finding) => text(finding.evaluation_policy_id) === text(item.id) && text(finding.state, 'open') !== 'resolved').map((finding) => text(finding.id))
    return { id: text(item.id), schoolId, subjectId: optionalText(item.subject_id), subjectLabel: optionalText(subject?.name), curriculumId: optionalText(item.curriculum_id), curriculumLabel: optionalText(curriculum?.name), levelLabel: optionalText(item.level_label), academicYearId: optionalText(item.academic_year_id), method, methodLabel: evaluationMethodLabel(method), scaleCode: optionalText(item.scale_code), requiredPeriodIds: stringArray(item.required_period_ids), evidenceRequired: boolean(item.evidence_required), reportCardMapping: optionalText(item.report_card_mapping), lifecycle: life, lifecycleLabel: lifecycleLabel(life), tone: toneForLifecycle(life), versionNumber: numeric(item.version_number, 1), effectiveFrom: optionalText(item.effective_from), effectiveTo: optionalText(item.effective_to), classCount: bindingRows.filter((binding) => text(binding.evaluation_policy_id) === text(item.id)).length, issueIds, updatedAt: optionalText(item.updated_at) }
  })
  const policyMap = new Map(evaluationPolicies.map((item) => [item.id, item]))

  const resources: CurriculumResourceRecord[] = resourceBindingRows.map((item) => {
    const subject = subjectMap.get(text(item.subject_id))
    const curriculum = curriculumMap.get(text(item.curriculum_id))
    const document = documentRows.find((candidate) => text(candidate.id) === text(item.document_id))
    const state = resourceState(item.state || document?.status)
    return { id: text(item.id), schoolId, documentId: optionalText(item.document_id), code: text(item.resource_code, text(document?.id).slice(0, 8)), name: text(item.name || document?.title, 'Ressource pédagogique'), category: text(item.category || document?.category, 'Ressource'), language: optionalText(item.language), subjectId: optionalText(item.subject_id), subjectLabel: optionalText(subject?.name), curriculumId: optionalText(item.curriculum_id), curriculumLabel: optionalText(curriculum?.name), applicableLevels: stringArray(item.applicable_levels), state, stateLabel: resourceStateLabel(state), tone: toneForResource(state), licenceCode: optionalText(item.licence_code), entitlementCode: optionalText(item.entitlement_code), effectiveFrom: optionalText(item.effective_from), effectiveTo: optionalText(item.effective_to), exactHref: item.document_id ? `/angelcare-360-command-center/documents?entity=${text(item.document_id)}&drawer=evidence&source=subjects` : null, updatedAt: optionalText(item.updated_at || document?.updated_at) }
  })

  const resourceBySubject = new Map<string, CurriculumResourceRecord[]>()
  resources.forEach((item) => { if (item.subjectId) resourceBySubject.set(item.subjectId, [...(resourceBySubject.get(item.subjectId) || []), item]) })

  const canonicalBindings: CurriculumBinding[] = []
  const sourceBindings: Row[] = bindingRows.length ? bindingRows : classSubjectRows.map((item): Row => ({ ...item, curriculum_id: null, subject_version_id: null, required: item.is_required, expected_weekly_hours: null, evaluation_policy_id: null }))
  for (const item of sourceBindings) {
    const classRecord = classMap.get(text(item.class_id))
    const section = sectionMap.get(text(item.section_id))
    const subjectId = text(item.subject_id)
    if (!subjectId || !classRecord) continue
    const teacherAssignments = assignmentRows.filter((assignment) => text(assignment.subject_id) === subjectId && text(assignment.class_id) === text(item.class_id) && text(assignment.status) === 'active')
    const teacherLabels = unique(teacherAssignments.map((assignment) => text(staffMap.get(text(assignment.staff_id))?.full_name)).filter(Boolean))
    const policyId = optionalText(item.evaluation_policy_id)
    const policy = policyId ? policyMap.get(policyId) : evaluationPolicies.find((candidate) => candidate.subjectId === subjectId && (!candidate.levelLabel || candidate.levelLabel === text(classRecord.level)) && candidate.lifecycle === 'active')
    const subjectResources = resourceBySubject.get(subjectId) || []
    const required = boolean(item.required ?? item.is_required, true)
    const activeVersion = versions.find((version) => version.id === text(item.subject_version_id)) || versions.find((version) => version.subjectId === subjectId && version.state === 'active')
    let coverageState: CurriculumCoverageState = 'complete'
    if (!activeVersion && versions.some((version) => version.subjectId === subjectId)) coverageState = 'version_update'
    else if (!teacherAssignments.length) coverageState = 'teacher_missing'
    else if (!policy && required) coverageState = 'evaluation_missing'
    else if (subjectResources.some((resource) => ['missing', 'expired', 'restricted'].includes(resource.state))) coverageState = 'resource_missing'
    canonicalBindings.push({ id: text(item.id, stableHash(item)), curriculumId: optionalText(item.curriculum_id), subjectId, subjectVersionId: activeVersion?.id || null, academicYearId: optionalText(item.academic_year_id || classRecord.academic_year_id), classId: text(item.class_id), classLabel: text(classRecord.name), sectionId: optionalText(item.section_id), sectionLabel: optionalText(section?.name), levelLabel: optionalText(classRecord.level), required, expectedWeeklyHours: item.expected_weekly_hours === null || item.expected_weekly_hours === undefined ? activeVersion?.expectedWeeklyHours ?? null : numeric(item.expected_weekly_hours), teacherAssignmentCount: teacherAssignments.length, teacherLabels, evaluationPolicyId: policy?.id || null, evaluationState: policy ? 'ready' : required ? 'missing' : 'not_required', resourceState: subjectResources.length ? subjectResources.every((resource) => resource.state === 'available') ? 'ready' : subjectResources.some((resource) => resource.state === 'restricted') ? 'restricted' : 'missing' : 'not_required', coverageState, coverageLabel: coverageLabel(coverageState), tone: toneForCoverage(coverageState), exactClassHref: `/angelcare-360-command-center/administration?plane=classes-capacity&view=classes&entity=${text(item.class_id)}&type=class&drawer=dossier&tab=organisation&source=subjects`, exactAssignmentHref: `/angelcare-360-command-center/administration?plane=assignments&class=${text(item.class_id)}&subject=${subjectId}&drawer=dossier&source=subjects` })
  }

  const subjects: CurriculumSubjectRecord[] = subjectRows.map((item) => {
    const subjectId = text(item.id)
    const metadata = row(item.metadata_json)
    const subjectVersions = versions.filter((version) => version.subjectId === subjectId)
    const fallbackVersion: SubjectVersion = { id: `${subjectId}:base`, subjectId, versionLabel: `Version ${numeric(metadata.version_number, 1)}`, versionNumber: numeric(metadata.version_number, 1), state: lifecycle(text(item.status) === 'active' ? 'active' : metadata.curriculum_state), stateLabel: lifecycleLabel(lifecycle(text(item.status) === 'active' ? 'active' : metadata.curriculum_state)), effectiveFrom: optionalText(metadata.effective_from || item.created_at), effectiveTo: optionalText(metadata.effective_to), applicableLevels: stringArray(metadata.applicable_levels), expectedWeeklyHours: item.credit_hours === null ? null : numeric(item.credit_hours), evaluationPolicyId: null, resourceIds: [], changeReason: null, replacesVersionId: null, approvedByLabel: null, createdAt: text(item.created_at, now()) }
    const allVersions = subjectVersions.length ? subjectVersions : [fallbackVersion]
    const currentVersion = allVersions.find((version) => version.state === 'active') || allVersions[0]
    const bindings = canonicalBindings.filter((binding) => binding.subjectId === subjectId)
    const subjectObjectives = objectives.filter((objective) => objective.subjectId === subjectId)
    const subjectResources = resourceBySubject.get(subjectId) || []
    const coverageStates = bindings.map((binding) => binding.coverageState)
    let coverageState: CurriculumCoverageState = !bindings.length ? 'missing' : coverageStates.includes('blocked') ? 'blocked' : coverageStates.includes('version_update') ? 'version_update' : coverageStates.includes('teacher_missing') ? 'teacher_missing' : coverageStates.includes('evaluation_missing') ? 'evaluation_missing' : coverageStates.includes('resource_missing') ? 'resource_missing' : coverageStates.includes('complete_with_note') ? 'complete_with_note' : 'complete'
    const life = lifecycle(currentVersion?.state || item.status)
    const type = pedagogicalType(metadata.pedagogical_type)
    const issueIds = findingRows.filter((finding) => text(finding.subject_id) === subjectId && text(finding.state, 'open') !== 'resolved').map((finding) => text(finding.id))
    let nextActionKey: CurriculumActionKey | null = null
    let nextActionLabel = 'Aucune action nécessaire'
    if (!bindings.length) { nextActionKey = 'curriculum.add_subject'; nextActionLabel = 'Ajouter cette matière à un programme' }
    else if (!subjectObjectives.length) { nextActionKey = 'learning_objective.create'; nextActionLabel = 'Ajouter les objectifs d’apprentissage' }
    else if (coverageState === 'version_update') { nextActionKey = 'subject.prepare_version'; nextActionLabel = 'Préparer une nouvelle version' }
    else if (coverageState === 'teacher_missing') { nextActionKey = 'curriculum_issue.assign'; nextActionLabel = 'Demander l’affectation d’un enseignant' }
    else if (coverageState === 'evaluation_missing') { nextActionKey = 'evaluation_policy.create'; nextActionLabel = 'Définir la méthode d’évaluation' }
    return { id: subjectId, schoolId, code: text(item.subject_code), name: text(item.name), shortName: optionalText(item.short_name), description: optionalText(metadata.description), pedagogicalType: type, pedagogicalTypeLabel: pedagogicalTypeLabel(type), department: optionalText(item.department), languages: stringArray(metadata.languages), requiredByDefault: boolean(metadata.required_by_default, true), applicableLevels: unique([...stringArray(metadata.applicable_levels), ...bindings.map((binding) => binding.levelLabel || '')]), lifecycle: life, lifecycleLabel: lifecycleLabel(life), tone: toneForCoverage(coverageState), currentVersionId: currentVersion?.id || null, currentVersionLabel: currentVersion?.versionLabel || null, linkedClasses: bindings.length, teacherCoverageCount: bindings.filter((binding) => binding.teacherAssignmentCount > 0).length, classCoverageCount: bindings.filter((binding) => binding.coverageState === 'complete').length, evaluationReadyCount: bindings.filter((binding) => binding.evaluationState === 'ready').length, resourceReadyCount: subjectResources.filter((resource) => resource.state === 'available').length, coverageState, coverageLabel: coverageLabel(coverageState), expectedWeeklyHours: currentVersion?.expectedWeeklyHours ?? (item.credit_hours === null ? null : numeric(item.credit_hours)), nextActionKey, nextActionLabel, versions: allVersions, objectives: subjectObjectives, bindings, resourceIds: subjectResources.map((resource) => resource.id), issueIds, updatedAt: optionalText(item.updated_at) }
  })

  const variations: CurriculumVariationRecord[] = variationRows.map((item) => {
    const state = text(item.state, 'draft') as CurriculumVariationRecord['lifecycle']
    const curriculum = curriculumMap.get(text(item.curriculum_id))
    const site = siteMap.get(text(item.site_id))
    const labels: Record<CurriculumVariationRecord['lifecycle'], string> = { draft: 'Variation en préparation', pending: 'Variation en attente', approved: 'Variation locale approuvée', rejected: 'Variation refusée', retired: 'Variation retirée' }
    return { id: text(item.id), curriculumId: text(item.curriculum_id), curriculumLabel: text(curriculum?.name, 'Programme'), siteId: optionalText(item.site_id), siteLabel: optionalText(site?.name), title: text(item.title, 'Variation locale'), reason: text(item.reason), lifecycle: state, lifecycleLabel: labels[state] || state, tone: state === 'approved' ? 'verified' : state === 'rejected' ? 'critical' : state === 'pending' ? 'decision' : 'warning', changes: row(item.changes_json), effectiveFrom: optionalText(item.effective_from), effectiveTo: optionalText(item.effective_to), approvedByLabel: optionalText(item.approved_by_label), updatedAt: text(item.updated_at, now()) }
  })

  const curricula: CurriculumFrameworkRecord[] = curriculumRows.map((item) => {
    const curriculumId = text(item.id)
    const metadata = row(item.metadata_json)
    const life = lifecycle(item.state)
    const versionsForCurriculum = curriculumVersionRows.filter((version) => text(version.curriculum_id) === curriculumId)
    const currentVersion = versionsForCurriculum.find((version) => text(version.state) === 'active') || versionsForCurriculum[0]
    const bindings = canonicalBindings.filter((binding) => binding.curriculumId === curriculumId)
    const subjectIds = unique(bindings.map((binding) => binding.subjectId))
    const classIds = unique(bindings.map((binding) => binding.classId || ''))
    const complete = bindings.filter((binding) => binding.coverageState === 'complete').length
    const issueIds = findingRows.filter((finding) => text(finding.curriculum_id) === curriculumId && text(finding.state, 'open') !== 'resolved').map((finding) => text(finding.id))
    let nextActionKey: CurriculumActionKey | null = null
    let nextActionLabel = 'Aucune action nécessaire'
    if (!subjectIds.length) { nextActionKey = 'curriculum.add_subject'; nextActionLabel = 'Ajouter les matières ou domaines' }
    else if (complete < bindings.length) { nextActionKey = 'curriculum.preview'; nextActionLabel = 'Vérifier la couverture pédagogique' }
    else if (life !== 'active') { nextActionKey = 'curriculum.request_approval'; nextActionLabel = 'Demander la validation du programme' }
    return { id: curriculumId, schoolId, code: text(item.curriculum_code), name: text(item.name), description: optionalText(item.description), academicYearId: optionalText(item.academic_year_id), academicYearLabel: optionalText(yearMap.get(text(item.academic_year_id))?.label), institutionId: optionalText(item.institution_id), institutionLabel: optionalText(institutionRows.find((institution) => text(institution.id) === text(item.institution_id))?.name || context.school.name), siteId: optionalText(item.site_id), siteLabel: optionalText(siteMap.get(text(item.site_id))?.name), applicableLevels: stringArray(item.applicable_levels), lifecycle: life, lifecycleLabel: lifecycleLabel(life), tone: toneForLifecycle(life), currentVersionLabel: text(currentVersion?.version_label, `Version ${numeric(currentVersion?.version_number, 1)}`), subjectIds, requiredSubjectIds: bindings.filter((binding) => binding.required).map((binding) => binding.subjectId), optionalSubjectIds: bindings.filter((binding) => !binding.required).map((binding) => binding.subjectId), classIds, classLabels: classIds.map((id) => text(classMap.get(id)?.name)).filter(Boolean), objectiveCount: objectives.filter((objective) => objective.curriculumId === curriculumId).length, evaluationPolicyCount: evaluationPolicies.filter((policy) => policy.curriculumId === curriculumId).length, resourceCount: resources.filter((resource) => resource.curriculumId === curriculumId).length, coverageComplete: complete, coverageTotal: bindings.length, coverageLabel: bindings.length ? `${complete} / ${bindings.length} éléments complets` : 'Programme à configurer', nextActionKey, nextActionLabel, variationIds: variations.filter((variation) => variation.curriculumId === curriculumId).map((variation) => variation.id), issueIds, updatedAt: optionalText(item.updated_at) }
  })

  const attention: CurriculumAttentionItem[] = []
  subjects.forEach((subject) => {
    if (!subject.bindings.length) attention.push(makeAttention({ id: `subject:${subject.id}:unbound`, sourceType: 'subject', sourceId: subject.id, title: `${subject.name} n’est liée à aucune classe`, explanation: 'Cette matière existe dans le catalogue mais ne fait partie d’aucun programme de classe.', consequence: 'Elle ne sera pas utilisée dans l’année scolaire active.', severity: 'warning', tone: 'warning', ownerLabel: null, dueAt: null, recommendedActionKey: 'curriculum.add_subject', recommendedActionLabel: 'Ajouter à un programme', exactHref: null }))
    if (!subject.objectives.length) attention.push(makeAttention({ id: `subject:${subject.id}:objectives`, sourceType: 'subject', sourceId: subject.id, title: `${subject.name} n’a aucun objectif d’apprentissage`, explanation: 'Le programme ne précise pas encore ce que les enfants doivent apprendre.', consequence: 'La progression et l’évaluation ne peuvent pas être vérifiées clairement.', severity: 'warning', tone: 'warning', ownerLabel: null, dueAt: null, recommendedActionKey: 'learning_objective.create', recommendedActionLabel: 'Ajouter les objectifs', exactHref: null }))
  })
  canonicalBindings.forEach((binding) => {
    if (binding.coverageState === 'complete') return
    const subject = subjects.find((item) => item.id === binding.subjectId)
    const title = binding.coverageState === 'teacher_missing' ? `${binding.classLabel} n’a aucun enseignant pour ${subject?.name || 'cette matière'}` : binding.coverageState === 'evaluation_missing' ? `${subject?.name || 'Cette matière'} n’a aucune méthode d’évaluation pour ${binding.classLabel}` : binding.coverageState === 'version_update' ? `${binding.classLabel} utilise une version à mettre à jour` : `${binding.classLabel} nécessite une vérification pédagogique`
    attention.push(makeAttention({ id: `binding:${binding.id}:${binding.coverageState}`, sourceType: 'binding', sourceId: binding.id, title, explanation: `La couverture pédagogique est indiquée “${binding.coverageLabel}”.`, consequence: 'Le programme de la classe n’est pas entièrement prêt.', severity: binding.coverageState === 'blocked' ? 'blocking' : 'warning', tone: binding.tone, ownerLabel: null, dueAt: null, recommendedActionKey: binding.coverageState === 'evaluation_missing' ? 'evaluation_policy.create' : 'curriculum_issue.assign', recommendedActionLabel: binding.coverageState === 'teacher_missing' ? 'Demander l’affectation d’un enseignant' : binding.coverageState === 'evaluation_missing' ? 'Définir l’évaluation' : 'Traiter ce point', exactHref: binding.coverageState === 'teacher_missing' ? binding.exactAssignmentHref : binding.exactClassHref }))
  })
  resources.filter((resource) => ['missing', 'restricted', 'expired'].includes(resource.state)).forEach((resource) => attention.push(makeAttention({ id: `resource:${resource.id}:${resource.state}`, sourceType: 'resource', sourceId: resource.id, title: `${resource.name} — ${resource.stateLabel}`, explanation: 'Une ressource liée au programme n’est pas pleinement disponible.', consequence: 'Les équipes peuvent manquer du support attendu.', severity: resource.state === 'missing' || resource.state === 'expired' ? 'blocking' : 'warning', tone: resource.tone, ownerLabel: null, dueAt: resource.effectiveTo, recommendedActionKey: resource.state === 'restricted' ? 'curriculum_resource.request_access' : 'curriculum_resource.replace', recommendedActionLabel: resource.state === 'restricted' ? 'Demander l’accès' : 'Remplacer la ressource', exactHref: resource.exactHref })))
  findingRows.filter((finding) => text(finding.state, 'open') !== 'resolved').forEach((finding) => attention.push(makeAttention({ id: text(finding.id), sourceType: text(finding.source_type, 'subject') as CurriculumAttentionItem['sourceType'], sourceId: text(finding.source_id || finding.subject_id || finding.curriculum_id), title: text(finding.title), explanation: text(finding.explanation), consequence: optionalText(finding.consequence), severity: text(finding.severity, 'warning') as CurriculumAttentionItem['severity'], tone: text(finding.severity) === 'blocking' ? 'critical' : 'warning', ownerLabel: optionalText(finding.owner_label), dueAt: optionalText(finding.due_at), recommendedActionKey: optionalText(finding.recommended_action_key) as CurriculumActionKey | null, recommendedActionLabel: optionalText(finding.recommended_action_label), exactHref: optionalText(finding.exact_href) })))

  const access = productAccess(context)
  access.availableOffers.filter((offer) => offer.state === 'available' || offer.state === 'expired').forEach((offer) => attention.push(makeAttention({ id: `product:${offer.code}`, sourceType: 'product_access', sourceId: offer.code, title: offer.state === 'expired' ? `${offer.label} — accès expiré` : `${offer.label} est disponible`, explanation: offer.state === 'expired' ? 'Le programme ne peut plus être utilisé sans réactivation.' : 'Ce programme n’est pas inclus dans votre formule actuelle.', consequence: offer.state === 'expired' ? 'Les ressources associées sont limitées.' : null, severity: offer.state === 'expired' ? 'blocking' : 'information', tone: offer.state === 'expired' ? 'critical' : 'decision', ownerLabel: null, dueAt: null, recommendedActionKey: 'curriculum_resource.request_access', recommendedActionLabel: offer.state === 'expired' ? 'Demander la réactivation' : 'Découvrir ce programme', exactHref: offer.exactCatalogueHref })))

  const siteCount = Math.max(1, siteRows.length)
  const completeBindings = canonicalBindings.filter((binding) => binding.coverageState === 'complete').length
  const metrics = [
    { key: 'active-subjects', label: 'Matières & domaines actifs', value: String(subjects.filter((subject) => subject.lifecycle === 'active').length), detail: `${subjects.length} élément(s) au catalogue`, tone: 'active' as CurriculumTone, view: 'catalogue' as const },
    { key: 'programmes', label: 'Programmes actifs', value: String(curricula.filter((curriculum) => curriculum.lifecycle === 'active').length), detail: `${curricula.length} programme(s) préparé(s)`, tone: curricula.length ? 'verified' as CurriculumTone : 'warning' as CurriculumTone, view: 'programmes' as const },
    { key: 'coverage', label: 'Couverture complète', value: canonicalBindings.length ? `${completeBindings}/${canonicalBindings.length}` : '0', detail: `${canonicalBindings.length - completeBindings} élément(s) à vérifier`, tone: completeBindings === canonicalBindings.length && canonicalBindings.length ? 'verified' as CurriculumTone : 'warning' as CurriculumTone, view: 'coverage' as const },
    { key: 'evaluation', label: 'Méthodes d’évaluation', value: String(evaluationPolicies.filter((policy) => policy.lifecycle === 'active').length), detail: `${canonicalBindings.filter((binding) => binding.evaluationState === 'missing').length} classe(s) sans règle · ${assessmentRows.length} évaluation(s) · ${reportCardRows.length} bulletin(s)`, tone: canonicalBindings.some((binding) => binding.evaluationState === 'missing') ? 'warning' as CurriculumTone : 'verified' as CurriculumTone, view: 'evaluation' as const },
    { key: 'attention', label: 'À régler', value: String(attention.filter((item) => !item.resolved).length), detail: `${attention.filter((item) => item.severity === 'blocking').length} bloquant(s)`, tone: attention.some((item) => item.severity === 'blocking') ? 'critical' as CurriculumTone : attention.length ? 'warning' as CurriculumTone : 'verified' as CurriculumTone, view: 'attention' as const },
  ]

  const preschool = subjects.some((subject) => subject.pedagogicalType === 'learning_domain') || classRows.some((item) => /petite|moyenne|grande|crèche|preschool|kindergarten/i.test(`${item.name} ${item.level}`))
  return {
    generatedAt: now(), mode: siteCount > 1 ? 'multi_site' : 'single_school', title: preschool ? 'Mon programme pédagogique' : siteCount > 1 ? 'Matières & programmes du réseau' : 'Matières & programme pédagogique', subtitle: currentYear ? `${text(currentYear.label)} · ${completeBindings} couverture(s) complète(s) sur ${canonicalBindings.length}` : 'Préparez les matières, objectifs et méthodes d’évaluation de l’école.', school: { id: schoolId, name: context.school.name, siteCount, currentAcademicYearId: currentYearId, currentAcademicYearLabel: optionalText(currentYear?.label) }, viewer: { roleLabel: context.access.roleLabel, accessLevel: context.access.accessLevel, canEdit: EDIT_ACCESS.has(context.access.accessLevel), canApprove: APPROVAL_ACCESS.has(context.access.accessLevel), canManageCommercialAccess: COMMERCIAL_ACCESS.has(context.access.accessLevel) }, metrics, subjects, curricula, bindings: canonicalBindings, evaluationPolicies, resources, variations, attention, tasks, notes, history, productAccess: access, directory: {
      academicYears: yearRows.map((item) => ({ id: text(item.id), label: text(item.label), secondary: text(item.status) })), periods: periodRows.map((item) => ({ id: text(item.id), label: text(item.name), secondary: text(item.term_code) })), institutions: institutionRows.map((item) => ({ id: text(item.id), label: text(item.name), secondary: text(item.institution_code) })), sites: siteRows.map((item) => ({ id: text(item.id), label: text(item.name), secondary: text(item.site_code) })), levels: unique(classRows.map((item) => text(item.level)).filter(Boolean)).map((label) => ({ id: label, label })), classes: classRows.map((item) => ({ id: text(item.id), label: text(item.name), secondary: text(item.level) })), sections: sectionRows.map((item) => ({ id: text(item.id), label: text(item.name), secondary: text(classMap.get(text(item.class_id))?.name) })), subjects: subjects.map((item) => ({ id: item.id, label: item.name, secondary: item.code })), curricula: curricula.map((item) => ({ id: item.id, label: item.name, secondary: item.currentVersionLabel })), staff: staffRows.map((item) => ({ id: text(item.id), label: text(item.full_name), secondary: text(item.staff_code) })), resources: resources.map((item) => ({ id: item.id, label: item.name, secondary: item.stateLabel })),
    },
  }
}

export async function getCurriculumDossier(kind: CurriculumDossierKind, id: string) {
  const snapshot = await getCurriculumSnapshot()
  if (kind === 'subject') return snapshot.subjects.find((item) => item.id === id) || null
  if (kind === 'curriculum') return snapshot.curricula.find((item) => item.id === id) || null
  if (kind === 'evaluation_policy') return snapshot.evaluationPolicies.find((item) => item.id === id) || null
  if (kind === 'resource') return snapshot.resources.find((item) => item.id === id) || null
  return snapshot.attention.find((item) => item.id === id) || null
}

async function ensureActionReceipt(db: Db, schoolId: string, key: string, actionKey: CurriculumActionKey) {
  const existing = await safeRows(db, 'angelcare360_curriculum_action_receipts', schoolId, { order: 'created_at', ascending: false, limit: 5000 })
  return existing.find((item) => text(item.idempotency_key) === key && text(item.action_key) === actionKey) || null
}

async function receipt(db: Db, input: { schoolId: string; actionKey: CurriculumActionKey; key: string; entityType: string; entityId: string | null; state: string; result: Row; userId: string }) {
  await db.from('angelcare360_curriculum_action_receipts').insert({ school_id: input.schoolId, action_key: input.actionKey, idempotency_key: input.key, entity_type: input.entityType, entity_id: input.entityId, state: input.state, result_json: input.result, created_by: input.userId, created_at: now() })
}

function payload(request: CurriculumActionRequest) { return row(request.payload) }

export async function executeCurriculumAction(request: CurriculumActionRequest): Promise<CurriculumActionResult> {
  const approve = /approve|activate|publish|replace|retire|archive/.test(request.actionKey)
  const commercial = request.actionKey === 'curriculum_resource.request_access'
  const context = await requireAreaContext({ approve, commercial })
  const db = await createClient()
  const schoolId = context.school.id
  const userId = context.user.id
  const data = payload(request)
  const key = idempotency(request.idempotencyKey, { request, schoolId })
  const previousReceipt = await ensureActionReceipt(db, schoolId, key, request.actionKey)
  if (previousReceipt) return { ok: true, state: text(previousReceipt.state, 'completed') as CurriculumActionResult['state'], message: text(row(previousReceipt.result_json).message, 'Cette action a déjà été appliquée.'), subjectId: optionalText(previousReceipt.entity_id), result: row(previousReceipt.result_json), snapshot: await getCurriculumSnapshot() }
  const action = request.actionKey
  const reason = optionalText(request.reason || data.reason)
  const effectiveAt = optionalText(request.effectiveAt || data.effectiveAt) || now()
  let entityType = 'curriculum'
  let entityId = request.curriculumId || request.subjectId || request.evaluationPolicyId || request.resourceId || request.variationId || request.issueId || request.objectiveId || request.bindingId || null
  let result: Row = {}
  let message = 'Le programme pédagogique a été mis à jour.'
  let state: CurriculumActionResult['state'] = 'completed'

  if (action === 'curriculum.preview') {
    const snapshot = await getCurriculumSnapshot()
    const curriculum = snapshot.curricula.find((item) => item.id === request.curriculumId)
    const bindings = snapshot.bindings.filter((item) => item.curriculumId === request.curriculumId)
    result = { current: curriculum, classesAffected: unique(bindings.map((item) => item.classId || '')).length, subjectsAdded: stringArray(data.subjectIds).filter((id) => !curriculum?.subjectIds.includes(id)), subjectsRemoved: curriculum?.subjectIds.filter((id) => !stringArray(data.subjectIds).includes(id)) || [], teacherIssues: bindings.filter((item) => item.teacherAssignmentCount === 0).length, evaluationIssues: bindings.filter((item) => item.evaluationState === 'missing').length, resourceIssues: bindings.filter((item) => item.resourceState === 'missing' || item.resourceState === 'restricted').length }
    message = 'La simulation pédagogique est prête. Aucune donnée n’a été modifiée.'
    state = 'preview'
  } else if (action === 'subject.create') {
    entityType = 'subject'
    const metadata = { description: optionalText(data.description), pedagogical_type: text(data.pedagogicalType, 'required_subject'), languages: stringArray(data.languages), applicable_levels: stringArray(data.applicableLevels), required_by_default: boolean(data.requiredByDefault, true), curriculum_state: 'draft', effective_from: optionalText(data.effectiveFrom) || dateOnly() }
    const { data: created, error } = await db.from('angelcare360_subjects').insert({ school_id: schoolId, subject_code: required(data.code, 'Le code'), name: required(data.name, 'Le nom'), short_name: optionalText(data.shortName), department: optionalText(data.department), credit_hours: data.expectedWeeklyHours === undefined || data.expectedWeeklyHours === '' ? null : numeric(data.expectedWeeklyHours), status: 'active', metadata_json: metadata }).select('*').single()
    if (error) throw new Error('La matière n’a pas pu être créée. Vérifiez le code et les informations obligatoires.')
    entityId = text(row(created).id)
    await db.from('angelcare360_subject_versions').insert({ school_id: schoolId, subject_id: entityId, version_label: 'Version 1', version_number: 1, state: 'draft', effective_from: optionalText(data.effectiveFrom) || dateOnly(), applicable_levels: stringArray(data.applicableLevels), expected_weekly_hours: data.expectedWeeklyHours === undefined || data.expectedWeeklyHours === '' ? null : numeric(data.expectedWeeklyHours), change_reason: 'Création initiale', created_by: userId })
    result = { subjectId: entityId }
    message = 'La matière a été créée. Complétez maintenant ses objectifs et son programme.'
  } else if (action === 'subject.update') {
    entityType = 'subject'; entityId = required(request.subjectId, 'La matière')
    const before = await safeRow(db, 'angelcare360_subjects', schoolId, entityId)
    const metadata = { ...row(before.metadata_json), description: optionalText(data.description) ?? row(before.metadata_json).description, pedagogical_type: optionalText(data.pedagogicalType) ?? row(before.metadata_json).pedagogical_type, languages: data.languages === undefined ? row(before.metadata_json).languages : stringArray(data.languages), applicable_levels: data.applicableLevels === undefined ? row(before.metadata_json).applicable_levels : stringArray(data.applicableLevels), required_by_default: data.requiredByDefault === undefined ? row(before.metadata_json).required_by_default : boolean(data.requiredByDefault) }
    const { error } = await db.from('angelcare360_subjects').update({ name: optionalText(data.name) || text(before.name), short_name: data.shortName === undefined ? before.short_name : optionalText(data.shortName), department: data.department === undefined ? before.department : optionalText(data.department), credit_hours: data.expectedWeeklyHours === undefined ? before.credit_hours : numeric(data.expectedWeeklyHours), metadata_json: metadata, updated_at: now() }).eq('school_id', schoolId).eq('id', entityId)
    if (error) throw new Error('Les informations de la matière n’ont pas pu être enregistrées.')
    result = { subjectId: entityId }; message = 'Les informations de la matière ont été mises à jour.'
  } else if (action === 'subject.prepare' || action === 'subject.request_approval' || action === 'subject.activate' || action === 'subject.replace' || action === 'subject.retire' || action === 'subject.archive') {
    entityType = 'subject'; entityId = required(request.subjectId, 'La matière')
    const before = await safeRow(db, 'angelcare360_subjects', schoolId, entityId)
    const targetState = action === 'subject.prepare' ? 'review' : action === 'subject.request_approval' ? 'ready' : action === 'subject.activate' ? 'active' : action === 'subject.replace' ? 'replaced' : action === 'subject.retire' ? 'retired' : 'archived'
    if ((action === 'subject.retire' || action === 'subject.archive') && !reason) throw new Error('Le motif est obligatoire pour préserver la continuité pédagogique.')
    const metadata = { ...row(before.metadata_json), curriculum_state: targetState, governance_effective_at: effectiveAt, change_reason: reason }
    const { error } = await db.from('angelcare360_subjects').update({ status: targetState === 'active' ? 'active' : targetState === 'archived' ? 'archived' : 'inactive', metadata_json: metadata, updated_at: now() }).eq('school_id', schoolId).eq('id', entityId)
    if (error) throw new Error('Le changement d’état n’a pas pu être enregistré.')
    result = { subjectId: entityId, targetState }; message = targetState === 'active' ? 'La matière est maintenant active.' : targetState === 'retired' ? 'La matière est retirée du programme sans supprimer son historique.' : 'L’état de la matière a été mis à jour.'
  } else if (action === 'subject.prepare_version') {
    entityType = 'subject_version'; entityId = required(request.subjectId, 'La matière')
    const existing = await safeRows(db, 'angelcare360_subject_versions', schoolId, { order: 'version_number', ascending: false, limit: 10000 })
    const next = Math.max(0, ...existing.filter((item) => text(item.subject_id) === entityId).map((item) => numeric(item.version_number))) + 1
    const { data: created, error } = await db.from('angelcare360_subject_versions').insert({ school_id: schoolId, subject_id: entityId, version_label: optionalText(data.versionLabel) || `Version ${next}`, version_number: next, state: 'draft', effective_from: optionalText(data.effectiveFrom) || dateOnly(), effective_to: optionalText(data.effectiveTo), applicable_levels: stringArray(data.applicableLevels), expected_weekly_hours: data.expectedWeeklyHours === undefined || data.expectedWeeklyHours === '' ? null : numeric(data.expectedWeeklyHours), evaluation_policy_id: optionalText(data.evaluationPolicyId), resource_ids: stringArray(data.resourceIds), change_reason: required(reason || data.changeReason, 'Le motif de la nouvelle version'), replaces_version_id: optionalText(data.replacesVersionId), created_by: userId }).select('*').single()
    if (error) throw new Error('La nouvelle version n’a pas pu être préparée.')
    result = { subjectId: entityId, versionId: text(row(created).id), versionNumber: next }; message = 'La nouvelle version est prête à être complétée et vérifiée.'
  } else if (action === 'subject.publish_version') {
    entityType = 'subject_version'; entityId = required(optionalText(data.versionId) || request.bindingId, 'La version')
    const version = await safeRow(db, 'angelcare360_subject_versions', schoolId, entityId)
    const subjectId = text(version.subject_id)
    const all = await safeRows(db, 'angelcare360_subject_versions', schoolId, { order: 'version_number', ascending: false, limit: 10000 })
    for (const active of all.filter((item) => text(item.subject_id) === subjectId && text(item.state) === 'active' && text(item.id) !== entityId)) await db.from('angelcare360_subject_versions').update({ state: 'replaced', effective_to: effectiveAt, updated_at: now() }).eq('school_id', schoolId).eq('id', text(active.id))
    const { error } = await db.from('angelcare360_subject_versions').update({ state: 'active', effective_from: effectiveAt, approved_by: userId, approved_by_label: context.access.roleLabel, updated_at: now() }).eq('school_id', schoolId).eq('id', entityId)
    if (error) throw new Error('La version n’a pas pu être activée.')
    await db.from('angelcare360_subjects').update({ status: 'active', metadata_json: { ...(row((await safeRow(db, 'angelcare360_subjects', schoolId, subjectId)).metadata_json)), curriculum_state: 'active', current_version_id: entityId }, updated_at: now() }).eq('school_id', schoolId).eq('id', subjectId)
    result = { subjectId, versionId: entityId }; message = 'La nouvelle version est active. Les anciennes versions restent disponibles dans l’historique.'
  } else if (action === 'curriculum.create') {
    entityType = 'curriculum'
    const { data: created, error } = await db.from('angelcare360_curriculum_frameworks').insert({ school_id: schoolId, curriculum_code: required(data.code, 'Le code'), name: required(data.name, 'Le nom'), description: optionalText(data.description), academic_year_id: optionalText(data.academicYearId), institution_id: optionalText(data.institutionId), site_id: optionalText(data.siteId), applicable_levels: stringArray(data.applicableLevels), state: 'draft', metadata_json: { created_from_template: optionalText(data.templateCode), owner_label: context.access.roleLabel }, created_by: userId }).select('*').single()
    if (error) throw new Error('Le programme n’a pas pu être créé.')
    entityId = text(row(created).id)
    await db.from('angelcare360_curriculum_framework_versions').insert({ school_id: schoolId, curriculum_id: entityId, version_label: 'Version 1', version_number: 1, state: 'draft', effective_from: dateOnly(), change_reason: 'Création initiale', created_by: userId })
    result = { curriculumId: entityId }; message = 'Le programme a été créé en brouillon.'
  } else if (action === 'curriculum.update') {
    entityType = 'curriculum'; entityId = required(request.curriculumId, 'Le programme')
    const before = await safeRow(db, 'angelcare360_curriculum_frameworks', schoolId, entityId)
    const { error } = await db.from('angelcare360_curriculum_frameworks').update({ name: optionalText(data.name) || text(before.name), description: data.description === undefined ? before.description : optionalText(data.description), academic_year_id: data.academicYearId === undefined ? before.academic_year_id : optionalText(data.academicYearId), institution_id: data.institutionId === undefined ? before.institution_id : optionalText(data.institutionId), site_id: data.siteId === undefined ? before.site_id : optionalText(data.siteId), applicable_levels: data.applicableLevels === undefined ? before.applicable_levels : stringArray(data.applicableLevels), updated_at: now() }).eq('school_id', schoolId).eq('id', entityId)
    if (error) throw new Error('Le programme n’a pas pu être mis à jour.')
    result = { curriculumId: entityId }; message = 'Le programme a été mis à jour.'
  } else if (action === 'curriculum.copy_from_previous_year') {
    entityType = 'curriculum'; entityId = required(request.curriculumId, 'Le programme source')
    const source = await safeRow(db, 'angelcare360_curriculum_frameworks', schoolId, entityId)
    const targetYearId = required(data.targetAcademicYearId, 'L’année scolaire cible')
    const newId = randomUUID()
    const { error } = await db.from('angelcare360_curriculum_frameworks').insert({ ...source, id: newId, academic_year_id: targetYearId, curriculum_code: `${text(source.curriculum_code)}-${targetYearId.slice(0, 6)}`, name: `${text(source.name)} — nouvelle année`, state: 'draft', created_by: userId, created_at: now(), updated_at: now(), metadata_json: { ...row(source.metadata_json), copied_from_curriculum_id: entityId, copy_review_required: true } })
    if (error) throw new Error('Le programme de la nouvelle année n’a pas pu être préparé.')
    const sourceBindings = (await safeRows(db, 'angelcare360_curriculum_bindings', schoolId, { order: 'created_at', ascending: true, limit: 50000 })).filter((item) => text(item.curriculum_id) === entityId && !IMMUTABLE_VERSION_STATES.has(text(item.state)))
    for (const binding of sourceBindings) await db.from('angelcare360_curriculum_bindings').insert({ ...binding, id: randomUUID(), curriculum_id: newId, academic_year_id: targetYearId, state: 'draft', created_by: userId, created_at: now(), updated_at: now(), metadata_json: { ...row(binding.metadata_json), copied_from_binding_id: text(binding.id), requires_review: true } })
    entityId = newId; result = { curriculumId: newId, copiedBindings: sourceBindings.length }; message = 'Le programme de la nouvelle année a été préparé en brouillon. Les éléments expirés restent exclus.'
  } else if (['curriculum.add_subject', 'curriculum.remove_future_subject', 'curriculum.bind_level', 'curriculum.bind_class', 'curriculum.unbind_future_class'].includes(action)) {
    entityType = 'curriculum_binding'; const curriculumId = required(request.curriculumId, 'Le programme'); const subjectId = required(request.subjectId || data.subjectId, 'La matière')
    if (action === 'curriculum.add_subject' || action === 'curriculum.bind_level' || action === 'curriculum.bind_class') {
      const classIds = stringArray(data.classIds || data.classId)
      const levelLabels = stringArray(data.levelLabels || data.levelLabel)
      const targets = classIds.length ? classIds : [null]
      for (const classId of targets) await db.from('angelcare360_curriculum_bindings').insert({ school_id: schoolId, curriculum_id: curriculumId, subject_id: subjectId, subject_version_id: optionalText(data.subjectVersionId), academic_year_id: optionalText(data.academicYearId), class_id: classId, section_id: optionalText(data.sectionId), level_label: levelLabels[0] || null, required: boolean(data.required, true), expected_weekly_hours: data.expectedWeeklyHours === undefined || data.expectedWeeklyHours === '' ? null : numeric(data.expectedWeeklyHours), evaluation_policy_id: optionalText(data.evaluationPolicyId), state: 'draft', effective_from: effectiveAt, created_by: userId })
      entityId = curriculumId; result = { curriculumId, subjectId, classIds }; message = classIds.length ? 'La matière a été ajoutée aux classes sélectionnées.' : 'La matière a été ajoutée au programme.'
    } else {
      const bindingId = required(request.bindingId || data.bindingId, 'Le rattachement')
      const binding = await safeRow(db, 'angelcare360_curriculum_bindings', schoolId, bindingId)
      if (text(binding.state) === 'active' && (!optionalText(data.effectiveTo) || optionalText(data.effectiveTo)! <= dateOnly())) throw new Error('Un rattachement historique actif doit être retiré à une date future.')
      const { error } = await db.from('angelcare360_curriculum_bindings').update({ state: 'retired', effective_to: optionalText(data.effectiveTo) || effectiveAt, updated_at: now() }).eq('school_id', schoolId).eq('id', bindingId)
      if (error) throw new Error('Le rattachement n’a pas pu être retiré.')
      entityId = curriculumId; result = { curriculumId, bindingId }; message = 'Le rattachement futur a été retiré sans modifier l’historique.'
    }
  } else if (['curriculum.request_approval', 'curriculum.activate', 'curriculum.prepare_replacement', 'curriculum.replace', 'curriculum.retire', 'curriculum.archive'].includes(action)) {
    entityType = 'curriculum'; entityId = required(request.curriculumId, 'Le programme')
    const targetState = action === 'curriculum.request_approval' ? 'ready' : action === 'curriculum.activate' ? 'active' : action === 'curriculum.prepare_replacement' ? 'change_prepared' : action === 'curriculum.replace' ? 'replaced' : action === 'curriculum.retire' ? 'retired' : 'archived'
    if (['curriculum.replace', 'curriculum.retire', 'curriculum.archive'].includes(action) && !reason) throw new Error('Le motif est obligatoire.')
    const snapshot = await getCurriculumSnapshot()
    const programme = snapshot.curricula.find((item) => item.id === entityId)
    if (action === 'curriculum.activate' && (!programme || !programme.subjectIds.length || programme.coverageComplete < programme.coverageTotal)) throw new Error('Ce programme ne peut pas encore être activé. Corrigez les éléments pédagogiques incomplets.')
    const { error } = await db.from('angelcare360_curriculum_frameworks').update({ state: targetState, updated_at: now(), metadata_json: { ...(row((await safeRow(db, 'angelcare360_curriculum_frameworks', schoolId, entityId)).metadata_json)), governance_effective_at: effectiveAt, change_reason: reason } }).eq('school_id', schoolId).eq('id', entityId)
    if (error) throw new Error('Le programme n’a pas pu changer d’état.')
    result = { curriculumId: entityId, targetState }; message = targetState === 'active' ? 'Le programme est maintenant actif.' : targetState === 'retired' ? 'Le programme est retiré sans effacer son historique.' : 'L’état du programme a été mis à jour.'
  } else if (action === 'learning_objective.create') {
    entityType = 'learning_objective'
    const { data: created, error } = await db.from('angelcare360_learning_objectives').insert({ school_id: schoolId, subject_id: optionalText(request.subjectId || data.subjectId), curriculum_id: optionalText(request.curriculumId || data.curriculumId), title: required(data.title, 'L’objectif'), description: optionalText(data.description), level_label: optionalText(data.levelLabel), expected_period_id: optionalText(data.expectedPeriodId), required: boolean(data.required, true), observable_result: optionalText(data.observableResult), competency_code: optionalText(data.competencyCode), sequence_order: numeric(data.sequenceOrder), effective_from: optionalText(data.effectiveFrom) || dateOnly(), effective_to: optionalText(data.effectiveTo), state: 'draft', created_by: userId }).select('*').single()
    if (error) throw new Error('L’objectif d’apprentissage n’a pas pu être créé.')
    entityId = text(row(created).id); result = { objectiveId: entityId, subjectId: request.subjectId, curriculumId: request.curriculumId }; message = 'L’objectif d’apprentissage a été ajouté.'
  } else if (['learning_objective.update', 'learning_objective.reorder', 'learning_objective.retire'].includes(action)) {
    entityType = 'learning_objective'; entityId = required(request.objectiveId, 'L’objectif')
    const before = await safeRow(db, 'angelcare360_learning_objectives', schoolId, entityId)
    const update: Row = action === 'learning_objective.retire' ? { state: 'retired', effective_to: effectiveAt, updated_at: now() } : { title: optionalText(data.title) || text(before.title), description: data.description === undefined ? before.description : optionalText(data.description), level_label: data.levelLabel === undefined ? before.level_label : optionalText(data.levelLabel), expected_period_id: data.expectedPeriodId === undefined ? before.expected_period_id : optionalText(data.expectedPeriodId), observable_result: data.observableResult === undefined ? before.observable_result : optionalText(data.observableResult), competency_code: data.competencyCode === undefined ? before.competency_code : optionalText(data.competencyCode), sequence_order: data.sequenceOrder === undefined ? before.sequence_order : numeric(data.sequenceOrder), updated_at: now() }
    const { error } = await db.from('angelcare360_learning_objectives').update(update).eq('school_id', schoolId).eq('id', entityId)
    if (error) throw new Error('L’objectif n’a pas pu être mis à jour.')
    result = { objectiveId: entityId }; message = action === 'learning_objective.retire' ? 'L’objectif est retiré des futurs programmes.' : 'L’objectif d’apprentissage a été mis à jour.'
  } else if (action === 'evaluation_policy.create') {
    entityType = 'evaluation_policy'
    const method = evaluationMethod(data.method)
    const { data: created, error } = await db.from('angelcare360_evaluation_policy_versions').insert({ school_id: schoolId, subject_id: optionalText(request.subjectId || data.subjectId), curriculum_id: optionalText(request.curriculumId || data.curriculumId), level_label: optionalText(data.levelLabel), academic_year_id: optionalText(data.academicYearId), method, scale_code: optionalText(data.scaleCode), required_period_ids: stringArray(data.requiredPeriodIds), evidence_required: boolean(data.evidenceRequired), report_card_mapping: optionalText(data.reportCardMapping), state: 'draft', version_number: 1, effective_from: optionalText(data.effectiveFrom) || dateOnly(), created_by: userId }).select('*').single()
    if (error) throw new Error('La méthode d’évaluation n’a pas pu être créée.')
    entityId = text(row(created).id); result = { evaluationPolicyId: entityId }; message = 'La méthode d’évaluation a été créée en brouillon.'
  } else if (['evaluation_policy.update', 'evaluation_policy.request_approval', 'evaluation_policy.activate', 'evaluation_policy.replace', 'evaluation_policy.retire'].includes(action)) {
    entityType = 'evaluation_policy'; entityId = required(request.evaluationPolicyId, 'La méthode d’évaluation')
    const before = await safeRow(db, 'angelcare360_evaluation_policy_versions', schoolId, entityId)
    if (IMMUTABLE_VERSION_STATES.has(text(before.state)) && action === 'evaluation_policy.update') throw new Error('Une méthode active doit être remplacée par une nouvelle version.')
    const targetState = action === 'evaluation_policy.request_approval' ? 'ready' : action === 'evaluation_policy.activate' ? 'active' : action === 'evaluation_policy.replace' ? 'replaced' : action === 'evaluation_policy.retire' ? 'retired' : text(before.state)
    const update: Row = { method: data.method === undefined ? before.method : evaluationMethod(data.method), scale_code: data.scaleCode === undefined ? before.scale_code : optionalText(data.scaleCode), required_period_ids: data.requiredPeriodIds === undefined ? before.required_period_ids : stringArray(data.requiredPeriodIds), evidence_required: data.evidenceRequired === undefined ? before.evidence_required : boolean(data.evidenceRequired), report_card_mapping: data.reportCardMapping === undefined ? before.report_card_mapping : optionalText(data.reportCardMapping), state: targetState, effective_from: data.effectiveFrom === undefined ? before.effective_from : optionalText(data.effectiveFrom), effective_to: data.effectiveTo === undefined ? before.effective_to : optionalText(data.effectiveTo), approved_by: action === 'evaluation_policy.activate' ? userId : before.approved_by, updated_at: now() }
    const { error } = await db.from('angelcare360_evaluation_policy_versions').update(update).eq('school_id', schoolId).eq('id', entityId)
    if (error) throw new Error('La méthode d’évaluation n’a pas pu être mise à jour.')
    result = { evaluationPolicyId: entityId }; message = targetState === 'active' ? 'La méthode d’évaluation est active.' : 'La méthode d’évaluation a été mise à jour.'
  } else if (action === 'curriculum_resource.link') {
    entityType = 'curriculum_resource'
    const { data: created, error } = await db.from('angelcare360_curriculum_resource_bindings').insert({ school_id: schoolId, document_id: optionalText(data.documentId), resource_code: required(data.code, 'Le code de la ressource'), name: required(data.name, 'Le nom de la ressource'), category: optionalText(data.category), language: optionalText(data.language), subject_id: optionalText(request.subjectId || data.subjectId), curriculum_id: optionalText(request.curriculumId || data.curriculumId), applicable_levels: stringArray(data.applicableLevels), state: 'available', licence_code: optionalText(data.licenceCode), entitlement_code: optionalText(data.entitlementCode), effective_from: optionalText(data.effectiveFrom) || dateOnly(), effective_to: optionalText(data.effectiveTo), created_by: userId }).select('*').single()
    if (error) throw new Error('La ressource n’a pas pu être associée.')
    entityId = text(row(created).id); result = { resourceId: entityId }; message = 'La ressource est maintenant associée au programme.'
  } else if (['curriculum_resource.unlink_future', 'curriculum_resource.replace'].includes(action)) {
    entityType = 'curriculum_resource'; entityId = required(request.resourceId, 'La ressource')
    const before = await safeRow(db, 'angelcare360_curriculum_resource_bindings', schoolId, entityId)
    const targetState = action === 'curriculum_resource.replace' ? 'replaced' : 'archived'
    const { error } = await db.from('angelcare360_curriculum_resource_bindings').update({ state: targetState, effective_to: optionalText(data.effectiveTo) || effectiveAt, replacement_resource_id: optionalText(data.replacementResourceId), updated_at: now() }).eq('school_id', schoolId).eq('id', entityId)
    if (error) throw new Error('La ressource n’a pas pu être mise à jour.')
    result = { resourceId: entityId, previousName: before.name }; message = targetState === 'replaced' ? 'La ressource a été remplacée sans effacer son historique.' : 'La ressource a été retirée des futurs programmes.'
  } else if (action === 'curriculum_resource.request_access') {
    entityType = 'curriculum_access_request'; const itemCode = required(data.itemCode || data.entitlementCode, 'Le programme ou la ressource')
    const { data: created, error } = await db.from('angelcare360_curriculum_access_requests').insert({ school_id: schoolId, subscription_id: context.runtimeEntitlements.subscriptionId, package_version_id: context.runtimeEntitlements.packageVersionId, item_code: itemCode, state: 'requested', reason: required(reason || data.reason, 'Le motif'), requested_by: userId, requested_at: now(), exact_catalogue_href: optionalText(data.exactCatalogueHref) || `/angelcare-360-operator/platform?workspace=product&section=curriculum&item=${encodeURIComponent(itemCode)}&school=${schoolId}` }).select('*').single()
    if (error) throw new Error('La demande d’activation n’a pas pu être enregistrée.')
    entityId = text(row(created).id); result = { accessRequestId: entityId, itemCode }; message = 'La demande d’activation a été envoyée. Le programme restera indisponible jusqu’à confirmation.'
  } else if (action === 'curriculum_variation.create') {
    entityType = 'curriculum_variation'
    const { data: created, error } = await db.from('angelcare360_curriculum_variations').insert({ school_id: schoolId, curriculum_id: required(request.curriculumId, 'Le programme'), site_id: optionalText(data.siteId), title: required(data.title, 'Le titre'), reason: required(reason || data.reason, 'Le motif'), state: 'draft', changes_json: row(data.changes), effective_from: optionalText(data.effectiveFrom), effective_to: optionalText(data.effectiveTo), created_by: userId }).select('*').single()
    if (error) throw new Error('La variation locale n’a pas pu être créée.')
    entityId = text(row(created).id); result = { variationId: entityId }; message = 'La variation locale a été préparée.'
  } else if (['curriculum_variation.request_approval', 'curriculum_variation.approve', 'curriculum_variation.reject', 'curriculum_variation.retire'].includes(action)) {
    entityType = 'curriculum_variation'; entityId = required(request.variationId, 'La variation')
    const targetState = action === 'curriculum_variation.request_approval' ? 'pending' : action === 'curriculum_variation.approve' ? 'approved' : action === 'curriculum_variation.reject' ? 'rejected' : 'retired'
    const { error } = await db.from('angelcare360_curriculum_variations').update({ state: targetState, approved_by: action === 'curriculum_variation.approve' ? userId : null, approved_by_label: action === 'curriculum_variation.approve' ? context.access.roleLabel : null, decision_reason: reason, updated_at: now() }).eq('school_id', schoolId).eq('id', entityId)
    if (error) throw new Error('La variation locale n’a pas pu être mise à jour.')
    result = { variationId: entityId, targetState }; message = targetState === 'approved' ? 'La variation locale est approuvée.' : targetState === 'rejected' ? 'La variation locale a été refusée avec son motif.' : 'La variation locale a été mise à jour.'
  } else if (['curriculum_issue.assign', 'curriculum_issue.resolve', 'curriculum_issue.reopen'].includes(action)) {
    entityType = 'curriculum_issue'; entityId = request.issueId || optionalText(data.issueId)
    if (!entityId) {
      const { data: created, error } = await db.from('angelcare360_curriculum_coverage_findings').insert({ school_id: schoolId, source_type: text(data.sourceType, 'subject'), source_id: required(data.sourceId || request.subjectId || request.curriculumId, 'Le dossier concerné'), subject_id: optionalText(request.subjectId), curriculum_id: optionalText(request.curriculumId), title: required(data.title, 'Le titre'), explanation: required(data.explanation, 'L’explication'), consequence: optionalText(data.consequence), severity: text(data.severity, 'warning'), state: 'open', recommended_action_key: optionalText(data.recommendedActionKey), recommended_action_label: optionalText(data.recommendedActionLabel), owner_user_id: optionalText(data.ownerUserId), owner_label: optionalText(data.ownerLabel), due_at: optionalText(data.dueAt), created_by: userId }).select('*').single()
      if (error) throw new Error('Le point à traiter n’a pas pu être créé.')
      entityId = text(row(created).id)
    } else {
      const targetState = action === 'curriculum_issue.resolve' ? 'resolved' : action === 'curriculum_issue.reopen' ? 'open' : 'assigned'
      const { error } = await db.from('angelcare360_curriculum_coverage_findings').update({ state: targetState, owner_user_id: data.ownerUserId === undefined ? undefined : optionalText(data.ownerUserId), owner_label: data.ownerLabel === undefined ? undefined : optionalText(data.ownerLabel), due_at: data.dueAt === undefined ? undefined : optionalText(data.dueAt), resolution_reason: action === 'curriculum_issue.resolve' ? required(reason || data.reason, 'Le résultat') : null, updated_at: now() }).eq('school_id', schoolId).eq('id', entityId)
      if (error) throw new Error('Le point à traiter n’a pas pu être mis à jour.')
    }
    result = { issueId: entityId }; message = action === 'curriculum_issue.resolve' ? 'Le point est réglé et reste disponible dans l’historique.' : action === 'curriculum_issue.reopen' ? 'Le point a été rouvert.' : 'Le point a été attribué.'
  } else if (['curriculum_task.assign', 'curriculum_task.complete', 'curriculum_task.reopen'].includes(action)) {
    entityType = 'curriculum_task'; entityId = optionalText(data.taskId)
    if (!entityId) {
      const { data: created, error } = await db.from('angelcare360_curriculum_tasks').insert({ school_id: schoolId, subject_id: optionalText(request.subjectId), curriculum_id: optionalText(request.curriculumId), issue_id: optionalText(request.issueId), title: required(data.title, 'Le titre'), description: optionalText(data.description), state: 'owned', priority: text(data.priority, 'normal'), owner_user_id: optionalText(data.ownerUserId), owner_label: optionalText(data.ownerLabel), due_at: optionalText(data.dueAt), created_by: userId }).select('*').single()
      if (error) throw new Error('La tâche n’a pas pu être créée.')
      entityId = text(row(created).id)
    } else {
      const targetState = action === 'curriculum_task.complete' ? 'completed' : action === 'curriculum_task.reopen' ? 'reopened' : 'owned'
      const { error } = await db.from('angelcare360_curriculum_tasks').update({ state: targetState, completion_note: action === 'curriculum_task.complete' ? required(reason || data.reason, 'Le résultat') : null, owner_user_id: data.ownerUserId === undefined ? undefined : optionalText(data.ownerUserId), owner_label: data.ownerLabel === undefined ? undefined : optionalText(data.ownerLabel), due_at: data.dueAt === undefined ? undefined : optionalText(data.dueAt), updated_at: now() }).eq('school_id', schoolId).eq('id', entityId)
      if (error) throw new Error('La tâche n’a pas pu être mise à jour.')
    }
    result = { taskId: entityId }; message = action === 'curriculum_task.complete' ? 'La tâche est terminée.' : action === 'curriculum_task.reopen' ? 'La tâche a été rouverte.' : 'La tâche a été attribuée.'
  } else if (action === 'curriculum_note.add') {
    entityType = 'curriculum_note'
    const { data: created, error } = await db.from('angelcare360_curriculum_notes').insert({ school_id: schoolId, subject_id: optionalText(request.subjectId), curriculum_id: optionalText(request.curriculumId), issue_id: optionalText(request.issueId), body: required(data.body, 'La note'), important: boolean(data.important), author_user_id: userId, author_label: context.access.roleLabel }).select('*').single()
    if (error) throw new Error('La note n’a pas pu être ajoutée.')
    entityId = text(row(created).id); result = { noteId: entityId }; message = 'La note a été ajoutée au dossier.'
  } else if (action === 'curriculum_evidence.request') {
    entityType = 'curriculum_evidence_request'
    const { data: created, error } = await db.from('angelcare360_curriculum_evidence_requests').insert({ school_id: schoolId, subject_id: optionalText(request.subjectId), curriculum_id: optionalText(request.curriculumId), issue_id: optionalText(request.issueId), title: required(data.title, 'Le justificatif demandé'), description: optionalText(data.description), owner_user_id: optionalText(data.ownerUserId), owner_label: optionalText(data.ownerLabel), due_at: optionalText(data.dueAt), state: 'requested', requested_by: userId }).select('*').single()
    if (error) throw new Error('La demande de justificatif n’a pas pu être enregistrée.')
    entityId = text(row(created).id); result = { evidenceRequestId: entityId }; message = 'La demande de justificatif a été enregistrée.'
  } else {
    throw new Error('Cette action pédagogique n’est pas encore prise en charge par le serveur.')
  }

  await audit({ schoolId, action, entityType, entityId, after: result, metadata: { reason, effectiveAt, idempotencyKey: key }, severity: /retire|archive|reject/.test(action) ? 'warning' : 'info' })
  await receipt(db, { schoolId, actionKey: action, key, entityType, entityId, state, result: { ...result, message }, userId })
  return { ok: true, state, message, subjectId: request.subjectId || (entityType === 'subject' ? entityId : null), curriculumId: request.curriculumId || (entityType === 'curriculum' ? entityId : null), evaluationPolicyId: request.evaluationPolicyId || (entityType === 'evaluation_policy' ? entityId : null), resourceId: request.resourceId || (entityType === 'curriculum_resource' ? entityId : null), result, snapshot: state === 'preview' ? undefined : await getCurriculumSnapshot() }
}
