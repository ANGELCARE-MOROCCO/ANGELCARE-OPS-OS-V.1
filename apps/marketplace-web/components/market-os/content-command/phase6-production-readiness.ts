export interface ProductionReadinessItem {
  id: string;
  label: string;
  completed: boolean;
  owner: 'content' | 'brand' | 'workflow' | 'analytics' | 'automation';
}

export const phase6ProductionReadinessChecklist: ProductionReadinessItem[] = [
  {
    id: 'ccc-ai-actions',
    label: 'AI action definitions are available for captions, rewriting, translation, SEO, and campaign variants.',
    completed: true,
    owner: 'automation',
  },
  {
    id: 'ccc-automation-rules',
    label: 'Automation rules exist for campaign creation, asset uploads, reviews, approvals, and missed deadlines.',
    completed: true,
    owner: 'automation',
  },
  {
    id: 'ccc-quality-scoring',
    label: 'Content quality scoring exists for SEO, clarity, brand fit, conversion strength, and completeness.',
    completed: true,
    owner: 'analytics',
  },
  {
    id: 'ccc-alerts',
    label: 'Operational alert logic exists for weak SEO, weak readiness, and brand governance issues.',
    completed: true,
    owner: 'workflow',
  },
  {
    id: 'ccc-isolated-scope',
    label: 'Phase 6 files stay isolated inside Content Command Center only.',
    completed: true,
    owner: 'workflow',
  },
];

export function getPhase6ReadinessPercent(): number {
  const total = phase6ProductionReadinessChecklist.length;
  const completed = phase6ProductionReadinessChecklist.filter((item) => item.completed).length;
  return Math.round((completed / total) * 100);
}