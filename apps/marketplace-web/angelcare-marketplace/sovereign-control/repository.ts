import { createServiceClient } from '@/lib/supabase/server'
import { writeMarketplaceAudit } from '../audit/write-audit'
import type { MarketplaceRequestContext } from '../domain/types'
import { MarketplaceError } from '../server/errors'
import type {
  ActionItem,
  ApprovalRecord,
  AuditSignal,
  CommandMetric,
  CommandRisk,
  CommandSummary,
  ExecutiveBrief,
  ObjectComment,
  SearchResult,
} from './types'

const CONTROL_MIGRATION_MESSAGE =
  'La migration Ultra Delivery 1/5 - Master Backoffice doit être appliquée avant cette opération.'

function fail(operation: string, error: { message?: string; code?: string } | null): MarketplaceError {
  const missing = error?.code === '42P01' || String(error?.message || '').includes('angelcare_marketplace_')
  return new MarketplaceError(
    missing ? 'CONFIGURATION_ERROR' : 'INTERNAL_ERROR',
    missing ? CONTROL_MIGRATION_MESSAGE : `Le Master Backoffice n’a pas pu ${operation}.`,
  )
}

async function exactCount(
  table: string,
  filter: { column: string; value: string } | { column: string; values: string[] },
): Promise<number> {
  const supabase = await createServiceClient()
  let query = supabase.from(table).select('id', { count: 'exact', head: true })
  query = 'values' in filter
    ? query.in(filter.column, filter.values)
    : query.eq(filter.column, filter.value)
  const { count, error } = await query
  if (error) throw fail(`calculer ${table}`, error)
  return count || 0
}

export async function getCommandSummary(): Promise<CommandSummary> {
  const supabase = await createServiceClient()
  const [approvalCount, actionCount, blockedActionCount, cmsReviewCount, familyRequestCount, inquiryCount] = await Promise.all([
    exactCount('angelcare_marketplace_approval_requests', { column: 'status', values: ['submitted', 'in_review'] }),
    exactCount('angelcare_marketplace_admin_action_items', { column: 'status', values: ['open', 'in_progress', 'blocked'] }),
    exactCount('angelcare_marketplace_admin_action_items', { column: 'status', value: 'blocked' }),
    exactCount('angelcare_marketplace_cms_pages', { column: 'status', values: ['submitted', 'in_review', 'approved', 'scheduled'] }),
    exactCount('angelcare_marketplace_family_quote_requests', { column: 'status', values: ['submitted', 'qualified', 'proposal_ready'] }),
    exactCount('angelcare_marketplace_public_inquiries', { column: 'status', values: ['new', 'triaged', 'in_progress'] }),
  ])

  const [{ data: approvals, error: approvalsError }, { data: actions, error: actionsError }, { data: audit, error: auditError }] = await Promise.all([
    supabase.from('angelcare_marketplace_approval_requests').select('*').in('status', ['submitted', 'in_review']).order('priority', { ascending: false }).order('created_at', { ascending: false }).limit(8),
    supabase.from('angelcare_marketplace_admin_action_items').select('*').in('status', ['open', 'in_progress', 'blocked']).order('priority', { ascending: false }).order('due_at', { ascending: true }).limit(8),
    supabase.from('angelcare_marketplace_audit_events').select('id,action,object_type,object_id,actor_id,result,severity,created_at').order('created_at', { ascending: false }).limit(10),
  ])
  if (approvalsError) throw fail('charger les approbations', approvalsError)
  if (actionsError) throw fail('charger les actions', actionsError)
  if (auditError) throw fail('charger les preuves', auditError)

  const metrics: CommandMetric[] = [
    { key: 'approvals', label: 'Décisions en attente', value: approvalCount, status: approvalCount ? 'attention' : 'healthy', route: '/angelcare-marketplace/admin/approvals', explanation: 'Objets soumis à une décision gouvernée.' },
    { key: 'actions', label: 'Actions actives', value: actionCount, status: blockedActionCount ? 'attention' : 'neutral', route: '/angelcare-marketplace/admin/action-center', explanation: 'Actions avec propriétaire, échéance et prochaine étape.' },
    { key: 'content', label: 'Publications en contrôle', value: cmsReviewCount, status: cmsReviewCount ? 'attention' : 'neutral', route: '/angelcare-marketplace/admin/experience/publishing', explanation: 'Pages en revue, approuvées ou planifiées.' },
    { key: 'family', label: 'Demandes familles à traiter', value: familyRequestCount, status: familyRequestCount ? 'attention' : 'healthy', route: '/angelcare-marketplace/admin/family-requests', explanation: 'Demandes persistantes nécessitant qualification ou proposition.' },
    { key: 'inquiries', label: 'Entrées publiques ouvertes', value: inquiryCount, status: inquiryCount ? 'attention' : 'healthy', route: '/angelcare-marketplace/admin/public-inquiries', explanation: 'Demandes issues de l’univers public.' },
  ]

  const risks: CommandRisk[] = []
  if (blockedActionCount) risks.push({ key: 'blocked-actions', label: 'Actions bloquées', count: blockedActionCount, severity: 'critical', route: '/angelcare-marketplace/admin/action-center?status=blocked', nextAction: 'Attribuer un responsable de déblocage.' })
  if (approvalCount) risks.push({ key: 'pending-approvals', label: 'Décisions non rendues', count: approvalCount, severity: 'warning', route: '/angelcare-marketplace/admin/approvals', nextAction: 'Réviser les preuves et enregistrer une décision.' })

  return {
    generatedAt: new Date().toISOString(),
    metrics,
    approvals: (approvals || []) as ApprovalRecord[],
    actions: (actions || []) as ActionItem[],
    recentAudit: (audit || []) as AuditSignal[],
    risks,
  }
}

export async function globalSearch(input: { q: string; objectType?: string; territoryId?: string | null; limit?: number }): Promise<SearchResult[]> {
  const queryText = input.q.trim()
  if (queryText.length < 2) return []
  const supabase = await createServiceClient()
  let query = supabase
    .from('angelcare_marketplace_admin_search_v')
    .select('*')
    .textSearch('search_document', queryText, { type: 'websearch', config: 'simple' })
    .order('search_rank', { ascending: false })
    .limit(Math.min(Math.max(input.limit || 30, 1), 100))
  if (input.objectType) query = query.eq('object_type', input.objectType)
  if (input.territoryId) query = query.eq('territory_id', input.territoryId)
  const { data, error } = await query
  if (error) throw fail('effectuer la recherche globale', error)
  return (data || []) as SearchResult[]
}

export async function listApprovals(status?: string): Promise<ApprovalRecord[]> {
  const supabase = await createServiceClient()
  let query = supabase.from('angelcare_marketplace_approval_requests').select('*').order('created_at', { ascending: false }).limit(200)
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw fail('charger le centre d’approbation', error)
  return (data || []) as ApprovalRecord[]
}

export async function createApproval(input: {
  objectType: string
  objectId: string
  title: string
  summary?: string | null
  priority?: string
  ownerId?: string | null
  dueAt?: string | null
  territoryId?: string | null
  context: MarketplaceRequestContext
  requestId: string
}): Promise<ApprovalRecord> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase.rpc('angelcare_marketplace_create_approval_request', {
    p_object_type: input.objectType,
    p_object_id: input.objectId,
    p_title: input.title,
    p_summary: input.summary || null,
    p_priority: input.priority || 'normal',
    p_owner_id: input.ownerId || null,
    p_requested_by: input.context.actor.id,
    p_territory_id: input.territoryId || input.context.territoryId,
    p_due_at: input.dueAt || null,
  }).single()
  if (error || !data) throw fail('créer la demande d’approbation', error)
  await writeMarketplaceAudit({ context: input.context, requestId: input.requestId, action: 'marketplace.approval.created', objectType: input.objectType, objectId: input.objectId, result: 'success', severity: 'info', afterValue: data, source: 'ultra-delivery-01-master-backoffice' })
  return data as ApprovalRecord
}

export async function decideApproval(input: {
  approvalId: string
  decision: 'approved' | 'rejected'
  reason: string
  context: MarketplaceRequestContext
  requestId: string
}): Promise<ApprovalRecord> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase.rpc('angelcare_marketplace_decide_approval', {
    p_approval_id: input.approvalId,
    p_decision: input.decision,
    p_reason: input.reason,
    p_actor_id: input.context.actor.id,
  }).single()
  if (error || !data) throw fail('enregistrer la décision', error)
  await writeMarketplaceAudit({ context: input.context, requestId: input.requestId, action: `marketplace.approval.${input.decision}`, objectType: 'approval_request', objectId: input.approvalId, result: 'success', severity: 'info', reason: input.reason, afterValue: data, source: 'ultra-delivery-01-master-backoffice' })
  return data as ApprovalRecord
}

export async function listActions(status?: string): Promise<ActionItem[]> {
  const supabase = await createServiceClient()
  let query = supabase.from('angelcare_marketplace_admin_action_items').select('*').order('priority', { ascending: false }).order('due_at', { ascending: true }).limit(250)
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw fail('charger les actions', error)
  return (data || []) as ActionItem[]
}

export async function updateAction(input: { id: string; status?: string; assigneeId?: string | null; blocker?: string | null; nextAction?: string | null; context: MarketplaceRequestContext; requestId: string }): Promise<ActionItem> {
  const supabase = await createServiceClient()
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: input.context.actor.id }
  if (input.status) patch.status = input.status
  if (input.assigneeId !== undefined) patch.assignee_id = input.assigneeId
  if (input.blocker !== undefined) patch.blocker = input.blocker
  if (input.nextAction !== undefined) patch.next_action = input.nextAction
  const { data, error } = await supabase.from('angelcare_marketplace_admin_action_items').update(patch).eq('id', input.id).select('*').single()
  if (error || !data) throw fail('mettre à jour l’action', error)
  await writeMarketplaceAudit({ context: input.context, requestId: input.requestId, action: 'marketplace.action.updated', objectType: 'admin_action_item', objectId: input.id, result: 'success', severity: 'info', afterValue: data, source: 'ultra-delivery-01-master-backoffice' })
  return data as ActionItem
}

export async function getObjectDossier(objectType: string, objectId: string): Promise<{ object: SearchResult | null; comments: ObjectComment[]; audit: AuditSignal[]; relations: Record<string, unknown>[] }> {
  const supabase = await createServiceClient()
  const [{ data: object }, { data: comments }, { data: audit }, { data: relations }] = await Promise.all([
    supabase.from('angelcare_marketplace_admin_search_v').select('*').eq('object_type', objectType).eq('object_id', objectId).maybeSingle(),
    supabase.from('angelcare_marketplace_admin_comments').select('*').eq('object_type', objectType).eq('object_id', objectId).order('created_at', { ascending: false }),
    supabase.from('angelcare_marketplace_audit_events').select('id,action,object_type,object_id,actor_id,result,severity,created_at').eq('object_type', objectType).eq('object_id', objectId).order('created_at', { ascending: false }).limit(100),
    supabase.from('angelcare_marketplace_object_relations').select('*').or(`source_object_id.eq.${objectId},target_object_id.eq.${objectId}`).limit(100),
  ])
  return { object: object as SearchResult | null, comments: (comments || []) as ObjectComment[], audit: (audit || []) as AuditSignal[], relations: (relations || []) as Record<string, unknown>[] }
}

export async function addObjectComment(input: { objectType: string; objectId: string; body: string; visibility: 'internal' | 'restricted'; context: MarketplaceRequestContext; requestId: string }): Promise<ObjectComment> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase.from('angelcare_marketplace_admin_comments').insert({ object_type: input.objectType, object_id: input.objectId, body: input.body, visibility: input.visibility, author_id: input.context.actor.id }).select('*').single()
  if (error || !data) throw fail('ajouter le commentaire', error)
  await writeMarketplaceAudit({ context: input.context, requestId: input.requestId, action: 'marketplace.object.comment_added', objectType: input.objectType, objectId: input.objectId, result: 'success', severity: 'info', source: 'ultra-delivery-01-master-backoffice' })
  return data as ObjectComment
}

export async function listExecutiveBriefs(): Promise<ExecutiveBrief[]> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase.from('angelcare_marketplace_executive_briefs').select('*').order('created_at', { ascending: false }).limit(100)
  if (error) throw fail('charger les briefs exécutifs', error)
  return (data || []) as ExecutiveBrief[]
}
