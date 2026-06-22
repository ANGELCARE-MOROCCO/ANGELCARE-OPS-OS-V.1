import type { ProductionQaItem } from './phase7-production-qa';

export interface DetectedContentCommandIssue {
  id: string;
  title: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

export function detectContentCommandIssues(qaItems: ProductionQaItem[]): DetectedContentCommandIssue[] {
  return qaItems
    .filter((item) => !item.passed)
    .map((item) => ({
      id: `issue-${item.id}`,
      title: item.label,
      severity: item.severity === 'critical' ? 'critical' : item.severity === 'high' ? 'warning' : 'info',
      message: item.recommendation,
    }));
}