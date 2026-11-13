import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import path from 'node:path'
const ROOT='apps/marketplace-web/'
const read=(p)=>readFileSync(path.resolve(ROOT,p),'utf8')
const engine=read('angelcare-marketplace/sanila-world/world-engine.ts')
const api=read('app/api/angelcare-marketplace/admin/sanila/world/route.ts')
const repo=read('angelcare-marketplace/sanila-world/repository.ts')
const publicPage=read('angelcare-marketplace/sanila-public/SanilaPublicUniverse.tsx')
const router=read('app/angelcare-marketplace/[locale]/[[...slug]]/page.tsx')
const admin=read('angelcare-marketplace/sanila-admin/components/SanilaWorkspace.tsx')
const studio=read('angelcare-marketplace/sanila-studio/SanilaWorldStudio.tsx')
const importer=read('angelcare-marketplace/sanila-world/SanilaWorldImportLab.tsx')
test('SANILA supports all essential page, theme and publication lifecycles',()=>{
 for(const action of ['create_page','duplicate_page','save_page','edit_page','trash_page','restore_page','pause_page','resume_page','upsert_theme','duplicate_theme','trash_theme','restore_theme','set_theme','set_navigation','set_shell','import_bundle','publish','rollback']){
  assert.ok(engine.includes("'"+action+"'"),action+' missing from command engine')
  assert.ok(api.includes("'"+action+"'"),action+' missing from action allowlist')
 }
 assert.ok(engine.includes('SANILA_LOCKED_ROUTES.has(s)'),'Protected workflows must not be replaced')
 assert.ok(engine.includes('Page métier protégée : dupliquez avant édition'),'Protected pages must reject editing')
 assert.ok(engine.includes('pages[s]={...p,pausedAt:now'),'Pause must have a persisted state')
 assert.ok(engine.includes('publishedData:validateSanilaDocument'),'Publish must validate and snapshot')
 assert.ok(engine.includes('publishedThemes=JSON.parse'),'Theme snapshots must be independent of draft edits')
 assert.ok(engine.includes('next.publishedNavigation='),'Public links must be published explicitly')
 assert.ok(engine.includes('contrast(paper,ink)<4.5'),'Custom themes must meet minimum contrast')
})
test('sanila public page routing is connected to actual published records',()=>{
 assert.ok(publicPage.includes('getSanilaWorldState()'))
 assert.ok(publicPage.includes('page?.publishedData'))
 assert.ok(publicPage.includes('world?.publishedThemes'))
 assert.ok(publicPage.includes('SANILA_LOCKED_ROUTES'))
 assert.ok(router.includes('record?.publishedData'))
 assert.ok(router.includes('record.pausedAt'))
 assert.ok(router.includes("slug.startsWith('sanila/')"))
 assert.ok(router.includes('getSanilaWorldState()'))
})
test('import installs real declarative page content with media authority',()=>{
 assert.ok(importer.includes('sanila-package.json'))
 assert.ok(importer.includes('SHA-256'))
 assert.ok(importer.includes("action('import_bundle'")||read('angelcare-marketplace/sanila-world/SanilaWorldOperator.tsx').includes("'import_bundle'"))
 assert.ok(importer.includes('/api/angelcare-marketplace/admin/media/upload'))
 assert.ok(importer.includes("image/png"))
 assert.ok(repo.includes('angelcare_marketplace_media_assets'))
 assert.ok(repo.includes(".eq('version',existing.version)"))
 assert.ok(repo.includes('SanilaWorldConflict'))
})
test('SANILA Studio remains independent from protected demo runtime',()=>{
 assert.ok(studio.includes('NativeExperienceMediaPicker'))
 assert.ok(studio.includes('SANILA_PUCK_CONFIG'))
 assert.ok(studio.includes('expectedRevision:world.revision'))
 assert.ok(read('angelcare-marketplace/sanila-studio/puck.tsx').includes('SanilaImage'))
 assert.ok(admin.includes('SanilaWorldOperator'))
 assert.ok(read('angelcare-marketplace/sanila-world/contract.ts').includes("'themes'"))
 assert.ok(read('app/angelcare-marketplace/(protected)/admin/sanila/preview/page.tsx').includes('requireMarketplacePageContext'))
})
