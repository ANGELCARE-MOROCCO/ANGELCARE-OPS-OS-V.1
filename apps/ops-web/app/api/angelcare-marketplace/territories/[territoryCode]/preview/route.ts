import {
  handleTerritoryPreviewGet,
} from '@/angelcare-marketplace/territory-os/api-handlers'

type Context = {
  params: Promise<{ territoryCode: string }>
}

export async function GET(
  request: Request,
  context: Context,
) {
  return handleTerritoryPreviewGet(request, context.params)
}
