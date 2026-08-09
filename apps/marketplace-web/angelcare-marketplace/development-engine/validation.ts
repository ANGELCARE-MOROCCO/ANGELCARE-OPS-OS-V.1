import { MarketplaceError } from '../server/errors'
import type { DevelopmentStatus } from './types'
const transitions:Record<DevelopmentStatus,DevelopmentStatus[]>={draft:['review','archived'],review:['draft','approved'],approved:['review','published'],published:['suspended','archived'],suspended:['review','published','archived'],archived:[]}
export function assertDevelopmentTransition(current:DevelopmentStatus,target:DevelopmentStatus){if(!transitions[current].includes(target))throw new MarketplaceError('INVALID_STATE_TRANSITION',`Transition ${current} → ${target} interdite.`)}
export function requireFrench(value:unknown,label:string){const text=String(value||'').trim();if(!text)throw new MarketplaceError('VALIDATION_ERROR',`${label} en français est requis.`);return text}
export function validateAgeRange(min:unknown,max:unknown){const a=Number(min),b=Number(max);if(!Number.isFinite(a)||!Number.isFinite(b)||a<0||b<a)throw new MarketplaceError('VALIDATION_ERROR','La tranche d’âge est invalide.');return {min:a,max:b}}
