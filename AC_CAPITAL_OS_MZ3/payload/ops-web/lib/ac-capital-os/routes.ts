import type { AcCapitalOsWorkspaceKey } from './types';

export const AC_CAPITAL_OS_ROOT_ROUTE = '/ac-capital-os' as const;

export const AC_CAPITAL_OS_ROUTE_BY_WORKSPACE: Record<AcCapitalOsWorkspaceKey, string> = {
  'executive-cockpit': '/ac-capital-os',
  'capital-radar': '/ac-capital-os/radar',
  'qualification-engine': '/ac-capital-os/qualification',
  'funder-intelligence': '/ac-capital-os/funders',
  'case-builder': '/ac-capital-os/cases',
  'data-room': '/ac-capital-os/data-room',
  'capital-pipeline': '/ac-capital-os/pipeline',
  'coordinator-cockpit': '/ac-capital-os/coordinator',
  'doctrine-vault': '/ac-capital-os/doctrine',
  'ai-command-center': '/ac-capital-os/ai-command',
  'strategy-simulator': '/ac-capital-os/simulator',
  reports: '/ac-capital-os/reports',
  'manual-sop': '/ac-capital-os/manual',
  settings: '/ac-capital-os/settings',
};
