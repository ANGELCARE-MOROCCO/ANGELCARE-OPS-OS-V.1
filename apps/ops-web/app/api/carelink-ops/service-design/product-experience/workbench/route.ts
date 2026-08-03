import { NextResponse } from 'next/server'
import { apiError, actorId, insertRecent, productExperienceClient, requireProductExperienceActor, safeJson, safeText, tenantId } from '@/lib/service-design-product-experience/server'
import { initializeDraftFromScenario, loadDraft, upsertDraft } from '@/lib/service-design-product-experience/repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const actor = await requireProductExperienceActor(); const client = await productExperienceClient(); const url = new URL(request.url)
    const scenarioId = safeText(url.searchParams.get('scenarioId'), 180); const workspaceKey = safeText(url.searchParams.get('workspaceKey'), 240); const draftId = safeText(url.searchParams.get('draftId'), 180)
    let resolvedWorkspaceKey = workspaceKey
    if (!resolvedWorkspaceKey && draftId) {
      const found = await client.from('hsd_px_workbench_drafts').select('workspace_key').eq('id', draftId).eq('tenant_id', tenantId(actor)).eq('user_id', actorId(actor)).maybeSingle()
      if (found.error) throw found.error
      resolvedWorkspaceKey = found.data ? String(found.data.workspace_key) : ''
    }
    const draft = scenarioId ? await initializeDraftFromScenario(client, actor, scenarioId) : resolvedWorkspaceKey ? await loadDraft(client, actor, resolvedWorkspaceKey) : null
    if (!draft) return NextResponse.json({ ok: false, error: 'Workbench introuvable.' }, { status: 404 })
    await insertRecent(client, actor, { entityType: 'workbench_draft', entityId: draft.id, label: draft.title, href: `/carelink-ops/service-design/workbench/${draft.sourceId || draft.id}`, metadata: { workspaceKey: draft.workspaceKey } })
    return NextResponse.json({ ok: true, data: draft })
  } catch (error) { const e = apiError(error); return NextResponse.json({ ok: false, error: e.message }, { status: e.status }) }
}

export async function POST(request: Request) {
  try {
    const actor = await requireProductExperienceActor()
    const client = await productExperienceClient()
    const body = await request.json()
    if (body.action === 'duplicate') {
      const sourceId = safeText(body.sourceDraftId, 180)
      const source = await client.from('hsd_px_workbench_drafts').select('*').eq('id', sourceId).eq('tenant_id', tenantId(actor)).eq('user_id', actorId(actor)).single()
      if (source.error) throw source.error
      const workspaceKey = `variant:${crypto.randomUUID()}`
      const row = await upsertDraft(client, actor, { workspaceKey, sourceType: String(source.data.source_type || 'variant'), sourceId: source.data.source_id ? String(source.data.source_id) : sourceId, title: safeText(body.title || `${source.data.title} · variante`, 260), state: safeJson(source.data.state), isDirty: false })
      const days = await client.from('hsd_px_timeline_days').select('*').eq('draft_id', sourceId).order('sort_order')
      if (days.error) throw days.error
      for (const day of days.data || []) {
        const created = await client.from('hsd_px_timeline_days').insert({ tenant_id: tenantId(actor), user_id: actorId(actor), draft_id: row.id, source_day_id: day.source_day_id, service_date: day.service_date, label: day.label, start_minute: day.start_minute, end_minute: day.end_minute, sort_order: day.sort_order, metadata: day.metadata }).select('*').single()
        if (created.error) throw created.error
        const blocks = await client.from('hsd_px_timeline_blocks').select('*').eq('day_id', day.id).order('start_minute')
        if (blocks.error) throw blocks.error
        if (blocks.data?.length) {
          const inserted = await client.from('hsd_px_timeline_blocks').insert(blocks.data.map((block: Record<string, unknown>) => ({ tenant_id: tenantId(actor), user_id: actorId(actor), day_id: created.data.id, source_activity_id: block.source_activity_id, source_code: block.source_code, block_type: block.block_type, label: block.label, objective: block.objective, start_minute: block.start_minute, duration_minutes: block.duration_minutes, locked: block.locked, sort_order: block.sort_order, metadata: block.metadata })))
          if (inserted.error) throw inserted.error
        }
      }
      return NextResponse.json({ ok: true, data: { draft: row, workspaceKey } })
    }
    const row = await upsertDraft(client, actor, { workspaceKey: safeText(body.workspaceKey, 240), sourceType: safeText(body.sourceType, 80), sourceId: body.sourceId ? safeText(body.sourceId, 180) : null, title: safeText(body.title, 260), state: safeJson(body.state), isDirty: Boolean(body.isDirty) })
    return NextResponse.json({ ok: true, data: row })
  } catch (error) { const e = apiError(error); return NextResponse.json({ ok: false, error: e.message }, { status: e.status }) }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireProductExperienceActor(); const client = await productExperienceClient(); const body = await request.json(); const id = safeText(body.id, 180)
    if (!id) return NextResponse.json({ ok: false, error: 'ID du workbench requis.' }, { status: 400 })
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.title !== undefined) patch.title = safeText(body.title, 260)
    if (body.state !== undefined) patch.state = safeJson(body.state)
    if (body.isDirty !== undefined) patch.is_dirty = Boolean(body.isDirty)
    if (body.revision !== undefined) patch.revision = Math.max(1, Number(body.revision || 1))
    const result = await client.from('hsd_px_workbench_drafts').update(patch).eq('id', id).eq('tenant_id', tenantId(actor)).eq('user_id', actorId(actor)).select('*').single()
    if (result.error) throw result.error
    return NextResponse.json({ ok: true, data: result.data })
  } catch (error) { const e = apiError(error); return NextResponse.json({ ok: false, error: e.message }, { status: e.status }) }
}

export async function DELETE(request: Request) {
  try {
    const actor = await requireProductExperienceActor(); const client = await productExperienceClient(); const url = new URL(request.url); const id = safeText(url.searchParams.get('id'), 180)
    if (!id) return NextResponse.json({ ok: false, error: 'ID requis.' }, { status: 400 })
    const result = await client.from('hsd_px_workbench_drafts').delete().eq('id', id).eq('tenant_id', tenantId(actor)).eq('user_id', actorId(actor)).select('id')
    if (result.error) throw result.error
    return NextResponse.json({ ok: true, data: { deleted: result.data?.length || 0 } })
  } catch (error) { const e = apiError(error); return NextResponse.json({ ok: false, error: e.message }, { status: e.status }) }
}
