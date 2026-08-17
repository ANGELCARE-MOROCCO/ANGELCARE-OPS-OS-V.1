#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const APP = path.resolve(process.argv[2] || process.cwd())
let passed = 0
let failed = 0

function read(rel) {
  const file = path.join(APP, rel)
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
}
function exists(rel) { return fs.existsSync(path.join(APP, rel)) }
function check(label, condition) {
  if (condition) { passed += 1; console.log(`PASS  ${label}`) }
  else { failed += 1; console.log(`FAIL  ${label}`) }
}
function has(rel, needle) { return read(rel).includes(needle) }
function lacks(rel, needle) { return !read(rel).includes(needle) }

const claimsApi = 'app/api/angelcare360/claims/route.ts'
const routes = [
  'app/(protected)/angelcare-360-command-center/reclamations/_utils.ts',
  'app/(protected)/angelcare-360-command-center/reclamations/page.tsx',
  'app/(protected)/angelcare-360-command-center/reclamations/tickets/page.tsx',
  'app/(protected)/angelcare-360-command-center/reclamations/tickets/[id]/page.tsx',
  'app/(protected)/angelcare-360-command-center/reclamations/assignations/page.tsx',
  'app/(protected)/angelcare-360-command-center/reclamations/priorites/page.tsx',
  'app/(protected)/angelcare-360-command-center/reclamations/audit/page.tsx',
  'app/(protected)/angelcare-360-command-center/reclamations/loading.tsx',
  'app/(protected)/angelcare-360-command-center/reclamations/error.tsx',
  'app/(protected)/angelcare-360-command-center/reclamations/not-found.tsx',
]
const components = [
  'components/angelcare360/claims/TrustResolutionOS.module.css',
  'components/angelcare360/claims/claimPresentation.ts',
  'components/angelcare360/claims/Angelcare360TrustResolutionCommand.tsx',
  'components/angelcare360/claims/Angelcare360ClaimCreateStudio.tsx',
  'components/angelcare360/claims/Angelcare360ClaimActionStudio.tsx',
  'components/angelcare360/claims/Angelcare360ClaimTicketDetail.tsx',
  'components/angelcare360/claims/Angelcare360ClaimTicketsWorkspace.tsx',
  'components/angelcare360/claims/Angelcare360ClaimAssignmentsWorkspace.tsx',
  'components/angelcare360/claims/Angelcare360ClaimPriorityWorkspace.tsx',
  'components/angelcare360/claims/Angelcare360ClaimAuditDrawer.tsx',
  'components/angelcare360/claims/Angelcare360ClaimsSectionScreen.tsx',
]

for (const route of routes) check(`route exists: ${route}`, exists(route))
for (const component of components) check(`component exists: ${component}`, exists(component))
check('claims API route exists or was restored', exists(claimsApi))
check('claims API delegates to canonical claims authority', has(claimsApi, '@/lib/angelcare360/server/claims'))
check('claims API preserves access error authority', has(claimsApi, 'Angelcare360AccessError'))
for (const op of ['create', 'update', 'assign', 'status', 'resolve', 'close']) check(`claims API supports ${op}`, has(claimsApi, `operation === '${op}'`))

const root = 'app/(protected)/angelcare-360-command-center/reclamations/page.tsx'
const command = 'components/angelcare360/claims/Angelcare360TrustResolutionCommand.tsx'
check('root mounts dedicated Trust Resolution command', has(root, 'Angelcare360TrustResolutionCommand'))
check('root no longer mounts generic Zone F relationship command', lacks(root, 'ZoneFRelationshipCommand'))
check('root uses canonical claims overview authority', has(root, 'getAngelcare360ClaimsOverview'))
check('root uses canonical claim ticket authority', has(root, 'listAngelcare360ClaimTickets'))
check('root uses permission-governed claims context', has(root, 'getAngelcare360ClaimsContext'))
check('root has no Zone F dependency', lacks(root, 'zone-f-relationship') && lacks(command, 'zone-f-relationship'))
check('route helper preserves reclamations.view permission gate', has('app/(protected)/angelcare-360-command-center/reclamations/_utils.ts', "reclamations.view"))
check('layout preserves reclamations.view permission gate', has('app/(protected)/angelcare-360-command-center/reclamations/layout.tsx', "reclamations.view"))
check('layout uses SANILA Trust Resolution metadata', has('app/(protected)/angelcare-360-command-center/reclamations/layout.tsx', 'SANILA Trust Resolution OS'))

for (const marker of ['LIVING SITUATION FIELD', 'RECOVERY STREAM', 'ATTENTION NOW', 'RECOVERY PROTOCOL', 'QUALITY CONSTELLATION', 'INSTITUTIONAL MEMORY']) {
  check(`root contract marker: ${marker}`, has(command, marker))
}
check('root truth-lock explicitly forbids fabricated trust score', has(command, 'trust score'))
check('root uses persisted claim tickets', has(command, 'snapshot.claimTickets'))
check('root uses persisted status history for recovery stream', has(command, 'normalizeClaimHistory'))
check('root links to canonical ticket dossiers', has(command, '/reclamations/tickets/${ticket.id}'))
check('root contains no Math.random positioning', lacks(command, 'Math.random'))
check('root contains no timer polling', lacks(command, 'setInterval'))

const detail = 'components/angelcare360/claims/Angelcare360ClaimTicketDetail.tsx'
for (const marker of ['INSTITUTIONAL CASE CHAMBER', 'CASE NARRATIVE CANVAS', 'RECOVERY CONSOLE', 'FAMILY VOICE CHAMBER', 'EVIDENCE & AUTHORITY', 'ADAPTIVE DOMAIN CONTEXT']) {
  check(`dossier contract marker: ${marker}`, has(detail, marker))
}
check('dossier uses persisted history', has(detail, 'normalizeClaimHistory(ticket)'))
check('dossier separates internal notes', has(detail, 'Interne · jamais présenté comme message famille'))
check('dossier refuses fake family conversation', has(detail, 'aucune conversation n’est simulée'))
check('dossier refuses fake trust recovery', has(detail, 'Aucun trust score n’est calculé'))
check('dossier links contextual authority to Transport', has(detail, '/angelcare-360-command-center/transport'))
check('dossier links contextual authority to Finance', has(detail, '/angelcare-360-command-center/finance'))
check('dossier links contextual authority to Attendance', has(detail, '/angelcare-360-command-center/presences'))
check('dossier links contextual authority to Academics', has(detail, '/angelcare-360-command-center/academique'))
check('dossier links contextual authority to Documents', has(detail, '/angelcare-360-command-center/documents'))

const action = 'components/angelcare360/claims/Angelcare360ClaimActionStudio.tsx'
for (const operation of ['assign', 'status', 'resolve', 'close']) check(`action studio supports ${operation}`, has(detail, `mode=\"${operation}\"`))
check('action studio writes through canonical claims API', has(action, "'/api/angelcare360/claims'"))
check('action studio sends canonical claim entity', has(action, "entity: 'claim'"))
check('resolution requires resolutionSummary field', has(action, 'resolutionSummary'))
check('resolution studio truth-locks fake satisfaction', has(action, 'satisfaction famille'))
check('assignment can use real staff authority options', has(action, 'ClaimStaffOption'))
check('assignment keeps canonical ID fallback if staff list hidden', has(action, 'Identifiant canonique du personnel'))

const create = 'components/angelcare360/claims/Angelcare360ClaimCreateStudio.tsx'
check('intake studio writes through canonical claims API', has(create, "'/api/angelcare360/claims'"))
check('intake studio supports parent authority', has(create, 'submittedByParentId'))
check('intake studio supports student authority', has(create, 'submittedByStudentId'))
check('intake studio supports staff authority', has(create, 'submittedByStaffId'))
check('intake studio supports app-user authority', has(create, 'submittedByAppUserId'))
check('intake studio consumes authorized requester options when available', has(create, 'requesterOptions'))
check('intake studio labels factual description', has(create, 'Description factuelle'))

const ticketsRoute = 'app/(protected)/angelcare-360-command-center/reclamations/tickets/page.tsx'
check('tickets route loads real claim tickets', has(ticketsRoute, 'listAngelcare360ClaimTickets'))
check('tickets route attempts real requester authorities', has(ticketsRoute, 'listAngelcare360Parents') && has(ticketsRoute, 'listAngelcare360Students') && has(ticketsRoute, 'listAngelcare360Staff'))
check('tickets route has permission-safe requester fallbacks', has(ticketsRoute, '.catch(() => [])'))
check('tickets route contains no generic CommunicationMutationForm', lacks(ticketsRoute, 'CommunicationMutationForm'))

const detailRoute = 'app/(protected)/angelcare-360-command-center/reclamations/tickets/[id]/page.tsx'
check('detail route loads canonical ticket by school', has(detailRoute, 'getAngelcare360ClaimTicketById'))
check('detail route attempts canonical staff directory safely', has(detailRoute, 'listAngelcare360Staff') && has(detailRoute, '.catch(() => [])'))
check('detail route uses notFound tenant-safe boundary', has(detailRoute, 'notFound()'))
check('detail route contains no legacy generic mutation form', lacks(detailRoute, 'CommunicationMutationForm'))

check('assignments route loads canonical assignments', has('app/(protected)/angelcare-360-command-center/reclamations/assignations/page.tsx', 'listAngelcare360ClaimAssignments'))
check('priorities route loads canonical priority view', has('app/(protected)/angelcare-360-command-center/reclamations/priorites/page.tsx', 'listAngelcare360ClaimPriorityView'))
check('audit route loads canonical audit events', has('app/(protected)/angelcare-360-command-center/reclamations/audit/page.tsx', 'listAngelcare360ClaimAuditEvents'))

const ticketWorkspace = 'components/angelcare360/claims/Angelcare360ClaimTicketsWorkspace.tsx'
check('ticket workspace has real search', has(ticketWorkspace, 'setSearch'))
check('ticket workspace has priority filtering', has(ticketWorkspace, 'setPriority'))
check('ticket workspace has lifecycle filtering', has(ticketWorkspace, 'setStatus'))
check('ticket workspace has dense and spatial card modes', has(ticketWorkspace, "'cards' | 'dense'"))

const priorityWorkspace = 'components/angelcare360/claims/Angelcare360ClaimPriorityWorkspace.tsx'
check('priority view uses real created_at age', has(priorityWorkspace, 'claimAge(ticket.created_at)'))
check('priority view explicitly refuses fake SLA', has('app/(protected)/angelcare-360-command-center/reclamations/priorites/page.tsx', 'Aucun faux compte à rebours SLA'))
check('priority view supports urgent/high/normal/low', ['urgent','high','normal','low'].every((item) => has(priorityWorkspace, `'${item}'`)))

const assignmentWorkspace = 'components/angelcare360/claims/Angelcare360ClaimAssignmentsWorkspace.tsx'
check('assignment view distinguishes unassigned responsibility', has(assignmentWorkspace, 'À attribuer'))
check('assignment view distinguishes waiting dependencies', has(assignmentWorkspace, 'En dépendance'))
check('assignment view explicitly refuses fake staff performance', has(assignmentWorkspace, 'Aucun taux de performance individuel n’est inventé'))

const auditWorkspace = 'components/angelcare360/claims/Angelcare360ClaimAuditDrawer.tsx'
check('audit view exposes forensic chronology', has(auditWorkspace, 'FORENSIC CHRONOLOGY'))
check('audit view filters real events locally', has(auditWorkspace, 'useMemo'))
check('audit view formats persisted created_at', has(auditWorkspace, 'event.created_at'))

const css = 'components/angelcare360/claims/TrustResolutionOS.module.css'
for (const marker of ['.situationField', '.recoveryStream', '.caseChamber', '.relationshipPortrait', '.narrativeCanvas', '.recoveryConsole', '.overlay', '.sheet', '.priorityMatrix', '.auditTimeline', '.memoryBand']) check(`CSS signature exists: ${marker}`, has(css, marker))
check('desktop wide architecture present', has(css, 'grid-template-columns: minmax(220px,.58fr) minmax(420px,1.35fr) minmax(260px,.72fr)'))
check('tablet breakpoint present', has(css, '@media (max-width: 900px)'))
check('mobile breakpoint present', has(css, '@media (max-width: 640px)'))
check('reduced motion fallback present', has(css, '@media (prefers-reduced-motion: reduce)'))
check('focus-visible treatment present', has(css, ':focus-visible'))
check('motion is CSS-driven, not requestAnimationFrame', lacks(command, 'requestAnimationFrame') && lacks(detail, 'requestAnimationFrame'))

check('premium loading state exists', exists('app/(protected)/angelcare-360-command-center/reclamations/loading.tsx') && has('app/(protected)/angelcare-360-command-center/reclamations/loading.tsx', 'aria-busy'))
check('premium error state exists', exists('app/(protected)/angelcare-360-command-center/reclamations/error.tsx') && has('app/(protected)/angelcare-360-command-center/reclamations/error.tsx', 'reset'))
check('tenant-safe not-found state exists', exists('app/(protected)/angelcare-360-command-center/reclamations/not-found.tsx') && has('app/(protected)/angelcare-360-command-center/reclamations/not-found.tsx', 'autre tenant'))

const types = 'types/angelcare360/communications.ts'
for (const field of ['submitted_by_parent_id', 'submitted_by_student_id', 'submitted_by_staff_id', 'assigned_at', 'created_at', 'updated_at', 'metadata_json']) check(`claim type exposes existing persisted field: ${field}`, has(types, field))

const server = 'lib/angelcare360/server/claims.ts'
check('mapClaim exposes created_at', has(server, 'created_at: row.created_at'))
check('mapClaim exposes assigned_at', has(server, 'assigned_at: row.assigned_at'))
check('mapClaim exposes requester authority ids', has(server, 'submitted_by_parent_id: row.submitted_by_parent_id'))
const assignmentFn = read(server).split('export async function listAngelcare360ClaimAssignments')[1]?.split('export async function ')[0] || ''
const priorityFn = read(server).split('export async function listAngelcare360ClaimPriorityView')[1]?.split('export async function ')[0] || ''
check('assignment view query includes subject/code/category', ['reclamation_code','subject','category','priority','status','created_at'].every((field) => assignmentFn.includes(field)))
check('priority view query includes subject/code/category', ['reclamation_code','subject','category','priority','status','created_at'].every((field) => priorityFn.includes(field)))
check('claims CRUD remains permission governed', has(server, "getContextOrThrow('reclamations.view'") && has(server, "getContextOrThrow('reclamations.approve'"))
check('claims resolve remains audit logged', has(server, "action: 'claim.resolved'"))
check('claims close remains audit logged', has(server, "action: 'claim.closed'"))

const allNew = [...routes, ...components, claimsApi, server, types].map(read).join('\n')
check('no fake numeric trust score hard-coded', !/trust[^\n]{0,40}(92\.4|9[0-9]%)/i.test(allNew))
check('no Math.random fake placement anywhere in target', !allNew.includes('Math.random'))
check('no short polling loop in target', !allNew.includes('setInterval('))
check('no production build command in target', !/(npm\s+run\s+build|next\s+build|vercel\s+--prod)/.test(allNew))
check('no SQL execution in target code', !/(supabase\s+db\s+push|psql\s|\.sql\b)/.test(allNew))

console.log(`\n${passed}/${passed + failed} checks passed. SANILA Trust Resolution OS is ${failed ? 'NOT ' : ''}statically accepted.`)
process.exit(failed ? 1 : 0)
