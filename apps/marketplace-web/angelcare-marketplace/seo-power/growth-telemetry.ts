import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db, rpc } from "./repository";
import { publicPath, record, type World } from "./model";
const secret = () => process.env.MARKETPLACE_DCE_ANALYTICS_SECRET || "";
const sign = (v: string) =>
  createHmac("sha256", secret()).update(v).digest("hex");
export async function trackingGrant(world: World, path: string) {
  if (secret().length < 32) return null;
  publicPath(path, world);
  const client = await db(),
    p = await client
      .from("ac_seo_power_projects")
      .select("id,origin")
      .eq("world", world)
      .eq("enabled", true)
      .maybeSingle();
  if (p.error || !p.data) return null;
  const c = await client
    .from("ac_seo_growth_config")
    .select("policy")
    .eq("project_id", p.data.id)
    .maybeSingle();
  if (c.error || record(c.data?.policy).measurement !== true) return null;
  const value = Buffer.from(
    JSON.stringify({
      project: p.data.id,
      world,
      path,
      origin: p.data.origin,
      expires: Date.now() + 2 * 3600000,
    }),
  ).toString("base64url");
  return value + "." + sign(value);
}
export async function metrics(request: Request) {
  try {
    if (secret().length < 32) return new Response(null, { status: 204 });
    if (Number(request.headers.get("content-length") || 0) > 6000)
      return new Response(null, { status: 413 });
    const reader = request.body?.getReader();
    if (!reader) return new Response(null, { status: 400 });
    let bytes = 0;
    const chunks: Uint8Array[] = [];
    for (;;) {
      const v = await reader.read();
      if (v.done) break;
      bytes += v.value.length;
      if (bytes > 6000) {
        await reader.cancel();
        return new Response(null, { status: 413 });
      }
      chunks.push(v.value);
    }
    const body = record(JSON.parse(Buffer.concat(chunks).toString("utf8"))),
      token = String(body.token || ""),
      parts = token.split(".");
    if (
      parts.length !== 2 ||
      parts[1].length !== 64 ||
      !/^[a-f0-9]{64}$/.test(parts[1])
    )
      return new Response(null, { status: 403 });
    if (!timingSafeEqual(Buffer.from(sign(parts[0])), Buffer.from(parts[1])))
      return new Response(null, { status: 403 });
    const grant = record(
        JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")),
      ),
      origin = request.headers.get("origin") || "";
    if (
      Number(grant.expires) < Date.now() ||
      grant.origin !== origin ||
      new URL(String(grant.origin)).host !==
        (request.headers.get("host") || new URL(request.url).host)
    )
      return new Response(null, { status: 403 });
    publicPath(String(grant.path), grant.world as World);
    if (
      !["pageview", "resource_open", "apply_intent", "enquiry_intent"].includes(
        String(body.event),
      ) ||
      !["search", "internal", "direct", "referral"].includes(
        String(body.channel),
      )
    )
      return new Response(null, { status: 400 });
    if (
      /bot|crawler|spider|headless/i.test(
        request.headers.get("user-agent") || "",
      )
    )
      return new Response(null, { status: 204 });
    const clientKey =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    // One observation per minute, path, event and channel for a keyed network bucket. Raw addresses are never stored.
    const key = sign(
      [
        clientKey,
        Math.floor(Date.now() / 60000),
        grant.project,
        grant.path,
        body.event,
        body.channel,
      ].join("|"),
    );
    await rpc("ac_seo_growth_measure", {
      p_project: grant.project,
      p_path: grant.path,
      p_event: body.event,
      p_channel: body.channel,
      p_key: key,
    });
    return new Response(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return new Response(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
export async function nativeFileOutcome(
  world: World,
  path: string,
  receipt: string,
) {
  try {
    const client = await db(),
      p = await client
        .from("ac_seo_power_projects")
        .select("id")
        .eq("world", world)
        .maybeSingle();
    if (!p.data) return;
    await rpc("ac_seo_growth_measure", {
      p_project: p.data.id,
      p_path: path,
      p_event: "file_response",
      p_channel: "native_unattributed",
      p_key: createHmac("sha256", secret() || "native-file-receipt")
        .update(receipt)
        .digest("hex"),
    });
  } catch {
    /* Measurement never converts a valid file response into a delivery error. */
  }
}
