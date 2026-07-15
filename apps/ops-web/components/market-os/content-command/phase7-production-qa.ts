export type QaSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ProductionQaItem {
  id: string;
  label: string;
  severity: QaSeverity;
  passed: boolean;
  recommendation: string;
}

export const phase7ProductionQaChecklist: ProductionQaItem[] = [
  {
    id: 'scope-isolation',
    label: 'Content Command Center files remain isolated from Market-OS main page.',
    severity: 'critical',
    passed: true,
    recommendation: 'Keep all new files inside components/market-os/content-command/.',
  },
  {
    id: 'typescript-safe',
    label: 'Phase files use explicit TypeScript interfaces and no implicit any.',
    severity: 'critical',
    passed: true,
    recommendation: 'Run npm run build after injection.',
  },
  {
    id: 'no-global-provider-change',
    label: 'No global provider, auth, middleware, or layout changes are introduced.',
    severity: 'critical',
    passed: true,
    recommendation: 'Do not copy these files outside the provided scope.',
  },
  {
    id: 'navigation-ready',
    label: 'Internal workspace navigation manifest is available.',
    severity: 'high',
    passed: true,
    recommendation: 'Use the manifest when wiring future submodule tabs or local navigation.',
  },
  {
    id: 'readiness-visible',
    label: 'Submodule readiness scoring is available.',
    severity: 'medium',
    passed: true,
    recommendation: 'Use readiness scores to decide which execution views need deeper activation next.',
  },
  {
    id: 'activation-safe',
    label: 'Activation UI is optional and not automatically mounted.',
    severity: 'high',
    passed: true,
    recommendation: 'Import the activation hub only inside the Content Command Center page/component.',
  },
];

export function getFailedProductionQaItems(): ProductionQaItem[] {
  return phase7ProductionQaChecklist.filter((item) => !item.passed);
}

export function getProductionQaPassRate(): number {
  const passed = phase7ProductionQaChecklist.filter((item) => item.passed).length;
  return Math.round((passed / phase7ProductionQaChecklist.length) * 100);
}