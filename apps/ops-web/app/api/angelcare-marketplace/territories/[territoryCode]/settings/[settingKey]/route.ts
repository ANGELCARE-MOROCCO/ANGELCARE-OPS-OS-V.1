import {
  handleTerritorySettingPatch,
} from '@/angelcare-marketplace/territory-os/api-handlers'

type Context = {
  params: Promise<{
    territoryCode: string
    settingKey: string
  }>
}

export async function PATCH(
  request: Request,
  context: Context,
) {
  return handleTerritorySettingPatch(request, context.params)
}
