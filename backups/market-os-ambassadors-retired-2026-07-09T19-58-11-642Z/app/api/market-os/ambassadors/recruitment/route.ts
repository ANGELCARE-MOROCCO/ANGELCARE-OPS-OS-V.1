import { createRoute, listRoute } from "@/lib/market-os/ambassadors/api"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  return listRoute("recruitment", request)
}

export async function POST(request: Request) {
  return createRoute("recruitment", request)
}
