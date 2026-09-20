import { CATEGORY_NATIVE_EXPERIENCE_DEFINITIONS } from '@/angelcare-marketplace/category-native-experience/registry'
import type { StorefrontKey } from '@/angelcare-marketplace/catalog-discovery/types'
import type {
  PublicExperienceDoctrineProfile,
  PublicExperienceMasterDomain,
  PublicExperienceMasterDomainProfile,
  PublicExperienceStorefrontProfile,
} from './types'

const DOMAIN_DOCTRINES: Record<PublicExperienceMasterDomain, readonly string[]> = {
  b2c_service_family: [
    'home-childcare-one-time','home-childcare-recurring','school-pickup-care','overnight-extended-care','emergency-last-minute-care',
    'hotel-travel-childcare','events-group-childcare','holiday-excursion-programme','montessori-home-service','learning-homework-support','non-medical-support-service',
  ],
  b2c_product_digital: [
    'flashcards-learning-product','montessori-development-kit','development-game','activity-subscription-box','digital-learning-resource',
  ],
  academy_admission: [
    'preschool-admission','academy-course','academy-cohort','certification-pathway','parent-workshop','institutional-training',
  ],
  b2b_institutional: [
    'school-managed-programme','school-staff-reinforcement','hospitality-kids-programme','corporate-childcare-benefit','health-adjacent-programme',
    'event-venue-programme','partner-os-plan','quality-check-assessment','custom-managed-solution',
  ],
}

export const PUBLIC_EXPERIENCE_MASTER_DOMAINS: readonly PublicExperienceMasterDomainProfile[] = [
  {key:'b2c_service_family',label:'B2C Service / Famille',shortLabel:'Services',description:'Réservation, disponibilité, couverture, plans et prestataires avec conséquence opérationnelle native.',doctrineKeys:DOMAIN_DOCTRINES.b2c_service_family,canonicalThemeKey:'ac.public-detail.b2c-service-family.pro-max',requiredActions:['booking.start','quotation.start','inquiry.submit'],requiredWorkflows:['booking.service','quotation.request'],accent:'pink'},
  {key:'b2c_product_digital',label:'B2C Produit / Digital',shortLabel:'Produits',description:'Produit physique, kit, abonnement et digital avec variantes, stock, panier, checkout et fulfilment canonique.',doctrineKeys:DOMAIN_DOCTRINES.b2c_product_digital,canonicalThemeKey:'ac.public-detail.b2c-product-digital.pro-max',requiredActions:['basket.add','checkout.start'],requiredWorkflows:[],accent:'blue'},
  {key:'academy_admission',label:'Academy / Admission',shortLabel:'Academy',description:'Programme, cours, cohorte, admission et certification avec curriculum, capacité, formateurs et enrollment.',doctrineKeys:DOMAIN_DOCTRINES.academy_admission,canonicalThemeKey:'ac.public-detail.academy-admission.pro-max',requiredActions:['academy.enroll','quotation.start'],requiredWorkflows:['academy.enrollment'],accent:'violet'},
  {key:'b2b_institutional',label:'B2B / Institutionnel',shortLabel:'B2B',description:'Solutions établissements, hospitality, corporate, health, Partner OS et Quality avec diagnostic, quote et handover.',doctrineKeys:DOMAIN_DOCTRINES.b2b_institutional,canonicalThemeKey:'ac.public-detail.b2b-institutional.pro-max',requiredActions:['quotation.start','b2b.request','subscription.start'],requiredWorkflows:['b2b.establishment','b2b.hospitality','b2b.health_partner','b2b.corporate'],accent:'cyan'},
] as const

const DOMAIN_BY_DOCTRINE = new Map<string, PublicExperienceMasterDomain>()
for (const domain of PUBLIC_EXPERIENCE_MASTER_DOMAINS) for (const doctrine of domain.doctrineKeys) DOMAIN_BY_DOCTRINE.set(doctrine, domain.key)

const labelFor=(key:string)=>key.split('-').map(part=>part.charAt(0).toUpperCase()+part.slice(1)).join(' ')
const actionsFor=(domain:PublicExperienceMasterDomain)=>PUBLIC_EXPERIENCE_MASTER_DOMAINS.find(row=>row.key===domain)?.requiredActions||[]
const workflowsFor=(domain:PublicExperienceMasterDomain)=>PUBLIC_EXPERIENCE_MASTER_DOMAINS.find(row=>row.key===domain)?.requiredWorkflows||[]

export const PUBLIC_EXPERIENCE_DOCTRINES: readonly PublicExperienceDoctrineProfile[] = CATEGORY_NATIVE_EXPERIENCE_DEFINITIONS
  .filter(definition=>DOMAIN_BY_DOCTRINE.has(definition.schemaKey))
  .map(definition=>{
    const masterDomain=DOMAIN_BY_DOCTRINE.get(definition.schemaKey)!
    return {
      key:definition.schemaKey,
      label:labelFor(definition.schemaKey),
      masterDomain,
      family:definition.family,
      conversionTemplate:definition.conversionTemplate,
      operationsHandoverType:definition.operationsHandoverType,
      availabilityAuthority:definition.availabilityAuthority,
      requiredActions:actionsFor(masterDomain),
      requiredWorkflows:workflowsFor(masterDomain),
    }
  })

const storefront=(key:StorefrontKey,label:string,description:string,sourceAuthorities:readonly string[],accent:PublicExperienceStorefrontProfile['accent']):PublicExperienceStorefrontProfile=>({
  key,label,route:`/angelcare-marketplace/:locale/${key}`,description,sourceAuthorities,accent,
})

export const PUBLIC_EXPERIENCE_STOREFRONTS: readonly PublicExperienceStorefrontProfile[] = [
  storefront('families','Familles','Conciergerie famille multi-services avec découverte, preuves, recommandations et parcours.', ['catalog-discovery','family-experience','trust'], 'pink'),
  storefront('home-services','Home Services','Univers de réservation des services à domicile, disponibilité et capacité prestataire.', ['catalog-discovery','provider-workforce','conversion-universe'], 'pink'),
  storefront('development','Développement','Activités, Montessori, apprentissage et ressources de développement enfant.', ['catalog-discovery','category-native','merchandising'], 'violet'),
  storefront('kits','Kits','Kits, produits, variantes, disponibilité, bundles et découverte commerce.', ['catalog-discovery','marketplace-core','merchandising'], 'blue'),
  storefront('academy','Academy','Programmes, cours, cohortes, certifications, formateurs et sessions.', ['academy-engine','catalog-discovery','conversion-universe'], 'violet'),
  storefront('establishments','Établissements','Solutions crèches, écoles, programmes, diagnostics et déploiement B2B.', ['b2b-verticals','catalog-discovery','crm'], 'cyan'),
  storefront('hospitality','Hospitality','Kids club, guest childcare, concierge famille et programmes saisonniers.', ['b2b-verticals','provider-workforce','conversion-universe'], 'amber'),
  storefront('health-partners','Health Partners','Maternités, mother & baby care, ateliers et soutien non médical.', ['b2b-verticals','trust','conversion-universe'], 'emerald'),
  storefront('corporates','Corporate','Family benefits, support d’urgence, family days et solutions employeur.', ['b2b-verticals','corporate-eligibility','crm'], 'blue'),
  storefront('partner-os','Partner OS','Plans, modules, activation partenaire et abonnement.', ['partner-os','subscriptions','catalog-discovery'], 'cyan'),
  storefront('quality-check','Quality Check','Assessments, preuves, standards, qualité et rapports.', ['quality','trust','catalog-discovery'], 'emerald'),
  storefront('professionals','Professionnels','Formation, certification, onboarding et opportunités prestataires.', ['provider-workforce','academy-engine','catalog-discovery'], 'violet'),
] as const

export function publicExperienceMasterDomainForDoctrine(doctrineKey:string):PublicExperienceMasterDomain|null{return DOMAIN_BY_DOCTRINE.get(doctrineKey)||null}
export function publicExperienceMasterDomainProfile(key:PublicExperienceMasterDomain){return PUBLIC_EXPERIENCE_MASTER_DOMAINS.find(row=>row.key===key)||null}
export function publicExperienceDoctrineProfile(key:string){return PUBLIC_EXPERIENCE_DOCTRINES.find(row=>row.key===key)||null}
export function publicExperienceStorefrontProfile(key:string){return PUBLIC_EXPERIENCE_STOREFRONTS.find(row=>row.key===key)||null}

if(PUBLIC_EXPERIENCE_DOCTRINES.length!==31)throw new Error(`Public Experience Authority: 31 doctrines attendues, ${PUBLIC_EXPERIENCE_DOCTRINES.length} trouvées.`)
if(PUBLIC_EXPERIENCE_STOREFRONTS.length!==12)throw new Error(`Public Experience Authority: 12 storefronts attendus, ${PUBLIC_EXPERIENCE_STOREFRONTS.length} trouvés.`)
