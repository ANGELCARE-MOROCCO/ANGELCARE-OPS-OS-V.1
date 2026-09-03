import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { detectProductReference, matchManifestFiles, parseMediaManifest, runBounded } from '../../angelcare-marketplace/commerce-studio/media-library-operations.ts'

const root = new URL('../../', import.meta.url)
const source = (path: string) => readFile(new URL(path, root), 'utf8')

test('filename reference detection is suggestion-only and deterministic', () => {
  assert.equal(detectProductReference('hero_HS-AC-001_final.webp'), 'HS-AC-001')
  assert.equal(detectProductReference('hs-ac-002 gallery.jpg'), 'HS-AC-002')
  assert.equal(detectProductReference('unrelated-image.png'), '')
})

test('manifest parser requires the canonical columns and exposes unmatched input', () => {
  const parsed = parseMediaManifest('file_name,product_reference,role,alt_text_fr,folder_slug\nhero.jpg,HS-AC-001,primary,Service à domicile,services')
  assert.deepEqual(parsed.errors, [])
  assert.equal(parsed.rows[0]?.role, 'primary')
  const matched = matchManifestFiles(['hero.jpg', 'extra.png'], parsed.rows)
  assert.deepEqual(matched.unmatchedFiles, ['extra.png'])
  assert.deepEqual(matched.unmatchedRows, [])
  assert.ok(parseMediaManifest('file_name,role\nhero.jpg,primary').errors.length)
})

test('bounded queue never exceeds its concurrency limit and preserves every item', async () => {
  let active = 0
  let maximum = 0
  const completed: number[] = []
  await runBounded([1, 2, 3, 4, 5, 6], 2, async item => {
    active += 1
    maximum = Math.max(maximum, active)
    await new Promise(resolve => setTimeout(resolve, 2))
    completed.push(item)
    active -= 1
  })
  assert.equal(maximum, 2)
  assert.deepEqual(completed.toSorted(), [1, 2, 3, 4, 5, 6])
})

test('operator UI keeps explicit preflight, duplicate decisions, retry, cancellation and confirmation', async () => {
  const ui = await source('angelcare-marketplace/commerce-studio/components/MediaLibraryStudio.tsx')
  for (const marker of ['Préflight complet', 'CONCURRENCY=3', 'USE_EXISTING', 'REPLACE_EXISTING', 'UPLOAD_ANYWAY', 'Réessayer les échecs', 'cancelItem', 'Prévisualiser les affectations produit', 'Confirmer les affectations', 'Exporter le manifeste CSV', 'aucune publication automatique']) assert.match(ui, new RegExp(marker))
  assert.doesNotMatch(ui, /publish|publication\/refresh/)
})

test('server contracts retain canonical persistence, checksum and Windows gateway authorities', async () => {
  const repository = await source('angelcare-marketplace/commerce-studio/repository.ts')
  const api = await source('angelcare-marketplace/commerce-studio/media-storage-api.ts')
  const storage = await source('angelcare-marketplace/commerce-studio/media-storage.ts')
  const gateway = await source('bridge/marketplace-media-gateway/server.js')
  assert.match(repository, /angelcare_marketplace_media_folders/)
  assert.match(repository, /angelcare_marketplace_media_assets/)
  assert.match(repository, /angelcare_marketplace_catalog_item_media/)
  assert.match(repository, /contains\('metadata', \{ sha256: checksum \}\)/)
  assert.match(api, /assertActiveMediaFolder/)
  assert.match(api, /gateway\.sha256\.toLowerCase\(\) !== expectedChecksum/)
  assert.match(storage, /backend: 'windows_self_hosted'/)
  assert.match(storage, /MARKETPLACE_MEDIA_GATEWAY_ADMIN_TOKEN/)
  assert.match(storage, /MARKETPLACE_MEDIA_SIGNING_SECRET/)
  assert.match(gateway, /S:\\\\AngelCareData\\\\Marketplace/)
  assert.match(gateway, /path\.join\(ROOT,'assets'\)/)
  assert.doesNotMatch(`${repository}\n${api}\n${storage}`, /cloudinary|createBucket|S3Client/)
})
