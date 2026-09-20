import {PUBLIC_EXPERIENCE_DOCTRINES} from './registry'
import type {PublicExperienceDoctrineRecipe,PublicExperienceMasterDomain} from './types'

const shared=['identity.name','media.primary','pricing.label','availability.status','trust.claims']
const domainBindings:Record<PublicExperienceMasterDomain,string[]>={
 b2c_service_family:['service.coverage','service.bookingModes','service.providers'],
 b2c_product_digital:['product.variants','product.specifications'],
 academy_admission:['academy.curriculum','academy.nextCohort','academy.trainers'],
 b2b_institutional:['b2b.organisationFit','b2b.deploymentModel','b2b.diagnostic'],
}
const modules:Record<PublicExperienceMasterDomain,string[]>={
 b2c_service_family:['ServiceHeroDecision','ServiceTrustRail','ServicePlanMatrix','ProviderRail','BookingConversion','ServiceFAQ','RelatedServices'],
 b2c_product_digital:['ProductMediaGallery','ProductIdentity','PurchaseDecision','VariantSelector','ProductSpecifications','CrossSellRail','Reviews','ProductFAQ'],
 academy_admission:['CourseMedia','CourseIdentity','EnrollmentPanel','LearningOutcomes','Curriculum','TrainerFaculty','CertificationProof','EnrollmentConversion'],
 b2b_institutional:['B2BHero','OrganisationFit','Diagnostic','ProgrammeArchitecture','DeploymentModel','InstitutionalProof','QuoteConversion'],
}
const subtype=(key:string)=>key.replaceAll('-','_')

export const PUBLIC_EXPERIENCE_DOCTRINE_RECIPES:readonly PublicExperienceDoctrineRecipe[]=PUBLIC_EXPERIENCE_DOCTRINES.map(row=>{
 const required=[...shared,...domainBindings[row.masterDomain]]
 if(row.key==='home-childcare-recurring')required.push('service.plans','service.scheduleRules')
 if(row.key==='emergency-last-minute-care')required.push('service.urgency')
 if(row.key==='academy-cohort')required.push('academy.capacity')
 if(row.key==='certification-pathway')required.push('academy.certification')
 if(row.key==='preschool-admission')required.push('academy.admission')
 return{doctrineKey:row.key,masterDomain:row.masterDomain,requiredBindings:[...new Set(required)],optionalBindings:['reviews.summary','relations.recommendations'],requiredActions:[...row.requiredActions],requiredWorkflows:[...row.requiredWorkflows],modules:[...modules[row.masterDomain]],conversionSubtype:subtype(row.key),availabilityAuthority:row.availabilityAuthority,truthRequirements:['pricing-if-shown','scarcity-if-shown','rating-if-shown','certification-if-shown']}
})
export const PUBLIC_EXPERIENCE_RECIPE_BY_DOCTRINE=new Map(PUBLIC_EXPERIENCE_DOCTRINE_RECIPES.map(row=>[row.doctrineKey,row]))
export function publicExperienceDoctrineRecipe(key:string){return PUBLIC_EXPERIENCE_RECIPE_BY_DOCTRINE.get(key)||null}
