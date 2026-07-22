import crypto from 'node:crypto'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { cockpitActorOf, cockpitError, cockpitRights, cockpitTenantOf } from './api-access'
import { acknowledgeSchema, cockpitQuerySchema, exportBriefSchema, interventionSchema, resolveExceptionSchema, saveViewSchema, watchlistSchema } from './schemas'
import { acknowledgeException, cockpitDashboard, createCockpitView, createIntervention, createWatchlist, exportExecutiveBrief, resolveCockpitException } from './service'
import type { CockpitDashboard, CockpitRoleView } from './types'

export type CockpitSection = 'all' | 'brief' | 'objective' | 'signals' | 'strategies' | 'programs' | 'campaigns' | 'execution' | 'exceptions' | 'approvals' | 'learning' | 'timeline' | 'compiler' | 'council' | 'runs'

export async function handleCockpitGet(request: NextRequest, section: CockpitSection = 'all'): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user) return cockpitError('UNAUTHENTICATED', 'Authentification requise.', 401)
  const rights = cockpitRights(user)
  if (!rights.view) return cockpitError('FORBIDDEN', 'Permission cockpit requise.', 403)
  const parsed = cockpitQuerySchema.safeParse({ view: request.nextUrl.searchParams.get('view') || undefined, refresh: request.nextUrl.searchParams.get('refresh') || undefined })
  if (!parsed.success) return cockpitError('INVALID_QUERY', parsed.error.issues.map((issue: { message: string }) => issue.message).join('; '))
  const tenantId = cockpitTenantOf(user)
  const actor = cockpitActorOf(user, tenantId, parsed.data.view)
  if (!roleViewAllowed(actor.roleView, rights)) return cockpitError('ROLE_VIEW_FORBIDDEN', 'Cette vue métier n’est pas autorisée.', 403)
  try {
    const dashboard = await cockpitDashboard(tenantId, actor.roleView, parsed.data.refresh)
    return NextResponse.json({ ok: true, data: selectSection(dashboard, section), meta: { generatedAt: dashboard.generatedAt, roleView: dashboard.roleView, executionMode: dashboard.executionMode } })
  } catch (error) {
    return cockpitError('COCKPIT_LOAD_FAILED', error instanceof Error ? error.message : String(error), 500)
  }
}

export async function handleCockpitAction(request: NextRequest, action: 'acknowledge' | 'intervene' | 'resolve-exception' | 'save-view' | 'create-watchlist' | 'export-brief'): Promise<Response> {
  const user = await getCurrentUser()
  if (!user) return cockpitError('UNAUTHENTICATED', 'Authentification requise.', 401)
  const rights = cockpitRights(user)
  const raw = await request.json().catch(() => ({}))
  const tenantId = cockpitTenantOf(user, raw)
  const actor = cockpitActorOf(user, tenantId, raw.roleView)
  const idempotencyKey = request.headers.get('idempotency-key') || raw.idempotencyKey || crypto.randomUUID()

  try {
    if (action === 'acknowledge') {
      if (!rights.intervene) return cockpitError('FORBIDDEN', 'Permission d’intervention requise.', 403)
      const parsed = acknowledgeSchema.safeParse(raw)
      if (!parsed.success) return cockpitError('INVALID_INPUT', parsed.error.issues.map((issue: { message: string }) => issue.message).join('; '))
      return NextResponse.json({ ok: true, data: await acknowledgeException({ tenantId, actor, exceptionId: parsed.data.exceptionId, note: parsed.data.note, idempotencyKey }) })
    }
    if (action === 'intervene') {
      if (!rights.intervene) return cockpitError('FORBIDDEN', 'Permission d’intervention requise.', 403)
      const parsed = interventionSchema.safeParse(raw)
      if (!parsed.success) return cockpitError('INVALID_INPUT', parsed.error.issues.map((issue: { message: string }) => issue.message).join('; '))
      if ((parsed.data.assignedTo || parsed.data.assignedRole) && !rights.assignIntervention) return cockpitError('ASSIGNMENT_FORBIDDEN', 'Permission d’affectation requise.', 403)
      return NextResponse.json({ ok: true, data: await createIntervention({ tenantId, actor, exceptionId: parsed.data.exceptionId, actionType: parsed.data.actionType, reason: parsed.data.reason, assignedTo: parsed.data.assignedTo, assignedRole: parsed.data.assignedRole, deadline: parsed.data.deadline, evidence: parsed.data.evidence, idempotencyKey }) })
    }
    if (action === 'resolve-exception') {
      if (!rights.resolveException) return cockpitError('FORBIDDEN', 'Permission de résolution requise.', 403)
      const parsed = resolveExceptionSchema.safeParse(raw)
      if (!parsed.success) return cockpitError('INVALID_INPUT', parsed.error.issues.map((issue: { message: string }) => issue.message).join('; '))
      return NextResponse.json({ ok: true, data: await resolveCockpitException({ tenantId, actor, exceptionId: parsed.data.exceptionId, resolution: parsed.data.resolution, evidence: parsed.data.evidence, idempotencyKey }) })
    }
    if (action === 'save-view') {
      if (!rights.manageViews) return cockpitError('FORBIDDEN', 'Permission de personnalisation requise.', 403)
      const parsed = saveViewSchema.safeParse(raw)
      if (!parsed.success) return cockpitError('INVALID_INPUT', parsed.error.issues.map((issue: { message: string }) => issue.message).join('; '))
      return NextResponse.json({ ok: true, data: await createCockpitView({ tenantId, actorId: actor.id, name: parsed.data.name, roleView: parsed.data.roleView, layout: parsed.data.layout, filters: parsed.data.filters, isDefault: parsed.data.isDefault, idempotencyKey }) })
    }
    if (action === 'create-watchlist') {
      if (!rights.manageViews) return cockpitError('FORBIDDEN', 'Permission watchlist requise.', 403)
      const parsed = watchlistSchema.safeParse(raw)
      if (!parsed.success) return cockpitError('INVALID_INPUT', parsed.error.issues.map((issue: { message: string }) => issue.message).join('; '))
      return NextResponse.json({ ok: true, data: await createWatchlist({ tenantId, actorId: actor.id, name: parsed.data.name, objectTypes: parsed.data.objectTypes, objectIds: parsed.data.objectIds, filters: parsed.data.filters, idempotencyKey }) })
    }
    if (!rights.export) return cockpitError('FORBIDDEN', 'Permission d’export requise.', 403)
    const parsed = exportBriefSchema.safeParse(raw)
    if (!parsed.success) return cockpitError('INVALID_INPUT', parsed.error.issues.map((issue: { message: string }) => issue.message).join('; '))
    const exported = await exportExecutiveBrief({ tenantId, actorId: actor.id, roleView: actor.roleView, format: parsed.data.format, includeTimeline: parsed.data.includeTimeline, includeEvidence: parsed.data.includeEvidence })
    return new Response(exported.body, { status: 200, headers: { 'content-type': exported.contentType, 'content-disposition': `attachment; filename="${exported.filename}"`, 'cache-control': 'no-store' } })
  } catch (error) {
    return cockpitError('COCKPIT_ACTION_FAILED', error instanceof Error ? error.message : String(error), 500)
  }
}

function selectSection(dashboard: CockpitDashboard, section: CockpitSection): unknown {
  if (section === 'brief') return dashboard.executiveBrief
  if (section === 'objective') return dashboard.objective
  if (section === 'signals') return dashboard.signals
  if (section === 'strategies') return dashboard.strategies
  if (section === 'council') return dashboard.council
  if (section === 'programs') return dashboard.programs
  if (section === 'campaigns') return dashboard.waves
  if (section === 'compiler') return dashboard.compiler
  if (section === 'execution') return dashboard.execution
  if (section === 'exceptions') return dashboard.exceptions
  if (section === 'approvals') return dashboard.approvals
  if (section === 'learning') return { experiments: dashboard.experiments, learning: dashboard.learning }
  if (section === 'timeline') return dashboard.timeline
  if (section === 'runs') return dashboard.runs
  return dashboard
}

function roleViewAllowed(roleView: CockpitRoleView, rights: ReturnType<typeof cockpitRights>): boolean {
  if (rights.admin) return true
  if (roleView === 'executive') return rights.executiveView || rights.view
  if (roleView === 'commercial') return rights.commercialView || rights.view
  if (roleView === 'operations') return rights.operationsView || rights.view
  if (roleView === 'finance') return rights.financeView || rights.view
  return rights.view
}
