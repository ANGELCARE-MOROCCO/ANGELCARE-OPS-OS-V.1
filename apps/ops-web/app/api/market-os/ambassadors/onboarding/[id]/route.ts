import { archiveRoute, getRoute, patchRoute } from "@/lib/market-os/ambassadors/api"

export const dynamic = "force-dynamic"

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  return getRoute("onboarding", id)
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  return patchRoute("onboarding", id, request)
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  return archiveRoute("onboarding", id)
}
