import {
  handleTerritorySettingsGet,
} from '@/angelcare-marketplace/territory-os/api-handlers'

type Context = {
  params: Promise<{ territoryCode: string }>
}

export async function GET(
  request: Request,
  context: Context,
) {
  return handleTerritorySettingsGet(request, context.params)
}
