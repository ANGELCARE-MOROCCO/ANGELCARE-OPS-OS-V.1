import type { Data } from '@puckeditor/core'
import { HOMEPAGE_PRO_MAX_CATEGORY_ID,HOMEPAGE_PRO_MAX_WORLD_ID,HOMEPAGE_PRO_MAX_WORLD_REVISION,type HomepageProMaxInsertMode,type HomepageProMaxSectionDefinition } from './types'
import type { StudioDynamicSourceReference, StudioDynamicStrategy } from '@/angelcare-marketplace/studio-dynamic-source/types'
import { LIVING_MARKETPLACE_COMPONENT_TYPE } from '@/angelcare-marketplace/homepage-living-marketplace/world'

const responsive={mobileVisible:true,tabletVisible:true,desktopVisible:true}

const catalogDynamicSource=(strategy:StudioDynamicStrategy,limit:number):StudioDynamicSourceReference=>({version:1,sourceId:'catalog.items',strategy,limit,emptyPolicy:'hide_block'})
const meta=(id:string)=>({
  id,
  density:'dense' as const,
  background:'white' as const,
  emptyPolicy:'editor-placeholder' as const,
  responsive,
  __homepageProMax:{worldId:HOMEPAGE_PRO_MAX_WORLD_ID,revision:HOMEPAGE_PRO_MAX_WORLD_REVISION,category:HOMEPAGE_PRO_MAX_CATEGORY_ID},
})

export const HOMEPAGE_PRO_MAX_SECTION_DEFINITIONS:readonly HomepageProMaxSectionDefinition[]=[
 {id:'S00',type:'ac_home_pro_max_urgency',label:'S00 · Urgence commerciale',purpose:'Campagne réelle + compte à rebours vérifié.',dataClass:'campaign',defaultProps:{...meta('homepro-s00'),title:'Sélectionnez une campagne réelle',emptyPolicy:'hide'}},
 {id:'S01',type:'ac_home_pro_max_header',label:'S01 · Header commerce',purpose:'Logo officiel, recherche, compte, favoris et panier.',dataClass:'navigation',defaultProps:{...meta('homepro-s01'),title:'AngelCare',body:'Rechercher un service, un produit, une formation…',primaryCtaLabel:'Mon compte',items:[{title:'Mon compte'},{title:'Mes favoris'},{title:'Mon panier'}]}},
 {id:'S02',type:'ac_home_pro_max_nav',label:'S02 · Navigation principale',purpose:'Taxonomie et univers AngelCare gouvernés.',dataClass:'taxonomy',defaultProps:{...meta('homepro-s02'),title:'Univers AngelCare',items:['Garde d’enfants','Soutien aux parents','Éducation & activités','Santé & bien-être','Besoins spécifiques','Produits','Academy','Solutions pro','Conseils','Promotions'].map(title=>({title}))}},
 {id:'S03',type:'ac_home_pro_max_hero',label:'S03 · Hero Famille',purpose:'Promesse éditoriale + média + conversion.',dataClass:'editorial',defaultProps:{...meta('homepro-s03'),eyebrow:'ANGELCARE · GRANDIR ENSEMBLE',title:'Des enfants épanouis\nDes parents sereins\nUn avenir plus doux',subtitle:'Avec AngelCare, trouvez tout ce qu’il faut pour accompagner chaque famille avec confiance.',primaryCtaLabel:'Découvrir AngelCare',primaryCtaHref:'#',mediaAlt:'Famille AngelCare',items:[{title:'Plus qu’un service, une communauté pour la vie !',body:'Des experts de confiance'},{title:'Des familles accompagnées'},{title:'Des services et produits utiles'},{title:'Un accompagnement à chaque étape'}]}},
 {id:'S04',type:'ac_home_pro_max_trust',label:'S04 · Bande de confiance',purpose:'Preuves approuvées uniquement.',dataClass:'trust',defaultProps:{...meta('homepro-s04'),title:'La confiance avant tout',items:[{icon:'🚚',title:'Livraison partout au Maroc'},{icon:'🔒',title:'Paiement sécurisé'},{icon:'↻',title:'Retours selon politique'},{icon:'◉',title:'Une équipe à l’écoute'},{icon:'🇲🇦',title:'Présence au Maroc'},{icon:'♡',title:'Impact positif'}]}},
 {id:'S05',type:'ac_home_pro_max_categories',label:'S05 · Univers rapides',purpose:'Rail des catégories réelles.',dataClass:'taxonomy',defaultProps:{...meta('homepro-s05'),title:'Explorer AngelCare'}},
 {id:'S06',type:'ac_home_pro_max_promos',label:'S06 · Triptyque commercial',purpose:'Campagne famille + Academy + B2B.',dataClass:'campaign',defaultProps:{...meta('homepro-s06'),title:'À découvrir maintenant'}},
 {id:'S07',type:'ac_home_pro_max_flash',label:'S07 · Offres flash',purpose:'Pression commerciale fondée sur campagnes réelles.',dataClass:'catalog',defaultProps:{...meta('homepro-s07'),title:'Offres flash du moment',emptyPolicy:'hide',__studioDynamicSource:catalogDynamicSource('catalog_featured',6)}},
 {id:'S08',type:'ac_home_pro_max_services',label:'S08 · Services cette semaine',purpose:'Services disponibles et aide humaine.',dataClass:'services',defaultProps:{...meta('homepro-s08'),title:'Services disponibles cette semaine',body:'Nos experts vous conseillent selon les canaux réellement configurés.',primaryCtaLabel:'Trouver un intervenant',emptyPolicy:'hide',__studioDynamicSource:{...catalogDynamicSource('catalog_available',6),filters:{kind:'service',availability_status:'available'}}}},
 {id:'S09',type:'ac_home_pro_max_packs',label:'S09 · Packs + meilleures ventes',purpose:'Collections/packs et best sellers réels.',dataClass:'catalog',defaultProps:{...meta('homepro-s09'),title:'Packs famille & bébé',subtitle:'Nos meilleures ventes',emptyPolicy:'hide',__studioDynamicSource:{...catalogDynamicSource('merchandising_popular',8),filters:{kind:'product'}}}},
 {id:'S10',type:'ac_home_pro_max_academy',label:'S10 · Academy urgence',purpose:'Formations + capacité réelle + bannière.',dataClass:'academy',defaultProps:{...meta('homepro-s10'),title:'Formations Academy',subtitle:'Dernières places uniquement si la capacité réelle le confirme',body:'Développez vos compétences pour un avenir plus serein !',primaryCtaLabel:'Voir les formations',items:[{title:'Formations certifiantes'},{title:'Experts AngelCare'},{title:'Présentiel ou en ligne selon l’offre réelle'}],emptyPolicy:'hide',__studioDynamicSource:{...catalogDynamicSource('catalog_available',6),filters:{kind:'training',availability_status:'available'}}}},
 {id:'S11',type:'ac_home_pro_max_b2b',label:'S11 · Solutions professionnelles',purpose:'Crèches, écoles, maternités, hôtels et entreprises.',dataClass:'b2b',defaultProps:{...meta('homepro-s11'),title:'Solutions pour crèches, écoles, maternités, hôtels et entreprises',body:'Un accompagnement personnalisé par l’équipe AngelCare.',primaryCtaLabel:'Demander un devis',primaryCtaHref:'#',items:['Crèches','Écoles','Maternités','Hôtels & tourisme','Entreprises'].map(title=>({icon:'▦',title}))}},
 {id:'S12',type:'ac_home_pro_max_guides_experts',label:'S12 · Guides + experts',purpose:'Contenus éditoriaux et profils réels.',dataClass:'content+people',defaultProps:{...meta('homepro-s12'),title:'Guides & conseils pour parents',subtitle:'Nos experts recommandés',emptyPolicy:'hide'}},
 {id:'S13',type:'ac_home_pro_max_collections',label:'S13 · Collections + nouveautés',purpose:'Collections thématiques et nouvelles publications.',dataClass:'catalog',defaultProps:{...meta('homepro-s13'),title:'Nos collections thématiques',subtitle:'Dernières nouveautés',emptyPolicy:'hide',__studioDynamicSource:catalogDynamicSource('catalog_newest',8)}},
 {id:'S14',type:'ac_home_pro_max_community',label:'S14 · Communauté + app + offre',purpose:'Communauté, application et campagne valide.',dataClass:'engagement',defaultProps:{...meta('homepro-s14'),title:'Rejoignez la communauté AngelCare',primaryCtaLabel:'Nous rejoindre',primaryCtaHref:'#',items:[{title:'Communauté AngelCare',body:'Conseils, actualités et offres réellement publiées.'},{title:'Téléchargez l’application AngelCare',body:'Accédez aux services et contenus depuis votre mobile.'},{title:'Offre de bienvenue',body:'Visible uniquement lorsqu’une campagne réelle et éligible est configurée.'}]}},
 {id:'S15',type:'ac_home_pro_max_commitments',label:'S15 · Engagements + confiance',purpose:'Valeurs et logos approuvés seulement.',dataClass:'trust',defaultProps:{...meta('homepro-s15'),title:'Nos engagements',items:[{icon:'♡',title:'Qualité & sécurité'},{icon:'♡',title:'Profils vérifiés'},{icon:'♡',title:'Relation de confiance'},{icon:'♡',title:'Écoute'},{icon:'♡',title:'Impact positif'}]}},
 {id:'S16',type:'ac_home_pro_max_faq',label:'S16 · FAQ + témoignage + mission',purpose:'Réassurance, témoignage réel et mission.',dataClass:'trust+content',defaultProps:{...meta('homepro-s16'),title:'Questions fréquentes',body:'Toujours à vos côtés.',items:[{title:'Question 1',body:''},{title:'Question 2',body:''},{title:'Question 3',body:''},{title:'Question 4',body:''},{title:'Ce que nos clients disent',body:''},{title:'Des enfants épanouis · Un avenir plus doux',body:'Toujours à vos côtés.'}]}},
 {id:'S17',type:'ac_home_pro_max_footer',label:'S17 · Mega Footer',purpose:'Navigation, aide, apps, newsletter et légal.',dataClass:'navigation',defaultProps:{...meta('homepro-s17'),title:'AngelCare',body:'Des enfants épanouis. Des parents sereins. Un avenir plus doux.',items:[{badge:'Nos univers',title:'Services'},{badge:'Nos univers',title:'Academy'},{badge:'Nos univers',title:'Produits'},{badge:'Nos univers',title:'Solutions pro'},{badge:'Aide & contact',title:'Centre d’aide'},{badge:'Aide & contact',title:'Nous contacter'},{badge:'Aide & contact',title:'FAQ'},{badge:'À propos',title:'Notre mission'},{badge:'À propos',title:'Nos engagements'},{badge:'À propos',title:'Carrières'},{badge:'Restez informé !',title:'Newsletter',body:'Newsletter et communications soumises au consentement.'}]}},
] as const

export const HOMEPAGE_PRO_MAX_COMPONENT_KEYS=[...HOMEPAGE_PRO_MAX_SECTION_DEFINITIONS.map(row=>row.type),LIVING_MARKETPLACE_COMPONENT_TYPE] as readonly string[]

const clone=<T,>(v:T):T=>JSON.parse(JSON.stringify(v)) as T
const sectionData=()=>HOMEPAGE_PRO_MAX_SECTION_DEFINITIONS.map(row=>({type:row.type,props:clone(row.defaultProps)}))

export function buildHomepageProMaxWorld01Data(current?:Data,mode:HomepageProMaxInsertMode='replace'):Data{
 const root=current?.root?clone(current.root):({props:{}} as Data['root'])
 const rootProps=((root?.props||{}) as Record<string,unknown>)
 const replacementRootProps:Record<string,unknown>={}
 for(const key of ['title','locale','pageId'] as const){const value=rootProps[key];if(typeof value==='string'&&value)replacementRootProps[key]=value}
 const existing=Array.isArray(current?.content)?clone(current!.content):[]
 const content=mode==='append'?[...existing,...sectionData()]:sectionData()
 const homepageWorld={worldId:HOMEPAGE_PRO_MAX_WORLD_ID,revision:HOMEPAGE_PRO_MAX_WORLD_REVISION,referenceSha256:'37a379977685225be5313d10b73ca12c4c0621daccce7ea5cb03ea992f4c7f6d'}
 const nextRoot=mode==='replace'?({props:{...replacementRootProps,__homepageProMaxWorld:homepageWorld}} as Data['root']):({...root,props:{...rootProps,__homepageProMaxWorld:homepageWorld}} as Data['root'])
 return {content,root:nextRoot} as Data
}

export const HOMEPAGE_PRO_MAX_WORLD_01={
 id:HOMEPAGE_PRO_MAX_WORLD_ID,
 label:'AngelCare Famille & Bébé — Hyper-Commerce 01',
 description:'Homepage dense 18 sections · services · produits · Academy · B2B · confiance · communauté · conversion.',
 categoryId:HOMEPAGE_PRO_MAX_CATEGORY_ID,
 revision:HOMEPAGE_PRO_MAX_WORLD_REVISION,
 referenceImage:'/angelcare-marketplace/studio/homepage-pro-max/world-01-reference.png',
 referenceSha256:'37a379977685225be5313d10b73ca12c4c0621daccce7ea5cb03ea992f4c7f6d',
 sectionCount:HOMEPAGE_PRO_MAX_SECTION_DEFINITIONS.length,
 build:buildHomepageProMaxWorld01Data,
} as const

export const HOMEPAGE_PRO_MAX_PERSISTENCE_TYPES:Readonly<Record<string,string>>={
 ac_home_pro_max_urgency:'section',
 ac_home_pro_max_header:'section',
 ac_home_pro_max_nav:'section',
 ac_home_pro_max_hero:'hero',
 ac_home_pro_max_trust:'trust_strip',
 ac_home_pro_max_categories:'category_grid',
 ac_home_pro_max_promos:'collection_rail',
 ac_home_pro_max_flash:'product_grid',
 ac_home_pro_max_services:'service_grid',
 ac_home_pro_max_packs:'product_grid',
 ac_home_pro_max_academy:'service_grid',
 ac_home_pro_max_b2b:'cta_band',
 ac_home_pro_max_guides_experts:'editorial',
 ac_home_pro_max_collections:'collection_rail',
 ac_home_pro_max_community:'cta_band',
 ac_home_pro_max_commitments:'trust_strip',
 ac_home_pro_max_faq:'faq',
 ac_home_pro_max_footer:'section',
 [LIVING_MARKETPLACE_COMPONENT_TYPE]:'homepage_world',
} as const

export function homepageProMaxPersistenceType(type:string){return HOMEPAGE_PRO_MAX_PERSISTENCE_TYPES[type]||type}
