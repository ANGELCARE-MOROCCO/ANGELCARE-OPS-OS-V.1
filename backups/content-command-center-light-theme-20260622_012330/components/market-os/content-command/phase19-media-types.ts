export type Phase19MediaFormat =
  | 'image'
  | 'video'
  | 'pdf'
  | 'presentation'
  | 'audio'
  | 'document';

export type Phase19UploadState =
  | 'idle'
  | 'queued'
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'failed';

export type Phase19GovernanceState =
  | 'approved'
  | 'needs_review'
  | 'outdated'
  | 'restricted';

export interface Phase19MediaAsset {
  id: string;
  title: string;
  format: Phase19MediaFormat;
  campaign: string;
  owner: string;
  sizeLabel: string;
  uploadState: Phase19UploadState;
  governance: Phase19GovernanceState;
  version: number;
  updatedAt: string;
}

export interface Phase19MediaVersion {
  id: string;
  assetId: string;
  version: number;
  changeNote: string;
  createdBy: string;
  createdAt: string;
}

export interface Phase19StorageBucketMap {
  format: Phase19MediaFormat;
  bucketName: string;
  maxSizeMb: number;
  notes: string;
}

export interface Phase19PreviewMetadata {
  assetId: string;
  previewType: 'thumbnail' | 'embedded_preview' | 'download_only';
  dimensions?: string;
  duration?: string;
  pages?: number;
}