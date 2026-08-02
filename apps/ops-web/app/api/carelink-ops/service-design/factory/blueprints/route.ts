import { apiError, apiOk } from '@/lib/homeservice-design/server/api'
import { requireHomeServiceApi } from '@/lib/homeservice-design/server/auth'
import { loadAllCategoryBlueprints } from '@/lib/homeservice-factory/server/blueprints'

export async function GET() {
  try {
    await requireHomeServiceApi(['homeservice_design.view'])
    const blueprints = await loadAllCategoryBlueprints()
    return apiOk(blueprints.map((blueprint) => ({ code: blueprint.code, categoryCode: blueprint.categoryCode, categoryName: blueprint.categoryName, concept: blueprint.concept, conceptTitle: blueprint.conceptTitle, accent: blueprint.accent, icon: blueprint.icon, audience: blueprint.audience, version: blueprint.version, presetCount: blueprint.presets.length, fieldCount: blueprint.sections.reduce((sum, section) => sum + section.fields.length, 0) })))
  } catch (error) { return apiError(error) }
}
