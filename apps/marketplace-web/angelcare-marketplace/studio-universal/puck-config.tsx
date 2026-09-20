'use client'

import type { Config } from '@puckeditor/core'
import { ANGELCARE_STUDIO_BLOCK_CONTRACTS } from './block-contracts'
import { createStudioDesignFields, DEFAULT_STUDIO_DESIGN, responsiveField } from './design'
import type { StudioBlockProps, StudioPickerData } from './types'
import { createStudioLayoutComponents, STUDIO_LAYOUT_KEYS } from './components/StudioLayouts'
import { StudioBlockRuntime } from './components/StudioBlockRuntime'
import { StudioDesignShell } from './components/StudioDesignShell'
import { StudioVisualCatalogueRuntime } from './components/StudioVisualCatalogueRuntime'
import { MediaField, RecordField } from './components/StudioFields'
import { createHomepageProMaxPuckComponents,HOMEPAGE_PRO_MAX_COMPONENT_KEYS } from '@/angelcare-marketplace/studio-homepage-pro-max/puck'
import { HOMEPAGE_PRO_MAX_CATEGORY_ID,HOMEPAGE_PRO_MAX_CATEGORY_LABEL } from '@/angelcare-marketplace/studio-homepage-pro-max/types'
import { StudioActionField } from '@/angelcare-marketplace/studio-action-registry/components/StudioActionField'
import { StudioLiveBindingField } from '@/angelcare-marketplace/studio-live-binding/components/StudioLiveBindingField'
import { StudioDynamicSourceField } from '@/angelcare-marketplace/studio-dynamic-source/components/StudioDynamicSourceField'
import { StudioWorkflowField } from '@/angelcare-marketplace/studio-workflows/components/StudioWorkflowField'
import { studioDynamicSourcesForBlock } from '@/angelcare-marketplace/studio-dynamic-source/registry'
import { studioBindingTargetsForFields } from '@/angelcare-marketplace/studio-live-binding/registry'
import { ANGELCARE_STUDIO_VISUAL_CATEGORIES, ANGELCARE_STUDIO_VISUAL_EXPERIENCES, studioVisualDefaultProps } from './visual-catalogue'

const groups = ['content','media','commerce','discovery','trust','conversion','interactive','layout','extension'] as const
const labels: Record<string,string> = {content:'Contenu',media:'Média',commerce:'Commerce',discovery:'Découverte',trust:'Confiance',conversion:'Conversion',interactive:'Interactif',layout:'Mise en page',extension:'Extensions contrôlées'}
const yesNo=(label:string)=>({type:'radio' as const,label,options:[{label:'Oui',value:true},{label:'Non',value:false}]})
const itemArray=()=>({type:'array' as const,label:'Éléments',arrayFields:{title:{type:'text' as const,label:'Titre'},label:{type:'text' as const,label:'Libellé'},body:{type:'textarea' as const,label:'Texte'},description:{type:'textarea' as const,label:'Description'},action:{type:'custom' as const,label:'Action',render:({value,onChange}:any)=><StudioActionField value={value} onChange={onChange} label="Action de l’élément"/>},href:{type:'text' as const,label:'Lien legacy · compatibilité'},mediaUrl:{type:'text' as const,label:'URL média'},value:{type:'text' as const,label:'Valeur'}},defaultItemProps:()=>({title:'',body:'',action:null,href:''}),getItemSummary:(item:Record<string,unknown>,index:number)=>String(item.title||item.label||`Élément ${index+1}`),max:48})

function fieldsFor(type:string,pickers:StudioPickerData){
  const contract=ANGELCARE_STUDIO_BLOCK_CONTRACTS.find(row=>row.type===type)
  const fields:Record<string,unknown>={}
  const has=(key:string)=>contract?.fields.includes(key)
  if(has('eyebrow'))fields.eyebrow={type:'text',label:'Eyebrow'}
  if(has('title'))fields.title={type:'text',label:'Titre'}
  if(has('lead'))fields.lead={type:'textarea',label:'Sous-titre / lead'}
  if(has('body'))fields.body={type:'textarea',label:'Corps'}
  if(has('primaryCtaLabel'))fields.primaryCtaLabel={type:'text',label:'CTA principal'}
  if(has('primaryAction')||has('primaryCtaHref'))fields.primaryAction={type:'custom',label:'Action principale',render:({value,onChange}:any)=><StudioActionField value={value} onChange={onChange} label="Action principale"/>}
  if(has('primaryCtaHref'))fields.primaryCtaHref={type:'text',label:'Destination legacy · compatibilité'}
  if(has('secondaryCtaLabel'))fields.secondaryCtaLabel={type:'text',label:'CTA secondaire'}
  if(has('secondaryAction')||has('secondaryCtaHref'))fields.secondaryAction={type:'custom',label:'Action secondaire',render:({value,onChange}:any)=><StudioActionField value={value} onChange={onChange} label="Action secondaire"/>}
  if(has('secondaryCtaHref'))fields.secondaryCtaHref={type:'text',label:'Destination legacy · compatibilité'}
  if(has('mediaAssetKey'))fields.mediaAssetKey={type:'custom',label:'Media Vault',render:({value,onChange}:any)=><MediaField value={value} onChange={onChange}/>}
  if(has('mediaUrl'))fields.mediaUrl={type:'text',label:'URL média externe · optionnel'}
  if(has('mediaAlt'))fields.mediaAlt={type:'text',label:'Texte alternatif'}
  if(has('collectionKey'))fields.collectionKey={type:'custom',label:'Collection réelle',render:({value,onChange}:any)=><RecordField kind="collection" value={value} onChange={onChange}/>}
  if(has('categoryKey'))fields.categoryKey={type:'custom',label:'Catégorie réelle',render:({value,onChange}:any)=><RecordField kind="category" value={value} onChange={onChange}/>}
  if(has('items'))fields.items=itemArray()
  if(has('height'))fields.height={type:'number',label:'Hauteur',min:0,max:300}
  if(has('__studioWorkflow')||type==='inquiry_form'||type==='studio_form')fields.__studioWorkflow={type:'custom',label:'Workflow AngelCare',render:({value,onChange}:any)=><StudioWorkflowField value={value} onChange={onChange}/>}
  const dynamicSources=studioDynamicSourcesForBlock(type)
  if(dynamicSources.length)fields.__studioDynamicSource={type:'custom',label:'Source dynamique',render:({value,onChange}:any)=><StudioDynamicSourceField value={value} onChange={onChange} allowedSources={dynamicSources}/>}
  const bindingTargets=studioBindingTargetsForFields(contract?.fields||[])
  if(bindingTargets.length)fields.__studioBindings={type:'custom',label:'Données live',render:({value,onChange}:any)=><StudioLiveBindingField targets={bindingTargets.map(row=>row.key)} value={value} onChange={onChange}/>}
  if(has('sourceDesign'))fields.sourceDesign={type:'object',label:'Design',objectFields:createStudioDesignFields()}
  fields.responsive=responsiveField
  fields.hidden=yesNo('Masqué')
  fields.locked=yesNo('Verrouillé')
  return fields
}

function defaults(type:string):StudioBlockProps{
  const base:StudioBlockProps={id:'',title:'',lead:'',body:'',items:[],sourceDesign:{...DEFAULT_STUDIO_DESIGN},responsive:{mobileVisible:true,tabletVisible:true,desktopVisible:true},hidden:false,locked:false}
  if(type==='hero'){base.eyebrow='ANGELCARE';base.title='Une expérience qui mérite d’être racontée.';base.lead='Composez cette page avec les données et médias réels de votre Marketplace.';base.primaryCtaLabel='';base.primaryCtaHref=''}
  if(type==='studio_text'){base.title='Nouveau contenu';base.body=''}
  if(type==='studio_button'){base.primaryCtaLabel='';base.primaryCtaHref=''}
  if(type==='studio_spacer'){base.height=40}
  if(type==='studio_island'){base.title='Capacité externe à examiner';base.body='Aucun code étranger n’est exécuté. Une reconstruction native ou un îlot contrôlé doit être validé.'}
  return base
}

export function createAngelCarePuckConfig(pickers:StudioPickerData):Config{
  const native=Object.fromEntries(ANGELCARE_STUDIO_BLOCK_CONTRACTS.filter(row=>!row.allowChildren).map(contract=>[contract.type,{label:contract.label,fields:fieldsFor(contract.type,pickers),defaultProps:defaults(contract.type),render:(props:StudioBlockProps)=>{
    const id=String(props.id||`puck-${contract.type}`)
    return <StudioDesignShell blockId={id} style={props.sourceDesign} responsive={props.responsive} importedRules={props.__studioImportedRules} hidden={props.hidden}><StudioBlockRuntime type={contract.type} props={props} pickers={pickers} editorMode/></StudioDesignShell>
  },resolvePermissions:async(data:any)=>({edit:true,drag:!data?.props?.locked,delete:!data?.props?.locked,duplicate:!data?.props?.locked,insert:true})}]))

  const visual=Object.fromEntries(ANGELCARE_STUDIO_VISUAL_EXPERIENCES.map(definition=>[definition.key,{label:definition.label,fields:fieldsFor(definition.canonicalType,pickers),defaultProps:{...defaults(definition.canonicalType),...studioVisualDefaultProps(definition),sourceDesign:{...DEFAULT_STUDIO_DESIGN}},render:(props:StudioBlockProps)=>{
    const id=String(props.id||`puck-${definition.key}`)
    return <StudioDesignShell blockId={id} style={props.sourceDesign} responsive={props.responsive} importedRules={props.__studioImportedRules} hidden={props.hidden}><StudioVisualCatalogueRuntime definition={definition} props={props} pickers={pickers} editorMode/></StudioDesignShell>
  },resolvePermissions:async(data:any)=>({edit:true,drag:!data?.props?.locked,delete:!data?.props?.locked,duplicate:!data?.props?.locked,insert:true})}]))

  const components={...native,...visual,...createStudioLayoutComponents()} as unknown as Config['components']
  const baseCategories=Object.fromEntries(groups.map(group=>[group,{title:labels[group],defaultExpanded:['content','commerce','layout'].includes(group),components:group==='layout'?[...STUDIO_LAYOUT_KEYS,...ANGELCARE_STUDIO_BLOCK_CONTRACTS.filter(row=>row.group===group&&!row.allowChildren).map(row=>row.type)]:ANGELCARE_STUDIO_BLOCK_CONTRACTS.filter(row=>row.group===group&&!row.allowChildren).map(row=>row.type)}]))
  const visualCategories=Object.fromEntries(ANGELCARE_STUDIO_VISUAL_CATEGORIES.map(category=>[`visual-${category.key}`,{title:`${String(category.order).padStart(2,'0')} · ${category.title}`,defaultExpanded:category.order<=2,components:[...category.componentKeys]}]))
  const categories={...visualCategories,...baseCategories} as unknown as Config['categories']
  Object.assign(components, createHomepageProMaxPuckComponents(pickers))
  ;(categories as any)[HOMEPAGE_PRO_MAX_CATEGORY_ID]={title:HOMEPAGE_PRO_MAX_CATEGORY_LABEL,defaultExpanded:true,components:[...HOMEPAGE_PRO_MAX_COMPONENT_KEYS]}
  return {components,categories}
}
