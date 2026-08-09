import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
export async function reconcileExecutionWebhooks(tenantId:string){const c=await createServiceClient() as any;const r=await c.from('revenue_os_execution_webhook_events').select('*').eq('tenant_id',tenantId).eq('status','received').order('received_at').limit(100);if(r.error)throw r.error;for(const event of r.data||[]){await c.from('revenue_os_execution_webhook_events').update({status:'processed',processed_at:new Date().toISOString()}).eq('id',event.id)}return{processed:(r.data||[]).length}}
