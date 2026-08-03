import { NextResponse } from 'next/server'
import { apiError, actorId, productExperienceClient, requireProductExperienceActor, safeText, tenantId } from '@/lib/service-design-product-experience/server'
import type { ProductExperienceDeletePreview, ProductExperienceEntityType } from '@/types/service-design-product-experience'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Client = Awaited<ReturnType<typeof productExperienceClient>>
type Actor = Awaited<ReturnType<typeof requireProductExperienceActor>>
type Row = Record<string, unknown>

const owned: Record<string, string> = {
  workbench_draft: 'hsd_px_workbench_drafts', timeline_day: 'hsd_px_timeline_days', timeline_block: 'hsd_px_timeline_blocks',
  scenario_composition: 'hsd_px_scenario_compositions', favorite: 'hsd_px_favorites', saved_view: 'hsd_px_saved_views',
  annotation: 'hsd_px_annotations', document_entry: 'hsd_px_document_registry',
}

async function findIn(client: Client, tables: string[], id: string) {
  for (const table of tables) {
    const result = await client.from(table).select('*').eq('id', id).limit(1).maybeSingle()
    if (!result.error && result.data) return { table, row: result.data as Row }
  }
  return null
}

async function countDependency(client: Client, table: string, key: string, id: string) {
  const result = await client.from(table).select('id', { count: 'exact', head: true }).eq(key, id)
  return result.error ? 0 : result.count || 0
}

async function preview(client: Client, actor: Actor, entityType: ProductExperienceEntityType, entityId: string): Promise<ProductExperienceDeletePreview> {
  const table = owned[entityType]
  if (table) {
    const result = await client.from(table).select('*').eq('id', entityId).eq('tenant_id', tenantId(actor)).maybeSingle()
    if (result.error) throw result.error
    const row = result.data as Row | null
    return {
      entityType, entityId, label: String(row?.title || row?.name || row?.label || entityId), canDelete: Boolean(row),
      dependencies: entityType === 'workbench_draft' && row ? [{ type: 'timeline', count: 0, detail: 'Les journées, blocs et historique de ce workbench seront supprimés par cascade.' }] : [],
      consequences: ['Suppression physique et immédiate du registre Service Design sélectionné.'],
      reason: row ? undefined : 'Enregistrement introuvable.',
    }
  }

  if (entityType === 'factory_scenario') {
    const found = await findIn(client, ['hsd_factory_scenarios', 'hsd_planning_scenarios'], entityId)
    if (!found) return { entityType, entityId, label: entityId, canDelete: false, dependencies: [], consequences: [], reason: 'Scénario introuvable.' }
    let links = 0
    for (const [depTable, key] of [['hsd_factory_sellables', 'source_scenario_id'], ['hsd_factory_sellables', 'scenario_id'], ['hsd_handoff_requests', 'scenario_id']] as const) links += await countDependency(client, depTable, key, entityId)
    return {
      entityType, entityId, label: String(found.row.name || found.row.title || entityId), canDelete: links === 0,
      dependencies: links ? [{ type: 'published_or_handoff', count: links, detail: 'Le scénario est lié à un sellable ou handoff. Sa suppression corromprait un historique utilisé.' }] : [],
      consequences: ['Le scénario généré sera supprimé définitivement.'], reason: links ? 'Dépendances opérationnelles détectées.' : undefined,
    }
  }

  if (entityType === 'factory_request') {
    const found = await findIn(client, ['hsd_factory_requests', 'hsd_planning_requests'], entityId)
    if (!found) return { entityType, entityId, label: entityId, canDelete: false, dependencies: [], consequences: [], reason: 'Demande introuvable.' }
    const count = await countDependency(client, 'hsd_factory_scenarios', 'request_id', entityId)
    return {
      entityType, entityId, label: String(found.row.title || found.row.code || entityId), canDelete: true,
      dependencies: [{ type: 'factory_scenarios', count, detail: 'Les alternatives non liées seront supprimées avec la demande.' }],
      consequences: ['Suppression physique de la demande et de ses alternatives non publiées.'],
    }
  }

  if (entityType === 'unpublished_sellable') {
    const found = await findIn(client, ['hsd_factory_sellables', 'hsd_sellables', 'hsd_sellable_versions'], entityId)
    if (!found) return { entityType, entityId, label: entityId, canDelete: false, dependencies: [], consequences: [], reason: 'Sellable introuvable.' }
    const status = String(found.row.status || found.row.publication_status || found.row.state || 'draft').toLowerCase()
    const published = ['published', 'active', 'released', 'live'].includes(status)
    let handoffs = 0
    for (const key of ['sellable_id', 'sellable_version_id', 'service_product_id']) handoffs += await countDependency(client, 'hsd_handoff_requests', key, entityId)
    const canDelete = !published && handoffs === 0
    return {
      entityType, entityId, label: String(found.row.name || found.row.title || found.row.commercial_name || entityId), canDelete,
      dependencies: handoffs ? [{ type: 'carelink_handoff', count: handoffs, detail: 'Ce sellable est déjà référencé par une préparation CARELINK.' }] : [],
      consequences: ['Le sellable non publié sera supprimé physiquement. Les snapshots CARELINK existants restent intacts.'],
      reason: published ? 'Le sellable est publié. Dépubliez-le d’abord depuis la Vitrine.' : handoffs ? 'Une dépendance CARELINK existe.' : undefined,
    }
  }

  return { entityType, entityId, label: entityId, canDelete: false, dependencies: [], consequences: [], reason: 'Type de suppression non pris en charge.' }
}

export async function POST(request: Request) {
  try {
    const actor = await requireProductExperienceActor()
    const client = await productExperienceClient()
    const body = await request.json()
    const entityType = safeText(body.entityType, 80) as ProductExperienceEntityType
    const entityId = safeText(body.entityId, 180)
    const resultPreview = await preview(client, actor, entityType, entityId)
    if (body.action !== 'execute') return NextResponse.json({ ok: true, data: resultPreview })
    if (!resultPreview.canDelete) return NextResponse.json({ ok: false, error: resultPreview.reason || 'Suppression impossible.', data: resultPreview }, { status: 409 })

    const table = owned[entityType]
    if (table) {
      let query = client.from(table).delete().eq('id', entityId).eq('tenant_id', tenantId(actor))
      if (['workbench_draft', 'favorite', 'saved_view', 'annotation', 'document_entry', 'scenario_composition'].includes(entityType)) query = query.eq('user_id', actorId(actor))
      const removed = await query.select('id')
      if (removed.error) throw removed.error
      return NextResponse.json({ ok: true, data: { deleted: removed.data?.length || 0 } })
    }

    if (entityType === 'factory_scenario') {
      const found = await findIn(client, ['hsd_factory_scenarios', 'hsd_planning_scenarios'], entityId)
      if (!found) throw Object.assign(new Error('Scénario introuvable.'), { status: 404 })
      const removed = await client.from(found.table).delete().eq('id', entityId).select('id')
      if (removed.error) throw removed.error
      return NextResponse.json({ ok: true, data: { deleted: removed.data?.length || 0 } })
    }

    if (entityType === 'factory_request') {
      const found = await findIn(client, ['hsd_factory_requests', 'hsd_planning_requests'], entityId)
      if (!found) throw Object.assign(new Error('Demande introuvable.'), { status: 404 })
      if (found.table === 'hsd_factory_requests') {
        const scenarios = await client.from('hsd_factory_scenarios').delete().eq('request_id', entityId)
        if (scenarios.error) throw scenarios.error
      }
      const removed = await client.from(found.table).delete().eq('id', entityId).select('id')
      if (removed.error) throw removed.error
      return NextResponse.json({ ok: true, data: { deleted: removed.data?.length || 0 } })
    }

    if (entityType === 'unpublished_sellable') {
      const found = await findIn(client, ['hsd_factory_sellables', 'hsd_sellables', 'hsd_sellable_versions'], entityId)
      if (!found) throw Object.assign(new Error('Sellable introuvable.'), { status: 404 })
      const removed = await client.from(found.table).delete().eq('id', entityId).select('id')
      if (removed.error) throw removed.error
      return NextResponse.json({ ok: true, data: { deleted: removed.data?.length || 0 } })
    }

    throw Object.assign(new Error('Suppression non prise en charge.'), { status: 400 })
  } catch (error) {
    const e = apiError(error)
    return NextResponse.json({ ok: false, error: e.message }, { status: e.status })
  }
}
