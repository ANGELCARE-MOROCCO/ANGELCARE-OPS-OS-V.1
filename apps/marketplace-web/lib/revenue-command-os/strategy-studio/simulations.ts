import type { RevenueStrategy } from '../strategy-brain/types'
import type { CapacitySimulationResult, ConstraintSimulationInput, ConstraintSimulationResult, OutcomeBand, OutcomeSimulationResult } from './types'

const safe=(n:unknown,fallback=0)=>Number.isFinite(Number(n))?Number(n):fallback
export function simulateCapacity(strategy:RevenueStrategy):CapacitySimulationResult[]{
  const baseAvailable=safe((strategy.capacityRequirements[0] as any)?.available,100)
  const required=strategy.capacityRequirements.reduce((sum,x)=>sum+safe(x.amount),0)||50
  const scenarios=[['current',1],['reduced_20',.8],['delayed_hiring',.7],['rabat_only',.6],['pilot_first',.45],['national_expansion',1.4]] as const
  return scenarios.map(([scenario,factor])=>{const available=Math.round(baseAvailable*factor);const utilization=required/Math.max(1,available);return{scenario,available,required,utilization:Number(utilization.toFixed(3)),feasible:utilization<=1,overload:Math.max(0,required-available),warnings:utilization>1?['Capacité insuffisante pour ce scénario.']:utilization>.85?['Marge de capacité faible.']:[]}})
}
export function simulateConstraints(strategy:RevenueStrategy,input:ConstraintSimulationInput):ConstraintSimulationResult{
  const budget=Math.max(.1,input.budgetMultiplier);const staff=Math.max(.1,input.staffAvailability);const deadlinePenalty=input.deadlineShiftDays<0?Math.min(.5,Math.abs(input.deadlineShiftDays)/120):0
  const territoryPenalty=input.territoryCount&&input.territoryCount>3?.12:0
  const feasibility=Math.max(0,Math.min(1,.62*staff+.28*Math.min(1,budget)-deadlinePenalty-territoryPenalty))
  const revenueFactor=Math.max(.2,Math.min(1.8,budget*.55+staff*.45-territoryPenalty))
  const blockers:string[]=[];if(feasibility<.55)blockers.push('Faisabilité opérationnelle insuffisante.');if(input.marginFloor&&input.discountCeiling&&input.discountCeiling>100-input.marginFloor)blockers.push('Plafond de remise incompatible avec la marge minimale.')
  return{input,feasibility:Number(feasibility.toFixed(3)),expectedRevenueFactor:Number(revenueFactor.toFixed(3)),capacityFactor:Number(staff.toFixed(3)),riskFactor:Number((1-feasibility).toFixed(3)),blockers,recommendations:blockers.length?['Réduire le périmètre ou prolonger le délai.']:['Contraintes compatibles avec une progression contrôlée.']}
}
function predicted(strategy:RevenueStrategy,key:string){for(const band of Object.values(strategy.predictedResults||{})){if(key in band)return safe(band[key])}return 0}
export function simulateOutcomes(strategy:RevenueStrategy):OutcomeSimulationResult{
  const baseRevenue=predicted(strategy,'expectedRevenue')||predicted(strategy,'revenue')||100000
  const basePipeline=predicted(strategy,'pipelineCreated')||baseRevenue*2.5
  const baseMeetings=predicted(strategy,'expectedMeetings')||20
  const baseProposals=predicted(strategy,'expectedProposals')||8
  const margin=predicted(strategy,'expectedMargin')||35
  const defs:Array<[OutcomeBand['name'],number,number]>= [['conservative',.55,.55],['base',1,.75],['upside',1.45,.62],['downside',.38,.42],['capacity_constrained',.68,.58],['delayed_conversion',.72,.52]]
  return{bands:defs.map(([name,factor,confidence])=>({name,revenue:Math.round(baseRevenue*factor),pipeline:Math.round(basePipeline*factor),meetings:Math.round(baseMeetings*factor),proposals:Math.round(baseProposals*factor),grossMargin:Number((margin*(name==='upside'?.95:name==='downside'?.82:1)).toFixed(1)),confidence})),assumptions:strategy.assumptions.map(x=>x.assumption),generatedAt:new Date().toISOString(),simulationOnly:true}
}
