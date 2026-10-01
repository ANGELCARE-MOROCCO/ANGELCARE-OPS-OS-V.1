import type {StorefrontKey} from '@/angelcare-marketplace/catalog-discovery/types'
import type {WorldFactorySemanticRole} from './types'

export interface WorldFactoryStorefrontCapabilityPack{
  key:StorefrontKey
  label:string
  requiredRoles:WorldFactorySemanticRole[]
  preferredRoles:WorldFactorySemanticRole[]
  supportedSourceIds:string[]
  supportedActions:string[]
  density:'premium'|'commerce'|'hyper_commerce'|'festival'
  truthRequirements:Array<'pricing'|'promotion'|'scarcity'|'rating'|'certification'|'availability'|'trust'>
}

const commonPreferred:WorldFactorySemanticRole[]=[
  'storefront_categories','storefront_collection','storefront_facets','storefront_campaigns',
  'storefront_editorial','storefront_proof','storefront_trust','storefront_final_conversion',
]
const pack=(row:WorldFactoryStorefrontCapabilityPack)=>row

export const WORLD_FACTORY_STOREFRONT_CAPABILITY_PACKS:Record<StorefrontKey,WorldFactoryStorefrontCapabilityPack>={
  families:pack({
    key:'families',label:'Families · Concierge / Life-Need Discovery',density:'hyper_commerce',
    requiredRoles:['storefront_hero','storefront_inventory','storefront_pathways'],
    preferredRoles:['storefront_categories','storefront_collection','storefront_comparison','storefront_editorial','storefront_trust','storefront_final_conversion'],
    supportedSourceIds:['catalog.items','catalog.categories','homepage.collections','academy.programmes','trust.claims'],
    supportedActions:['catalog.open_item','booking.start','academy.enroll','basket.add','family_request.start','navigation.open'],
    truthRequirements:['pricing','availability','rating','certification','trust'],
  }),
  'home-services':pack({
    key:'home-services',label:'Home Services · Availability / Booking Marketplace',density:'festival',
    requiredRoles:['storefront_hero','storefront_inventory','storefront_availability','storefront_process'],
    preferredRoles:['storefront_facets','storefront_collection','storefront_proof','storefront_trust','storefront_final_conversion'],
    supportedSourceIds:['catalog.items','providers.profiles','homepage.collections','trust.claims'],
    supportedActions:['catalog.open_item','booking.start','family_request.start','inquiry.submit','navigation.open'],
    truthRequirements:['pricing','availability','rating','trust'],
  }),
  development:pack({
    key:'development',label:'Development · Montessori / Development Discovery',density:'hyper_commerce',
    requiredRoles:['storefront_hero','storefront_inventory','storefront_pathways'],
    preferredRoles:['storefront_categories','storefront_collection','storefront_facets','storefront_editorial','storefront_comparison','storefront_trust'],
    supportedSourceIds:['catalog.items','catalog.categories','homepage.collections','trust.claims'],
    supportedActions:['catalog.open_item','basket.add','booking.start','navigation.open'],
    truthRequirements:['pricing','availability','rating','trust'],
  }),
  kits:pack({
    key:'kits',label:'Kits · High-Commerce Learning Product World',density:'festival',
    requiredRoles:['storefront_hero','storefront_inventory','storefront_comparison'],
    preferredRoles:['storefront_facets','storefront_collection','storefront_campaigns','storefront_editorial','storefront_trust','storefront_final_conversion'],
    supportedSourceIds:['catalog.items','catalog.categories','homepage.collections','homepage.campaigns','commerce.promotions','trust.claims'],
    supportedActions:['catalog.open_item','basket.add','checkout.start','navigation.open'],
    truthRequirements:['pricing','promotion','scarcity','availability','rating','trust'],
  }),
  academy:pack({
    key:'academy',label:'Academy · Pathways / Cohorts / Learning Marketplace',density:'hyper_commerce',
    requiredRoles:['storefront_hero','storefront_inventory','storefront_pathways','storefront_sessions'],
    preferredRoles:['storefront_categories','storefront_collection','storefront_proof','storefront_editorial','storefront_trust','storefront_final_conversion'],
    supportedSourceIds:['catalog.items','academy.programmes','academy.cohorts','homepage.collections','trust.claims'],
    supportedActions:['catalog.open_item','academy.enroll','quotation.start','inquiry.submit','navigation.open'],
    truthRequirements:['pricing','availability','rating','certification','trust'],
  }),
  establishments:pack({
    key:'establishments',label:'Establishments · Institutional Solutions / Diagnostic Marketplace',density:'commerce',
    requiredRoles:['storefront_hero','storefront_inventory','storefront_segments','storefront_diagnostic'],
    preferredRoles:['storefront_collection','storefront_proof','storefront_process','storefront_impact','storefront_trust','storefront_final_conversion'],
    supportedSourceIds:['catalog.items','b2b.programmes','partners.plans','academy.programmes','trust.claims'],
    supportedActions:['catalog.open_item','quotation.start','b2b.request','inquiry.submit','navigation.open'],
    truthRequirements:['pricing','certification','trust'],
  }),
  hospitality:pack({
    key:'hospitality',label:'Hospitality · Premium Kids Operations / Family Guest Solutions',density:'commerce',
    requiredRoles:['storefront_hero','storefront_inventory','storefront_seasonal','storefront_use_cases'],
    preferredRoles:['storefront_segments','storefront_collection','storefront_process','storefront_proof','storefront_trust','storefront_final_conversion'],
    supportedSourceIds:['catalog.items','b2b.programmes','homepage.collections','trust.claims'],
    supportedActions:['catalog.open_item','quotation.start','b2b.request','inquiry.submit','navigation.open'],
    truthRequirements:['pricing','availability','trust'],
  }),
  'health-partners':pack({
    key:'health-partners',label:'Health Partners · Non-Medical Partner Solutions',density:'commerce',
    requiredRoles:['storefront_hero','storefront_inventory','storefront_boundary','storefront_referral'],
    preferredRoles:['storefront_segments','storefront_collection','storefront_proof','storefront_trust','storefront_final_conversion'],
    supportedSourceIds:['catalog.items','b2b.programmes','homepage.collections','trust.claims'],
    supportedActions:['catalog.open_item','quotation.start','b2b.request','inquiry.submit','navigation.open'],
    truthRequirements:['pricing','certification','trust'],
  }),
  corporates:pack({
    key:'corporates',label:'Corporates · Employee Family Benefits Marketplace',density:'commerce',
    requiredRoles:['storefront_hero','storefront_inventory','storefront_benefits','storefront_impact'],
    preferredRoles:['storefront_segments','storefront_collection','storefront_proof','storefront_process','storefront_trust','storefront_final_conversion'],
    supportedSourceIds:['catalog.items','b2b.programmes','homepage.collections','trust.claims'],
    supportedActions:['catalog.open_item','quotation.start','b2b.request','inquiry.submit','navigation.open'],
    truthRequirements:['pricing','trust'],
  }),
  'partner-os':pack({
    key:'partner-os',label:'Partner OS · Enterprise SaaS Plans / Capabilities',density:'premium',
    requiredRoles:['storefront_hero','storefront_plans','storefront_capabilities','storefront_comparison'],
    preferredRoles:['storefront_inventory','storefront_process','storefront_proof','storefront_trust','storefront_final_conversion'],
    supportedSourceIds:['partners.plans','catalog.items','trust.claims'],
    supportedActions:['subscription.start','quotation.start','inquiry.submit','navigation.open'],
    truthRequirements:['pricing','availability','trust'],
  }),
  'quality-check':pack({
    key:'quality-check',label:'Quality Check · Audit / Standards / Assessment World',density:'premium',
    requiredRoles:['storefront_hero','storefront_framework','storefront_assessment'],
    preferredRoles:['storefront_inventory','storefront_process','storefront_proof','storefront_editorial','storefront_trust','storefront_final_conversion'],
    supportedSourceIds:['catalog.items','b2b.programmes','trust.claims'],
    supportedActions:['catalog.open_item','quotation.start','b2b.request','inquiry.submit','navigation.open'],
    truthRequirements:['pricing','certification','trust'],
  }),
  professionals:pack({
    key:'professionals',label:'Professionals · Talent / Credentials / Availability Marketplace',density:'hyper_commerce',
    requiredRoles:['storefront_hero','storefront_inventory','storefront_qualifications','storefront_professional_availability'],
    preferredRoles:['storefront_facets','storefront_collection','storefront_pathways','storefront_proof','storefront_trust','storefront_final_conversion'],
    supportedSourceIds:['providers.profiles','catalog.items','academy.programmes','trust.claims'],
    supportedActions:['catalog.open_item','booking.start','academy.enroll','inquiry.submit','navigation.open'],
    truthRequirements:['pricing','availability','rating','certification','trust'],
  }),
}

export function worldFactoryStorefrontPack(key:string|null|undefined){
  return key&&key in WORLD_FACTORY_STOREFRONT_CAPABILITY_PACKS?WORLD_FACTORY_STOREFRONT_CAPABILITY_PACKS[key as StorefrontKey]:null
}

export const WORLD_FACTORY_STOREFRONT_REQUIRED_ROLES_BASE:WorldFactorySemanticRole[]=['storefront_hero']
export const WORLD_FACTORY_STOREFRONT_PREFERRED_ROLES_BASE:WorldFactorySemanticRole[]=[...commonPreferred]
export const WORLD_FACTORY_STOREFRONT_ALL_SEMANTIC_ROLES:WorldFactorySemanticRole[]=[...new Set(Object.values(WORLD_FACTORY_STOREFRONT_CAPABILITY_PACKS).flatMap(row=>[...row.requiredRoles,...row.preferredRoles]))]
