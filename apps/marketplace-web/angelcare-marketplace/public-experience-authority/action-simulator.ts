import {getStudioActionDescriptor} from '@/angelcare-marketplace/studio-action-registry/registry'
import {getStudioWorkflowDescriptor} from '@/angelcare-marketplace/studio-workflows/registry'
import type {PublicExperienceActionSimulation} from './types'

export function simulatePublicExperienceAction(input:{actionId:string;workflowId?:string|null;target?:string|null}):PublicExperienceActionSimulation{
 const action=getStudioActionDescriptor(input.actionId);const workflow=input.workflowId?getStudioWorkflowDescriptor(input.workflowId):null
 if(!action)return{actionId:input.actionId,workflowId:input.workflowId||null,status:'UNKNOWN',target:input.target||null,validations:[],creates:null,canonicalEngine:null,adminDestination:null,reason:'Action inconnue du registre P03.',mutationPerformed:false}
 if(action.targetRequired&&!input.target)return{actionId:input.actionId,workflowId:input.workflowId||null,status:'BLOCKED',target:null,validations:[...action.validations],creates:action.creates,canonicalEngine:action.canonicalEngine,adminDestination:workflow?.adminDestination||action.adminDestination,reason:'Cible canonique requise.',mutationPerformed:false}
 return{actionId:input.actionId,workflowId:input.workflowId||null,status:'READY',target:input.target||null,validations:[...action.validations,...(workflow?['workflow:'+workflow.id]:[])],creates:workflow?.creates||action.creates,canonicalEngine:workflow?.canonicalEngine||action.canonicalEngine,adminDestination:workflow?.adminDestination||action.adminDestination,reason:null,mutationPerformed:false}
}
