'use client'

import type { Config } from '@puckeditor/core'
import { ANGELCARE_STUDIO_BLOCK_CONTRACTS } from './block-contracts'
import { createStudioDesignFields, DEFAULT_STUDIO_DESIGN, responsiveField } from './design'
import type { StudioBlockProps, StudioPickerData } from './types'
import { createStudioLayoutComponents, STUDIO_LAYOUT_KEYS } from './components/StudioLayouts'
import { StudioBlockRuntime } from './components/StudioBlockRuntime'
import { StudioDesignShell } from './components/StudioDesignShell'
import { MediaField, RecordField } from './components/StudioFields'

const groups = ['content','media','commerce','discovery','trust','conversion','interactive','layout','extension'] as const
const labels: Record<string,string> = {content:'Contenu',media:'Média',commerce:'Commerce',discovery:'Découverte',trust:'Confiance',conversion:'Conversion',interactive:'Interactif',layout:'Mise en page',extension:'Extensions contrôlées'}
const yesNo=(label:string)=>({type:'radio' as const,label,options:[{label:'Oui',value:true},{label:'Non',value:false}]})
const itemArray={type:'array' as const,label:'Éléments',arrayFields:{title:{type:'text' as const,label:'Titre'},label:{type:'text' as const,label:'Libellé'},body:{type:'textarea' as const,label:'Texte'},description:{type:'textarea' as const,label:'Description'},href:{type:'text' as const,label:'Lien'},mediaUrl:{type:'text' as const,label:'URL média'},value:{type:'text' as const,label:'Valeur'}},defaultItemProps:(index:number)=>({title:`Élément ${index+1}`,body:'',href:''}),getItemSummary:(item:Record<string,unknown>,index:number)=>String(item.title||item.label||`Élément ${index+1}`),max:48}

function fieldsFor(type:string,pickers:StudioPickerData){
  const contract=ANGELCARE_STUDIO_BLOCK_CONTRACTS.find(row=>row.type===type)
  const fields:Record<string,unknown>={}
  const has=(key:string)=>contract?.fields.includes(key)
  if(has('eyebrow'))fields.eyebrow={type:'text',label:'Eyebrow'}
  if(has('title'))fields.title={type:'text',label:'Titre'}
  if(has('lead'))fields.lead={type:'textarea',label:'Sous-titre / lead'}
  if(has('body'))fields.body={type:'textarea',label:'Corps'}
  if(has('primaryCtaLabel'))fields.primaryCtaLabel={type:'text',label:'CTA principal'}
  if(has('primaryCtaHref'))fields.primaryCtaHref={type:'text',label:'Destination CTA'}
  if(has('secondaryCtaLabel'))fields.secondaryCtaLabel={type:'text',label:'CTA secondaire'}
  if(has('secondaryCtaHref'))fields.secondaryCtaHref={type:'text',label:'Destination secondaire'}
  if(has('mediaAssetKey'))fields.mediaAssetKey={type:'custom',label:'Media Vault',render:({value,onChange}:any)=><MediaField pickers={pickers} value={typeof value==='string'?value:''} onChange={onChange}/>}
  if(has('mediaUrl'))fields.mediaUrl={type:'text',label:'URL média externe · optionnel'}
  if(has('mediaAlt'))fields.mediaAlt={type:'text',label:'Texte alternatif'}
  if(has('collectionKey'))fields.collectionKey={type:'custom',label:'Collection réelle',render:({value,onChange}:any)=><RecordField label="Collection" rows={pickers.collections} value={typeof value==='string'?value:''} onChange={onChange}/>}
  if(has('categoryKey'))fields.categoryKey={type:'custom',label:'Catégorie réelle',render:({value,onChange}:any)=><RecordField label="Catégorie" rows={pickers.categories} value={typeof value==='string'?value:''} onChange={onChange}/>}
  if(has('items'))fields.items=itemArray
  if(has('height'))fields.height={type:'number',label:'Hauteur',min:0,max:300}
  if(has('sourceDesign'))fields.sourceDesign={type:'object',label:'Design',objectFields:createStudioDesignFields()}
  fields.responsive=responsiveField
  fields.hidden=yesNo('Masqué')
  fields.locked=yesNo('Verrouillé')
  return fields
}

function defaults(type:string):StudioBlockProps{
  const base:StudioBlockProps={id:'',title:'',lead:'',body:'',items:[],sourceDesign:{...DEFAULT_STUDIO_DESIGN},responsive:{mobileVisible:true,tabletVisible:true,desktopVisible:true},hidden:false,locked:false}
  if(type==='hero'){base.eyebrow='ANGELCARE';base.title='Une expérience qui mérite d’être racontée.';base.lead='Composez cette page avec les données et médias réels de votre Marketplace.';base.primaryCtaLabel='Découvrir';base.primaryCtaHref='#'}
  if(type==='studio_text'){base.title='Nouveau contenu';base.body='Écrivez votre contenu ici.'}
  if(type==='studio_button'){base.primaryCtaLabel='Action';base.primaryCtaHref='#'}
  if(type==='studio_spacer'){base.height=40}
  if(type==='studio_island'){base.title='Capacité externe à examiner';base.body='Aucun code étranger n’est exécuté. Une reconstruction native ou un îlot contrôlé doit être validé.'}
  return base
}

export function createAngelCarePuckConfig(pickers:StudioPickerData):Config{
  const native=Object.fromEntries(ANGELCARE_STUDIO_BLOCK_CONTRACTS.filter(row=>!row.allowChildren).map(contract=>[contract.type,{label:contract.label,fields:fieldsFor(contract.type,pickers),defaultProps:defaults(contract.type),render:(props:StudioBlockProps)=>{
    const id=String(props.id||`puck-${contract.type}`)
    return <StudioDesignShell blockId={id} style={props.sourceDesign} responsive={props.responsive} importedRules={props.__studioImportedRules} hidden={props.hidden}><StudioBlockRuntime type={contract.type} props={props} pickers={pickers}/></StudioDesignShell>
  },resolvePermissions:async(data:any)=>({edit:true,drag:!data?.props?.locked,delete:!data?.props?.locked,duplicate:!data?.props?.locked,insert:true})}]))
  const components={...native,...createStudioLayoutComponents()} as unknown as Config['components']
  const categories=Object.fromEntries(groups.map(group=>[group,{title:labels[group],defaultExpanded:['content','commerce','layout'].includes(group),components:group==='layout'?[...STUDIO_LAYOUT_KEYS,...ANGELCARE_STUDIO_BLOCK_CONTRACTS.filter(row=>row.group===group&&!row.allowChildren).map(row=>row.type)]:ANGELCARE_STUDIO_BLOCK_CONTRACTS.filter(row=>row.group===group&&!row.allowChildren).map(row=>row.type)}])) as unknown as Config['categories']
  return {components,categories}
}
