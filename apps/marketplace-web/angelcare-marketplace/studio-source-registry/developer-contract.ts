import { createHash } from 'node:crypto'
import { STUDIO_SOURCE_DESCRIPTORS } from './registry'
import { STUDIO_SOURCE_ADAPTERS } from './adapters'

const sha256=(value:string)=>createHash('sha256').update(value).digest('hex')
const csv=(value:unknown)=>`"${String(value??'').replaceAll('"','""')}"`

export function buildStudioSourceRegistryDeveloperContract(){
  const sources=STUDIO_SOURCE_DESCRIPTORS.map((descriptor)=>({
    id:descriptor.id,p00CandidateId:descriptor.p00CandidateId,p00CapabilityId:descriptor.p00CapabilityId,domain:descriptor.domain,entityType:descriptor.entityType,label:descriptor.label,
    authority:descriptor.authority,identifiers:descriptor.identifiers,capabilities:descriptor.capabilities,governance:descriptor.governance,presentation:descriptor.presentation,runtime:descriptor.runtime,
  }))
  const adapterIds=STUDIO_SOURCE_ADAPTERS.map((adapter)=>adapter.sourceId).sort()
  const sourceIds=sources.map((source)=>source.id).sort()
  const body={schemaVersion:'2026-09-19.P01',counts:{sources:sources.length,adapters:adapterIds.length,p00Candidates:new Set(sources.map((source)=>source.p00CandidateId)).size},sourceIds,adapterIds,sources,invariants:{registryIsNotSourceOfTruth:true,canonicalReferencesOnly:true,rawSqlInStudioContent:false,rawTableNamesInStudioContent:false,permissionPropagation:true,failClosedUnknownSource:true,boundedSearch:true,shadowBusinessAuthority:false}}
  return{...body,hash:sha256(JSON.stringify(body))}
}
export function studioSourceRegistryContractTxt(){const c=buildStudioSourceRegistryDeveloperContract();return['ANGELCARE MARKETPLACE STUDIO — P01 UNIVERSAL SOURCE REGISTRY',`SCHEMA=${c.schemaVersion}`,`SOURCES=${c.counts.sources}`,`ADAPTERS=${c.counts.adapters}`,`P00_CANDIDATES=${c.counts.p00Candidates}`,`SHA256=${c.hash}`,'',...c.sources.map((source)=>`${source.id} | P00=${source.p00CandidateId} | AUTHORITY=${source.authority.reference} | PERMISSION=${source.governance.permission} | SEARCH=${source.capabilities.search?'YES':'NO'} | BINDABLE=${source.capabilities.bindable?'YES':'NO'} | DYNAMIC=${source.capabilities.dynamicQuery?'YES':'NO'}`)].join('\n')+'\n'}
export function studioSourceRegistryContractCsv(){const c=buildStudioSourceRegistryDeveloperContract();const rows=[['source_id','p00_candidate','domain','entity_type','authority','permission','search','browse','hierarchical','dynamic_query','bindable','previewable']];for(const source of c.sources)rows.push([source.id,source.p00CandidateId,source.domain,source.entityType,source.authority.reference,source.governance.permission,String(source.capabilities.search),String(source.capabilities.browse),String(source.capabilities.hierarchical),String(source.capabilities.dynamicQuery),String(source.capabilities.bindable),String(source.capabilities.previewable)]);return rows.map((row)=>row.map(csv).join(',')).join('\n')+'\n'}
