import {handleLiveGovernance} from '@/angelcare-marketplace/live-experience-command/governance-api-handlers'
export const GET=(request:Request)=>handleLiveGovernance(request,'history')

