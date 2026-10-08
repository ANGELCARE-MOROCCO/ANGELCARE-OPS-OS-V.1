import { createHash } from 'node:crypto'
import { CMS_BLOCK_REGISTRY, CMS_BLOCK_REGISTRY_VERSION, STRUCTURAL_BLOCK_TYPES } from './block-registry'

const stable = (value: unknown) => JSON.stringify(value, Object.keys(value as Record<string, unknown> || {}).sort())
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')
const csvCell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`

export interface ExperienceDeveloperContract {
  generatedAt: string
  contractVersion: number
  registryVersion: number
  zeroEmbeddedAi: true
  manualRegistrationOnly: true
  prohibitedRuntimeCapabilities: string[]
  structuralPrimitives: string[]
  pickerContracts: Record<string, unknown>
  runtimeBridge: Record<string, unknown>
  registrationContract: Record<string, unknown>
  blocks: typeof CMS_BLOCK_REGISTRY
  hashes: Record<string, string>
  contractHash: string
}

export function buildExperienceDeveloperContract(): ExperienceDeveloperContract {
  const blocks = CMS_BLOCK_REGISTRY
  const structuralPrimitives = [...STRUCTURAL_BLOCK_TYPES]
  const pickerContracts = {
    media: { authority: 'angelcare_marketplace_media_assets', storage: 'stable asset id', legacyReadCompatibility: 'mediaUrl', prohibited: ['arbitrary remote code'] },
    page: { authority: 'angelcare_marketplace_cms_pages', preferredStorage: 'stable page id', runtimeResolution: 'published route' },
    commerce: { authorities: ['catalog.items', 'catalog.categories', 'homepage.collections'], arbitrarySql: false },
    targeting: { authorities: ['locale', 'territory', 'audience'], arbitraryCode: false },
  }
  const runtimeBridge = {
    publicRenderer: 'angelcare-marketplace/public-universe/components/PublicPageRenderer.tsx',
    publishedAuthority: 'cms_pages.published_revision_id -> cms_revisions.document',
    draftAuthority: 'cms_pages.draft_revision_id -> cms_revisions.document',
    mediaResolution: 'stable media asset id -> native Media Library',
    symbols: 'published symbol revision only',
    adminOnlyCodeInPublicRuntime: false,
  }
  const registrationContract = {
    explicitRegistration: true,
    compileProofRequired: true,
    registryParityRequired: true,
    sourceReviewRequired: true,
    autoPublish: false,
    eval: false,
    remoteCodeExecution: false,
    databaseStoredJavascriptExecution: false,
  }
  const hashes = {
    blockRegistryManifestSha256: sha256(JSON.stringify(blocks)),
    structuralPrimitivesSha256: sha256(JSON.stringify(structuralPrimitives)),
    pickerContractsSha256: sha256(JSON.stringify(pickerContracts)),
    runtimeBridgeSha256: sha256(JSON.stringify(runtimeBridge)),
    registrationContractSha256: sha256(JSON.stringify(registrationContract)),
  }
  const base = {
    generatedAt: new Date().toISOString(), contractVersion: 2, registryVersion: CMS_BLOCK_REGISTRY_VERSION,
    zeroEmbeddedAi: true as const, manualRegistrationOnly: true as const,
    prohibitedRuntimeCapabilities: ['eval', 'remote-code-execution', 'embedded-ai-code-generation', 'autonomous-registration', 'autonomous-publishing'],
    structuralPrimitives, pickerContracts, runtimeBridge, registrationContract, blocks, hashes,
  }
  return { ...base, contractHash: sha256(JSON.stringify({ ...base, generatedAt: undefined })) }
}

export function developerContractTxt(contract: ExperienceDeveloperContract) {
  const lines = [
    'ANGELCARE MARKETPLACE — EXPERIENCE CUSTOM BLOCK DEVELOPER CONTRACT',
    `CONTRACT_VERSION=${contract.contractVersion}`,
    `REGISTRY_VERSION=${contract.registryVersion}`,
    `GENERATED_AT=${contract.generatedAt}`,
    `CONTRACT_SHA256=${contract.contractHash}`,
    'ZERO_EMBEDDED_AI=YES', 'MANUAL_REGISTRATION_ONLY=YES', 'AUTO_PUBLISH=NO', 'EVAL=NO', 'REMOTE_CODE_EXECUTION=NO',
    '', 'SOURCE HASHES', ...Object.entries(contract.hashes).map(([key, value]) => `${key.toUpperCase()}=${value}`),
    '', 'STRUCTURAL PRIMITIVES', ...contract.structuralPrimitives.map(v => `- ${v}`),
    '', `CANONICAL_BLOCKS=${contract.blocks.length}`,
  ]
  for (const block of contract.blocks) {
    lines.push('', `[${block.type}] ${block.name}`, `CATEGORY=${block.category}`, `SCHEMA_VERSION=${block.schemaVersion}`, `PURPOSE=${block.purpose}`, `FIELDS=${block.fields.map(field => `${field.key}:${field.kind}${field.required ? ':required' : ''}`).join(',')}`, `BINDINGS=${block.bindings.join(',')}`, `DESIGN=${block.designCapabilities.join(',')}`, `ACCESSIBILITY=${block.accessibility.join(',')}`, `SEO=${block.seoEffects.join(',')}`, `NESTING=${JSON.stringify(block.nesting)}`, `RUNTIME=${block.runtimeStatus}`, `EDITOR=${block.editorStatus}`)
  }
  return lines.join('\n') + '\n'
}

export function developerContractCsv(contract: ExperienceDeveloperContract) {
  const rows = [['block_type','name','category','schema_version','field_key','field_kind','required','translatable','bindings','design_capabilities','accessibility','seo_effects','runtime_status','editor_status']]
  for (const block of contract.blocks) for (const field of block.fields.length ? block.fields : [{ key: '', label: '', kind: 'text' as const }]) rows.push([block.type,block.name,block.category,String(block.schemaVersion),field.key,field.kind,String(Boolean(field.required)),String(Boolean(field.translatable)),block.bindings.join('|'),block.designCapabilities.join('|'),block.accessibility.join('|'),block.seoEffects.join('|'),block.runtimeStatus,block.editorStatus])
  return rows.map(row => row.map(csvCell).join(',')).join('\n') + '\n'
}
