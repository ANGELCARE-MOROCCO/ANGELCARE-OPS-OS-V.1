import { normalizePlacement } from "../storefront-placement/model";
import type { CatalogLocale, DiscoveryItem } from "./types";
type Row = Record<string, unknown>;
const text = (v: unknown) => (typeof v === "string" ? v : "");
const nullable = (v: unknown) => text(v) || null;
const num = (v: unknown) =>
  v === null || v === undefined || v === "" ? null : Number(v);
const arr = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);
function local(row: Row, base: string, locale: CatalogLocale) {
  return (
    text(row[`${base}_${locale}`]) || text(row[`${base}_fr`]) || text(row[base])
  );
}
export function mapDiscoveryItem(
  row: Row,
  locale: CatalogLocale,
): DiscoveryItem {
  return {
    id: text(row.id),
    public_reference: text(row.public_reference),
    item_key: text(row.item_key),
    slug: text(row.slug),
    kind: text(row.kind) as DiscoveryItem["kind"],
    name: local(row, "name", locale),
    short_description: local(row, "short_description", locale) || null,
    description: local(row, "description", locale) || null,
    currency_label: text(row.currency_label) || "Dh",
    price_mode: text(row.price_mode) as DiscoveryItem["price_mode"],
    price_amount: num(row.price_amount),
    featured: Boolean(row.featured),
    availability_status: text(row.availability_status),
    territory_id: nullable(row.territory_id),
    category_key: nullable(row.category_key),
    category_title: local(row, "category_title", locale) || null,
    media_url: nullable(row.media_url),
    trust_labels: arr(row.trust_labels),
    metadata: {
      ...((row.commercial_metadata &&
      typeof row.commercial_metadata === "object"
        ? row.commercial_metadata
        : {}) as Record<string, unknown>),
      storefront_placement: normalizePlacement(row.storefront_placement),
      experience_schema_key: nullable(row.experience_schema_key),
      experience_schema_version: Number(row.experience_schema_version || 1),
      experience_configuration: (row.experience_configuration &&
      typeof row.experience_configuration === "object"
        ? row.experience_configuration
        : {}) as Record<string, unknown>,
    },
  };
}
