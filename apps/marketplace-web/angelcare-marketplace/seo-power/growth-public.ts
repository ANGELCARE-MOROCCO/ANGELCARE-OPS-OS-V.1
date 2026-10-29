import "server-only";
import { cache } from "react";
import { db, projectRow } from "./repository";
import { type World, record } from "./model";
import { resolveInventory } from "./growth-inventory";
import { candidate, growthPolicy, type InventoryItem } from "./growth-model";
export const publicGrowth = cache(async (world: World, path: string) => {
  const client = await db(),
    p = await client
      .from("ac_seo_power_projects")
      .select("*")
      .eq("world", world)
      .eq("enabled", true)
      .maybeSingle();
  if (p.error) throw Error("GROWTH_PUBLIC_UNAVAILABLE");
  if (!p.data) return null;
  const r = await client
    .from("ac_seo_growth_opportunities")
    .select("*")
    .eq("project_id", p.data.id)
    .eq("path", path)
    .maybeSingle();
  if (r.error) {
    if (r.error.code === "42P01") return null;
    throw Error("GROWTH_PUBLIC_UNAVAILABLE");
  }
  if (!r.data) return null;
  const project = projectRow(p.data),
    o = r.data,
    cfg = await client
      .from("ac_seo_growth_config")
      .select("policy")
      .eq("project_id", project.id)
      .single();
  if (cfg.error) throw Error("GROWTH_PUBLIC_UNAVAILABLE");
  const items = await resolveInventory(
      project,
      (record(o.published_data).items || []) as InventoryItem[],
    ),
    quality = items.length
      ? candidate(items, growthPolicy(cfg.data.policy))
      : null;
  return {
    opportunity: o,
    project,
    items: quality?.items || [],
    ready: quality?.ready === true,
    quality,
  };
});
