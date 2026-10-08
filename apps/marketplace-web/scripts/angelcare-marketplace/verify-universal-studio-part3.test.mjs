import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd(),studio='angelcare-marketplace/studio-universal'
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8')
const source=rel=>read(`${studio}/${rel}`)
const exists=rel=>fs.existsSync(path.join(root,rel))

test('Part 3 governance and runtime hardening modules exist',()=>{for(const file of ['controlled-islands.ts','performance.ts','runtime-parity.ts','publication-gate.ts','governance.ts','components/StudioControlledIsland.tsx','components/StudioGovernancePanel.tsx'])assert.equal(exists(`${studio}/${file}`),true,file)})
test('controlled islands forbid foreign execution credentials private network and direct publication',()=>{const s=source('controlled-islands.ts');for(const token of ['foreignCodeExecution: false','credentialsForwarded: false','privateNetworkAccess: false','publishable: false','reviewRequired: true'])assert.ok(s.includes(token),token)})
test('controlled island runtime exposes explicit safety state',()=>{const s=source('components/StudioControlledIsland.tsx');for(const token of ['Code étranger','Jamais transmis','Réseau privé','Revue obligatoire'])assert.ok(s.includes(token),token)})
test('Studio block runtime uses controlled island component',()=>{const s=source('components/StudioBlockRuntime.tsx');assert.match(s,/StudioControlledIsland/);assert.match(s,/type === 'studio_island'/)})
test('publication gate blocks review-required content and controlled islands',()=>{const s=source('publication-gate.ts');assert.match(s,/CONTROLLED_ISLAND_REVIEW/);assert.match(s,/REVIEW_REQUIRED_BLOCKS/);assert.match(s,/__studioReviewRequired/)})
test('publication repository enforces Studio publication gate before transition',()=>{const s=source('repository.ts');const gate=s.indexOf('studioPublicationGate');const transition=s.indexOf('transitionPage({pageId:input.pageId');assert.ok(gate>=0&&transition>gate);assert.match(s,/Ouvrez Gouvernance/)})
test('governance uses Experience Core templates symbols dependencies previews',()=>{const s=source('governance.ts');for(const token of ['listTemplates','listSymbols','listDependencyEdges','listPreviewSessions','getPageDetail'])assert.match(s,new RegExp(token))})
test('page SEO bridge writes only page metadata through Experience Core',()=>{const s=source('governance.ts');assert.match(s,/updatePage/);assert.match(s,/seo_title/);assert.match(s,/seo_description/);assert.doesNotMatch(s,/update.*web.?presence/i)})
test('governance API is server permission protected',()=>{const s=read('app/api/angelcare-marketplace/cms/studio/governance/route.ts');assert.match(s,/requireMarketplaceApiContext\('marketplace\.cms\.view'\)/)})
test('SEO route uses marketplace cms edit authority',()=>{const s=read('app/api/angelcare-marketplace/cms/studio/pages/[pageId]/seo/route.ts');assert.match(s,/marketplace\.cms\.edit/);assert.match(s,/updateStudioSeo/)})
test('health route exposes blockers performance and parity',()=>{const s=read('app/api/angelcare-marketplace/cms/studio/pages/[pageId]/health/route.ts');for(const token of ['healthy','blockers','performance','parity'])assert.match(s,new RegExp(token))})
test('operator workspace exposes governance action and panel',()=>{const s=source('components/UniversalExperienceStudio.tsx');assert.match(s,/Gouvernance/);assert.match(s,/StudioGovernancePanel/);assert.match(s,/ShieldCheck/)})
test('governance panel exposes health performance dependencies libraries SEO and authority links',()=>{const s=source('components/StudioGovernancePanel.tsx');for(const token of ['Performance','Runtime parity','Dépendances','Templates','Symboles','SEO de cette page','Web Presence'])assert.ok(s.includes(token),token)})
test('performance budget detects block item css payload and controlled island pressure',()=>{const s=source('performance.ts');for(const token of ['blocks.length>180','itemRows>1000','importedRuleCount>500','1_500_000','controlledIslands','reviewRequiredBlocks'])assert.ok(s.includes(token),token)})
test('runtime parity report is machine readable',()=>{const s=source('runtime-parity.ts');for(const token of ['contractBlocks','publicRuntimeCovered','editorRuntimeCovered','structuralCovered','interactiveCovered','unsupported','pass'])assert.match(s,new RegExp(token))})
test('import provenance records island kind and tagName without executing source runtime',()=>{const s=source('import-compiler.ts');assert.match(s,/tagName:el\.tagName\.toLowerCase\(\)/);assert.match(s,/kind:type/);assert.match(s,/Aucun code source étranger n’est exécuté/)})
test('A01-A100 ledger is complete and release gates remain pending instead of faked',()=>{const s=source('audit-ledger.ts');for(let i=1;i<=100;i++){const id=`A${String(i).padStart(2,'0')}`;assert.ok(s.includes(`'${id}'`),id)}assert.match(s,/\['A96','Build','PENDING'/);assert.match(s,/\['A100','Immutable deployment','PENDING'/)})
test('manifest and developer contract are Part 3 aware',()=>{assert.match(source('manifest.ts'),/universal-studio-[34]/);const d=source('developer-contract.ts');for(const token of ['controlledIslandsExecuteForeignCode','governanceWorkspace','pageSeoBridge','performanceBudget','a01A100AuditLedger'])assert.match(d,new RegExp(token))})
test('Part 3 adds no SQL or migration',()=>{const dir=path.join(root,'supabase/migrations');const added=fs.existsSync(dir)?fs.readdirSync(dir).filter(name=>/universal.*studio.*part.?3|puck.*part.?3/i.test(name)):[];assert.deepEqual(added,[])})
test('Part 3 does not introduce browser canonical persistence or eval',()=>{const files=['controlled-islands.ts','performance.ts','runtime-parity.ts','publication-gate.ts','governance.ts','components/StudioControlledIsland.tsx','components/StudioGovernancePanel.tsx'];const all=files.map(source).join('\n');assert.doesNotMatch(all,/localStorage|sessionStorage/);assert.doesNotMatch(all,/\beval\s*\(|new\s+Function\s*\(/)})
