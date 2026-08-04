import {
  handleTerritoryReadinessSignOffPost,
} from '@/angelcare-marketplace/territory-os/api-handlers'

type Context = {
  params: Promise<{ territoryCode: string }>
}

export async function POST(
  request: Request,
  context: Context,
) {
  return handleTerritoryReadinessSignOffPost(
    request,
    context.params,
  )
}
