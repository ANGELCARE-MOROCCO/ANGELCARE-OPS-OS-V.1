import { createHash } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import type { MarketplaceRequestContext as Context } from "../domain/types";
import { authorize, command, record } from "./repository";
import { familyByKey } from "./registry";
import { applyDeliveryRepair, deliveryRepairPlan } from "./delivery-repair";
import { text, type Command, type DceRecord } from "./types";
const fingerprint = (r: DceRecord) =>
  createHash("sha256")
    .update(
      JSON.stringify([
        r.id,
        r.revision,
        deliveryRepairPlan(r, familyByKey(r.family || "")!),
      ]),
    )
    .digest("hex");
export async function deliveryRead(c: Context, input: Record<string, unknown>) {
  authorize(c, "manage");
  const family = familyByKey(text(input.family));
  if (!family) throw Error("UNKNOWN_DELIVERY_FAMILY");
  const db = await createServiceClient();
  let q = db
    .from("ac_dce_records")
    .select("*", { count: "exact" })
    .eq("kind", "experience")
    .eq("family", family.key)
    .in("lifecycle", ["draft", "review", "approved"]);
  q = c.tenantId ? q.eq("tenant_id", c.tenantId) : q.is("tenant_id", null);
  q = c.territoryId
    ? q.eq("territory_id", c.territoryId)
    : q.is("territory_id", null);
  const page = Math.max(1, Math.min(1000, Number(input.page) || 1));
  const result = await q.order("id").range((page - 1) * 100, page * 100 - 1);
  if (result.error) throw Error("DELIVERY_DRAFT_SCAN_FAILED");
  return {
    rows: (result.data || []).map((r: DceRecord) => ({
      id: r.id,
      key: r.key,
      title: r.title,
      revision: r.revision,
      changes: deliveryRepairPlan(r, family),
      fingerprint: fingerprint(r),
    })),
    total: result.count || 0,
    page,
    pageSize: 100,
  };
}
export async function deliveryCommand(c: Context, cmd: Command) {
  authorize(c, "manage");
  if (cmd.action !== "delivery_repair_apply")
    throw Error("UNKNOWN_DELIVERY_ACTION");
  const r = await record(c, text(cmd.id)),
    family = familyByKey(r.family || "");
  if (!family || !["draft", "review", "approved"].includes(r.lifecycle))
    throw Error("CHOOSE_CURRENT_DRAFT");
  const changes = deliveryRepairPlan(r, family);
  if (!changes.length) return { record: r, alreadyValid: true };
  if (r.revision !== Number(cmd.revision) || fingerprint(r) !== cmd.fingerprint)
    throw Error("REPAIR_PLAN_CHANGED_RESCAN_REQUIRED");
  return command(c, {
    action: "save",
    id: r.id,
    revision: r.revision,
    requestId: cmd.requestId,
    record: applyDeliveryRepair(r, changes),
  });
}
