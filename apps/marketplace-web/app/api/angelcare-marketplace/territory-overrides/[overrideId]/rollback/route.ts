import {
  handleTerritoryOverrideRollbackPost,
} from '@/angelcare-marketplace/territory-os/api-handlers'

type Context = {
  params: Promise<{ overrideId: string }>
}

export async function POST(
  request: Request,
  context: Context,
) {
  return handleTerritoryOverrideRollbackPost(
    request,
    context.params,
  )
}
