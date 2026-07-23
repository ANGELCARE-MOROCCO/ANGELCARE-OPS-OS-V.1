import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import { executeOneAction } from '@/lib/revenue-command-os/execution-autopilot/service'
import { loadAction } from '@/lib/revenue-command-os/execution-autopilot/repository'
import { executionConfig } from '@/lib/revenue-command-os/execution-autopilot/config'
export async function dispatchExecutionOutbox(workerId=`worker-${process.pid}`){const c=await createServiceClient() as any;const cfg=executionConfig();const lease=await c.rpc('revenue_os_lease_execution_outbox',{p_worker_id:workerId,p_limit:cfg.maxConcurrency,p_lease_seconds:cfg.leaseSeconds});if(lease.error)throw lease.error;const outcomes=[];for(const item of lease.data||[]){try{const action=await loadAction(item.tenant_id,item.action_id);outcomes.push(await executeOneAction(action));await c.from('revenue_os_execution_outbox').update({status:'completed',completed_at:new Date().toISOString()}).eq('id',item.id)}catch(error){await c.from('revenue_os_execution_outbox').update({status:'failed',last_error:error instanceof Error?error.message:String(error),available_at:new Date(Date.now()+60000).toISOString()}).eq('id',item.id)}}return outcomes}
