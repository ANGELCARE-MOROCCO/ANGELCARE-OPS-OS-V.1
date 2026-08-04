import {
  handleTerritoryOverridesGet,
  handleTerritoryOverridesPost,
} from '@/angelcare-marketplace/territory-os/api-handlers'

type Context = {
  params: Promise<{ territoryCode: string }>
}

export async function GET(
  request: Request,
  context: Context,
) {
  return handleTerritoryOverridesGet(request, context.params)
}

export async function POST(
  request: Request,
  context: Context,
) {
  return handleTerritoryOverridesPost(request, context.params)
}
