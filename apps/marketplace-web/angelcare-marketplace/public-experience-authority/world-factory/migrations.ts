import type {PublicExperienceWorldFactoryRecord,WorldFactorySemanticRole} from './types'
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
  compilerProfile:PUBLIC_EXPERIENCE_WORLD_FACTORY_COMPILER_PROFILE,
  semanticSlots,
  actionPlan,
  relationPlan:rows(value.relationPlan),
  capabilities:rows(value.capabilities),
  visualReferences,
  overrides:{roleOverrides:rec(overrides.roleOverrides),supplementalRoleOverrides:rec(overrides.supplementalRoleOverrides),bindingOverrides:rows(overrides.bindingOverrides),actionOverrides:rows(overrides.actionOverrides),note:typeof overrides.note==='string'?overrides.note:null},
  compatibility:{...compatibility,minimumRuntime:'pea-v1',maximumRuntime:null,forwardPolicy:'capability-negotiation',unknownFields:'preserve',nativeFallback:true,schemaVersion:2,compilerProfile:PUBLIC_EXPERIENCE_WORLD_FACTORY_COMPILER_PROFILE},
  revision:{worldKey:typeof revision.worldKey==='string'?revision.worldKey:null,revision:Math.max(1,Number(revision.revision||1)),supersedes:typeof revision.supersedes==='string'?revision.supersedes:null,immutableAfterCertification:true},
  provenance:{createdBy:'WORLD_FACTORY',manualOverrides:0,notes:['Migrated from World Factory v1.'],...rec(value.provenance)},
 }
}

export const WORLD_FACTORY_MIGRATIONS:readonly WorldFactoryMigration[]=[{from:1,to:2,id:'v1-to-v2-sovereign-contract',apply:v1ToV2}]
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
