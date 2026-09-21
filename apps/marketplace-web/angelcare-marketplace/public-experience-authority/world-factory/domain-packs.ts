import type {PublicExperienceMasterDomain} from '../types'
import type {WorldFactorySemanticRole} from './types'

export interface WorldFactoryDomainPack{
 key:PublicExperienceMasterDomain
 label:string
 requiredRoles:WorldFactorySemanticRole[]
 preferredRoles:WorldFactorySemanticRole[]
 primaryActions:string[]
 secondaryActions:string[]
 requiredCapabilities:string[]
 truthRequirements:string[]
 relationRoles:WorldFactorySemanticRole[]
}
export const WORLD_FACTORY_DOMAIN_PACKS:Record<PublicExperienceMasterDomain,WorldFactoryDomainPack>={
 b2c_product_digital:{key:'b2c_product_digital',label:'B2C Product / Digital',requiredRoles:['hero','identity','media','pricing','availability','primary_conversion'],preferredRoles:['variants','specifications','reviews','trust','bundle','accessories','recommendations','faq'],primaryActions:['basket.add'],secondaryActions:['checkout.start','inquiry.submit'],requiredCapabilities:['public-experience-360','canonical-route','native-fallback','canonical-basket','canonical-checkout'],truthRequirements:['pricing','promotion','scarcity','rating','availability','trust'],relationRoles:['bundle','accessories','recommendations','related']},
 b2c_service_family:{key:'b2c_service_family',label:'B2C Service / Family',requiredRoles:['hero','identity','pricing','availability','primary_conversion'],preferredRoles:['service_plans','service_schedule','service_coverage','service_providers','reviews','trust','faq','recommendations'],primaryActions:['booking.start'],secondaryActions:['quotation.start','inquiry.submit'],requiredCapabilities:['public-experience-360','canonical-route','native-fallback','booking-authority'],truthRequirements:['pricing','availability','rating','trust'],relationRoles:['recommendations','related']},
 academy_admission:{key:'academy_admission',label:'Academy / Admission',requiredRoles:['hero','identity','availability','primary_conversion'],preferredRoles:['pricing','academy_curriculum','academy_cohort','academy_trainers','academy_certification','academy_admission','reviews','trust','faq'],primaryActions:['academy.enroll'],secondaryActions:['quotation.start','inquiry.submit'],requiredCapabilities:['public-experience-360','canonical-route','native-fallback','academy-authority'],truthRequirements:['pricing','availability','rating','certification','trust'],relationRoles:['recommendations','related']},
 b2b_institutional:{key:'b2b_institutional',label:'B2B / Institutional',requiredRoles:['hero','identity','primary_conversion'],preferredRoles:['pricing','b2b_fit','b2b_programme','b2b_deployment','b2b_proof','trust','faq'],primaryActions:['quotation.start'],secondaryActions:['inquiry.submit','b2b.request'],requiredCapabilities:['public-experience-360','canonical-route','native-fallback','quotation-authority'],truthRequirements:['pricing','certification','trust'],relationRoles:['recommendations','related']},
}
export const WORLD_FACTORY_STOREFRONT_REQUIRED_ROLES:WorldFactorySemanticRole[]=['storefront_hero','storefront_inventory']
export const WORLD_FACTORY_STOREFRONT_PREFERRED_ROLES:WorldFactorySemanticRole[]=['storefront_categories','storefront_collection','storefront_facets','storefront_campaigns','trust','editorial','footer']
