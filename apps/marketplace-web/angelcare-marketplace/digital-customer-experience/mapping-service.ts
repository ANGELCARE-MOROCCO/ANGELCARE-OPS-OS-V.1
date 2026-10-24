import { createHash } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { MarketplaceError } from "../server/errors";
import type { MarketplaceRequestContext as Context } from "../domain/types";
import { authorize, command, record } from "./repository";
import { MAPPING_VERSION, validateProfile } from "./import-mapping";
import { object, text, type Command, type Data } from "./types";
const scoped = (query: any, c: Context) =>
  (c.tenantId
    ? query.eq("tenant_id", c.tenantId)
    : query.is("tenant_id", null))[c.territoryId ? "eq" : "is"](
    "territory_id",
    c.territoryId || null,
  );
export async function readMappingProfiles(
  c: Context,
  input: Record<string, unknown>,
) {
  authorize(c, "manage");
  const db = await createServiceClient();
  let q = scoped(
    db
      .from("ac_dce_records")
      .select("id,title,data,revision,updated_at", { count: "exact" }),
    c,
  )
    .eq("kind", "setting")
    .eq("created_by", c.actor.id)
    .eq("data->>profileType", MAPPING_VERSION)
    .neq("lifecycle", "archived")
    .order("updated_at", { ascending: false })
    .limit(100);
  for (const key of ["family", "task", "collection"])
    if (input[key]) q = q.eq("data->>" + key, text(input[key]));
  const result = await q;
  if (result.error)
    throw new MarketplaceError(
      "DEPENDENCY_BLOCKED",
      text(result.error.message).slice(0, 200),
    );
  return {
    rows: (result.data || []).map((r: any) => ({
      id: r.id,
      title: r.title,
      revision: r.revision,
      updatedAt: r.updated_at,
      profile: (() => {
        try {
          return validateProfile(JSON.parse(text(object(r.data).profileJson)));
        } catch {
          return null;
        }
      })(),
    })),
    total: result.count || 0,
  };
}
export async function saveMappingProfile(c: Context, cmd: Command) {
  authorize(c, "manage");
  let profile;
  try {
    profile = validateProfile(cmd.profile);
  } catch (error) {
    throw new MarketplaceError("VALIDATION_ERROR", (error as Error).message);
  }
  const old = cmd.id ? await record(c, cmd.id) : undefined;
  if (
    old &&
    (old.kind !== "setting" ||
      old.created_by !== c.actor.id ||
      old.data.profileType !== MAPPING_VERSION)
  )
    throw new MarketplaceError(
      "PERMISSION_DENIED",
      "Choose one of your own mapping profiles.",
    );
  const key =
    "import-map-" +
    c.actor.id +
    "-" +
    createHash("sha256")
      .update(
        profile.family +
          ":" +
          profile.task +
          ":" +
          profile.collection +
          ":" +
          profile.title,
      )
      .digest("hex")
      .slice(0, 18);
  const data: Data = {
    profileType: MAPPING_VERSION,
    family: profile.family,
    task: profile.task,
    collection: profile.collection,
    profileJson: JSON.stringify(profile),
  };
  return command(c, {
    action: "save",
    requestId: cmd.requestId,
    id: old?.id,
    revision: cmd.revision,
    record: {
      kind: "setting",
      key: old?.key || key,
      title: profile.title,
      family: null,
      audience: "professional",
      data,
    },
  });
}
