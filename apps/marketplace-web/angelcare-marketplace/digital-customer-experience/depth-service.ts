import { createHash, randomUUID } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import type { MarketplaceRequestContext as Context } from "../domain/types";
import { MarketplaceError } from "../server/errors";
import { authorize, record } from "./repository";
import { object, text, type Command, type Data } from "./types";
async function checked(q: PromiseLike<any>) {
  const r = await q;
  if (r.error) {
    const m = text(r.error.message);
    throw new MarketplaceError(
      /CONFLICT|REVISION/.test(m)
        ? "CONFLICT"
        : /does not exist|schema cache/.test(m)
          ? "CONFIGURATION_ERROR"
          : "DEPENDENCY_BLOCKED",
      /does not exist|schema cache/.test(m)
        ? "R7 database activation is pending. Your existing local draft remains available."
        : m.slice(0, 250),
    );
  }
  return r.data;
}
export async function depthRead(c: Context, input: Record<string, unknown>) {
  authorize(c, "view");
  const db = await createServiceClient();
  if (input.op === "depth_draft") {
    authorize(c, "manage");
    return checked(
      db.rpc("ac_dce_r7_draft", {
        p_actor: c.actor.id,
        p_tenant: c.tenantId,
        p_territory: c.territoryId,
        p_key: text(input.key),
        p_revision: 0,
        p_action: "read",
        p_payload: {},
      }),
    );
  }
  if (input.op === "depth_certificate_messages") {
    authorize(c, "moderate");
    const { masterRead } = await import("./master-service");
    const value = await masterRead(c, {
        op: "master_certificate",
        id: input.id,
      }),
      r = object(value.request);
    if (!object(r.data).privateCaseId) return { rows: [], total: 0 };
    let q = db
      .from("ac_dce_work_items")
      .select("*", { count: "exact" })
      .eq("kind", "notification")
      .eq("record_id", object(r.data).privateCaseId);
    q = c.tenantId ? q.eq("tenant_id", c.tenantId) : q.is("tenant_id", null);
    q = c.territoryId
      ? q.eq("territory_id", c.territoryId)
      : q.is("territory_id", null);
    const result = await q
      .order("created_at", { ascending: false })
      .range(
        (Math.max(1, Number(input.page) || 1) - 1) * 30,
        Math.max(1, Number(input.page) || 1) * 30 - 1,
      );
    if (result.error)
      throw new MarketplaceError(
        "DEPENDENCY_BLOCKED",
        "Correspondence unavailable.",
      );
    return { rows: result.data || [], total: result.count || 0 };
  }
  if (input.op === "depth_discovery")
    return checked(
      db.rpc("ac_dce_r7_discovery", {
        p_tenant: c.tenantId,
        p_territory: c.territoryId,
        p_locale: text(input.locale) || c.locale,
        p_filters: {
          q: text(input.q),
          family: text(input.family),
          audience: text(input.audience),
          subject: text(input.subject),
          skill: text(input.skill),
          difficulty: text(input.difficulty),
          slot: text(input.slot),
          collection: text(input.collection),
        },
        p_page: Math.max(1, Math.floor(Number(input.page) || 1)),
      }),
    );
  throw new MarketplaceError("VALIDATION_ERROR", "Unknown R7 operation.");
}
export async function depthCommand(c: Context, cmd: Command) {
  authorize(c, "view");
  const db = await createServiceClient();
  if (["depth_save_draft", "depth_discard_draft"].includes(cmd.action)) {
    authorize(c, "manage");
    const payload = object(cmd.payload);
    if (cmd.action === "depth_save_draft" && payload.record) {
      const r = object(payload.record);
      if (r.id) await record(c, text(r.id));
      if (
        !["experience", "template", "content", "bundle"].includes(text(r.kind))
      )
        throw new MarketplaceError(
          "VALIDATION_ERROR",
          "Only authored dossiers support personal recovery.",
        );
    }
    return checked(
      db.rpc("ac_dce_r7_draft", {
        p_actor: c.actor.id,
        p_tenant: c.tenantId,
        p_territory: c.territoryId,
        p_key: text(cmd.key),
        p_revision: Number(cmd.revision) || 0,
        p_action: cmd.action === "depth_save_draft" ? "save" : "delete",
        p_payload: payload,
      }),
    );
  }
  if (cmd.action === "depth_certificate_message") {
    authorize(c, "moderate");
    const input = object(cmd.data);
    return checked(
      db.rpc("ac_dce_r7_certificate_message", {
        p_actor: c.actor.id,
        p_tenant: c.tenantId,
        p_territory: c.territoryId,
        p_request: cmd.requestId,
        p_hash: createHash("sha256").update(JSON.stringify(cmd)).digest("hex"),
        p_id: cmd.id,
        p_revision: cmd.revision,
        p_subject: text(input.subject),
        p_body: text(input.body),
      }),
    );
  }
  if (cmd.action === "depth_release_hold") {
    authorize(c, "purge");
    return checked(
      db.rpc("ac_dce_r7_release_hold", {
        p_actor: c.actor.id,
        p_tenant: c.tenantId,
        p_territory: c.territoryId,
        p_request: cmd.id,
        p_revision: cmd.revision,
        p_reason: text(cmd.reason),
      }),
    );
  }
  if (cmd.action === "depth_run_batch") {
    authorize(c, "manage");
    const { operatorRead, operatorCommand } =
      await import("./operator-service");
    let r = await operatorRead(c, { op: "operator_batch", id: cmd.id });
    let batch = object(r.batch);
    const start = Date.now();
    for (
      let i = 0;
      i < 10 &&
      Date.now() - start < 10000 &&
      ["preparing", "applying"].includes(text(batch.state));
      i++
    ) {
      r = await operatorCommand(c, {
        action: "operator_batch",
        id: text(batch.id),
        revision: Number(batch.revision),
        operation: "continue",
        requestId: randomUUID(),
      });
      batch = object(r.batch);
    }
    return r;
  }
  throw new MarketplaceError("VALIDATION_ERROR", "Unknown R7 command.");
}
