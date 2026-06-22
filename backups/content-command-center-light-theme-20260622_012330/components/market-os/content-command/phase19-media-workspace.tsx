'use client';

import React, { useMemo, useState } from 'react';
import {
  phase19MediaAssets,
  phase19MediaVersions,
  phase19PreviewMetadata,
  phase19StorageBucketMap,
} from './phase19-media-data';
import {
  countPhase19AssetsNeedingReview,
  getPhase19GovernanceLabel,
  getPhase19MediaRisk,
  getPhase19UploadLabel,
} from './phase19-media-helpers';
import type { Phase19MediaAsset } from './phase19-media-types';

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase19MediaWorkspace(): React.ReactElement {
  const [selectedAssetId, setSelectedAssetId] = useState<string>(phase19MediaAssets[0]?.id ?? '');

  const selectedAsset = useMemo<Phase19MediaAsset | undefined>(
    () => phase19MediaAssets.find((asset) => asset.id === selectedAssetId),
    [selectedAssetId]
  );

  const selectedVersions = useMemo(
    () => phase19MediaVersions.filter((version) => version.assetId === selectedAssetId),
    [selectedAssetId]
  );

  const selectedPreview = useMemo(
    () => phase19PreviewMetadata.find((preview) => preview.assetId === selectedAssetId),
    [selectedAssetId]
  );

  const reviewCount = countPhase19AssetsNeedingReview(phase19MediaAssets);

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-9500">
          Content Command Center
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Phase 19 Media Operations
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Media readiness layer for upload states, storage buckets, previews, asset governance,
          version tracking, and future media pipelines.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Media Assets</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{phase19MediaAssets.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Needs Review</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{reviewCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Storage Buckets</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{phase19StorageBucketMap.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Media Asset Registry</h3>
          <div className="mt-5 space-y-3">
            {phase19MediaAssets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => setSelectedAssetId(asset.id)}
                className="w-full rounded-2xl border border-slate-100 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{asset.title}</p>
                    <p className="mt-1 text-xs text-slate-9500">
                      {asset.format} · {asset.campaign} · Owner: {asset.owner} · {asset.sizeLabel}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{getPhase19UploadLabel(asset.uploadState)}</Badge>
                    <Badge>{getPhase19GovernanceLabel(asset.governance)}</Badge>
                    <Badge>v{asset.version}</Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">Selected Asset Detail</h3>
            {selectedAsset ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-sm font-bold text-slate-950">{selectedAsset.title}</p>
                  <p className="mt-1 text-xs text-slate-9500">
                    Risk: {getPhase19MediaRisk(selectedAsset)} · Updated: {selectedAsset.updatedAt}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge>{selectedAsset.format}</Badge>
                    <Badge>{selectedAsset.uploadState}</Badge>
                    <Badge>{selectedAsset.governance}</Badge>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Preview Metadata</p>
                  <p className="mt-2 text-sm text-slate-700">
                    {selectedPreview
                      ? `${selectedPreview.previewType}${selectedPreview.dimensions ? ` · ${selectedPreview.dimensions}` : ''}${selectedPreview.duration ? ` · ${selectedPreview.duration}` : ''}${selectedPreview.pages ? ` · ${selectedPreview.pages} pages` : ''}`
                      : 'No preview metadata available.'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-5 text-sm text-slate-600">No asset selected.</p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">Version History</h3>
            <div className="mt-5 space-y-3">
              {selectedVersions.length > 0 ? (
                selectedVersions.map((version) => (
                  <article key={version.id} className="rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">Version {version.version}</p>
                        <p className="mt-1 text-xs text-slate-9500">
                          {version.createdBy} · {version.createdAt}
                        </p>
                        <p className="mt-3 text-sm text-slate-600">{version.changeNote}</p>
                      </div>
                      <Badge>v{version.version}</Badge>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                  No version history available for this asset.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950">Storage Bucket Mapping</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {phase19StorageBucketMap.map((bucket) => (
            <article key={bucket.bucketName} className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-950">{bucket.bucketName}</p>
                  <p className="mt-1 text-xs text-slate-9500">
                    {bucket.format} · Max {bucket.maxSizeMb} MB
                  </p>
                  <p className="mt-3 text-sm text-slate-600">{bucket.notes}</p>
                </div>
                <Badge>{bucket.format}</Badge>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase19MediaWorkspace;