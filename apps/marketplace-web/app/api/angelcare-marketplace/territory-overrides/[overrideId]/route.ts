import {
  handleTerritoryOverrideGet,
} from '@/angelcare-marketplace/territory-os/api-handlers'

type Context = {
  params: Promise<{ overrideId: string }>
}

export async function GET(
  request: Request,
  context: Context,
) {
  return handleTerritoryOverrideGet(request, context.params)
}
