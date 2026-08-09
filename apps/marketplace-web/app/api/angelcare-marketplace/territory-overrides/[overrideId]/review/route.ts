import {
  handleTerritoryOverrideReviewPost,
} from '@/angelcare-marketplace/territory-os/api-handlers'

type Context = {
  params: Promise<{ overrideId: string }>
}

export async function POST(
  request: Request,
  context: Context,
) {
  return handleTerritoryOverrideReviewPost(
    request,
    context.params,
  )
}
