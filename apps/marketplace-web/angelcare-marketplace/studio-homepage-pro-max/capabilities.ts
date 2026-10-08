import type { StudioDynamicStrategy } from '@/angelcare-marketplace/studio-dynamic-source/types'

export type HomepageCapabilityTab='content'|'source'|'media'|'actions'|'display'|'design'|'responsive'
export type HomepageOfferKind='product'|'service'|'training'|'saas'
export interface HomepageBlockCapability{
  id:string
  type:string
  tabs:readonly HomepageCapabilityTab[]
  content:boolean
  items:boolean
  itemMedia:boolean
  sectionMedia:boolean
  actions:boolean
  dynamicSource:boolean
  merchandising:boolean
  fixedKind?:HomepageOfferKind
  defaultStrategy?:StudioDynamicStrategy
  maxItems?:number
  nestedLabel?:string
}

const c=(id:string,type:string,tabs:HomepageCapabilityTab[],extra:Partial<HomepageBlockCapability>={}):HomepageBlockCapability=>({id,type,tabs,content:true,items:false,itemMedia:false,sectionMedia:false,actions:false,dynamicSource:false,merchandising:false,...extra})

export const HOMEPAGE_PRO_MAX_CAPABILITIES:readonly HomepageBlockCapability[]=[
 c('S00','ac_home_pro_max_urgency',['content','source','actions','design','responsive'],{actions:true,dynamicSource:true}),
 c('S01','ac_home_pro_max_header',['content','media','actions','design','responsive'],{items:true,itemMedia:true,sectionMedia:true,actions:true,nestedLabel:'Navigation & utilitaires'}),
 c('S02','ac_home_pro_max_nav',['content','display','design','responsive'],{items:true,nestedLabel:'Liens de navigation',maxItems:16}),
 c('S03','ac_home_pro_max_hero',['content','media','actions','display','design','responsive'],{items:true,itemMedia:true,sectionMedia:true,actions:true,nestedLabel:'Promesses Hero',maxItems:8}),
 c('S04','ac_home_pro_max_trust',['content','display','design','responsive'],{items:true,nestedLabel:'Preuves de confiance',maxItems:12}),
 c('S05','ac_home_pro_max_categories',['source','display','design','responsive'],{items:true,dynamicSource:true,merchandising:true,nestedLabel:'Univers',maxItems:16}),
 c('S06','ac_home_pro_max_promos',['content','source','media','actions','display','design','responsive'],{items:true,itemMedia:true,dynamicSource:true,merchandising:true,actions:true,nestedLabel:'Promotions',maxItems:6}),
 c('S07','ac_home_pro_max_flash',['content','source','media','display','design','responsive'],{items:true,itemMedia:true,dynamicSource:true,merchandising:true,defaultStrategy:'catalog_featured',nestedLabel:'Offres flash',maxItems:12}),
 c('S08','ac_home_pro_max_services',['content','source','media','actions','display','design','responsive'],{items:true,itemMedia:true,dynamicSource:true,merchandising:true,actions:true,fixedKind:'service',defaultStrategy:'catalog_available',nestedLabel:'Services',maxItems:12}),
 c('S09','ac_home_pro_max_packs',['content','source','media','display','design','responsive'],{items:true,itemMedia:true,dynamicSource:true,merchandising:true,fixedKind:'product',defaultStrategy:'merchandising_popular',nestedLabel:'Produits & packs',maxItems:16}),
 c('S10','ac_home_pro_max_academy',['content','source','media','actions','display','design','responsive'],{items:true,itemMedia:true,dynamicSource:true,merchandising:true,actions:true,fixedKind:'training',defaultStrategy:'catalog_available',nestedLabel:'Formations',maxItems:12}),
 c('S11','ac_home_pro_max_b2b',['content','media','actions','display','design','responsive'],{items:true,itemMedia:true,actions:true,nestedLabel:'Secteurs B2B',maxItems:12}),
 c('S12','ac_home_pro_max_guides_experts',['content','media','display','design','responsive'],{items:true,itemMedia:true,nestedLabel:'Guides & experts',maxItems:16}),
 c('S13','ac_home_pro_max_collections',['content','source','media','display','design','responsive'],{items:true,itemMedia:true,dynamicSource:true,merchandising:true,defaultStrategy:'catalog_newest',nestedLabel:'Collections & nouveautés',maxItems:16}),
 c('S14','ac_home_pro_max_community',['content','media','actions','display','design','responsive'],{items:true,itemMedia:true,actions:true,nestedLabel:'Panneaux communauté',maxItems:6}),
 c('S15','ac_home_pro_max_commitments',['content','media','display','design','responsive'],{items:true,itemMedia:true,nestedLabel:'Engagements & partenaires',maxItems:18}),
 c('S16','ac_home_pro_max_faq',['content','media','display','design','responsive'],{items:true,itemMedia:true,nestedLabel:'FAQ, témoignage & mission',maxItems:12}),
 c('S17','ac_home_pro_max_footer',['content','media','actions','display','design','responsive'],{items:true,itemMedia:true,actions:true,nestedLabel:'Navigation footer',maxItems:30}),
] as const

export const HOMEPAGE_PRO_MAX_CAPABILITY_BY_TYPE=new Map(HOMEPAGE_PRO_MAX_CAPABILITIES.map(row=>[row.type,row]))
export const homepageCapability=(type:string)=>HOMEPAGE_PRO_MAX_CAPABILITY_BY_TYPE.get(type)||null
