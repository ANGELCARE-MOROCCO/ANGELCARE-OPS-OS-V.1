import "server-only";
import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import { CATEGORY_NATIVE_EXPERIENCE_DEFINITIONS } from "../category-native-experience/registry";
import {
  optionText,
  schemaContract,
  schemaLabel,
} from "../atomic-dossier/contract";
import type {
  CatalogLocale,
  DiscoveryItem,
  StorefrontExperience,
} from "../catalog-discovery/types";
import type { BusinessKey } from "./content";
import {
  BUSINESS_COMMERCE_REVISION,
  COMMERCIAL_PROFILES,
  candidateReason,
  factValues,
  record,
  string,
  uniqueItems,
  type BusinessProjection,
  type PublicFact,
} from "./merchandising";

type Row = Record<string, unknown>;
const rows = (value: unknown): Row[] =>
  Array.isArray(value)
    ? value.filter(
        (row): row is Row =>
          !!row && typeof row === "object" && !Array.isArray(row),
      )
    : [];
const local = (row: Row, key: string, locale: CatalogLocale) =>
  string(row[`${key}_${locale}`]) ||
  string(row[`${key}_fr`]) ||
  string(row[key]);
const definitions = new Map(
  CATEGORY_NATIVE_EXPERIENCE_DEFINITIONS.map((definition) => [
    definition.schemaKey,
    definition,
  ]),
);
const PAGE = 240;
export interface ExposureRecord {
  itemId: string;
  itemKey: string;
  schema: string;
  categories: string[];
  included: boolean;
  reason: string;
  destination: string | null;
}
export interface BusinessExposure {
  version: string;
  world: BusinessKey;
  locale: CatalogLocale;
  territory: string | null;
  territoryId: string | null;
  records: ExposureRecord[];
  items: DiscoveryItem[];
}
export function businessTerritoryFromSearch(
  search: Record<string, string | string[] | undefined> | undefined,
): string | null {
  const value = search?.territory;
  return typeof value === "string" && /^[A-Z0-9][A-Z0-9_-]{1,39}$/.test(value)
    ? value
    : null;
}

function check(error: { message?: string } | null, operation: string): void {
  if (error) throw new Error(`Business storefront ${operation} failed`);
}
function publicFields(
  row: Row,
  locale: CatalogLocale,
  schema: string,
): PublicFact[] {
  const definition = definitions.get(schema),
    contract = schemaContract(schema);
  if (!definition || !contract) return [];
  const source = {
    ...record(row.commercial_metadata),
    ...record(row.attributes),
    ...record(row.experience_configuration),
  };
  // Both independent native registries must allow a field before it is projected.
  const allowed = new Set<string>(definition.publicFields);
  const excluded =
    /^(name|description|short_description|primary_image|status|price|pricing|starting_price|quotation_required|territory_codes)/;
  return Object.entries(contract.fields).flatMap(([key, field]) => {
    if (!allowed.has(key) || excluded.test(key)) return [];
    const values = factValues(source[key], locale);
    if (!values.length) return [];
    const label = field.labels[locale] || field.labels.fr;
    if (!label) return [];
    return [
      {
        key,
        label,
        value: values.map((value) => optionText(value, locale)).join(" · "),
        values,
      },
    ];
  });
}
function mapPublicItem(
  row: Row,
  locale: CatalogLocale,
  world: BusinessKey,
  categoryKeys: string[],
  reason: BusinessProjection["reason"],
): DiscoveryItem {
  const schema = string(row.experience_schema_key),
    definition = definitions.get(schema),
    configuration = record(row.experience_configuration);
  const facts = publicFields(row, locale, schema);
  const sourceLocale: CatalogLocale = string(row[`name_${locale}`])
    ? locale
    : "fr";
  const profile = COMMERCIAL_PROFILES[world];
  const primarySchemas = profile.segments
    .filter((segment) => !["quality", "guest", "family"].includes(segment.key))
    .flatMap((segment) => [...segment.schemas]);
  const business: BusinessProjection = {
    version: 1,
    schema,
    schemaLabel: schemaLabel(schema, locale),
    conversion: definition?.conversionTemplate || "",
    authority: definition?.availabilityAuthority || "",
    categories: categoryKeys,
    reason,
    lane:
      primarySchemas.includes(schema) ||
      world === "quality-check" ||
      world === "partner-os"
        ? "primary"
        : "related",
    fields: facts,
    sourceLocale,
  };
  // An explicit foreign key is the only allowed plan identity bridge; never infer it from names/prices.
  const planId = string(configuration.partner_plan_id);
  if (/^[0-9a-f-]{36}$/i.test(planId)) business.linkedPlanId = planId;
  const price =
    row.price_amount === null ||
    row.price_amount === undefined ||
    row.price_amount === ""
      ? null
      : Number(row.price_amount);
  const projectedConfig = Object.fromEntries(
    facts.map((field) => [field.key, field.values]),
  );
  return {
    id: string(row.id),
    public_reference: string(row.public_reference),
    item_key: string(row.item_key),
    slug: string(row.slug),
    kind: string(row.kind) as DiscoveryItem["kind"],
    name: local(row, "name", locale),
    short_description: local(row, "short_description", locale) || null,
    description: local(row, "description", locale) || null,
    currency_label: string(row.currency_label) || "Dh",
    price_mode: string(row.price_mode) as DiscoveryItem["price_mode"],
    price_amount: price !== null && Number.isFinite(price) ? price : null,
    featured: row.featured === true,
    availability_status: string(row.availability_status),
    territory_id: string(row.territory_id) || null,
    // Preserve the canonical primary category. Secondary merchandising must never change the native journey.
    category_key: string(row.category_key) || null,
    category_title: local(row, "category_title", locale) || null,
    media_url: string(row.media_url) || null,
    trust_labels: Array.isArray(row.trust_labels)
      ? row.trust_labels.filter(
          (value): value is string => typeof value === "string",
        )
      : [],
    metadata: {
      experience_schema_key: schema || null,
      experience_schema_version: Number(row.experience_schema_version || 1),
      experience_configuration: projectedConfig,
      business_storefront: business,
    },
  };
}

/** Request-scoped snapshot shared by the seven readers; no cross-request publication cache. */
const publicSnapshot = cache(
  async (
    locale: CatalogLocale,
    territory: string | null,
  ): Promise<{
    catalogue: Row[];
    memberships: Map<string, string[]>;
    territoryId: string | null;
  }> => {
    const db = await createServiceClient();
    const categories: Row[] = [];
    for (let offset = 0; ; offset += PAGE) {
      let query = db
        .from("angelcare_marketplace_catalog_categories")
        .select("id,category_key,locale,status,visible,territory_id")
        .in("locale", [...new Set([locale, "fr"])]);
      const result = await query.order("id").range(offset, offset + PAGE - 1);
      check(result.error, "category registry");
      const batch = rows(result.data);
      categories.push(...batch);
      if (batch.length < PAGE) break;
    }
    let territoryId: string | null = null;
    if (territory) {
      const result = await db
        .from("angelcare_marketplace_territories")
        .select("id")
        .eq("territory_code", territory)
        .maybeSingle();
      check(result.error, "territory resolution");
      if (!result.data?.id)
        throw new Error("Unknown business storefront territory");
      territoryId = String(result.data.id);
    }
    const inTerritory = (row: Row) =>
      !territoryId || !row.territory_id || row.territory_id === territoryId;
    const preferred = new Map<string, Row[]>();
    for (const row of categories.filter(inTerritory)) {
      const key = `${string(row.category_key)}:${string(row.territory_id)}`;
      const prior = preferred.get(key) || [];
      preferred.set(key, [...prior, row]);
    }
    const visibleKeys = new Set(
      [...preferred].flatMap(([key, candidates]) => {
        const chosen =
          candidates.find((row) => row.locale === locale) ||
          candidates.find((row) => row.locale === "fr");
        return chosen?.status === "published" && chosen.visible === true
          ? [key]
          : [];
      }),
    );
    const categoryById = new Map(
      categories
        .filter(
          (row) =>
            inTerritory(row) &&
            row.status === "published" &&
            row.visible === true &&
            visibleKeys.has(
              `${string(row.category_key)}:${string(row.territory_id)}`,
            ),
        )
        .map((row) => [string(row.id), string(row.category_key)]),
    );
    const catalogue: Row[] = [];
    for (let offset = 0; ; offset += PAGE) {
      let query = db
        .from("angelcare_marketplace_catalog_discovery_v")
        .select("*")
        .eq("status", "published");
      if (territoryId)
        query = query.or(`territory_id.is.null,territory_id.eq.${territoryId}`);
      const result = await query
        .order("featured", { ascending: false })
        .order("merchandising_priority", { ascending: false })
        .order("name_fr")
        .order("id")
        .range(offset, offset + PAGE - 1);
      check(result.error, "published catalogue");
      const batch = rows(result.data);
      catalogue.push(...batch);
      if (batch.length < PAGE) break;
    }
    const ids = [
        ...new Set(catalogue.map((row) => string(row.id)).filter(Boolean)),
      ],
      memberships = new Map<string, string[]>();
    for (let start = 0; start < ids.length; start += 100) {
      for (let offset = 0; ; offset += PAGE) {
        const result = await db
          .from("angelcare_marketplace_catalog_item_categories")
          .select("id,catalog_item_id,category_id")
          .in("catalog_item_id", ids.slice(start, start + 100))
          .order("id")
          .range(offset, offset + PAGE - 1);
        check(result.error, "public category memberships");
        const batch = rows(result.data);
        for (const row of batch) {
          const key = categoryById.get(string(row.category_id));
          if (!key) continue;
          const itemId = string(row.catalog_item_id);
          memberships.set(itemId, [
            ...new Set([...(memberships.get(itemId) || []), key]),
          ]);
        }
        if (batch.length < PAGE) break;
      }
    }
    // Only allowlisted attributes contribute to public facts/audience. No fulfilment or staff data is serialized.
    for (let start = 0; start < ids.length; start += 100) {
      const result = await db
        .from("angelcare_marketplace_catalog_items")
        .select("id,attributes")
        .eq("status", "published")
        .in("id", ids.slice(start, start + 100));
      check(result.error, "public offer fields");
      const attributes = new Map(
        rows(result.data).map((row) => [string(row.id), row.attributes]),
      );
      for (const row of catalogue)
        if (attributes.has(string(row.id)))
          row.attributes = attributes.get(string(row.id));
    }
    return { catalogue, memberships, territoryId };
  },
);

export async function businessExposure(
  world: BusinessKey,
  locale: CatalogLocale,
  territory: string | null = null,
): Promise<BusinessExposure> {
  const { catalogue, memberships, territoryId } = await publicSnapshot(
      locale,
      territory,
    ),
    records: ExposureRecord[] = [],
    items: DiscoveryItem[] = [];
  const audienceFor = (row: Row) => {
    const schema = string(row.experience_schema_key),
      allowed = new Set<string>(definitions.get(schema)?.publicFields || []);
    const source = {
      ...record(row.commercial_metadata),
      ...record(row.attributes),
      ...record(row.experience_configuration),
    };
    return [
      "intended_audience",
      "audience_types",
      "organization_type",
      "tenant_type",
      "partner_types",
      "property_types",
      "venue_types",
    ].flatMap((key) =>
      allowed.has(key) ? factValues(source[key], locale) : [],
    );
  };
  const professionalComponents = new Set(
    catalogue
      .filter(
        (row) =>
          (memberships.get(string(row.id)) || []).length &&
          candidateReason(
            "professionals",
            string(row.experience_schema_key),
            memberships.get(string(row.id)) || [],
            audienceFor(row),
          ),
      )
      .flatMap((row) => [string(row.id), string(row.item_key)].filter(Boolean)),
  );
  for (const row of catalogue) {
    const id = string(row.id),
      schema = string(row.experience_schema_key),
      categories = memberships.get(id) || [];
    const audience = audienceFor(row);
    if (world === "professionals" && schema === "certification-pathway") {
      const components = factValues(
        record(row.experience_configuration).component_course_keys,
        locale,
      );
      if (
        components.length &&
        components.every((key) => professionalComponents.has(key))
      )
        audience.push("professional");
    }
    // Offers solely in draft/hidden categories never become eligible through a schema bridge.
    const reason = categories.length
      ? candidateReason(world, schema, categories, audience)
      : null;
    const valid = Boolean(reason && id && string(row.slug));
    records.push({
      itemId: id,
      itemKey: string(row.item_key),
      schema,
      categories,
      included: valid,
      reason: valid
        ? reason!
        : !categories.length
          ? "NO_PUBLIC_CATEGORY"
          : !string(row.slug)
            ? "NO_PUBLIC_SLUG"
            : "OTHER_AUDIENCE_OR_DOCTRINE",
      destination: valid
        ? `/angelcare-marketplace/${locale}/marketplace/item/${encodeURIComponent(string(row.slug))}`
        : null,
    });
    if (valid)
      items.push(mapPublicItem(row, locale, world, categories, reason!));
  }
  return {
    version: BUSINESS_COMMERCE_REVISION,
    world,
    locale,
    territory,
    territoryId,
    records,
    items: uniqueItems(items),
  };
}

export async function prepareBusinessStorefront(
  experience: StorefrontExperience,
  world: BusinessKey,
): Promise<StorefrontExperience> {
  const exposure = await businessExposure(
    world,
    experience.locale,
    experience.territoryCode || null,
  );
  const canonical = new Map(exposure.items.map((item) => [item.id, item]));
  const collections = experience.collections
    .map((collection) => ({
      ...collection,
      items: uniqueItems(
        collection.items.flatMap((item) =>
          canonical.has(item.id) ? [canonical.get(item.id)!] : [],
        ),
      ),
    }))
    .filter((collection) => collection.items.length > 0);
  const facets: StorefrontExperience["facets"] = {};
  for (const [facet, get] of Object.entries({
    kind: (item: DiscoveryItem) => item.kind,
    availability: (item: DiscoveryItem) => item.availability_status,
    category: (item: DiscoveryItem) => item.category_key || "",
    schema: (item: DiscoveryItem) =>
      string(item.metadata.experience_schema_key),
  })) {
    const counts = new Map<string, number>();
    for (const item of exposure.items) {
      const value = get(item);
      if (value) counts.set(value, (counts.get(value) || 0) + 1);
    }
    facets[facet] = [...counts].map(([value, count]) => ({ value, count }));
  }
  return {
    ...experience,
    territoryId: exposure.territoryId,
    items: exposure.items,
    featured: exposure.items.filter((item) => item.featured).slice(0, 8),
    collections,
    facets,
    experienceConfig: {
      ...experience.experienceConfig,
      business_commerce_revision: BUSINESS_COMMERCE_REVISION,
      business_eligible_count: exposure.items.length,
    },
  };
}
