import type { ContentQualityScore, OperationalAlert } from './phase6-ai-automation-types';

export function buildQualityAlerts(score: ContentQualityScore): OperationalAlert[] {
  const alerts: OperationalAlert[] = [];

  if (score.seo < 60) {
    alerts.push({
      id: `${score.contentId}-seo-alert`,
      title: 'SEO quality requires attention',
      message: 'This content is missing important SEO fields or campaign structure.',
      severity: 'warning',
      linkedAssetId: score.contentId,
      resolved: false,
      createdAt: new Date().toISOString(),
    });
  }

  if (score.brandFit < 80) {
    alerts.push({
      id: `${score.contentId}-brand-alert`,
      title: 'Brand governance issue',
      message: 'This content needs an approved brand asset or brand validation.',
      severity: 'critical',
      linkedAssetId: score.contentId,
      resolved: false,
      createdAt: new Date().toISOString(),
    });
  }

  if (score.total < 65) {
    alerts.push({
      id: `${score.contentId}-quality-alert`,
      title: 'Content readiness is weak',
      message: 'This content should not be published before quality improvements.',
      severity: 'warning',
      linkedAssetId: score.contentId,
      resolved: false,
      createdAt: new Date().toISOString(),
    });
  }

  return alerts;
}