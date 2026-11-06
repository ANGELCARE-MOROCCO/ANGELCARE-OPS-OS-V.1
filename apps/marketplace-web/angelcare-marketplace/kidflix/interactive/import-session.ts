import { packageCompatibility } from "./compatibility";
import "server-only";
import { randomUUID } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import type { MarketplaceRequestContext as Context } from "../../domain/types";
import {
  authorize,
  scopeKey,
} from "../../digital-customer-experience/repository";
import { inspectZip, sha256, runtimeOrigin, KF_FAMILIES } from "./package";
import {
  KF_PACKAGE_BUCKET,
  KF_PACKAGE_TABLE,
  adminPackageInfo,
} from "./service";

export const IMPORT_CHUNK_BYTES = 4 * 1024 * 1024;
const TABLE = "ac_kidflix_import_sessions";
type Session = {
  id: string;
  scope_key: string;
  owner_actor_id: string;
  family_key: string;
  locale: string;
  record_id: string | null;
  checksum: string;
  size_bytes: number;
  chunk_count: number;
  received: number[];
  state: string;
  package_id: string;
  cursor: number;
  file_count: number;
  error: string | null;
  lease_token: string | null;
};
function checked<T = any>(r: { data: T; error: any }): T {
  if (r.error) throw Error(r.error.message || "IMPORT_STORAGE_UNAVAILABLE");
  return r.data;
}
const idPattern =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const prefix = (s: Session) =>
  s.scope_key.replace(/[^a-zA-Z0-9_-]/g, "_") + "/" + s.package_id;
async function session(c: Context, id: string) {
  authorize(c, "manage");
  if (!idPattern.test(id)) throw Error("INVALID_IMPORT_SESSION");
  const db = await createServiceClient();
  const s = checked(
    await db
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .eq("scope_key", scopeKey(c))
      .eq("owner_actor_id", c.actor.id)
      .maybeSingle(),
  ) as Session | null;
  if (!s) throw Error("IMPORT_SESSION_NOT_FOUND");
  return s;
}
function status(s: Session) {
  return {
    id: s.id,
    state: s.state,
    received: s.received,
    chunkBytes: IMPORT_CHUNK_BYTES,
    chunkCount: s.chunk_count,
    cursor: s.cursor,
    fileCount: s.file_count,
    packageId: s.package_id,
    error: s.error,
  };
}
export async function beginImport(
  c: Context,
  input: {
    checksum: string;
    size: number;
    family: string;
    locale: string;
    recordId?: string;
  },
) {
  authorize(c, "manage");
  runtimeOrigin();
  if (
    !/^[a-f0-9]{64}$/.test(input.checksum) ||
    !Number.isInteger(input.size) ||
    input.size < 22 ||
    input.size > 64 * 1024 * 1024 ||
    !(KF_FAMILIES as readonly string[]).includes(input.family) ||
    !["fr", "en", "ar"].includes(input.locale) ||
    (input.recordId && !idPattern.test(input.recordId))
  )
    throw Error("INVALID_IMPORT_DECLARATION");
  const db = await createServiceClient();
  // Receipt is scoped to actor and intended dossier; retries cannot steal bindings.
  const key = sha256(
    JSON.stringify([
      scopeKey(c),
      c.actor.id,
      input.checksum,
      input.family,
      input.locale,
      input.recordId || null,
    ]),
  );
  const existing = checked(
    await db.from(TABLE).select("*").eq("dedup_key", key).maybeSingle(),
  ) as Session | null;
  if (existing && existing.state !== "cancelled") {
    if (existing.size_bytes !== input.size) throw Error("IMPORT_SIZE_CONFLICT");
    return status(existing);
  }
  const row = {
    id: randomUUID(),
    scope_key: scopeKey(c),
    owner_actor_id: c.actor.id,
    family_key: input.family,
    locale: input.locale,
    record_id: input.recordId || null,
    checksum: input.checksum,
    size_bytes: input.size,
    chunk_count: Math.ceil(input.size / IMPORT_CHUNK_BYTES),
    received: [],
    state: "uploading",
    package_id: randomUUID(),
    cursor: 0,
    file_count: 0,
    error: null,
    dedup_key: key,
  };
  if (existing) {
    checked(
      await db
        .from(TABLE)
        .delete()
        .eq("id", existing.id)
        .eq("state", "cancelled"),
    );
  }
  const inserted = await db.from(TABLE).insert(row).select("*").single();
  if (inserted.error?.code === "23505") {
    const current = checked(
      await db.from(TABLE).select("*").eq("dedup_key", key).single(),
    ) as Session;
    return status(current);
  }
  return status(checked(inserted) as Session);
}
export async function importStatus(c: Context, id: string) {
  return status(await session(c, id));
}
export async function listImports(c: Context, family: string, locale: string) {
  authorize(c, "manage");
  const db = await createServiceClient();
  const rows = checked(
    await db
      .from(TABLE)
      .select("*")
      .eq("scope_key", scopeKey(c))
      .eq("owner_actor_id", c.actor.id)
      .eq("family_key", family)
      .eq("locale", locale)
      .neq("state", "cancelled")
      .order("updated_at", { ascending: false })
      .limit(40),
  ) as Session[];
  return rows.map(status);
}
export async function putImportChunk(
  c: Context,
  id: string,
  index: number,
  bytes: Buffer,
  checksum: string,
) {
  const s = await session(c, id);
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= s.chunk_count ||
    bytes.length !==
      Math.min(IMPORT_CHUNK_BYTES, s.size_bytes - index * IMPORT_CHUNK_BYTES) ||
    sha256(bytes) !== checksum
  )
    throw Error("IMPORT_CHUNK_INTEGRITY_FAILED");
  if (s.state !== "uploading") {
    if (s.received.includes(index)) return status(s);
    throw Error("IMPORT_SESSION_NOT_UPLOADING");
  }
  const db = await createServiceClient(),
    path = prefix(s) + "/chunks/" + index;
  const upload = await db.storage
    .from(KF_PACKAGE_BUCKET)
    .upload(path, bytes, {
      upsert: false,
      contentType: "application/octet-stream",
    });
  if (upload.error) {
    const stored = await db.storage.from(KF_PACKAGE_BUCKET).download(path);
    if (
      stored.error ||
      !stored.data ||
      sha256(Buffer.from(await stored.data.arrayBuffer())) !== checksum
    )
      throw Error("IMPORT_CHUNK_UPLOAD_FAILED");
  }
  // Append receipt in SQL under row lock; parallel chunks never lose each other.
  checked(
    await db.rpc("ac_kidflix_import_receive", {
      p_id: s.id,
      p_scope: s.scope_key,
      p_actor: c.actor.id,
      p_index: index,
    }),
  );
  return importStatus(c, id);
}
async function original(s: Session): Promise<Buffer> {
  const db = await createServiceClient(),
    base = prefix(s);
  const saved = await db.storage
    .from(KF_PACKAGE_BUCKET)
    .download(base + "/original.zip");
  if (!saved.error && saved.data) {
    const b = Buffer.from(await saved.data.arrayBuffer());
    if (b.length === s.size_bytes && sha256(b) === s.checksum) return b;
    throw Error("IMPORT_ARCHIVE_INTEGRITY_FAILED");
  }
  if (s.received.length !== s.chunk_count)
    throw Error("IMPORT_TRANSFER_INCOMPLETE");
  const chunks: Buffer[] = [];
  for (let i = 0; i < s.chunk_count; i++) {
    const chunk = await db.storage
      .from(KF_PACKAGE_BUCKET)
      .download(base + "/chunks/" + i);
    if (chunk.error || !chunk.data) throw Error("IMPORT_CHUNK_MISSING");
    chunks.push(Buffer.from(await chunk.data.arrayBuffer()));
  }
  const bytes = Buffer.concat(chunks);
  if (bytes.length !== s.size_bytes || sha256(bytes) !== s.checksum)
    throw Error("IMPORT_ARCHIVE_INTEGRITY_FAILED");
  const uploaded = await db.storage
    .from(KF_PACKAGE_BUCKET)
    .upload(base + "/original.zip", bytes, {
      upsert: false,
      contentType: "application/zip",
    });
  if (uploaded.error) {
    const retry = await db.storage
      .from(KF_PACKAGE_BUCKET)
      .download(base + "/original.zip");
    if (
      retry.error ||
      !retry.data ||
      sha256(Buffer.from(await retry.data.arrayBuffer())) !== s.checksum
    )
      throw Error("IMPORT_ARCHIVE_STORE_FAILED");
  }
  return bytes;
}
/** Each call does bounded work. Cursor/lease survive request, tab and process restarts. */
export async function advanceImport(c: Context, id: string) {
  let s = await session(c, id);
  if (s.state === "validated")
    return { ...status(s), package: await adminPackageInfo(c, s.package_id) };
  if (s.state === "cancelled") throw Error("IMPORT_CANCELLED");
  if (s.received.length !== s.chunk_count)
    throw Error("IMPORT_TRANSFER_INCOMPLETE");
  const db = await createServiceClient(),
    lease = randomUUID();
  const claimed = checked(
    await db.rpc("ac_kidflix_import_claim", {
      p_id: s.id,
      p_scope: s.scope_key,
      p_actor: c.actor.id,
      p_token: lease,
    }),
  ) as Session | null;
  if (!claimed) return { ...status(s), waiting: true };
  s = claimed;
  try {
    const previous = checked<any>(
      await db
        .from(KF_PACKAGE_TABLE)
        .select("state,checksum_sha256,file_index")
        .eq("id", s.package_id)
        .eq("scope_key", s.scope_key)
        .maybeSingle(),
    );
    if (previous && ["validated", "published"].includes(previous.state)) {
      if (previous.checksum_sha256 !== s.checksum)
        throw Error("IMPORT_PACKAGE_CONFLICT");
      const count = Object.keys(previous.file_index || {}).length;
      const completed = checked(
        await db
          .from(TABLE)
          .update({
            state: "validated",
            cursor: count,
            file_count: count,
            error: null,
            lease_token: null,
            lease_until: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", s.id)
          .eq("lease_token", lease)
          .select("*")
          .single(),
      ) as Session;
      return {
        ...status(completed),
        package: await adminPackageInfo(c, s.package_id),
      };
    }
    const archive = await original(s),
      p = inspectZip(archive);
    const compatibility = packageCompatibility(p);
    if (!compatibility.valid)
      throw Error(
        compatibility.issues
          .map((i) => i.code + ": " + i.path + " → " + i.detail)
          .join(" · "),
      );
    if (
      p.manifest.family_key !== s.family_key ||
      p.manifest.target_locale !== s.locale
    )
      throw Error("PACKAGE_CATEGORY_OR_LANGUAGE_MISMATCH");
    const fileIndex = Object.fromEntries(
      p.files.map((f) => [
        f.path,
        { size: f.bytes.length, mime: f.mime, sha256: f.hash },
      ]),
    );
    const row = {
      id: s.package_id,
      scope_key: s.scope_key,
      owner_actor_id: c.actor.id,
      family_key: s.family_key,
      locale: s.locale,
      manifest: { ...p.manifest, __kidflix_delivery: compatibility },
      checksum_sha256: p.checksum,
      entry_path: p.entry,
      original_storage_path: prefix(s) + "/original.zip",
      file_index: fileIndex,
      state: "processing",
      record_id: null,
      release_id: null,
    };
    if (s.cursor === 0) {
      const insert = await db.from(KF_PACKAGE_TABLE).insert(row);
      if (insert.error && insert.error.code !== "23505")
        throw Error("PACKAGE_RECORD_CREATE_FAILED");
      if (insert.error) {
        const prior = checked<any>(
          await db
            .from(KF_PACKAGE_TABLE)
            .select("checksum_sha256,state")
            .eq("id", s.package_id)
            .eq("scope_key", s.scope_key)
            .single(),
        );
        if (prior.checksum_sha256 !== p.checksum)
          throw Error("IMPORT_PACKAGE_CONFLICT");
      }
    }
    const stop = Math.min(p.files.length, s.cursor + 24);
    let next = s.cursor;
    await Promise.all(
      Array.from({ length: Math.min(4, stop - next) }, async () => {
        while (next < stop) {
          const f = p.files[next++],
            path = prefix(s) + "/files/" + f.path;
          const result = await db.storage
            .from(KF_PACKAGE_BUCKET)
            .upload(path, f.bytes, {
              contentType: f.mime,
              upsert: false,
              cacheControl: "31536000",
            });
          if (result.error) {
            const stored = await db.storage
              .from(KF_PACKAGE_BUCKET)
              .download(path);
            if (
              stored.error ||
              !stored.data ||
              sha256(Buffer.from(await stored.data.arrayBuffer())) !== f.hash
            )
              throw Error("PACKAGE_ASSET_UPLOAD_FAILED: " + f.path);
          }
        }
      }),
    );
    if (stop === p.files.length)
      checked(
        await db
          .from(KF_PACKAGE_TABLE)
          .update({ state: "validated" })
          .eq("id", s.package_id)
          .eq("scope_key", s.scope_key)
          .eq("state", "processing")
          .select("id")
          .single(),
      );
    const updated = checked(
      await db
        .from(TABLE)
        .update({
          cursor: stop,
          file_count: p.files.length,
          state: stop === p.files.length ? "validated" : "processing",
          error: null,
          lease_token: null,
          lease_until: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", s.id)
        .eq("lease_token", lease)
        .select("*")
        .single(),
    ) as Session;
    if (updated.state === "validated") {
      // Archive remains as the durable source; release only redundant chunks.
      await db.storage
        .from(KF_PACKAGE_BUCKET)
        .remove(
          Array.from(
            { length: s.chunk_count },
            (_, i) => prefix(s) + "/chunks/" + i,
          ),
        );
      return {
        ...status(updated),
        package: await adminPackageInfo(c, s.package_id),
      };
    }
    return status(updated);
  } catch (e) {
    await db
      .from(TABLE)
      .update({
        state: "failed",
        error: String((e as Error).message).slice(0, 1000),
        lease_token: null,
        lease_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", s.id)
      .eq("lease_token", lease);
    throw e;
  }
}
export async function cancelImport(c: Context, id: string) {
  const s = await session(c, id);
  if (s.state === "validated") throw Error("VALIDATED_PACKAGE_PRESERVED");
  const db = await createServiceClient();
  checked(
    await db
      .from(TABLE)
      .update({
        state: "cancelled",
        lease_token: null,
        lease_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("scope_key", s.scope_key)
      .is("lease_token", null)
      .select("id")
      .single(),
  );
  const packageRow = checked<any>(
    await db
      .from(KF_PACKAGE_TABLE)
      .select("state,file_index")
      .eq("id", s.package_id)
      .eq("scope_key", s.scope_key)
      .maybeSingle(),
  );
  if (!packageRow || !["validated", "published"].includes(packageRow.state)) {
    const paths = [
      prefix(s) + "/original.zip",
      ...Array.from(
        { length: s.chunk_count },
        (_, i) => prefix(s) + "/chunks/" + i,
      ),
      ...Object.keys(packageRow?.file_index || {}).map(
        (path) => prefix(s) + "/files/" + path,
      ),
    ];
    for (let i = 0; i < paths.length; i += 100) {
      const cleanup = await db.storage
        .from(KF_PACKAGE_BUCKET)
        .remove(paths.slice(i, i + 100));
      if (cleanup.error) throw Error("IMPORT_CANCELLED_CLEANUP_RETRY_REQUIRED");
    }
    if (packageRow)
      checked(
        await db
          .from(KF_PACKAGE_TABLE)
          .delete()
          .eq("id", s.package_id)
          .eq("scope_key", s.scope_key)
          .eq("state", "processing"),
      );
  }
  return { id, state: "cancelled" };
}
