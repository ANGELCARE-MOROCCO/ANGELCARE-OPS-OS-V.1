import {NextResponse} from 'next/server'
import {getCurrentUser} from '@/lib/getUser'
import {aiRights,apiError,tenantOf} from '@/lib/revenue-command-os/ai/api-access'
import {getAiUsage} from '@/lib/revenue-command-os/ai/repository'
import {getRevenueAiConfig} from '@/lib/revenue-command-os/ai/config'
export const runtime='nodejs';export async function GET(){const user=await getCurrentUser();if(!user)return apiError('UNAUTHENTICATED','Authentification requise.',401);if(!aiRights(user).read)return apiError('FORBIDDEN','Permission IA Revenue requise.',403);const rows=await getAiUsage(tenantOf(user));const totals=rows.reduce((a:any,r:any)=>({requests:a.requests+Number(r.request_count||0),inputTokens:a.inputTokens+Number(r.input_tokens||0),outputTokens:a.outputTokens+Number(r.output_tokens||0)}),{requests:0,inputTokens:0,outputTokens:0});return NextResponse.json({ok:true,data:{...totals,limits:getRevenueAiConfig()},externalActions:false})}
