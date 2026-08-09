import type { RevenueStrategy } from '../strategy-brain/types'
import type { CompilationPreview } from './types'
export function buildCompilationPreview(strategy:RevenueStrategy,conditional:boolean):CompilationPreview{
  const segments=Math.max(1,strategy.targetSegments.length);const channels=Math.max(1,strategy.channelMix.length);const accounts=Math.max(1,strategy.targetMarket.length*segments)
  return{revenuePlays:1,programs:Math.min(3,segments),campaigns:Math.min(8,segments*channels),waves:Math.min(12,accounts),accountPlans:accounts,missions:Math.min(30,accounts*2),tasks:Math.min(180,accounts*channels*3),steps:Math.min(720,accounts*channels*12),scripts:Math.min(40,channels*4),approvalGates:conditional?Math.max(2,strategy.risks.filter(x=>x.impact>=.7).length):1,kpis:Math.max(8,strategy.scenarios.length*2),risks:strategy.risks.filter(x=>x.impact>=.6).map(x=>x.risk),conditional}
}
