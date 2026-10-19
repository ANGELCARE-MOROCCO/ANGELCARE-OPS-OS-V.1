import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { isLocale } from "../catalogue";
import { publicHost } from "../server";
export const LOVE_COOKIE = "kidflix_love_v1";
function secret() {
  const value = getSupabaseEnv().serviceRoleKey;
  if (!value || value.length < 32) throw Error("LOVE_UNAVAILABLE");
  return createHmac("sha256", value).update("kidflix-love-cookie-v1").digest();
}
const mac = (token: string) =>
  createHmac("sha256", secret()).update(token).digest("base64url");
export function readLoveIdentity(cookie: string | undefined) {
  if (!cookie || !/^[A-Za-z0-9_-]{43}\.[A-Za-z0-9_-]{43}$/.test(cookie))
    return null;
  const [token, signature] = cookie.split(".");
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(mac(token))))
    return null;
  return createHmac("sha256", secret())
    .update("subject:" + token)
    .digest("hex");
}
export function newLoveCookie() {
  const token = randomBytes(32).toString("base64url");
  return token + "." + mac(token);
}
export async function loveState(
  host: string,
  locale: string,
  key: string,
  subject: string,
  liked: boolean | null,
) {
  if (!isLocale(locale) || !/^[a-z0-9][a-z0-9._-]{1,119}$/.test(key))
    throw Error("INVALID_REQUEST");
  const db = await createServiceClient();
  const r = await db.rpc("ac_kidflix_love", {
    p_host: publicHost(host),
    p_locale: locale,
    p_key: key,
    p_subject_hash: subject,
    p_liked: liked,
  });
  if (r.error) {
    const message = String(r.error.message || "");
    if (message.includes("LOVE_NOT_FOUND")) throw Error("NOT_FOUND");
    if (message.includes("LOVE_RATE_LIMITED")) throw Error("RATE_LIMITED");
    throw Error("LOVE_UNAVAILABLE");
  }
  if (
    !r.data ||
    !Number.isSafeInteger(r.data.count) ||
    r.data.count < 0 ||
    typeof r.data.liked !== "boolean"
  )
    throw Error("LOVE_UNAVAILABLE");
  return { count: r.data.count, liked: r.data.liked };
}
