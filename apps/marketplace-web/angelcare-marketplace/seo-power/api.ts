import "server-only";
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireMarketplaceApiContext } from "../auth/context";
import { access, db, detail, snapshot } from "./repository";
import { perform } from "./actions";
import { authorizedWorker, runBatch } from "./runner";
import { record, SeoFault, text, uuid } from "./model";

function id() {
  return crypto.randomUUID();
}
export function failure(error: unknown, requestId: string) {
  const v = record(error),
    status =
      error instanceof SeoFault
        ? error.status
        : typeof v.status === "number"
          ? v.status
          : 500;
  const code =
    error instanceof SeoFault
      ? error.code
      : status === 401
        ? "AUTH_REQUIRED"
        : status === 403
          ? "FORBIDDEN"
          : "OPERATION_UNCONFIRMED";
  if (status >= 500)
    console.error(
      "[seo-power:" + requestId + "]",
      error instanceof SeoFault ? error.code : "Operation failed",
    );
  return NextResponse.json(
    {
      error: {
        code,
        message:
          error instanceof SeoFault
            ? error.message
            : status === 401
              ? "Connexion requise."
              : status === 403
                ? "Droit SEO requis."
                : "L’opération ne peut pas être confirmée. Référence " +
                  requestId,
      },
      requestId,
    },
    { status },
  );
}
async function context() {
  const ctx = await requireMarketplaceApiContext(
    "marketplace.web_presence.view",
  );
  if (!access(ctx).view)
    throw new SeoFault(
      "GLOBAL_SCOPE_REQUIRED",
      "Ce workspace agit sur le site public global. Une autorisation globale est requise.",
      403,
    );
  return ctx;
}
export async function jsonBody(
  request: Request,
  max = 2000000,
): Promise<Record<string, unknown>> {
  const origin = request.headers.get("origin"),
    host = request.headers.get("host") || new URL(request.url).host;
  if (origin) {
    let same = false;
    try {
      same = new URL(origin).host === host;
    } catch {}
    if (!same)
      throw new SeoFault("ORIGIN_REFUSED", "Origine de requête refusée.", 403);
  }
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new SeoFault("JSON_REQUIRED", "Corps JSON requis.", 415);
  if (Number(request.headers.get("content-length") || 0) > max)
    throw new SeoFault("REQUEST_TOO_LARGE", "Requête trop volumineuse.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new SeoFault("INVALID_JSON", "Corps JSON requis.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      throw new SeoFault("REQUEST_TOO_LARGE", "Requête trop volumineuse.", 413);
    }
    chunks.push(value);
  }
  try {
    const v = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!v || typeof v !== "object" || Array.isArray(v)) throw Error();
    return v;
  } catch {
    throw new SeoFault("INVALID_JSON", "Objet JSON invalide.");
  }
}
function csvCell(value: unknown) {
  let s = String(value ?? "");
  if (/^[=+@-]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}
export async function get(request: Request) {
  const rid = id();
  try {
    const ctx = await context(),
      url = new URL(request.url),
      action = url.searchParams.get("action");
    if (action === "sql") {
      const file = await readFile(
        path.join(
          process.cwd(),
          "angelcare-marketplace/seo-power/INSTALL_SEO_POWER_R1.sql",
        ),
        "utf8",
      );
      return new NextResponse(file, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="INSTALL_SEO_POWER_R1.sql"',
          "Cache-Control": "no-store",
        },
      });
    }
    if (action === "detail")
      return NextResponse.json(
        {
          data: await detail(uuid(url.searchParams.get("id"))),
          requestId: rid,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    if (action === "export") {
      const client = await db(),
        project = url.searchParams.get("project");
      if (project) uuid(project);
      let cursor = "",
        rows: Record<string, unknown>[] = [];
      for (let batch = 0; batch < 40 && rows.length < 10000; batch++) {
        let q = client
          .from("ac_seo_power_pages")
          .select(
            "id,path,locale,title,http_status,indexable,last_scanned_at,project_id",
          )
          .order("id")
          .limit(500);
        if (project) q = q.eq("project_id", project);
        if (cursor) q = q.gt("id", cursor);
        const r = await q;
        if (r.error)
          throw new SeoFault("EXPORT_FAILED", "Export non confirmé.", 503);
        if (!r.data?.length) break;
        rows.push(...r.data);
        cursor = String(r.data[r.data.length - 1].id);
      }
      const fields = [
        "path",
        "locale",
        "title",
        "http_status",
        "indexable",
        "last_scanned_at",
        "project_id",
      ];
      return new NextResponse(
        [
          fields.join(","),
          ...rows
            .slice(0, 10000)
            .map((r) => fields.map((f) => csvCell(r[f])).join(",")),
        ].join("\r\n"),
        {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition":
              'attachment; filename="seo-power-inventory.csv"',
            "Cache-Control": "no-store",
            "X-Export-Limit": "10000",
          },
        },
      );
    }
    return NextResponse.json(
      { data: await snapshot(ctx, url.searchParams), requestId: rid },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e, rid);
  }
}
export async function post(request: Request) {
  const rid = id();
  try {
    const ctx = await context(),
      rights = access(ctx),
      body = await jsonBody(request),
      action = text(body.action, 40),
      input = record(body.input),
      requestKey = text(body.requestKey, 120);
    if (!rights.manage)
      throw new SeoFault(
        "MANAGE_REQUIRED",
        "Autorisation de gestion SEO requise.",
        403,
      );
    if (["approve", "publish"].includes(action) && !rights.publish)
      throw new SeoFault(
        "PUBLISH_REQUIRED",
        "Autorisation de publication requise.",
        403,
      );
    if (action === "rollback" && !rights.rollback)
      throw new SeoFault(
        "ROLLBACK_REQUIRED",
        "Autorisation de restauration requise.",
        403,
      );
    if (
      action === "project" &&
      record(input.policy).autoCanonical === true &&
      !rights.publish
    )
      throw new SeoFault(
        "PUBLISH_REQUIRED",
        "La règle de publication autonome requiert le droit de publication.",
        403,
      );
    if (requestKey.length < 8)
      throw new SeoFault("REQUEST_KEY_REQUIRED", "Clé de requête requise.");
    const data =
      action === "run"
        ? await runBatch(input.projectId ? uuid(input.projectId) : null)
        : await perform(action, input, ctx, requestKey);
    return NextResponse.json({ data, requestId: rid });
  } catch (e) {
    return failure(e, rid);
  }
}
export async function run(request: Request) {
  const rid = id();
  try {
    const token = request.headers.get("x-seo-power-run-key") || "";
    if (!(await authorizedWorker(token)))
      throw new SeoFault(
        "RUN_KEY_REFUSED",
        "Exécution planifiée non autorisée.",
        403,
      );
    return NextResponse.json({ data: await runBatch(), requestId: rid });
  } catch (e) {
    return failure(e, rid);
  }
}
