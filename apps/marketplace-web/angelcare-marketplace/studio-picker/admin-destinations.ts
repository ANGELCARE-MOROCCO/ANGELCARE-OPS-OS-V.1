import type { StudioSourceReference } from '@/angelcare-marketplace/studio-source-registry/types'

const BASE='/angelcare-marketplace/admin'
export function studioSourceAdminHref(reference:StudioSourceReference):string|null{
  const id=encodeURIComponent(reference.entityId)
  switch(reference.sourceId){
    case 'catalog.items':return `${BASE}/catalog/items/${id}/overview`
    case 'catalog.categories':return `${BASE}/catalog/categories/${id}`
    case 'homepage.collections':return `${BASE}/experience/homepage/collections`
    case 'media.assets':return `${BASE}/media/library`
    case 'content.pages':return `${BASE}/experience/pages/${id}`
    case 'content.templates':return `${BASE}/experience/templates`
    case 'content.symbols':return `${BASE}/experience/symbols`
    case 'experience.schemas':return `${BASE}/frontend-experiences`
    case 'homepage.campaigns':return `${BASE}/experience/homepage/campaigns`
    case 'experience.live_campaigns':return `${BASE}/live-experience-command`
    case 'audience.segments':return `${BASE}/growth/audiences`
    case 'context.territories':return `${BASE}/territories`
    case 'academy.programmes':return `${BASE}/academy/programs`
    case 'academy.cohorts':return `${BASE}/academy/cohorts`
    case 'providers.profiles':return `${BASE}/providers/dossiers/${id}`
    case 'commerce.promotions':return `${BASE}/promotions`
    case 'partners.plans':return `${BASE}/partner-os/plans`
    case 'b2b.programmes':return `${BASE}/operations/b2b`
    case 'trust.claims':return `${BASE}/trust/badges`
    case 'navigation.destinations':return `${BASE}/experience/menus`
    default:return null
  }
}
