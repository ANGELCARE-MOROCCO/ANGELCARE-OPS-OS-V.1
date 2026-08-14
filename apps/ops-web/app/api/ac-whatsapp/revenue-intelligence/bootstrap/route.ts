import { NextRequest } from 'next/server'
import { acContext, fail, ok } from '@/lib/ac-whatsapp/server'
import { revenueBootstrap } from '@/lib/ac-whatsapp/revenue-intelligence/repository'

export async function GET(request:NextRequest){
  const context=await acContext(request,'ac-whatsapp.view')
  if('error' in context)return context.error
  try{return ok(await revenueBootstrap(context.supabase))}catch(cause){return fail('REVENUE_INTELLIGENCE_BOOTSTRAP_FAILED',500,cause instanceof Error?cause.message:String(cause))}
}
