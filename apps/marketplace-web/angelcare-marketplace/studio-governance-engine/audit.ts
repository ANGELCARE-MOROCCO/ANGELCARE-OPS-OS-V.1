import 'server-only'
import type { MarketplaceRequestContext } from '@/angelcare-marketplace/domain/types'
import { writeMarketplaceAudit } from '@/angelcare-marketplace/audit/write-audit'
import type { StudioPolicyReport } from './types'
export async function auditStudioPolicyDecision(input:{report:StudioPolicyReport;context:MarketplaceRequestContext;requestId:string;objectId?:string|null;action:string}){
 if(input.report.decision==='ALLOW')return
 await writeMarketplaceAudit({context:input.context,requestId:input.requestId,action:input.action,objectType:'studio_policy_decision',objectId:input.objectId||null,result:'denied',severity:'warning',reason:`P11 ${input.report.mode}: ${input.report.blockers.map(x=>x.ruleId).join(', ')}`,source:'studio-p11-governance',afterValue:{mode:input.report.mode,decision:input.report.decision,ruleCodes:input.report.blockers.map(x=>x.ruleId),requestId:input.requestId}})
}
