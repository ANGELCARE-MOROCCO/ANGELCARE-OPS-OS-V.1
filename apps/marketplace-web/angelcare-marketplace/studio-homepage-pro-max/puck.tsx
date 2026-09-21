'use client'
import type { Config } from '@puckeditor/core'
import type { StudioPickerData } from '@/angelcare-marketplace/studio-universal/types'
import { MediaField,RecordField } from '@/angelcare-marketplace/studio-universal/components/StudioFields'
import { HOMEPAGE_PRO_MAX_COMPONENT_KEYS,HOMEPAGE_PRO_MAX_SECTION_DEFINITIONS } from './recipe'
import type { HomepageProMaxSectionProps } from './types'
import { HomepageProMaxSectionRuntime } from './components/HomepageProMaxSectionRuntime'

const choice=(label:string,options:Array<{label:string;value:string}>)=>({type:'select' as const,label,options})
const yesNo=(label:string)=>({type:'radio' as const,label,options:[{label:'Oui',value:true},{label:'Non',value:false}]})
const itemFields={
 title:{type:'text' as const,label:'Titre'},subtitle:{type:'text' as const,label:'Sous-titre'},body:{type:'textarea' as const,label:'Texte'},mediaUrl:{type:'text' as const,label:'URL média de secours'},href:{type:'text' as const,label:'Destination'},ctaLabel:{type:'text' as const,label:'CTA'},badge:{type:'text' as const,label:'Badge'},priceMad:{type:'number' as const,label:'Prix MAD (uniquement si source autorisée)'},compareAtMad:{type:'number' as const,label:'Prix barré MAD (uniquement si légitime)'},rating:{type:'number' as const,label:'Note réelle'},reviewCount:{type:'number' as const,label:'Avis réels'},
}
function fields(pickers:StudioPickerData){return {
 title:{type:'text' as const,label:'Titre'},eyebrow:{type:'text' as const,label:'Eyebrow'},subtitle:{type:'textarea' as const,label:'Sous-titre'},body:{type:'textarea' as const,label:'Texte'},
 mediaAssetKey:{type:'custom' as const,label:'Media Vault',render:({value,onChange}:any)=><MediaField value={typeof value==='string'?value:''} onChange={onChange}/>},mediaUrl:{type:'text' as const,label:'URL média externe · secours'},mediaAlt:{type:'text' as const,label:'Texte alternatif'},
 categoryKey:{type:'custom' as const,label:'Catégorie réelle',render:({value,onChange}:any)=><RecordField kind="category" value={typeof value==='string'?value:''} onChange={onChange}/>},collectionKey:{type:'custom' as const,label:'Collection réelle',render:({value,onChange}:any)=><RecordField kind="collection" value={typeof value==='string'?value:''} onChange={onChange}/>},
 primaryCtaLabel:{type:'text' as const,label:'CTA principal'},primaryCtaHref:{type:'text' as const,label:'Destination CTA'},secondaryCtaLabel:{type:'text' as const,label:'CTA secondaire'},secondaryCtaHref:{type:'text' as const,label:'Destination secondaire'},
 endsAt:{type:'text' as const,label:'Fin de campagne ISO · source réelle'},badge:{type:'text' as const,label:'Badge'},
 __studioDynamicSource:{type:'object' as const,label:'Source dynamique P06',objectFields:{sourceId:choice('Source',[{label:'Catalogue réel',value:'catalog.items'},{label:'Collections réelles',value:'homepage.collections'},{label:'Campagnes réelles',value:'homepage.campaigns'}]),strategy:choice('Stratégie',[{label:'Sélection mise en avant',value:'featured'},{label:'Disponible maintenant',value:'available_now'},{label:'Populaire',value:'popular'},{label:'Nouveautés',value:'newest'},{label:'Par catégorie',value:'category_items'},{label:'Par collection',value:'collection_items'}]),limit:{type:'number' as const,label:'Limite',min:1,max:24}}},
 items:{type:'array' as const,label:'Overrides éditoriaux / contenu approuvé',arrayFields:itemFields,defaultItemProps:(index:number)=>({title:`Élément ${index+1}`}),getItemSummary:(item:Record<string,unknown>,index:number)=>String(item.title||`Élément ${index+1}`),max:24},
 density:choice('Densité',[{label:'Dense',value:'dense'},{label:'Équilibrée',value:'balanced'},{label:'Éditoriale',value:'editorial'}]),background:choice('Fond',[{label:'Blanc',value:'white'},{label:'Bleu doux',value:'soft-blue'},{label:'Rose doux',value:'soft-pink'},{label:'Navy',value:'navy'},{label:'Transparent',value:'transparent'}]),emptyPolicy:choice('Si vide',[{label:'Masquer en public',value:'hide'},{label:'Placeholder éditeur',value:'editor-placeholder'},{label:'Conserver le shell',value:'preserve-shell'}]),hidden:yesNo('Masqué'),
}}
export function createHomepageProMaxPuckComponents(pickers:StudioPickerData):Config['components']{
 return Object.fromEntries(HOMEPAGE_PRO_MAX_SECTION_DEFINITIONS.map(def=>[def.type,{label:def.label,fields:fields(pickers),defaultProps:def.defaultProps,render:(props:HomepageProMaxSectionProps)=><HomepageProMaxSectionRuntime type={def.type} props={props} pickers={pickers} mode="editor"/>,resolvePermissions:async()=>({edit:true,drag:true,delete:true,duplicate:true,insert:true})}])) as Config['components']
}
export { HOMEPAGE_PRO_MAX_COMPONENT_KEYS }
