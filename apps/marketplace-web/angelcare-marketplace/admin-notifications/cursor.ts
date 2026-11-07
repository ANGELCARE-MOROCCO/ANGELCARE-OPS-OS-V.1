import "server-only";
import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { MarketplaceError } from "../server/errors";
const binding = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
function secret() {
  const key = process.env.MARKETPLACE_NOTIFICATIONS_WORKER_SECRET || "";
  if (key.length < 32)
    throw new MarketplaceError(
      "CONFIGURATION_ERROR",
      "Notification cursor configuration missing.",
    );
  return key;
}
export function encodeCursor(after: unknown, context: unknown) {
  if (!after) return null;
  const body = Buffer.from(
      JSON.stringify({ after, binding: binding(context) }),
    ).toString("base64url"),
    sig = createHmac("sha256", secret())
      .update("nc-cursor-r1:" + body)
      .digest("base64url");
  return body + "." + sig;
}
export function decodeCursor(token: string, context: unknown) {
  try {
    if (token.length > 2048) throw new Error();
    const [body, sig, ...extra] = token.split(".");
    if (extra.length || !body || !sig) throw new Error();
    const expected = createHmac("sha256", secret())
        .update("nc-cursor-r1:" + body)
        .digest(),
      actual = Buffer.from(sig, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(expected, actual))
      throw new Error();
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (
      parsed.binding !== binding(context) ||
      typeof parsed.after?.at !== "string" ||
      typeof parsed.after?.id !== "string"
    )
      throw new Error();
    return parsed.after;
  } catch {
    throw new MarketplaceError(
      "VALIDATION_ERROR",
      "Notification cursor invalid or scope changed. Refresh the first page.",
    );
  }
}
