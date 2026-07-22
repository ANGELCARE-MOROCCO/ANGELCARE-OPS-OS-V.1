import type { CommandPerformance, ForecastCalibration, SegmentLearning, StrategyOutcome } from './types'
export function classifyOutcome(outcome:StrategyOutcome):string{
 if(outcome.executionCompleteness<0.6)return 'not_fairly_tested'
 if(outcome.actualRevenue>=outcome.plannedRevenue&&outcome.actualMargin>=outcome.plannedMargin)return 'succeeded'
 if(outcome.actualRevenue>=outcome.plannedRevenue*0.65)return 'partially_succeeded'
 return 'failed'
}
export function rankCommands(outcomes:StrategyOutcome[],existing:CommandPerformance[]):CommandPerformance[]{return existing.map(item=>{const confidence=Math.min(1,Math.max(0,item.executions/100));const successRate=item.executions?item.successes/item.executions:0;const state:CommandPerformance['state']=item.executions<10?'unproven':successRate>=.7&&confidence>=.5?'high_performing':successRate>=.55?'validated':successRate<.25&&item.executions>=20?'underperforming':'promising';return{...item,successRate,confidence,state,updatedAt:new Date().toISOString()}})}
export function calibrateForecast(predicted:number,actual:number,targetType:string,targetId:string):ForecastCalibration{const absoluteError=Math.abs(predicted-actual);const percentageError=predicted===0?(actual===0?0:100):absoluteError/Math.abs(predicted)*100;return{id:crypto.randomUUID(),targetType,targetId,predicted,actual,absoluteError,percentageError,bias:percentageError<=5?'accurate':actual>predicted?'under':'over',calibratedAt:new Date().toISOString()}}
export function validateSegmentLearning(model:SegmentLearning):string[]{const issues:string[]=[];if(model.sampleSize<20)issues.push('sample_size_low');if(model.confidence<.6)issues.push('confidence_low');if(!model.evidenceIds.length)issues.push('evidence_missing');return issues}
