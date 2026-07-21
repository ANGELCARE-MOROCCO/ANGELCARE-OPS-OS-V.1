import {runGeminiStrategyAssembly} from '@/lib/revenue-command-os/strategy-brain/ai-orchestration'
import type {RevenueObjective} from '@/lib/revenue-command-os/strategy-brain/types'
export async function runGeminiJob(payload:{objective:RevenueObjective;userId:string;idempotencyKey:string}){return runGeminiStrategyAssembly(payload)}
