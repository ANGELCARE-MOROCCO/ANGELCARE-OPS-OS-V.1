import {
  handleReadinessPatch,
} from '@/angelcare-marketplace/api/handlers'

type Context = {
  params: Promise<{ checkKey: string }>
}

export async function PATCH(
  request: Request,
  context: Context,
) {
  return handleReadinessPatch(request, context.params)
}
