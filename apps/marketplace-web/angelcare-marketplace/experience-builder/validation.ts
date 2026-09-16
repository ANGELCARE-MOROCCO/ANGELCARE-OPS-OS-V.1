import { MarketplaceError } from '../server/errors'
import { blockDefinition, isStructuralBlock } from './block-registry'
import type { CmsBlockType, CmsPage } from './types'
import type { EditableBlockInput } from './repository'

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

function nonEmpty(value:unknown){return typeof value==='string'&&Boolean(value.trim())}
export function validateBlockDocument(blocks:EditableBlockInput[]){
  const errors:string[]=[];const keys=new Set<string>()
  for(const [index,block] of blocks.entries()){
    const key=block.blockKey.trim();if(!key)errors.push(`Bloc ${index+1}: clé stable manquante.`);if(keys.has(key))errors.push(`Clé dupliquée: ${key}.`);keys.add(key)
    let def;try{def=blockDefinition(block.blockType as CmsBlockType)}catch{errors.push(`Bloc ${key||index+1}: type non enregistré ${block.blockType}.`);continue}
    for(const required of def.validation.required){if(!nonEmpty(block.content[required]))errors.push(`${def.name}: ${required} est requis.`)}
    if(block.parentBlockKey===block.blockKey)errors.push(`${def.name}: un bloc ne peut pas être son propre parent.`)
  }
  for(const block of blocks){if(!block.parentBlockKey)continue;const parent=blocks.find(item=>item.blockKey===block.parentBlockKey);if(!parent){errors.push(`${block.blockKey}: parent ${block.parentBlockKey} introuvable.`);continue}if(!isStructuralBlock(parent.blockType as CmsBlockType))errors.push(`${block.blockKey}: le parent ${parent.blockKey} doit être structurel.`)}
  const parentOf=new Map(blocks.map(block=>[block.blockKey,block.parentBlockKey||null]));for(const block of blocks){const seen=new Set<string>();let current:string|null=block.blockKey;while(current){if(seen.has(current)){errors.push(`Cycle de structure détecté autour de ${block.blockKey}.`);break}seen.add(current);current=parentOf.get(current)||null}}
  if(errors.length)throw new MarketplaceError('VALIDATION_ERROR','La composition contient des erreurs structurelles.',{fieldErrors:{blocks:errors}})
}

export function validatePageForPublication(page: CmsPage, blocks: { block_type: CmsBlockType; content: Record<string, unknown>; parent_block_key?:string|null }[]) {
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
    for(const required of definition.validation.required){if(!nonEmpty(block.content[required]))errors.push(`${definition.name}: ${required} est requis.`)}
  }
  if (errors.length) throw new MarketplaceError('DEPENDENCY_BLOCKED','La page ne satisfait pas les critères de publication.', { fieldErrors: { publication: errors } })
}
