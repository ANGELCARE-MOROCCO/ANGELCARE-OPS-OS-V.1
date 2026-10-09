import type {
  CatalogLocale,
  DiscoverySearch,
  StorefrontExperience,
} from "../catalog-discovery/types";
export interface PageInput {
  locale: CatalogLocale;
  territoryCode?: string | null;
  category: string;
  limit: number;
  offset: number;
}
export async function completeStorefront(
  experience: StorefrontExperience,
  readPage: (input: PageInput) => Promise<DiscoverySearch>,
): Promise<StorefrontExperience> {
  // The existing generic loader uses 120. A short first page is already complete.
  if (experience.items.length < 120) return experience;
  const items = [...experience.items],
    seen = new Set(items.map((item) => item.id));
  let offset = experience.items.length;
  for (;;) {
    const page = await readPage({
      locale: experience.locale,
      territoryCode: experience.territoryCode,
      category: experience.key,
      limit: 240,
      offset,
    });
    if (!page.items.length) {
      if (page.total > offset)
        throw Error("Incomplete storefront catalogue page");
      break;
    }
    let added = 0;
    for (const item of page.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
      added++;
    }
    if (!added) throw Error("Storefront pagination made no progress");
    offset += page.items.length;
    if (offset >= page.total || page.items.length < 240) break;
  }
  const facets: DiscoverySearch["facets"] = {
    kind: [],
    availability: [],
    category: [],
  };
  for (const [facet, key] of [
    ["kind", "kind"],
    ["availability", "availability_status"],
    ["category", "category_key"],
  ] as const) {
    const counts = new Map<string, number>();
    for (const item of items) {
      const value = item[key];
      if (value) counts.set(value, (counts.get(value) || 0) + 1);
    }
    facets[facet] = [...counts].map(([value, count]) => ({ value, count }));
  }
  return {
    ...experience,
    items,
    featured: items.filter((item) => item.featured).slice(0, 8),
    facets,
  };
}
