import { createHash } from 'node:crypto'
import { STUDIO_CONTRACT_COMPATIBILITY_LEVELS,STUDIO_CONTRACT_SATURATION_VERSION } from './types'
import { STUDIO_CONTRACT_CROSS_LINKS,STUDIO_CONTRACT_IMMUTABLE_INVARIANTS,STUDIO_CONTRACT_SCOPES,STUDIO_CONTRACT_STABLE_ID_CLASSES } from './registry'

const stableIdentifierCount=STUDIO_CONTRACT_SCOPES.reduce((sum,row)=>sum+row.stableIds,0)
const phaseCount=new Set(STUDIO_CONTRACT_SCOPES.map(row=>row.phase).filter(phase=>phase.startsWith('P'))).size+1 // P00-P12 + P13
const core={
 schemaVersion:'2026-09-20.P13',phase:'P13',name:'Developer Contract Saturation',version:STUDIO_CONTRACT_SATURATION_VERSION,
 phaseCount,scopeCount:STUDIO_CONTRACT_SCOPES.length,stableIdentifierCount,crossLinkCount:STUDIO_CONTRACT_CROSS_LINKS.length,
 compatibilityLevels:[...STUDIO_CONTRACT_COMPATIBILITY_LEVELS],
 scopes:STUDIO_CONTRACT_SCOPES,
 crossLinks:STUDIO_CONTRACT_CROSS_LINKS,
 stableIdClasses:STUDIO_CONTRACT_STABLE_ID_CLASSES,
 immutableInvariants:STUDIO_CONTRACT_IMMUTABLE_INVARIANTS,
 compatibilityPolicy:{
  additiveFields:'PATCH_SAFE',newRegisteredIds:'PATCH_SAFE',semanticChangeToStableId:'MIGRATION_REQUIRED',renameOrRemoveStableId:'BREAKING_FORBIDDEN',silentAuthorityReplacement:'BREAKING_FORBIDDEN',shadowBusinessAuthority:'BREAKING_FORBIDDEN',
  requirements:['Bump owning scope schemaVersion for semantic changes','Publish deterministic migration for MIGRATION_REQUIRED changes','Never silently rename/remove BREAKING_FORBIDDEN identifiers','Preserve exact legacy reference resolution until migration is complete','Update P13 cross-links and contract hash on every governed architecture change'],
 },
 completeness:{p00CensusRequired:true,p01ThroughP12Fingerprinted:true,allScopesHaveSchema:true,allScopesHaveHash:true,allRequiredCrossLinksDeclared:true,machineReadable:true,humanReadable:true,csvReadable:true},
 invariants:{singleMasterContract:true,existingAuthoritiesOnly:true,noRuntimeMutation:true,noBusinessStore:true,noNewAdminWorkspace:true,noSql:true,noMigration:true,localBuild:false,globalTypescript:false,p00ToP12Closed:true,finalCertificationStillRequired:true},
} as const
const raw=()=>JSON.stringify(core)
export const STUDIO_CONTRACT_SATURATION_DEVELOPER_CONTRACT={...core,hash:createHash('sha256').update(raw()).digest('hex')} as const
export function studioContractSaturationDeveloperContractJson(){return STUDIO_CONTRACT_SATURATION_DEVELOPER_CONTRACT}
export function studioContractSaturationDeveloperContractTxt(){const c=STUDIO_CONTRACT_SATURATION_DEVELOPER_CONTRACT;return[
 'ANGELCARE MARKETPLACE STUDIO — P13 DEVELOPER CONTRACT SATURATION',
 `Schema: ${c.schemaVersion}`,`Phases governed: ${c.phaseCount}`,`Contract scopes: ${c.scopeCount}`,`Stable identifiers: ${c.stableIdentifierCount}`,`Cross-links: ${c.crossLinkCount}`,`Master SHA256: ${c.hash}`,'',
 'SCOPES',...c.scopes.map(row=>`${row.phase} · ${row.scope} · schema=${row.schemaVersion} · ids=${row.stableIds} · authority=${row.authority} · sha256=${row.hash}`),'',
 'CROSS-LINKS',...c.crossLinks.map(row=>`${row.from} -> ${row.to} · ${row.relation} · required=${row.required}`),'',
 'STABLE-ID POLICY',...c.stableIdClasses.map(row=>`${row.classId} · owner=${row.owner} · ${row.policy}`),'',
 'IMMUTABLE INVARIANTS',...c.immutableInvariants.map(row=>`- ${row}`),'',
 'COMPATIBILITY',...Object.entries(c.compatibilityPolicy).filter(([key])=>key!=='requirements').map(([k,v])=>`${k}=${String(v)}`),...c.compatibilityPolicy.requirements.map(row=>`- ${row}`),'',
 'INVARIANTS',...Object.entries(c.invariants).map(([k,v])=>`${k}=${String(v)}`),
].join('\n')+'\n'}
const csv=(v:unknown)=>`"${String(v??'').replaceAll('"','""')}"`
export function studioContractSaturationDeveloperContractCsv(){const rows=[['phase','scope','schema_version','hash','authority','stable_ids','depends_on'],...STUDIO_CONTRACT_SCOPES.map(row=>[row.phase,row.scope,row.schemaVersion,row.hash,row.authority,String(row.stableIds),row.dependsOn.join('|')])];return rows.map(row=>row.map(csv).join(',')).join('\n')+'\n'}
