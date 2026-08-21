import { governRoute } from '@/lib/runtime/governor/route'
import { createRoute, listRoute } from "@/lib/market-os/ambassadors/api"

export const dynamic = "force-dynamic"

async function GET__angelcareGovernedImpl(request: Request) {
  return listRoute("reports", request)
}

async function POST__angelcareGovernedImpl(request: Request) {
  return createRoute("reports", request)
}

export const GET = governRoute(
  {
    workloadClass: 'heavy',
    operation: 'GET:/api/market-os/ambassadors/reports',
  },
  GET__angelcareGovernedImpl,
)

export const POST = governRoute(
  {
    workloadClass: 'heavy',
    operation: 'POST:/api/market-os/ambassadors/reports',
  },
  POST__angelcareGovernedImpl,
)
