import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { validInteractiveReference } from "../../digital-customer-experience/delivery-contract";
import { runtimeOrigin } from "./package";
import { KF_PACKAGE_TABLE, type PackageRow } from "./service";
export async function publicInteractiveHealth(
  releaseId: string,
  reference: unknown,
  probe = false,
) {
  if (!validInteractiveReference(reference))
    return {
      ready: false,
      mode: "identity",
      code: "INVALID_PUBLIC_INTERACTIVE_REFERENCE",
      tests: [],
    };
  const db = await createServiceClient(),
    result = await db
      .from(KF_PACKAGE_TABLE)
      .select("*")
      .eq("id", reference.id)
      .maybeSingle();
  const p = result.data as PackageRow | null;
  if (
    result.error ||
    !p ||
    !["published", "validated"].includes(p.state) ||
    p.checksum_sha256 !== reference.checksum ||
    p.locale !== reference.locale ||
    p.entry_path !== reference.entry
  )
    return {
      ready: false,
      mode: "identity",
      code: "PUBLIC_PACKAGE_UNAVAILABLE",
      tests: [],
    };
  if (!probe) return { ready: true, mode: "identity", tests: [] };
  const candidates = [
    p.entry_path,
    ...Object.keys(p.file_index)
      .filter(
        (path) => path !== p.entry_path && /\.(?:js|css|png)$/i.test(path),
      )
      .slice(0, 2),
  ];
  const tests = await Promise.all(
    candidates.map(async (path) => {
      const url =
        runtimeOrigin() +
        "/api/kidflix/interactive/runtime/release/" +
        releaseId +
        "/" +
        p.id +
        "/" +
        path.split("/").map(encodeURIComponent).join("/");
      try {
        const response = await fetch(url, {
          redirect: "error",
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        });
        const expected = p.file_index[path].mime.split(";")[0];
        const ok =
          response.ok &&
          response.headers.get("content-type")?.split(";")[0] === expected;
        if (!ok) {
          await response.body?.cancel();
          return { path, status: "failed", http: response.status };
        }
        // Force real delivery while bounding diagnostics independently of archive limits.
        const reader = response.body?.getReader();
        let bytes = 0;
        if (!reader) throw Error("EMPTY_RUNTIME_RESPONSE");
        for (;;) {
          const next = await reader.read();
          if (next.done) break;
          bytes += next.value.byteLength;
          if (bytes > 2 * 1024 * 1024) {
            await reader.cancel();
            return { path, status: "sampled", bytes };
          }
        }
        return { path, status: bytes ? "passed" : "failed", bytes };
      } catch {
        return { path, status: "failed" };
      }
    }),
  );
  return {
    ready: tests.every((t) => ["passed", "sampled"].includes(t.status)),
    mode: "bounded-runtime-sample",
    tests,
  };
}
