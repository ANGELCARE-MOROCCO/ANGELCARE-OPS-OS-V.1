import type {
  Phase18ContentPerformance,
  Phase18RoiSummary,
} from './phase18-analytics-types';

export function calculatePhase18EngagementRate(item: Phase18ContentPerformance): number {
  if (item.views <= 0) return 0;
  return Math.round((item.engagements / item.views) * 1000) / 10;
}

export function calculatePhase18ConversionRate(item: Phase18ContentPerformance): number {
  if (item.leads <= 0) return 0;
  return Math.round((item.conversions / item.leads) * 1000) / 10;
}

export function calculatePhase18RoiSummary(items: Phase18ContentPerformance[]): Phase18RoiSummary {
  const totalRevenueMad = items.reduce((sum, item) => sum + item.revenueMad, 0);
  const totalConversions = items.reduce((sum, item) => sum + item.conversions, 0);
  const totalLeads = items.reduce((sum, item) => sum + item.leads, 0);

  return {
    totalRevenueMad,
    totalConversions,
    totalLeads,
    estimatedRoiPercent: totalLeads > 0 ? Math.round((totalConversions / totalLeads) * 1000) / 10 : 0,
  };
}

export function formatPhase18Mad(value: number): string {
  return `${value.toLocaleString('fr-MA')} MAD`;
}