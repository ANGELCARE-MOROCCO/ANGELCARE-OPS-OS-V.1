import { archiveRoute, getRoute, patchRoute } from "@/lib/market-os/ambassadors/api"

export const dynamic = "force-dynamic"

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  return getRoute("territories", id)
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  return patchRoute("territories", id, request)
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  return archiveRoute("territories", id)
}
