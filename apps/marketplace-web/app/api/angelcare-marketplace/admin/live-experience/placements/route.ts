import {handleLiveGovernance} from '@/angelcare-marketplace/live-experience-command/governance-api-handlers'
export const GET=(request:Request)=>handleLiveGovernance(request,'placements')
export const POST=(request:Request)=>handleLiveGovernance(request,'placements')
export const PATCH=(request:Request)=>handleLiveGovernance(request,'placements')
