import { createServiceClient } from '@/lib/supabase/server'
import { hasMarketplacePermission, requireMarketplaceWorkspaceApiContext } from '../auth/context'
import { MarketplaceError } from '../server/errors'

type Row = Record<string, unknown>
type TableResult = { data: unknown; error: { message: string } | null }
const text = (v: unknown) => String(v ?? '').trim()
const ADMIN_ACTIONS = new Set(['supplier.quality','document.review','media.review','supplier.assess','availability.verify'])
const READ_LIMIT = 180

function dependency(error: { message: string } | null, section: string) {
  if (error) throw new MarketplaceError('CONFIGURATION_ERROR', `Supplier Command 360: ${section} unavailable. Apply the additive SQL migration before using the workspace.`, { cause: error })
}
export async function supplierSnapshot() {
  const db = await createServiceClient()
  const tables: Array<[string, string, number]> = [
    ['suppliers','angelcare_marketplace_suppliers',250],
    ['profiles','ac_sc_supplier_profiles',250],
    ['documents','ac_sc_documents',180],
    ['media','ac_sc_offer_media',200],
    ['channels','ac_sc_channels',80],
    ['assortments','ac_sc_assortments',250],
    ['catalog','angelcare_marketplace_catalog_items',250],
    ['offers','angelcare_marketplace_supplier_offers',350],
    ['commercials','ac_sc_commercials',350],
    ['imports','ac_sc_import_batches',80],
    ['importRows','ac_sc_import_rows',250],
    ['journeys','angelcare_marketplace_journeys',130],
    ['payments','angelcare_marketplace_payment_intents',180],
    ['purchases','ac_sc_purchase_orders',200],
    ['purchaseLines','ac_sc_purchase_lines',350],
    ['availability','ac_sc_availability',200],
    ['shipments','ac_sc_shipments',200],
    ['shipmentEvents','ac_sc_shipment_events',250],
    ['tasks','ac_sc_tasks',180],
    ['audit','ac_sc_audit',READ_LIMIT],
  ]
  const results = await Promise.all(tables.map(async ([name, table, limit]) => {
    const q = db.from(table).select('*')
    const r = name === 'catalog' ? await q.in('kind',['product','kit']).limit(limit) : await q.limit(limit)
    dependency(r.error, table)
    return [name, r.data || []] as const
  }))
  // ONE WORLD is an independent service. Its rate book is optional here, never fabricated.
  const rateResponse = await db.from('ac_owc_rates').select('currency,rate,observed_on,status').eq('status','active').limit(180)
  return { ...Object.fromEntries(results), rateBook: rateResponse.error ? [] : (rateResponse.data || []),
    rateBookConnected: !rateResponse.error, generatedAt: new Date().toISOString(),
    integration: { catalog: 'canonical', supplier: 'canonical', payment: 'read_only', publicPricing: 'unchanged', merchant: 'angelcare' } }
}

const ACTIONS = new Set([
  'supplier.create','supplier.update','supplier.transition','supplier.quality','supplier.assess','supplier.document','document.review','media.attach','media.review',
  'channel.save','channel.transition','channel.assort','channel.assort.status','offer.save','offer.status','commercial.save',
  'import.stage','import.apply','purchase.create','purchase.line','purchase.transition',
  'availability.record','availability.verify','shipment.create','shipment.transition','task.create','task.transition',
])

export async function executeSupplierCommand(body: Row) {
  const ctx = await requireMarketplaceWorkspaceApiContext('workspace.supplier_command')
  const action = text(body.action)
  const payload = body.payload
  if (!ACTIONS.has(action)) throw new MarketplaceError('VALIDATION_ERROR','Commande fournisseur inconnue.')
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new MarketplaceError('VALIDATION_ERROR','Payload objet requis.')
  if (ADMIN_ACTIONS.has(action) || (action === 'purchase.transition' && ['approved','issued'].includes(text((payload as Row).status))) || (action === 'supplier.transition' && ['approved','active','suspended','archived'].includes(text((payload as Row).status))) || (action === 'offer.status' && ['approved','active','suspended'].includes(text((payload as Row).status))) || (action === 'channel.transition' && text((payload as Row).status)==='active')) {
    if (!hasMarketplacePermission(ctx,'marketplace.admin.access')) throw new MarketplaceError('PERMISSION_DENIED','Second contrôle réservé aux administrateurs Marketplace.')
  }
  const reason = text(body.reason).slice(0,500)
  if (['purchase.transition','supplier.quality','supplier.assess','availability.verify','media.review','supplier.transition','shipment.transition'].includes(action) && reason.length < 5)
    throw new MarketplaceError('VALIDATION_ERROR','Motif de décision requis (5 caractères minimum).')
  const key = text(body.idempotencyKey)
  if (!/^[0-9a-f-]{36}$/i.test(key)) throw new MarketplaceError('VALIDATION_ERROR','Clé idempotente UUID requise.')
  const db = await createServiceClient()
  const { data, error } = await db.rpc('ac_sc_command', {
    p_actor: ctx.actor.id, p_action: action, p_payload: payload,
    p_key: key, p_reason: reason,
  })
  if (error) throw new MarketplaceError('VALIDATION_ERROR',error.message.slice(0,400),{cause:error})
  return data
}

export async function getSupplierContext() {
  return requireMarketplaceWorkspaceApiContext('workspace.supplier_command')
}
