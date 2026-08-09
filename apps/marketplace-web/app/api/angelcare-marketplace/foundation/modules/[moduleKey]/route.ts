import {
  handleModuleGet,
  handleModulePatch,
} from '@/angelcare-marketplace/api/handlers'

type Context = {
  params: Promise<{ moduleKey: string }>
}

export async function GET(
  request: Request,
  context: Context,
) {
  return handleModuleGet(request, context.params)
}

export async function PATCH(
  request: Request,
  context: Context,
) {
  return handleModulePatch(request, context.params)
}
