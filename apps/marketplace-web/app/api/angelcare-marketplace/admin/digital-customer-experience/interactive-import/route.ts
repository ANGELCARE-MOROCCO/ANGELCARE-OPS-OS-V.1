import { assertAdminLoginSameOrigin } from "@/angelcare-marketplace/auth/admin/admin-auth";
import { requireMarketplaceApiContext } from "@/angelcare-marketplace/auth/context";
import { authorize } from "@/angelcare-marketplace/digital-customer-experience/repository";
import {
  advanceImport,
  beginImport,
  cancelImport,
  importStatus,
  putImportChunk,
  IMPORT_CHUNK_BYTES,
  listImports,
} from "@/angelcare-marketplace/kidflix/interactive/import-session";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private,no-store",
  "X-Content-Type-Options": "nosniff",
};
function fail(e: unknown) {
  const message = String((e as Error).message || "IMPORT_UNAVAILABLE"),
    code = String((e as { code?: unknown })?.code || "");
  const status = /PERMISSION|AUTH|CROSS_ORIGIN/.test(code + " " + message)
    ? 403
    : message.includes("NOT_FOUND")
      ? 404
      : message.includes("TOO_LARGE")
        ? 413
        : message.includes("CONFLICT")
          ? 409
          : 400;
  return Response.json({ error: message }, { status, headers });
}
async function actor(req: Request) {
  if (
    !req.headers.get("origin") ||
    !assertAdminLoginSameOrigin(req) ||
    req.headers.get("sec-fetch-site") === "cross-site"
  )
    throw Error("CROSS_ORIGIN_IMPORT_DENIED");
  const c = await requireMarketplaceApiContext(
    "marketplace.digital_experience.view",
  );
  authorize(c, "manage");
  return c;
}
export async function POST(req: Request) {
  try {
    const c = await actor(req);
    if (Number(req.headers.get("content-length")) > 16000)
      throw Error("IMPORT_REQUEST_TOO_LARGE");
    const reader = req.body?.getReader();
    if (!reader) throw Error("IMPORT_REQUEST_REQUIRED");
    let size = 0;
    const parts: Uint8Array[] = [];
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > 16000) {
        await reader.cancel();
        throw Error("IMPORT_REQUEST_TOO_LARGE");
      }
      parts.push(next.value);
    }
    const b = JSON.parse(Buffer.concat(parts).toString("utf8"));
    let data;
    switch (b.action) {
      case "list":
        data = await listImports(c, String(b.family), String(b.locale));
        break;
      case "begin":
        data = await beginImport(c, b);
        break;
      case "status":
        data = await importStatus(c, String(b.id));
        break;
      case "advance":
        data = await advanceImport(c, String(b.id));
        break;
      case "cancel":
        data = await cancelImport(c, String(b.id));
        break;
      default:
        throw Error("UNKNOWN_IMPORT_OPERATION");
    }
    return Response.json({ data }, { headers });
  } catch (e) {
    return fail(e);
  }
}
export async function PUT(req: Request) {
  try {
    const c = await actor(req),
      q = new URL(req.url).searchParams;
    const declared = Number(req.headers.get("content-length"));
    if (declared > IMPORT_CHUNK_BYTES) throw Error("IMPORT_CHUNK_TOO_LARGE");
    const reader = req.body?.getReader();
    if (!reader) throw Error("IMPORT_CHUNK_REQUIRED");
    const parts: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > IMPORT_CHUNK_BYTES) {
        await reader.cancel();
        throw Error("IMPORT_CHUNK_TOO_LARGE");
      }
      parts.push(value);
    }
    const data = await putImportChunk(
      c,
      q.get("id") || "",
      Number(q.get("index")),
      Buffer.concat(parts),
      req.headers.get("x-kidflix-checksum") || "",
    );
    return Response.json({ data }, { headers });
  } catch (e) {
    return fail(e);
  }
}
