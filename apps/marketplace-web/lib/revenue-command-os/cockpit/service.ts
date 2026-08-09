import { cockpitConfig } from './config'
import { cockpitHash, cockpitStableId, redactCockpitPayload } from './crypto'
import { buildCockpitReadModel } from './read-model'
import {
  findInterventionByIdempotency,
  loadCockpitException,
  loadCockpitSources,
  saveAcknowledgement,
  saveCockpitSnapshot,
  saveCockpitView,
  saveExecutiveBrief,
  saveIntervention,
  saveWatchlist,
  updateCockpitException,
  upsertCockpitException,
  writeCockpitAudit,
} from './repository'
import type {
  AcknowledgeInput,
  CockpitDashboard,
  CockpitIntervention,
  CockpitRoleView,
  CockpitWatchlist,
  InterventionInput,
  ResolveExceptionInput,
} from './types'

interface CacheEntry { expiresAt: number; dashboard: CockpitDashboard }
const dashboardCache = new Map<string, CacheEntry>()

export async function cockpitDashboard(tenantId: string, roleView: CockpitRoleView, forceRefresh = false): Promise<CockpitDashboard> {
  const key = `${tenantId}:${roleView}`
  const cached = dashboardCache.get(key)
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) return cached.dashboard

  const sources = await loadCockpitSources(tenantId)
  const dashboard = await buildCockpitReadModel(tenantId, roleView, sources)
  dashboardCache.set(key, { expiresAt: Date.now() + cockpitConfig().refreshSeconds * 1000, dashboard })

  await Promise.allSettled([
    ...dashboard.exceptions.map((exception) => upsertCockpitException(tenantId, exception)),
    saveCockpitSnapshot({ tenantId, roleView, sourceHash: cockpitHash(sourceFingerprint(dashboard)), payload: redactCockpitPayload(dashboard as unknown as Record<string, unknown>), generatedAt: dashboard.generatedAt }),
  ])
  return dashboard
}

export async function acknowledgeException(input: AcknowledgeInput): Promise<{ exception: Awaited<ReturnType<typeof loadCockpitException>>; acknowledged: true }> {
  const exception = await loadCockpitException(input.tenantId, input.exceptionId)
  if (exception.status === 'resolved' || exception.status === 'dismissed') return { exception, acknowledged: true }
  const updated = { ...exception, status: 'acknowledged' as const, acknowledgedAt: new Date().toISOString() }
  await saveAcknowledgement({ tenantId: input.tenantId, exceptionId: input.exceptionId, actorId: input.actor.id, note: input.note, idempotencyKey: input.idempotencyKey })
  await updateCockpitException(input.tenantId, updated)
  await writeCockpitAudit({ tenantId: input.tenantId, actorId: input.actor.id, action: 'cockpit.exception.acknowledged', sourceZone: exception.sourceZone, sourceObjectId: exception.id, idempotencyKey: input.idempotencyKey, payload: { note: input.note, previousStatus: exception.status, newStatus: updated.status } })
  invalidateTenant(input.tenantId)
  return { exception: updated, acknowledged: true }
}

export async function createIntervention(input: InterventionInput): Promise<{ intervention: CockpitIntervention; reusedExisting: boolean }> {
  const existing = await findInterventionByIdempotency(input.tenantId, input.idempotencyKey)
  if (existing) return { intervention: existing, reusedExisting: true }
  const exception = await loadCockpitException(input.tenantId, input.exceptionId)
  const now = new Date().toISOString()
  const intervention: CockpitIntervention = {
    id: cockpitStableId('cockpit-intervention', input.tenantId, input.exceptionId, input.idempotencyKey),
    tenantId: input.tenantId,
    exceptionId: input.exceptionId,
    status: input.assignedTo || input.assignedRole ? 'assigned' : 'open',
    actionType: input.actionType,
    reason: input.reason,
    assignedTo: input.assignedTo,
    assignedRole: input.assignedRole,
    deadline: input.deadline,
    evidence: input.evidence || [],
    sourceZone: exception.sourceZone,
    sourceObjectId: exception.sourceRecordId,
    createdBy: input.actor.id,
    createdAt: now,
    updatedAt: now,
  }
  await saveIntervention(intervention, input.idempotencyKey)
  const updatedException = { ...exception, status: intervention.status === 'assigned' ? 'assigned' as const : exception.status, ownerId: input.assignedTo || exception.ownerId, ownerLabel: input.assignedRole || exception.ownerLabel, dueAt: input.deadline || exception.dueAt }
  await updateCockpitException(input.tenantId, updatedException)
  await writeCockpitAudit({ tenantId: input.tenantId, actorId: input.actor.id, action: 'cockpit.intervention.created', sourceZone: exception.sourceZone, sourceObjectId: exception.id, idempotencyKey: input.idempotencyKey, payload: redactCockpitPayload(intervention as unknown as Record<string, unknown>) })
  invalidateTenant(input.tenantId)
  return { intervention, reusedExisting: false }
}

export async function resolveCockpitException(input: ResolveExceptionInput): Promise<{ exception: Awaited<ReturnType<typeof loadCockpitException>> }> {
  const exception = await loadCockpitException(input.tenantId, input.exceptionId)
  const updated = { ...exception, status: 'resolved' as const, resolvedAt: new Date().toISOString(), evidence: Array.from(new Set([...exception.evidence, ...input.evidence])) }
  await updateCockpitException(input.tenantId, updated)
  await writeCockpitAudit({ tenantId: input.tenantId, actorId: input.actor.id, action: 'cockpit.exception.resolved', sourceZone: exception.sourceZone, sourceObjectId: exception.id, idempotencyKey: input.idempotencyKey, payload: { resolution: input.resolution, evidence: input.evidence, previousStatus: exception.status, newStatus: 'resolved' } })
  invalidateTenant(input.tenantId)
  return { exception: updated }
}

export async function createCockpitView(input: { tenantId: string; actorId: string; name: string; roleView: CockpitRoleView; layout: Record<string, unknown>; filters: Record<string, unknown>; isDefault: boolean; idempotencyKey: string }): Promise<Record<string, unknown>> {
  const view = await saveCockpitView(input)
  await writeCockpitAudit({ tenantId: input.tenantId, actorId: input.actorId, action: 'cockpit.view.saved', idempotencyKey: input.idempotencyKey, payload: { name: input.name, roleView: input.roleView, isDefault: input.isDefault } })
  return view
}

export async function createWatchlist(input: { tenantId: string; actorId: string; name: string; objectTypes: string[]; objectIds: string[]; filters: Record<string, unknown>; idempotencyKey: string }): Promise<CockpitWatchlist> {
  const watchlist: CockpitWatchlist = {
    id: cockpitStableId('cockpit-watchlist', input.tenantId, input.actorId, input.idempotencyKey),
    name: input.name,
    objectTypes: input.objectTypes,
    objectIds: input.objectIds,
    filters: input.filters,
    createdBy: input.actorId,
    createdAt: new Date().toISOString(),
  }
  await saveWatchlist({ ...watchlist, tenantId: input.tenantId, idempotencyKey: input.idempotencyKey })
  await writeCockpitAudit({ tenantId: input.tenantId, actorId: input.actorId, action: 'cockpit.watchlist.created', idempotencyKey: input.idempotencyKey, payload: { watchlistId: watchlist.id, name: watchlist.name, objectCount: watchlist.objectIds.length } })
  return watchlist
}

export async function exportExecutiveBrief(input: { tenantId: string; actorId: string; roleView: CockpitRoleView; format: 'html' | 'json'; includeTimeline: boolean; includeEvidence: boolean }): Promise<{ contentType: string; body: string; filename: string }> {
  const dashboard = await cockpitDashboard(input.tenantId, input.roleView, true)
  const sourceHash = cockpitHash(sourceFingerprint(dashboard))
  await Promise.allSettled([
    saveExecutiveBrief(input.tenantId, dashboard.executiveBrief, sourceHash, input.actorId),
    writeCockpitAudit({ tenantId: input.tenantId, actorId: input.actorId, action: 'cockpit.brief.exported', payload: { format: input.format, briefId: dashboard.executiveBrief.id, sourceHash } }),
  ])
  if (input.format === 'json') return { contentType: 'application/json; charset=utf-8', body: JSON.stringify({ brief: dashboard.executiveBrief, timeline: input.includeTimeline ? dashboard.timeline : undefined }, null, 2), filename: `revenue-command-brief-${new Date().toISOString().slice(0, 10)}.json` }
  return { contentType: 'text/html; charset=utf-8', body: executiveBriefHtml(dashboard, input.includeTimeline, input.includeEvidence), filename: `revenue-command-brief-${new Date().toISOString().slice(0, 10)}.html` }
}

function sourceFingerprint(dashboard: CockpitDashboard): Record<string, unknown> {
  return {
    objective: dashboard.objective ? { id: dashboard.objective.id, version: dashboard.objective.version, forecastRevenue: dashboard.objective.forecastRevenue } : null,
    signals: dashboard.signals.map((item) => [item.id, item.status, item.priorityScore]),
    strategies: dashboard.strategies.map((item) => [item.id, item.version, item.status]),
    programs: dashboard.programs.map((item) => [item.id, item.status, item.progressPercent]),
    execution: dashboard.execution,
    exceptions: dashboard.exceptions.map((item) => [item.id, item.status, item.priority]),
    approvals: dashboard.approvals.map((item) => [item.id, item.status]),
  }
}

function invalidateTenant(tenantId: string): void {
  for (const key of dashboardCache.keys()) if (key.startsWith(`${tenantId}:`)) dashboardCache.delete(key)
}

function executiveBriefHtml(dashboard: CockpitDashboard, includeTimeline: boolean, includeEvidence: boolean): string {
  const brief = dashboard.executiveBrief
  const list = (items: string[]) => items.length ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '<p>Aucun élément.</p>'
  const timeline = includeTimeline ? `<section><h2>Chronologie récente</h2>${dashboard.timeline.slice(0, 20).map((event) => `<article><strong>${escapeHtml(event.title)}</strong><span>${escapeHtml(new Date(event.occurredAt).toLocaleString('fr-FR'))}</span><p>${escapeHtml(event.summary)}</p></article>`).join('')}</section>` : ''
  const evidence = includeEvidence ? `<section><h2>Sources et traçabilité</h2>${brief.sourceReferences.map((reference) => `<p>${escapeHtml(reference.type)} · ${escapeHtml(reference.label)} · ${escapeHtml(reference.id)}</p>`).join('')}</section>` : ''
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(brief.title)}</title><style>@page{size:A4;margin:16mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#0f172a;margin:0;background:#fff}header{border-bottom:4px solid #0f172a;padding-bottom:18px;margin-bottom:24px}.kicker{color:#1d4ed8;font-size:11px;font-weight:800;letter-spacing:.15em;text-transform:uppercase}h1{font-size:28px;margin:8px 0}h2{font-size:15px;text-transform:uppercase;letter-spacing:.08em;margin-top:26px;border-bottom:1px solid #cbd5e1;padding-bottom:7px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.card{border:1px solid #cbd5e1;border-radius:14px;padding:14px;background:#f8fafc}.decision{border:2px solid #f59e0b;background:#fffbeb;border-radius:16px;padding:18px;margin:22px 0}.meta{font-size:11px;color:#64748b}.risk{color:#b91c1c}ul{padding-left:20px}li{margin:7px 0;line-height:1.45}article{border-left:3px solid #2563eb;padding:0 0 1px 12px;margin:12px 0}article span{float:right;color:#64748b;font-size:10px}p{line-height:1.55}</style></head><body><header><div class="kicker">ANGELCARE · REVENUE COMMAND OS · MZ15</div><h1>${escapeHtml(brief.title)}</h1><p class="meta">Version ${brief.version} · ${escapeHtml(new Date(brief.generatedAt).toLocaleString('fr-FR'))} · ${escapeHtml(brief.provider)}</p></header><section class="grid"><div class="card"><h2>Objectif</h2><p>${escapeHtml(brief.objectiveStatement)}</p></div><div class="card"><h2>Position</h2><p>${escapeHtml(brief.currentPosition)}</p></div><div class="card"><h2>Prévision</h2><p>${escapeHtml(brief.forecastStatement)}</p></div><div class="card"><h2>Système</h2><p>Mode ${escapeHtml(dashboard.executionMode)} · ${dashboard.counts.activePrograms} programme(s) · ${dashboard.counts.approvalsRequired} approbation(s).</p></div></section><section><h2>Changements matériels</h2>${list(brief.materialChanges)}</section><section><h2>Risques critiques</h2><div class="risk">${list(brief.criticalRisks)}</div></section><section><h2>Approbations requises</h2>${list(brief.approvalsRequired)}</section><div class="decision"><h2>Décision immédiate</h2><p>${escapeHtml(brief.immediateDecision)}</p><strong>Action recommandée</strong><p>${escapeHtml(brief.recommendedExecutiveAction)}</p></div><section><h2>Prochains jalons</h2>${list(brief.nextMilestones)}</section>${timeline}${evidence}<footer class="meta">Document gouverné généré par Revenue Command OS. Les prévisions restent des simulations traçables, non des garanties.</footer></body></html>`
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] || character))
}
