'use client'
import type { Config } from '@puckeditor/core'
import type { StudioPickerData } from '@/angelcare-marketplace/studio-universal/types'
import { MediaField,RecordField } from '@/angelcare-marketplace/studio-universal/components/StudioFields'
import { HOMEPAGE_PRO_MAX_COMPONENT_KEYS,HOMEPAGE_PRO_MAX_SECTION_DEFINITIONS } from './recipe'
import type { HomepageProMaxSectionProps } from './types'
import { HomepageProMaxEditorRuntime } from './components/HomepageProMaxEditorRuntime'
import { StudioDynamicSourceField } from '@/angelcare-marketplace/studio-dynamic-source/components/StudioDynamicSourceField'
import { createStudioDesignFields,responsiveField,DEFAULT_STUDIO_DESIGN } from '@/angelcare-marketplace/studio-universal/design'
import { StudioActionField } from '@/angelcare-marketplace/studio-action-registry/components/StudioActionField'

const choice=(label:string,options:Array<{label:string;value:string}>)=>({type:'select' as const,label,options})
const yesNo=(label:string)=>({type:'radio' as const,label,options:[{label:'Oui',value:true},{label:'Non',value:false}]})
const itemFields={
 title:{type:'text' as const,label:'Titre'},subtitle:{type:'text' as const,label:'Sous-titre'},body:{type:'textarea' as const,label:'Texte'},mediaUrl:{type:'text' as const,label:'URL média de secours'},href:{type:'text' as const,label:'Destination'},ctaLabel:{type:'text' as const,label:'CTA'},badge:{type:'text' as const,label:'Badge'},priceMad:{type:'number' as const,label:'Prix MAD (uniquement si source autorisée)'},compareAtMad:{type:'number' as const,label:'Prix barré MAD (uniquement si légitime)'},rating:{type:'number' as const,label:'Note réelle'},reviewCount:{type:'number' as const,label:'Avis réels'},
}
function fields(pickers:StudioPickerData){return {
 title:{type:'text' as const,label:'Titre'},eyebrow:{type:'text' as const,label:'Eyebrow'},subtitle:{type:'textarea' as const,label:'Sous-titre'},body:{type:'textarea' as const,label:'Texte'},
 mediaAssetKey:{type:'custom' as const,label:'Media Vault',render:({value,onChange}:any)=><MediaField value={value} onChange={onChange}/>},mediaUrl:{type:'text' as const,label:'URL média externe · secours'},mediaAlt:{type:'text' as const,label:'Texte alternatif'},
 categoryKey:{type:'custom' as const,label:'Catégorie réelle',render:({value,onChange}:any)=><RecordField kind="category" value={value} onChange={onChange}/>},collectionKey:{type:'custom' as const,label:'Collection réelle',render:({value,onChange}:any)=><RecordField kind="collection" value={value} onChange={onChange}/>},
 primaryCtaLabel:{type:'text' as const,label:'CTA principal'},primaryAction:{type:'custom' as const,label:'Action principale · canonique',render:({value,onChange}:any)=><StudioActionField value={value} onChange={onChange} label="Action principale"/>},primaryCtaHref:{type:'text' as const,label:'Destination CTA · legacy'},secondaryCtaLabel:{type:'text' as const,label:'CTA secondaire'},secondaryAction:{type:'custom' as const,label:'Action secondaire · canonique',render:({value,onChange}:any)=><StudioActionField value={value} onChange={onChange} label="Action secondaire"/>},secondaryCtaHref:{type:'text' as const,label:'Destination secondaire · legacy'},
 endsAt:{type:'text' as const,label:'Fin de campagne ISO · source réelle'},badge:{type:'text' as const,label:'Badge'},
 __studioDynamicSource:{type:'custom' as const,label:'Données réelles · P06',render:({value,onChange}:any)=><StudioDynamicSourceField value={value} onChange={onChange} allowedSources={['catalog.items','homepage.collections','homepage.campaigns']}/>},
 items:{type:'array' as const,label:'Overrides éditoriaux / contenu approuvé',arrayFields:itemFields,defaultItemProps:(index:number)=>({title:`Élément ${index+1}`}),getItemSummary:(item:Record<string,unknown>,index:number)=>String(item.title||`Élément ${index+1}`),max:24},
 sourceDesign:{type:'object' as const,label:'Design avancé',objectFields:createStudioDesignFields()},responsive:responsiveField,
 density:choice('Densité',[{label:'Dense',value:'dense'},{label:'Équilibrée',value:'balanced'},{label:'Éditoriale',value:'editorial'}]),background:choice('Fond',[{label:'Blanc',value:'white'},{label:'Bleu doux',value:'soft-blue'},{label:'Rose doux',value:'soft-pink'},{label:'Navy',value:'navy'},{label:'Transparent',value:'transparent'}]),emptyPolicy:choice('Si vide',[{label:'Masquer en public',value:'hide'},{label:'Placeholder éditeur',value:'editor-placeholder'},{label:'Conserver le shell',value:'preserve-shell'}]),hidden:yesNo('Masqué'),
}}
export function createHomepageProMaxPuckComponents(pickers:StudioPickerData):Config['components']{
 return Object.fromEntries(HOMEPAGE_PRO_MAX_SECTION_DEFINITIONS.map(def=>[def.type,{label:def.label,fields:fields(pickers),defaultProps:{...def.defaultProps,sourceDesign:{...DEFAULT_STUDIO_DESIGN},responsive:def.defaultProps.responsive||{mobileVisible:true,tabletVisible:true,desktopVisible:true}},render:(props:HomepageProMaxSectionProps)=><HomepageProMaxEditorRuntime type={def.type} props={props} pickers={pickers}/>,resolvePermissions:async()=>({edit:true,drag:true,delete:true,duplicate:true,insert:true})}])) as Config['components']
}
export { HOMEPAGE_PRO_MAX_COMPONENT_KEYS }
