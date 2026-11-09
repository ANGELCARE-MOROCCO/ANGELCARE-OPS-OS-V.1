import type { Data, Locale } from "./types";

/** Native asset references; no additional storage schema or record identity. */
function asData(value: unknown): Data {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Data : {};
}
function asId(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
/** Specific language wins; shared editorial art is the zero-migration fallback. */
export function localizedCoverAssetId(data: Data, locale: Locale): string {
  return asId(asData(asData(data.locales)[locale]).coverAssetId);
}
export function effectiveCoverAssetId(data: Data, locale: Locale): string {
  return localizedCoverAssetId(data, locale) || asId(data.coverAssetId);
}
/** Remove a localized override rather than storing an empty key.
 * Preserve unrelated translations and avoid mutating the original draft.
 */
export function withLocalizedCoverAssetId(data: Data, locale: Locale, assetId: string | null): Data {
  const locales = asData(data.locales);
  const lang = { ...asData(locales[locale]) };
  const chosen = asId(assetId);
  if (chosen) lang.coverAssetId = chosen;
  else delete lang.coverAssetId;
  return { ...data, locales: { ...locales, [locale]: lang } };
}
