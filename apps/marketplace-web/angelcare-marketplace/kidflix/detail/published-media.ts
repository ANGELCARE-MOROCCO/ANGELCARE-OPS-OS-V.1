/** Resolve only native references explicitly committed to an immutable public edition. */
export const MEDIA_REFERENCE_FIELDS = new Set([
  "assetId", "nativeAssetId", "narrationAssetId", "captionAssetId",
  "backAssetId", "coverAssetId", "posterAssetId",
]);
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export const publishedMediaUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID.test(value);

export function publishedMediaIds(manifest: Record<string, any>): string[] {
  const ids = new Set<string>();
  const visit = (value: unknown, key: string, depth: number): void => {
    if (depth > 32 || ids.size > 1000) throw Error("PUBLIC_MEDIA_LIMIT");
    if (typeof value === "string" && MEDIA_REFERENCE_FIELDS.has(key)) {
      if (publishedMediaUuid(value)) ids.add(value);
    } else if (Array.isArray(value)) {
      if (value.length > 2000) throw Error("PUBLIC_MEDIA_LIMIT");
      for (const item of value) {
        if (key === "outputs" && item && typeof item === "object" && (item as any).enabled === false) continue;
        visit(item, "", depth + 1);
      }
    } else if (value && typeof value === "object") {
      for (const [name, nested] of Object.entries(value)) visit(nested, name, depth + 1);
    }
  };
  visit(manifest.definition, "", 0);
  // Do not widen access using arbitrary historic bindings: only references
  // explicitly used by the immutable, public definition are eligible.
  if (ids.size > 1000) throw Error("PUBLIC_MEDIA_LIMIT");
  return [...ids];
}

export function publishedMediaMimeAllowed(manifest: Record<string, any>, id: string, mime: string): boolean {
  const d = manifest.definition || {};
  if (d.coverAssetId === id && !mime.startsWith("image/")) return false;
  if (Array.isArray(d.units)) for (const unit of d.units) {
    if (unit?.assetId !== id) continue;
    const expected: Record<string, string> = { pdf:"application/pdf", image:"image/", audio:"audio/", video:"video/" };
    const type = expected[unit.kind];
    if (type && !(type.endsWith("/") ? mime.startsWith(type) : mime === type)) return false;
  }
  if (Array.isArray(d.outputs)) for (const output of d.outputs) {
    if (output?.assetId === id && output.enabled !== false && output.mime && output.mime !== mime) return false;
  }
  return true;
}

/** Same cover route for search cards, Documents and every category storefront. */
export function publishedCoverHref(
  key: unknown, release: unknown, locale: unknown, cover: unknown,
): string {
  if (!publishedMediaUuid(release) || !publishedMediaUuid(cover) ||
      typeof key !== "string" || !/^[a-z0-9][a-z0-9._-]{1,119}$/.test(key) ||
      !["en", "fr", "ar"].includes(String(locale))) return "";
  return "/api/kidflix/cover?" + new URLSearchParams({
    locale: String(locale), key, release, // URLSearchParams encodes every parameter.
  }).toString();
}
