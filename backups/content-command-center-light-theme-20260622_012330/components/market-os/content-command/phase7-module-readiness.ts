export type ReadinessArea =
  | 'structure'
  | 'content-operations'
  | 'campaign-product'
  | 'brand-social'
  | 'approvals-analytics'
  | 'ai-automation'
  | 'stabilization';

export interface ModuleReadinessScore {
  area: ReadinessArea;
  label: string;
  score: number;
  notes: string[];
}

export const contentCommandReadinessScores: ModuleReadinessScore[] = [
  {
    area: 'structure',
    label: 'Structure & Navigation',
    score: 92,
    notes: ['Submodule boundaries are isolated.', 'Internal workspace navigation is defined.'],
  },
  {
    area: 'content-operations',
    label: 'Content Operations',
    score: 86,
    notes: ['Asset lifecycle models exist.', 'Execution views can be connected safely.'],
  },
  {
    area: 'campaign-product',
    label: 'Campaign & Product Execution',
    score: 84,
    notes: ['Campaign deliverables and product sheet structures are defined.'],
  },
  {
    area: 'brand-social',
    label: 'Brand & Social Command',
    score: 83,
    notes: ['Brand governance and social publishing states are defined.'],
  },
  {
    area: 'approvals-analytics',
    label: 'Approvals & Analytics',
    score: 85,
    notes: ['Approval workflow, audit, and KPI models are available.'],
  },
  {
    area: 'ai-automation',
    label: 'AI & Automation',
    score: 82,
    notes: ['AI actions, automation rules, alerts, and scoring helpers are available.'],
  },
  {
    area: 'stabilization',
    label: 'Stabilization',
    score: 90,
    notes: ['Phase 7 QA helpers and activation manifest are now included.'],
  },
];

export function getOverallContentCommandReadiness(): number {
  const total = contentCommandReadinessScores.reduce((sum, item) => sum + item.score, 0);
  return Math.round(total / contentCommandReadinessScores.length);
}