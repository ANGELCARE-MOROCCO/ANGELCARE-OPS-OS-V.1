import { governRoute } from '@/lib/runtime/governor/route'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { compilationDecisionSchema } from '@/lib/market-os/marketing-ai/phase3-schemas'
import { approveCompilationItems, createDecision, getCompilation, updateCompilationStatus } from '@/lib/market-os/marketing-ai/phase3-repository'
async function POST__angelcareGovernedImpl(request:Request,context:{params:Promise<{id:string}>}){ try{const actor=await requireMarketingAiUser('govern');const {id}=await context.params;const body=compilationDecisionSchema.parse(await request.json());const current=await getCompilation(id);if(!current)throw new Error('COMPILATION_NOT_FOUND');const decision=await createDecision({compilationId:id,missionId:current.compilation.missionId,decisionType:body.decisionType,reason:body.reason,conditions:body.conditions,actor});let status=current.compilation.status;if(['approve','approve_with_conditions'].includes(body.decisionType)){status='approved';await approveCompilationItems(id)}else if(['reject','cancel'].includes(body.decisionType))status='cancelled';else if(['pause','escalate'].includes(body.decisionType))status='blocked';else status='awaiting_decision';const compilation=await updateCompilationStatus(id,status,actor.id);return Response.json({ok:true,decision,compilation})}catch(error){return apiErrorResponse(error)} }

export const POST = governRoute(
  {
    workloadClass: 'ai',
    operation: 'POST:/api/market-os/content-command/marketing-ai/compilations/[id]/decision',
  },
  POST__angelcareGovernedImpl,
)
