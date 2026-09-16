import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {join} from 'node:path'
import test from 'node:test'

const source=(path:string)=>readFile(join(process.cwd(),path),'utf8')

test('one-click publication demotes operational blockers to warnings',async()=>{
  const schema=await source('angelcare-marketplace/web-presence/schema.ts')
  assert.match(schema,/export function validateConfigurationForPublication/)
  assert.match(schema,/strict\.blockers\.map\(issue => \(\{ \.\.\.issue, severity: 'warning' as const \}\)\)/)
  assert.match(schema,/return \{ valid: true, blockers: \[\], warnings/)
})

test('workspace exposes one canonical publish action and removes manual save/validate ceremony',async()=>{
  const workspace=await source('angelcare-marketplace/web-presence/WebPresenceWorkspace.tsx')
  assert.match(workspace,/Publier maintenant/)
  assert.match(workspace,/Publication en 1 clic/)
  assert.doesNotMatch(workspace,/>Enregistrer le brouillon</)
  assert.doesNotMatch(workspace,/>Enregistrer & valider</)
  assert.doesNotMatch(workspace,/Validation serveur non exécutée/)
  assert.doesNotMatch(workspace,/version\.lifecycleState!=='VALIDATED'/)
})

test('canonical admin endpoint publishes current configuration in one POST',async()=>{
  const [route,api,repository]=await Promise.all([
    source('app/api/angelcare-marketplace/admin/web-presence/route.ts'),
    source('angelcare-marketplace/web-presence/api.ts'),
    source('angelcare-marketplace/web-presence/repository.ts'),
  ])
  assert.match(route,/POST=postPublishNow/)
  assert.match(api,/publishWebPresenceOneClick/)
  assert.match(repository,/publicationMode: 'ONE_CLICK'/)
  assert.match(repository,/lifecycle_state: 'VALIDATED'/)
  assert.match(repository,/angelcare_marketplace_publish_web_presence/)
  assert.match(repository,/warningCount/)
})

test('missing or unavailable optional media is omitted rather than blocking publication',async()=>{
  const repository=await source('angelcare-marketplace/web-presence/repository.ts')
  assert.match(repository,/ASSET_OMITTED_AT_PUBLICATION/)
  assert.match(repository,/safe\.icons\[slot\]\.assetKey = null/)
  assert.match(repository,/safe\.social\.defaultImageAssetKey = null/)
  assert.match(repository,/socialImageAssetKey = null/)
})

test('server failures remain traceable and the atomic database publication RPC remains authoritative',async()=>{
  const [api,repository]=await Promise.all([
    source('angelcare-marketplace/web-presence/api.ts'),
    source('angelcare-marketplace/web-presence/repository.ts'),
  ])
  assert.match(api,/console\.error\(`\[web-presence:\$\{rid\}\]`/)
  assert.match(api,/Référence \$\{rid\}/)
  assert.match(repository,/STALE_REVISION/)
  assert.match(repository,/invalidateWebPresence\(scope\)/)
})
