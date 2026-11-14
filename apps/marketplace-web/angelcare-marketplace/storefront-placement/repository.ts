import "server-only";
import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import type {
  CatalogLocale,
  DiscoveryItem,
  DiscoverySearch,
  StorefrontExperience,
} from "../catalog-discovery/types";
import { mapDiscoveryItem } from "../catalog-discovery/public-item";
import {
  completeStorefront,
  type PageInput,
} from "../storefront-immersive/pagination";
import {
  mergePlacedItems,
  normalizePlacement,
  placementFacets,
  placementObject,
  type StorefrontPlacement,
} from "./model";

type Row = Record<string, unknown>;
const rows = (value: unknown): Row[] =>
  Array.isArray(value) ? (value as Row[]) : [];
const PAGE = 240;
function check(error: unknown) {
  if (error)
    throw Error(
      "Impossible de lire les placements des vitrines. Réessayez sans modifier votre sélection.",
    );
}

/** Only public category identities are exposed; locale-specific hiding wins over French fallback. */
export async function visiblePlacementCategories(
  locale: CatalogLocale,
  territoryId: string | null,
  globalOnly = false,
): Promise<Set<string>> {
  const db = await createServiceClient(),
    all: Row[] = [];
  for (let offset = 0; ; offset += PAGE) {
    let q = db
      .from("angelcare_marketplace_catalog_categories")
      .select("id,category_key,locale,status,visible,territory_id")
      .in("locale", [...new Set([locale, "fr"])]);
    q = territoryId
      ? q.or("territory_id.is.null,territory_id.eq." + territoryId)
      : globalOnly
        ? q.is("territory_id", null)
        : q;
    const result = await q.order("id").range(offset, offset + PAGE - 1);
    check(result.error);
    const batch = rows(result.data);
    all.push(...batch);
    if (batch.length < PAGE) break;
  }
  const groups = new Map<string, Row[]>();
  for (const row of all) {
    const key = String(row.category_key) + ":" + String(row.territory_id || "");
    groups.set(key, [...(groups.get(key) || []), row]);
  }
  const visible = new Set<string>();
  for (const candidates of groups.values()) {
    const preferred =
      candidates.find((row) => row.locale === locale) ||
      candidates.find((row) => row.locale === "fr");
    if (preferred?.status === "published" && preferred.visible === true)
      for (const row of candidates)
        if (row.status === "published" && row.visible === true)
          visible.add(String(row.id));
  }
  return visible;
}

/** Request-local only: published changes are read anew on the next request. */
const manualSnapshot = cache(async (territoryCode: string | null) => {
  const db = await createServiceClient();
  let territoryId: string | null = null;
  let globalOnly = false;
  if (territoryCode) {
    const territory = await db
      .from("angelcare_marketplace_territories")
      .select("id")
      .eq("territory_code", territoryCode)
      .maybeSingle();
    check(territory.error);
    if (!territory.data?.id) globalOnly = true;
    else territoryId = String(territory.data.id);
  }
  const placements = new Map<string, StorefrontPlacement>();
  for (let offset = 0; ; offset += PAGE) {
    // JSON path uses the existing native configuration column. No category assignments are written.
    let q = db
      .from("angelcare_marketplace_catalog_items")
      .select("id,experience_config")
      .eq("status", "published")
      .eq("experience_config->storefront_placement->>mode", "manual");
    q = territoryId
      ? q.or("territory_id.is.null,territory_id.eq." + territoryId)
      : globalOnly
        ? q.is("territory_id", null)
        : q;
    const result = await q.order("id").range(offset, offset + PAGE - 1);
    check(result.error);
    const batch = rows(result.data);
    for (const row of batch)
      placements.set(
        String(row.id),
        normalizePlacement(
          placementObject(row.experience_config).storefront_placement,
        ),
      );
    if (batch.length < PAGE) break;
  }
  return { placements, territoryId, globalOnly };
});

export async function applyStorefrontPlacements(
  experience: StorefrontExperience,
  readPage: (input: PageInput) => Promise<DiscoverySearch>,
): Promise<StorefrontExperience> {
  const { placements, territoryId, globalOnly } = await manualSnapshot(
    experience.territoryCode || null,
  );
  // Finish the native page sequence before manual additions/removals can change offsets or counts.
  const complete =
    experience.key === "families" || experience.key === "home-services"
      ? experience
      : await completeStorefront(experience, readPage);
  const ids = [...placements]
    .filter(([, config]) => config.storefronts.includes(experience.key))
    .map(([id]) => id);
  const selected: DiscoveryItem[] = [],
    db = await createServiceClient();
  if (ids.length) {
    const visibleCategories = await visiblePlacementCategories(
      experience.locale,
      territoryId,
      globalOnly,
    );
    for (let start = 0; start < ids.length; start += 100) {
      const chunk = ids.slice(start, start + 100),
        eligible = new Set<string>();
      for (let offset = 0; ; offset += PAGE) {
        const membership = await db
          .from("angelcare_marketplace_catalog_item_categories")
          .select("id,catalog_item_id,category_id")
          .in("catalog_item_id", chunk)
          .order("id")
          .range(offset, offset + PAGE - 1);
        check(membership.error);
        const batch = rows(membership.data);
        for (const row of batch)
          if (visibleCategories.has(String(row.category_id)))
            eligible.add(String(row.catalog_item_id));
        if (batch.length < PAGE) break;
      }
      let q = db
        .from("angelcare_marketplace_catalog_discovery_v")
        .select("*")
        .eq("status", "published")
        .in("id", chunk);
      q = territoryId
        ? q.or("territory_id.is.null,territory_id.eq." + territoryId)
        : globalOnly
          ? q.is("territory_id", null)
          : q;
      // A discovery view may contain multiple rows per canonical offer: collect and deduplicate after paging.
      for (let offset = 0; ; offset += PAGE) {
        const result = await q.order("id").range(offset, offset + PAGE - 1);
        check(result.error);
        const batch = rows(result.data);
        for (const row of batch)
          if (
            eligible.has(String(row.id)) &&
            row.slug &&
            ![
              "hidden",
              "territory_restricted",
              "cancelled",
              "suspended",
            ].includes(String(row.availability_status))
          )
            selected.push(mapDiscoveryItem(row, experience.locale));
        if (batch.length < PAGE) break;
      }
    }
  }
  const items = mergePlacedItems(
    complete.items,
    selected,
    placements,
    experience.key,
  );
  const canonical = new Map(items.map((item) => [item.id, item]));
  return {
    ...complete,
    territoryId,
    items,
    featured: items.filter((item) => item.featured).slice(0, 8),
    facets: placementFacets(items),
    collections: complete.collections.map((collection) => ({
      ...collection,
      items: [...new Set(collection.items.map((item) => item.id))].flatMap(
        (id) =>
          placements.get(id)?.mode === "manual"
            ? canonical.has(id)
              ? [canonical.get(id)!]
              : []
            : [
                canonical.get(id) ||
                  collection.items.find((item) => item.id === id)!,
              ],
      ),
    })),
    experienceConfig: {
      ...complete.experienceConfig,
      storefront_placement_resolved: true,
    },
  };
}
