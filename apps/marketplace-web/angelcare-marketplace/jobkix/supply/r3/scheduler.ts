/** In-process, restart-safe coordinator, backed by Postgres SKIP LOCKED claims. */
import 'server-only';
import {randomBytes} from 'node:crypto';
import {createServiceClient} from '@/lib/supabase/server';
import {nextDue,scheduleSpec} from './schedule';
import {executeR3ScheduledSource} from '../server';
const INSTANCE='r3-'+randomBytes(10).toString('hex');
const LOOP_MS=30_000;
let running=false;
let lastError='';
const registry=globalThis as typeof globalThis & {__jobkixR3SchedulerStarted?:boolean};
async function tick(){if(running)return;running=true;
 try{
  const db=await createServiceClient();
  const flags=await db.from('jobkix_supply_r3_control').select('scheduler_enabled,global_pause,max_concurrency').eq('id',1).maybeSingle();
  if(flags.error){if(lastError!==flags.error.message){console.warn('[JOBKIX R3] Scheduler waiting for reviewed migration:',flags.error.message);lastError=flags.error.message;}return;}
  lastError='';if(!flags.data?.scheduler_enabled||flags.data?.global_pause)return;
  const status=await db.from('jobkix_supply_r3_control').update({heartbeat_at:new Date().toISOString(),heartbeat_instance:INSTANCE}).eq('id',1);if(status.error)throw Error(status.error.message);
  const slots=Math.max(1,Math.min(3,Number(flags.data.max_concurrency)||1));
  await Promise.all(Array.from({length:slots},async()=>{
  const claim=await db.rpc('jobkix_supply_r3_claim',{p_instance:INSTANCE});if(claim.error)throw Error(claim.error.message);
  const rows=Array.isArray(claim.data)?claim.data:[];
  for(const schedule of rows){
   const due=String(schedule.last_due_at||new Date().toISOString()),id=String(schedule.id);
   const spec=scheduleSpec(schedule.spec);
   if(spec.missedPolicy==='skip'&&Date.now()-new Date(due).getTime()>90_000){
    await db.from('jobkix_supply_r3_schedules').update({next_run_at:nextDue(spec,new Date()).toISOString(),last_status:'missed',claimed_by:null,lease_until:null,updated_at:new Date().toISOString()}).eq('id',id).eq('claimed_by',INSTANCE);
    continue;
   }
   const existing=await db.from('jobkix_supply_r3_runs').select('state').eq('schedule_id',id).eq('due_at',due).maybeSingle();
   if(existing.error)throw Error(existing.error.message);
   if(existing.data?.state==='completed'){
    const spec=scheduleSpec(schedule.spec);await db.from('jobkix_supply_r3_schedules').update({next_run_at:nextDue(spec,new Date()).toISOString(),last_status:'unchanged',claimed_by:null,lease_until:null}).eq('id',id).eq('claimed_by',INSTANCE);continue;
   }
   const record=await db.from('jobkix_supply_r3_runs').upsert({schedule_id:id,due_at:due,state:'running',started_at:new Date().toISOString(),ended_at:null,error_message:null},{onConflict:'schedule_id,due_at'}).select('id').single();if(record.error)throw Error(record.error.message);
   try{
    const result=await executeR3ScheduledSource(String(schedule.source_id),id);
    const finished=await db.from('jobkix_supply_r3_runs').update({state:'completed',ended_at:new Date().toISOString(),result}).eq('id',record.data!.id);if(finished.error)throw Error(finished.error.message);
    const spec=scheduleSpec(schedule.spec);
    const update=await db.from('jobkix_supply_r3_schedules').update({claimed_by:null,lease_until:null,last_status:'completed',last_run_at:new Date().toISOString(),failure_count:0,next_run_at:nextDue(spec,new Date()).toISOString(),updated_at:new Date().toISOString()}).eq('id',id).eq('claimed_by',INSTANCE);if(update.error)throw Error(update.error.message);
   }catch(error){
    const reason=error instanceof Error?error.message:String(error),failureCount=Number(schedule.failure_count||0)+1;
    await db.from('jobkix_supply_r3_runs').update({state:'failed',ended_at:new Date().toISOString(),error_message:reason.slice(0,450)}).eq('id',record.data!.id);
    const spec=scheduleSpec(schedule.spec),pause=failureCount>spec.retryLimit;
    await db.from('jobkix_supply_r3_schedules').update({claimed_by:null,lease_until:null,last_status:'failed',failure_count:failureCount,enabled:!pause&&schedule.enabled,next_run_at:pause?null:nextDue(spec,new Date()).toISOString(),last_run_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id).eq('claimed_by',INSTANCE);
    console.warn('[JOBKIX R3] Scheduled mission failed:',id,reason.slice(0,250));
   }
  }
  }));
 }catch(error){console.warn('[JOBKIX R3] Scheduler:',error instanceof Error?error.message:String(error));}
 finally{running=false;}
}
export function startJobkixSupplyScheduler(){
 if(registry.__jobkixR3SchedulerStarted)return;
 if(process.env.NODE_ENV!=='production'||process.env.NEXT_RUNTIME!=='nodejs'||process.env.npm_lifecycle_event==='build'||process.env.NEXT_PHASE==='phase-production-build')return;
 registry.__jobkixR3SchedulerStarted=true;
 const timer=setInterval(()=>{void tick()},LOOP_MS);timer.unref();void tick();
 console.info('[JOBKIX R3] Scheduler coordinator registered in existing Marketplace runtime');
}
