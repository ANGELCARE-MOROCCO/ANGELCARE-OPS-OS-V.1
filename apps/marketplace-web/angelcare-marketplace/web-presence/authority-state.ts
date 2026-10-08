import { compiledWebPresence } from './fallback'
import type { WebPresenceScope, WebPresenceVersion } from './types'

export function nextWebPresenceVersionNumber(latestVersionNumber: number | null | undefined): number {
  return Number(latestVersionNumber || 0) + 1
}

export function resolveWebPresenceAuthorityState(
  scope: WebPresenceScope,
  versions: WebPresenceVersion[],
  currentPublishedVersionId: string | null,
) {
  const ordered = [...versions].sort((left, right) => right.versionNumber - left.versionNumber)
  const draft = ordered.find((version) => ['DRAFT', 'VALIDATED'].includes(version.lifecycleState)) || null
  const published = currentPublishedVersionId
    ? ordered.find((version) => version.id === currentPublishedVersionId && version.lifecycleState === 'PUBLISHED') || null
    : null

  return {
    draft,
    published,
    effectiveConfiguration: published?.configuration ?? compiledWebPresence(scope),
    fallbackActive: published === null,
    persistenceState: published ? 'PUBLISHED' : draft ? 'DRAFT_ONLY' : 'READY_TO_BOOTSTRAP',
  } as const
}
