import type { AttributionResult } from './types'
export function normalizeContributions(items:AttributionResult['contributions']):AttributionResult['contributions']{const total=items.reduce((sum,item)=>sum+Math.max(0,item.weight),0)||1;return items.map(item=>({...item,weight:Math.max(0,item.weight)/total}))}
export function attributionConfidence(items:AttributionResult['contributions'],evidenceCoverage:number):number{if(!items.length)return 0;const avg=items.reduce((sum,item)=>sum+item.confidence,0)/items.length;return Math.max(0,Math.min(1,avg*.7+evidenceCoverage*.3))}
