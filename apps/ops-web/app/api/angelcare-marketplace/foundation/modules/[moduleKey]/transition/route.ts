import {
  handleModuleTransitionPost,
} from '@/angelcare-marketplace/api/handlers'

type Context = {
  params: Promise<{ moduleKey: string }>
}

export async function POST(
  request: Request,
  context: Context,
) {
  return handleModuleTransitionPost(request, context.params)
}
