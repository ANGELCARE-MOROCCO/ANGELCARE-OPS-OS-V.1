import {
  subscribeDocuments,
  unsubscribeDocuments,
} from "@/angelcare-marketplace/kidflix/documents/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
async function body(request: Request) {
  if (
    !request.headers.get("content-type")?.startsWith("application/json") ||
    Number(request.headers.get("content-length") || 0) > 4096 ||
    !request.body
  )
    throw Error("INVALID_BODY");
  const reader = request.body.getReader(),
    chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const r = await reader.read();
      if (r.done) break;
      size += r.value.byteLength;
      if (size > 4096) {
        await reader.cancel();
        throw Error("INVALID_BODY");
      }
      chunks.push(r.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}
function failure(e: unknown) {
  const message = String((e as Error).message);
  return Response.json(
    { error: "REQUEST_UNAVAILABLE" },
    {
      status:
        message === "RATE_LIMITED"
          ? 429
          : message.startsWith("INVALID")
            ? 400
            : message === "ORIGIN_REJECTED"
              ? 403
              : 503,
      headers,
    },
  );
}
export async function POST(request: Request) {
  try {
    return Response.json(
      await subscribeDocuments(request, await body(request)),
      { headers },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request) {
  try {
    return Response.json(
      await unsubscribeDocuments(request, await body(request)),
      { headers },
    );
  } catch (e) {
    return failure(e);
  }
}
