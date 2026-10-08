import type { StudioBlockProps } from './types'

export interface StudioControlledIslandPolicy {
  kind: 'canvas' | 'webgl' | 'web-component' | 'unknown'
  sandboxed: true
  foreignCodeExecution: false
  credentialsForwarded: false
  privateNetworkAccess: false
  publishable: false
  reviewRequired: true
  sourceFingerprint: string | null
  sourceNode: string | null
  reason: string
}

export function controlledIslandPolicy(props: StudioBlockProps): StudioControlledIslandPolicy {
  const provenance = props.__studioProvenance && typeof props.__studioProvenance === 'object' ? props.__studioProvenance : {}
  const source = String(provenance.tagName || provenance.kind || props.__studioInteractionKind || '').toLowerCase()
  const kind: StudioControlledIslandPolicy['kind'] = source.includes('webgl') ? 'webgl' : source.includes('canvas') ? 'canvas' : source.includes('-') ? 'web-component' : 'unknown'
  return {
    kind,
    sandboxed: true,
    foreignCodeExecution: false,
    credentialsForwarded: false,
    privateNetworkAccess: false,
    publishable: false,
    reviewRequired: true,
    sourceFingerprint: typeof props.__studioSourceFingerprint === 'string' ? props.__studioSourceFingerprint : null,
    sourceNode: typeof props.__studioSourceNode === 'string' ? props.__studioSourceNode : null,
    reason: 'Capacité externe non reconstructible automatiquement : aucun runtime étranger n’est exécuté et une décision opérateur est requise.',
  }
}

export function controlledIslandCanPublish(props: StudioBlockProps) {
  return !props.__studioReviewRequired
}
