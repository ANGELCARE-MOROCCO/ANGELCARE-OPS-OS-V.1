import { createHash } from 'node:crypto'
import type { StudioAttributionContext } from './types'

export const STUDIO_ATTRIBUTION_DIMENSIONS:readonly (keyof StudioAttributionContext)[]=['surface','pageId','pageRoute','pageRevisionId','templateId','templateKey','templateRevisionId','templateScope','blockId','interactionId','actionId','workflowId','itemId','itemSlug','collectionId','placementId','campaignId','audienceId','territoryId','locale','traceId','referrerHost','referrerPath','visitorHash','utmSource','utmMedium','utmCampaign','utmContent']
export const STUDIO_ATTRIBUTION_AUTHORITIES=[
  {object:'public_inquiry',authority:'angelcare_marketplace_public_inquiries.source_metadata'},
  {object:'conversion_session',authority:'angelcare_marketplace_conversion_sessions.metadata'},
  {object:'family_quote_request',authority:'angelcare_marketplace_audit_events.after_value + public_events.event_data'},
  {object:'b2b_public_request',authority:'angelcare_marketplace_public_events.event_data'},
] as const
export const STUDIO_ATTRIBUTION_DEVELOPER_CONTRACT={
  schemaVersion:'2026-09-19.P09',phase:'P09',name:'Origin / Attribution Propagation',
  dimensionCount:STUDIO_ATTRIBUTION_DIMENSIONS.length,dimensions:STUDIO_ATTRIBUTION_DIMENSIONS,authorities:STUDIO_ATTRIBUTION_AUTHORITIES,
  propagation:['Studio page / assigned template','block + interaction','P03 structured action / P07 workflow','internal URL provenance','Conversion Universe / Public Inquiry / Family audit / Public events','existing admin destination'],
  invariants:{piiInUrl:false,rawVisitorReferencePersisted:false,rawReferrerQueryPersisted:false,externalUrlDecoration:false,shadowAttributionTable:false,existingAuthoritiesOnly:true,serverVisitorHash:true,boundedFields:true,adminOriginVisibility:true,p10TrustInspector:false,sqlRequired:false,databaseSchemaChange:false,localBuild:false,globalTypescript:false}
} as const
const baseJson=()=>JSON.stringify(STUDIO_ATTRIBUTION_DEVELOPER_CONTRACT)
export function studioAttributionDeveloperContract(){return{...STUDIO_ATTRIBUTION_DEVELOPER_CONTRACT,hash:createHash('sha256').update(baseJson()).digest('hex')}}
export function studioAttributionDeveloperContractTxt(){const c=studioAttributionDeveloperContract();return ['ANGELCARE MARKETPLACE STUDIO — P09 ORIGIN / ATTRIBUTION PROPAGATION',`Schema: ${c.schemaVersion}`,`Dimensions: ${c.dimensionCount}`,`Authorities: ${c.authorities.length}`,`Propagation: ${c.propagation.join(' > ')}`,`Hash: ${c.hash}`,...Object.entries(c.invariants).map(([k,v])=>`${k}=${String(v)}`)].join('\n')+'\n'}
export function studioAttributionDeveloperContractCsv(){const c=studioAttributionDeveloperContract();const rows:[string,string][]=[['schemaVersion',c.schemaVersion],['dimensions',String(c.dimensionCount)],['authorities',String(c.authorities.length)],['propagation',c.propagation.join(' > ')],...Object.entries(c.invariants).map(([k,v])=>[k,String(v)] as [string,string])];return 'key,value\n'+rows.map(([k,v])=>`"${k.replaceAll('"','""')}","${v.replaceAll('"','""')}"`).join('\n')+'\n'}
