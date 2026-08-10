import { createClient } from '@/lib/supabase/server'
import { Angelcare360AccessError, getAngelcare360AccessContext } from '@/lib/angelcare360/server/context'
import { recordAngelcare360AuditEventServer } from '@/lib/angelcare360/server/audit'
import type {
  Angelcare360Area11AdultSummary,
  Angelcare360Area11Attention,
  Angelcare360Area11CommandData,
  Angelcare360Area11Dossier,
  Angelcare360Area11FamilySummary,
  Angelcare360Area11Metric,
  Angelcare360Area11MutationRequest,
  Angelcare360Area11MutationResult,
  Angelcare360Area11TimelineEvent,
  Angelcare360Area11Tone,
  Angelcare360Area11View,
} from '@/types/angelcare360/family360-area11'

type Row = Record<string, any>
type Client = Awaited<ReturnType<typeof createClient>>
type PermissionMode = 'view' | 'create' | 'update' | 'sensitive' | 'portal' | 'billing'

const VIEWS: Angelcare360Area11View[] = [
  'today', 'families', 'adults', 'child-links', 'authority', 'pickup', 'emergency',
  'households', 'documents', 'billing', 'portal', 'attention', 'transitions', 'history',
]

const AREA11_TABLES = {
  families: 'angelcare360_area11_families',
  memberships: 'angelcare360_area11_family_memberships',
  relationships: 'angelcare360_area11_relationships',
  guardianAuthorities: 'angelcare360_area11_guardian_authorities',
  restrictions: 'angelcare360_area11_authority_restrictions',
  pickup: 'angelcare360_area11_pickup_authorizations',
  emergencyRankings: 'angelcare360_area11_emergency_rankings',
  households: 'angelcare360_area11_households',
  householdMemberships: 'angelcare360_area11_household_memberships',
  addresses: 'angelcare360_area11_addresses',
  verifications: 'angelcare360_area11_identity_verifications',
  documentLinks: 'angelcare360_area11_document_links',
  billing: 'angelcare360_area11_billing_responsibilities',
  portal: 'angelcare360_area11_portal_relationships',
  transitions: 'angelcare360_area11_transitions',
  tasks: 'angelcare360_area11_tasks',
  notes: 'angelcare360_area11_notes',
  receipts: 'angelcare360_area11_action_receipts',
} as const

const OPERATIONS = [
  'family.view','family.view_sensitive','family.create','family.verify','family.update','family.request_verification','family.merge_preview','family.merge','family.split_preview','family.split','family.archive',
  'person.view','person.view_sensitive','person.create','person.update','person.verify','person.request_verification','person.merge_review','person.archive',
  'relationship.view','relationship.create','relationship.verify','relationship.update','relationship.end','relationship.reopen','relationship.request_evidence',
  'guardian_authority.view','guardian_authority.create','guardian_authority.verify','guardian_authority.update','guardian_authority.restrict','guardian_authority.restore','guardian_authority.end','guardian_authority.request_review',
  'pickup_authorization.view','pickup_authorization.create','pickup_authorization.verify','pickup_authorization.extend','pickup_authorization.suspend','pickup_authorization.revoke','pickup_authorization.expire','pickup_authorization.request_identity_check',
  'emergency_contact.view','emergency_contact.create','emergency_contact.verify','emergency_contact.update','emergency_contact.reorder','emergency_contact.remove','emergency_contact.request_verification',
  'household.view','household.create','household.update','household.add_member','household.remove_member','household.close','household.split_preview',
  'address.view','address.create','address.verify','address.change','address.end','address.impact_preview','address.request_transport_review',
  'family_document.view','family_document.request','family_document.receive','family_document.verify','family_document.reject','family_document.replace','family_document.restrict','family_document.archive',
  'billing_responsibility.view','billing_responsibility.create','billing_responsibility.update','billing_responsibility.end','billing_responsibility.request_finance_review',
  'portal_access.view','portal_access.preview','portal_access.invite','portal_access.activate','portal_access.restrict','portal_access.suspend','portal_access.revoke','portal_access.request_review',
  'family_transition.prepare','family_transition.validate','family_transition.request_approval','family_transition.execute','family_transition.cancel',
  'family_task.assign','family_task.complete','family_task.reopen','family_note.add','family_evidence.request','family_history.view','family_topup.request',
] as const

const OPERATION_MODE: Record<string, PermissionMode> = Object.fromEntries(OPERATIONS.map((operation) => {
  if (operation.includes('view_sensitive') || operation.includes('restrict')) return [operation, 'sensitive']
  if (operation.startsWith('portal_access.')) return [operation, operation.endsWith('.view') || operation.endsWith('.preview') ? 'view' : 'portal']
  if (operation.startsWith('billing_responsibility.')) return [operation, operation.endsWith('.view') ? 'view' : 'billing']
  if (operation.endsWith('.create') || operation.endsWith('.assign') || operation.endsWith('.add') || operation.endsWith('.invite') || operation.endsWith('.prepare')) return [operation, 'create']
  if (operation.endsWith('.view') || operation.endsWith('_preview') || operation.endsWith('.preview')) return [operation, 'view']
  return [operation, 'update']
}))

const VIEW_LABELS: Record<Angelcare360Area11View, string> = {
  today: 'Aujourd’hui', families: 'Familles', adults: 'Parents & responsables', 'child-links': 'Enfants & liens familiaux',
  authority: 'Autorité & responsabilités', pickup: 'Personnes autorisées', emergency: 'Contacts d’urgence', households: 'Foyers & adresses',
  documents: 'Documents & vérifications', billing: 'Facturation responsable', portal: 'Accès parents', attention: 'À vérifier',
  transitions: 'Transitions familiales', history: 'Historique',
}

function text(value: unknown, fallback = '') {
  if (value === null || value === undefined) return fallback
  const result = String(value).trim()
  return result || fallback
}
function optional(value: unknown) { const result = text(value); return result || null }
function boolValue(value: unknown) { return value === true || ['true','1','yes','active','verified'].includes(text(value).toLowerCase()) }
function metadata(row: Row | null | undefined) { const value = row?.metadata_json; return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {} }
function normalizeView(value?: string | null): Angelcare360Area11View { return VIEWS.includes(value as Angelcare360Area11View) ? value as Angelcare360Area11View : 'today' }
function unique(values: Array<string | null | undefined>) { return Array.from(new Set(values.map((v) => text(v)).filter(Boolean))) }
function fullName(row: Row | null | undefined, fallback = 'Responsable') { return text(row?.full_name || [row?.first_name,row?.last_name].filter(Boolean).join(' '), fallback) }
function isOpen(row: Row) { return !['completed','resolved','closed','archived','cancelled','revoked','expired','ended'].includes(text(row.status).toLowerCase()) }
function tone(value: unknown): Angelcare360Area11Tone {
  const normalized = text(value).toLowerCase()
  if (['restricted','blocked','revoked','critical','expired'].some((v) => normalized.includes(v))) return 'danger'
  if (['pending','unverified','warning','attention','requested'].some((v) => normalized.includes(v))) return 'warning'
  if (['verified','active','complete','ready','resolved'].some((v) => normalized.includes(v))) return 'success'
  return 'neutral'
}
function jsonValue(value: unknown) { return value && typeof value === 'object' ? value : {} }
function payloadText(payload: Row, key: string, fallback = '') { return text(payload[key], fallback) }
function payloadOptional(payload: Row, key: string) { return optional(payload[key]) }

async function safeQuery(label: string, query: PromiseLike<any>, warnings: string[]): Promise<Row[]> {
  try {
    const { data, error } = await query
    if (error) { warnings.push(`${label}: ${error.message || 'source indisponible'}`); return [] }
    return (data || []) as Row[]
  } catch (error) {
    warnings.push(`${label}: ${error instanceof Error ? error.message : 'source indisponible'}`)
    return []
  }
}

function indexBy(rows: Row[], key: string) {
  const map = new Map<string, Row[]>()
  for (const row of rows) { const id = text(row[key]); if (!id) continue; const current = map.get(id) || []; current.push(row); map.set(id, current) }
  return map
}

function can(context: Awaited<ReturnType<typeof getAngelcare360AccessContext>>, mode: PermissionMode) {
  if (!context) return false
  if (context.access.accessLevel === 'super_admin') return true
  const permissions = context.permissions
  if (permissions.has('*') || permissions.has('angelcare360.*')) return true
  const candidates: Record<PermissionMode, string[]> = {
    view: ['parents.view','angelcare360.people.view','eleves.view'],
    create: ['parents.create','angelcare360.people.create','parents.update','angelcare360.people.update'],
    update: ['parents.update','angelcare360.people.update'],
    sensitive: ['parents.view_sensitive','angelcare360.people.view_sensitive','parents.update','angelcare360.people.update'],
    portal: ['parents.update','angelcare360.people.update','users.manage','angelcare360.users.manage'],
    billing: ['parents.update','angelcare360.people.update','angelcare360.finance.view','finance.view'],
  }
  return candidates[mode].some((key) => permissions.has(key)) || (mode === 'view' && context.access.canSeePeopleData)
}

async function requireOperation(operation: string) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) throw new Angelcare360AccessError('Aucun établissement actif.', 403)
  const mode = OPERATION_MODE[operation]
  if (!mode) throw new Angelcare360AccessError('Opération Famille 360 inconnue.', 400)
  if (!can(context, mode)) throw new Angelcare360AccessError('Votre rôle ne permet pas cette action sur les familles et responsables.', 403)
  return context
}

async function loadSources(client: Client, schoolId: string, warnings: string[]) {
  const [parents, links, students, emergencyContacts, documents, invoices, families, memberships, relationships, guardianAuthorities, restrictions, pickup, emergencyRankings, households, householdMemberships, addresses, verifications, documentLinks, billing, portal, transitions, tasks, notes, admissionHandover, student360Links, audits] = await Promise.all([
    safeQuery('Parents et responsables', client.from('angelcare360_parents').select('id,school_id,parent_code,portal_app_user_id,first_name,last_name,full_name,email,phone,whatsapp,occupation,address,preferred_language,status,metadata_json,created_at,updated_at').eq('school_id', schoolId).order('full_name'), warnings),
    safeQuery('Liens élève-responsable', client.from('angelcare360_student_parent_links').select('id,school_id,student_id,parent_id,relationship_type,is_primary,is_guardian,can_pickup,can_receive_messages,can_pay_fees,status,created_at,updated_at,parent:angelcare360_parents(id,full_name,first_name,last_name,email,phone,status),student:angelcare360_students(id,student_code,full_name,first_name,last_name,status)').eq('school_id', schoolId), warnings),
    safeQuery('Élèves', client.from('angelcare360_students').select('id,student_code,full_name,first_name,last_name,status,current_class_id,current_section_id,metadata_json').eq('school_id', schoolId).limit(1000), warnings),
    safeQuery('Contacts d’urgence', client.from('angelcare360_emergency_contacts').select('*').eq('school_id', schoolId), warnings),
    safeQuery('Documents responsables', client.from('angelcare360_documents').select('*').eq('school_id', schoolId).eq('documentable_type','parent'), warnings),
    safeQuery('Factures', client.from('angelcare360_invoices').select('*').eq('school_id', schoolId).limit(500), warnings),
    safeQuery('Familles 360', client.from(AREA11_TABLES.families).select('*').eq('school_id', schoolId), warnings),
    safeQuery('Membres famille', client.from(AREA11_TABLES.memberships).select('*').eq('school_id', schoolId), warnings),
    safeQuery('Relations famille', client.from(AREA11_TABLES.relationships).select('*').eq('school_id', schoolId), warnings),
    safeQuery('Autorités responsables', client.from(AREA11_TABLES.guardianAuthorities).select('*').eq('school_id', schoolId), warnings),
    safeQuery('Restrictions d’autorité', client.from(AREA11_TABLES.restrictions).select('*').eq('school_id', schoolId), warnings),
    safeQuery('Autorisations de sortie', client.from(AREA11_TABLES.pickup).select('*').eq('school_id', schoolId), warnings),
    safeQuery('Priorités urgence', client.from(AREA11_TABLES.emergencyRankings).select('*').eq('school_id', schoolId), warnings),
    safeQuery('Foyers', client.from(AREA11_TABLES.households).select('*').eq('school_id', schoolId), warnings),
    safeQuery('Membres foyer', client.from(AREA11_TABLES.householdMemberships).select('*').eq('school_id', schoolId), warnings),
    safeQuery('Adresses historiques', client.from(AREA11_TABLES.addresses).select('*').eq('school_id', schoolId), warnings),
    safeQuery('Vérifications identité', client.from(AREA11_TABLES.verifications).select('*').eq('school_id', schoolId), warnings),
    safeQuery('Liens documentaires', client.from(AREA11_TABLES.documentLinks).select('*').eq('school_id', schoolId), warnings),
    safeQuery('Responsabilités facturation', client.from(AREA11_TABLES.billing).select('*').eq('school_id', schoolId), warnings),
    safeQuery('Relations accès parents', client.from(AREA11_TABLES.portal).select('*').eq('school_id', schoolId), warnings),
    safeQuery('Transitions familiales', client.from(AREA11_TABLES.transitions).select('*').eq('school_id', schoolId), warnings),
    safeQuery('Actions famille', client.from(AREA11_TABLES.tasks).select('*').eq('school_id', schoolId), warnings),
    safeQuery('Notes famille', client.from(AREA11_TABLES.notes).select('*').eq('school_id', schoolId), warnings),
    safeQuery('Handover Admissions', client.from('angelcare360_area9_handover_outcomes').select('*').eq('school_id', schoolId).limit(300), warnings),
    safeQuery('Liens Élève 360', client.from('angelcare360_area10_integration_links').select('*').eq('school_id', schoolId).limit(500), warnings),
    safeQuery('Audit parent', client.from('angelcare360_audit_logs').select('*').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(300), warnings),
  ])
  return { parents, links, students, emergencyContacts, documents, invoices, families, memberships, relationships, guardianAuthorities, restrictions, pickup, emergencyRankings, households, householdMemberships, addresses, verifications, documentLinks, billing, portal, transitions, tasks, notes, admissionHandover, student360Links, audits }
}

type Sources = Awaited<ReturnType<typeof loadSources>>

function verificationFor(parent: Row, rows: Row[]) {
  const latest = rows.filter((row) => text(row.person_id) === text(parent.id)).sort((a,b) => text(b.verified_at || b.created_at).localeCompare(text(a.verified_at || a.created_at)))[0]
  const meta = metadata(parent)
  return text(latest?.status || meta.area11_verification_state || meta.verification_state, 'À vérifier')
}

function makeAdult(parent: Row, s: Sources): Angelcare360Area11AdultSummary {
  const personId = text(parent.id)
  const links = s.links.filter((row) => text(row.parent_id) === personId && text(row.status, 'active') === 'active')
  const relationships = s.relationships.filter((row) => text(row.person_id) === personId && isOpen(row))
  const authorityRows = s.guardianAuthorities.filter((row) => text(row.person_id) === personId && isOpen(row))
  const pickupRows = s.pickup.filter((row) => text(row.person_id) === personId && ['active','verified','temporary'].includes(text(row.status).toLowerCase()))
  const billingRows = s.billing.filter((row) => text(row.person_id) === personId && isOpen(row))
  const emergencyRows = s.emergencyContacts.filter((row) => text(metadata(row).parent_id) === personId || text(row.contactable_id) === personId)
  const portalRows = s.portal.filter((row) => text(row.person_id) === personId && isOpen(row))
  const docs = s.documents.filter((row) => text(row.documentable_id) === personId)
  const households = s.householdMemberships.filter((row) => text(row.person_id) === personId && isOpen(row))
  const children = links.map((row) => row.student as Row | undefined).filter(Boolean) as Row[]
  const relationshipLabels = unique([...links.map((row) => text(row.relationship_type)), ...relationships.map((row) => text(row.relationship_type))])
  const verificationState = verificationFor(parent, s.verifications)
  const documentState = !docs.length ? 'À compléter' : docs.some((row) => ['expired','rejected','incomplete'].includes(text(row.status).toLowerCase())) ? 'À vérifier' : docs.some((row) => ['verified','active'].includes(text(row.status).toLowerCase())) ? 'Vérifié' : 'Reçu'
  const portalState = text(portalRows[0]?.status || (parent.portal_app_user_id ? 'Actif' : 'Non invité'))
  const attentionCount = Number(!['verified','vérifié'].includes(verificationState.toLowerCase())) + Number(!parent.phone && !parent.email) + Number(documentState !== 'Vérifié') + Number(s.restrictions.some((row) => text(row.person_id) === personId && isOpen(row))) + Number(s.tasks.some((row) => text(row.person_id) === personId && isOpen(row)))
  return {
    id: personId, parentCode: optional(parent.parent_code), fullName: fullName(parent), firstName: optional(parent.first_name), lastName: optional(parent.last_name),
    email: optional(parent.email), phone: optional(parent.phone), whatsapp: optional(parent.whatsapp), preferredLanguage: optional(parent.preferred_language), address: optional(parent.address),
    status: text(parent.status, 'active'), verificationState, childCount: children.length, childNames: unique(children.map((row) => fullName(row, 'Élève'))), relationshipLabels,
    guardianChildCount: new Set([...links.filter((row) => boolValue(row.is_guardian)).map((row) => text(row.student_id)), ...authorityRows.map((row) => text(row.student_id))].filter(Boolean)).size,
    pickupChildCount: new Set([...links.filter((row) => boolValue(row.can_pickup)).map((row) => text(row.student_id)), ...pickupRows.map((row) => text(row.student_id))].filter(Boolean)).size,
    emergencyChildCount: emergencyRows.length, billingChildCount: new Set([...links.filter((row) => boolValue(row.can_pay_fees)).map((row) => text(row.student_id)), ...billingRows.map((row) => text(row.student_id))].filter(Boolean)).size,
    portalState, documentState, householdCount: new Set(households.map((row) => text(row.household_id)).filter(Boolean)).size, attentionCount,
  }
}

function buildFamilies(s: Sources, adults: Angelcare360Area11AdultSummary[]): Angelcare360Area11FamilySummary[] {
  const adultMap = new Map(adults.map((adult) => [adult.id, adult]))
  const studentMap = new Map(s.students.map((student) => [text(student.id), student]))
  const explicit = s.families.map((family) => {
    const id = text(family.id)
    const memberships = s.memberships.filter((row) => text(row.family_id) === id && isOpen(row))
    const personIds = unique(memberships.filter((row) => text(row.member_type) === 'person').map((row) => text(row.person_id)))
    const childIds = unique(memberships.filter((row) => text(row.member_type) === 'student').map((row) => text(row.student_id)))
    const familyAdults = personIds.map((personId) => adultMap.get(personId)).filter(Boolean) as Angelcare360Area11AdultSummary[]
    const familyChildren = childIds.map((studentId) => studentMap.get(studentId)).filter(Boolean) as Row[]
    const householdCount = s.households.filter((row) => text(row.family_id) === id && isOpen(row)).length
    const openTasks = s.tasks.filter((row) => text(row.family_id) === id && isOpen(row)).length
    const attentionCount = familyAdults.reduce((sum, adult) => sum + adult.attentionCount, 0) + openTasks
    const primary = familyAdults.find((adult) => adult.guardianChildCount > 0) || familyAdults[0]
    return {
      id, displayName: text(family.display_name || family.family_name, `Famille ${primary?.fullName || ''}`.trim()), familyCode: optional(family.family_code), status: text(family.status,'active'),
      verificationState: text(family.verification_state,'À vérifier'), childCount: familyChildren.length, children: unique(familyChildren.map((row) => fullName(row,'Élève'))), adultCount: familyAdults.length, adults: familyAdults.map((adult) => adult.fullName),
      primaryResponsible: primary?.fullName || null, householdCount, verifiedGuardianCount: familyAdults.reduce((sum, adult) => sum + adult.guardianChildCount, 0), activePickupCount: familyAdults.reduce((sum, adult) => sum + adult.pickupChildCount, 0),
      emergencyReadyCount: familyAdults.reduce((sum, adult) => sum + adult.emergencyChildCount, 0), billingResponsibleCount: familyAdults.reduce((sum, adult) => sum + adult.billingChildCount, 0), portalReadyCount: familyAdults.filter((adult) => adult.portalState.toLowerCase() === 'active' || adult.portalState.toLowerCase() === 'actif').length,
      openTaskCount: openTasks, attentionCount, provisional: false, primaryPersonId: primary?.id || null,
    }
  })
  const explicitlyLinked = new Set(s.memberships.filter((row) => text(row.member_type) === 'person').map((row) => text(row.person_id)))
  const provisional = adults.filter((adult) => !explicitlyLinked.has(adult.id)).map((adult) => ({
    id: `person:${adult.id}`, displayName: `Famille de ${adult.fullName}`, familyCode: null, status: adult.status, verificationState: adult.verificationState,
    childCount: adult.childCount, children: adult.childNames, adultCount: 1, adults: [adult.fullName], primaryResponsible: adult.fullName, householdCount: adult.householdCount,
    verifiedGuardianCount: adult.guardianChildCount, activePickupCount: adult.pickupChildCount, emergencyReadyCount: adult.emergencyChildCount, billingResponsibleCount: adult.billingChildCount,
    portalReadyCount: ['active','actif'].includes(adult.portalState.toLowerCase()) ? 1 : 0, openTaskCount: 0, attentionCount: adult.attentionCount, provisional: true, primaryPersonId: adult.id,
  }))
  return [...explicit, ...provisional].sort((a,b) => a.displayName.localeCompare(b.displayName,'fr'))
}

function buildAttention(s: Sources, families: Angelcare360Area11FamilySummary[], adults: Angelcare360Area11AdultSummary[]): Angelcare360Area11Attention[] {
  const result: Angelcare360Area11Attention[] = []
  for (const adult of adults) {
    if (!['verified','vérifié'].includes(adult.verificationState.toLowerCase())) result.push({ id:`identity:${adult.id}`,familyId:null,personId:adult.id,studentId:null,subjectLabel:adult.fullName,category:'identity',title:'Identité à vérifier',detail:`État actuel : ${adult.verificationState}.`,consequence:'Une identité non vérifiée ne doit pas devenir automatiquement une autorité parentale ou de sortie.',actionLabel:'Vérifier l’identité',tone:'warning',operation:'person.verify' })
    if (!adult.phone && !adult.email) result.push({ id:`channel:${adult.id}`,familyId:null,personId:adult.id,studentId:null,subjectLabel:adult.fullName,category:'identity',title:'Aucun canal fiable',detail:'Aucun téléphone ni email n’est disponible.',consequence:'L’école ne peut pas joindre ce responsable dans un délai maîtrisé.',actionLabel:'Compléter le contact',tone:'warning',operation:'person.update' })
    if (adult.documentState !== 'Vérifié') result.push({ id:`document:${adult.id}`,familyId:null,personId:adult.id,studentId:null,subjectLabel:adult.fullName,category:'documents',title:'Pièce à vérifier',detail:`État documentaire : ${adult.documentState}.`,consequence:'L’identité, la relation et l’autorité doivent rester séparément prouvables.',actionLabel:'Demander une pièce',tone:'warning',operation:'family_document.request' })
  }
  const linksByStudent = indexBy(s.links.filter((row) => text(row.status,'active') === 'active'),'student_id')
  for (const student of s.students) {
    const studentId = text(student.id); const links = linksByStudent.get(studentId) || []
    if (!links.some((row) => boolValue(row.is_guardian)) && !s.guardianAuthorities.some((row) => text(row.student_id)===studentId && ['active','verified'].includes(text(row.status).toLowerCase()))) result.push({ id:`guardian:${studentId}`,familyId:null,personId:null,studentId,subjectLabel:fullName(student,'Élève'),category:'authority',title:'Responsable légal à confirmer',detail:'Aucune autorité de responsable active et vérifiée n’est visible.',consequence:'Les décisions sensibles ne doivent pas reposer sur un simple libellé de relation.',actionLabel:'Vérifier l’autorité',tone:'danger',deepLink:`/angelcare-360-command-center/parents?view=authority&student=${studentId}` })
    if (!links.some((row) => boolValue(row.can_pickup)) && !s.pickup.some((row) => text(row.student_id)===studentId && ['active','verified','temporary'].includes(text(row.status).toLowerCase()))) result.push({ id:`pickup:${studentId}`,familyId:null,personId:null,studentId,subjectLabel:fullName(student,'Élève'),category:'pickup',title:'Sortie à sécuriser',detail:'Aucune personne autorisée active n’est visible pour la récupération.',consequence:'La remise de l’enfant doit s’appuyer sur une autorisation explicite et actuelle.',actionLabel:'Configurer les sorties',tone:'danger',deepLink:`/angelcare-360-command-center/parents?view=pickup&student=${studentId}` })
    if (!s.emergencyContacts.some((row) => text(row.contactable_type)==='student' && text(row.contactable_id)===studentId && text(row.status,'active')==='active')) result.push({ id:`emergency:${studentId}`,familyId:null,personId:null,studentId,subjectLabel:fullName(student,'Élève'),category:'emergency',title:'Contact d’urgence manquant',detail:'Aucun contact d’urgence actif n’est visible.',consequence:'Une situation d’urgence exige une chaîne de contact priorisée et joignable.',actionLabel:'Ajouter un contact',tone:'danger',deepLink:`/angelcare-360-command-center/parents?view=emergency&student=${studentId}` })
  }
  for (const restriction of s.restrictions.filter(isOpen)) result.push({ id:`restriction:${restriction.id}`,familyId:optional(restriction.family_id),personId:optional(restriction.person_id),studentId:optional(restriction.student_id),subjectLabel:text(restriction.subject_label,'Restriction active'),category:'authority',title:'Restriction opérationnelle active',detail:text(restriction.operational_instruction || restriction.reason,'Une restriction doit être respectée.'),consequence:'La sécurité de l’enfant dépend de l’application immédiate de cette restriction, sans surexposer les preuves confidentielles.',actionLabel:'Examiner la restriction',tone:'danger',operation:'guardian_authority.request_review' })
  for (const task of s.tasks.filter(isOpen)) result.push({ id:`task:${task.id}`,familyId:optional(task.family_id),personId:optional(task.person_id),studentId:optional(task.student_id),subjectLabel:text(task.subject_label || task.title,'Action famille'),category:'task',title:text(task.title,'Action Famille 360'),detail:text(task.detail || task.description,'Une action reste ouverte.'),consequence:'La tâche reste ouverte jusqu’à obtention du résultat attendu.',actionLabel:'Ouvrir l’action',tone:'info',operation:'family_task.complete' })
  return result.slice(0,150)
}

function buildMetrics(families: Angelcare360Area11FamilySummary[], adults: Angelcare360Area11AdultSummary[], attention: Angelcare360Area11Attention[]): Angelcare360Area11Metric[] {
  const unverified = adults.filter((adult) => !['verified','vérifié'].includes(adult.verificationState.toLowerCase())).length
  const pickup = attention.filter((item) => item.category==='pickup').length
  const emergency = attention.filter((item) => item.category==='emergency').length
  const restrictions = attention.filter((item) => item.category==='authority' && item.title.includes('Restriction')).length
  const portal = adults.filter((adult) => !['active','actif'].includes(adult.portalState.toLowerCase())).length
  return [
    { key:'families',label:'Familles actives',value:families.length,detail:'Foyers familiaux et regroupements opérationnels',tone:'info',targetView:'families' },
    { key:'adults',label:'Adultes liés',value:adults.length,detail:'Parents et responsables connus',tone:'info',targetView:'adults' },
    { key:'verify',label:'À vérifier',value:unverified,detail:'Identités ou relations demandant confirmation',tone:unverified?'warning':'success',targetView:'attention' },
    { key:'pickup',label:'Sorties à sécuriser',value:pickup,detail:'Enfants sans autorisation active visible',tone:pickup?'danger':'success',targetView:'pickup' },
    { key:'emergency',label:'Urgence à compléter',value:emergency,detail:'Chaînes de contact incomplètes',tone:emergency?'danger':'success',targetView:'emergency' },
    { key:'restrictions',label:'Restrictions actives',value:restrictions,detail:'Instructions opérationnelles sensibles',tone:restrictions?'danger':'success',targetView:'authority' },
    { key:'portal',label:'Accès parents à revoir',value:portal,detail:'Relations portail non actives ou à vérifier',tone:portal?'violet':'success',targetView:'portal' },
  ]
}

function timelineFrom(s: Sources, dossier: { familyId?: string | null; personId?: string | null; studentIds?: string[] }): Angelcare360Area11TimelineEvent[] {
  const events: Angelcare360Area11TimelineEvent[] = []
  const matches = (row: Row) => {
    if (dossier.familyId && text(row.family_id)===dossier.familyId) return true
    if (dossier.personId && [row.person_id,row.parent_id,row.documentable_id].some((value) => text(value)===dossier.personId)) return true
    if (dossier.studentIds?.some((id) => [row.student_id,row.contactable_id].some((value) => text(value)===id))) return true
    return false
  }
  for (const row of [...s.relationships,...s.guardianAuthorities,...s.restrictions,...s.pickup,...s.addresses,...s.transitions,...s.tasks,...s.notes].filter(matches)) {
    events.push({ id:`area11:${text(row.id)}`,at:optional(row.created_at || row.effective_from || row.occurred_at),category:text(row.transition_type || row.relationship_type || row.status,'famille'),title:text(row.title || row.display_name || row.operational_instruction || row.relationship_type || 'Évolution familiale'),detail:text(row.reason || row.description || row.notes || row.detail || row.status,'Événement Famille 360'),source:'Famille 360',tone:tone(row.status) })
  }
  for (const row of s.audits.filter((row) => ['parent','guardian','family','relationship','pickup'].includes(text(row.entity_type).toLowerCase()) || text(row.module).toLowerCase().includes('family'))) {
    if (dossier.personId && text(row.entity_id)!==dossier.personId && !matches(row)) continue
    events.push({ id:`audit:${text(row.id)}`,at:optional(row.created_at),category:text(row.action,'audit'),title:text(row.action,'Événement audité'),detail:text(row.description || row.action,'Historique institutionnel'),source:'Audit',tone:'neutral' })
  }
  return events.sort((a,b) => text(b.at).localeCompare(text(a.at))).slice(0,120)
}

function dossierFor(input: { familyId?: string | null; personId?: string | null }, s: Sources, families: Angelcare360Area11FamilySummary[], adults: Angelcare360Area11AdultSummary[], warnings: string[]): Angelcare360Area11Dossier | null {
  let familyId = input.familyId || null
  let personId = input.personId || null
  if (familyId?.startsWith('person:')) { personId = familyId.slice('person:'.length); familyId = null }
  let family = familyId ? families.find((row) => row.id===familyId) || null : null
  if (family?.provisional && family.primaryPersonId) personId = family.primaryPersonId
  const adult = personId ? adults.find((row) => row.id===personId) || null : null
  if (!family && adult) family = families.find((row) => row.primaryPersonId===adult.id) || null
  if (!family && !adult) return null
  if (!familyId && family && !family.provisional) familyId = family.id
  const personIds = family && !family.provisional ? s.memberships.filter((row) => text(row.family_id)===family.id && text(row.member_type)==='person' && isOpen(row)).map((row)=>text(row.person_id)).filter(Boolean) : adult ? [adult.id] : []
  if (adult && !personIds.includes(adult.id)) personIds.push(adult.id)
  const links = s.links.filter((row) => personIds.includes(text(row.parent_id)) && text(row.status,'active')==='active')
  const studentIds = unique(links.map((row) => text(row.student_id)))
  const familyAdults = s.parents.filter((row) => personIds.includes(text(row.id)))
  const children = s.students.filter((row) => studentIds.includes(text(row.id)))
  const relevant = (row: Row) => (familyId && text(row.family_id)===familyId) || personIds.includes(text(row.person_id)) || studentIds.includes(text(row.student_id))
  const emergency = s.emergencyContacts.filter((row) => studentIds.includes(text(row.contactable_id)) || personIds.includes(text(metadata(row).parent_id)))
  const documents = s.documents.filter((row) => personIds.includes(text(row.documentable_id)))
  return {
    kind: family && !family.provisional ? 'family' : 'person', id: family && !family.provisional ? family.id : adult?.id || family?.primaryPersonId || '', title: family?.displayName || adult?.fullName || 'Famille 360', family, adult,
    children, adults: familyAdults, relationships: [...links,...s.relationships.filter(relevant)], guardianAuthorities:s.guardianAuthorities.filter(relevant), authorityRestrictions:s.restrictions.filter(relevant), pickupAuthorizations:s.pickup.filter(relevant),
    emergencyContacts:emergency, households:s.households.filter((row)=>familyId?text(row.family_id)===familyId:s.householdMemberships.some((m)=>text(m.household_id)===text(row.id)&&personIds.includes(text(m.person_id)))), householdMemberships:s.householdMemberships.filter(relevant),
    addresses:s.addresses.filter(relevant), identityVerifications:s.verifications.filter(relevant), documents, billingResponsibilities:s.billing.filter(relevant), portalRelationships:s.portal.filter(relevant), transitions:s.transitions.filter(relevant), tasks:s.tasks.filter(relevant), notes:s.notes.filter(relevant),
    admissionHandover:s.admissionHandover.filter((row)=>studentIds.includes(text(row.student_id)) || personIds.includes(text(row.parent_id))), student360Links:s.student360Links.filter((row)=>studentIds.includes(text(row.student_id))),
    timeline: timelineFrom(s,{familyId,personId:adult?.id||personId,studentIds}), sourceWarnings:warnings,
  }
}

export async function loadAngelcare360Area11FamilyCommand(input?: { view?: string | null; familyId?: string | null; personId?: string | null }): Promise<Angelcare360Area11CommandData> {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) throw new Angelcare360AccessError('Aucun établissement actif.',403)
  if (!can(context,'view')) throw new Angelcare360AccessError('Votre rôle ne permet pas de consulter les familles et responsables.',403)
  const client = await createClient(); const warnings:string[]=[]; const s = await loadSources(client,context.school.id,warnings)
  const adults=s.parents.map((parent)=>makeAdult(parent,s)); const families=buildFamilies(s,adults); const attention=buildAttention(s,families,adults); const selectedDossier=dossierFor({familyId:input?.familyId,personId:input?.personId},s,families,adults,warnings)
  return { view:normalizeView(input?.view), school:{id:context.school.id,name:text((context.school as Row).name || (context.school as Row).school_name,'Établissement')}, academicYear:{id:optional(context.academicYear?.id),label:text(context.academicYear?.label,'Année scolaire active')}, metrics:buildMetrics(families,adults,attention),families,adults,attention,selectedDossier,sourceWarnings:warnings,permissions:Array.from(context.permissions),generatedAt:new Date().toISOString() }
}

async function assertSubject(client: Client, schoolId: string, kind: 'family'|'person'|'student', id: string) {
  const table = kind==='family' ? AREA11_TABLES.families : kind==='person' ? 'angelcare360_parents' : 'angelcare360_students'
  const { data,error }=await client.from(table).select('id').eq('school_id',schoolId).eq('id',id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Angelcare360AccessError(kind==='family'?'Famille introuvable.':kind==='person'?'Responsable introuvable.':'Élève introuvable.',404)
}

async function existingReceipt(client: Client, schoolId:string, operation:string, key:string) {
  const { data }=await client.from(AREA11_TABLES.receipts).select('*').eq('school_id',schoolId).eq('operation_key',operation).eq('idempotency_key',key).maybeSingle(); return data as Row|null
}
async function writeReceipt(client:Client,input:{schoolId:string;operation:string;key:string;subjectKind:string;subjectId:string;actorId:string;result:Row}) {
  const {data,error}=await client.from(AREA11_TABLES.receipts).insert({school_id:input.schoolId,operation_key:input.operation,idempotency_key:input.key,subject_kind:input.subjectKind,subject_id:input.subjectId,actor_user_id:input.actorId,result_json:input.result}).select('id').single(); if(error)throw new Error(error.message); return text(data?.id)
}
async function task(client:Client,schoolId:string,actorId:string,payload:Row,input:{familyId?:string|null;personId?:string|null;studentId?:string|null;title:string;category:string;deepLink?:string|null}) {
  const {data,error}=await client.from(AREA11_TABLES.tasks).insert({school_id:schoolId,family_id:input.familyId||null,person_id:input.personId||null,student_id:input.studentId||null,title:input.title,category:input.category,detail:payloadOptional(payload,'detail')||payloadOptional(payload,'reason'),due_at:payloadOptional(payload,'dueAt'),owner_user_id:payloadOptional(payload,'ownerUserId'),deep_link:input.deepLink||null,status:'open',created_by_user_id:actorId}).select('*').single(); if(error)throw new Error(error.message); return data as Row
}

async function mutate(client:Client,schoolId:string,actorId:string,request:Angelcare360Area11MutationRequest,payload:Row):Promise<{data?:Row|null;message:string;deepLink?:string|null;subjectId?:string}> {
  const {operation,subjectKind}=request; let subjectId=request.subjectId; const now=new Date().toISOString()
  if(operation==='family.create') {
    const {data,error}=await client.from(AREA11_TABLES.families).insert({school_id:schoolId,family_code:payloadOptional(payload,'familyCode'),display_name:payloadText(payload,'displayName','Nouvelle famille'),verification_state:'pending',status:'active',created_by_user_id:actorId}).select('*').single(); if(error)throw new Error(error.message); subjectId=text(data.id); return {data:data as Row,subjectId,message:'Famille créée. Les adultes, relations et autorités restent à vérifier séparément.'}
  }
  if(operation==='family.verify') {
    const {data,error}=await client.from(AREA11_TABLES.families).update({verification_state:'verified',updated_at:now}).eq('school_id',schoolId).eq('id',subjectId).select('*').single(); if(error)throw new Error(error.message); return {data:data as Row,message:'Famille vérifiée comme regroupement. Les autorités individuelles restent séparément gouvernées.'}
  }
  if(operation==='person.create') {
    const full=payloadText(payload,'fullName'); if(!full)throw new Error('Le nom complet est obligatoire.'); const parts=full.split(/\s+/); const first=payloadOptional(payload,'firstName')||parts[0]; const last=payloadOptional(payload,'lastName')||parts.slice(1).join(' ')||null
    const {data,error}=await client.from('angelcare360_parents').insert({school_id:schoolId,parent_code:payloadOptional(payload,'parentCode'),first_name:first,last_name:last,full_name:full,email:payloadOptional(payload,'email'),phone:payloadOptional(payload,'phone'),whatsapp:payloadOptional(payload,'whatsapp'),preferred_language:payloadOptional(payload,'preferredLanguage')||'fr',status:'active',metadata_json:{area11_verification_state:'À vérifier'}}).select('*').single(); if(error)throw new Error(error.message); subjectId=text(data.id); return {data:data as Row,subjectId,message:'Responsable créé sans lui attribuer automatiquement une autorité.'}
  }
  if(operation==='person.update') {
    const {data,error}=await client.from('angelcare360_parents').update({full_name:payloadOptional(payload,'fullName'),email:payloadOptional(payload,'email'),phone:payloadOptional(payload,'phone'),whatsapp:payloadOptional(payload,'whatsapp'),preferred_language:payloadOptional(payload,'preferredLanguage'),address:payloadOptional(payload,'address')}).eq('school_id',schoolId).eq('id',subjectId).select('*').single(); if(error)throw new Error(error.message); return {data:data as Row,message:'Coordonnées du responsable mises à jour avec conservation de l’historique Famille 360.'}
  }
  if(operation==='person.verify') {
    const {data,error}=await client.from(AREA11_TABLES.verifications).insert({school_id:schoolId,person_id:subjectId,verification_type:payloadText(payload,'verificationType','identity'),evidence_document_id:payloadOptional(payload,'evidenceDocumentId'),status:'verified',verified_at:now,verified_by_user_id:actorId,notes:payloadOptional(payload,'notes')}).select('*').single(); if(error)throw new Error(error.message)
    const {data:person}=await client.from('angelcare360_parents').select('metadata_json').eq('school_id',schoolId).eq('id',subjectId).maybeSingle(); const meta=jsonValue((person as Row|undefined)?.metadata_json) as Row; await client.from('angelcare360_parents').update({metadata_json:{...meta,area11_verification_state:'verified',area11_verified_at:now}}).eq('school_id',schoolId).eq('id',subjectId)
    return {data:data as Row,message:'Identité vérifiée. Aucune autorité de garde ou de sortie n’a été inférée.'}
  }
  if(operation==='relationship.create') {
    const studentId=payloadText(payload,'studentId'); const personId=subjectKind==='person'?subjectId:payloadText(payload,'personId'); if(!studentId||!personId)throw new Error('Le responsable et l’élève sont obligatoires.')
    const {data,error}=await client.from(AREA11_TABLES.relationships).insert({school_id:schoolId,family_id:payloadOptional(payload,'familyId'),student_id:studentId,person_id:personId,relationship_type:payloadText(payload,'relationshipType','responsable'),declared_source:payloadText(payload,'declaredSource','school'),verification_state:'pending',effective_from:payloadOptional(payload,'effectiveFrom')||now,status:'active',created_by_user_id:actorId}).select('*').single(); if(error)throw new Error(error.message)
    await client.from('angelcare360_student_parent_links').upsert({school_id:schoolId,student_id:studentId,parent_id:personId,relationship_type:payloadText(payload,'relationshipType','responsable'),is_primary:false,is_guardian:false,can_pickup:false,can_receive_messages:true,can_pay_fees:false,status:'active'},{onConflict:'student_id,parent_id'})
    return {data:data as Row,message:'Relation créée en attente de vérification, sans autorité implicite.'}
  }
  if(['relationship.verify','relationship.update','relationship.end','relationship.reopen'].includes(operation)) {
    const id=payloadText(payload,'id'); if(!id)throw new Error('La relation est obligatoire.'); const patch:Row=operation==='relationship.verify'?{verification_state:'verified',verified_at:now,verified_by_user_id:actorId}:operation==='relationship.end'?{status:'ended',effective_until:payloadOptional(payload,'effectiveUntil')||now}:operation==='relationship.reopen'?{status:'active',effective_until:null}:{relationship_type:payloadOptional(payload,'relationshipType'),effective_from:payloadOptional(payload,'effectiveFrom')}; const {data,error}=await client.from(AREA11_TABLES.relationships).update(patch).eq('school_id',schoolId).eq('id',id).select('*').single(); if(error)throw new Error(error.message); return {data:data as Row,message:'Relation familiale mise à jour avec dates d’effet.'}
  }
  if(operation==='guardian_authority.create') {
    const personId=subjectKind==='person'?subjectId:payloadText(payload,'personId'); const studentId=payloadText(payload,'studentId'); if(!personId||!studentId)throw new Error('Le responsable et l’élève sont obligatoires.'); const {data,error}=await client.from(AREA11_TABLES.guardianAuthorities).insert({school_id:schoolId,family_id:payloadOptional(payload,'familyId'),student_id:studentId,person_id:personId,authority_type:payloadText(payload,'authorityType','guardian'),authority_scope:payloadText(payload,'authorityScope','school'),verification_state:'pending',effective_from:payloadOptional(payload,'effectiveFrom')||now,status:'pending',created_by_user_id:actorId}).select('*').single(); if(error)throw new Error(error.message); return {data:data as Row,message:'Autorité préparée. Elle reste inactive jusqu’à vérification.'}
  }
  if(operation.startsWith('guardian_authority.') && operation!=='guardian_authority.create' && operation!=='guardian_authority.view') {
    const id=payloadText(payload,'id'); if(!id)throw new Error('L’autorité est obligatoire.'); const patchMap:Record<string,Row>={
      'guardian_authority.verify':{status:'verified',verification_state:'verified',verified_at:now,verified_by_user_id:actorId},'guardian_authority.update':{authority_scope:payloadOptional(payload,'authorityScope'),effective_from:payloadOptional(payload,'effectiveFrom'),effective_until:payloadOptional(payload,'effectiveUntil')},
      'guardian_authority.restrict':{status:'restricted'},'guardian_authority.restore':{status:'verified'},'guardian_authority.end':{status:'ended',effective_until:payloadOptional(payload,'effectiveUntil')||now},'guardian_authority.request_review':{review_required:true,review_due_at:payloadOptional(payload,'dueAt')},
    }; const {data,error}=await client.from(AREA11_TABLES.guardianAuthorities).update(patchMap[operation]||{}).eq('school_id',schoolId).eq('id',id).select('*').single(); if(error)throw new Error(error.message); const row=data as Row; if(operation==='guardian_authority.verify') await client.from('angelcare360_student_parent_links').update({is_guardian:true}).eq('school_id',schoolId).eq('student_id',row.student_id).eq('parent_id',row.person_id); if(['guardian_authority.restrict','guardian_authority.end'].includes(operation)) await client.from('angelcare360_student_parent_links').update({is_guardian:false}).eq('school_id',schoolId).eq('student_id',row.student_id).eq('parent_id',row.person_id); return {data:row,message:'Autorité du responsable mise à jour sans modifier la relation de parenté.'}
  }
  if(operation==='pickup_authorization.create') {
    const personId=subjectKind==='person'?subjectId:payloadText(payload,'personId'); const studentId=payloadText(payload,'studentId'); if(!personId||!studentId)throw new Error('La personne et l’élève sont obligatoires.'); const {data,error}=await client.from(AREA11_TABLES.pickup).insert({school_id:schoolId,family_id:payloadOptional(payload,'familyId'),student_id:studentId,person_id:personId,authorization_type:payloadText(payload,'authorizationType','recurring'),valid_from:payloadOptional(payload,'validFrom')||now,valid_until:payloadOptional(payload,'validUntil'),verification_requirement:payloadText(payload,'verificationRequirement','identity_check'),status:'pending',created_by_user_id:actorId}).select('*').single(); if(error)throw new Error(error.message); return {data:data as Row,message:'Autorisation de sortie créée en attente de vérification.'}
  }
  if(operation.startsWith('pickup_authorization.') && !['pickup_authorization.create','pickup_authorization.view'].includes(operation)) {
    const id=payloadText(payload,'id'); if(!id)throw new Error('L’autorisation est obligatoire.'); const patchMap:Record<string,Row>={'pickup_authorization.verify':{status:'verified',verified_at:now,verified_by_user_id:actorId},'pickup_authorization.extend':{valid_until:payloadOptional(payload,'validUntil'),status:'verified'},'pickup_authorization.suspend':{status:'suspended'},'pickup_authorization.revoke':{status:'revoked',revoked_at:now},'pickup_authorization.expire':{status:'expired',valid_until:now},'pickup_authorization.request_identity_check':{identity_check_required:true,status:'pending'}}; const {data,error}=await client.from(AREA11_TABLES.pickup).update(patchMap[operation]||{}).eq('school_id',schoolId).eq('id',id).select('*').single(); if(error)throw new Error(error.message); const row=data as Row; if(['pickup_authorization.verify','pickup_authorization.extend'].includes(operation)) await client.from('angelcare360_student_parent_links').update({can_pickup:true}).eq('school_id',schoolId).eq('student_id',row.student_id).eq('parent_id',row.person_id); if(['pickup_authorization.suspend','pickup_authorization.revoke','pickup_authorization.expire'].includes(operation)) await client.from('angelcare360_student_parent_links').update({can_pickup:false}).eq('school_id',schoolId).eq('student_id',row.student_id).eq('parent_id',row.person_id); return {data:row,message:'Autorisation de sortie mise à jour et réconciliée avec l’usage opérationnel.'}
  }
  if(operation==='emergency_contact.create') {
    const studentId=subjectKind==='student'?subjectId:payloadText(payload,'studentId'); if(!studentId)throw new Error('L’élève est obligatoire.'); const {data,error}=await client.from('angelcare360_emergency_contacts').insert({school_id:schoolId,contactable_type:'student',contactable_id:studentId,contact_name:payloadText(payload,'contactName'),relationship_type:payloadOptional(payload,'relationshipType'),phone:payloadText(payload,'phone'),email:payloadOptional(payload,'email'),priority:Number(payload.priority||1),status:'active',metadata_json:{parent_id:payloadOptional(payload,'personId'),area11_verified:false}}).select('*').single(); if(error)throw new Error(error.message); return {data:data as Row,message:'Contact d’urgence ajouté. Sa priorité et sa vérification restent explicites.'}
  }
  if(operation.startsWith('emergency_contact.') && !['emergency_contact.create','emergency_contact.view'].includes(operation)) {
    const id=payloadText(payload,'id'); if(!id)throw new Error('Le contact d’urgence est obligatoire.'); if(operation==='emergency_contact.remove'){const {data,error}=await client.from('angelcare360_emergency_contacts').update({status:'inactive'}).eq('school_id',schoolId).eq('id',id).select('*').single();if(error)throw new Error(error.message);return{data:data as Row,message:'Contact d’urgence retiré sans suppression historique.'}}
    const {data:existing,error:readError}=await client.from('angelcare360_emergency_contacts').select('*').eq('school_id',schoolId).eq('id',id).single(); if(readError)throw new Error(readError.message); const meta=jsonValue((existing as Row).metadata_json) as Row; const patch=operation==='emergency_contact.verify'?{metadata_json:{...meta,area11_verified:true,area11_verified_at:now}}:operation==='emergency_contact.reorder'?{priority:Number(payload.priority||1)}:{contact_name:payloadOptional(payload,'contactName'),phone:payloadOptional(payload,'phone'),email:payloadOptional(payload,'email'),relationship_type:payloadOptional(payload,'relationshipType')}; const {data,error}=await client.from('angelcare360_emergency_contacts').update(patch).eq('school_id',schoolId).eq('id',id).select('*').single();if(error)throw new Error(error.message);return{data:data as Row,message:'Contact d’urgence mis à jour.'}
  }
  if(operation==='household.create') {
    const {data,error}=await client.from(AREA11_TABLES.households).insert({school_id:schoolId,family_id:subjectKind==='family'?subjectId:payloadOptional(payload,'familyId'),household_name:payloadText(payload,'householdName','Foyer principal'),household_type:payloadText(payload,'householdType','primary'),effective_from:payloadOptional(payload,'effectiveFrom')||now,status:'active',created_by_user_id:actorId}).select('*').single(); if(error)throw new Error(error.message); return {data:data as Row,message:'Foyer créé sans confondre foyer et famille.'}
  }
  if(operation==='address.create' || operation==='address.change') {
    const householdId=payloadText(payload,'householdId'); if(!householdId)throw new Error('Le foyer est obligatoire.'); if(operation==='address.change') await client.from(AREA11_TABLES.addresses).update({status:'historical',effective_until:now}).eq('school_id',schoolId).eq('household_id',householdId).eq('status','active'); const {data,error}=await client.from(AREA11_TABLES.addresses).insert({school_id:schoolId,family_id:payloadOptional(payload,'familyId'),household_id:householdId,address_line1:payloadText(payload,'addressLine1'),address_line2:payloadOptional(payload,'addressLine2'),city:payloadOptional(payload,'city'),postal_code:payloadOptional(payload,'postalCode'),country:payloadText(payload,'country','Maroc'),address_type:payloadText(payload,'addressType','home'),effective_from:payloadOptional(payload,'effectiveFrom')||now,verification_state:'pending',transport_impact_state:'review_required',billing_impact_state:'review_required',status:'active',created_by_user_id:actorId}).select('*').single();if(error)throw new Error(error.message);return{data:data as Row,message:'Adresse enregistrée avec préservation de l’historique et impacts à vérifier.'}
  }
  if(operation==='billing_responsibility.create') {
    const personId=subjectKind==='person'?subjectId:payloadText(payload,'personId'); const studentId=payloadText(payload,'studentId'); const {data,error}=await client.from(AREA11_TABLES.billing).insert({school_id:schoolId,family_id:payloadOptional(payload,'familyId'),student_id:studentId||null,person_id:personId,responsibility_type:payloadText(payload,'responsibilityType','primary_payer'),share_percent:payload.sharePercent||null,effective_from:payloadOptional(payload,'effectiveFrom')||now,status:'active',created_by_user_id:actorId}).select('*').single();if(error)throw new Error(error.message); if(studentId&&personId) await client.from('angelcare360_student_parent_links').update({can_pay_fees:true}).eq('school_id',schoolId).eq('student_id',studentId).eq('parent_id',personId);return{data:data as Row,message:'Responsabilité financière liée. Les factures et paiements restent sous l’autorité Finance.'}
  }
  if(operation==='portal_access.invite') {
    const personId=subjectKind==='person'?subjectId:payloadText(payload,'personId'); const {data,error}=await client.from(AREA11_TABLES.portal).insert({school_id:schoolId,family_id:payloadOptional(payload,'familyId'),person_id:personId,portal_app_user_id:null,access_state:'invitation_prepared',visibility_json:jsonValue(payload.visibility),effective_from:now,status:'active',created_by_user_id:actorId}).select('*').single();if(error)throw new Error(error.message);return{data:data as Row,message:'Invitation parent préparée. Aucun compte d’authentification n’a été créé ou modifié.'}
  }
  if(operation==='family_transition.prepare') {
    const {data,error}=await client.from(AREA11_TABLES.transitions).insert({school_id:schoolId,family_id:subjectKind==='family'?subjectId:payloadOptional(payload,'familyId'),person_id:subjectKind==='person'?subjectId:payloadOptional(payload,'personId'),student_id:subjectKind==='student'?subjectId:payloadOptional(payload,'studentId'),transition_type:payloadText(payload,'transitionType','relationship_change'),reason:payloadOptional(payload,'reason'),effective_at:payloadOptional(payload,'effectiveAt'),impact_json:jsonValue(payload.impact),status:'prepared',created_by_user_id:actorId}).select('*').single();if(error)throw new Error(error.message);return{data:data as Row,message:'Transition familiale préparée avec impact explicite.'}
  }
  if(operation==='family_task.assign') { const data=await task(client,schoolId,actorId,payload,{familyId:subjectKind==='family'?subjectId:payloadOptional(payload,'familyId'),personId:subjectKind==='person'?subjectId:payloadOptional(payload,'personId'),studentId:subjectKind==='student'?subjectId:payloadOptional(payload,'studentId'),title:payloadText(payload,'title','Action Famille 360'),category:payloadText(payload,'category','family')});return{data,message:'Action attribuée.'} }
  if(['family_task.complete','family_task.reopen'].includes(operation)) { const id=payloadText(payload,'id'); const patch=operation.endsWith('complete')?{status:'completed',completed_at:now,completion_note:payloadOptional(payload,'completionNote')}:{status:'open',completed_at:null,completion_note:null}; const {data,error}=await client.from(AREA11_TABLES.tasks).update(patch).eq('school_id',schoolId).eq('id',id).select('*').single();if(error)throw new Error(error.message);return{data:data as Row,message:operation.endsWith('complete')?'Action terminée avec résultat.':'Action rouverte.'} }
  if(operation==='family_note.add') { const {data,error}=await client.from(AREA11_TABLES.notes).insert({school_id:schoolId,family_id:subjectKind==='family'?subjectId:payloadOptional(payload,'familyId'),person_id:subjectKind==='person'?subjectId:payloadOptional(payload,'personId'),student_id:subjectKind==='student'?subjectId:payloadOptional(payload,'studentId'),note_kind:payloadText(payload,'noteKind','operational'),title:payloadOptional(payload,'title'),body:payloadText(payload,'body'),visibility:payloadText(payload,'visibility','internal'),created_by_user_id:actorId}).select('*').single();if(error)throw new Error(error.message);return{data:data as Row,message:'Note institutionnelle ajoutée.'} }

  const deepLinks:Record<string,string>={
    'family.view':`/angelcare-360-command-center/familles/${subjectId}`,'family.view_sensitive':`/angelcare-360-command-center/familles/${subjectId}`,'person.view':`/angelcare-360-command-center/parents/${subjectId}`,'person.view_sensitive':`/angelcare-360-command-center/parents/${subjectId}`,
    'family_document.view':`/angelcare-360-command-center/personnes/documents?parent=${subjectId}&source=family360`,'family_document.request':`/angelcare-360-command-center/personnes/documents?parent=${subjectId}&source=family360`,'family_document.receive':`/angelcare-360-command-center/personnes/documents?parent=${subjectId}&source=family360`,'family_document.verify':`/angelcare-360-command-center/personnes/documents?parent=${subjectId}&source=family360`,'family_document.reject':`/angelcare-360-command-center/personnes/documents?parent=${subjectId}&source=family360`,'family_document.replace':`/angelcare-360-command-center/personnes/documents?parent=${subjectId}&source=family360`,'family_document.restrict':`/angelcare-360-command-center/personnes/documents?parent=${subjectId}&source=family360`,'family_document.archive':`/angelcare-360-command-center/personnes/documents?parent=${subjectId}&source=family360`,
    'billing_responsibility.request_finance_review':`/angelcare-360-command-center/finance?parent=${subjectId}&source=family360`,'address.request_transport_review':`/angelcare-360-command-center/transport?source=family360&subject=${subjectId}`,'family_history.view':`/angelcare-360-command-center/administration?plane=audit&entity=parent&entityId=${subjectId}&source=family360`,'family_evidence.request':`/angelcare-360-command-center/administration?plane=audit&view=evidence&entity=parent&entityId=${subjectId}&source=family360`,'family_topup.request':'/angelcare-360-operator/platform?source=family360',
  }
  const deepLink=deepLinks[operation]
  const data=await task(client,schoolId,actorId,payload,{familyId:subjectKind==='family'?subjectId:null,personId:subjectKind==='person'?subjectId:null,studentId:subjectKind==='student'?subjectId:null,title:`Action gouvernée · ${operation}`,category:'source_authority',deepLink})
  return {data,message:deepLink?'La demande est enregistrée. La source canonique reste l’autorité de modification.':'Action Famille 360 enregistrée pour traitement gouverné.',deepLink}
}

export async function executeAngelcare360Area11Operation(request: Angelcare360Area11MutationRequest): Promise<Angelcare360Area11MutationResult> {
  const operation=text(request.operation),subjectId=text(request.subjectId),key=text(request.idempotencyKey)
  if(!operation||!subjectId||!key)throw new Angelcare360AccessError('Opération, matière et clé d’intégrité sont obligatoires.',422)
  const context=await requireOperation(operation); const client=await createClient(); const schoolId=context.school!.id
  if(!['family.create','person.create'].includes(operation)) await assertSubject(client,schoolId,request.subjectKind,subjectId)
  const prior=await existingReceipt(client,schoolId,operation,key); if(prior){const r=jsonValue(prior.result_json) as Row;return{ok:true,operation,subjectKind:request.subjectKind,subjectId:text(prior.subject_id,subjectId),receiptId:text(prior.id),message:text(r.message,'Opération déjà enregistrée.'),deepLink:optional(r.deepLink),refresh:true,data:(r.data as Row)||null}}
  const mutation=await mutate(client,schoolId,context.user.id,request,(request.payload||{}) as Row); const finalSubjectId=mutation.subjectId||subjectId; const result:Row={message:mutation.message,deepLink:mutation.deepLink||null,data:mutation.data||null}; const receiptId=await writeReceipt(client,{schoolId,operation,key,subjectKind:request.subjectKind,subjectId:finalSubjectId,actorId:context.user.id,result})
  await recordAngelcare360AuditEventServer({schoolId,category:'parent',module:'family360',action:operation,entityType:request.subjectKind==='person'?'parent':request.subjectKind,entityId:finalSubjectId,severity:operation.includes('restrict')||operation.includes('pickup')?'warning':'info',beforeData:{operation,subjectKind:request.subjectKind,subjectId},afterData:mutation.data||{},metadata:{area:11,idempotency_key:key,receipt_id:receiptId,relationship_authority_separated:true,area12_reserved:true}})
  return {ok:true,operation,subjectKind:request.subjectKind,subjectId:finalSubjectId,receiptId,message:mutation.message,deepLink:mutation.deepLink||null,refresh:true,data:mutation.data||null}
}

export const ANGELCARE360_AREA11_VIEWS=VIEWS
export const ANGELCARE360_AREA11_VIEW_LABELS=VIEW_LABELS
export const ANGELCARE360_AREA11_OPERATIONS=OPERATIONS
export const ANGELCARE360_AREA11_OPERATION_PERMISSIONS=OPERATION_MODE
