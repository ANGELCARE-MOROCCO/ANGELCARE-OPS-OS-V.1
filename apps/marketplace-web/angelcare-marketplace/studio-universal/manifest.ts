import type { StudioWorkspaceManifest } from './types'

export const ANGELCARE_STUDIO_VERSION = '2026.09-universal-studio-4'

export const ANGELCARE_STUDIO_MANIFEST: StudioWorkspaceManifest = {
  workspaceId: 'angelcare-marketplace-studio',
  workspaceKey: 'experience-studio',
  workspaceName: 'AngelCare Marketplace Studio',
  workspaceCategory: 'experience',
  officialWorkspace: true,
  registryFlag: 'ANGELCARE_MARKETPLACE_STUDIO_OFFICIAL',
  entryRoute: '/angelcare-marketplace/admin/experience/studio',
  version: ANGELCARE_STUDIO_VERSION,
  status: 'active',
  engine: { name: 'Puck', version: '0.23.0' },
  structuralPrimitives: ['ac_section', 'ac_container', 'ac_columns', 'ac_grid', 'ac_stack'],
  capabilities: [
    'pages', 'visual-builder', 'universal-import', 'media-vault', 'theme-authority', 'navigation',
    'secure-preview', 'version-history', 'publishing', 'rollback', 'page-authority', 'dependency-graph',
    'experience-ir', 'dom-ownership', 'source-fingerprints', 'loss-budget', 'fidelity-report',
    'responsive-authoring', 'css-cascade', 'css-inheritance', 'css-variables', 'interaction-adapters', 'candidate-preview',
    'shell-protection', 'seo-evidence', 'rtl', 'accessibility', 'developer-contract', 'runtime-parity',
    'controlled-islands', 'governance-workspace', 'page-health', 'performance-budget', 'page-seo-bridge', 'a01-a100-audit-ledger',
    'release-readiness', 'runtime-acceptance', 'marketplace-release-contract',
  ],
}
