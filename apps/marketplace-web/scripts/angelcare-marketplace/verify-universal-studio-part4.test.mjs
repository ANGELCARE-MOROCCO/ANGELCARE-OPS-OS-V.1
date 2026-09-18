import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd(),studio='angelcare-marketplace/studio-universal'
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8')
const source=rel=>read(`${studio}/${rel}`)
const exists=rel=>fs.existsSync(path.join(root,rel))

const required=['release-contract.ts','runtime-acceptance.ts','release-readiness.ts','components/StudioReleasePanel.tsx']
test('Part 4 final acceptance modules exist',()=>required.forEach(file=>assert.equal(exists(`${studio}/${file}`),true,file)))
test('Marketplace release workflow is exact',()=>assert.match(source('release-contract.ts'),/Build Marketplace GHCR One-Off/))
test('Marketplace image authority is exact',()=>assert.match(source('release-contract.ts'),/ghcr\.io\/angelcare-morocco\/angelcare-marketplace/))
test('release tag is exact source commit SHA',()=>assert.match(source('release-contract.ts'),/EXACT_SOURCE_COMMIT_SHA/))
test('Coolify is the deployment authority',()=>assert.match(source('release-contract.ts'),/deploymentAuthority:\s*'Coolify'/))
test('deploy without cache is locked',()=>assert.match(source('release-contract.ts'),/deployWithoutCache:\s*true/))
test('local production build is explicitly forbidden',()=>assert.match(source('release-contract.ts'),/localProductionBuild:\s*false/))
test('desktop release workflow is explicitly rejected',()=>assert.match(source('release-contract.ts'),/angelcare-desktop-release\.yml/))
test('runtime acceptance contains at least 28 explicit controls',()=>{const s=source('runtime-acceptance.ts');for(let i=1;i<=28;i++)assert.ok(s.includes(`M${String(i).padStart(2,'0')}`),`M${i}`)})
test('manual acceptance covers Studio open and real page selection',()=>{const s=source('runtime-acceptance.ts');assert.match(s,/Ouvrir le Studio officiel/);assert.match(s,/Sélectionner une page réelle/)})
test('manual acceptance covers add move duplicate delete',()=>{const s=source('runtime-acceptance.ts');for(const token of ['Ajouter un bloc','Déplacer et réordonner','Dupliquer et supprimer'])assert.ok(s.includes(token),token)})
test('manual acceptance covers media vault and rail behavior',()=>{const s=source('runtime-acceptance.ts');assert.match(s,/média Vault/);assert.match(s,/rails/)})
test('manual acceptance covers persistence reload',()=>assert.match(source('runtime-acceptance.ts'),/Enregistrer puis recharger/))
test('manual acceptance covers secure preview',()=>assert.match(source('runtime-acceptance.ts'),/Aperçu sécurisé/))
test('manual acceptance covers full page import candidate review and apply',()=>{const s=source('runtime-acceptance.ts');for(const token of ['Importer une page complète','Réviser fidélité','Appliquer candidat'])assert.ok(s.includes(token),token)})
test('manual acceptance covers imported editability',()=>{const s=source('runtime-acceptance.ts');for(const token of ['heading/bouton','Remplacer média importé','Supprimer section importée'])assert.ok(s.includes(token),token)})
test('manual acceptance requires Canvas Preview Public parity',()=>assert.match(source('runtime-acceptance.ts'),/Canvas = Preview = Public/))
test('manual acceptance requires no hydration console errors',()=>assert.match(source('runtime-acceptance.ts'),/hydration\/console/))
test('manual acceptance requires responsive modes',()=>assert.match(source('runtime-acceptance.ts'),/mobile\/tablet\/desktop\/wide/))
test('manual acceptance requires FR EN AR and RTL',()=>assert.match(source('runtime-acceptance.ts'),/FR\/EN\/AR et RTL/))
test('manual acceptance requires governed publication',()=>assert.match(source('runtime-acceptance.ts'),/Publication gouvernée/))
test('release acceptance requires targeted lint',()=>assert.match(source('runtime-acceptance.ts'),/Lint Studio ciblé/))
test('release acceptance requires GHCR build digest and Coolify',()=>{const s=source('runtime-acceptance.ts');for(const token of ['Build Marketplace GHCR One-Off','Digest GHCR','Coolify deploy sans cache'])assert.ok(s.includes(token),token)})
test('release readiness never fakes productionReady while pending gates exist',()=>{const s=source('release-readiness.ts');assert.match(s,/productionReady:hardFailures\.length===0&&runtimePending\.length===0&&releasePending\.length===0/)})
test('release panel exposes pending runtime and release gates',()=>{const s=source('components/StudioReleasePanel.tsx');for(const token of ['Pré-release contrôlée','RUNTIME','RELEASE','Workflow interdit'])assert.ok(s.includes(token),token)})
test('release readiness API reuses marketplace cms view permission',()=>{const s=read('app/api/angelcare-marketplace/cms/studio/release-readiness/route.ts');assert.match(s,/requireMarketplaceApiContext\('marketplace\.cms\.view'\)/)})
test('official Studio command bar opens release acceptance panel',()=>{const s=source('components/UniversalExperienceStudio.tsx');assert.match(s,/StudioReleasePanel/);assert.match(s,/Release/)})
test('manifest is Part 4 aware',()=>{const s=source('manifest.ts');assert.match(s,/universal-studio-4/);for(const token of ['release-readiness','runtime-acceptance','marketplace-release-contract'])assert.ok(s.includes(token),token)})
test('developer contract locks Marketplace release authority without embedded AI',()=>{const s=source('developer-contract.ts');for(const token of ['marketplaceReleaseAuthority','Build Marketplace GHCR One-Off','Coolify','localProductionBuild: false'])assert.ok(s.includes(token),token);assert.doesNotMatch(s,/openai|anthropic|gemini/i)})
test('Part 4 adds no SQL or migration',()=>{const dir=path.join(root,'supabase/migrations');const added=fs.existsSync(dir)?fs.readdirSync(dir).filter(name=>/universal.*studio.*part.?4|puck.*part.?4/i.test(name)):[];assert.deepEqual(added,[])})
