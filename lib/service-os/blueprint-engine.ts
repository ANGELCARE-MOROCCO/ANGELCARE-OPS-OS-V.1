import { angelcareBlueprints, angelcareServiceModules } from './seed'
import { ServiceBlueprint, ServiceReadinessReport } from './types'
export function listServiceBlueprints(){ return angelcareBlueprints }
export function getServiceBlueprint(idOrCode:string){ const x=idOrCode.toLowerCase().replace('#',''); return angelcareBlueprints.find(b=>b.id.toLowerCase()===idOrCode.toLowerCase()||b.serviceCode.toLowerCase().replace('#','')===x) }
export function getModuleDetails(keys:string[]){ return angelcareServiceModules.filter(m=>keys.includes(m.key)) }
export function calculateReadiness(bp:ServiceBlueprint):ServiceReadinessReport{
 const missing:string[]=[]; const risks:string[]=[]; const actions:string[]=[]
 if(!bp.modules.length) missing.push('modules configurables')
 if(!bp.workflows.length) missing.push('workflow lifecycle')
 if(!bp.cityDeployments.some(c=>c.active)) missing.push('ville active')
 if(!bp.rules.length) missing.push('règles opérationnelles')
 if(bp.complianceLevel==='critical' && !bp.modules.includes('emergency_protocol')) risks.push('service critique sans protocole urgence')
 if(bp.cityDeployments.some(c=>c.riskScore>45)) risks.push('zone avec risque opérationnel élevé')
 if(bp.cityDeployments.some(c=>c.demandScore>85 && c.staffPool<15)) actions.push('ouvrir campagne staff ciblée')
 if(bp.marginTarget<35) actions.push('réviser pricing / packages premium')
 actions.push('valider SOP, pricing dynamique et permission manager')
 const score=Math.max(0, Math.min(100, bp.readiness - missing.length*10 - risks.length*5))
 return { blueprintId: bp.id, score, missing, risks, recommendedNextActions: actions }
}
export function cloneBlueprint(bp:ServiceBlueprint, patch:Partial<ServiceBlueprint>):ServiceBlueprint{ return {...bp,...patch,id:patch.id||`${bp.id}-clone`,serviceCode:patch.serviceCode||bp.serviceCode,version:patch.version||incrementVersion(bp.version)} }
function incrementVersion(v:string){ const parts=v.split('.').map(Number); parts[2]=(parts[2]||0)+1; return parts.join('.') }
export function buildExecutiveServiceSnapshot(){ const all=listServiceBlueprints(); return {total:all.length,critical:all.filter(b=>b.complianceLevel==='critical').length,avgReadiness:Math.round(all.reduce((s,b)=>s+b.readiness,0)/Math.max(all.length,1)),premiumCities:[...new Set(all.flatMap(b=>b.cityDeployments.filter(c=>c.pricingZone==='premium').map(c=>c.city)))],expansionQueue:all.sort((a,b)=>b.expansionPriority-a.expansionPriority).slice(0,3)} }
