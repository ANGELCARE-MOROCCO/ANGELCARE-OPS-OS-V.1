import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { runMarketIntelligenceScan } from '@/lib/market-os/content-command-headquarters/market-scan'
import { contentHeadquartersApiError } from '@/lib/market-os/content-command-headquarters/auth'

export const dynamic='force-dynamic'
function authorized(request:NextRequest){const expected=String(process.env.MARKETING_AI_CRON_SECRET||'');const auth=request.headers.get('authorization')||'';return Boolean(expected)&&auth===`Bearer ${expected}`}
async function execute(request:NextRequest){try{if(!authorized(request))return NextResponse.json({ok:false,error:'FORBIDDEN'},{status:403});const supabase=await createServiceClient() as any;const due=await supabase.from('market_content_ai_directors').select('id').eq('director_type','market_intelligence').in('status',['active','approved']).or(`next_run_at.is.null,next_run_at.lte.${new Date().toISOString()}`).limit(4);if(due.error)throw due.error;const results:Array<Record<string,unknown>>=[];for(const row of due.data||[]){try{results.push(await runMarketIntelligenceScan({actorId:'',actorName:'SANILA Scheduler',directorId:String(row.id),reason:'scheduled_due_scan'}))}catch(error){results.push({directorId:row.id,error:error instanceof Error?error.message:String(error)})}}return NextResponse.json({ok:true,processed:results.length,results})}catch(error){return contentHeadquartersApiError(error)}}
export async function GET(request:NextRequest){return execute(request)}
export async function POST(request:NextRequest){return execute(request)}
