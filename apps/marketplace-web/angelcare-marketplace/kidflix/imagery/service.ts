import { createHash } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import type { MarketplaceRequestContext as Context } from "../../domain/types";
import { MarketplaceError } from "../../server/errors";
import {
  authorize,
  native,
} from "../../digital-customer-experience/repository";
import { stable } from "../../digital-customer-experience/experience-contract";
import { isId } from "../../digital-customer-experience/model";
import { publicHost } from "../server";
import {
  emptyConfig,
  normalizeConfig,
  mediaRefs,
  PAGES,
  type Config,
} from "./model";
const hash = (v: unknown) =>
  createHash("sha256").update(stable(v)).digest("hex");
const key = (page: string) => "kidflix-imagery-" + page;
const err = (code: any, message: string) => new MarketplaceError(code, message);
function scope(q: any, c: { tenantId: any; territoryId: any }) {
  q = c.tenantId ? q.eq("tenant_id", c.tenantId) : q.is("tenant_id", null);
  return c.territoryId
    ? q.eq("territory_id", c.territoryId)
    : q.is("territory_id", null);
}
async function current(c: Context, page: string) {
  if (!PAGES.includes(page))
    throw err("VALIDATION_ERROR", "Choose a KidFlix page.");
  const db = await createServiceClient(),
    r = await scope(
      db
        .from("ac_dce_records")
        .select("*")
        .eq("kind", "setting")
        .eq("key", key(page)),
      c,
    ).maybeSingle();
  if (r.error)
    throw err(
      "DEPENDENCY_BLOCKED",
      "Imagery settings unavailable. Your work remains preserved.",
    );
  return r.data;
}
export async function imageryRead(c: Context, page: string, history = false) {
  authorize(c, "view");
  if (page === "all") {
    const db = await createServiceClient(),
      r = await scope(
        db
          .from("ac_dce_records")
          .select("key,revision,data,updated_at")
          .eq("kind", "setting")
          .in("key", PAGES.map(key))
          .neq("lifecycle", "archived"),
        c,
      );
    if (r.error) throw err("DEPENDENCY_BLOCKED", "Page directory unavailable.");
    return {
      pages: (r.data || []).map((r: any) => ({
        page: r.key.slice("kidflix-imagery-".length),
        revision: r.revision,
        publishedAt: r.data?.publishedAt || null,
        changed:
          hash(r.data?.draft || emptyConfig()) !==
          hash(r.data?.live || emptyConfig()),
        images: Object.values(r.data?.live?.slots || {}).reduce(
          (n: number, s: any) => n + (s.images?.length || 0),
          0,
        ),
        usage: Object.entries(r.data?.draft?.slots || {}).flatMap(
          ([slot, value]: [string, any]) =>
            (value.images || []).map((image: any) => ({
              slot,
              assetId: image.assetId,
              mobileAssetId: image.mobileAssetId || null,
            })),
        ),
      })),
    };
  }
  const r = await current(c, page);
  let versions: any[] = [];
  if (history && r) {
    const db = await createServiceClient(),
      v = await db
        .from("ac_dce_versions")
        .select("id,revision,snapshot,created_at,actor_id")
        .eq("record_id", r.id)
        .order("revision", { ascending: false })
        .limit(30);
    if (v.error) throw err("DEPENDENCY_BLOCKED", "History unavailable.");
    versions = v.data || [];
  }
  return {
    scopeKey: hash([c.tenantId, c.territoryId]),
    record: r,
    draft: r?.data?.draft || emptyConfig(),
    live: r?.data?.live || emptyConfig(),
    draftHash: hash(r?.data?.draft || emptyConfig()),
    versions,
  };
}
async function validateMedia(c: Context, config: Config) {
  const assets = new Map<string, any>();
  for (const id of mediaRefs([config])) {
    const r = await native(c, "media", { id }),
      a = r.rows?.find((x: any) => x.id === id);
    if (
      !a ||
      !a.mime?.startsWith("image/") ||
      (a.expiresAt && Date.parse(a.expiresAt) <= Date.now())
    )
      throw err(
        "DEPENDENCY_BLOCKED",
        "An assigned image was withdrawn or expired. Choose an active image before publishing.",
      );
    assets.set(id, a);
  }
  for (const slot of Object.values(config.slots))
    for (const image of slot.images) {
      if (
        assets.get(image.assetId)?.url !== image.src ||
        (image.mobile && assets.get(image.mobileAssetId)?.url !== image.mobile)
      )
        throw err(
          "DEPENDENCY_BLOCKED",
          "An image source changed. Select it again.",
        );
    }
}
export async function imageryCommand(c: Context, cmd: any) {
  authorize(c, "view");
  const action = String(cmd.action),
    page = String(cmd.page);
  if (
    ![
      "kidflix_imagery_save",
      "kidflix_imagery_publish",
      "kidflix_imagery_restore",
    ].includes(action) ||
    !PAGES.includes(page) ||
    !isId(cmd.requestId)
  )
    throw err("VALIDATION_ERROR", "Invalid imagery operation.");
  authorize(c, action === "kidflix_imagery_publish" ? "publish" : "manage");
  const db = await createServiceClient(),
    receipt = await db
      .from("ac_dce_commands")
      .select("input_hash,response")
      .eq("actor_id", c.actor.id)
      .eq("request_id", cmd.requestId)
      .maybeSingle();
  if (receipt.error) throw err("DEPENDENCY_BLOCKED", "Receipt unavailable.");
  if (receipt.data) {
    if (receipt.data.input_hash !== hash(cmd))
      throw err("CONFLICT", "This receipt belongs to another operation.");
    return {
      ...receipt.data.response,
      draftHash: hash(
        receipt.data.response?.record?.data?.draft || emptyConfig(),
      ),
    };
  }
  const prior = await current(c, page);
  if (Number(cmd.revision) !== Number(prior?.revision || 0))
    throw err(
      "CONFLICT",
      "Another operator changed this page. Your draft is kept locally; reload and reconcile.",
    );
  if (prior?.lifecycle === "archived")
    throw err(
      "DEPENDENCY_BLOCKED",
      "Restore the configuration before editing.",
    );
  const data = { ...(prior?.data || {}) };
  let draft: Config, live: Config;
  try {
    draft = normalizeConfig(data.draft || emptyConfig(), page);
    live = normalizeConfig(data.live || emptyConfig(), page);
    if (action === "kidflix_imagery_save")
      draft = normalizeConfig(cmd.config, page);
    if (action === "kidflix_imagery_restore") {
      if (!prior || !isId(cmd.versionId))
        throw Error("Choose a recorded version.");
      const v = await db
        .from("ac_dce_versions")
        .select("snapshot")
        .eq("id", cmd.versionId)
        .eq("record_id", prior.id)
        .maybeSingle();
      if (v.error || !v.data) throw Error("Version unavailable.");
      draft = normalizeConfig(
        v.data.snapshot?.data?.live ||
          v.data.snapshot?.data?.draft ||
          emptyConfig(),
        page,
      );
    }
    if (action === "kidflix_imagery_publish") {
      if (cmd.draftHash !== hash(draft))
        throw err(
          "CONFLICT",
          "Save and review this exact imagery draft first.",
        );
      const selected = cmd.slots;
      if (
        selected !== undefined &&
        (!Array.isArray(selected) ||
          selected.length > 600 ||
          selected.some(
            (k: any) =>
              typeof k !== "string" ||
              (!Object.hasOwn(draft.slots, k) && !Object.hasOwn(live.slots, k)),
          ))
      )
        throw Error("Select existing changed placements.");
      if (selected) {
        for (const k of selected) {
          if (Object.hasOwn(draft.slots, k)) live.slots[k] = draft.slots[k];
          else delete live.slots[k];
        }
      } else live = structuredClone(draft);
      live = normalizeConfig(live, page, true);
      data.publishedAt = new Date().toISOString();
    }
  } catch (e) {
    if (e instanceof MarketplaceError) throw e;
    throw err("VALIDATION_ERROR", (e as Error).message);
  }
  await validateMedia(c, action === "kidflix_imagery_publish" ? live : draft);
  data.draft = draft;
  data.live = live;
  const historical = prior
    ? await db
        .from("ac_dce_versions")
        .select("snapshot")
        .eq("record_id", prior.id)
        .order("revision", { ascending: false })
        .limit(30)
    : { data: [], error: null };
  if (historical.error)
    throw err("DEPENDENCY_BLOCKED", "Imagery recovery references unavailable.");
  const retained: Config[] = [];
  for (const v of historical.data || [])
    for (const name of ["draft", "live"])
      try {
        retained.push(
          normalizeConfig(v.snapshot?.data?.[name] || emptyConfig(), page),
        );
      } catch {}
  const result = await db.rpc("ac_dce_write", {
    p_actor: c.actor.id,
    p_tenant: c.tenantId,
    p_territory: c.territoryId,
    p_request: cmd.requestId,
    p_hash: hash(cmd),
    p_action: "save",
    p_id: prior?.id || null,
    p_revision: prior?.revision || 0,
    p_record: {
      kind: "setting",
      key: key(page),
      title: "KidFlix imagery · " + page,
      family: null,
      topic: null,
      audience: "parent",
      data,
    },
    p_refs: {
      record: [],
      media: mediaRefs([draft, live, ...retained]),
      offer: [],
    },
  });
  if (result.error)
    throw err(
      /CONFLICT|REVISION|duplicate/i.test(result.error.message)
        ? "CONFLICT"
        : "DEPENDENCY_BLOCKED",
      "Imagery was not changed. Keep your draft and retry after reconciliation.",
    );
  return { ...result.data, draftHash: hash(draft) };
}
export async function publicImagery(hostValue: string, page: string) {
  const host = publicHost(hostValue),
    db = await createServiceClient();
  const authority = await db
    .from("ac_dce_records")
    .select("tenant_id,territory_id")
    .eq("kind", "setting")
    .eq("key", "kidflix-homepage")
    .neq("lifecycle", "archived")
    .eq("data->>liveHost", host)
    .maybeSingle();
  if (authority.error) throw Error("IMAGERY_AUTHORITY_UNAVAILABLE");
  if (!authority.data) return { config: emptyConfig(), shared: emptyConfig() };
  const c = {
      tenantId: authority.data.tenant_id,
      territoryId: authority.data.territory_id,
    },
    keys = [
      key("shared"),
      ...(PAGES.includes(page) && page !== "shared" ? [key(page)] : []),
    ],
    r = await scope(
      db
        .from("ac_dce_records")
        .select("key,data")
        .eq("kind", "setting")
        .in("key", keys)
        .neq("lifecycle", "archived"),
      c,
    );
  if (r.error) throw Error("IMAGERY_UNAVAILABLE");
  let config = emptyConfig(),
    shared = emptyConfig();
  for (const record of r.data || []) {
    const p = record.key.slice("kidflix-imagery-".length);
    const value = normalizeConfig(record.data?.live || emptyConfig(), p, true);
    if (p === "shared") shared = value;
    else config = value;
  }
  const ids = mediaRefs([config, shared]);
  if (ids.length) {
    const a = await db
      .from("angelcare_marketplace_media_assets")
      .select(
        "id,status,mime_type,public_url,desktop_url,rights_expires_at,metadata",
      )
      .in("id", ids)
      .eq("status", "active");
    if (a.error) throw Error("IMAGES_UNAVAILABLE");
    const assets = new Map(
      (a.data || [])
        .filter(
          (m: any) =>
            m.mime_type?.startsWith("image/") &&
            m.metadata?.status !== "failed" &&
            (!m.rights_expires_at ||
              Date.parse(m.rights_expires_at) > Date.now()),
        )
        .map((m: any) => [m.id, m.public_url || m.desktop_url]),
    );
    for (const v of [config, shared])
      for (const [slot, s] of Object.entries(v.slots)) {
        s.images = s.images.filter(
          (i) =>
            assets.get(i.assetId) === i.src &&
            (!i.mobile || assets.get(i.mobileAssetId) === i.mobile),
        );
        if (!s.images.length && recordHasImages(r.data, slot)) {
          delete v.slots[slot];
        }
      }
  }
  return { config, shared };
}
function recordHasImages(records: any[], slot: string) {
  return records.some((r) => r.data?.live?.slots?.[slot]?.images?.length);
}
