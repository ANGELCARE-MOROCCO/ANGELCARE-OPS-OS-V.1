import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd()
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8')
const exists=(p)=>fs.existsSync(path.join(root,p))

const studio='angelcare-marketplace/studio-universal'
const required=[
 `${studio}/manifest.ts`,`${studio}/developer-contract.ts`,`${studio}/audit-ledger.ts`,
 `${studio}/runtime-parity.ts`,`${studio}/publication-gate.ts`,`${studio}/governance.ts`,
 `${studio}/controlled-islands.ts`,`${studio}/components/UniversalExperienceStudio.tsx`,
 `${studio}/components/StudioGovernancePanel.tsx`,`${studio}/StudioPublishedRenderer.tsx`,
 'app/angelcare-marketplace/(protected)/admin/experience/studio/page.tsx',
 'app/angelcare-marketplace/(protected)/admin/experience/studio/[pageId]/page.tsx',
 'app/api/angelcare-marketplace/cms/studio/pages/route.ts',
 'app/api/angelcare-marketplace/cms/studio/pages/[pageId]/draft/route.ts',
 'app/api/angelcare-marketplace/cms/studio/pages/[pageId]/preview/route.ts',
 'app/api/angelcare-marketplace/cms/studio/pages/[pageId]/publish/route.ts',
 'app/api/angelcare-marketplace/cms/studio/pages/[pageId]/health/route.ts',
 'app/api/angelcare-marketplace/cms/studio/pages/[pageId]/seo/route.ts',
 'scripts/angelcare-marketplace/verify-universal-studio.test.mjs',
 'scripts/angelcare-marketplace/verify-universal-studio-part2.test.mjs',
 'scripts/angelcare-marketplace/verify-universal-studio-part3.test.mjs',
]

test('release source contains the complete Studio runtime/governance surface',()=>{
 for(const p of required) assert.equal(exists(p),true,`missing ${p}`)
})

test('one official AngelCare Studio and Puck 0.23 remain locked',()=>{
 const manifest=read(`${studio}/manifest.ts`)
 const pkg=JSON.parse(read('package.json'))
 assert.match(manifest,/AngelCare Marketplace Studio/)
 assert.match(manifest,/officialWorkspace:\s*true/)
 assert.doesNotMatch(manifest,/VoltHub/i)
 assert.equal(pkg.dependencies?.['@puckeditor/core']||pkg.devDependencies?.['@puckeditor/core'],'0.23.0')
})

test('publication, preview, governance and runtime are canonical and server-authoritative',()=>{
 const repo=read(`${studio}/repository.ts`)
 const pub=read(`${studio}/publication-gate.ts`)
 const gov=read(`${studio}/governance.ts`)
 const renderer=read('angelcare-marketplace/public-universe/components/PublicPageRenderer.tsx')
 assert.match(repo,/experience-builder\/repository/)
 assert.match(pub,/blockers/)
 assert.match(gov,/listDependencyEdges|listTemplates|listSymbols/)
 assert.match(renderer,/StudioPublishedRenderer/)
})

test('security invariants remain locked',()=>{
 const files=[]
 const walk=(dir)=>{for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const rel=path.join(dir,e.name);if(e.isDirectory())walk(rel);else if(/\.(ts|tsx)$/.test(e.name))files.push(rel)}}
 walk(studio)
 const all=files.map(read).join('\n')
 assert.doesNotMatch(all,/\beval\s*\(/)
 assert.doesNotMatch(all,/new\s+Function\s*\(/)
 assert.doesNotMatch(all,/(localStorage|sessionStorage)\s*\.(setItem|getItem|removeItem|clear)\s*\(/)
 assert.match(read(`${studio}/capture.ts`),/private|localhost|127\.0\.0\.1|blocked/i)
 assert.match(read(`${studio}/controlled-islands.ts`),/credential|private|forbid|block/i)
})

test('false migration catch-all remains eliminated',()=>{
 const db=read(`${studio}/database-error.ts`)
 assert.doesNotMatch(db,/includes\(['"]angelcare_marketplace_cms_/)
 assert.match(db,/42P01/)
 assert.match(db,/23505/)
 assert.match(db,/42501/)
})

test('A01-A100 ledger is complete and release-only gates are not faked before CI/deploy',()=>{
 const ledger=read(`${studio}/audit-ledger.ts`)
 const ids=[...ledger.matchAll(/\['A(\d{2,3})'/g)].map(m=>Number(m[1]))
 assert.equal(ids.length,100)
 assert.deepEqual(ids,[...Array(100)].map((_,i)=>i+1))
 assert.match(ledger,/\['A95','Lint','PENDING'/)
 assert.match(ledger,/\['A96','Build','PENDING'/)
 assert.match(ledger,/\['A99','Marketplace release authority','PENDING'/)
 assert.match(ledger,/\['A100','Immutable deployment','PENDING'/)
})

test('Marketplace GHCR One-Off remains the exact release authority',()=>{
 const wf=path.resolve(root,'../../.github/workflows/build-marketplace-ghcr-oneoff.yml')
 assert.equal(fs.existsSync(wf),true,'Marketplace GHCR workflow missing')
 const y=fs.readFileSync(wf,'utf8')
 assert.match(y,/name:\s*Build Marketplace GHCR One-Off/)
 assert.match(y,/TARGET_SHA:/)
 assert.match(y,/ghcr\.io\/angelcare-morocco\/angelcare-marketplace/)
 assert.match(y,/build-marketplace-ghcr-oneoff\.yml/)
 assert.doesNotMatch(y,/workflow_dispatch:/)
})

test('Marketplace release constitution verifier exists',()=>{
 assert.equal(exists('scripts/release/verify-marketplace-release-constitution.mjs'),true)
})

test('Universal Studio adds no SQL migration',()=>{
 const sql=[]
 const walk=(dir)=>{if(!exists(dir))return;for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const rel=path.join(dir,e.name);if(e.isDirectory())walk(rel);else if(e.name.endsWith('.sql'))sql.push(rel)}}
 walk(studio)
 assert.deepEqual(sql,[])
})

test('release closeout remains honest about post-source gates',()=>{
 const ledger=read('docs/marketplace-admin-finalization/UNIVERSAL_STUDIO_RELEASE_CLOSEOUT.md')
 assert.match(ledger,/GHCR Marketplace One-Off.*PENDING/i)
 assert.match(ledger,/Coolify.*PENDING/i)
 assert.match(ledger,/SQL_REQUIRED=NO/)
})
