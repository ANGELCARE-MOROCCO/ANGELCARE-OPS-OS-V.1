import {MarketplaceError} from '../server/errors'
import {isRealityDomain} from './domain-contract'
import type {RealityDomain} from './types'

const text=(v:unknown)=>typeof v==='string'?v.trim():''

const REQUIRED:Record<RealityDomain,string[]>={
  growth:['hypothesis','objective','metricKey'],
  qa:['reproductionSteps','expectedResult','observedResult'],
  intelligence:['sourceName','observation'],
  platform_performance:['surface','metricKey','customerImpact'],
  security:['asset'],
  trust:['allegation'],
  launch:['versionLabel','scopeSummary','rollbackPlan'],
}

export const ACTIONS:Record<RealityDomain,string[]>={
  growth:['update_details','plan','request_approval','activate','monitor','analyze','decide','scale','stop','close','assign'],
  qa:['reproduce','triage','own','correct','retest','verify','close','assign'],
  intelligence:['validate','classify','analyze','recommend','decide','act','outcome','close','assign'],
  platform_performance:['confirm','own','mitigate','recover','verify','postmortem','close','assign'],
  security:['triage','contain','investigate','remediate','recover','postmortem','close','assign'],
  trust:['triage','own','investigate','decide','remediate','resolve_customer','verify','close','assign'],
  launch:['prepare','technical_ready','business_ready','approve','schedule','deploy','verify','accept','block','rollback','recover','close','assign'],
}

export function realityDomain(value:string):RealityDomain{
  if(!isRealityDomain(value))throw new MarketplaceError('VALIDATION_ERROR','Domaine Reality Completion invalide.')
  return value
}

export function validateRealityCreate(domain:RealityDomain,values:Record<string,unknown>){
  const missing=REQUIRED[domain].filter(key=>!text(values[key]))
  if(missing.length)throw new MarketplaceError('VALIDATION_ERROR',`Champs obligatoires manquants : ${missing.join(', ')}.`)
}

export function validateRealityAction(domain:RealityDomain,action:string){
  if(!ACTIONS[domain].includes(action))throw new MarketplaceError('VALIDATION_ERROR',`Commande ${action} non autorisée pour ${domain}.`)
}
