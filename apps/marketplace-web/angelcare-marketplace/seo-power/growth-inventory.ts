import "server-only";
import { getCatalogue, getExperience } from "../kidflix/server";
import {
  searchDiscovery,
  getDiscoveryItemById,
} from "../catalog-discovery/repository";
import { searchVacancies, publicVacancy } from "../jobkix/server/repository";
import {db} from "./repository";
import { type Project, publicPath } from "./model";
import { plain, type InventoryItem } from "./growth-model";
const text = (v: unknown) => (typeof v === "string" ? v : "");
function offer(
  x: Record<string, unknown>,
  locale: string,
): InventoryItem | null {
  if (
    ["unavailable", "hidden", "blocked"].includes(
      text(x.availability_status).toLowerCase(),
    ) ||
    !x.name ||
    !x.slug
  )
    return null;
  return {
    id: text(x.id),
    key: text(x.id),
    world: "angelcare",
    locale,
    path: `/angelcare-marketplace/${locale}/marketplace/item/${text(x.slug)}`,
    title: plain(x.name, 300),
    summary: plain(x.description || x.short_description, 3000),
    group: text(x.category_key) || text(x.kind),
    topic: plain(x.category_title || x.category_key || x.kind, 100),
    image: text(x.media_url),
  };
}
function vacancy(
  x: Record<string, unknown>,
  locale: string,
): InventoryItem | null {
  if (x.state !== "published" || !x.id || !x.title) return null;
  if((text(x.originalLocale)||"en")!==locale)return null;
  const expiry =
    x.closesAt || x.closes_at || x.expiresAt || x.expires_at || x.validThrough;
  if (
    expiry &&
    Number.isFinite(Date.parse(String(expiry))) &&
    Date.parse(String(expiry)) <= Date.now()
  )
    return null;
  return {
    id: text(x.id),
    key: text(x.id),
    world: "jobkix",
    locale,
    path: `/jobkix/${locale}/jobs/${text(x.id)}`,
    title: plain(x.title, 300),
    summary: plain(x.description || x.summary || x.responsibilities, 3000),
    group: text(x.settingId) || text(x.occupationId) || "jobs",
    topic: plain(x.country || "worldwide", 100),
    country: text(x.country),
  };
}
async function authoredOfferIds(ids:string[],locale:string){
 if(locale==='fr')return new Set(ids);
 if(!ids.length)return new Set<string>();
 const client=await db(),r=await client.from('angelcare_marketplace_catalog_discovery_v').select('*').in('id',ids).eq('status','published');
 if(r.error)throw Error('NATIVE_LANGUAGE_EVIDENCE_UNAVAILABLE');
 return new Set((r.data||[]).filter((x:Record<string,unknown>)=>text(x['name_'+locale]).trim()&&text(x['description_'+locale]||x['short_description_'+locale]).trim()).map((x:Record<string,unknown>)=>text(x.id)));
}
export async function inventoryBatch(
  project: Project,
  locale: string,
  page: number,
) {
  let items: InventoryItem[] = [],
    total = 0,
    size = 24,sourceRows=0;
  if (project.world === "kidflix") {
    const v = await getCatalogue(
      new URL(project.origin).host,
      locale as "en" | "fr" | "ar",
      { page },
    );
    total = v.total;sourceRows=v.rows.length;
    items = v.rows.map((x) => ({
      id: x.id,
      key: x.key,
      world: "kidflix" as const,
      locale,
      path: `/kidflix/${locale}/experience/${x.key}`,
      title: plain(x.title, 300),
      summary: plain(x.summary, 3000),
      group: x.family,
      topic: x.subject || x.family,
      image: x.image,
      revision: x.releaseId,
    }));
  } else if (project.world === "angelcare") {
    size = 50;
    const v = await searchDiscovery({
      locale: locale as "en" | "fr" | "ar",
      limit: size,
      offset: (page - 1) * size,
      sort: "newest",
    });
    total = v.total;sourceRows=v.items.length;
    const authored=await authoredOfferIds(v.items.map(x=>x.id),locale);
    items = v.items.filter(x=>authored.has(x.id))
      .map((x) => offer(x as unknown as Record<string, unknown>, locale))
      .filter((x): x is InventoryItem => !!x);
  } else {
    const v = await searchVacancies({ page: String(page), sort: "newest" });
    size = v.pageSize;
    total = v.total;sourceRows=v.items.length;
    items = v.items
      .map((x) => vacancy(x, locale))
      .filter((x): x is InventoryItem => !!x);
  }
  for (const x of items) publicPath(x.path, project.world);
  return { items, total, page, size, note:{sourceRows,excluded:sourceRows-items.length,reason:"native_availability_and_authored_language"},done: page * size >= total };
}
export async function liveInventoryItem(
  project: Project,
  item: InventoryItem,
): Promise<InventoryItem | null> {
  if (item.world !== project.world) return null;
  publicPath(item.path, project.world);
  if (project.world === "angelcare") {
    if(!(await authoredOfferIds([item.id],item.locale)).has(item.id))return null;
    const x = await getDiscoveryItemById({
      locale: item.locale as "en" | "fr" | "ar",
      id: item.id,
    });
    return x
      ? offer(x as unknown as Record<string, unknown>, item.locale)
      : null;
  }
  if (project.world === "jobkix") {
    const x = await publicVacancy(item.id);
    return x ? vacancy(x, item.locale) : null;
  }
  const v = await getExperience(
    new URL(project.origin).host,
    item.locale as "en" | "fr" | "ar",
    item.key,
  );
  // A changed native edition is removed until the next inventory refresh, never represented by an old snapshot.
  if (!v || v.releaseId !== item.revision) return null;
  return item;
}
export async function resolveInventory(
  project: Project,
  items: InventoryItem[],
) {
  const out: InventoryItem[] = [];
  for (let i = 0; i < Math.min(items.length, 12); i += 4) {
    const batch = await Promise.all(
      items.slice(i, i + 4).map((x) => liveInventoryItem(project, x)),
    );
    out.push(...batch.filter((x): x is InventoryItem => !!x));
  }
  return out;
}
