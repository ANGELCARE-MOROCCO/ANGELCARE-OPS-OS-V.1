import { NextRequest, NextResponse } from 'next/server'
import { requireContentHeadquartersUser, contentHeadquartersApiError } from '@/lib/market-os/content-command-headquarters/auth'
import { claimCriticalAuthority, actOnOperationalIncident, applyProductionHygiene, getProductionOperationsSnapshot, governProductionRelease, refreshOperationalIncidents, updateBudgetPolicy, updateInternationalDefault, updateNotificationRule, updateProductionControls, updateRoleHome } from '@/lib/market-os/content-command-headquarters/production-operations-service'

export const dynamic='force-dynamic'
const clean=(v:unknown)=>String(v||'').trim()
export async function GET(){try{await requireContentHeadquartersUser('view');return NextResponse.json({ok:true,result:await getProductionOperationsSnapshot()})}catch(error){return contentHeadquartersApiError(error)}}
export async function POST(request:NextRequest){try{const body=await request.json() as {action?:string;payload?:Record<string,unknown>};const action=clean(body.action);const payload=body.payload||{};const actor=await requireContentHeadquartersUser(action==='snapshot'?'view':'govern');let result:unknown
if(action==='snapshot')result=await getProductionOperationsSnapshot()
else if(action==='claim_critical_authority')result=await claimCriticalAuthority({actorId:actor.id,actorName:actor.name,reason:clean(payload.reason)})
else if(action==='update_controls')result=await updateProductionControls({actorId:actor.id,actorName:actor.name,patch:(payload.patch||{}) as Record<string,unknown>,reason:clean(payload.reason)})
else if(action==='release_create'||action==='release_activate'||action==='release_retire')result=await governProductionRelease({actorId:actor.id,actorName:actor.name,action:action.replace('release_','') as 'create'|'activate'|'retire',payload})
else if(action==='budget_update')result=await updateBudgetPolicy({actorId:actor.id,actorName:actor.name,payload})
else if(action==='defaults_update')result=await updateInternationalDefault({actorId:actor.id,actorName:actor.name,payload})
else if(action==='role_home_update')result=await updateRoleHome({actorId:actor.id,actorName:actor.name,payload})
else if(action==='notification_update')result=await updateNotificationRule({actorId:actor.id,actorName:actor.name,payload})
else if(action==='incidents_refresh')result=await refreshOperationalIncidents({actorId:actor.id,actorName:actor.name})
else if(action==='incident_action')result=await actOnOperationalIncident({actorId:actor.id,actorName:actor.name,incidentId:clean(payload.incidentId),action:clean(payload.incidentAction),ownerName:clean(payload.ownerName),reason:clean(payload.reason)})
else if(action==='hygiene_apply')result=await applyProductionHygiene({actorId:actor.id,actorName:actor.name,items:Array.isArray(payload.items)?payload.items as Array<{entityType:string;id:string;action:string}>:[],reason:clean(payload.reason)})
else throw new Error('INVALID_PRODUCTION_OPERATION')
return NextResponse.json({ok:true,result})}catch(error){return contentHeadquartersApiError(error)}}
