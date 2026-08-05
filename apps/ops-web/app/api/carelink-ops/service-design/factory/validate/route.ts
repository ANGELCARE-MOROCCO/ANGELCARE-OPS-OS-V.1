import { apiError, apiOk, jsonBody } from '@/lib/homeservice-design/server/api'
import { requireHomeServiceApi } from '@/lib/homeservice-design/server/auth'
import { loadFactoryCatalogue } from '@/lib/homeservice-factory/server/catalogue'
import { validateFactoryInput } from '@/lib/homeservice-factory/server/composer'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    await requireHomeServiceApi([
      'homeservice_design.view',
      'homeservice_design.manage_categories',
      'homeservice_design.create_planning_requests',
    ])
    const input = validateFactoryInput(await jsonBody(request))
    const catalogue = await loadFactoryCatalogue()
    const category = catalogue.categories.find((item) => item.id === input.categoryId)
    if (!category) throw Object.assign(new Error('La catégorie sélectionnée n’existe plus dans le catalogue local.'), { status: 404, code: 'CATEGORY_NOT_FOUND' })

    const blockers: string[] = []
    const warnings: string[] = []
    if (!input.dates.length) blockers.push('Ajoutez au moins une date réelle.')
    if (!category.activities.length) blockers.push('Aucune activité locale compatible n’est enregistrée pour cette catégorie.')
    if (!category.doctrine.length) warnings.push('Doctrine incomplète: le brouillon et la composition restent autorisés.')
    if (!category.capacity) warnings.push('Capacité non renseignée: la proposition affichera cette limite explicitement.')
    if (!category.priceEntries.length) warnings.push('Tarification absente: le résultat sera « Sur devis », jamais zéro.')

    return apiOk({
      valid: blockers.length === 0,
      canGenerate: blockers.length === 0,
      blockers,
      warnings,
      category: { id: category.id, code: category.code, name: category.commercialName },
      normalized: input,
    })
  } catch (error) {
    return apiError(error)
  }
}
