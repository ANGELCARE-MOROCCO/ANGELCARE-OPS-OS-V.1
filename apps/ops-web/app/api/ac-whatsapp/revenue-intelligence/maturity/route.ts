import { NextRequest } from 'next/server'
import { acContext, fail, ok } from '@/lib/ac-whatsapp/server'
import { generateMaturityProposals } from '@/lib/ac-whatsapp/revenue-intelligence/maturity'

export async function GET(request:NextRequest){const context=await acContext(request,'ac-whatsapp.analytics.view');if('error' in context)return context.error;const rows=await context.supabase.from('ac_whatsapp_ri_maturity').select('*').order('score',{ascending:false}).limit(300);if(rows.error)return fail(rows.error.message,500);return ok(rows.data||[])}
export async function POST(request:NextRequest){const context=await acContext(request,'ac-whatsapp.automation.manage');if('error' in context)return context.error;try{const created=await generateMaturityProposals(context.supabase);return ok({created})}catch(cause){return fail('MATURITY_RECOMPUTE_FAILED',500,cause instanceof Error?cause.message:String(cause))}}
