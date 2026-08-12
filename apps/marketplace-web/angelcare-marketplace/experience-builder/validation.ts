import { MarketplaceError } from '../server/errors'
import { blockDefinition } from './block-registry'
import type { CmsBlockType, CmsPage } from './types'

const allowedLocales = new Set(['fr','en','ar'])
const allowedTransitions: Record<CmsPage['status'], CmsPage['status'][]> = {
  draft: ['submitted','archived'], submitted: ['in_review','draft','archived'], in_review: ['approved','draft','archived'],
  approved: ['scheduled','published','draft','archived'], scheduled: ['published','approved','archived'],
  published: ['retired','draft'], retired: ['published','archived'], archived: [],
}

export function validateLocale(locale: string): asserts locale is 'fr' | 'en' | 'ar' {
  if (!allowedLocales.has(locale)) throw new MarketplaceError('VALIDATION_ERROR','Locale invalide.')
}

export function validatePageTransition(current: CmsPage['status'], target: CmsPage['status']) {
  if (!allowedTransitions[current].includes(target)) throw new MarketplaceError('INVALID_STATE_TRANSITION', `Transition CMS interdite : ${current} → ${target}.`)
}

export function validatePageForPublication(page: CmsPage, blocks: { block_type: CmsBlockType; content: Record<string, unknown> }[]) {
  const errors: string[] = []
  if (!page.title.trim()) errors.push('Titre manquant.')
  if (!page.slug.trim()) errors.push('Slug manquant.')
  if (!page.seo_title?.trim()) errors.push('Titre SEO manquant.')
  if (!page.seo_description?.trim()) errors.push('Description SEO manquante.')
  if (!blocks.length) errors.push('Aucun bloc publié.')
  if (page.locale !== 'fr' && page.translation_status !== 'approved') errors.push('La traduction cible n’est pas approuvée.')
  if (page.sensitive && page.translation_status === 'stale') errors.push('Le contenu sensible est périmé par rapport à la source française.')
  for (const block of blocks) {
    const definition = blockDefinition(block.block_type)
    if (definition.requiresCta && !('ctaKey' in block.content || 'primaryCtaKey' in block.content || 'ctaHref' in block.content || 'primaryCtaHref' in block.content)) errors.push(`CTA manquant dans ${definition.name}.`)
  }
  if (errors.length) throw new MarketplaceError('DEPENDENCY_BLOCKED','La page ne satisfait pas les critères de publication.', { fieldErrors: { publication: errors } })
}
