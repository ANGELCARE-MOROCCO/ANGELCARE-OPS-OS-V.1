import { handleShopifyRequest } from "@/src/lib/shopify-api/next-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleShopifyRequest(request, "/dashboard");
}

export async function OPTIONS(request: Request) {
  return handleShopifyRequest(request, "/dashboard");
}

