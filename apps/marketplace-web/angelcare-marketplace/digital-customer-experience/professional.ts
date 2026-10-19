import { editionHash, inspectEdition } from "./master-service";
import { createHash, randomUUID } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import type { MarketplaceRequestContext } from "../domain/types";
import { MarketplaceError } from "../server/errors";
import {
  createMarketplaceMediaDeliveryUrl,
  createMarketplaceMediaUploadSession,
  fetchMarketplaceGatewayAsset,
  deleteMarketplaceGatewayAsset,
} from "../commerce-studio/media-storage";
import {
  authorize,
  record,
  native,
  list,
  scopeKey,
  validate,
  rights,
} from "./repository";
import { isId } from "./model";
import { translationCoverage, coverageFieldLabel } from "./localisation";
import {
  applyTextOperations,
  renderText,
  seedText,
  textSpans,
  sharedTextPath,
  collaborationPath,
  pathValue,
  type TextNode,
  type TextOperation,
} from "./collaboration";
import {
  WORK_KINDS,
  PROFESSIONAL_CONTRACT,
  RECIPES,
  recipeInput,
  workData,
  slaState,
  type WorkItem,
  type WorkKind,
} from "./professional-contract";
import {
  array,
  object,
  text,
  number,
  type Command,
  type Data,
  type DceRecord,
} from "./types";
type Context = MarketplaceRequestContext;
export function inScope(
  q: any,
  c: { tenantId: string | null; territoryId: string | null },
) {
  return (c.tenantId ? q.eq("tenant_id", c.tenantId) : q.is("tenant_id", null))[
    c.territoryId ? "eq" : "is"
  ]("territory_id", c.territoryId || null);
}
export function dbError(e: any): never {
  const m = String(e?.message || "DCE operation failed.");
  if (/CONFLICT|LATER_EDIT/.test(m))
    throw new MarketplaceError(
      "CONFLICT",
      "Another change was saved. Your entered information remains available. Refresh and reconcile.",
    );
  if (/NOT_FOUND/.test(m))
    throw new MarketplaceError(
      "NOT_FOUND",
      "The record is unavailable in this workspace.",
    );
  if (
    ["42P01", "42883", "PGRST205", "PGRST202"].includes(e?.code) ||
    /schema cache/.test(m)
  )
    throw new MarketplaceError(
      "CONFIGURATION_ERROR",
      "Apply the separate 08_DCE_PROFESSIONAL_R4.sql activation file.",
    );
  throw new MarketplaceError(
    "DEPENDENCY_BLOCKED",
    m.replace(/\s+/g, " ").slice(0, 250),
  );
}
export async function result<T = any>(
  p: PromiseLike<{ data: any; error: any }>,
): Promise<T> {
  const r = await p;
  if (r.error) dbError(r.error);
  return r.data;
}
const commandArgs = (c: Context, cmd: Command) => {
  if (!isId(cmd.requestId))
    throw new MarketplaceError(
      "VALIDATION_ERROR",
      "A UUID receipt is required.",
    );
  return {
    p_actor: c.actor.id,
    p_tenant: c.tenantId,
    p_territory: c.territoryId,
    p_request: cmd.requestId,
    p_hash: createHash("sha256").update(JSON.stringify(cmd)).digest("hex"),
  };
};
function kindRight(c: Context, kind: string, write = false) {
  authorize(c, "view");
  if (["case_operation", "sla_policy", "notification"].includes(kind))
    authorize(c, "moderate");
  else if (["retention_policy", "disposal"].includes(kind))
    authorize(c, "purge");
  else if (write)
    authorize(c, kind === "editorial_policy" ? "publish" : "manage");
}
export async function workItem(c: Context, id: string): Promise<WorkItem> {
  authorize(c, "view");
  if (!isId(id))
    throw new MarketplaceError("VALIDATION_ERROR", "Choose a valid work item.");
  const db = await createServiceClient(),
    w = await result(
      inScope(db.from("ac_dce_work_items").select("*"), c)
        .eq("id", id)
        .maybeSingle(),
    );
  if (!w) throw new MarketplaceError("NOT_FOUND", "Work item not found.");
  kindRight(c, w.kind);
  if (
    (w.kind === "editorial_notice" && w.data.assignedTo !== c.actor.id) ||
    (w.kind === "saved_report" &&
      w.data.visibility !== "team" &&
      w.data.ownerId !== c.actor.id)
  )
    throw new MarketplaceError("NOT_FOUND", "Private work item unavailable.");
  return w;
}
async function writeItem(c: Context, cmd: Command, item: Partial<WorkItem>) {
  const db = await createServiceClient();
  return result<WorkItem>(
    db.rpc("ac_dce_work_write", {
      ...commandArgs(c, cmd),
      p_id: cmd.id || null,
      p_revision: cmd.revision || 0,
      p_item: item,
    }),
  );
}
async function staff(c: Context, id: unknown) {
  if (!id) return;
  if (!isId(id) || (await native(c, "staff", { id })).rows.length !== 1)
    throw new MarketplaceError(
      "VALIDATION_ERROR",
      "Select an eligible native operator.",
    );
}
async function fieldRecord(c: Context, id: string) {
  authorize(c, "manage");
  const r = await record(c, id);
  if (!["experience", "content", "template", "bundle"].includes(r.kind))
    throw new MarketplaceError(
      "FORBIDDEN",
      "Only authored draft content supports collaboration.",
    );
  return r;
}
async function workPage(c: Context, input: Record<string, unknown>) {
  const kind = text(input.kind);
  if (!WORK_KINDS.includes(kind as WorkKind))
    throw new MarketplaceError(
      "VALIDATION_ERROR",
      "Choose a workspace collection.",
    );
  kindRight(c, kind);
  if (input.recordId) await record(c, text(input.recordId));
  const zone = text(input.zone) || "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone }).format();
  } catch {
    throw new MarketplaceError(
      "VALIDATION_ERROR",
      "Choose a valid calendar time zone.",
    );
  }
  const db = await createServiceClient();
  const response = await result(
    db.rpc("ac_dce_work_page", {
      p_tenant: c.tenantId,
      p_territory: c.territoryId,
      p_kind: kind,
      p_record: input.recordId || null,
      p_status: text(input.status),
      p_q: text(input.q).slice(0, 120),
      p_owner: input.mine === "true" ? c.actor.id : "",
      p_page: Math.max(1, Math.floor(number(input.page, 1))),
      p_actor: c.actor.id,
      p_filters: {
        month: /^\d{4}-\d{2}$/.test(text(input.month)) ? text(input.month) : "",
        day: /^\d{4}-\d{2}-\d{2}$/.test(text(input.day)) ? text(input.day) : "",
        zone,
      },
    }),
  );
  if (kind === "task") {
    const ids = [
      ...new Set(
        (response.rows || [])
          .filter((w: any) => w.record_id && w.data.locale)
          .map((w: any) => w.record_id),
      ),
    ];
    const targets = ids.length
      ? await result<DceRecord[]>(
          inScope(db.from("ac_dce_records").select("*"), c).in("id", ids),
        )
      : [];
    response.rows = (response.rows || []).map((w: any) => {
      const r = targets.find((r) => r.id === w.record_id);
      return {
        ...w,
        data: {
          ...w.data,
          ...(r && w.data.locale
            ? {
                reviewCurrent:
                  w.data.reviewedEditionHash === editionHash(r, w.data.locale),
                currentEditionHash: editionHash(r, w.data.locale),
              }
            : {}),
        },
      };
    });
  }
  return response;
}
export async function professionalRead(
  c: Context,
  input: Record<string, unknown>,
) {
  authorize(c, "view");
  const op = text(input.op);
  if (op === "pro_empty") return {};
  const db = await createServiceClient();
  if (op === "pro_work") return workPage(c, input);
  if (op === "pro_item") {
    const w = await workItem(c, text(input.id));
    const outputs =
      w.kind === "media_job"
        ? await result(
            db
              .from("ac_dce_processing_outputs")
              .select("*")
              .eq("job_id", w.id)
              .in("state", ["verified", "promoted"])
              .order("created_at"),
          )
        : [];
    return { item: w, outputs };
  }
  if (op === "pro_health")
    return result(
      db.rpc("ac_dce_professional_health", {
        p_tenant: c.tenantId,
        p_territory: c.territoryId,
        p_private: rights(c).moderate,
      }),
    );
  if (op === "pro_strategy") {
    const since =
        text(input.since) || new Date(Date.now() - 30 * 86400000).toISOString(),
      until = text(input.until) || new Date().toISOString();
    if (
      !Number.isFinite(Date.parse(since)) ||
      !Number.isFinite(Date.parse(until)) ||
      Date.parse(until) > Date.now() + 60000 ||
      Date.parse(until) <= Date.parse(since) ||
      Date.parse(until) - Date.parse(since) > 366 * 86400000
    )
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Choose a report interval up to 366 days, ending no later than now.",
      );
    const environment = ["production", "preview", "fixture"].includes(
      text(input.environment),
    )
      ? text(input.environment)
      : "production";
    let steps: string[];
    try {
      steps = JSON.parse(
        text(input.steps) || '["discover","start","complete"]',
      );
    } catch {
      throw new MarketplaceError("VALIDATION_ERROR", "Invalid funnel steps.");
    }
    if (
      !Array.isArray(steps) ||
      steps.length < 2 ||
      steps.length > 8 ||
      steps.some(
        (s) =>
          ![
            "discover",
            "start",
            "checkpoint",
            "complete",
            "bookmark",
            "share",
            "download",
            "print",
            "submission",
            "return",
            "native_conversion",
            "result_view",
            "download_pdf",
            "download_png",
            "certificate_request",
          ].includes(s),
      )
    )
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Choose two to eight declared funnel steps.",
      );
    if (input.recordId) await record(c, text(input.recordId));
    return result(
      db.rpc("ac_dce_strategy", {
        p_tenant: c.tenantId,
        p_territory: c.territoryId,
        p_since: since,
        p_until: until,
        p_environment: environment,
        p_family: text(input.family),
        p_locale: text(input.locale),
        p_record: input.recordId || null,
        p_steps: steps,
      }),
    );
  }
  if (op === "pro_presence") {
    await fieldRecord(c, text(input.id));
    const rows = await result(
      inScope(
        db
          .from("ac_dce_edit_presence")
          .select("actor_id,display_name,field_path,expires_at,session_id"),
        c,
      )
        .eq("record_id", input.id)
        .gt("expires_at", new Date().toISOString()),
    );
    return { rows };
  }
  if (op === "pro_text") {
    const r = await fieldRecord(c, text(input.id)),
      path = sharedTextPath(JSON.parse(text(input.path) || "[]")),
      d = await result(
        db
          .from("ac_dce_text_documents")
          .select("*")
          .eq("record_id", r.id)
          .contains("path", path)
          .maybeSingle(),
      );
    const value = String(pathValue(r, path) || "");
    return {
      recordRevision: r.revision,
      document:
        d && renderText(d.nodes) === value
          ? d
          : { generation: null, revision: 0, nodes: seedText(value) },
      value,
      replaced: !!d && renderText(d.nodes) !== value,
    };
  }
  if (op === "pro_cases") {
    authorize(c, "moderate");
    const page = await list(c, {
        kind: "case",
        q: input.q,
        lifecycle: input.lifecycle,
        page: input.page,
        pageSize: 30,
      }),
      ids = page.rows.map((r) => r.id),
      operations = ids.length
        ? await result<WorkItem[]>(
            inScope(db.from("ac_dce_work_items").select("*"), c)
              .eq("kind", "case_operation")
              .in("record_id", ids),
          )
        : [],
      policies = (await scopedWork(c, "sla_policy", "active")).sort(
        (a, b) =>
          b.updated_at.localeCompare(a.updated_at) || a.id.localeCompare(b.id),
      );
    const rows = page.rows.map((r) => {
      const op = operations.find((o) => o.record_id === r.id),
        policy =
          policies.find((p) => p.id === op?.data.policyId) ||
          policies.find(
            (p) => p.data.caseType && p.data.caseType === op?.data.caseType,
          ) ||
          policies.find((p) => !p.data.caseType);
      let service = null;
      try {
        if (policy) service = slaState(r, op?.data || {}, policy.data);
      } catch {}
      return {
        ...r,
        service,
        serviceTeam: op?.data.team || r.data.responsibleTeam || "",
        serviceAssignedTo: op?.data.assignedTo || r.data.assignedTo || null,
      };
    });
    return { ...page, rows };
  }
  if (op === "pro_case") {
    authorize(c, "moderate");
    const r = await record(c, text(input.id));
    if (r.kind !== "case")
      throw new MarketplaceError("VALIDATION_ERROR", "Choose a received case.");
    const operation = await result(
        inScope(db.from("ac_dce_work_items").select("*"), c)
          .eq("kind", "case_operation")
          .eq("record_id", r.id)
          .maybeSingle(),
      ),
      policies = (await scopedWork(c, "sla_policy", "active")).sort(
        (a, b) =>
          b.updated_at.localeCompare(a.updated_at) || a.id.localeCompare(b.id),
      );
    const policy =
      policies.find((p: WorkItem) => p.id === operation?.data.policyId) ||
      policies.find(
        (p: WorkItem) =>
          !p.data.caseType || p.data.caseType === operation?.data.caseType,
      );
    let target = null;
    try {
      if (policy) target = slaState(r, operation?.data || {}, policy.data);
    } catch {}
    const communications = await result(
      inScope(db.from("ac_dce_work_items").select("*"), c)
        .eq("kind", "notification")
        .eq("record_id", r.id)
        .order("created_at", { ascending: false })
        .limit(100),
    );
    if (policy && !operation?.data.firstResponseAt) {
      const first = communications
        .filter((w: WorkItem) => w.status === "provider_accepted")
        .sort((a: WorkItem, b: WorkItem) =>
          a.updated_at.localeCompare(b.updated_at),
        )[0];
      if (first)
        target = slaState(
          r,
          { ...operation?.data, firstResponseAt: first.updated_at },
          policy.data,
        );
    }
    return { record: r, operation, policy, target, communications };
  }
  if (op === "pro_translation_audit") {
    const page = Math.max(1, Math.floor(number(input.page, 1))),
      q = await inScope(
        db.from("ac_dce_records").select("*", { count: "exact" }),
        c,
      )
        .in("kind", ["experience", "content", "template", "bundle"])
        .order("id")
        .range((page - 1) * 30, page * 30 - 1);
    if (q.error) dbError(q.error);
    return {
      rows: (q.data || []).map((r: DceRecord) => ({
        id: r.id,
        title: r.title,
        family: r.family,
        revision: r.revision,
        activeReleaseRetained: !!r.published_release_id,
        locales: Object.fromEntries(
          ["fr", "en", "ar"].map((l) => [
            l,
            {
              ...translationCoverage(r, l),
              missingLabels: translationCoverage(r, l).missing.map((path) =>
                coverageFieldLabel(r, path, c.locale),
              ),
            },
          ]),
        ),
      })),
      total: q.count,
      page,
      pageSize: 30,
    };
  }
  if (op === "pro_disposal") {
    authorize(c, "purge");
    const plan = await workItem(c, text(input.id));
    if (plan.kind !== "disposal")
      throw new MarketplaceError("VALIDATION_ERROR", "Choose a disposal plan.");
    const page = Math.max(1, Math.floor(number(input.page, 1))),
      q = await db
        .from("ac_dce_disposal_items")
        .select("*", { count: "exact" })
        .eq("plan_id", plan.id)
        .order("id")
        .range((page - 1) * 30, page * 30 - 1);
    if (q.error) dbError(q.error);
    return { plan, rows: q.data || [], total: q.count, page, pageSize: 30 };
  }
  throw new MarketplaceError(
    "VALIDATION_ERROR",
    "Unsupported professional query.",
  );
}
export async function professionalCommand(
  c: Context,
  cmd: Command,
): Promise<any> {
  authorize(c, "view");
  const db = await createServiceClient(),
    action = cmd.action,
    input = object(cmd.input);
  if (action === "pro_notice_read") {
    const w = await workItem(c, text(cmd.id));
    if (w.kind !== "editorial_notice")
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Choose your editorial notification.",
      );
    return writeItem(
      c,
      { ...cmd, revision: w.revision },
      { ...w, status: "read" },
    );
  }
  if (action === "pro_save") {
    const kind = text(input.kind) as WorkKind;
    if (
      ![
        "task",
        "comment",
        "sla_policy",
        "retention_policy",
        "saved_report",
        "editorial_policy",
      ].includes(kind)
    )
      throw new MarketplaceError(
        "FORBIDDEN",
        "This collection has a dedicated governed operation.",
      );
    kindRight(c, kind, true);
    const old = cmd.id ? await workItem(c, cmd.id) : null,
      recordId = text(input.record_id) || null;
    if (recordId) {
      const target = await record(c, recordId);
      if (
        ["task", "comment"].includes(kind) &&
        !["experience", "content", "template", "bundle", "asset"].includes(
          target.kind,
        )
      )
        throw new MarketplaceError(
          "FORBIDDEN",
          "Editorial tasks and comments require an authored or media dossier.",
        );
    }
    if (old?.kind === "comment")
      throw new MarketplaceError(
        "FORBIDDEN",
        "Review comments are append-only.",
      );
    let data = workData(kind, object(input.data));
    const status = text(input.status) || "open",
      title = text(input.title).slice(0, 240);
    if (!title)
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "A meaningful title is required.",
      );
    if (kind === "task") {
      for (const key of [
        "submittedRevision",
        "reviewedRevision",
        "reviewedBy",
        "reviewedAt",
        "reviewInvalidatedAt",
        "changedRevision",
        "editionHash",
        "reviewedEditionHash",
      ]) {
        delete data[key];
        if (old?.data[key] !== undefined) data[key] = old.data[key];
      }
      if (
        old?.data.reviewerId &&
        old.data.reviewerId !== data.reviewerId &&
        status === "done"
      )
        throw new MarketplaceError(
          "CONFLICT",
          "Reviewer reassignment requires a fresh review submission.",
        );
      await staff(c, data.assignedTo);
      await staff(c, data.reviewerId);
      if (
        data.dependencies &&
        (!Array.isArray(data.dependencies) ||
          data.dependencies.length > 50 ||
          data.dependencies.some((id) => !isId(id)))
      )
        throw new MarketplaceError(
          "VALIDATION_ERROR",
          "Choose valid task dependencies.",
        );
      if (status === "review" && recordId)
        data = {
          ...data,
          submittedRevision: (await record(c, recordId)).revision,
          ...(data.locale
            ? {
                editionHash: editionHash(
                  await record(c, recordId),
                  data.locale as any,
                ),
              }
            : {}),
        };
      if (
        status === "done" &&
        old &&
        (old.record_id !== recordId || old.data.locale !== data.locale)
      )
        throw new MarketplaceError(
          "CONFLICT",
          "Changing the target or language requires a fresh review submission.",
        );
      if (status === "done" && data.reviewerId) {
        if (!old || old.status !== "review")
          throw new MarketplaceError(
            "CONFLICT",
            "Submit the exact revision before completing review.",
          );
        if (data.reviewerId !== c.actor.id || data.assignedTo === c.actor.id)
          throw new MarketplaceError(
            "PERMISSION_DENIED",
            "The designated independent reviewer must complete this review.",
          );
        if (
          recordId &&
          (old?.data.locale
            ? old?.data.editionHash !==
              editionHash(await record(c, recordId), old.data.locale as any)
            : old?.data.submittedRevision !==
              (await record(c, recordId)).revision)
        )
          throw new MarketplaceError(
            "CONFLICT",
            "The dossier changed after submission. Review the latest revision.",
          );
        data = {
          ...data,
          reviewedBy: c.actor.id,
          reviewedAt: new Date().toISOString(),
          reviewedRevision: old?.data.submittedRevision || null,
          ...(old?.data.locale
            ? { reviewedEditionHash: old.data.editionHash }
            : {}),
        };
      }
    }
    if (
      kind === "task" &&
      status === "done" &&
      recordId &&
      data.locale &&
      !data.reviewerId
    ) {
      const current = editionHash(
        await record(c, recordId),
        data.locale as any,
      );
      if (
        old?.status === "done" &&
        old.data.reviewedEditionHash &&
        old.data.reviewedEditionHash !== current
      )
        throw new MarketplaceError(
          "CONFLICT",
          "Reopen this task and inspect the changed edition before completing it again.",
        );
      data = { ...data, reviewedEditionHash: current, completedBy: c.actor.id };
    }
    if (kind === "editorial_policy") {
      data = { independentReview: data.independentReview === true };
      if (!["active", "inactive"].includes(status))
        throw new MarketplaceError(
          "VALIDATION_ERROR",
          "Choose an active or inactive policy.",
        );
    }
    if (kind === "sla_policy") {
      await staff(c, data.escalateTo);
      if (!["active", "inactive"].includes(status))
        throw new MarketplaceError(
          "VALIDATION_ERROR",
          "Choose an active or inactive policy.",
        );
    }
    if (kind === "saved_report") {
      data = { ...data, ownerId: old?.data.ownerId || c.actor.id };
      if (old && old.data.ownerId !== c.actor.id)
        throw new MarketplaceError(
          "PERMISSION_DENIED",
          "Only the report owner can change its definition.",
        );
    }
    return writeItem(c, cmd, {
      kind,
      record_id: recordId,
      title,
      status,
      data,
    });
  }
  if (action === "pro_presence") {
    await fieldRecord(c, text(cmd.id));
    const existingPresence = await result(
      db
        .from("ac_dce_edit_presence")
        .select("actor_id")
        .eq("record_id", cmd.id)
        .eq("session_id", input.sessionId)
        .maybeSingle(),
    );
    if (existingPresence && existingPresence.actor_id !== c.actor.id)
      throw new MarketplaceError(
        "FORBIDDEN",
        "This collaboration session belongs to another operator.",
      );
    if (!isId(input.sessionId))
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "A collaboration session is required.",
      );
    const data = {
      record_id: cmd.id,
      session_id: input.sessionId,
      actor_id: c.actor.id,
      display_name: c.actor.displayName,
      field_path: text(input.field).slice(0, 200),
      expires_at: new Date(
        Date.now() + (input.leave ? 0 : 45000),
      ).toISOString(),
      tenant_id: c.tenantId,
      territory_id: c.territoryId,
    };
    await result(
      db
        .from("ac_dce_edit_presence")
        .upsert(data, { onConflict: "record_id,session_id" }),
    );
    return { acknowledged: true, expiresAt: data.expires_at };
  }
  if (action === "pro_patch") {
    await fieldRecord(c, text(cmd.id));
    const path = collaborationPath(input.path);
    if (input.after === undefined)
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "A new value is required.",
      );
    return result(
      db.rpc("ac_dce_field_patch", {
        ...commandArgs(c, cmd),
        p_id: cmd.id,
        p_path: path,
        p_before: input.before ?? null,
        p_after: input.after,
      }),
    );
  }
  if (action === "pro_text") {
    const path = sharedTextPath(input.path),
      operations = input.operations as unknown as TextOperation[];
    if (!Array.isArray(operations))
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Text operations are required.",
      );
    for (let attempt = 0; attempt < 5; attempt++) {
      const r = await fieldRecord(c, text(cmd.id)),
        value = String(pathValue(r, path) || ""),
        doc = await result(
          db
            .from("ac_dce_text_documents")
            .select("*")
            .eq("record_id", r.id)
            .contains("path", path)
            .maybeSingle(),
        );
      const reset = !!doc && renderText(doc.nodes) !== value;
      if (reset && (input.generation || operations.length))
        throw new MarketplaceError(
          "CONFLICT",
          "This text was replaced outside the shared editor. Reopen it and reconcile your retained text.",
        );
      let nodes: TextNode[] = reset
        ? seedText(value)
        : doc?.nodes || seedText(value);
      if (!reset && (doc?.generation || null) !== (input.generation || null))
        throw new MarketplaceError(
          "CONFLICT",
          "The shared text generation changed. Reopen and reconcile.",
        );
      const updated = applyTextOperations(nodes, operations),
        q = await db.rpc("ac_dce_text_commit", {
          p_actor: c.actor.id,
          p_tenant: c.tenantId,
          p_territory: c.territoryId,
          p_id: r.id,
          p_path: path,
          p_generation: doc?.generation || null,
          p_doc_revision: doc?.revision || 0,
          p_reset: reset,
          p_before: value,
          p_nodes: updated,
          p_value: renderText(updated),
          p_spans: textSpans(updated),
        });
      if (q.error && /DOC_REVISION_CONFLICT/.test(q.error.message)) continue;
      if (q.error) dbError(q.error);
      return q.data;
    }
    throw new MarketplaceError(
      "CONFLICT",
      "The shared field is changing quickly. Your edits are retained; retry.",
    );
  }
  if (action === "pro_approval_exception")
    throw new MarketplaceError(
      "DEPENDENCY_BLOCKED",
      "Legacy dossier approval is retired for language editions. Open the exact language in Actions & delivery and complete its review. Independent review remains enforced.",
    );
  if (action === "pro_enqueue") {
    authorize(c, "manage");
    authorize(c, "media");
    let source: any;
    let recordId: string | null = null;
    if (input.sourceReceiptId) {
      source = await result(
        inScope(db.from("ac_dce_production_sources").select("*"), c)
          .eq("id", input.sourceReceiptId)
          .eq("state", "verified")
          .maybeSingle(),
      );
      if (!source)
        throw new MarketplaceError(
          "NOT_FOUND",
          "Verified production source unavailable.",
        );
      source = {
        id: source.id,
        mime: source.mime_type,
        sha256: source.sha256,
        bytes: Number(source.size_bytes),
        title: source.file_name,
        authority: "dce_source",
      };
    } else {
      const r = await record(c, text(input.recordId));
      if (r.kind !== "asset" || !isId(r.data.nativeAssetId))
        throw new MarketplaceError(
          "VALIDATION_ERROR",
          "Select a registered DCE source.",
        );
      recordId = r.id;
      if (!(await native(c, "media", { id: r.data.nativeAssetId })).rows.length)
        throw new MarketplaceError(
          "NOT_FOUND",
          "An active native media source is required; private case files are not production sources.",
        );
      const nativeSource = await fetchMarketplaceGatewayAsset(
        text(r.data.nativeAssetId),
      );
      source = {
        id: nativeSource.assetId,
        mime: nativeSource.mimeType,
        sha256: nativeSource.sha256,
        bytes: nativeSource.sizeBytes,
        title: r.title,
        authority: "native_media",
      };
    }
    const recipe = recipeInput(source, object(input.recipe)),
      fingerprint = createHash("sha256")
        .update(
          JSON.stringify({ source: source.id, sha256: source.sha256, recipe }),
        )
        .digest("hex"),
      existing = await result(
        inScope(db.from("ac_dce_work_items").select("*"), c)
          .eq("kind", "media_job")
          .eq("data->>fingerprint", fingerprint)
          .neq("status", "cancelled")
          .maybeSingle(),
      );
    if (existing) return { item: existing, reused: true };
    const item = await writeItem(c, cmd, {
      kind: "media_job",
      record_id: recordId,
      title: source.title + " · " + recipe.recipe,
      status: "queued",
      data: {
        source,
        recipe,
        fingerprint,
        requiredTools: [
          ...RECIPES.find((r) => r.key === recipe.recipe)!.tools,
          ...(recipe.recipe === "ocr"
            ? [
                "tesseract:" +
                  (
                    {
                      fr: "fra",
                      en: "eng",
                      ar: "ara",
                      fra: "fra",
                      eng: "eng",
                      ara: "ara",
                    } as Record<string, string>
                  )[text(recipe.language)],
              ]
            : []),
        ],
        attempts: 0,
        priority: Math.max(0, Math.min(10, number(input.priority))),
        requestedBy: c.actor.id,
        outputs: [],
      },
    });
    return { item, reused: false };
  }
  if (action === "pro_create_experience") {
    authorize(c, "manage");
    authorize(c, "media");
    const w = await workItem(c, text(cmd.id));
    if (w.kind !== "media_job")
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Choose a reviewed production job.",
      );
    return (await import("./production-native")).createExperienceFromProduction(
      c,
      w,
      cmd,
    );
  }
  if (
    [
      "pro_cancel_job",
      "pro_retry_job",
      "pro_review_job",
      "pro_promote_job",
    ].includes(action)
  ) {
    authorize(c, "manage");
    authorize(c, "media");
    const w = await workItem(c, text(cmd.id));
    if (w.kind !== "media_job")
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Choose a production job.",
      );
    let status = w.status,
      data = { ...w.data };
    if (action === "pro_cancel_job") {
      if (!["queued", "running", "failed", "needs_review"].includes(status))
        throw new MarketplaceError("CONFLICT", "This job cannot be cancelled.");
      status = status === "running" ? "cancel_requested" : "cancelled";
    }
    if (action === "pro_retry_job") {
      if (!["failed", "cancelled"].includes(status))
        throw new MarketplaceError(
          "CONFLICT",
          "Only failed or cancelled work can be retried.",
        );
      status = "queued";
      data = {
        ...data,
        attempts: 0,
        errorCode: null,
        errorStage: null,
        lease: null,
        leaseUntil: null,
      };
    }
    if (action === "pro_review_job") {
      if (w.status !== "needs_review")
        throw new MarketplaceError(
          "CONFLICT",
          "The job is not awaiting review.",
        );
      const reviewed = object(input.review),
        original = object(data.result),
        cues = Array.isArray(reviewed.cues)
          ? array(reviewed.cues)
          : array(original.cues);
      if (
        cues.length > 2000 ||
        cues.some(
          (c) =>
            !Number.isFinite(Number(c.start)) ||
            !Number.isFinite(Number(c.end)) ||
            number(c.start) < 0 ||
            number(c.end) <= number(c.start) ||
            !text(c.text) ||
            text(c.text).length > 4000 ||
            (number(original.duration) > 0 &&
              number(c.end) > number(original.duration)),
        )
      )
        throw new MarketplaceError(
          "VALIDATION_ERROR",
          "Review caption intervals and text before approving the result.",
        );
      data = {
        ...data,
        result: {
          ...original,
          text:
            typeof reviewed.text === "string"
              ? reviewed.text
              : original.text || "",
          cues: cues.map((c, i) => ({
            ...c,
            id: text(c.id) || "cue-" + (i + 1),
          })),
          alt: text(reviewed.alt) || object(data.recipe).alt || "",
        },
        reviewedRights: [
          "owned",
          "licensed",
          "permission",
          "public_domain",
          "unverified",
        ].includes(text(reviewed.rights))
          ? text(reviewed.rights)
          : "unverified",
        reviewedBy: c.actor.id,
        reviewedAt: new Date().toISOString(),
      };
      status = "ready";
    }
    if (action === "pro_promote_job") {
      if (w.status !== "ready")
        throw new MarketplaceError(
          "DEPENDENCY_BLOCKED",
          "Review the production results before making them available.",
        );
      const { promoteOutputs } = await import("./production-native");
      return promoteOutputs(c, w, cmd);
    }
    return writeItem(
      c,
      { ...cmd, revision: cmd.revision || w.revision },
      { ...w, status, data },
    );
  }
  if (action === "pro_dispatch_message") {
    authorize(c, "moderate");
    return (await import("./professional-messaging")).dispatchCaseMessage(
      c,
      cmd,
    );
  }
  if (action === "pro_case_update") return updateCase(c, cmd, input);
  if (action === "pro_case_message") {
    authorize(c, "moderate");
    const r = await record(c, text(cmd.id));
    if (r.data.source === "explicit_certificate_request")
      throw new MarketplaceError(
        "DEPENDENCY_BLOCKED",
        "Open the linked Certificate Request for its explicit guest contact and follow-up. This internal document subcase does not require a customer account.",
      );
    if (r.kind !== "case" || !isId(r.data.customerId))
      throw new MarketplaceError(
        "DEPENDENCY_BLOCKED",
        "A case linked to a native customer is required.",
      );
    const customer = await caseRecipient(c, r);
    if (!customer?.email)
      throw new MarketplaceError(
        "DEPENDENCY_BLOCKED",
        "The native customer has no email address.",
      );
    if (
      !text(input.body) ||
      text(input.body).length > 8000 ||
      !text(input.subject)
    )
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Write a subject and a message within 8000 characters.",
      );
    return writeItem(
      c,
      { ...cmd, id: undefined, revision: 0 },
      {
        kind: "notification",
        record_id: r.id,
        title: text(input.subject).slice(0, 240),
        status: "queued",
        data: {
          channel: "email",
          recipient: customer.email,
          body: text(input.body),
          sender: "supports@angelcarehub.ma",
          caseRevision: r.revision,
          attempts: 0,
          locale: c.locale,
          customerId: r.data.customerId,
        },
      },
    );
  }
  if (action === "pro_process_due") {
    authorize(c, "moderate");
    return processProfessionalDue(c, 10);
  }
  if (action === "pro_prepare_disposal") {
    authorize(c, "purge");
    return prepareDisposal(c, cmd, input);
  }
  if (action === "pro_recheck_disposal") {
    authorize(c, "purge");
    const w = await workItem(c, text(cmd.id));
    if (w.kind !== "disposal" || w.status !== "scheduled")
      throw new MarketplaceError("CONFLICT", "Choose an active disposal plan.");
    await result(
      db
        .from("ac_dce_disposal_items")
        .update({ state: "scheduled", updated_at: new Date().toISOString() })
        .eq("plan_id", w.id)
        .eq("state", "blocked"),
    );
    return { recheckScheduled: true };
  }
  if (action === "pro_cancel_disposal") {
    authorize(c, "purge");
    const w = await workItem(c, text(cmd.id));
    if (w.kind !== "disposal" || !["scheduled", "failed"].includes(w.status))
      throw new MarketplaceError(
        "CONFLICT",
        "This disposal cannot be cancelled.",
      );
    await result(
      db
        .from("ac_dce_disposal_items")
        .update({ state: "cancelled" })
        .eq("plan_id", w.id)
        .in("state", ["scheduled", "blocked", "failed"]),
    );
    return writeItem(
      c,
      { ...cmd, revision: w.revision },
      { ...w, status: "cancelled" },
    );
  }
  if (action === "pro_execute_disposal") {
    authorize(c, "purge");
    return executeDisposal(c, cmd);
  }
  if (action === "pro_hold") {
    authorize(c, "purge");
    const r = await record(c, text(cmd.id));
    if (
      !["case", "run", "contribution"].includes(r.kind) ||
      text(cmd.reason).length < 8
    )
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Choose a private DCE dossier and provide a hold reason.",
      );
    return result(
      db.rpc("ac_dce_retention_hold", {
        ...commandArgs(c, cmd),
        p_id: r.id,
        p_revision: cmd.revision,
        p_active: input.active !== false,
        p_reason: text(cmd.reason),
      }),
    );
  }
  if (action === "pro_source_prepare" || action === "pro_source_complete") {
    authorize(c, "manage");
    authorize(c, "media");
    return productionSource(c, cmd, input);
  }
  throw new MarketplaceError(
    "VALIDATION_ERROR",
    "Unsupported professional operation.",
  );
}
async function updateCase(c: Context, cmd: Command, input: Data) {
  authorize(c, "moderate");
  let r = await record(c, text(cmd.id));
  if (r.kind !== "case")
    throw new MarketplaceError("VALIDATION_ERROR", "Choose a received case.");
  await staff(c, input.assignedTo);
  const db = await createServiceClient(),
    old = await result(
      inScope(db.from("ac_dce_work_items").select("*"), c)
        .eq("kind", "case_operation")
        .eq("record_id", r.id)
        .maybeSingle(),
    );
  if (old && input.operationRevision !== old.revision)
    throw new MarketplaceError(
      "CONFLICT",
      "The case operation changed. Reload it before saving.",
    );
  const status = text(input.status) || r.lifecycle;
  if (
    !["open", "assigned", "waiting_customer", "resolved", "closed"].includes(
      status,
    )
  )
    throw new MarketplaceError(
      "VALIDATION_ERROR",
      "Choose a valid case status.",
    );
  if (
    ["closed", "resolved"].includes(status) &&
    text(input.resolution).length < 8
  )
    throw new MarketplaceError(
      "VALIDATION_ERROR",
      "A meaningful resolution summary is required.",
    );
  if (input.policyId) {
    const p = await workItem(c, text(input.policyId));
    if (p.kind !== "sla_policy" || p.status !== "active")
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Choose an active service policy.",
      );
  }
  const data: Data = {
    ...old?.data,
    assignedTo: text(input.assignedTo),
    team: text(input.team).slice(0, 120),
    caseType: text(input.caseType).slice(0, 80),
    priority: text(input.priority) || "normal",
    policyId: input.policyId || null,
    pauses: array(old?.data.pauses),
    firstResponseAt: old?.data.firstResponseAt || null,
  };
  const now = new Date().toISOString(),
    pauses = array(data.pauses);
  if (status === "waiting_customer" && r.lifecycle !== "waiting_customer")
    pauses.push({ start: now, end: null });
  if (status !== "waiting_customer" && r.lifecycle === "waiting_customer") {
    const last = pauses.at(-1);
    if (last && !last.end) last.end = now;
  }
  data.pauses = pauses;
  if (text(input.note))
    data.notes = [
      ...array(old?.data.notes),
      {
        body: text(input.note).slice(0, 8000),
        actorId: c.actor.id,
        createdAt: now,
      },
    ];
  if (input.mergeInto) {
    const other = await record(c, text(input.mergeInto));
    if (
      other.id === r.id ||
      other.kind !== "case" ||
      other.data.customerId !== r.data.customerId
    )
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Merge references must belong to the same native customer.",
      );
    data.duplicateOf = other.id;
  }
  return result(
    db.rpc("ac_dce_case_operation", {
      ...commandArgs(c, cmd),
      p_id: r.id,
      p_revision: cmd.revision,
      p_operation_id: old?.id || null,
      p_operation_revision: old?.revision || 0,
      p_data: data,
      p_status: status,
      p_resolution: text(input.resolution),
    }),
  );
}
async function productionSource(c: Context, cmd: Command, input: Data) {
  const db = await createServiceClient();
  if (cmd.action === "pro_source_prepare") {
    const mime = text(input.mime),
      name = text(input.name),
      bytes = number(input.bytes),
      sha256 = text(input.sha256);
    if (
      ![
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.oasis.opendocument.presentation",
      ].includes(mime) ||
      !name ||
      /[\/\\\x00-\x1f]/.test(name) ||
      !Number.isSafeInteger(bytes) ||
      bytes < 1 ||
      bytes > 40 * 1024 * 1024 ||
      !/^[a-f0-9]{64}$/.test(sha256)
    )
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Use a PPTX or ODP source up to 40 MiB with its checksum.",
      );
    const id = randomUUID();
    await result(
      db.from("ac_dce_production_sources").insert({
        id,
        file_name: name.slice(0, 160),
        mime_type: mime,
        size_bytes: bytes,
        sha256,
        created_by: c.actor.id,
        tenant_id: c.tenantId,
        territory_id: c.territoryId,
      }),
    );
    return {
      id,
      ...createMarketplaceMediaUploadSession({
        assetId: id,
        filename: name,
        mimeType: mime,
        maxBytes: bytes,
        actorUserId: c.actor.id,
      }),
    };
  }
  const r = await result(
    inScope(db.from("ac_dce_production_sources").select("*"), c)
      .eq("id", input.id)
      .maybeSingle(),
  );
  if (!r)
    throw new MarketplaceError("NOT_FOUND", "Production source unavailable.");
  const asset = await fetchMarketplaceGatewayAsset(r.id);
  if (
    asset.sha256 !== r.sha256 ||
    asset.sizeBytes !== Number(r.size_bytes) ||
    asset.mimeType !== r.mime_type
  )
    throw new MarketplaceError(
      "DATA_INTEGRITY",
      "Source differs from its signed receipt.",
    );
  return result(
    db
      .from("ac_dce_production_sources")
      .update({ state: "verified", verified_at: new Date().toISOString() })
      .eq("id", r.id)
      .select("*")
      .single(),
  );
}
async function processProfessionalDue(c: Context, limit: number) {
  const db = await createServiceClient(),
    policies = await scopedWork(c, "sla_policy", "active");
  let escalated = 0;
  const page = {
    data: await result<DceRecord[]>(
      db.rpc("ac_dce_service_batch", {
        p_tenant: c.tenantId,
        p_territory: c.territoryId,
        p_limit: limit,
      }),
    ),
  };
  for (const r of page.data || []) {
    const old = await result(
        inScope(db.from("ac_dce_work_items").select("*"), c)
          .eq("kind", "case_operation")
          .eq("record_id", r.id)
          .maybeSingle(),
      ),
      policy =
        policies.find((p: WorkItem) => p.id === old?.data.policyId) ||
        policies.find(
          (p: WorkItem) =>
            !p.data.caseType || p.data.caseType === old?.data.caseType,
        );
    if (!policy) continue;
    const state = slaState(r, old?.data || {}, policy.data);
    if (state.state !== "overdue" || old?.data.escalatedTarget === state.target)
      continue;
    let eligible = true;
    try {
      if (policy.data.escalateTo) await staff(c, policy.data.escalateTo);
      else eligible = false;
    } catch {
      eligible = false;
    }
    const data = {
      ...old?.data,
      policyId: policy.id,
      escalationStatus: eligible ? "assigned" : "unassigned",
      escalatedAt: new Date().toISOString(),
      escalatedTarget: state.target,
      assignedTo: eligible
        ? policy.data.escalateTo
        : old?.data.assignedTo || null,
      escalations: [
        ...array(old?.data.escalations),
        {
          at: new Date().toISOString(),
          target: state.target,
          assignedTo: eligible ? policy.data.escalateTo : null,
          status: eligible ? "assigned" : "no_eligible_operator",
        },
      ],
    };
    await writeItem(
      c,
      {
        action: "pro_escalate",
        id: old?.id,
        revision: old?.revision || 0,
        requestId: randomUUID(),
      },
      {
        kind: "case_operation",
        record_id: r.id,
        title: r.title,
        status: r.lifecycle,
        data,
      },
    );
    escalated++;
  }
  return {
    checked: page.data?.length || 0,
    escalated,
    scope: scopeKey(c),
    notifications:
      "Separate explicit dispatch preserves the existing mail transport.",
  };
}
async function prepareDisposal(c: Context, cmd: Command, input: Data) {
  const policy = await workItem(c, text(input.policyId));
  if (policy.kind !== "retention_policy" || policy.status !== "active")
    throw new MarketplaceError(
      "VALIDATION_ERROR",
      "Choose an active DCE retention policy.",
    );
  return result(
    (await createServiceClient()).rpc("ac_dce_disposal_prepare", {
      ...commandArgs(c, cmd),
      p_policy: policy.id,
      p_reason: text(cmd.reason),
    }),
  );
}
async function executeDisposal(c: Context, cmd: Command) {
  const plan = await workItem(c, text(cmd.id));
  if (plan.kind !== "disposal")
    throw new MarketplaceError("VALIDATION_ERROR", "Choose a disposal plan.");
  const db = await createServiceClient(),
    out = await result<any>(
      db.rpc("ac_dce_disposal_execute", {
        ...commandArgs(c, cmd),
        p_id: plan.id,
        p_limit: 30,
      }),
    );
  let deleted = 0,
    failed = 0;
  for (const job of out.byteDeletion || []) {
    let ok = false;
    try {
      await deleteMarketplaceGatewayAsset(job.assetId);
      ok = true;
      deleted++;
    } catch {
      failed++;
    }
    await result(
      db.rpc("ac_dce_disposal_finish", {
        p_actor: c.actor.id,
        p_tenant: c.tenantId,
        p_territory: c.territoryId,
        p_id: job.id,
        p_ok: ok,
      }),
    );
  }
  return {
    ...out,
    byteDeletion: undefined,
    filesDeleted: deleted,
    filesFailed: failed,
  };
}
/** Bounded automatic service checks reuse the existing native publication scheduler. */
export async function runProfessionalSchedules(limit = 10) {
  const db = await createServiceClient(),
    policies = await result<any[]>(
      db.rpc("ac_dce_service_scopes", { p_limit: 10 }),
    ),
    scopes = new Map(
      policies.map((p) => [
        (p.tenant_id || "~") + "|" + (p.territory_id || "~"),
        p,
      ]),
    ),
    results: any[] = [];
  for (const s of scopes.values()) {
    const c = {
      tenantId: s.tenant_id,
      territoryId: s.territory_id,
      locale: "en",
      actor: {
        id: "worker:dce-operations",
        displayName: "DCE operations",
        email: null,
        sourceRole: "system",
      },
      roleKeys: [],
      permissions: [
        "marketplace.digital_experience.view",
        "marketplace.digital_experience.moderate",
      ],
      assignments: [],
      sessionReference: null,
      workspaceKeys: ["workspace.digital_experience"],
    } as unknown as Context;
    try {
      results.push(
        await processProfessionalDue(c, Math.max(1, Math.min(limit, 20))),
      );
    } catch {
      results.push({ scope: scopeKey(c), state: "retry_pending" });
    }
  }
  return { scopes: results.length, results };
}
/** Case permission authorizes a targeted contact lookup, not unrestricted CRM browsing. */
export async function caseRecipient(c: Context, r: DceRecord) {
  authorize(c, "moderate");
  if (r.data.source === "explicit_certificate_request") {
    const db = await createServiceClient(),
      v = await result<any>(
        inScope(db.from("ac_dce_certificate_requests").select("*"), c)
          .eq("id", r.data.certificateRequestId)
          .maybeSingle(),
      );
    if (
      !v ||
      object(v.data).privateCaseId !== r.id ||
      object(v.data).anonymisedAt ||
      v.email === "anonymised@invalid.example"
    )
      throw new MarketplaceError(
        "NOT_FOUND",
        "The explicit guest certificate contact is unavailable.",
      );
    return { id: v.id, email: v.email };
  }
  if (r.kind !== "case" || !isId(r.data.customerId))
    throw new MarketplaceError(
      "DEPENDENCY_BLOCKED",
      "A native customer case is required.",
    );
  const db = await createServiceClient(),
    customer = await result<any>(
      db
        .from("angelcare_marketplace_customer_accounts")
        .select("id,email,tenant_id,territory_id")
        .eq("id", r.data.customerId)
        .maybeSingle(),
    );
  if (
    !customer?.email ||
    (customer.tenant_id && customer.tenant_id !== r.tenant_id) ||
    (customer.territory_id && customer.territory_id !== r.territory_id)
  )
    throw new MarketplaceError(
      "NOT_FOUND",
      "The native case contact is not available in this scope.",
    );
  return customer;
}
async function scopedWork(
  c: { tenantId: string | null; territoryId: string | null },
  kind: string,
  status = "",
) {
  const db = await createServiceClient(),
    rows: WorkItem[] = [];
  let cursor = "";
  for (let n = 0; n < 1000; n++) {
    let q = inScope(db.from("ac_dce_work_items").select("*"), c).eq(
      "kind",
      kind,
    );
    if (status) q = q.eq("status", status);
    if (cursor) q = q.gt("id", cursor);
    const batch = await result<WorkItem[]>(q.order("id").limit(1000));
    rows.push(...batch);
    if (batch.length < 1000) return rows;
    cursor = batch.at(-1)!.id;
  }
  throw new MarketplaceError(
    "NOT_READY",
    "Narrow the policy scope before processing this unusually large collection.",
  );
}
