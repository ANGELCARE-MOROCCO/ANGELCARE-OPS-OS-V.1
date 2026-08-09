#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const app = path.resolve(process.argv[2] || process.cwd())
const read = (rel) => fs.readFileSync(path.join(app, rel), 'utf8')
const exists = (rel) => fs.existsSync(path.join(app, rel))
const checks = []
const check = (name, condition) => checks.push({ name, pass: Boolean(condition) })
const contains = (rel, ...needles) => {
  const text = read(rel)
  return needles.every((needle) => text.includes(needle))
}

const previewComponent = 'components/market-os/content-command/media-preview/ContentMediaPreview.tsx'
const previewCss = 'components/market-os/content-command/media-preview/content-media-preview.module.css'
const previewTypes = 'components/market-os/content-command/media-preview/content-media-preview.module.css.d.ts'
const previewApi = 'app/api/market-os/content-command-headquarters/media-preview/route.ts'
const previewService = 'lib/market-os/content-command-headquarters/media-preview-service.ts'

for (const rel of [previewComponent, previewCss, previewTypes, previewApi, previewService]) check(`exists:${rel}`, exists(rel))
check('universal renderer supports image/pdf/video/audio/web', contains(previewComponent, 'kind === "image"', 'kind === "pdf"', 'kind === "video"', 'kind === "audio"', 'kind === "web"'))
check('universal renderer supports private bridge/storage sources', contains(previewComponent, 'bridgeFileId', 'storageKey', 'file-preview?'))
check('universal renderer treats opaque storage paths securely', contains(previewComponent, 'opaqueStorageKey'))
check('universal renderer supports fit, rotation and fullscreen', contains(previewComponent, 'setFit', 'setRotation', 'setExpanded'))
check('universal renderer exposes adaptive ratio classification', contains(previewComponent, 'ultrawide', 'landscape', 'story', 'portrait', 'square'))
check('renderer exposes media detection for library filtering', contains(previewComponent, 'export function detectContentMediaKind'))
check('external preview API requires Headquarters view authority', contains(previewApi, 'requireContentHeadquartersUser("view")'))
check('external preview API supports metadata and proxy modes', contains(previewApi, 'mode === "proxy"', 'fetchExternalMediaMetadata'))
check('SSRF policy blocks private network targets', contains(previewService, 'MEDIA_URL_PRIVATE_ADDRESS_BLOCKED', 'localhost', '192.168.', '172\\.'))
check('redirect chain is revalidated', contains(previewService, 'safeFetch', 'redirect: "manual"', 'MEDIA_REDIRECT_LIMIT_EXCEEDED'))
check('external proxy has size and timeout controls', contains(previewService, 'MAX_PROXY_BYTES', 'AbortController', 'MEDIA_PROXY_FILE_TOO_LARGE'))

const surfaceFiles = [
  'components/market-os/content-command/experience-bulk4/Bulk4AssetLibraryWorkspace.tsx',
  'components/market-os/content-command/experience-bulk4/Bulk4ActiveAssetsWorkspace.tsx',
  'components/market-os/content-command/experience-bulk4/Bulk4VersionControlWorkspace.tsx',
  'components/market-os/content-command/experience-bulk4/Bulk4DigitalStudioWorkspace.tsx',
  'components/market-os/content-command/experience-bulk4/Bulk4PrintStudioWorkspace.tsx',
  'components/market-os/content-command/experience-bulk4/Bulk4DocumentationStudioWorkspace.tsx',
  'components/market-os/content-command/headquarters/SourceVaultWorkspace.tsx',
  'components/market-os/content-command/headquarters/EvidenceWorkspace.tsx',
  'components/market-os/content-command/headquarters/ValidationWorkspace.tsx',
  'components/market-os/content-command/headquarters/DistributionWorkspace.tsx',
  'components/market-os/content-command/content-publishing-page.tsx',
  'components/market-os/content-command/headquarters/dossier/DossierSections.tsx',
  'components/market-os/content-command/experience-bulk1/Bulk1DossierWorkspace.tsx',
  'components/market-os/content-command/experience-bulk5/Bulk5EvidenceLabWorkspace.tsx',
  'components/market-os/content-command/experience-bulk5/Bulk5ReviewCommandWorkspace.tsx',
  'components/market-os/content-command/experience-bulk5/Bulk5ValidationChamber.tsx',
]
for (const rel of surfaceFiles) check(`surface uses universal preview:${rel}`, exists(rel) && read(rel).includes('ContentMediaPreview'))

const library = 'components/market-os/content-command/experience-bulk4/Bulk4AssetLibraryWorkspace.tsx'
check('asset library offers media-type filters', contains(library, 'Tous les formats', 'Images', 'PDF', 'Vidéos', 'Liens web'))
check('asset library offers adjustable card scales', contains(library, 'Cartes compactes', 'Cartes standard', 'Grand aperçu', 'Ratio natif'))
check('asset library keeps existing visual/register/relationship views', contains(library, 'Discovery', 'Registre', 'Relations'))
check('asset library card and inspector share renderer', (read(library).match(/ContentMediaPreview/g) || []).length >= 2)

const bulkCss = 'components/market-os/content-command/experience-bulk4/bulk4-experience.module.css'
check('native masonry layout is additive', contains(bulkCss, 'data-card-scale="native"', 'columns:3 290px', 'break-inside:avoid'))
check('compact and large card sizes are present', contains(bulkCss, 'data-card-scale="compact"', 'data-card-scale="large"'))

const sourceVault = 'components/market-os/content-command/headquarters/SourceVaultWorkspace.tsx'
const knowledgeModel = 'components/market-os/content-command/knowledge/knowledge-model.ts'
check('source vault previews current canonical source', contains(sourceVault, 'sourceMediaPreview', 'bridge_file_id', 'storage_key'))
check('source vault previews version lineage', contains(sourceVault, 'versionMediaPreview', 'source.bridgeFileId', 'source.storageKey'))
check('knowledge model carries preview source authority', contains(knowledgeModel, 'bridgeFileId', 'storageKey', 'contentType'))

check('distribution shows canonical source preview', contains('components/market-os/content-command/headquarters/DistributionWorkspace.tsx', 'selectedSource', 'ContentMediaPreview'))
check('publishing shows source/evidence preview', contains('components/market-os/content-command/content-publishing-page.tsx', 'dossierSource', 'dossierEvidence', 'ContentMediaPreview'))

const forbiddenBusinessMutations = ['localStorage.setItem(', 'sessionStorage.setItem(']
const newRuntimeFiles = [previewComponent, previewApi, previewService]
for (const rel of newRuntimeFiles) {
  const text = read(rel)
  check(`no browser business persistence:${rel}`, forbiddenBusinessMutations.every((token) => !text.includes(token)))
}

const failures = checks.filter((item) => !item.pass)
if (failures.length) {
  for (const item of failures) console.error(`FAIL — ${item.name}`)
  console.error(`FAIL — ${failures.length} of ${checks.length} universal media-preview checks failed.`)
  process.exit(1)
}
console.log(`PASS — ${checks.length} Universal Media Preview, adaptive card, secure source and cross-workspace checks passed.`)
