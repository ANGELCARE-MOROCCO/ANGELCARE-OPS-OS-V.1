import { NextRequest } from 'next/server'
import { acContext, fail, ok } from '@/lib/ac-whatsapp/server'
import { proposeLearningCandidates } from '@/lib/ac-whatsapp/commercial-cognition/learning-engine'
export async function GET(request:NextRequest){const context=await acContext(request,'ac-whatsapp.view');if('error' in context)return context.error;await proposeLearningCandidates(context.supabase).catch(()=>null);const rows=await context.supabase.from('ac_whatsapp_cc_learning_candidates').select('*').order('created_at',{ascending:false}).limit(200);if(rows.error)return fail(rows.error.message,500);return ok(rows.data||[])}
