import type { Config } from "./model";

export type NativeImageRecord = {
  id: string;
  status: string;
  mime_type: string | null;
  public_url?: string | null;
  desktop_url?: string | null;
  rights_expires_at?: string | null;
  metadata?: { status?: string | null } | null;
};

/** No timers or browser dependencies: prevents failed slides from being revisited. */
export function nextPlayableIndex(
  images: readonly { id: string }[],
  index: number,
  unavailable: ReadonlySet<string>,
  direction: 1 | -1 = 1,
  loop = true,
): number | null {
  if (images.length === 0 || index < 0 || index >= images.length) return null;
  for (let step = 1; step <= images.length; step++) {
    const raw = index + step * direction;
    if (!loop && (raw < 0 || raw >= images.length)) return null;
    const candidate = (raw + images.length * (step + 1)) % images.length;
    if (!unavailable.has(images[candidate].id)) return candidate;
  }
  return null;
}

function canonical(
  record: NativeImageRecord | undefined,
  id: string,
  validUrl: (url: string, id: string) => boolean,
  now: number,
): string {
  if (!record || record.id !== id || record.status !== "active" ||
      !record.mime_type?.startsWith("image/") || record.metadata?.status === "failed") return "";
  if (record.rights_expires_at) {
    const until = Date.parse(record.rights_expires_at);
    if (!Number.isFinite(until) || until <= now) return "";
  }
  const url = record.public_url || record.desktop_url || "";
  return url && validUrl(url, id) ? url : "";
}

/** Use only current, active, authorized native-vault URLs; never trust a stale saved URL.
 * Invalid desktop images are excluded. Invalid optional mobile variants fall
 * back to their authorized desktop source rather than removing the whole scene.
 * The input and immutable published snapshot are never mutated.
 */
export function reconcilePublishedImagery(
  config: Config,
  records: readonly NativeImageRecord[],
  validUrl: (url: string, id: string) => boolean,
  now = Date.now(),
): { config: Config; rejected: number; refreshed: number; mobileFallbacks: number } {
  const native = new Map(records.map(record => [record.id, record]));
  let rejected = 0, refreshed = 0, mobileFallbacks = 0;
  const slotCounts: Record<string, {
    published: number; enabledPublished: number; delivered: number;
    enabledDelivered: number; rejected: number; mobileFallbacks: number;
  }> = {};
  const slots: Config["slots"] = {};
  for (const [slotId, placement] of Object.entries(config.slots)) {
    const resolved: typeof placement.images = [];
    let slotRejected = 0, slotMobileFallbacks = 0;
    for (const scene of placement.images) {
      const src = canonical(native.get(scene.assetId), scene.assetId, validUrl, now);
      if (!src) { rejected++; slotRejected++; continue; }
      let mobile = "";
      let mobileAssetId = "";
      if (scene.mobile) {
        mobile = canonical(native.get(scene.mobileAssetId), scene.mobileAssetId, validUrl, now);
        if (mobile) mobileAssetId = scene.mobileAssetId;
        else { mobileFallbacks++; slotMobileFallbacks++; }
      }
      if (scene.src !== src || (!!mobile && scene.mobile !== mobile)) refreshed++;
      resolved.push({ ...scene, src, mobile, mobileAssetId });
    }
    slotCounts[slotId] = {
      published: placement.images.length,
      enabledPublished: placement.images.filter(scene => scene.enabled).length,
      delivered: resolved.length,
      enabledDelivered: resolved.filter(scene => scene.enabled).length,
      rejected: slotRejected,
      mobileFallbacks: slotMobileFallbacks,
    };
    // If a configured slot loses every authorized image, use the original page
    // artwork again rather than mounting a managed component with nothing to show.
    if (placement.images.length > 0 && resolved.length === 0) continue;
    slots[slotId] = { ...placement, images: resolved };
  }
  return { config: { ...config, slots }, rejected, refreshed, mobileFallbacks, slotCounts };
}
