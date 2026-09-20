import type { ComponentData, Data } from '@puckeditor/core'
import type { StudioSourceReference } from '@/angelcare-marketplace/studio-source-registry/types'
import type { StudioActionReference, StudioResolvedAction } from '@/angelcare-marketplace/studio-action-registry/types'
import type { StudioLiveBindingMap } from '@/angelcare-marketplace/studio-live-binding/types'
import type { StudioDynamicSourceReference } from '@/angelcare-marketplace/studio-dynamic-source/types'
import type { StudioWorkflowReference } from '@/angelcare-marketplace/studio-workflows/types'
import type { StudioAttributionContext } from '@/angelcare-marketplace/studio-attribution/types'

export type StudioLocale = 'fr' | 'en' | 'ar'
export type StudioDevice = 'mobile' | 'tablet' | 'desktop' | 'wide'
export type StudioImportMode = 'replace' | 'append' | 'update' | 'variant'
export type StudioCapabilityStatus = 'native' | 'preserved' | 'adapter' | 'island' | 'review' | 'blocked'

export interface StudioDesignStyle {
  backgroundColor?: string
  color?: string
  width?: string
  maxWidth?: string
  minHeight?: string
  backgroundImage?: string
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number
  marginTop?: number
  marginBottom?: number
  gap?: number
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  boxShadow?: string
  fontFamily?: string
  fontSize?: number
  fontWeight?: number
  fontStyle?: string
  lineHeight?: number
  letterSpacing?: number
  textAlign?: 'left' | 'center' | 'right' | 'start' | 'end'
  textTransform?: string
  textDecoration?: string
  opacity?: number
  display?: string
  flexDirection?: string
  alignItems?: string
  justifyContent?: string
  gridTemplateColumns?: string
  position?: string
  overflow?: string
  objectFit?: string
  aspectRatio?: string
  transform?: string
  filter?: string
  customProperties?: Record<string, string>
}

export interface StudioImportedCssRule {
  kind: 'media' | 'container' | 'supports'
  query: string
  declarations: Record<string, string>
}

export interface StudioResponsiveState {
  mobileVisible?: boolean
  tabletVisible?: boolean
  desktopVisible?: boolean
  mobileStyle?: StudioDesignStyle
  tabletStyle?: StudioDesignStyle
  desktopStyle?: StudioDesignStyle
}

export interface StudioBlockProps extends Record<string, unknown> {
  id?: string
  eyebrow?: string
  title?: string
  lead?: string
  body?: string
  primaryCtaLabel?: string
  primaryCtaHref?: string
  primaryAction?: StudioActionReference | null
  __studioResolvedPrimaryAction?: StudioResolvedAction | null
  secondaryCtaLabel?: string
  secondaryCtaHref?: string
  secondaryAction?: StudioActionReference | null
  __studioResolvedSecondaryAction?: StudioResolvedAction | null
  mediaAssetKey?: string | StudioSourceReference
  mediaUrl?: string
  mediaAlt?: string
  collectionKey?: string | StudioSourceReference
  categoryKey?: string | StudioSourceReference
  items?: Array<Record<string, unknown>>
  sourceDesign?: StudioDesignStyle
  responsive?: StudioResponsiveState
  hidden?: boolean
  locked?: boolean
  __studioImported?: boolean
  __studioSourceFingerprint?: string
  __studioSourceNode?: string
  __studioOwnership?: string
  __studioProvenance?: Record<string, unknown>
  __studioImportedRules?: StudioImportedCssRule[]
  __studioInteractionKind?: string
  __studioReviewRequired?: boolean
  __studioBindings?: StudioLiveBindingMap
  __studioDynamicSource?: StudioDynamicSourceReference
  __studioWorkflow?: StudioWorkflowReference
  __studioAttribution?: StudioAttributionContext
}

export interface StudioPickerAsset {
  id: string
  assetKey: string
  fileName: string
  publicUrl: string
  width: number | null
  height: number | null
  mimeType: string
  status: string
}

export interface StudioPickerRecord {
  id: string
  key: string
  label: string
  status?: string
}

export interface StudioPickerData {
  media: StudioPickerAsset[]
  categories: StudioPickerRecord[]
  collections: StudioPickerRecord[]
}

export interface StudioWebCapability {
  id: string
  family: 'html' | 'css' | 'layout' | 'interaction' | 'graphics' | 'media' | 'accessibility' | 'security'
  status: StudioCapabilityStatus
  note: string
  detected?: boolean
  evidence?: string[]
}

export interface StudioOwnershipRecord {
  sourceNodeId: string
  disposition: 'ROOT' | 'OWNED' | 'FIELD' | 'SLOT' | 'DECORATIVE' | 'PRESERVED' | 'REVIEW' | 'BLOCKED' | 'IGNORED_WITH_REASON'
  ownerBlockId: string | null
  reason: string
}

export interface StudioInteractionRecord {
  kind: string
  sourceNodeId: string
  status: 'adapter' | 'preserved' | 'review' | 'island' | 'blocked'
  note: string
  count?: number
}

export interface StudioAccessibilityIssue {
  code: string
  severity: 'warning' | 'critical'
  count: number
  note: string
}

export interface StudioAccessibilityReport {
  score: number
  critical: number
  warnings: number
  language: string | null
  direction: string | null
  issues: StudioAccessibilityIssue[]
}

export interface StudioSeoEvidence {
  title: string
  description: string
  canonical: string
  robots: string
  h1Count: number
  ogTitle: string
  ogDescription: string
  jsonLdCount: number
}

export interface StudioShellEvidence {
  detected: boolean
  header: boolean
  navigation: boolean
  footer: boolean
  defaultPolicy: 'preserve-global-shell'
  allowedPolicies: Array<'preserve-global-shell' | 'page-local' | 'promote-header' | 'promote-navigation' | 'promote-footer'>
}

export interface StudioCssEvidence {
  rulesTotal: number
  declarationsTotal: number
  preservedDeclarations: number
  normalizedDeclarations: number
  reviewDeclarations: number
  unexplainedDrops: number
  customProperties: number
  mediaQueries: number
  containerQueries: number
  unsupportedAtRules: string[]
}

export interface StudioFidelityScores {
  content: number
  structural: number
  visual: number
  responsive: number
  interaction: number
  editability: number
  accessibility: number
  asset: number
  overall: number
}

export interface StudioLossBudget {
  sourceMeaningfulNodes: number
  ownedMeaningfulNodes: number
  unownedMeaningfulNodes: number
  doubleConsumedNodes: number
  sourceTextZones: number
  outputTextZones: number
  sourceAssets: number
  resolvedAssets: number
  missingAssets: number
  css: StudioCssEvidence
}

export interface StudioImportCandidate {
  format: 'angelcare-studio-import-candidate-v1'
  sourceType: 'html' | 'url' | 'file'
  sourceLabel: string
  sourceFingerprint: string
  documentFingerprint: string
  createdAt: string
  strategy: 'full-page' | 'fragment'
  data: Data
  ownership: StudioOwnershipRecord[]
  interactions: StudioInteractionRecord[]
  accessibility: StudioAccessibilityReport
  seo: StudioSeoEvidence
  shell: StudioShellEvidence
  capabilities: StudioWebCapability[]
  fidelity: StudioFidelityScores
  lossBudget: StudioLossBudget
  blockingCodes: string[]
  reviewCodes: string[]
  warnings: string[]
  safeToApply: boolean
}

export interface StudioWorkspaceManifest {
  workspaceId: 'angelcare-marketplace-studio'
  workspaceKey: 'experience-studio'
  workspaceName: 'AngelCare Marketplace Studio'
  workspaceCategory: 'experience'
  officialWorkspace: true
  registryFlag: 'ANGELCARE_MARKETPLACE_STUDIO_OFFICIAL'
  entryRoute: '/angelcare-marketplace/admin/experience/studio'
  version: string
  status: 'active'
  engine: { name: 'Puck'; version: '0.23.0' }
  structuralPrimitives: readonly string[]
  capabilities: readonly string[]
}

export type StudioData = Data
export type StudioComponentData = ComponentData
