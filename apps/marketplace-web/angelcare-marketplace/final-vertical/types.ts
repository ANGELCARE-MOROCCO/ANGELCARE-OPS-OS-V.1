import type { MarketplacePermission } from '../domain/types'
export interface FinalWorkspaceDefinition {
  key:string; route:string; domain:string; title:string; mission:string; permission:MarketplacePermission
  primaryEntityType:string; lifecycle:string[]; commands:string[]; requiredEvidence:string[]
  sourceTable:string|null; sourceStatusField:string; sourceTitleFields:string[]; sourceMetaFields:string[]; verticalityVersion:number
}
export interface FinalSourceRecord { id:string; title:string; status:string; meta:string; raw:Record<string,unknown> }
export interface FinalWorkspaceData { cases:import('../admin-operating/types').OperatingCase[]; sourceRecords:FinalSourceRecord[] }
