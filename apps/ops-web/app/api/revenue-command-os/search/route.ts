import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { resolveRevenueOsActor } from '@/lib/revenue-command-os/access'
import { createServiceClient } from '@/lib/supabase/server'
import { readRevenueOsFoundation } from '@/lib/revenue-command-os/repository'
import { readRevenueKnowledgeMemory } from '@/lib/revenue-command-os/knowledge-memory/repository'
import { readRevenueSignalFabric } from '@/lib/revenue-command-os/signal-fabric/repository'
import { readRevenueCommandKernel } from '@/lib/revenue-command-os/command-kernel/repository'
import { buildRevenueCommandKernelSearchIndex } from '@/lib/revenue-command-os/command-kernel/search'
import { buildRevenueKnowledgeSearchIndex, buildRevenueOsSearchIndex, buildRevenueSignalSearchIndex, searchRevenueOs } from '@/lib/revenue-command-os/search'
import type { RevenueOsSearchResult } from '@/lib/revenue-command-os/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function object(value: unknown): Record<string, any> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {} }
function text(value: unknown, fallback = '') { return typeof value === 'string' ? value : value == null ? fallback : String(value) }
function title(row: any) { const payload = object(row.payload); const metadata = object(row.metadata); return text(row.title || payload.title || metadata.title || row.code, 'Dossier Revenue OS') }

async function operationalIndex(): Promise<RevenueOsSearchResult[]> {
  const actor = await resolveRevenueOsActor()
  const client = await createServiceClient() as any
  const [strategies, programs, missions, tasks, exceptions, resources, schedules] = await Promise.all([
    client.from('revenue_os_strategies').select('*').eq('tenant_id', actor.tenantId).order('updated_at', { ascending: false }).limit(500),
    client.from('revenue_os_programs').select('*').eq('tenant_id', actor.tenantId).order('updated_at', { ascending: false }).limit(500),
    client.from('revenue_os_missions').select('*').eq('tenant_id', actor.tenantId).order('updated_at', { ascending: false }).limit(500),
    client.from('revenue_os_mission_tasks').select('*').eq('tenant_id', actor.tenantId).order('updated_at', { ascending: false }).limit(500),
    client.from('revenue_os_operational_exceptions').select('*').eq('tenant_id', actor.tenantId).order('updated_at', { ascending: false }).limit(500),
    client.from('revenue_os_registry_entries').select('*').eq('tenant_id', actor.tenantUuid).eq('registry', 'gemini-resource').order('updated_at', { ascending: false }).limit(500),
    client.from('revenue_os_command_schedules').select('*').eq('tenant_id', actor.tenantUuid).order('updated_at', { ascending: false }).limit(500),
  ])
  const safe = (result: any) => result.error ? [] : result.data || []
  return [
    ...safe(strategies).map((row: any): RevenueOsSearchResult => ({ id: `strategy:${row.id}`, type: 'strategy', title: title(row), subtitle: `${row.status} · ${text(object(row.payload).ownerLabel, 'Sans propriétaire')}`, href: `/revenue-command-os/strategy-engine?entity=${row.id}`, badge: row.status, keywords: [row.id, row.objective_id || '', row.strategy_id || '', title(row), JSON.stringify(row.payload || {})] })),
    ...safe(programs).map((row: any): RevenueOsSearchResult => ({ id: `program:${row.id}`, type: 'program', title: title(row), subtitle: `${row.status} · ${text(object(row.payload).ownerLabel, 'Sans propriétaire')}`, href: `/revenue-command-os/active-programs?entity=${row.id}`, badge: row.status, keywords: [row.code, title(row), JSON.stringify(row.payload || {})] })),
    ...safe(missions).map((row: any): RevenueOsSearchResult => ({ id: `mission:${row.id}`, type: 'mission', title: title(row), subtitle: `${row.status} · ${text(object(row.payload).ownerLabel, 'Sans propriétaire')}`, href: `/revenue-command-os/compiled-missions?entity=${row.id}`, badge: row.status, keywords: [row.code, title(row), JSON.stringify(row.payload || {})] })),
    ...safe(tasks).map((row: any): RevenueOsSearchResult => ({ id: `task:${row.id}`, type: 'task', title: title(row), subtitle: `${row.status} · ${text(object(row.payload).ownerLabel, 'Sans propriétaire')}`, href: `/revenue-command-os/compiled-missions?task=${row.id}`, badge: row.status, keywords: [row.code, title(row), JSON.stringify(row.payload || {})] })),
    ...safe(exceptions).map((row: any): RevenueOsSearchResult => ({ id: `exception:${row.id}`, type: 'exception', title: title(row), subtitle: `${row.severity} · ${row.status} · ${Number(row.revenue_impact_dh || 0)} Dh`, href: `/revenue-command-os/exceptions?entity=${row.id}`, badge: row.status, keywords: [row.code, title(row), row.owner_id || '', JSON.stringify(row.payload || {})] })),
    ...safe(resources).map((row: any): RevenueOsSearchResult => ({ id: `ai-resource:${row.id}`, type: 'ai-resource', title: text(row.content?.name, row.purpose), subtitle: `${row.code}@${row.version} · ${text(row.content?.resourceType, 'resource')}`, href: '/revenue-command-os/gemini-resources', badge: row.status, keywords: [row.code, row.purpose, JSON.stringify(row.content || {})] })),
    ...safe(schedules).map((row: any): RevenueOsSearchResult => ({ id: `command-schedule:${row.id}`, type: 'command-schedule', title: row.label, subtitle: `${row.command_code} · ${row.cadence} · ${row.timezone}`, href: '/revenue-command-os/command-kernel/schedules', badge: row.enabled ? 'active' : 'paused', keywords: [row.code, row.command_code, row.label, row.owner_role, row.cadence] })),
  ]
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'Authentification requise.' } }, { status: 401 })
  const query = request.nextUrl.searchParams.get('q') || ''
  const [{ bootstrap }, knowledgeResult, signalResult, kernelResult, operational] = await Promise.all([
    readRevenueOsFoundation(),
    readRevenueKnowledgeMemory(),
    readRevenueSignalFabric(),
    readRevenueCommandKernel(),
    operationalIndex(),
  ])
  const index = [
    ...buildRevenueOsSearchIndex(bootstrap),
    ...buildRevenueKnowledgeSearchIndex(knowledgeResult.bootstrap),
    ...buildRevenueSignalSearchIndex(signalResult.bootstrap),
    ...buildRevenueCommandKernelSearchIndex(kernelResult.bootstrap),
    ...operational,
  ]
  const data = searchRevenueOs(index, query, 24)
  return NextResponse.json({ ok: true, data, query }, { headers: { 'Cache-Control': 'no-store' } })
}
