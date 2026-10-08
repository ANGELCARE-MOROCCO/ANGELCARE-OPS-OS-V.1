import { createHash } from 'node:crypto'
import { STUDIO_SOURCE_DESCRIPTORS } from '@/angelcare-marketplace/studio-source-registry/registry'

export const STUDIO_PICKER_MODES=['single','multiple','search','browse','hierarchical','media'] as const

function build(){
  const body={
    schemaVersion:'2026-09-19.P02',
    framework:'AngelCare Universal Picker Framework',
    sourceAuthority:'P01 Universal Source Registry',
    canonicalReference:'sourceId + entityId',
    modes:[...STUDIO_PICKER_MODES],
    sources:STUDIO_SOURCE_DESCRIPTORS.map(source=>({
      sourceId:source.id,
      p00CandidateId:source.p00CandidateId,
      label:source.label,
      labelPlural:source.labelPlural,
      pickerStatus:(source.capabilities.singleSelect||source.capabilities.multiSelect)?'PICKER_SUPPORTED':'DISPLAY_ONLY',
      modes:{single:source.capabilities.singleSelect,multiple:source.capabilities.multiSelect,search:source.capabilities.search,browse:source.capabilities.browse,hierarchical:source.capabilities.hierarchical,media:source.id==='media.assets',preview:source.capabilities.previewable},
      permission:source.governance.permission,
      publicationAware:source.governance.publicationAware,
      authority:source.authority.reference,
    })),
    invariants:{zeroRawIdDefaultUx:true,onePickerFramework:true,p01OnlyDiscoveryAuthority:true,canonicalReferencePersistence:true,permissionAware:true,publicationAware:true,boundedPagination:true,requestRaceSafety:true,legacyScalarCompatibility:true,shadowData:false,localStorageAuthority:false},
  } as const
  return body
}

export const STUDIO_PICKER_DEVELOPER_CONTRACT=build()
export const STUDIO_PICKER_SUPPORTED_COUNT=STUDIO_PICKER_DEVELOPER_CONTRACT.sources.filter(row=>row.pickerStatus==='PICKER_SUPPORTED').length

export function studioPickerDeveloperContractJson(){
  const body=build(),json=JSON.stringify(body,null,2),hash=createHash('sha256').update(json).digest('hex')
  return{...body,hash}
}
export function studioPickerDeveloperContractTxt(){
  const c=studioPickerDeveloperContractJson()
  return [
    'ANGELCARE MARKETPLACE STUDIO — UNIVERSAL PICKER CONTRACT',
    `Schema: ${c.schemaVersion}`,
    `Sources: ${c.sources.length}`,
    `Picker-supported: ${c.sources.filter(row=>row.pickerStatus==='PICKER_SUPPORTED').length}`,
    `Modes: ${c.modes.join(', ')}`,
    `Hash: ${c.hash}`,
    '',
    ...c.sources.map(source=>`${source.sourceId} | ${source.pickerStatus} | single=${source.modes.single} | multiple=${source.modes.multiple} | search=${source.modes.search} | browse=${source.modes.browse} | hierarchy=${source.modes.hierarchical} | media=${source.modes.media} | permission=${source.permission}`),
    '',
    ...Object.entries(c.invariants).map(([key,value])=>`${key}=${String(value)}`),
  ].join('\n')+'\n'
}
const csv=(value:unknown)=>`"${String(value??'').replaceAll('"','""')}"`
export function studioPickerDeveloperContractCsv(){
  const rows=[['source_id','p00_candidate','label','status','single','multiple','search','browse','hierarchical','media','preview','permission','authority']]
  for(const source of STUDIO_PICKER_DEVELOPER_CONTRACT.sources)rows.push([source.sourceId,source.p00CandidateId,source.label,source.pickerStatus,String(source.modes.single),String(source.modes.multiple),String(source.modes.search),String(source.modes.browse),String(source.modes.hierarchical),String(source.modes.media),String(source.modes.preview),source.permission,source.authority])
  return rows.map(row=>row.map(csv).join(',')).join('\n')+'\n'
}
