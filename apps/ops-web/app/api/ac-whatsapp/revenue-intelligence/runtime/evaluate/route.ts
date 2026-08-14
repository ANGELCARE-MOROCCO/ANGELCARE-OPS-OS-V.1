import { NextRequest } from 'next/server'
import { acContext, fail, ok } from '@/lib/ac-whatsapp/server'
import { evaluateRevenueConversation } from '@/lib/ac-whatsapp/revenue-intelligence/runtime'
export async function POST(request:NextRequest){const context=await acContext(request,'ac-whatsapp.automation.manage');if('error' in context)return context.error;const body=await request.json().catch(()=>({}));const conversationId=String(body.conversation_id||'');if(!conversationId)return fail('CONVERSATION_REQUIRED',422);try{return ok(await evaluateRevenueConversation(context.supabase,{conversationId,dryRun:body.dry_run!==false,forceMode:body.force_mode||null}))}catch(cause){return fail('REVENUE_EVALUATION_FAILED',500,cause instanceof Error?cause.message:String(cause))}}
