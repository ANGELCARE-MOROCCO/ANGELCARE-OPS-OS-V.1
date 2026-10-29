import { createHash } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { MarketplaceError } from "../server/errors";
import type { MarketplaceRequestContext as Context } from "../domain/types";
import { authorize, command, record } from "./repository";
import { editionCommand, inspectEdition, masterError } from "./master-service";
import { authoringFamilies } from "./management";
import { CREATION_CONTRACT, completeCreation } from "./creation-model";
import { isId } from "./model";
import { object, text, type Command, type Locale } from "./types";

function scope(q: any, c: Context) {
  return (c.tenantId ? q.eq("tenant_id", c.tenantId) : q.is("tenant_id", null))[
    c.territoryId ? "eq" : "is"
  ]("territory_id", c.territoryId || null);
}
function scopedReceipt(c: Context, id: string, phase: string) {
  const hex = createHash("sha256")
    .update(
      JSON.stringify([
        CREATION_CONTRACT,
        c.tenantId,
        c.territoryId,
        c.actor.id,
        id,
        phase,
      ]),
    )
    .digest("hex")
    .slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20)}`;
}
export async function creationRead(
  c: Context,
  _input: Record<string, unknown>,
) {
  authorize(c, "view");
  const db = await createServiceClient();
  const policy = await scope(
    db
      .from("ac_dce_work_items")
      .select("data")
      .eq("kind", "editorial_policy")
      .eq("status", "active"),
    c,
  )
    .order("updated_at", { ascending: false })
    .order("id")
    .limit(1)
    .maybeSingle();
  if (policy.error) masterError(policy.error);
  const independentReview =
    object(policy.data?.data).independentReview === true;
  const migration = await db.rpc("ac_dce_creation_runtime_status");
  return {
    contract: CREATION_CONTRACT,
    independentReview,
    atomicPublish: !migration.error && migration.data?.atomicPublish === true,
  };
}
export async function creationCommand(c: Context, cmd: Command) {
  authorize(c, "manage");
  if (!isId(cmd.requestId))
    throw new MarketplaceError(
      "VALIDATION_ERROR",
      "A valid operation receipt is required.",
    );
  if (cmd.action === "creation_save") {
    const input = cmd.record;
    if (!input || !["experience", "bundle"].includes(text(input.kind)))
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Choose a resource or a pathway.",
      );
    if (!authoringFamilies({}).some((f) => f.key === input.family))
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Choose a supported category.",
      );
    // Canonical save enforces enabled categories/languages, native references, scope and revision.
    const prepared = completeCreation(input),
      id = text(cmd.id || prepared.id) || undefined;
    if (id && !isId(id))
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Invalid resource identifier.",
      );
    if (cmd.id && prepared.id && cmd.id !== prepared.id)
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "The resource identifiers do not match.",
      );
    if (id) {
      const original = await record(c, id);
      if (
        !["experience", "bundle"].includes(original.kind) ||
        original.kind !== prepared.kind ||
        original.family !== prepared.family
      )
        throw new MarketplaceError(
          "VALIDATION_ERROR",
          "Keep the existing resource category and kind.",
        );
    }
    return command(c, {
      action: "save",
      requestId: scopedReceipt(c, cmd.requestId, "save"),
      id,
      revision: Number(cmd.revision || prepared.revision || 0),
      record: prepared,
      creationScope: [c.tenantId, c.territoryId],
    });
  }
  if (cmd.action === "creation_publish") {
    authorize(c, "publish");
    const r = await record(c, text(cmd.id)),
      locale = cmd.locale as Locale;
    if (
      !["fr", "en", "ar"].includes(locale) ||
      !["experience", "bundle"].includes(r.kind)
    )
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Choose a resource and its language.",
      );
    if (r.revision !== Number(cmd.revision))
      throw new MarketplaceError(
        "CONFLICT",
        "The resource changed. Reload its saved revision before publishing.",
      );
    const result = await editionCommand(c, {
      ...cmd,
      action: "master_edition_direct_publish",
      requestId: scopedReceipt(c, cmd.requestId, "publish"),
      creationScope: [c.tenantId, c.territoryId],
    });
    const release = result?.release;
    if (
      !release?.id ||
      release.state !== "published" ||
      result?.edition?.active_release_id !== release.id
    )
      throw new MarketplaceError(
        "DEPENDENCY_BLOCKED",
        "The server has not confirmed an active public edition.",
      );
    return {
      ...result,
      record: r,
      publicPath:
        "/kidflix/" + locale + "/experience/" + encodeURIComponent(r.key),
    };
  }
  if (cmd.action === "creation_inspect") {
    const r = await record(c, text(cmd.id));
    if (r.revision !== Number(cmd.revision))
      throw new MarketplaceError(
        "CONFLICT",
        "Reload the current resource revision.",
      );
    const locale = cmd.locale as Locale;
    if (!["fr", "en", "ar"].includes(locale))
      throw new MarketplaceError("VALIDATION_ERROR", "Choose a language.");
    return inspectEdition(c, r, locale);
  }
  throw new MarketplaceError(
    "VALIDATION_ERROR",
    "Unsupported creation operation.",
  );
}
