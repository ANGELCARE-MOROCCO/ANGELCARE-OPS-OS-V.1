import type { ActivationLevel, ProductionActivation, SystemMode } from './types'
const levelMode:Record<ActivationLevel,SystemMode>={0:'live',1:'live',2:'live',3:'live',4:'live',5:'live',6:'live'}
export function modeForLevel(level:ActivationLevel):SystemMode{return levelMode[level]}
export function buildActivation(level:ActivationLevel,tenantId:string,actorId:string):ProductionActivation{return{id:crypto.randomUUID(),tenantId,level,mode:'live',adapterScope:['*'],actionScope:['*'],riskScope:['*'],status:'active',approvedBy:[actorId],effectiveAt:new Date().toISOString()}}
import crypto from 'node:crypto'
