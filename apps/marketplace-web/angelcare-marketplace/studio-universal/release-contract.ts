export const ANGELCARE_MARKETPLACE_RELEASE_CONTRACT = {
  schemaVersion: '2026-09-18.4',
  sourceRoot: 'apps/marketplace-web',
  branch: 'upgrade/next-angelcare-upgrade',
  workflowName: 'Build Marketplace GHCR One-Off',
  image: 'ghcr.io/angelcare-morocco/angelcare-marketplace',
  imageTag: 'EXACT_SOURCE_COMMIT_SHA',
  digestCertification: true,
  deploymentAuthority: 'Coolify',
  deployWithoutCache: true,
  localProductionBuild: false,
  forbiddenWorkflow: 'angelcare-desktop-release.yml',
  immutableDeployment: true,
} as const

export function marketplaceReleaseChain(sourceCommit = '<SOURCE_COMMIT_SHA>') {
  return [
    'apps/marketplace-web',
    ANGELCARE_MARKETPLACE_RELEASE_CONTRACT.workflowName,
    `${ANGELCARE_MARKETPLACE_RELEASE_CONTRACT.image}:${sourceCommit}`,
    'GHCR digest certification',
    'Coolify',
    'DEPLOY WITHOUT CACHE',
  ] as const
}
