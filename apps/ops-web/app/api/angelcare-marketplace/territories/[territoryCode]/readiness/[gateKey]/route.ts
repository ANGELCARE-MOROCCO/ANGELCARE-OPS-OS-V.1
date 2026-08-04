import {
  handleTerritoryReadinessPatch,
} from '@/angelcare-marketplace/territory-os/api-handlers'

type Context = {
  params: Promise<{
    territoryCode: string
    gateKey: string
  }>
}

export async function PATCH(
  request: Request,
  context: Context,
) {
  return handleTerritoryReadinessPatch(request, context.params)
}
