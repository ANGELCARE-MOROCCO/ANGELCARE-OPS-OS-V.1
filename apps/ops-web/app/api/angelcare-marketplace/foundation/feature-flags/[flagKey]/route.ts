import {
  handleFeatureFlagPatch,
} from '@/angelcare-marketplace/api/handlers'

type Context = {
  params: Promise<{ flagKey: string }>
}

export async function PATCH(
  request: Request,
  context: Context,
) {
  return handleFeatureFlagPatch(request, context.params)
}
