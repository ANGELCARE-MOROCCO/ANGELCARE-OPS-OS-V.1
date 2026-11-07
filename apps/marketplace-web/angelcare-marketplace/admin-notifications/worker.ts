import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { publicInteractiveHealth } from "../kidflix/interactive/public-health";
import { publicMediaReadiness } from "../digital-customer-experience/public-readiness";
/** Server-only worker. It never invokes native customer mail or business commands. */
export async function runNotificationWorker() {
  const db = await createServiceClient();
  const call = async (name: string, args: Record<string, unknown> = {}) => {
    const r = await db.rpc(name, args);
    if (r.error) throw new Error("NOTIFICATION_WORKER_RPC_FAILED");
    return r.data;
  };
  const health = await call("ac_nc_health_refresh"),
    monitors = await call("ac_nc_monitor", {
      p_source_limit: 24,
      p_row_limit: 100,
    });
  let mediaChecked = 0,
    mediaUnavailable = false,
    interactiveProbed = false;
  const state = await db
    .from("ac_nc_worker_state")
    .select("backfill_cursor")
    .eq("singleton", true)
    .single();
  if (state.error) throw new Error("NOTIFICATION_WORKER_STATE_UNAVAILABLE");
  const cursor = String(state.data?.backfill_cursor?.readiness || "");
  let editions = db
    .from("ac_dce_editions")
    .select("id,active_release_id")
    .not("active_release_id", "is", null)
    .order("id")
    .limit(40);
  if (cursor) editions = editions.gt("id", cursor);
  const batch = await editions;
  if (batch.error) {
    mediaUnavailable = true;
  } else {
    for (const edition of batch.data || []) {
      const release = await db
        .from("ac_dce_releases")
        .select("id,manifest,state")
        .eq("id", edition.active_release_id)
        .eq("state", "published")
        .maybeSingle();
      if (release.error) {
        mediaUnavailable = true;
        continue;
      }
      if (!release.data) continue;
      const readiness = publicMediaReadiness(release.data.manifest || {}),
        codes = readiness.issues.map((i) => i.code);
      const interactiveRef =
        release.data.manifest?.definition?.interactivePackage;
      if (interactiveRef) {
        const interactive = await publicInteractiveHealth(
          release.data.id,
          interactiveRef,
          !interactiveProbed,
        );
        interactiveProbed = true;
        if (!interactive.ready)
          codes.push(
            interactive.code || "PUBLIC_INTERACTIVE_RUNTIME_UNAVAILABLE",
          );
      }
      await call("ac_nc_diagnostic", {
        p_source: "ac_dce_releases",
        p_key: { id: release.data.id },
        p_codes: [...new Set(codes)],
      });
      mediaChecked++;
    }
    const rows = batch.data || [];
    const next = rows.length === 40 ? rows[rows.length - 1].id : null;
    const saved = await db
      .from("ac_nc_worker_state")
      .update({
        backfill_cursor: { ...state.data?.backfill_cursor, readiness: next },
      })
      .eq("singleton", true);
    if (saved.error) throw new Error("NOTIFICATION_WORKER_CURSOR_FAILED");
  }
  if (mediaUnavailable)
    await db
      .from("ac_nc_sources")
      .update({ state: "degraded", reason: "READINESS_MONITOR_UNAVAILABLE" })
      .in("id", ["ac_dce_editions", "ac_dce_releases"])
      .eq("state", "connected");
  const projected = await call("ac_nc_project", { p_limit: 1000 });
  await call("ac_nc_retention", { p_days: 90 });
  return { health, monitors, projected, mediaChecked, mediaUnavailable };
}
