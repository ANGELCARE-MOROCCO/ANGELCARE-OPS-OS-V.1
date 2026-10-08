import type {PublicExperienceWorldFactoryRecord,WorldFactoryOperabilityContract,WorldFactorySemanticRole} from './types'
import {PUBLIC_EXPERIENCE_WORLD_FACTORY_COMPILER_PROFILE,PUBLIC_EXPERIENCE_WORLD_FACTORY_SCHEMA_VERSION} from './types'

export interface WorldFactoryMigration{from:number;to:number;id:string;apply:(value:Record<string,unknown>)=>Record<string,unknown>}
const rec=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{ }
const rows=(value:unknown)=>Array.isArray(value)?value:[]

function v1ToV2(value:Record<string,unknown>):Record<string,unknown>{
 const semanticSlots=rows(value.semanticSlots).map(raw=>{const row=rec(raw);return{...row,path:typeof row.path==='string'?row.path:'root',supplementalRoles:Array.isArray(row.supplementalRoles)?row.supplementalRoles:[] as WorldFactorySemanticRole[]}})
 const actionPlan=rows(value.actionPlan).map(raw=>{const row=rec(raw),actionId=typeof row.actionId==='string'?row.actionId:'';const currentItem=['basket.add','booking.start','quotation.start','academy.enroll','catalog.open_item'].includes(actionId);return{...row,targetMode:row.targetMode|| (currentItem?'current_item':'none'),targetSourceId:row.targetSourceId??(currentItem?'catalog.items':null)}})
 const visualReferences=rows(value.visualReferences).map(raw=>{const row=rec(raw);return{...row,comparison:row.comparison||{status:row.reviewed?'APPROVED':'PENDING',score:row.reviewed?100:null,structuralScore:row.reviewed?100:null,responsiveScore:row.reviewed?100:null,note:'Migrated from World Factory v1 visual review.',reviewedAt:null}}})
 const overrides=rec(value.overrides)
 const compatibility=rec(value.compatibility)
 const revision=rec(value.revision)
 return{
  ...value,
  engineVersion:2,
  schemaVersion:2,
  compilerProfile:'pea-world-factory-2026.09-sovereign-v2',
  semanticSlots,
  actionPlan,
  relationPlan:rows(value.relationPlan),
  capabilities:rows(value.capabilities),
  visualReferences,
  overrides:{roleOverrides:rec(overrides.roleOverrides),supplementalRoleOverrides:rec(overrides.supplementalRoleOverrides),bindingOverrides:rows(overrides.bindingOverrides),actionOverrides:rows(overrides.actionOverrides),note:typeof overrides.note==='string'?overrides.note:null},
  compatibility:{...compatibility,minimumRuntime:'pea-v1',maximumRuntime:null,forwardPolicy:'capability-negotiation',unknownFields:'preserve',nativeFallback:true,schemaVersion:2,compilerProfile:'pea-world-factory-2026.09-sovereign-v2'},
  revision:{worldKey:typeof revision.worldKey==='string'?revision.worldKey:null,revision:Math.max(1,Number(revision.revision||1)),supersedes:typeof revision.supersedes==='string'?revision.supersedes:null,immutableAfterCertification:true},
  provenance:{createdBy:'WORLD_FACTORY',manualOverrides:0,notes:['Migrated from World Factory v1.'],...rec(value.provenance)},
 }
}

const densityFor=(keys:unknown):WorldFactoryOperabilityContract['density']=>{const key=rows(keys).find(item=>typeof item==='string') as string|undefined;if(['home-services','kits'].includes(key||''))return'festival';if(['establishments','hospitality','health-partners','corporates'].includes(key||''))return'commerce';if(['partner-os','quality-check'].includes(key||''))return'premium';return key?'hyper_commerce':null}
function v2ToV3(value:Record<string,unknown>):Record<string,unknown>{
 const slots=rows(value.semanticSlots).map(rec)
 const bindings=rows(value.bindingPlan).map(rec)
 const actions=rows(value.actionPlan).map(rec)
 const relations=rows(value.relationPlan).map(rec)
 const blockCapabilities=slots.map(slot=>{const blockId=String(slot.blockId||''),blockType=String(slot.blockType||''),role=String(slot.role||'unknown') as WorldFactorySemanticRole;const hasBindings=bindings.some(row=>row.blockId===blockId),hasActions=actions.some(row=>row.blockId===blockId),hasRepeater=bindings.some(row=>row.blockId===blockId&&row.targetKey==='items')||relations.some(row=>row.blockId===blockId),hasMedia=['hero','media','storefront_hero','editorial','storefront_editorial','storefront_proof','storefront_use_cases','storefront_benefits'].includes(role);return{blockId,blockType,role,acceptsBindings:hasBindings,acceptsDynamicSource:hasRepeater||['product_grid','collection_rail','service_grid'].includes(blockType),acceptsMedia:hasMedia,acceptsActions:hasActions,acceptsChildren:['ac_section','ac_container','ac_columns','ac_grid','ac_stack'].includes(blockType),acceptsRepeaters:hasRepeater,acceptsConditions:true,acceptsDesign:true,acceptsResponsive:true,editableFields:[],allowedSourceIds:[],merchandisingModes:['automatic'],inspectorSections:['content','display','design','responsive','conditions','accessibility']}})
 const repeaters=bindings.filter(row=>row.status==='RESOLVED'&&row.targetKey==='items').map(row=>({blockId:String(row.blockId||''),targetKey:'items',source:'binding',bindingKey:String(row.bindingKey||''),sourceId:null,strategy:null,limit:24,sort:'canonical',emptyPolicy:String(row.missingPolicy||'preserve_static'),itemVariant:null}))
 const op:WorldFactoryOperabilityContract={version:1,density:densityFor(value.storefrontKeys),blockCapabilities:blockCapabilities as WorldFactoryOperabilityContract['blockCapabilities'],conditions:[],repeaters:repeaters as WorldFactoryOperabilityContract['repeaters'],media:[],interactions:[],localization:{defaultLocale:'fr',locales:['fr','en','ar'],rtlLocales:['ar'],themeStrings:'localized-map',fallback:'default-locale',missingTranslation:'warn'},tokens:{colors:{},typography:{},spacing:{},radii:{},shadows:{},layout:{},motion:{}},assets:[],performance:{maxRootBlocks:40,maxTotalBlocks:160,maxDynamicSources:24,maxAboveFoldMedia:6,maxMediaAssets:80,maxDocumentBytes:1500000,maxInteractions:40},shell:{mode:'marketplace_global',allowGlobalHeaderOverride:false,allowGlobalFooterOverride:false,allowGlobalNavigationOverride:false},editing:{uiLed:true,rawJsonRequired:false,allowBlockMove:true,allowBlockDuplicate:true,allowBlockHide:true,allowBindingChange:true,allowActionChange:true,allowMediaReplace:true,allowDesignChange:true,allowResponsiveChange:true,allowConditionChange:true,immutableBusinessTruth:true},inspector:{generatedFromCapabilities:true,hideUnsupportedFields:true,showAuthorityOwnership:true,showInheritance:true}}
 const compatibility=rec(value.compatibility)
 const provenance=rec(value.provenance)
 return{...value,engineVersion:3,schemaVersion:3,compilerProfile:PUBLIC_EXPERIENCE_WORLD_FACTORY_COMPILER_PROFILE,operability:op,compatibility:{...compatibility,schemaVersion:3,compilerProfile:PUBLIC_EXPERIENCE_WORLD_FACTORY_COMPILER_PROFILE},provenance:{...provenance,notes:[...rows(provenance.notes).filter(item=>typeof item==='string'),'Migrated from World Factory v2 to 2030 operability v3.']}}
}

export const WORLD_FACTORY_MIGRATIONS:readonly WorldFactoryMigration[]=[
 {from:1,to:2,id:'v1-to-v2-sovereign-contract',apply:v1ToV2},
 {from:2,to:3,id:'v2-to-v3-2030-operability',apply:v2ToV3},
]
export function migrateWorldFactoryRecord(value:unknown):PublicExperienceWorldFactoryRecord|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null
 let row={...(value as Record<string,unknown>)},version=Number(row.schemaVersion||0)
 if(version===PUBLIC_EXPERIENCE_WORLD_FACTORY_SCHEMA_VERSION)return row as unknown as PublicExperienceWorldFactoryRecord
 const visited=new Set<number>()
 while(version!==PUBLIC_EXPERIENCE_WORLD_FACTORY_SCHEMA_VERSION&&!visited.has(version)){
  visited.add(version);const migration=WORLD_FACTORY_MIGRATIONS.find(item=>item.from===version);if(!migration)return null;row=migration.apply(row);version=migration.to
 }
 return version===PUBLIC_EXPERIENCE_WORLD_FACTORY_SCHEMA_VERSION?row as unknown as PublicExperienceWorldFactoryRecord:null
}
