import { NextRequest } from 'next/server'
import { acContext, fail, ok, scopeAccountRows, scopeAccounts } from '@/lib/ac-whatsapp/server'
export async function GET(request:NextRequest){
 const context=await acContext(request,'ac-whatsapp.analytics.view');if('error'in context)return context.error;const since=new Date(Date.now()-30*86400000).toISOString()
 const [messages,conversations,campaigns,reviews,outbox,accounts]=await Promise.all([
  scopeAccountRows(context.supabase.from('ac_whatsapp_messages').select('direction,status,created_at,sent_at,delivered_at,read_at,account_id'),context).gte('created_at',since),
  scopeAccountRows(context.supabase.from('ac_whatsapp_conversations').select('status,priority,created_at,first_response_at,resolved_at,assigned_user_id,account_id'),context).gte('created_at',since),
  scopeAccountRows(context.supabase.from('ac_whatsapp_campaigns').select('*'),context).gte('created_at',since),
  context.supabase.from('ac_whatsapp_quality_reviews').select('*').gte('created_at',since),
  scopeAccountRows(context.supabase.from('ac_whatsapp_outbox').select('status,attempt_count,created_at,account_id'),context).gte('created_at',since),
  scopeAccounts(context.supabase.from('ac_whatsapp_accounts').select('*'),context),
 ])
 const e=[messages,conversations,campaigns,reviews,outbox,accounts].find(x=>x.error)?.error;if(e)return fail(e.message,500);const m=messages.data||[],c=conversations.data||[],cp=campaigns.data||[]
 return ok({periodDays:30,messages:{total:m.length,inbound:m.filter((x:any)=>x.direction==='inbound').length,outbound:m.filter((x:any)=>x.direction==='outbound').length,delivered:m.filter((x:any)=>['delivered','read'].includes(x.status)).length,read:m.filter((x:any)=>x.status==='read').length,failed:m.filter((x:any)=>x.status==='failed').length},conversations:{total:c.length,open:c.filter((x:any)=>!['resolved','closed','archived'].includes(x.status)).length,resolved:c.filter((x:any)=>['resolved','closed'].includes(x.status)).length,escalated:c.filter((x:any)=>x.status==='escalated').length},campaigns:{total:cp.length,running:cp.filter((x:any)=>x.status==='running').length,recipients:cp.reduce((n:number,x:any)=>n+(x.total_recipients||0),0),sent:cp.reduce((n:number,x:any)=>n+(x.sent_count||0),0),delivered:cp.reduce((n:number,x:any)=>n+(x.delivered_count||0),0),read:cp.reduce((n:number,x:any)=>n+(x.read_count||0),0),replies:cp.reduce((n:number,x:any)=>n+(x.reply_count||0),0),conversions:cp.reduce((n:number,x:any)=>n+(x.conversion_count||0),0)},quality:{reviews:(reviews.data||[]).length,average:(reviews.data||[]).length?(reviews.data||[]).reduce((n:number,x:any)=>n+Number(x.score||0),0)/(reviews.data||[]).length:0},delivery:{queued:(outbox.data||[]).filter((x:any)=>['queued','scheduled'].includes(x.status)).length,processing:(outbox.data||[]).filter((x:any)=>x.status==='processing').length,failed:(outbox.data||[]).filter((x:any)=>x.status==='failed').length},accounts:accounts.data||[]})
}
