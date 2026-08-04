import {
  handleConfigurationPatch,
} from '@/angelcare-marketplace/api/handlers'

type Context = {
  params: Promise<{ key: string }>
}

export async function PATCH(
  request: Request,
  context: Context,
) {
  return handleConfigurationPatch(request, context.params)
}
