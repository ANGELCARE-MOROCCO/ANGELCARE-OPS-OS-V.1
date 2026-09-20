import type {PublicExperienceBindingDescriptor,PublicExperienceMasterDomain} from './types'

const b=(key:string,label:string,domain:PublicExperienceMasterDomain|'shared',valueType:PublicExperienceBindingDescriptor['valueType'],authority:string,requiredFor:string[]=[]):PublicExperienceBindingDescriptor=>({key,label,domain,valueType,authority,requiredFor,publicSafe:true})

export const PUBLIC_EXPERIENCE_TYPED_BINDINGS:readonly PublicExperienceBindingDescriptor[]=[
 b('identity.name','Nom public','shared','text','Category-Native / Catalog',['all']),
 b('identity.shortDescription','Description courte','shared','text','Category-Native / Catalog'),
 b('identity.description','Description complète','shared','text','Category-Native / Catalog'),
 b('media.primary','Média principal','shared','url','Catalog Media',['all']),
 b('media.gallery','Galerie canonique','shared','items','Catalog Media'),
 b('pricing.current','Prix courant','shared','number','Catalog / Finance pricing'),
 b('pricing.label','Libellé prix','shared','text','Catalog / Finance pricing'),
 b('pricing.currency','Devise','shared','text','Catalog / Finance pricing'),
 b('availability.status','Disponibilité','shared','text','Category-Native availability'),
 b('availability.quantity','Capacité / quantité','shared','number','Category-Native availability'),
 b('trust.claims','Preuves publiques','shared','items','Trust authority'),
 b('reviews.summary','Résumé avis','shared','object','Review authority'),
 b('relations.recommendations','Recommandations','shared','items','Catalog Discovery'),
 b('seo.schema','Schéma public','shared','text','Experience Schema'),
 b('product.variants','Variantes','b2c_product_digital','items','Catalog Variants',['flashcards-learning-product','montessori-development-kit','development-game']),
 b('product.specifications','Spécifications','b2c_product_digital','items','Experience public fields'),
 b('product.delivery','Livraison / fulfilment','b2c_product_digital','object','Fulfilment authority'),
 b('product.accessories','Accessoires compatibles','b2c_product_digital','items','Relations / Discovery'),
 b('product.bundles','Bundles / packs','b2c_product_digital','items','Relations / Collections'),
 b('service.plans','Plans service','b2c_service_family','items','Experience public fields',['home-childcare-recurring']),
 b('service.coverage','Couverture','b2c_service_family','object','Territory authority'),
 b('service.bookingModes','Modes réservation','b2c_service_family','items','Experience Schema'),
 b('service.scheduleRules','Règles calendrier','b2c_service_family','object','Availability authority'),
 b('service.providers','Prestataires éligibles','b2c_service_family','items','Provider public-safe projection'),
 b('service.urgency','Urgence','b2c_service_family','object','Availability / policy',['emergency-last-minute-care']),
 b('academy.curriculum','Curriculum','academy_admission','items','Academy Engine',['academy-course','academy-cohort','certification-pathway','institutional-training']),
 b('academy.modules','Modules','academy_admission','items','Academy Engine'),
 b('academy.trainers','Formateurs','academy_admission','items','Academy Engine'),
 b('academy.nextCohort','Prochaine cohorte','academy_admission','object','Academy Cohorts'),
 b('academy.capacity','Capacité','academy_admission','number','Academy Cohorts'),
 b('academy.certification','Certification','academy_admission','object','Certificate Authority'),
 b('academy.admission','Admission','academy_admission','object','Admissions authority',['preschool-admission']),
 b('b2b.organisationFit','Fit organisation','b2b_institutional','object','B2B Organization360'),
 b('b2b.deploymentModel','Modèle de déploiement','b2b_institutional','object','B2B programme authority'),
 b('b2b.diagnostic','Diagnostic','b2b_institutional','object','B2B diagnostics'),
 b('b2b.programmes','Programmes','b2b_institutional','items','B2B verticals'),
 b('b2b.portfolioProof','Preuves portefeuille','b2b_institutional','items','Organization360 / Trust'),
 b('storefront.hero','Hero storefront','shared','object','Catalog Discovery'),
 b('storefront.categories','Taxonomie','shared','items','Catalog categories'),
 b('storefront.featured','Sélection featured','shared','items','Catalog Discovery'),
 b('storefront.inventory','Inventaire live','shared','items','Catalog Discovery'),
 b('storefront.collections','Collections','shared','items','Homepage collections'),
 b('storefront.facets','Facettes','shared','object','Catalog Discovery'),
 b('storefront.campaigns','Campagnes actives','shared','items','Campaign authorities'),
] as const

export const PUBLIC_EXPERIENCE_BINDING_BY_KEY=new Map(PUBLIC_EXPERIENCE_TYPED_BINDINGS.map(row=>[row.key,row]))
export function publicExperienceBinding(key:string){return PUBLIC_EXPERIENCE_BINDING_BY_KEY.get(key)||null}
export function publicExperienceBindingsForDomain(domain:PublicExperienceMasterDomain){return PUBLIC_EXPERIENCE_TYPED_BINDINGS.filter(row=>row.domain==='shared'||row.domain===domain)}
