import fs from 'node:fs'
import path from 'node:path'

const app = process.cwd()
let pass = 0
const failures = []
const ok = (name, condition) => {
  if (condition) { console.log(`  ✓ ${name}`); pass += 1 }
  else failures.push(name)
}
const file = (relative) => path.join(app, relative)
const exists = (relative) => fs.existsSync(file(relative))
const text = (relative) => fs.readFileSync(file(relative), 'utf8')
const contains = (relative, marker) => exists(relative) && text(relative).includes(marker)
const matches = (relative, pattern) => exists(relative) && pattern.test(text(relative))

const requiredFiles = [
  'angelcare-marketplace/commerce-studio/types.ts',
  'angelcare-marketplace/commerce-studio/repository.ts',
  'angelcare-marketplace/commerce-studio/api-handlers.ts',
  'angelcare-marketplace/commerce-studio/publication.ts',
  'angelcare-marketplace/commerce-studio/import-export.ts',
  'angelcare-marketplace/commerce-studio/validation.ts',
  'angelcare-marketplace/commerce-studio/commerce-studio.module.css',
  'angelcare-marketplace/commerce-studio/components/CommerceStudioCommand.tsx',
  'angelcare-marketplace/commerce-studio/components/MediaLibraryStudio.tsx',
  'angelcare-marketplace/commerce-studio/components/HomepageComposerStudio.tsx',
  'angelcare-marketplace/commerce-studio/components/HeroCampaignStudio.tsx',
  'angelcare-marketplace/commerce-studio/components/NavigationStudio.tsx',
  'angelcare-marketplace/commerce-studio/components/ProductStudio.tsx',
  'angelcare-marketplace/commerce-studio/components/CategoryStudio.tsx',
  'angelcare-marketplace/commerce-studio/components/CollectionStudio.tsx',
  'angelcare-marketplace/commerce-studio/components/MerchandisingStudio.tsx',
  'angelcare-marketplace/commerce-studio/components/PublicationStudio.tsx',
  'angelcare-marketplace/commerce-studio/components/ImportExportStudio.tsx',
  'supabase/migrations/20260804053000_angelcare_marketplace_complete_commerce_administration_universe.sql',
  'angelcare-marketplace/database/rollback/20260804053000_COMPLETE_COMMERCE_ADMINISTRATION_SAFE_ROLLBACK.sql',
  'tsconfig.angelcare-marketplace-complete-commerce-administration.json',
]
for (const relative of requiredFiles) ok(`required ${relative}`, exists(relative))

const pageRoutes = [
  'app/angelcare-marketplace/(protected)/admin/commerce-studio/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/commerce-studio/import-export/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/media/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/media/library/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/media/upload/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/media/folders/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/media/usage/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/media/rights/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/media/optimization/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/homepage/composer/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/homepage/hero/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/homepage/sections/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/homepage/collections/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/homepage/placements/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/homepage/preview/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/homepage/history/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/navigation/header/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/navigation/mega-menu/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/navigation/mobile/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/navigation/footer/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/catalog/items/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/catalog/items/new/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/catalog/items/[itemId]/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/catalog/items/[itemId]/media/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/catalog/items/[itemId]/pricing/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/catalog/items/[itemId]/variants/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/catalog/items/[itemId]/availability/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/catalog/items/[itemId]/categories/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/catalog/items/[itemId]/seo/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/catalog/categories/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/catalog/categories/new/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/catalog/categories/[categoryId]/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/merchandising/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/merchandising/featured/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/merchandising/popular/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/merchandising/best-picks/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/merchandising/collections/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/publication/page.tsx',
]
for (const relative of pageRoutes) ok(`admin route ${relative}`, exists(relative))

const apiRoutes = [
  'app/api/angelcare-marketplace/admin/commerce/[resource]/route.ts',
  'app/api/angelcare-marketplace/admin/commerce/[resource]/[id]/route.ts',
  'app/api/angelcare-marketplace/admin/commerce/[resource]/[id]/[action]/route.ts',
  'app/api/angelcare-marketplace/admin/commerce/import/[resource]/route.ts',
  'app/api/angelcare-marketplace/admin/commerce/export/[resource]/route.ts',
  'app/api/angelcare-marketplace/admin/media/upload/route.ts',
  'app/api/angelcare-marketplace/admin/media/[mediaId]/transform/route.ts',
  'app/api/angelcare-marketplace/admin/homepage/reorder/route.ts',
  'app/api/angelcare-marketplace/admin/homepage/publish/route.ts',
  'app/api/angelcare-marketplace/admin/navigation/reorder/route.ts',
  'app/api/angelcare-marketplace/admin/navigation/publish/route.ts',
  'app/api/angelcare-marketplace/admin/catalog/categories/reorder/route.ts',
  'app/api/angelcare-marketplace/admin/catalog/items/[itemId]/media/route.ts',
  'app/api/angelcare-marketplace/admin/catalog/items/[itemId]/variants/route.ts',
  'app/api/angelcare-marketplace/admin/catalog/items/[itemId]/pricing/route.ts',
  'app/api/angelcare-marketplace/admin/catalog/items/[itemId]/availability/route.ts',
  'app/api/angelcare-marketplace/admin/catalog/items/[itemId]/categories/route.ts',
  'app/api/angelcare-marketplace/admin/merchandising/reorder/route.ts',
  'app/api/angelcare-marketplace/admin/merchandising/publish/route.ts',
  'app/api/angelcare-marketplace/admin/publication/refresh/route.ts',
  'app/api/angelcare-marketplace/admin/publication/rollback/route.ts',
]
for (const relative of apiRoutes) ok(`API route ${relative}`, exists(relative))

const codeMarkers = [
  ['media multi upload', 'angelcare-marketplace/commerce-studio/components/MediaLibraryStudio.tsx', "getAll('file')"],
  ['media derivatives', 'angelcare-marketplace/commerce-studio/api-handlers.ts', 'imageDerivatives'],
  ['media crop and rotate', 'angelcare-marketplace/commerce-studio/api-handlers.ts', 'handleMediaTransform'],
  ['SVG active-content guard', 'angelcare-marketplace/commerce-studio/api-handlers.ts', 'assertSafeSvg'],
  // HomepageComposerStudio is a deliberate compatibility export. The
  // implementation authority is HomepageDesigner2.
  ['homepage drag reorder', 'angelcare-marketplace/category-native/components/HomepageDesigner2.tsx', 'draggable'],
  ['category drag reorder', 'angelcare-marketplace/commerce-studio/components/CategoryStudio.tsx', 'reorder(targetId'],
  ['category product order', 'angelcare-marketplace/commerce-studio/components/CategoryStudio.tsx', 'reorderAssigned'],
  ['collection item order', 'angelcare-marketplace/commerce-studio/components/CollectionStudio.tsx', 'selectedOrder'],
  ['navigation drag reorder', 'angelcare-marketplace/commerce-studio/components/NavigationStudio.tsx', 'draggable'],
  ['product sellable type', 'angelcare-marketplace/commerce-studio/components/ProductStudio.tsx', 'sellable_type'],
  ['product variants', 'angelcare-marketplace/commerce-studio/components/ProductStudio.tsx', 'VARIANT MATRIX'],
  ['Finance price rule binding', 'angelcare-marketplace/commerce-studio/components/ProductStudio.tsx', 'price-rules'],
  ['category assignment', 'angelcare-marketplace/commerce-studio/components/ProductStudio.tsx', 'assignCategories'],
  // Merchandising rails are intentionally owned by MerchandisingStudio, not
  // duplicated inside ProductStudio. This is the V4 consolidated authority.
  ['Featured action', 'angelcare-marketplace/commerce-studio/components/MerchandisingStudio.tsx', "['featured','Featured'"],
  ['Popular action', 'angelcare-marketplace/commerce-studio/components/MerchandisingStudio.tsx', "['popular','Popular'"],
  ['Best Pick action', 'angelcare-marketplace/commerce-studio/components/MerchandisingStudio.tsx', "['best-pick','Best Picks'"],
  ['merchandising drag reorder', 'angelcare-marketplace/commerce-studio/components/MerchandisingStudio.tsx', 'reorderPlacement'],
  ['CSV parser', 'angelcare-marketplace/commerce-studio/import-export.ts', 'parseCsv'],
  ['immediate revalidation', 'angelcare-marketplace/commerce-studio/publication.ts', 'revalidatePath'],
  ['persistent versioning', 'angelcare-marketplace/commerce-studio/repository.ts', 'angelcare_marketplace_commerce_versions'],
  ['public homepage composition', 'angelcare-marketplace/homepage-flagship/repository.ts', 'homepage_sections'],
  ['public homepage placements', 'angelcare-marketplace/homepage-flagship/repository.ts', 'homepage_placements'],
  ['public composition renderer', 'angelcare-marketplace/homepage-flagship/components/HomepageFlagship.tsx', 'data-section-key'],
]
for (const [name, relative, marker] of codeMarkers) ok(name, contains(relative, marker))

const css = 'angelcare-marketplace/commerce-studio/commerce-studio.module.css'
for (const marker of ['.commandHero','.workspaceHero','.mediaLayout','.composerLayout','.navigationLayout','.productWorkspace','.categoryStudioLayout','.merchLayout','.selectedOrder','@media(max-width:620px)','prefers-reduced-motion']) ok(`visual ${marker}`, contains(css, marker))

const migration = 'supabase/migrations/20260804053000_angelcare_marketplace_complete_commerce_administration_universe.sql'
for (const marker of [
  'complete-commerce-administration-universe',
  'marketplace.media.manage',
  'marketplace.homepage.manage',
  'marketplace.navigation.manage',
  'marketplace.categories.manage',
  'marketplace.merchandising.manage',
  'marketplace.publication.manage',
  'angelcare-marketplace-media',
  'angelcare_marketplace_media_assets',
  'angelcare_marketplace_commerce_versions',
  'angelcare_marketplace_commerce_publication_events',
  'angelcare_marketplace_cache_refresh_events',
  'sellable_type text',
  'enable row level security',
  'revoke all on table',
  'grant all on table',
]) ok(`SQL ${marker}`, contains(migration, marker))
ok('SQL has no DROP TABLE', !matches(migration, /drop\s+table/i))
ok('SQL has no TRUNCATE', !matches(migration, /truncate\s+/i))
ok('SQL has no DROP COLUMN', !matches(migration, /drop\s+column/i))
ok('SQL does not introduce approval statuses', !matches(migration, /awaiting_approval|pending_reviewer|maker_checker/i))

const rollback = 'angelcare-marketplace/database/rollback/20260804053000_COMPLETE_COMMERCE_ADMINISTRATION_SAFE_ROLLBACK.sql'
ok('rollback preserves records', contains(rollback, 'all commercial records and histories preserved'))
ok('rollback does not drop tables', !matches(rollback, /drop\s+table/i))
ok('rollback does not delete records', !matches(rollback, /delete\s+from/i))

const commerceSource = [
  ...fs.readdirSync(file('angelcare-marketplace/commerce-studio/components')).map((name) => `angelcare-marketplace/commerce-studio/components/${name}`),
  'angelcare-marketplace/commerce-studio/repository.ts',
  'angelcare-marketplace/commerce-studio/api-handlers.ts',
].filter(exists).map(text).join('\n')
ok('no hidden TODO debt', !/\bTODO\b|lorem ipsum/i.test(commerceSource))
ok('no TypeScript suppression', !/@ts-ignore|@ts-nocheck/i.test(commerceSource))
ok('no localStorage persistence', !/localStorage\./.test(commerceSource))
ok('no mandatory approval UI', !/waiting for reviewer|awaiting approval|maker.checker/i.test(commerceSource))

console.log(`\nPASS ${pass}`)
if (failures.length) {
  console.log(`FAIL ${failures.length}`)
  for (const failure of failures) console.log(`  ✗ ${failure}`)
  process.exit(1)
}
console.log('RESULT: COMPLETE COMMERCE ADMINISTRATION STATIC CONTRACTUAL ACCEPTANCE PASSED')
console.log('NO BUILD, GIT, DEPLOYMENT OR SQL EXECUTION WAS PERFORMED.')
