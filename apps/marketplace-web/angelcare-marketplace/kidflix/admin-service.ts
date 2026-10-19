import { createHash } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import type { MarketplaceRequestContext as Context } from "../domain/types";
import { MarketplaceError } from "../server/errors";
import { authorize, native } from "../digital-customer-experience/repository";
import { isId } from "../digital-customer-experience/model";
import { stable } from "../digital-customer-experience/experience-contract";
import {
  defaultHome,
  isLocale,
  normalizeEdition,
  type Locale,
} from "./catalogue";
import { publicHost } from "./server";
export const HOME_KEY = "kidflix-homepage";
const obj = (v: any) =>
  v && typeof v === "object" && !Array.isArray(v) ? v : {};
export const homeHash = (v: unknown) =>
  createHash("sha256").update(stable(v)).digest("hex");
async function current(c: Context) {
  const db = await createServiceClient();
  let q = db
    .from("ac_dce_records")
    .select("*")
    .eq("kind", "setting")
    .eq("key", HOME_KEY);
  q = c.tenantId ? q.eq("tenant_id", c.tenantId) : q.is("tenant_id", null);
  q = c.territoryId
    ? q.eq("territory_id", c.territoryId)
    : q.is("territory_id", null);
  const r = await q.maybeSingle();
  if (r.error)
    throw new MarketplaceError(
      "CONFIGURATION_ERROR",
      "KidFlix settings are unavailable. Entries remain preserved.",
    );
  return r.data;
}
export async function kidflixRead(c: Context) {
  authorize(c, "view");
  const r = await current(c);
  return {
    record: r,
    draftHashes: Object.fromEntries(
      ["en", "fr", "ar"].map((l) => [
        l,
        homeHash(obj(obj(r?.data).draft)[l]?.edition || {}),
      ]),
    ),
    defaults: Object.fromEntries(
      ["en", "fr", "ar"].map((l) => [l, defaultHome(l as Locale).edition]),
    ),
  };
}
export async function kidflixCommand(c: Context, cmd: any) {
  authorize(c, "view");
  const action = String(cmd.action);
  if (
    !["kidflix_save", "kidflix_publish", "kidflix_unpublish"].includes(action)
  )
    throw new MarketplaceError(
      "VALIDATION_ERROR",
      "Unknown KidFlix operation.",
    );
  authorize(c, action === "kidflix_save" ? "manage" : "publish");
  if (!isId(cmd.requestId) || !isLocale(cmd.locale))
    throw new MarketplaceError(
      "VALIDATION_ERROR",
      "Choose an edition and command receipt.",
    );
  const receiptDb = await createServiceClient(),
    receipt = await receiptDb
      .from("ac_dce_commands")
      .select("input_hash,response")
      .eq("actor_id", c.actor.id)
      .eq("request_id", cmd.requestId)
      .maybeSingle();
  if (receipt.error)
    throw new MarketplaceError(
      "DEPENDENCY_BLOCKED",
      "Command receipt unavailable; entries retained.",
    );
  if (receipt.data) {
    if (receipt.data.input_hash !== homeHash(cmd))
      throw new MarketplaceError(
        "CONFLICT",
        "This receipt belongs to another command.",
      );
    return {
      ...receipt.data.response,
      draftHash: homeHash(
        obj(obj(receipt.data.response?.record?.data).draft)[cmd.locale]
          ?.edition || {},
      ),
    };
  }
  const prior = await current(c);
  if ((prior?.revision || 0) !== Number(cmd.revision))
    throw new MarketplaceError(
      "CONFLICT",
      "The settings changed. Your entries are retained; reload before reconciling.",
    );
  const locale = cmd.locale as Locale,
    data = { ...obj(prior?.data) },
    draft = { ...obj(data.draft) },
    live = { ...obj(data.live) };
  if (action === "kidflix_save") {
    try {
      draft[locale] = { edition: normalizeEdition(cmd.edition, locale) };
      data.draftHost = publicHost(String(cmd.host || ""));
      if (data.draftHost === "localhost" || !data.draftHost.includes("."))
        throw Error("Choose the production hostname.");
    } catch (e) {
      throw new MarketplaceError("VALIDATION_ERROR", (e as Error).message);
    }
  }
  if (action === "kidflix_publish") {
    if (prior?.lifecycle === "archived")
      throw new MarketplaceError(
        "DEPENDENCY_BLOCKED",
        "Restore the configuration before publication.",
      );
    const selected = obj(draft[locale]);
    if (!selected.edition || cmd.draftHash !== homeHash(selected.edition))
      throw new MarketplaceError(
        "CONFLICT",
        "Save and review this exact language draft before publishing.",
      );
    const host = publicHost(String(data.draftHost || ""));
    if (
      data.liveHost &&
      data.liveHost !== host &&
      Object.keys(live).some((l) => l !== locale)
    )
      throw new MarketplaceError(
        "DEPENDENCY_BLOCKED",
        "Unpublish other language editions before changing the public hostname.",
      );
    live[locale] = {
      edition: normalizeEdition(selected.edition, locale),
      revision: Number(prior?.revision || 0) + 1,
      publishedAt: new Date().toISOString(),
    };
    data.liveHost = host;
  }
  if (action === "kidflix_unpublish") {
    delete live[locale];
    if (!Object.keys(live).length) delete data.liveHost;
  }
  data.draft = draft;
  data.live = live;
  const selectedEditions = [...Object.values(draft), ...Object.values(live)]
      .map((v) => obj(v).edition)
      .filter(Boolean),
    mediaIds = [
      ...new Set(
        selectedEditions.flatMap(
          (v) => Object.values(obj(obj(v).mediaBindings)) as string[],
        ),
      ),
    ];
  if (action === "kidflix_save" || action === "kidflix_publish") {
    const selected =
      action === "kidflix_save"
        ? obj(draft[locale]).edition
        : obj(live[locale]).edition;
    for (const [slot, id] of Object.entries(obj(selected.mediaBindings))) {
      const result = await native(c, "media", { id });
      const asset = result.rows?.find((v: any) => v.id === id),
        url =
          slot === "hero" || slot === "heroMobile"
            ? selected[slot]
            : obj(selected.familyImages)[slot.slice(7)];
      if (
        !asset ||
        !asset.mime?.startsWith("image/") ||
        asset.url !== url ||
        (asset.expiresAt && Date.parse(asset.expiresAt) <= Date.now())
      )
        throw new MarketplaceError(
          "DEPENDENCY_BLOCKED",
          "A selected native image changed or expired. Choose it again; the current public edition remains intact.",
        );
    }
  }
  const db = await createServiceClient(),
    r = await db.rpc("ac_dce_write", {
      p_actor: c.actor.id,
      p_tenant: c.tenantId,
      p_territory: c.territoryId,
      p_request: cmd.requestId,
      p_hash: homeHash(cmd),
      p_action: "save",
      p_id: prior?.id || null,
      p_revision: prior?.revision || 0,
      p_record: {
        kind: "setting",
        key: HOME_KEY,
        title: "KidFlix · public homepage",
        family: null,
        topic: null,
        audience: "parent",
        data,
      },
      p_refs: { record: [], media: mediaIds, offer: [] },
    });
  if (r.error)
    throw new MarketplaceError(
      /CONFLICT|REVISION|duplicate/i.test(r.error.message)
        ? "CONFLICT"
        : "DEPENDENCY_BLOCKED",
      "KidFlix settings were not changed. Reconcile the retained draft and retry.",
    );
  return { ...r.data, draftHash: homeHash(obj(draft[locale]).edition || {}) };
}
