import {
  handleTerritoryTransitionPost,
} from '@/angelcare-marketplace/territory-os/api-handlers'

type Context = {
  params: Promise<{ territoryCode: string }>
}

export async function POST(
  request: Request,
  context: Context,
) {
  return handleTerritoryTransitionPost(request, context.params)
}
