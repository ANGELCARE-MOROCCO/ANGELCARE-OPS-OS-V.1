import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {join} from 'node:path'
import test from 'node:test'

const source=(path:string)=>readFile(join(process.cwd(),path),'utf8')

test('public asset resolver supports both Windows gateway and Supabase storage',async()=>{
  const runtime=await source('angelcare-marketplace/web-presence/runtime.ts')
  assert.match(runtime,/createMarketplaceMediaDeliveryUrl/)
  assert.match(runtime,/storageBucket==='marketplace-windows-media'/)
  assert.match(runtime,/db\.storage\.from\(storageBucket\)\.download\(storagePath\)/)
  assert.match(runtime,/MEDIA_GATEWAY_TIMEOUT/)
  assert.match(runtime,/STORAGE_OBJECT_MISSING/)
  assert.match(runtime,/getWebPresenceRevision\(scope,requestedRevision\)/)
})

test('public asset endpoint exposes diagnosable failures and immutable successful delivery',async()=>{
  const route=await source('app/api/angelcare-marketplace/public/web-presence/assets/[slot]/route.ts')
  assert.match(route,/Cache-Control': 'public, max-age=31536000, immutable'/)
  assert.match(route,/Cache-Control': 'no-store'/)
  assert.match(route,/X-Web-Presence-Asset-Error/)
  assert.match(route,/X-Web-Presence-Revision/)
  assert.match(route,/mask-icon/)
})

test('revision-specific assets do not silently fall through to the latest published revision',async()=>{
  const repository=await source('angelcare-marketplace/web-presence/repository.ts')
  assert.match(repository,/const historical=await cachedRevision\(scope,revision\)/)
  assert.match(repository,/La révision Web Presence r\$\{revision\} est introuvable/)
  assert.doesNotMatch(repository,/return await cachedRevision\(scope,revision\)\|\|current/)
})

test('verification has rich statuses, retries and non-blocking health semantics',async()=>{
  const verification=await source('angelcare-marketplace/web-presence/verification.ts')
  assert.match(verification,/PROBE_TIMEOUT_MS = 12_000/)
  assert.match(verification,/PROBE_ATTEMPTS = 2/)
  assert.match(verification,/INCONCLUSIVE/)
  assert.match(verification,/SKIPPED/)
  assert.match(verification,/WARNING/)
  assert.match(verification,/DEGRADED/)
  assert.match(verification,/healthStatus === 'FAILED' \? 'FAIL' : 'PASS'/)
  assert.doesNotMatch(verification,/if\(result==='FAIL'\)throw/)
  assert.match(verification,/evidence n’a pas pu être persistée/)
})

test('configured assets are checked individually and optional absent assets are skipped',async()=>{
  const verification=await source('angelcare-marketplace/web-presence/verification.ts')
  for(const token of ['favicon','apple-touch-icon','manifest-192','manifest-512','organization-logo']) assert.match(verification,new RegExp(token))
  assert.match(verification,/OPTIONAL_ASSET_NOT_CONFIGURED/)
  assert.match(verification,/assetSlots/)
})

test('one-click publish automatically performs live verification without rolling back publication',async()=>{
  const api=await source('angelcare-marketplace/web-presence/api.ts')
  assert.match(api,/publication=await publishWebPresenceOneClick/)
  assert.match(api,/verification=await verifyLiveWebPresence/)
  assert.match(api,/verificationError/)
  assert.match(api,/return NextResponse\.json\(\{data:\{\.\.\.publication,verification,verificationError\}/)
})

test('operator workspace exposes health evidence and action progress for every primary command',async()=>{
  const workspace=await source('angelcare-marketplace/web-presence/WebPresenceWorkspace.tsx')
  assert.match(workspace,/Santé publique & preuves/)
  assert.match(workspace,/ActionToast/)
  assert.match(workspace,/Vérification production/)
  assert.match(workspace,/Publication Web Presence/)
  assert.match(workspace,/Restauration Web Presence/)
  assert.match(workspace,/Prévisualisation/)
  assert.match(workspace,/Réf\. \{action\.requestId\}/)
  assert.match(workspace,/HTTP \{item\.httpStatus\}/)
  assert.match(workspace,/item\.failures/)
  assert.match(workspace,/item\.warnings/)
})

test('production health is independent from publication state',async()=>{
  const [types,workspace]=await Promise.all([
    source('angelcare-marketplace/web-presence/types.ts'),
    source('angelcare-marketplace/web-presence/WebPresenceWorkspace.tsx'),
  ])
  assert.match(types,/WebPresenceHealthStatus = 'HEALTHY' \| 'WARNING' \| 'DEGRADED' \| 'FAILED' \| 'NOT_VERIFIED'/)
  assert.match(workspace,/Publication en 1 clic/)
  assert.match(workspace,/Santé publique/)
  assert.doesNotMatch(workspace,/Validation serveur non exécutée/)
})
