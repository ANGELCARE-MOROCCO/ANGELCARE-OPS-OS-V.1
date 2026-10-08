import type { StudioPolicyDecision,StudioPolicyMode } from './types'
export function studioPolicyDecision(mode:StudioPolicyMode,blockers:number):StudioPolicyDecision{if(blockers<=0)return'ALLOW';return mode==='public_runtime'?'FALLBACK':'BLOCK'}
