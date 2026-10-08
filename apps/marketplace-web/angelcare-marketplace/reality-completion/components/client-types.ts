import type {RealityEvent,RealityRecord} from '../types'
export interface SpecialistWorkspaceProps{
 workspaceKey:string
 title:string
 mission:string
 lifecycle:string[]
 actorName:string
 records:RealityRecord[]
 sources:Array<{id:string;title:string;status:string;meta:string;raw:Record<string,unknown>}>
 events:RealityEvent[]
}
