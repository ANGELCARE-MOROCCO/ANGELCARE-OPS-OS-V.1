import type {Data} from '@puckeditor/core'
import {studioBlockContract} from '@/angelcare-marketplace/studio-universal/block-contracts'
import {worldFactoryStorefrontPack} from './storefront-capabilities'
import type {
  PublicExperienceWorldFactoryRecord,
  WorldFactoryActionPlan,
  WorldFactoryBindingPlan,
  WorldFactoryConditionRule,
  WorldFactoryDensityMode,
  WorldFactoryInteractionContract,
  WorldFactoryMediaContract,
  WorldFactoryOperabilityContract,
  WorldFactoryRelationPlan,
  WorldFactoryRepeaterContract,
  WorldFactorySemanticSlot,
} from './types'

const rec=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{ }
const str=(value:unknown)=>typeof value==='string'?value.trim():''
const unique=<T,>(values:T[])=>[...new Set(values)]
const content=(data:Data)=>Array.isArray(data.content)?data.content:[]

const roleInspectorSections=(slot:WorldFactorySemanticSlot):WorldFactoryOperabilityContract['blockCapabilities'][number]['inspectorSections']=>{
  const sections:Array<'content'|'data'|'media'|'actions'|'display'|'design'|'responsive'|'conditions'|'seo'|'accessibility'>=['content']
  const mediaRoles=new Set(['hero','media','storefront_hero','editorial','storefront_editorial','storefront_proof','storefront_use_cases','storefront_benefits'])
  const dataRoles=new Set(['pricing','availability','variants','specifications','reviews','trust','bundle','accessories','recommendations','related','service_plans','service_schedule','service_coverage','service_providers','academy_curriculum','academy_cohort','academy_trainers','academy_certification','academy_admission','b2b_fit','b2b_programme','b2b_deployment','b2b_proof','storefront_categories','storefront_inventory','storefront_collection','storefront_facets','storefront_campaigns','storefront_availability','storefront_process','storefront_pathways','storefront_sessions','storefront_segments','storefront_diagnostic','storefront_seasonal','storefront_use_cases','storefront_boundary','storefront_referral','storefront_benefits','storefront_impact','storefront_plans','storefront_capabilities','storefront_framework','storefront_assessment','storefront_qualifications','storefront_professional_availability','storefront_comparison','storefront_editorial','storefront_proof','storefront_trust','storefront_final_conversion'])
  if(dataRoles.has(slot.role)||slot.supplementalRoles.some(role=>dataRoles.has(role)))sections.push('data')
  if(mediaRoles.has(slot.role)||slot.supplementalRoles.some(role=>mediaRoles.has(role)))sections.push('media')
  if(['primary_conversion','secondary_conversion','storefront_final_conversion','storefront_diagnostic','storefront_referral'].includes(slot.role)||slot.supplementalRoles.some(role=>['primary_conversion','secondary_conversion','storefront_final_conversion','storefront_diagnostic','storefront_referral'].includes(role)))sections.push('actions')
  sections.push('display','design','responsive','conditions','accessibility')
  if(['hero','identity','editorial','faq','navigation','footer','storefront_hero','storefront_editorial','storefront_proof'].includes(slot.role))sections.push('seo')
  return unique(sections)
}

const defaultDensity=(storefrontKeys:string[]):WorldFactoryDensityMode|null=>{
  const key=storefrontKeys[0]||''
  if(['home-services','kits'].includes(key))return'festival'
  if(['establishments','hospitality','health-partners','corporates'].includes(key))return'commerce'
  if(['partner-os','quality-check'].includes(key))return'premium'
  if(key)return'hyper_commerce'
  return null
}

const interactionKind=(type:string,role:string):WorldFactoryInteractionContract['kind']|null=>{
  if(type==='studio_accordion'||role==='faq')return'accordion'
  if(type==='studio_tabs')return'tabs'
  if(type==='studio_dialog')return'dialog'
  if(type==='studio_carousel'||type==='media_gallery')return'carousel'
  if(type==='studio_menu'||role==='navigation')return'menu'
  if(role==='primary_conversion'||role==='storefront_final_conversion')return'sticky_conversion'
  if(role==='storefront_facets'||role==='storefront_comparison')return'tabs'
  if(role==='storefront_process'||role==='storefront_pathways'||role==='storefront_sessions'||role==='storefront_framework')return'accordion'
  if(role==='variants')return'variant_selector'
  if(role==='service_schedule'||role==='academy_cohort')return'schedule_selector'
  return null
}

const isMediaRole=(role:string)=>['hero','media','storefront_hero','editorial','storefront_editorial','storefront_proof','storefront_use_cases','storefront_benefits'].includes(role)
const isRepeaterRole=(role:string)=>['variants','specifications','reviews','trust','faq','bundle','accessories','recommendations','related','service_plans','service_schedule','service_coverage','service_providers','academy_curriculum','academy_cohort','academy_trainers','academy_certification','academy_admission','b2b_fit','b2b_programme','b2b_deployment','b2b_proof','storefront_categories','storefront_inventory','storefront_collection','storefront_facets','storefront_campaigns','storefront_availability','storefront_process','storefront_pathways','storefront_sessions','storefront_segments','storefront_diagnostic','storefront_seasonal','storefront_use_cases','storefront_boundary','storefront_referral','storefront_benefits','storefront_impact','storefront_plans','storefront_capabilities','storefront_framework','storefront_assessment','storefront_qualifications','storefront_professional_availability','storefront_comparison','storefront_editorial','storefront_proof','storefront_trust'].includes(role)

export function buildWorldFactoryOperability(input:{
  data:Data
  slots:WorldFactorySemanticSlot[]
  bindingPlan:WorldFactoryBindingPlan[]
  actionPlan:WorldFactoryActionPlan[]
  relationPlan:WorldFactoryRelationPlan[]
  storefrontKeys:string[]
  requested?:Partial<WorldFactoryOperabilityContract>
}):WorldFactoryOperabilityContract{
  const requested=input.requested||{}
  const storefrontPack=worldFactoryStorefrontPack(input.storefrontKeys.length===1?input.storefrontKeys[0]:null)
  const bindingsByBlock=new Map<string,WorldFactoryBindingPlan[]>()
  for(const row of input.bindingPlan){const list=bindingsByBlock.get(row.blockId)||[];list.push(row);bindingsByBlock.set(row.blockId,list)}
  const actionsByBlock=new Map<string,WorldFactoryActionPlan[]>()
  for(const row of input.actionPlan){const list=actionsByBlock.get(row.blockId)||[];list.push(row);actionsByBlock.set(row.blockId,list)}
  const relationByBlock=new Map(input.relationPlan.map(row=>[row.blockId,row]))
  const requestedCaps=new Map((requested.blockCapabilities||[]).map(row=>[row.blockId,row]))

  const blockCapabilities=input.slots.map(slot=>{
    const block=studioBlockContract(slot.blockType)
    const bindings=bindingsByBlock.get(slot.blockId)||[]
    const actions=actionsByBlock.get(slot.blockId)||[]
    const relation=relationByBlock.get(slot.blockId)
    const media=isMediaRole(slot.role)||slot.supplementalRoles.some(isMediaRole)||Boolean(block?.requiresMedia)
    const repeaters=isRepeaterRole(slot.role)||slot.supplementalRoles.some(isRepeaterRole)||bindings.some(row=>row.targetKey==='items')||Boolean(relation)
    const inferred={
      blockId:slot.blockId,blockType:slot.blockType,role:slot.role,
      acceptsBindings:bindings.length>0,
      acceptsDynamicSource:Boolean(relation)||['product_grid','collection_rail','service_grid'].includes(slot.blockType),
      acceptsMedia:media,
      acceptsActions:actions.length>0||['hero','split_hero','studio_button','cta_band','contact'].includes(slot.blockType),
      acceptsChildren:Boolean(block?.allowChildren),
      acceptsRepeaters:repeaters,
      acceptsConditions:true,
      acceptsDesign:Boolean(block?.fields.includes('sourceDesign')??true),
      acceptsResponsive:true,
      editableFields:[...(block?.fields||[])],
      allowedSourceIds:slot.role.startsWith('storefront_')?[...(storefrontPack?.supportedSourceIds||[])]:relation?.sourceId?[relation.sourceId]:[],
      merchandisingModes:((slot.role.startsWith('storefront_')||Boolean(relation))?['automatic','curated','manual','hybrid']:['automatic']) as WorldFactoryOperabilityContract['blockCapabilities'][number]['merchandisingModes'],
      inspectorSections:roleInspectorSections(slot),
    }
    const override=requestedCaps.get(slot.blockId)
    return override?{...inferred,...override,blockId:slot.blockId,blockType:slot.blockType,role:slot.role}:inferred
  })

  const inferredConditions:WorldFactoryConditionRule[]=[]
  for(const slot of input.slots){
    const bindings=(bindingsByBlock.get(slot.blockId)||[]).filter(row=>row.status==='RESOLVED')
    if(!slot.required&&!['atomic_offer_section','atomic_offer_group'].includes(slot.blockType)){
      const itemBinding=bindings.find(row=>row.targetKey==='items')
      if(itemBinding)inferredConditions.push({id:`${slot.blockId}:auto-hide-empty`,blockId:slot.blockId,source:'prop',key:'items',operator:'not_empty',effect:'show',reason:`Optional semantic module ${slot.role} hides when its canonical collection is empty.`})
    }
  }
  const conditions=[...inferredConditions,...(requested.conditions||[])].filter((row,index,rows)=>rows.findIndex(other=>other.id===row.id)===index)

  const repeaters:WorldFactoryRepeaterContract[]=[]
  for(const slot of input.slots){
    const relation=relationByBlock.get(slot.blockId)
    if(relation){repeaters.push({blockId:slot.blockId,targetKey:'items',source:'dynamic_source',bindingKey:null,sourceId:relation.sourceId,strategy:relation.strategy,limit:relation.limit,sort:'recommended',emptyPolicy:relation.emptyPolicy,itemVariant:null});continue}
    const itemBinding=(bindingsByBlock.get(slot.blockId)||[]).find(row=>row.status==='RESOLVED'&&row.targetKey==='items')
    if(itemBinding)repeaters.push({blockId:slot.blockId,targetKey:'items',source:'binding',bindingKey:itemBinding.bindingKey,sourceId:null,strategy:null,limit:24,sort:'canonical',emptyPolicy:itemBinding.missingPolicy,itemVariant:null})
  }
  for(const row of requested.repeaters||[]){const idx=repeaters.findIndex(item=>item.blockId===row.blockId&&item.targetKey===row.targetKey);if(idx>=0)repeaters[idx]={...repeaters[idx],...row};else repeaters.push(row)}

  const media:WorldFactoryMediaContract[]=[]
  for(const slot of input.slots){
    const rows=bindingsByBlock.get(slot.blockId)||[]
    for(const row of rows.filter(item=>item.status==='RESOLVED'&&(item.bindingKey==='media.primary'||item.bindingKey==='media.gallery'))){
      media.push({blockId:slot.blockId,targetKey:row.targetKey,kind:row.bindingKey==='media.gallery'?'gallery':'primary',source:'binding',bindingKey:row.bindingKey,assetRole:null,required:row.required,presentation:{fit:'cover',position:'50% 50%',aspectRatio:null,overlay:null,focalPoint:null},responsive:{desktop:null,tablet:null,mobile:null}})
    }
  }
  for(const row of requested.media||[]){const idx=media.findIndex(item=>item.blockId===row.blockId&&item.targetKey===row.targetKey);if(idx>=0)media[idx]={...media[idx],...row};else media.push(row)}

  const interactions:WorldFactoryInteractionContract[]=[]
  for(const slot of input.slots){const kind=interactionKind(slot.blockType,slot.role);if(kind)interactions.push({blockId:slot.blockId,kind,status:'SUPPORTED',configuration:{}})}
  for(const row of requested.interactions||[]){const idx=interactions.findIndex(item=>item.blockId===row.blockId&&item.kind===row.kind);if(idx>=0)interactions[idx]={...interactions[idx],...row};else interactions.push(row)}

  const defaults:WorldFactoryOperabilityContract={
    version:1,
    density:defaultDensity(input.storefrontKeys),
    blockCapabilities,
    conditions,
    repeaters,
    media,
    interactions,
    localization:{defaultLocale:'fr',locales:['fr','en','ar'],rtlLocales:['ar'],themeStrings:'localized-map',fallback:'default-locale',missingTranslation:'warn'},
    tokens:{colors:{},typography:{},spacing:{},radii:{},shadows:{},layout:{},motion:{}},
    assets:[],
    performance:{maxRootBlocks:40,maxTotalBlocks:160,maxDynamicSources:24,maxAboveFoldMedia:6,maxMediaAssets:80,maxDocumentBytes:1_500_000,maxInteractions:40},
    shell:{mode:'marketplace_global',allowGlobalHeaderOverride:false,allowGlobalFooterOverride:false,allowGlobalNavigationOverride:false},
    editing:{uiLed:true,rawJsonRequired:false,allowBlockMove:true,allowBlockDuplicate:true,allowBlockHide:true,allowBindingChange:true,allowActionChange:true,allowMediaReplace:true,allowDesignChange:true,allowResponsiveChange:true,allowConditionChange:true,immutableBusinessTruth:true},
    inspector:{generatedFromCapabilities:true,hideUnsupportedFields:true,showAuthorityOwnership:true,showInheritance:true},
  }
  return{
    ...defaults,
    ...requested,
    version:1,
    density:requested.density??defaults.density,
    blockCapabilities,
    conditions,
    repeaters,
    media,
    interactions,
    localization:{...defaults.localization,...requested.localization},
    tokens:{...defaults.tokens,...requested.tokens,colors:{...defaults.tokens.colors,...requested.tokens?.colors},typography:{...defaults.tokens.typography,...requested.tokens?.typography},spacing:{...defaults.tokens.spacing,...requested.tokens?.spacing},radii:{...defaults.tokens.radii,...requested.tokens?.radii},shadows:{...defaults.tokens.shadows,...requested.tokens?.shadows},layout:{...defaults.tokens.layout,...requested.tokens?.layout},motion:{...defaults.tokens.motion,...requested.tokens?.motion}},
    assets:[...(requested.assets||[])],
    performance:{...defaults.performance,...requested.performance},
    shell:{...defaults.shell,...requested.shell},
    editing:{...defaults.editing,...requested.editing},
    inspector:{...defaults.inspector,...requested.inspector},
  }
}

export function validateWorldFactoryOperability(record:Pick<PublicExperienceWorldFactoryRecord,'operability'|'semanticSlots'>,data?:Data){
  const blockers:string[]=[],warnings:string[]=[]
  const op=record.operability
  if(!op||op.version!==1){blockers.push('Theme operability contract v1 absent.');return{compatible:false,blockers,warnings}}
  const ids=new Set(record.semanticSlots.map(row=>row.blockId))
  const capabilityIds=new Set(op.blockCapabilities.map(row=>row.blockId))
  for(const id of ids)if(!capabilityIds.has(id))blockers.push(`Capability contract missing for block ${id}.`)
  for(const row of op.conditions)if(!ids.has(row.blockId))warnings.push(`Condition ${row.id} targets unknown block ${row.blockId}.`)
  for(const row of op.repeaters)if(!ids.has(row.blockId))warnings.push(`Repeater targets unknown block ${row.blockId}.`)
  for(const row of op.media)if(!ids.has(row.blockId))warnings.push(`Media contract targets unknown block ${row.blockId}.`)
  if(op.localization.locales.join(',')!=='fr,en,ar')warnings.push('FR/EN/AR localization order differs from canonical contract.')
  if(!op.localization.rtlLocales.includes('ar'))blockers.push('Arabic RTL contract missing.')
  if(op.shell.allowGlobalHeaderOverride||op.shell.allowGlobalFooterOverride||op.shell.allowGlobalNavigationOverride)warnings.push('World requests promoted/global shell overrides; explicit governance review required.')
  if(op.editing.rawJsonRequired)blockers.push('Normal theme operation may not require raw JSON editing.')
  if(!op.editing.immutableBusinessTruth)blockers.push('Theme operation cannot own canonical business truth.')
  if(data){
    const rootCount=content(data).length
    const bytes=new TextEncoder().encode(JSON.stringify(data)).length
    if(rootCount>op.performance.maxRootBlocks)blockers.push(`Root block budget exceeded: ${rootCount}/${op.performance.maxRootBlocks}.`)
    if(bytes>op.performance.maxDocumentBytes)blockers.push(`Document budget exceeded: ${bytes}/${op.performance.maxDocumentBytes} bytes.`)
  }
  return{compatible:blockers.length===0,blockers,warnings}
}

export function worldFactoryOperabilitySummary(contract:WorldFactoryOperabilityContract){return{
  density:contract.density,
  blocks:contract.blockCapabilities.length,
  conditions:contract.conditions.length,
  repeaters:contract.repeaters.length,
  media:contract.media.length,
  interactions:contract.interactions.length,
  assets:contract.assets.length,
  locales:contract.localization.locales,
  rtl:contract.localization.rtlLocales,
  uiLed:contract.editing.uiLed,
  immutableBusinessTruth:contract.editing.immutableBusinessTruth,
}}

export function materializedOperabilityForBlock(contract:WorldFactoryOperabilityContract,blockId:string){
  return{
    capability:contract.blockCapabilities.find(row=>row.blockId===blockId)||null,
    conditions:contract.conditions.filter(row=>row.blockId===blockId),
    repeaters:contract.repeaters.filter(row=>row.blockId===blockId),
    media:contract.media.filter(row=>row.blockId===blockId),
    interactions:contract.interactions.filter(row=>row.blockId===blockId),
  }
}

export function extractRequestedWorldOperability(value:unknown):Partial<WorldFactoryOperabilityContract>|undefined{
  const row=rec(value)
  if(Number(row.version)!==1)return undefined
  return row as unknown as Partial<WorldFactoryOperabilityContract>
}

export function worldFactoryPackageAssets(value:unknown){
  const row=rec(value),assets=Array.isArray(row.assets)?row.assets:[]
  return assets.filter(item=>item&&typeof item==='object'&&!Array.isArray(item)).map(item=>{
    const a=rec(item)
    return{key:str(a.key),path:str(a.path),kind:(str(a.kind)||'other') as WorldFactoryOperabilityContract['assets'][number]['kind'],sha256:str(a.sha256)||null,required:a.required===true,mimeType:str(a.mimeType)||null,license:str(a.license)||null,provenance:str(a.provenance)||null}
  }).filter(item=>item.key&&item.path)
}
