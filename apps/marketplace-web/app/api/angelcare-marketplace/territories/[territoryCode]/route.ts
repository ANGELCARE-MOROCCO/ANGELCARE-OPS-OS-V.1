import {
  handleTerritoryGet,
  handleTerritoryPatch,
} from '@/angelcare-marketplace/territory-os/api-handlers'

type Context = {
  params: Promise<{ territoryCode: string }>
}

export async function GET(
  request: Request,
  context: Context,
) {
  return handleTerritoryGet(request, context.params)
}

export async function PATCH(
  request: Request,
  context: Context,
) {
  return handleTerritoryPatch(request, context.params)
}
