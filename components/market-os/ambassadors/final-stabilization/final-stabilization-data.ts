import type { FinalStabilizationSnapshot } from './final-stabilization-types';

export const finalStabilizationSnapshot: FinalStabilizationSnapshot = {
  checks: [
    {
      id: 'check-build',
      title: 'Production build passes',
      area: 'build',
      status: 'pending',
      priority: 'critical',
      instruction: 'Run npm run build and fix all TypeScript/import errors before deploying.'
    },
    {
      id: 'check-routes',
      title: 'All Ambassador OS routes render',
      area: 'routes',
      status: 'pending',
      priority: 'critical',
      instruction: 'Open every important Ambassador route and confirm no 404 or white screen.'
    },
    {
      id: 'check-nav',
      title: 'Navigation consolidated',
      area: 'navigation',
      status: 'pending',
      priority: 'high',
      instruction: 'Expose only core enterprise routes in sidebar; keep deep routes searchable or grouped.'
    },
    {
      id: 'check-db',
      title: 'Supabase schema smoke-tested',
      area: 'database',
      status: 'pending',
      priority: 'critical',
      instruction: 'Confirm schema, indexes, RLS, vector extension, and basic select/insert tests.'
    },
    {
      id: 'check-security',
      title: 'Critical actions blocked server-side',
      area: 'security',
      status: 'warning',
      priority: 'critical',
      instruction: 'Payout, compliance, and AI approval actions must require server validation.'
    },
    {
      id: 'check-api',
      title: 'Placeholder APIs replaced progressively',
      area: 'backend',
      status: 'warning',
      priority: 'high',
      instruction: 'Replace 501 placeholders one subsystem at a time after auth/RBAC is ready.'
    },
    {
      id: 'check-ui',
      title: 'Contrast and layout reviewed',
      area: 'ui',
      status: 'pending',
      priority: 'medium',
      instruction: 'Inspect pages in light/dark mode and ensure readable cards/tables/buttons.'
    },
    {
      id: 'check-deploy',
      title: 'Vercel deployment validated',
      area: 'deployment',
      status: 'pending',
      priority: 'critical',
      instruction: 'Deploy preview, test routes, inspect logs, then promote only if stable.'
    }
  ],
  routes: [
    { id: 'route-enterprise', label: 'Enterprise Dashboard', href: '/market-os/ambassadors/enterprise-dashboard', group: 'Enterprise', priority: 1, shouldExposeInSidebar: true },
    { id: 'route-production', label: 'Production Hardening', href: '/market-os/ambassadors/production-hardening', group: 'Production', priority: 2, shouldExposeInSidebar: true },
    { id: 'route-backend', label: 'Backend Readiness', href: '/market-os/ambassadors/backend-readiness', group: 'Infrastructure', priority: 3, shouldExposeInSidebar: true },
    { id: 'route-final-infra', label: 'Final Infrastructure', href: '/market-os/ambassadors/final-infrastructure', group: 'Infrastructure', priority: 4, shouldExposeInSidebar: true },
    { id: 'route-live', label: 'Live Execution', href: '/market-os/ambassadors/live-execution', group: 'Infrastructure', priority: 5, shouldExposeInSidebar: true },
    { id: 'route-exec', label: 'Executive Command', href: '/market-os/ambassadors/executive-command', group: 'Executive', priority: 6, shouldExposeInSidebar: true },
    { id: 'route-market', label: 'Market Dominance', href: '/market-os/ambassadors/market-dominance', group: 'Strategy', priority: 7, shouldExposeInSidebar: true },
    { id: 'route-governance', label: 'Operating Model', href: '/market-os/ambassadors/operating-model', group: 'Governance', priority: 8, shouldExposeInSidebar: true },
    { id: 'route-permissions', label: 'Permission Matrix', href: '/market-os/ambassadors/permission-matrix', group: 'Governance', priority: 9, shouldExposeInSidebar: false },
    { id: 'route-audit', label: 'Audit Models', href: '/market-os/ambassadors/audit-models', group: 'Governance', priority: 10, shouldExposeInSidebar: false }
  ]
};
