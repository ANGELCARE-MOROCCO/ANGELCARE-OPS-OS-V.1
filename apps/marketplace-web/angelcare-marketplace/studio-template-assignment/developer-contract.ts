import { createHash } from 'node:crypto'
import { STUDIO_TEMPLATE_PRECEDENCE } from './types'

const scopes=[
  {scope:'exact_item',rank:1,authority:'angelcare_marketplace_catalog_items.experience_config',targetSource:'catalog.items'},
  {scope:'placement',rank:2,authority:'angelcare_marketplace_configurations',targetSource:'homepage placements'},
  {scope:'collection',rank:3,authority:'angelcare_marketplace_homepage_collections.settings',targetSource:'homepage.collections'},
  {scope:'experience_schema',rank:4,authority:'angelcare_marketplace_experience_schemas.configuration',targetSource:'experience.schemas'},
  {scope:'category',rank:5,authority:'angelcare_marketplace_catalog_categories.experience_config',targetSource:'catalog.categories'},
  {scope:'family',rank:6,authority:'angelcare_marketplace_configurations',targetSource:'controlled family list'},
  {scope:'marketplace_default',rank:7,authority:'angelcare_marketplace_configurations',targetSource:'marketplace'},
] as const
const core={schemaVersion:'2026-09-19.P04',phase:'P04',precedence:[...STUDIO_TEMPLATE_PRECEDENCE],scopeCount:scopes.length,scopes,invariants:{deterministicPrecedence:true,existingAuthoritiesOnly:true,templateAuthority:'Experience Core / angelcare_marketplace_cms_templates',publishedTemplateRequired:true,unpublishedTemplateSkipped:true,missingTemplateSkipped:true,nativeFallbackPreserved:true,p02PickerReused:true,rawIdPrimaryUx:false,newAssignmentTable:false,newAdminWorkspace:false,sqlRequired:false,p05LiveBinding:false,p08TemplateRendering:false}}
const json=JSON.stringify(core,null,2)
export const STUDIO_TEMPLATE_ASSIGNMENT_DEVELOPER_CONTRACT={...core,hash:createHash('sha256').update(json).digest('hex')}
export function studioTemplateAssignmentDeveloperContractJson(){return STUDIO_TEMPLATE_ASSIGNMENT_DEVELOPER_CONTRACT}
export function studioTemplateAssignmentDeveloperContractTxt(){const c=STUDIO_TEMPLATE_ASSIGNMENT_DEVELOPER_CONTRACT;return ['ANGELCARE MARKETPLACE STUDIO — TEMPLATE ASSIGNMENT & INHERITANCE',`Schema: ${c.schemaVersion}`,`Scopes: ${c.scopeCount}`,`SHA256: ${c.hash}`,'','PRECEDENCE',...c.scopes.map(row=>`${row.rank}. ${row.scope} · ${row.authority} · target=${row.targetSource}`),'','INVARIANTS',...Object.entries(c.invariants).map(([k,v])=>`${k}=${String(v)}`)].join('\n')+'\n'}
const csv=(v:unknown)=>`"${String(v??'').replaceAll('"','""')}"`
export function studioTemplateAssignmentDeveloperContractCsv(){const rows=[['rank','scope','authority','target_source'],...STUDIO_TEMPLATE_ASSIGNMENT_DEVELOPER_CONTRACT.scopes.map(row=>[String(row.rank),row.scope,row.authority,row.targetSource])];return rows.map(row=>row.map(csv).join(',')).join('\n')+'\n'}
