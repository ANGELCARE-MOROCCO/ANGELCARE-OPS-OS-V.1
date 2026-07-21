import { createRoute, listRoute } from "@/lib/market-os/ambassadors/api"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  return listRoute("proofs", request)
}

export async function POST(request: Request) {
  return createRoute("proofs", request)
}
