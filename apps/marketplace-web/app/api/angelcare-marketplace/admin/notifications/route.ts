import { requireMarketplaceApiContext } from "@/angelcare-marketplace/auth/context";
import { assertAdminLoginSameOrigin } from "@/angelcare-marketplace/auth/admin/admin-auth";
import { apiFailure, apiSuccess } from "@/angelcare-marketplace/server/request";
import { MarketplaceError } from "@/angelcare-marketplace/server/errors";
import {
  readNotifications,
  notificationCommand,
  notificationFocus,
} from "@/angelcare-marketplace/admin-notifications/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const privateResponse = (r: Response) => {
  r.headers.set("Cache-Control", "private, no-store");
  r.headers.set("Vary", "Cookie");
  return r;
};
export async function GET(request: Request) {
  try {
    const c = await requireMarketplaceApiContext("marketplace.admin.access"),
      p = new URL(request.url).searchParams;
    return privateResponse(
      apiSuccess(
        p.has("id")
          ? await notificationFocus(c, p.get("id") || "")
          : await readNotifications(c, p),
      ),
    );
  } catch (e) {
    return privateResponse(apiFailure(e));
  }
}
export async function POST(request: Request) {
  try {
    const c = await requireMarketplaceApiContext("marketplace.admin.access");
    if (
      !request.headers.get("origin") ||
      !assertAdminLoginSameOrigin(request) ||
      request.headers.get("sec-fetch-site") === "cross-site"
    )
      throw new MarketplaceError(
        "FORBIDDEN",
        "Cross-origin admin mutation refused.",
      );
    if (!request.headers.get("content-type")?.includes("application/json"))
      throw new MarketplaceError("VALIDATION_ERROR", "JSON requis.");
    if (Number(request.headers.get("content-length") || 0) > 16384)
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Commande trop volumineuse.",
      );
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 16384)
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Commande trop volumineuse.",
      );
    let b;
    try {
      b = JSON.parse(raw);
    } catch {
      throw new MarketplaceError("VALIDATION_ERROR", "JSON invalide.");
    }
    if (!b || typeof b !== "object" || Array.isArray(b))
      throw new MarketplaceError(
        "VALIDATION_ERROR",
        "Objet de commande requis.",
      );
    return privateResponse(apiSuccess(await notificationCommand(c, b)));
  } catch (e) {
    return privateResponse(apiFailure(e));
  }
}
