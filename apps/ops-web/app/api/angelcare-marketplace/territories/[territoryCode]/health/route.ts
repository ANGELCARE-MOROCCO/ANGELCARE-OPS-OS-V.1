import {
  handleTerritoryHealthGet,
  handleTerritoryHealthPost,
} from '@/angelcare-marketplace/territory-os/api-handlers'

type Context = {
  params: Promise<{ territoryCode: string }>
}

export async function GET(
  request: Request,
  context: Context,
) {
  return handleTerritoryHealthGet(request, context.params)
}

export async function POST(
  request: Request,
  context: Context,
) {
  return handleTerritoryHealthPost(request, context.params)
}
