import { editionProjection } from "./experience-contract";
import { createHash, randomUUID } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { MarketplaceError } from "../server/errors";
import type { MarketplaceRequestContext as Context } from "../domain/types";
import { authorize, record, command } from "./repository";
import { csv, parseCsv, TASKS } from "./imports";
import { FAMILIES } from "./registry";
import { isId } from "./model";
import { object, text, type Command, type Data } from "./types";
const scope = (q: any, c: Context) =>
  (c.tenantId ? q.eq("tenant_id", c.tenantId) : q.is("tenant_id", null))[
    c.territoryId ? "eq" : "is"
  ]("territory_id", c.territoryId || null);
async function checked(q: PromiseLike<any>) {
  const r = await q;
  if (r.error) {
    const m = text(r.error.message);
    throw new MarketplaceError(
      /does not exist|schema cache/i.test(m)
        ? "CONFIGURATION_ERROR"
        : /CONFLICT|BUSY|LEASE/.test(m)
          ? "CONFLICT"
          : "DEPENDENCY_BLOCKED",
      /does not exist|schema cache/i.test(m)
        ? "Operator tools pending: apply 11 then 13 in the separate SQL activation. Your data is retained."
        : m.slice(0, 300),
    );
  }
  return r.data;
}
export async function operatorRead(c: Context, input: Record<string, unknown>) {
  authorize(c, "view");
  const db = await createServiceClient(),
    op = text(input.op),
    page = Math.max(1, Math.floor(Number(input.page) || 1));
  if (op === "operator_features")
    return checked(db.rpc("ac_dce_r6_features", {}));
  if (op === "operator_coverage") {
    if (input.topic) await record(c, text(input.topic));
    return checked(
      db.rpc("ac_dce_r6_coverage", {
        p_tenant: c.tenantId,
        p_territory: c.territoryId,
        p_family: text(input.family),
        p_topic: input.topic || null,
        p_audience: text(input.audience),
        p_age:
          input.age === "" || input.age === undefined
            ? null
            : Number(input.age),
      }),
    );
  }
  if (op === "operator_template") {
    const r = await record(c, text(input.id)),
      l = text(input.locale);
    if (
      r.kind !== "template" ||
      r.family !== input.family ||
      !["ar", "fr", "en"].includes(l)
    )
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Choose a template of the selected family and language.",
      );
    const e = await checked(
      scope(db.from("ac_dce_editions").select("active_release_id"), c)
        .eq("record_id", r.id)
        .eq("locale", l)
        .maybeSingle(),
    );
    if (!e?.active_release_id)
      throw new MarketplaceError(
        "DEPENDENCY_BLOCKED",
        "Publish this template language before using it as an approved start.",
      );
    const z = await checked(
      scope(db.from("ac_dce_releases").select("snapshot,state"), c)
        .eq("id", e.active_release_id)
        .maybeSingle(),
    );
    if (z?.state !== "published")
      throw new MarketplaceError(
        "DEPENDENCY_BLOCKED",
        "The template release is not active.",
      );
    const d = editionProjection(z.snapshot, l as any).data;
    for (const k of [
      "certificatePolicy",
      "approval",
      "releaseId",
      "submittedRevision",
    ])
      delete d[k];
    return {
      prepared: {
        kind: "experience",
        family: r.family,
        title: r.title + " · copy",
        key: "",
        audience: r.audience,
        topic: r.topic,
        data: {
          ...d,
          templateId: r.id,
          enabledLocales: [l],
          defaultLocale: l,
          visibility: "free",
        },
      },
    };
  }
  if (op === "operator_production_trace") {
    authorize(c, "manage");
    authorize(c, "media");
    const item = await (
      await import("./professional")
    ).professionalRead(c, { op: "pro_item", id: input.id });
    const job = item.item;
    if (job?.kind !== "media_job")
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Choose a production job.",
      );
    const outputs = item.outputs || [],
      ids = outputs.map((o: any) => o.asset_id).filter(isId),
      links = ids.length
        ? await checked(
            db
              .from("ac_dce_links")
              .select("record_id")
              .eq("target_type", "media")
              .in("target_id", ids),
          )
        : [],
      recordIds = [...new Set(links.map((l: any) => l.record_id))];
    const records = recordIds.length
      ? await checked(
          scope(db.from("ac_dce_records").select("id,title,kind"), c).in(
            "id",
            recordIds,
          ),
        )
      : [];
    return { job, outputs, records };
  }
  if (op === "operator_retention") {
    authorize(c, "purge");
    return {
      plan: await checked(
        scope(db.from("ac_dce_certificate_retention").select("*"), c)
          .eq("request_id", input.id)
          .maybeSingle(),
      ),
    };
  }
  if (op === "operator_batch") {
    const b = await checked(
      scope(db.from("ac_dce_operator_batches").select("*"), c)
        .eq("id", input.id)
        .maybeSingle(),
    );
    if (!b) throw new MarketplaceError("NOT_FOUND", "Batch unavailable.");
    const ids = b.jobs || [];
    const jobs = ids.length
      ? await checked(
          scope(db.from("ac_dce_jobs").select("*"), c).in(
            "id",
            ids.slice((page - 1) * 30, page * 30),
          ),
        )
      : [];
    const { chunks, ...safe } = b;
    return {
      batch: { ...safe, total: chunks.length },
      counts: await checked(
        db.rpc("ac_dce_r6_batch_lines", {
          p_tenant: c.tenantId,
          p_territory: c.territoryId,
          p_id: b.id,
        }),
      ).then((p: any) => p.counts),
      rows: jobs,
      total: ids.length,
      page,
    };
  }
  if (op === "operator_batches") {
    const r = await scope(
      db
        .from("ac_dce_operator_batches")
        .select("id,family,task,source_name,state,cursor,revision,updated_at", {
          count: "exact",
        }),
      c,
    )
      .order("created_at", { ascending: false })
      .order("id")
      .range((page - 1) * 30, page * 30 - 1);
    if (r.error) await checked(Promise.resolve(r));
    return { rows: r.data || [], total: r.count || 0, page };
  }
  throw new MarketplaceError("VALIDATION_ERROR", "Unknown operator view.");
}
function derivedId(batch: string, cursor: number) {
  const h = createHash("sha256")
    .update(batch + ":" + cursor)
    .digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
export async function operatorCommand(c: Context, cmd: Command) {
  const db = await createServiceClient();
  if (["operator_expire_attempts", "operator_retention"].includes(cmd.action)) {
    authorize(c, "purge");
    if (!isId(cmd.requestId))
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "A stable receipt is required.",
      );
    if (cmd.action === "operator_retention" && !isId(cmd.id))
      throw new MarketplaceError("VALIDATION_ERROR", "Choose a certificate.");
    return checked(
      db.rpc("ac_dce_r6_privacy_command", {
        p_actor: c.actor.id,
        p_tenant: c.tenantId,
        p_territory: c.territoryId,
        p_request: cmd.requestId,
        p_hash: createHash("sha256").update(JSON.stringify(cmd)).digest("hex"),
        p_action:
          cmd.action === "operator_retention" ? "retention" : "expire_attempts",
        p_id: cmd.id || null,
        p_revision: Number(cmd.revision) || 0,
        p_data: { ...object(cmd.data), operation: text(cmd.operation) },
      }),
    );
  }
  authorize(c, "manage");
  const rpc = (action: string, id: string, revision: number, data: Data = {}) =>
    checked(
      db.rpc("ac_dce_r6_batch", {
        p_actor: c.actor.id,
        p_tenant: c.tenantId,
        p_territory: c.territoryId,
        p_id: id,
        p_revision: revision,
        p_action: action,
        p_data: data,
      }),
    );
  if (cmd.action === "operator_batch_create") {
    const source = text(cmd.source);
    if (Buffer.byteLength(source) > 4 * 1024 * 1024)
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Split files above 4 MiB.",
      );
    if (
      !FAMILIES.some((f) => f.key === cmd.family) ||
      !TASKS.includes(cmd.task as any)
    )
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Choose a family and task.",
      );
    const rows = parseCsv(source),
      headers = rows.shift() || [],
      key = headers.indexOf("key"),
      groups = new Map<string, string[][]>();
    if (key < 0 || !rows.length || rows.length > 5000)
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Use 1–5,000 rows and a stable key column.",
      );
    for (const row of rows) {
      const k = row[key]?.trim();
      if (!k)
        throw new MarketplaceError(
          "VALIDATION_ERROR",
          "Every row needs a resource key.",
        );
      groups.set(k, [...(groups.get(k) || []), row]);
    }
    if (!isId(cmd.requestId))
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "A stable batch receipt is required.",
      );
    const b = await rpc("create", cmd.requestId, 0, {
      family: text(cmd.family),
      task: text(cmd.task),
      sourceName: text(cmd.sourceName).slice(0, 160) || "operator.csv",
      sourceHash: createHash("sha256").update(source).digest("hex"),
      chunks: [...groups.values()].map((g) => csv([headers, ...g])),
    });
    const { chunks, ...safe } = b;
    return { batch: { ...safe, total: chunks.length } };
  }
  if (!isId(cmd.id))
    throw new MarketplaceError("VALIDATION_ERROR", "Choose a saved batch.");
  const action = text(cmd.operation);
  if (["pause", "resume", "apply"].includes(action)) {
    const b = await rpc(action, cmd.id, Number(cmd.revision));
    const { chunks, ...safe } = b;
    return { batch: { ...safe, total: chunks.length } };
  }
  if (action !== "continue")
    throw new MarketplaceError(
      "VALIDATION_ERROR",
      "Choose continue, pause, resume or apply.",
    );
  const b = await rpc("claim", cmd.id, Number(cmd.revision));
  try {
    if (b.state === "preparing") {
      const i = b.cursor;
      const result = await command(c, {
        action: "prepare_import",
        requestId: derivedId(b.id, i),
        family: b.family,
        task: b.task,
        source: b.chunks[i],
        sourceName: b.source_name + " · " + (i + 1),
      } as Command);
      await rpc("checkpoint", b.id, b.revision, {
        token: b.lease_token,
        cursor: i + 1,
        jobId: result.job.id,
        state: i + 1 === b.chunks.length ? "prepared" : "preparing",
      });
    } else {
      const progress = await checked(
        db.rpc("ac_dce_r6_batch_lines", {
          p_tenant: c.tenantId,
          p_territory: c.territoryId,
          p_id: b.id,
        }),
      );
      const pending = progress.ready.length > 0;
      for (const id of progress.ready)
        await command(c, {
          action: "apply_import",
          id,
          requestId: derivedId(b.id + id, 0),
        } as Command);
      await rpc("checkpoint", b.id, b.revision, {
        token: b.lease_token,
        cursor: b.cursor,
        state: pending ? "applying" : "complete",
      });
    }
  } catch (e) {
    await rpc("fail", b.id, b.revision, {
      token: b.lease_token,
      error: (e as Error).message,
    });
    throw e;
  }
  return operatorRead(c, { op: "operator_batch", id: b.id });
}
