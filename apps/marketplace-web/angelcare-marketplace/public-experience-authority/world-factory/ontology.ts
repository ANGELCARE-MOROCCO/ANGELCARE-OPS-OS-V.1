import type {PublicExperienceMasterDomain} from '../types'
import type {WorldFactorySemanticRole} from './types'

export interface WorldFactoryRoleProfile{role:WorldFactorySemanticRole;keywords:string[];types:string[];bindings:string[];targets:string[];requiredFor:PublicExperienceMasterDomain[];actionIntents:string[]}
const all:PublicExperienceMasterDomain[]=['b2c_service_family','b2c_product_digital','academy_admission','b2b_institutional']
const r=(role:WorldFactorySemanticRole,keywords:string[],types:string[],bindings:string[],targets:string[],requiredFor:PublicExperienceMasterDomain[]=[],actionIntents:string[]=[]):WorldFactoryRoleProfile=>({role,keywords,types,bindings,targets,requiredFor,actionIntents})
export const WORLD_FACTORY_ROLE_PROFILES:readonly WorldFactoryRoleProfile[]=[
 r('hero',['hero','headline','discover','découvr','bienvenue','premium'],['hero','split_hero','video_hero'],['identity.name','identity.shortDescription','media.primary'],['title','lead','mediaUrl'],all),
 r('identity',['identity','nom','name','description','brand','marque','product','service'],[],['identity.name','identity.shortDescription','identity.description'],['title','lead','body'],all),
 r('media',['gallery','galerie','media','photo','image','video','carousel'],['studio_image','media_gallery'],['media.primary','media.gallery'],['mediaUrl','items'],all),
 r('pricing',['price','prix','tarif','dh','dhs','mad','€','à partir'],['pricing','price_card'],['pricing.current','pricing.label','pricing.currency'],['title','lead','body'],all),
 r('availability',['stock','availability','disponib','capacity','capacité','créneau'],[],['availability.status','availability.quantity'],['title','lead'],all),
 r('variants',['variant','option','taille','size','couleur','color','format'],[],['product.variants'],['items'],['b2c_product_digital']),
 r('specifications',['spec','caractér','technical','technique','details','détails'],[],['product.specifications'],['items'],['b2c_product_digital']),
 r('reviews',['review','avis','rating','étoile','stars','témoignage'],[],['reviews.summary'],['items'],all),
 r('trust',['trust','confiance','garantie','verified','sécur','certif','preuve'],['trust_strip'],['trust.claims'],['items'],all),
 r('primary_conversion',['buy','acheter','add to cart','panier','book','réserver','enroll','inscrire','devis','quote','souscrire','commencer'],['studio_button'],[],['primaryCtaLabel'],all,['primary']),
 r('secondary_conversion',['contact','conseil','inquiry','demande','learn more','voir','découvrir'],[],[],['secondaryCtaLabel'],[],['secondary']),
 r('bundle',['bundle','pack','ensemble','souvent achet','frequently bought'],[],['product.bundles'],['items'],['b2c_product_digital']),
 r('accessories',['accessor','compatible','complément','cross sell'],[],['product.accessories'],['items'],['b2c_product_digital']),
 r('recommendations',['similar','similaire','recommend','recommand','vous aimerez','alternatives'],[],['relations.recommendations'],['items'],all),
 r('related',['related','associé','complémentaire','autres offres'],[],['relations.recommendations'],['items'],all),
 r('service_plans',['plan','forfait','récurrent','recurring','abonnement'],[],['service.plans','service.bookingModes'],['items'],['b2c_service_family']),
 r('service_schedule',['schedule','horaire','calendrier','date','créneau','planning'],[],['service.scheduleRules'],['items'],['b2c_service_family']),
 r('service_coverage',['coverage','zone','ville','territoire','domicile','déplacement'],[],['service.coverage'],['items'],['b2c_service_family']),
 r('service_providers',['provider','prestataire','caregiver','intervenant','nounou','équipe'],[],['service.providers'],['items'],['b2c_service_family']),
 r('academy_curriculum',['curriculum','programme','module','learning','apprentissage','contenu pédagogique'],[],['academy.curriculum','academy.modules'],['items'],['academy_admission']),
 r('academy_cohort',['cohort','cohorte','session','capacity','capacité','prochaine session'],[],['academy.nextCohort','academy.capacity'],['items'],['academy_admission']),
 r('academy_trainers',['trainer','formateur','faculty','équipe pédagogique','intervenant'],[],['academy.trainers'],['items'],['academy_admission']),
 r('academy_certification',['certificate','certification','diplôme','attestation'],[],['academy.certification'],['items'],['academy_admission']),
 r('academy_admission',['admission','candidature','inscription','prérequis'],[],['academy.admission'],['items'],['academy_admission']),
 r('b2b_fit',['organisation','institution','fit','besoin','diagnostic','établissement'],[],['b2b.organisationFit','b2b.diagnostic'],['items'],['b2b_institutional']),
 r('b2b_programme',['programme','solution','service institution','offre b2b'],[],['b2b.programmes'],['items'],['b2b_institutional']),
 r('b2b_deployment',['deployment','déploiement','implementation','mise en place','rollout'],[],['b2b.deploymentModel'],['items'],['b2b_institutional']),
 r('b2b_proof',['case study','preuve','référence','portfolio','client'],[],['b2b.portfolioProof','trust.claims'],['items'],['b2b_institutional']),
 r('storefront_hero',['hero','marketplace','boutique','storefront'],['hero','split_hero'],['storefront.hero'],['items']),
 r('storefront_categories',['category','catégorie','univers','department','rayon'],['category_grid'],['storefront.categories'],['items']),
 r('storefront_inventory',['product','service','inventory','offre','catalogue','results'],['product_grid','service_grid'],['storefront.inventory','storefront.featured'],['items']),
 r('storefront_collection',['collection','selection','sélection','tendance','curation'],['collection_rail'],['storefront.collections'],['items']),
 r('storefront_facets',['filter','filtre','facet','facette','tri'],[],['storefront.facets'],['items']),
 r('storefront_campaigns',['campaign','campagne','promotion','offre spéciale'],[],['storefront.campaigns'],['items']),
 r('faq',['faq','question','questions fréquentes'],['faq','studio_accordion'],[],['items']),
 r('navigation',['nav','menu','breadcrumb','fil d’ariane'],['studio_menu'],[],['items']),
 r('footer',['footer','pied de page'],[],[],['items']),
 r('editorial',['guide','conseil','article','inspiration','community','communauté','contenu'],[],[],['items']),
]
export const WORLD_FACTORY_ROLE_BY_NAME=new Map(WORLD_FACTORY_ROLE_PROFILES.map(row=>[row.role,row]))
