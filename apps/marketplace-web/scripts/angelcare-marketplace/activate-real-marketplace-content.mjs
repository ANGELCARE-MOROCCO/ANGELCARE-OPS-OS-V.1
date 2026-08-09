import { request, chromium } from 'playwright'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const baseURL = process.env.MARKETPLACE_BASE_URL || 'http://localhost:3000'
const statePath = process.env.MARKETPLACE_ADMIN_STORAGE_STATE || path.resolve('marketplace-admin-storage-state.json')
const manifestPath = process.env.MARKETPLACE_CONTENT_MANIFEST || path.resolve('REAL_CONTENT_MANIFEST.json')
const outputDir = process.env.MARKETPLACE_ACTIVATION_OUTPUT || path.resolve(`marketplace-activation-evidence-${Date.now()}`)
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
await mkdir(outputDir, { recursive: true })

function required(value, label) { if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} est requis dans le manifeste.`); return value.trim() }
required(manifest.category?.categoryKey, 'category.categoryKey')
required(manifest.category?.titleFr, 'category.titleFr')
if (!Array.isArray(manifest.offers) || !manifest.offers.length) throw new Error('Au moins une offre réelle est requise.')
for (const [index, offer] of manifest.offers.entries()) {
  required(offer.itemKey, `offers[${index}].itemKey`); required(offer.slug, `offers[${index}].slug`); required(offer.nameFr, `offers[${index}].nameFr`); required(offer.descriptionFr, `offers[${index}].descriptionFr`)
  if (offer.priceMode !== 'quote_only' && (offer.priceAmount === null || Number.isNaN(Number(offer.priceAmount)))) throw new Error(`offers[${index}].priceAmount doit être réel ou priceMode=quote_only.`)
  if (!Array.isArray(offer.media) || !offer.media.length) throw new Error(`offers[${index}] doit contenir au moins un média réel.`)
  for (const media of offer.media) required(media.path, `offers[${index}].media.path`)
}

const apiContext = await request.newContext({ baseURL, storageState: statePath })
async function call(method, url, options = {}) {
  const response = await apiContext.fetch(url, { method, ...options })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok()) throw new Error(`${method} ${url}: ${payload?.error?.message || response.statusText()}`)
  return payload.data
}
async function list(resource, query = '') { return call('GET', `/api/angelcare-marketplace/admin/commerce/${resource}${query}`) }
async function ensureResource(resource, key, keyValue, payload) {
  const existing = (await list(resource)).find((row) => String(row[key]) === keyValue)
  if (existing) return (await call('PATCH', `/api/angelcare-marketplace/admin/commerce/${resource}/${existing.id}`, { data: payload })).record
  return (await call('POST', `/api/angelcare-marketplace/admin/commerce/${resource}`, { data: payload })).record
}
async function action(resource, id, name, data = {}) { return call('POST', `/api/angelcare-marketplace/admin/commerce/${resource}/${id}/${name}`, { data }) }
async function uploadMedia(filePath, altTextFr) {
  const buffer = await readFile(path.resolve(path.dirname(manifestPath), filePath))
  const name = path.basename(filePath)
  const mimeType = name.toLowerCase().endsWith('.png') ? 'image/png' : name.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/jpeg'
  return call('POST', '/api/angelcare-marketplace/admin/media/upload', { multipart: { file: { name, mimeType, buffer }, alt_text_fr: altTextFr || name } })
}

const categoryMedia = manifest.category.coverMediaPath ? await uploadMedia(manifest.category.coverMediaPath, manifest.category.titleFr) : null
const category = await ensureResource('catalog-categories', 'category_key', manifest.category.categoryKey, {
  category_key: manifest.category.categoryKey, locale: manifest.locale || 'fr', title: manifest.category.titleFr,
  short_description: manifest.category.shortDescription || null, slug: manifest.category.slug || manifest.category.categoryKey,
  cover_asset_url: categoryMedia?.desktop_url || null, mobile_cover_asset_url: categoryMedia?.mobile_url || null,
  visible: true, status: 'draft', sort_order: 100,
})
await action('catalog-categories', category.id, 'publish')

const activatedItems = []
for (const offer of manifest.offers) {
  const mediaAssets = []
  for (const media of offer.media) mediaAssets.push(await uploadMedia(media.path, media.altTextFr || offer.nameFr))
  let item = await ensureResource('catalog-items', 'item_key', offer.itemKey, {
    item_key: offer.itemKey, sku: offer.sku || null, slug: offer.slug, kind: offer.kind || 'product', sellable_type: offer.sellableType || offer.kind || 'product',
    name_fr: offer.nameFr, name_en: offer.nameEn || null, name_ar: offer.nameAr || null,
    short_description_fr: offer.shortDescriptionFr || null, description_fr: offer.descriptionFr,
    price_mode: offer.priceMode || 'quote_only', price_amount: offer.priceMode === 'quote_only' ? null : Number(offer.priceAmount),
    currency_label: offer.currencyLabel || 'Dh', availability_status: offer.availabilityStatus || 'configuration_required', status: 'draft',
  })
  const details = await call('GET', `/api/angelcare-marketplace/admin/commerce/catalog-items/${item.id}`)
  for (const [index, asset] of mediaAssets.entries()) {
    if (!(details.media || []).some((row) => String(row.asset_url) === asset.desktop_url)) {
      await call('POST', '/api/angelcare-marketplace/admin/commerce/catalog-media', { data: { catalog_item_id: item.id, media_key: `activation-${index + 1}`, asset_url: asset.desktop_url, alt_text_fr: asset.alt_text_fr || offer.nameFr, sort_order: index * 10, status: 'active' } })
    }
  }
  for (const variant of offer.variants || []) {
    const current = (details.variants || []).find((row) => String(row.variant_key) === String(variant.variantKey))
    const payload = { catalog_item_id: item.id, variant_key: variant.variantKey, name_fr: variant.nameFr, name_en: variant.nameEn || null, name_ar: variant.nameAr || null, sku: variant.sku || null, option_values: variant.optionValues || {}, price_delta: variant.priceDelta ?? null, available: variant.available !== false, status: 'active' }
    if (current) await call('PATCH', `/api/angelcare-marketplace/admin/commerce/catalog-variants/${current.id}`, { data: payload })
    else await call('POST', '/api/angelcare-marketplace/admin/commerce/catalog-variants', { data: payload })
  }
  const availabilityRows = await list('catalog-availability', `?catalog_item_id=${item.id}`)
  const availabilityPayload = { catalog_item_id: item.id, territory_id: manifest.territoryId || null, audience: 'all', available: offer.availability?.available !== false, capacity_limit: offer.availability?.capacityLimit ?? null }
  if (availabilityRows[0]) await call('PATCH', `/api/angelcare-marketplace/admin/commerce/catalog-availability/${availabilityRows[0].id}`, { data: availabilityPayload })
  else await call('POST', '/api/angelcare-marketplace/admin/commerce/catalog-availability', { data: availabilityPayload })
  await action('catalog-items', item.id, 'assign-category', { category_ids: [category.id] })
  for (const badge of offer.merchandisingBadges || []) await action('catalog-items', item.id, 'feature', { merchandising_badge: badge, active: true, locale: manifest.locale || 'fr', territory_id: manifest.territoryId || null })
  item = (await action('catalog-items', item.id, 'publish')).record
  activatedItems.push(item)
}

if (manifest.homepageCollection?.collectionKey) {
  const collection = await ensureResource('homepage-collections', 'collection_key', manifest.homepageCollection.collectionKey, {
    collection_key: manifest.homepageCollection.collectionKey, locale: manifest.locale || 'fr', title: manifest.homepageCollection.title,
    subtitle: manifest.homepageCollection.subtitle || null, layout_variant: manifest.homepageCollection.layoutVariant || 'product_cards',
    selection_method: 'editorial', status: 'active', item_limit: 12,
  })
  await action('homepage-collections', collection.id, 'assign-items', { item_ids: activatedItems.map((item) => item.id), merchandising_reason: 'Activation production administrateur' })
}

if (manifest.navigation?.labelFr) {
  const menus = await list('navigation-menus')
  let menu = menus.find((row) => String(row.menu_key) === String(manifest.navigation.menuKey || 'header-main'))
  if (!menu) menu = (await call('POST', '/api/angelcare-marketplace/admin/commerce/navigation-menus', { data: { menu_key: manifest.navigation.menuKey || 'header-main', name: 'Navigation principale', locale: manifest.locale || 'fr', status: 'active' } })).record
  const items = await list('navigation-items', `?menu_id=${menu.id}`)
  const existing = items.find((row) => String(row.href) === String(manifest.navigation.href))
  const payload = { menu_id: menu.id, label: manifest.navigation.labelFr, label_fr: manifest.navigation.labelFr, label_en: manifest.navigation.labelEn || null, label_ar: manifest.navigation.labelAr || null, href: manifest.navigation.href, visibility: 'public', desktop_visible: true, mobile_visible: true, status: 'active', sort_order: 500 }
  if (existing) await call('PATCH', `/api/angelcare-marketplace/admin/commerce/navigation-items/${existing.id}`, { data: payload })
  else await call('POST', '/api/angelcare-marketplace/admin/commerce/navigation-items', { data: payload })
}

const activationRun = await call('POST', '/api/angelcare-marketplace/admin/activation/run')
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
const publicRoutes = [`/angelcare-marketplace/${manifest.locale || 'fr'}`, `/angelcare-marketplace/${manifest.locale || 'fr'}/marketplace`, `/angelcare-marketplace/${manifest.locale || 'fr'}/marketplace/category/${category.slug}`, ...activatedItems.map((item) => `/angelcare-marketplace/${manifest.locale || 'fr'}/marketplace/item/${item.slug}`)]
const routeResults = []
for (const route of publicRoutes) {
  const response = await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' })
  const status = response?.status() || 0
  const fileName = route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home'
  await page.screenshot({ path: path.join(outputDir, `${fileName}.png`), fullPage: true })
  routeResults.push({ route, status, title: await page.title() })
}
await browser.close()
const report = { generatedAt: new Date().toISOString(), category, items: activatedItems, activationRun, routeResults }
await writeFile(path.join(outputDir, 'activation-report.json'), JSON.stringify(report, null, 2))
await writeFile(path.join(outputDir, 'ACTIVATION_REPORT.md'), `# Marketplace Real Content Activation\n\nStatus: **${activationRun.status}**\n\nScore: **${activationRun.score}%**\n\nActivated items: ${activatedItems.length}\n\nEvidence: ${outputDir}\n`)
await apiContext.dispose()
console.log(`ACTIVATION COMPLETE: ${outputDir}`)
if (activationRun.status !== 'passed') process.exitCode = 2
