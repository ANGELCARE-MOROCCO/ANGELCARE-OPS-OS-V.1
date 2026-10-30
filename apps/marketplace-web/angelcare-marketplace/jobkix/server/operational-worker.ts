import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { sendEmailOSDirect } from '@/lib/email-os-core/send-mail';
import { resolveEmailOSMailboxIdentityFromDb } from '@/lib/email-os-core/multi-mailbox-resolver';
import { classifyDeliveryError } from '../../customer-commerce/auth-email-native/messages';
import { composeOperationalMail } from '../notification';
import { object,uuid,integer } from '../validation';
export function workerAuthorized(request:Request){const secret=process.env.JOBKIX_WORKER_SECRET||'',provided=Buffer.from(request.headers.get('authorization')||''),expected=Buffer.from('Bearer '+secret);return secret.length>=32&&provided.length===expected.length&&timingSafeEqual(provided,expected);}
/** One durable lease, one native transport attempt; never invoked by source verification. */
export async function processOperationalMail(){
 const db=await createServiceClient(),claimed=await db.rpc('jobkix_outbox_claim');if(claimed.error)throw Error('JOBKIX_OUTBOX_UNAVAILABLE');if(!claimed.data)return {state:'idle'};
 const job=object(claimed.data),id=uuid(job.id),lease=uuid(job.lease);integer(job.attempt,'attempt',1,1000000);
 let state:'provider_accepted'|'failed'|'delivery_unknown'|'cancelled'='failed',code:string|null='TRANSPORT_CONFIGURATION',transportReference:string|null=null,attempted=false;
 try{
  const origin=process.env.JOBKIX_PUBLIC_ORIGIN||'',bridgeUrl=process.env.EMAIL_OS_BRIDGE_URL?.trim();if(!bridgeUrl||!process.env.EMAIL_OS_BRIDGE_TOKEN?.trim())throw Error('BRIDGE_REQUIRED');
  const bridge=new URL(bridgeUrl);if(!['https:','http:'].includes(bridge.protocol)||bridge.username||bridge.password)throw Error('BRIDGE_REQUIRED');
  const sender='supports@angelcarehub.ma',native=await resolveEmailOSMailboxIdentityFromDb({fromEmail:sender});
  if(!native||native.smtp.user.toLowerCase()!==sender||native.smtp.from.toLowerCase()!==sender||native.credential?.status!=='active'||native.provider?.status!=='active')throw Error('SUPPORTS_NATIVE_CONFIGURATION_INVALID');
  const mailbox=await db.from('email_os_core_mailboxes').select('status').eq('id',native.mailboxId).maybeSingle();if(mailbox.error||mailbox.data?.status!=='active')throw Error('SUPPORTS_NATIVE_MAILBOX_NOT_ACTIVE');
  const current=await db.rpc('jobkix_outbox_recheck',{p_id:id,p_lease:lease});if(current.error)throw Error('SUPPORTS_CURRENT_DELIVERY_GUARD_UNAVAILABLE');
  if(!current.data){state='cancelled';code='CURRENT_DELIVERY_GUARD';}
  else{
   const message=composeOperationalMail(current.data,origin);attempted=true;const sent=await sendEmailOSDirect({fromEmail:sender,toEmail:message.recipient,subject:message.subject,body:message.html,bodyHtml:message.html,bodyText:message.text,headers:{'X-AngelCare-Jobkix-Delivery':id},attachments:[]});
   if(!sent.info.bridge||String(sent.identity.smtp.user).toLowerCase()!==sender||sent.info.senderIdentity.fromAddress.toLowerCase()!==sender)throw Error('JOBKIX_TRANSPORT_ACKNOWLEDGEMENT_UNKNOWN');
   const accepted=sent.info.accepted.some(value=>String(value).toLowerCase()===message.recipient.toLowerCase());state=accepted&&!sent.info.rejected.length?'provider_accepted':'delivery_unknown';code=state==='provider_accepted'?null:'DELIVERY_ACKNOWLEDGEMENT_UNKNOWN';transportReference=sent.info.messageId||null;
  }
 }catch(error){if(!attempted){state='failed';code='TRANSPORT_CONFIGURATION';}else{const classified=classifyDeliveryError(error);state=classified.state==='retry_wait'?'failed':classified.state;code=classified.code;}}
 const finished=await db.rpc('jobkix_outbox_finish',{p_id:id,p_lease:lease,p_state:state,p_code:code,p_transport_reference:transportReference});if(finished.error||finished.data!==true)throw Error('JOBKIX_OUTBOX_RESULT_NOT_RECORDED');
 return {id,state,code,providerAcceptance:state==='provider_accepted',inboxDelivery:'not_observed'};
}

/** Separate transactions keep bounded work and recruitment lock ordering explicit. */
export async function processScheduledOperations(){
 const db=await createServiceClient(),result:Record<string,unknown>={};
 for(const [phase,rpc] of [['expiry','jobkix_process_expiries'],['alerts','jobkix_process_search_alerts'],['interviews','jobkix_process_interview_reminders']] as const){const response=await db.rpc(rpc);if(response.error)throw Error('JOBKIX_'+phase.toUpperCase()+'_UNAVAILABLE');result[phase]=response.data;}
 // Deployment compatibility: enable only AFTER the additive R3 SQL has been staging-verified and manually installed.
 // Existing scheduled native notification delivery is never made dependent on an uninstalled R3 function.
 if(process.env.JOBKIX_R3_EXTERNAL_ALERTS_ENABLED==='true'){
  const response=await db.rpc('jobkix_r3_process_external_search_alerts');
  if(response.error)throw Error('JOBKIX_EXTERNAL_ALERTS_UNAVAILABLE');
  result.externalAlerts=response.data;
 }
 return result;
}
