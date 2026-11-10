"use client";

import { useEffect, useState } from "react";
import type { Config } from "./model";
import s from "./live-delivery-inspector.module.css";

type Delivery = {
  config?: Config;
  diagnostics?: {
    status?: string;
    slots?: Record<string, {
      published: number;
      enabledPublished: number;
      delivered: number;
      enabledDelivered: number;
      rejected: number;
      mobileFallbacks: number;
    }>;
  };
};
type Props = {
  placementId: string;
  draft: Config;
  live: Config;
  liveDelivery: Delivery | null;
  liveHostname: string;
  previewVisible: boolean;
  onRefresh: () => Promise<void>;
};
type Probe = { passed: number; failed: number; sample: number; errors: string[] };

export function LiveDeliveryInspector({
  placementId, draft, live, liveDelivery, liveHostname, previewVisible, onRefresh,
}: Props) {
  const [probe, setProbe] = useState<Probe | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const published = live.slots[placementId];
  const resolved = liveDelivery?.config?.slots[placementId];
  const stats = liveDelivery?.diagnostics?.slots?.[placementId];
  const changed = JSON.stringify(draft.slots[placementId] ?? null) !==
    JSON.stringify(published ?? null);
  const mode = published?.mode || "original";
  const enabled = published?.images.filter(image => image.enabled).length ?? 0;
  const resolvedImages = resolved?.images.filter(image => image.enabled) || [];
  const status = liveDelivery?.diagnostics?.status || "no-publication";
  const hasMissing = !!(stats && stats.enabledDelivered < stats.enabledPublished);
  const noPayload = !!(published && enabled > 0 && status === "published" && !resolvedImages.length);
  useEffect(() => { setProbe(null); }, [placementId, liveDelivery]);

  async function verifyFiles() {
    setBusy(true);
    const host = liveHostname && !/[\s/@]/.test(liveHostname)
      ? "https://" + liveHostname : location.origin;
    let passed = 0;
    const errors: string[] = [];
    try {
      for (const [position, item] of resolvedImages.entries()) {
        const url = new URL(item.src, host).href;
        const img = new Image();
        img.src = url;
        try {
          await Promise.race([
            img.decode(),
            new Promise<never>((_, reject) => {
              // decode is browser-native; bounded failure avoids a hung admin audit.
              window.setTimeout(() => reject(Error("Image load timed out")), 8000);
            }),
          ]);
          if (img.naturalWidth < 1 || img.naturalHeight < 1) throw Error("Empty image");
          passed++;
        } catch {
          errors.push("Image " + (position + 1) + " could not be decoded on " + liveHostname);
        }
      }
      setProbe({ passed, failed: errors.length, sample: resolvedImages.length, errors });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={s.root} aria-label="Published image delivery audit">
      <div className={s.topline}>
        <div><span className={s.eyebrow}>PUBLIC DELIVERY AUDIT</span><h3>What is actually published?</h3></div>
        <span className={s.state} data-problem={hasMissing || noPayload || status !== "published"}>
          {status === "published" && !hasMissing && !noPayload ? "Resolved" :
            status === "published" ? "Needs attention" : status.replaceAll("-", " ")}
        </span>
      </div>
      <div className={s.metrics}>
        <div><strong>{stats?.published ?? published?.images.length ?? 0}</strong><small>Published</small></div>
        <div><strong>{stats?.enabledPublished ?? enabled}</strong><small>Enabled</small></div>
        <div data-warning={hasMissing || noPayload}><strong>{stats?.enabledDelivered ?? resolvedImages.length}</strong><small>Delivered</small></div>
        <div data-warning={!!stats?.rejected}><strong>{stats?.rejected ?? 0}</strong><small>Rejected</small></div>
      </div>
      <div className={s.settings}>
        <span>Mode: <b>{mode}</b></span>
        <span>Autoplay: <b>{published?.autoplay ? "ON" : "OFF"}</b></span>
        <span>Loop: <b>{published?.loop ? "ON" : "OFF"}</b></span>
        <span>Visitor arrows: <b>{published?.controls ? "ON" : "OFF"}</b></span>
      </div>
      <p className={s.host}>Public hostname: <strong>{liveHostname || "No published hostname"}</strong></p>
      {changed ? <p className={s.caution}>Your editor contains unpublished changes. The values above describe the published version.</p> : null}
      {hasMissing || noPayload ? <p role="alert" className={s.alert}>
        Some published images are not reaching the public delivery response. This is not a successful storefront verification.
      </p> : null}
      {status !== "published" ? <p role="status" className={s.alert}>
        No verified public configuration for this hostname: {status.replaceAll("-", " ")}.
      </p> : null}
      <p className={s.note}>
        {previewVisible ? "Placement observed in workspace preview." : "Placement not observed in workspace preview."}
        {" "}The preview is not proof of live browser display.
      </p>
      {probe ? <div className={s.probe} data-failed={probe.failed > 0}>
        Browser image check: <b>{probe.passed}/{probe.sample} decoded</b>
        {probe.failed ? <small>{probe.errors.slice(0,3).join(" · ")}</small> : null}
      </div> : null}
      <div className={s.actions}>
        <button type="button" disabled={refreshing} onClick={async () => {
          setRefreshing(true);
          try { await onRefresh(); } finally { setRefreshing(false); }
        }}>{refreshing ? "Checking…" : "Refresh live delivery"}</button>
        <button type="button" disabled={busy || !resolvedImages.length}
          onClick={() => void verifyFiles()}>{busy ? "Testing…" : "Verify delivered images"}</button>
      </div>
    </section>
  );
}
