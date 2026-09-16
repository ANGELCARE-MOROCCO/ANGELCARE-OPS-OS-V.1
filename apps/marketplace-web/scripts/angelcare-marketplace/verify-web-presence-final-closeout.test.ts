import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {join} from 'node:path'
import test from 'node:test'

const source=(path:string)=>readFile(join(process.cwd(),path),'utf8')

test('admin-selected media is the authority',async()=>{
  const [schema,repository]=await Promise.all([source('angelcare-marketplace/web-presence/schema.ts'),source('angelcare-marketplace/web-presence/repository.ts')])
  assert.doesNotMatch(schema,/SOCIAL_RATIO|APPLE_SIZE|OFFICIAL_LOGO_METADATA_MISSING|INVALID_ASSET_DIMENSIONS/)
  assert.match(repository,/publication preserves it exactly/)
  assert.doesNotMatch(repository,/ASSET_OMITTED_AT_PUBLICATION/)
})

test('no self-http loop exists in live verification',async()=>{
  const verification=await source('angelcare-marketplace/web-presence/verification.ts')
  assert.doesNotMatch(verification,/AbortController|PROBE_TIMEOUT_MS|await fetcher\(/)
  assert.match(verification,/buildWebPresenceMetadata/)
  assert.match(verification,/buildManifest/)
})

test('manifest publishes whichever selected vault assets admin chose',async()=>{
  const runtime=await source('angelcare-marketplace/web-presence/runtime.ts')
  assert.match(runtime,/manifestIcon/)
  assert.match(runtime,/resolveAsset\(assetKey\)/)
  assert.match(runtime,/sizes=`\$\{width\}x\$\{height\}`/)
})

test('media record resolver is not status-gated',async()=>{
  const repository=await source('angelcare-marketplace/web-presence/repository.ts')
  const tail=repository.slice(repository.indexOf('export async function resolveAsset'))
  assert.doesNotMatch(tail,/eq\('status','active'\)/)
})

test('UI declares simple vault-selection doctrine',async()=>{
  const workspace=await source('angelcare-marketplace/web-presence/WebPresenceWorkspace.tsx')
  assert.match(workspace,/aucune condition de dimensions, ratio, optimisation, droits, statut ou marquage officiel/)
  assert.doesNotMatch(workspace,/Droits · statut/)
})
