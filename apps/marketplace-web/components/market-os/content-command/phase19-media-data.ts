import type {
  Phase19MediaAsset,
  Phase19MediaVersion,
  Phase19PreviewMetadata,
  Phase19StorageBucketMap,
} from './phase19-media-types';

export const phase19MediaAssets: Phase19MediaAsset[] = [
  {
    id: 'media-001',
    title: 'Core service brochure PDF',
    format: 'pdf',
    campaign: 'Core Services',
    owner: 'Content Lead',
    sizeLabel: '4.8 MB',
    uploadState: 'ready',
    governance: 'approved',
    version: 3,
    updatedAt: 'Recent',
  },
  {
    id: 'media-002',
    title: 'Trust campaign hero visual',
    format: 'image',
    campaign: 'Trust Campaign',
    owner: 'Designer',
    sizeLabel: '1.9 MB',
    uploadState: 'processing',
    governance: 'needs_review',
    version: 1,
    updatedAt: 'Recent',
  },
  {
    id: 'media-003',
    title: 'Family care explainer video',
    format: 'video',
    campaign: 'Family Care',
    owner: 'Marketing Ops',
    sizeLabel: '86 MB',
    uploadState: 'queued',
    governance: 'needs_review',
    version: 2,
    updatedAt: 'Recent',
  },
  {
    id: 'media-004',
    title: 'Old flyer template',
    format: 'image',
    campaign: 'Archive',
    owner: 'Brand Lead',
    sizeLabel: '900 KB',
    uploadState: 'ready',
    governance: 'outdated',
    version: 5,
    updatedAt: 'Older',
  },
];

export const phase19MediaVersions: Phase19MediaVersion[] = [
  {
    id: 'version-001',
    assetId: 'media-001',
    version: 3,
    changeNote: 'Updated CTA and pricing block.',
    createdBy: 'Content Lead',
    createdAt: 'Recent',
  },
  {
    id: 'version-002',
    assetId: 'media-001',
    version: 2,
    changeNote: 'Added French service section.',
    createdBy: 'Marketing',
    createdAt: 'Older',
  },
  {
    id: 'version-003',
    assetId: 'media-003',
    version: 2,
    changeNote: 'Shortened video intro.',
    createdBy: 'Marketing Ops',
    createdAt: 'Recent',
  },
];

export const phase19StorageBucketMap: Phase19StorageBucketMap[] = [
  {
    format: 'image',
    bucketName: 'market-content-images',
    maxSizeMb: 15,
    notes: 'Images, thumbnails, visual templates, and social creatives.',
  },
  {
    format: 'video',
    bucketName: 'market-content-videos',
    maxSizeMb: 300,
    notes: 'Campaign videos, reels, explainers, and video drafts.',
  },
  {
    format: 'pdf',
    bucketName: 'market-content-pdfs',
    maxSizeMb: 50,
    notes: 'Brochures, flyers, product sheets, and print-ready PDFs.',
  },
  {
    format: 'presentation',
    bucketName: 'market-content-presentations',
    maxSizeMb: 100,
    notes: 'Decks, partner presentations, and campaign presentations.',
  },
  {
    format: 'document',
    bucketName: 'market-content-documents',
    maxSizeMb: 25,
    notes: 'Copy drafts, content briefs, and planning documents.',
  },
  {
    format: 'audio',
    bucketName: 'market-content-audio',
    maxSizeMb: 80,
    notes: 'Voiceover drafts, audio notes, and campaign audio assets.',
  },
];

export const phase19PreviewMetadata: Phase19PreviewMetadata[] = [
  {
    assetId: 'media-001',
    previewType: 'embedded_preview',
    pages: 8,
  },
  {
    assetId: 'media-002',
    previewType: 'thumbnail',
    dimensions: '1080x1080',
  },
  {
    assetId: 'media-003',
    previewType: 'embedded_preview',
    dimensions: '1920x1080',
    duration: '00:45',
  },
  {
    assetId: 'media-004',
    previewType: 'thumbnail',
    dimensions: '1080x1350',
  },
];