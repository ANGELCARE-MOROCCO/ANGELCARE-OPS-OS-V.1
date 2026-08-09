import type { ContentQualityScore } from './phase6-ai-automation-types';

export interface ContentQualityInput {
  contentId: string;
  hasSeoTitle: boolean;
  hasSeoDescription: boolean;
  hasPrimaryCta: boolean;
  hasCampaignLink: boolean;
  hasAudience: boolean;
  hasApprovedBrandAsset: boolean;
  hasTranslationFr: boolean;
  hasTranslationAr: boolean;
  hasTranslationEn: boolean;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateContentQualityScore(input: ContentQualityInput): ContentQualityScore {
  const seo = clampScore(
    Number(input.hasSeoTitle) * 45 +
    Number(input.hasSeoDescription) * 45 +
    Number(input.hasCampaignLink) * 10
  );

  const clarity = clampScore(
    Number(input.hasAudience) * 50 +
    Number(input.hasPrimaryCta) * 50
  );

  const brandFit = clampScore(
    Number(input.hasApprovedBrandAsset) * 100
  );

  const conversionStrength = clampScore(
    Number(input.hasPrimaryCta) * 60 +
    Number(input.hasAudience) * 20 +
    Number(input.hasCampaignLink) * 20
  );

  const completeness = clampScore(
    Number(input.hasSeoTitle) * 10 +
    Number(input.hasSeoDescription) * 10 +
    Number(input.hasPrimaryCta) * 15 +
    Number(input.hasCampaignLink) * 15 +
    Number(input.hasAudience) * 15 +
    Number(input.hasApprovedBrandAsset) * 15 +
    Number(input.hasTranslationFr) * 7 +
    Number(input.hasTranslationAr) * 7 +
    Number(input.hasTranslationEn) * 6
  );

  const total = clampScore((seo + clarity + brandFit + conversionStrength + completeness) / 5);

  return {
    contentId: input.contentId,
    seo,
    clarity,
    brandFit,
    conversionStrength,
    completeness,
    total,
  };
}