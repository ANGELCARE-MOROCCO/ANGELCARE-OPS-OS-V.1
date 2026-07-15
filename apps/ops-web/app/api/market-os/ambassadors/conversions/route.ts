import { createRoute, listRoute } from "@/lib/market-os/ambassadors/api"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  return listRoute("conversions", request)
}

export async function POST(request: Request) {
  return createRoute("conversions", request)
}
