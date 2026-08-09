import type {
  Phase19GovernanceState,
  Phase19MediaAsset,
  Phase19UploadState,
} from './phase19-media-types';

export function getPhase19UploadLabel(state: Phase19UploadState): string {
  const labels: Record<Phase19UploadState, string> = {
    idle: 'Idle',
    queued: 'Queued',
    uploading: 'Uploading',
    processing: 'Processing',
    ready: 'Ready',
    failed: 'Failed',
  };

  return labels[state];
}

export function getPhase19GovernanceLabel(state: Phase19GovernanceState): string {
  const labels: Record<Phase19GovernanceState, string> = {
    approved: 'Approved',
    needs_review: 'Needs review',
    outdated: 'Outdated',
    restricted: 'Restricted',
  };

  return labels[state];
}

export function getPhase19MediaRisk(asset: Phase19MediaAsset): 'low' | 'medium' | 'high' {
  if (asset.governance === 'restricted' || asset.uploadState === 'failed') return 'high';
  if (asset.governance === 'outdated' || asset.governance === 'needs_review') return 'medium';
  if (asset.uploadState !== 'ready') return 'medium';
  return 'low';
}

export function countPhase19AssetsNeedingReview(assets: Phase19MediaAsset[]): number {
  return assets.filter((asset) => asset.governance !== 'approved').length;
}