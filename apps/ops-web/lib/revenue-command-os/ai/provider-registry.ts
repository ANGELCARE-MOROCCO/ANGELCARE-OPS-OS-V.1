import type {RevenueAiProvider} from './types'
import {getRevenueAiConfig} from './config'
import {GeminiRevenueAiProvider} from './gemini-provider'
import {DeterministicStrategyFallbackProvider} from './deterministic-fallback-provider'
export function resolveRevenueAiProvider():RevenueAiProvider{const config=getRevenueAiConfig();return config.provider==='deterministic'?new DeterministicStrategyFallbackProvider():new GeminiRevenueAiProvider()}
export function resolveDeterministicFallback():RevenueAiProvider{return new DeterministicStrategyFallbackProvider()}
