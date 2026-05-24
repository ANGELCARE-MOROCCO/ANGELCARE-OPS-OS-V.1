import { handleShopifyRequest } from "@/src/lib/shopify-api/next-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ shopify?: string[] }>;
};

async function handle(request: Request, context: RouteContext) {
  const params = await context.params;
  const pathname = `/api/${(params.shopify || []).join("/")}`;

  return handleShopifyRequest(request, pathname);
}

export async function GET(request: Request, context: RouteContext) {
  return handle(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return handle(request, context);
}

export async function OPTIONS(request: Request, context: RouteContext) {
  return handle(request, context);
}

