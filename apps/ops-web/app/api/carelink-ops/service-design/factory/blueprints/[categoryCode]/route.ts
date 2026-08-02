import { apiError, apiOk } from '@/lib/homeservice-design/server/api'
import { requireHomeServiceApi } from '@/lib/homeservice-design/server/auth'
import { requireCategoryBlueprint } from '@/lib/homeservice-factory/server/blueprints'

export async function GET(_: Request, context: { params: Promise<{ categoryCode: string }> }) {
  try {
    await requireHomeServiceApi(['homeservice_design.view'])
    const { categoryCode } = await context.params
    return apiOk(await requireCategoryBlueprint(decodeURIComponent(categoryCode)))
  } catch (error) { return apiError(error) }
}
