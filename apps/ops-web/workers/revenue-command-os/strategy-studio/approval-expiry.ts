import 'server-only'
import { createClient } from '@/lib/supabase/server'
export async function expireStrategyApprovals(now=new Date()){const c=await createClient() as any;const r=await c.from('revenue_os_approval_requests').update({status:'approval_expired',ready_for_mz13:false,updated_at:now.toISOString()}).lt('expires_at',now.toISOString()).in('status',['awaiting_executive_review','under_review','conditional_approval','approved']);if(r.error)throw r.error;return{expired:true,externalActions:0}}
