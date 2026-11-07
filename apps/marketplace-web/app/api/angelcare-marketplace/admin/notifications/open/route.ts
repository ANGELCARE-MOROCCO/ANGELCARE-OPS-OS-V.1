import { requireMarketplaceApiContext } from "@/angelcare-marketplace/auth/context";
import { notificationDestination } from "@/angelcare-marketplace/admin-notifications/service";
import { apiFailure } from "@/angelcare-marketplace/server/request";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  let r: Response;
  try {
    const c = await requireMarketplaceApiContext("marketplace.admin.access"),
      target = await notificationDestination(
        c,
        new URL(request.url).searchParams.get("id") || "",
      );
    r = new Response(null, { status: 303, headers: { Location: target } });
  } catch (e) {
    r = apiFailure(e);
  }
  r.headers.set("Cache-Control", "private, no-store");
  r.headers.set("Vary", "Cookie");
  return r;
}
