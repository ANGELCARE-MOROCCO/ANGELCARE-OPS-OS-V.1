export type NativeMediaAsset = {
  id: string;
  url: string;
  title: string;
  fileName: string;
  mime: string;
  size: number;
  status: string;
  rights: string;
  expiresAt: string | null;
  processingState: string;
  width: number;
  height: number;
  alt: string;
  assetKey: string;
  folderId: string;
  folderName: string;
  collection: string;
  category: string;
  language: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  usageCount: number | null;
  variants: number | null;
};
export type MediaClientFilters = {
  orientation: string;
  ratio: string;
  category: string;
  collection: string;
  language: string;
  tag: string;
  uploader: string;
  used: string;
  dateRange: string;
  readyOnly: boolean;
  hasAlt: boolean;
  publishedSafe: boolean;
  unusedOnly: boolean;
};
const str = (v: unknown) => typeof v === "string" ? v : "";
const n = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : 0;
export function normalizeNativeAsset(raw: Record<string, unknown>): NativeMediaAsset {
  const meta = raw.metadata && typeof raw.metadata === "object" ? raw.metadata as Record<string, unknown> : {};
  const tags = raw.tags ?? meta.tags;
  return {
    id: str(raw.id), url: str(raw.url), title: str(raw.title || raw.fileName || raw.assetKey),
    fileName: str(raw.fileName || raw.title), mime: str(raw.mime), size: n(raw.size),
    status: str(raw.status), rights: str(raw.rights), expiresAt: str(raw.expiresAt) || null,
    processingState: str(raw.processingState || raw.optimizationStatus),
    width: n(raw.width || meta.width), height: n(raw.height || meta.height),
    alt: str(raw.alt), assetKey: str(raw.assetKey), folderId: str(raw.folderId),
    folderName: str(raw.folderName), collection: str(raw.collection), category: str(raw.category),
    language: str(raw.language), uploadedBy: str(raw.uploadedBy),
    createdAt: str(raw.createdAt), updatedAt: str(raw.updatedAt),
    tags: Array.isArray(tags) ? tags.filter((v): v is string => typeof v === "string") : [],
    usageCount: raw.usageCount === null || raw.usageCount === undefined ? null : n(raw.usageCount),
    variants: raw.variants === null || raw.variants === undefined ? null : n(raw.variants),
  };
}
export function assetIssue(a: NativeMediaAsset, now = Date.now()): string {
  if (!a.id || !a.url) return "No native media delivery URL";
  if (!/^\/(?!\/)|^https:\/\//i.test(a.url)) return "Unsupported media URL";
  if (!a.mime.startsWith("image/")) return "This placement requires an image";
  if (a.status && a.status !== "active") return "Asset is not active";
  if (a.expiresAt && Number.isFinite(Date.parse(a.expiresAt)) && Date.parse(a.expiresAt) <= now) return "Media rights expired";
  if (["rejected", "revoked", "denied", "blocked", "expired"].includes(a.rights.toLowerCase())) return "Media rights are not approved";
  return "";
}
export function publishedSafe(a: NativeMediaAsset, now = Date.now()): boolean {
  return !assetIssue(a, now) && ["approved", "cleared", "verified", "owned", "licensed", "rights_approved"].includes(a.rights.toLowerCase());
}
export function mediaPassesClientFilters(a: NativeMediaAsset, f: MediaClientFilters): boolean {
  const ratio = a.width > 0 && a.height > 0 ? a.width / a.height : 0;
  const match = (value: string, filter: string) => !filter || value.toLowerCase().includes(filter.toLowerCase());
  if (f.orientation && (!ratio || (f.orientation === "square" ? Math.abs(ratio - 1) > .04 : f.orientation === "landscape" ? ratio <= 1.04 : ratio >= .96))) return false;
  if (f.ratio && (!ratio || (f.ratio === "1:1" ? Math.abs(ratio - 1) > .04 : f.ratio === "16:9" ? Math.abs(ratio - 16 / 9) > .16 : f.ratio === "4:3" ? Math.abs(ratio - 4 / 3) > .12 : Math.abs(ratio - 3 / 4) > .12))) return false;
  if (!match(a.category, f.category) || !match(a.collection, f.collection) || !match(a.language, f.language) || !match(a.uploadedBy, f.uploader)) return false;
  if (f.tag && !a.tags.some(tag => match(tag, f.tag))) return false;
  if (f.dateRange) {
    const days = Number(f.dateRange);
    const stamp = Date.parse(a.updatedAt || a.createdAt);
    if (!Number.isFinite(days) || !Number.isFinite(stamp) || Date.now() - stamp > days * 86400000) return false;
  }
  if (f.readyOnly && !["ready", "complete", "completed", "optimized"].includes(a.processingState.toLowerCase())) return false;
  if (f.hasAlt && !a.alt.trim()) return false;
  if (f.publishedSafe && !publishedSafe(a)) return false;
  if (f.unusedOnly && a.usageCount !== 0) return false;
  if (f.used === "used" && (a.usageCount === null || a.usageCount < 1)) return false;
  return true;
}
export function addUniqueAssets(current: NativeMediaAsset[], incoming: NativeMediaAsset[], max: number, blocked: readonly string[] = []): NativeMediaAsset[] {
  const ids = new Set([...blocked, ...current.map(x => x.id)]);
  const result = [...current];
  for (const asset of incoming) {
    if (result.length >= max) break;
    if (ids.has(asset.id) || assetIssue(asset)) continue;
    ids.add(asset.id);
    result.push(asset);
  }
  return result;
}
export function reorderAsset<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length || from === to) return items;
  const result = [...items];
  result.splice(to, 0, result.splice(from, 1)[0]);
  return result;
}
