import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {join} from 'node:path'
import test from 'node:test'

const source=(path:string)=>readFile(join(process.cwd(),path),'utf8')

test('one-click publication stays non-blocking and media heuristics are removed',async()=>{
  const schema=await source('angelcare-marketplace/web-presence/schema.ts')
  assert.match(schema,/export function validateConfigurationForPublication/)
  assert.match(schema,/return \{ valid: true, blockers: \[\], warnings/)
  for(const forbidden of ['ASSET_SOURCE_LARGER_THAN_SLOT','APPLE_SIZE','OFFICIAL_LOGO_METADATA_MISSING','SOCIAL_IMAGE_FALLBACK','SOCIAL_RATIO','INVALID_ASSET_DIMENSIONS']) assert.doesNotMatch(schema,new RegExp(forbidden))
})

test('workspace exposes one canonical publish action and no media recommendation ceremony',async()=>{
  const workspace=await source('angelcare-marketplace/web-presence/WebPresenceWorkspace.tsx')
  assert.match(workspace,/Publier maintenant/)
  assert.match(workspace,/Publication en 1 clic/)
  assert.match(workspace,/aucune condition de dimensions, ratio, optimisation, droits, statut ou marquage officiel/)
  assert.doesNotMatch(workspace,/>Enregistrer le brouillon</)
  assert.doesNotMatch(workspace,/>Enregistrer & valider</)
  assert.doesNotMatch(workspace,/Droits · statut/)
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
  assert.match(repository,/angelcare_marketplace_publish_web_presence/)
})

test('selected Media Library assets are preserved exactly at publication',async()=>{
  const repository=await source('angelcare-marketplace/web-presence/repository.ts')
  assert.match(repository,/Admin authority: once a Media Library asset is selected, publication preserves it exactly/)
  assert.match(repository,/configuration: structuredClone\(configuration\)/)
  assert.doesNotMatch(repository,/ASSET_OMITTED_AT_PUBLICATION/)
  assert.doesNotMatch(repository,/optimizationStatus === 'ready'/)
  assert.doesNotMatch(repository,/\.eq\('status','active'\)/)
})

test('server failures remain traceable and atomic database publication remains authoritative',async()=>{
  const [api,repository]=await Promise.all([
    source('angelcare-marketplace/web-presence/api.ts'),
    source('angelcare-marketplace/web-presence/repository.ts'),
  ])
  assert.match(api,/console\.error\(`\[web-presence:\$\{rid\}\]`/)
  assert.match(api,/Référence \$\{rid\}/)
  assert.match(repository,/STALE_REVISION/)
  assert.match(repository,/invalidateWebPresence\(scope\)/)
})
