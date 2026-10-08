import type {MarketplaceRequestContext} from '../domain/types'
import {executiveAuthoritySummary} from '../final-authority/repository'
import {conversionAdminSummary} from '../conversion-universe/repository'
import {frontendControlSnapshot} from '../total-commerce-control/repository'
import {localizationSummary} from '../localization-intelligence/repository'
import type {GrowthExperienceSnapshot} from './types'

export async function growthExperienceSnapshot(context: MarketplaceRequestContext): Promise<GrowthExperienceSnapshot> {
  const [authority, conversion, frontendSnapshot, localization] = await Promise.all([
    executiveAuthoritySummary(context),
    conversionAdminSummary(context),
    frontendControlSnapshot(),
    localizationSummary(),
  ])
  return {
    authority,
    conversion,
    frontend: frontendSnapshot.metrics,
    localization: {
      totalCandidates: localization.totalCandidates,
      missing: localization.missingEn + localization.missingAr,
      stale: localization.staleEn + localization.staleAr,
      sensitiveBlockers: localization.blocked,
      truthfulCoverage: localization.totalCandidates
        ? ((localization.enComplete + localization.arComplete) / (localization.totalCandidates * 2)) * 100
        : 100,
    },
  }
}
