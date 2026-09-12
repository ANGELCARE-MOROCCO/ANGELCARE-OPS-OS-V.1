import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const root = process.cwd()
const require = createRequire(import.meta.url)
const compiled = resolve(root, '.product360-import-static/angelcare-marketplace/enterprise-command')
const doctrines = require(resolve(compiled, 'product-doctrine.js'))
const contract = require(resolve(compiled, 'product-360-contract.js'))
const readiness = require(resolve(compiled, 'product-360-readiness.js'))

const expectedCategoryNativeTypes = [
  'academy_programme','admission_programme','b2b_solution','certification_pathway','cohort','course',
  'digital_product','family_service','kit','one_time_service','partner_os_plan','physical_product',
  'quality_assessment','recurring_service',
]
for (const key of expectedCategoryNativeTypes) assert.ok(doctrines.PRODUCT_DOCTRINES[key], `missing Category-Native doctrine ${key}`)
assert.ok(Object.keys(doctrines.PRODUCT_DOCTRINES).length >= 24, 'Product doctrine registry unexpectedly shrank')
assert.throws(() => doctrines.requireProductDoctrine('totally_unknown_doctrine'), /inconnue/i)

for (const definition of Object.values(doctrines.PRODUCT_DOCTRINES)) {
  const matrix = contract.product360DestinationMatrix(definition)
  const missing = Object.entries(matrix).filter(([, destination]) => !destination)
  assert.deepEqual(missing, [], `${definition.key} contains accepted shadow fields without canonical destination`)
}
assert.equal(contract.product360CanonicalDestination('price_rules_json', doctrines.PRODUCT_DOCTRINES.physical_product), 'finance_price_rules')
assert.ok(contract.PRODUCT_360_IMPORT_FIELDS.some((field) => field.key === 'price_rules_json'))
assert.equal(contract.canonicalProductImportKey('Nom FR'), 'name_fr')
assert.equal(contract.canonicalProductImportKey('Catégories'), 'category_keys')
assert.equal(contract.canonicalProductImportKey('Image principale'), 'primary_image_reference')

const partialUpdate = contract.validateProductImportRows({
  doctrineKey: 'physical_product', mode: 'update', existingKeys: new Set(['SKU-EXISTING']), rows: [{ item_key: 'SKU-EXISTING' }],
})
assert.equal(partialUpdate.rows[0].valid, true, `partial update should preserve omitted canonical values: ${partialUpdate.rows[0].errors.join(' | ')}`)

const emptyRequiredJson = contract.validateProductImportRows({
  doctrineKey: 'digital_product', mode: 'create', rows: [{
    item_key: 'DIG-001', slug: 'dig-001', name_fr: 'Digital', resource_type: 'guide', file_formats: '[]', license_type: 'single', digital_preview_reference: 'preview',
  }],
})
assert.equal(emptyRequiredJson.rows[0].valid, false, 'empty required JSON array must not satisfy doctrine requirements')

const unknownReadiness = readiness.evaluateProduct360ReadinessRecord({}, 'totally_unknown_doctrine')
assert.equal(unknownReadiness.ready, false)
assert.ok(unknownReadiness.reasons.includes('DOCTRINE_UNKNOWN'))

const snapshot = {
  item_key: 'DIG-001', slug: 'dig-001', name_fr: 'Digital', short_description_fr: 'Court', description_fr: 'Long',
  price_mode: 'fixed', price_amount: 10, availability_status: 'available',
  attributes: { resource_type: 'guide', file_formats: [], license_type: 'single', digital_preview_reference: 'preview' },
  categories: [{ id: 'cat' }], media: [{ media_key: 'primary', asset_url: 'https://example.test/a.jpg', status: 'active' }], availability: [], priceRules: [],
  seo_metadata: { title_fr: 'Titre', description_fr: 'Description' },
  fulfillment_config: { mode: 'digital', lead_time: 'immédiat', delivery_method: 'download', capacity_model: 'unlimited', customer_handover: 'email' },
  trust_config: { trust_headline: 'Confiance', certifications: 'N/A', guarantees: 'Support', safety_information: 'Conditions', provider_requirements: 'N/A' },
}
assert.equal(readiness.evaluateProduct360ReadinessRecord(snapshot, 'digital_product').checks.doctrine, false, 'empty JSON must fail readiness')
snapshot.attributes.file_formats = ['pdf']
assert.equal(readiness.evaluateProduct360ReadinessRecord(snapshot, 'digital_product').checks.doctrine, true, 'non-empty JSON must satisfy doctrine presence')

const files = {
  handlers: await readFile(resolve(root, 'angelcare-marketplace/enterprise-command/api-handlers.ts'), 'utf8'),
  engine: await readFile(resolve(root, 'angelcare-marketplace/enterprise-command/product-360-import-engine.ts'), 'utf8'),
  commerce: await readFile(resolve(root, 'angelcare-marketplace/commerce-studio/repository.ts'), 'utf8'),
  core: await readFile(resolve(root, 'angelcare-marketplace/marketplace-core/repository.ts'), 'utf8'),
  categoryNative: await readFile(resolve(root, 'angelcare-marketplace/category-native/repository.ts'), 'utf8'),
  categoryNativeApi: await readFile(resolve(root, 'angelcare-marketplace/category-native/api-handlers.ts'), 'utf8'),
  studio: await readFile(resolve(root, 'angelcare-marketplace/enterprise-command/components/ProductImportStudio.tsx'), 'utf8'),
}
assert.ok(!files.handlers.includes('commercial_metadata.imported_fields'), 'legacy imported_fields shadow persistence remains in enterprise importer')
assert.ok(!files.engine.includes('commercial_metadata.imported_fields'), 'legacy imported_fields shadow persistence remains in Product 360 engine')
assert.ok(files.engine.includes('price_rules_json') && files.engine.includes('syncPriceRules'), 'multi-rule Finance import is not wired')
assert.ok(files.engine.includes('price_override') && files.engine.includes('media_asset_id') && files.engine.includes('inventory_reference'), 'canonical variant fields are not fully wired')
assert.ok(files.handlers.includes('rowsRequirePublishAuthority'), 'published-update authority guard missing')
assert.ok(files.handlers.includes('contract_version:3'), 'Product 360 import contract version was not hardened')
assert.ok(files.handlers.includes(".eq('status','pending').select('*')"), 'atomic pending-row claim guard missing')
assert.ok(files.engine.includes('validateTerritoryIds') && files.engine.includes('validateCityZoneIds'), 'direct territory/city-zone dry-run preflight missing')
assert.ok(files.engine.includes('n’appartient pas au territory_id'), 'city-zone ownership validation missing')
assert.ok(files.commerce.includes('evaluateProduct360Readiness') || files.commerce.includes('evaluateProduct360ReadinessRecord'), 'Commerce Studio shared readiness guard missing')
assert.ok(files.core.includes('evaluateProduct360Readiness') || files.core.includes('evaluateProduct360ReadinessRecord'), 'Marketplace Core shared readiness guard missing')
assert.ok(files.categoryNative.includes('evaluateProduct360Readiness'), 'Category-Native shared readiness guard missing')
assert.ok(files.categoryNative.includes('restoreProduct360Snapshot') && files.categoryNative.includes('return loadProduct360Snapshot(itemId)'), 'Category-Native rollback/snapshot is not using canonical Product 360 recovery')
assert.ok(files.categoryNativeApi.includes("marketplace.catalog.publish"), 'Category-Native publish/restore authority guard missing')
assert.ok(!files.studio.includes('requiredCore'), 'Product import UI references obsolete contract properties')
assert.ok(files.studio.includes('Template XLSX Pro') && files.studio.includes('price_rules_json'), 'professional Product 360 XLSX template workflow missing')
assert.ok(files.studio.includes('detectCsvDelimiter'), 'CSV delimiter detection missing')

console.log(`PASS Product 360 import hardening: ${Object.keys(doctrines.PRODUCT_DOCTRINES).length} doctrines, ${contract.PRODUCT_360_IMPORT_FIELDS.length} canonical fields, zero missing destinations.`)
