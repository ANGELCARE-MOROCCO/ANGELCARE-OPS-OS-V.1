import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {join} from 'node:path'
import test from 'node:test'

const source=(path:string)=>readFile(join(process.cwd(),path),'utf8')

test('public asset resolver supports both Windows gateway and Supabase storage without media-status gating',async()=>{
  const [runtime,repository]=await Promise.all([
    source('angelcare-marketplace/web-presence/runtime.ts'),
    source('angelcare-marketplace/web-presence/repository.ts'),
  ])
  assert.match(runtime,/createMarketplaceMediaDeliveryUrl/)
  assert.match(runtime,/storageBucket==='marketplace-windows-media'/)
  assert.match(runtime,/db\.storage\.from\(storageBucket\)\.download\(storagePath\)/)
  assert.match(runtime,/getWebPresenceRevision\(scope,requestedRevision\)/)
  assert.doesNotMatch(repository,/\.eq\('status','active'\)/)
})

test('manifest uses selected assets and their actual Media Library dimensions/mime',async()=>{
  const runtime=await source('angelcare-marketplace/web-presence/runtime.ts')
  assert.match(runtime,/async function manifestIcon/)
  assert.match(runtime,/sizes=`\$\{width\}x\$\{height\}`/)
  assert.match(runtime,/type=String\(asset\.mime_type/)
  assert.match(runtime,/manifest192\.assetKey/)
  assert.match(runtime,/manifest512\.assetKey/)
  assert.doesNotMatch(runtime,/sizes:'192x192'/)
  assert.doesNotMatch(runtime,/sizes:'512x512'/)
})

test('verification is deterministic runtime authority and never self-fetches public hostname',async()=>{
  const verification=await source('angelcare-marketplace/web-presence/verification.ts')
  assert.match(verification,/DIRECT_RUNTIME_AUTHORITY/)
  assert.match(verification,/MEDIA_LIBRARY_SELECTION_AUTHORITY/)
  assert.match(verification,/buildWebPresenceMetadata/)
  assert.match(verification,/buildManifest/)
  assert.doesNotMatch(verification,/PROBE_TIMEOUT_MS/)
  assert.doesNotMatch(verification,/AbortController/)
  assert.doesNotMatch(verification,/await fetcher\(/)
  assert.doesNotMatch(verification,/TIMEOUT/)
})

test('optional unselected assets are skipped and selected assets need only exist in Media Library',async()=>{
  const verification=await source('angelcare-marketplace/web-presence/verification.ts')
  assert.match(verification,/OPTIONAL_ASSET_NOT_SELECTED/)
  assert.match(verification,/resolveAsset\(input\.assetKey\)/)
  assert.doesNotMatch(verification,/width !== height/)
  assert.doesNotMatch(verification,/optimizationStatus/)
  assert.doesNotMatch(verification,/rightsStatus/)
})

test('media validation has no dimension ratio optimization rights or official-label conditions',async()=>{
  const schema=await source('angelcare-marketplace/web-presence/schema.ts')
  for(const forbidden of ['ASSET_SOURCE_LARGER_THAN_SLOT','APPLE_SIZE','OFFICIAL_LOGO_METADATA_MISSING','SOCIAL_IMAGE_FALLBACK','SOCIAL_RATIO','INVALID_ASSET_DIMENSIONS','optimizationStatus','rightsStatus']) assert.doesNotMatch(schema,new RegExp(forbidden))
})

test('one-click publish automatically performs deterministic verification without rolling back publication',async()=>{
  const api=await source('angelcare-marketplace/web-presence/api.ts')
  assert.match(api,/publication=await publishWebPresenceOneClick/)
  assert.match(api,/verification=await verifyLiveWebPresence/)
  assert.match(api,/verificationError/)
  assert.match(api,/return NextResponse\.json\(\{data:\{\.\.\.publication,verification,verificationError\}/)
})

test('operator workspace exposes progress and removes media recommendation clutter',async()=>{
  const workspace=await source('angelcare-marketplace/web-presence/WebPresenceWorkspace.tsx')
  assert.match(workspace,/ActionToast/)
  assert.match(workspace,/vérification runtime directe/)
  assert.match(workspace,/Tout média sélectionné dans la Media Library est publié tel quel/)
  assert.doesNotMatch(workspace,/OFFICIAL_LOGO_METADATA_MISSING/)
  assert.doesNotMatch(workspace,/ratio recommandé/)
  assert.doesNotMatch(workspace,/Droits · statut/)
})

test('production health remains separate from publication and deterministic checks can be healthy',async()=>{
  const [types,verification,workspace]=await Promise.all([
    source('angelcare-marketplace/web-presence/types.ts'),
    source('angelcare-marketplace/web-presence/verification.ts'),
    source('angelcare-marketplace/web-presence/WebPresenceWorkspace.tsx'),
  ])
  assert.match(types,/WebPresenceHealthStatus = 'HEALTHY' \| 'WARNING' \| 'DEGRADED' \| 'FAILED' \| 'NOT_VERIFIED'/)
  assert.match(verification,/return 'HEALTHY'/)
  assert.match(workspace,/Publication en 1 clic/)
  assert.match(workspace,/Santé publique/)
})
