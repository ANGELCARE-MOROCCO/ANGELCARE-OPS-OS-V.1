import { NextResponse } from 'next/server'
import { apiError, actorId, productExperienceClient, requireProductExperienceActor, safeArray, safeJson, safeText, tenantId } from '@/lib/service-design-product-experience/server'
import { findScenario, persistTimelineDays, upsertDraft } from '@/lib/service-design-product-experience/repository'
import { timelineFromScenario } from '@/lib/service-design-product-experience/normalize'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const actor = await requireProductExperienceActor()
    const client = await productExperienceClient()
    const body = await request.json()
    const ids = safeArray(body.sourceScenarioIds).map(String).filter(Boolean).slice(0, 4)
    if (ids.length < 2) throw Object.assign(new Error('Sélectionnez au moins deux scénarios.'), { status: 400 })

    const scenarios = []
    for (const id of ids) {
      const found = await findScenario(client, id)
      if (!found) throw Object.assign(new Error(`Scénario introuvable: ${id}`), { status: 404 })
      scenarios.push(found.scenario)
    }

    const composition = {
      strategy: safeText(body.strategy || 'selected_best', 80),
      selections: safeJson(body.selections),
      scenarios,
      primaryScenarioId: scenarios[0].id,
    }
    const inserted = await client.from('hsd_px_scenario_compositions').insert({
      tenant_id: tenantId(actor),
      user_id: actorId(actor),
      request_id: body.requestId || null,
      title: safeText(body.title || 'Version combinée', 240),
      source_scenario_ids: ids,
      composition,
    }).select('*').single()
    if (inserted.error) throw inserted.error

    const workspaceKey = `composition:${inserted.data.id}`
    const row = await upsertDraft(client, actor, {
      workspaceKey,
      sourceType: 'scenario_composition',
      sourceId: String(inserted.data.id),
      title: String(inserted.data.title),
      state: {
        categoryCode: scenarios[0].categoryCode,
        universe: scenarios[0].universe,
        promise: scenarios[0].promise,
        sourceScenarioIds: ids,
        composition,
      },
    })
    await persistTimelineDays(client, actor, String(row.id), timelineFromScenario(scenarios[0], String(row.id)))
    return NextResponse.json({ ok: true, data: { composition: inserted.data, draft: row, workspaceKey } })
  } catch (error) {
    const e = apiError(error)
    return NextResponse.json({ ok: false, error: e.message }, { status: e.status })
  }
}
