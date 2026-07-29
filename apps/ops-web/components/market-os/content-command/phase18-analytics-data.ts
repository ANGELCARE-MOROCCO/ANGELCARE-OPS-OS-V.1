import type {
  Phase18CampaignAttribution,
  Phase18ChannelMatrixRow,
  Phase18ContentPerformance,
  Phase18FunnelStage,
} from "./phase18-analytics-types"

/**
 * Legacy Phase 18 compatibility exports.
 *
 * Historic demo values were intentionally retired by Experience Reconstruction
 * Bulk 7. Empty arrays are truthful: Impact Observatory now derives every
 * observation, attribution and financial consequence from persisted, verified
 * publication-package evidence.
 */
export const phase18ContentPerformance: Phase18ContentPerformance[] = []
export const phase18CampaignAttribution: Phase18CampaignAttribution[] = []
export const phase18FunnelStages: Phase18FunnelStage[] = []
export const phase18ChannelMatrix: Phase18ChannelMatrixRow[] = []
