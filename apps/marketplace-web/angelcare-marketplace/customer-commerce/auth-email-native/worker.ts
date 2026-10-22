import { timingSafeEqual } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmailOSDirect } from '@/lib/email-os-core/send-mail'
import { resolveEmailOSMailboxIdentityFromDb } from '@/lib/email-os-core/multi-mailbox-resolver'
import { composeAuthEmail, classifyDeliveryError, type AuthEmailJob } from './messages'
import { composeJobkixAuthEmail, jobkixAuthLocale } from '../../jobkix/server/auth-email'
export function isAuthEmailWorkerAuthorized(request: Request): boolean {
 const secret=process.env.ANGELCARE_AUTH_EMAIL_WORKER_SECRET||''
 if(secret.length<32)return false
 const value=request.headers.get('authorization')||''
 const expected=Buffer.from('Bearer '+secret),provided=Buffer.from(value)
 return expected.length===provided.length&&timingSafeEqual(expected,provided)
}
/** Uses the existing resolver + sender identity + bridge + SMTP policy, without a human PIN. */
export async function processOneAuthEmail(): Promise<Record<string,unknown>> {
 const db=await createServiceClient()
 const {data,error}=await db.rpc('angelcare_marketplace_auth_email_claim')
 if(error)throw Error('AUTH_EMAIL_LEDGER_UNAVAILABLE')
 if(!data)return {state:'idle'}
 const job=data as AuthEmailJob
 let result: {state:'provider_accepted'|'retry_wait'|'failed'|'delivery_unknown';code:string|null;messageId?:string|null}
 try {
  if(!process.env.EMAIL_OS_BRIDGE_URL?.trim()||!process.env.EMAIL_OS_BRIDGE_TOKEN?.trim())throw Error('BRIDGE_REQUIRED')
  const bridge=new URL(process.env.EMAIL_OS_BRIDGE_URL.trim())
  if(!['https:','http:'].includes(bridge.protocol)||bridge.username||bridge.password)throw Error('BRIDGE_REQUIRED')
  const message=(jobkixAuthLocale(job)?composeJobkixAuthEmail:composeAuthEmail)(job,{
   authOrigin:process.env.NEXT_PUBLIC_SUPABASE_URL||'',
   marketplaceOrigin:process.env.ANGELCARE_AUTH_EMAIL_MARKETPLACE_ORIGIN||'https://my.angelcarehub.com',
   redirectOrigins:(process.env.ANGELCARE_AUTH_EMAIL_REDIRECT_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean),
   allowDevelopment:process.env.NODE_ENV!=='production'
  })
  const SENDER=message.sender
  // Require the established bridge and the active native sender before any send.
  const native=await resolveEmailOSMailboxIdentityFromDb({fromEmail:SENDER})
  if(!native||native.smtp.user.toLowerCase()!==SENDER||native.smtp.from.toLowerCase()!==SENDER||native.credential?.status!=='active'||native.provider?.status!=='active')throw Error('SUPPORTS_NATIVE_CONFIGURATION_INVALID')
  const mailbox=await db.from('email_os_core_mailboxes').select('status').eq('id',native.mailboxId).maybeSingle()
  if(mailbox.error||mailbox.data?.status!=='active')throw Error('SUPPORTS_NATIVE_MAILBOX_NOT_ACTIVE')
  const sent=await sendEmailOSDirect({fromEmail:SENDER,toEmail:message.recipient,subject:message.subject,
   body:message.html,bodyHtml:message.html,bodyText:message.text,headers:{'X-AngelCare-Auth-Delivery':job.id},attachments:[]})
  if(!sent.info.bridge||String(sent.identity.smtp.user).toLowerCase()!==SENDER||sent.info.senderIdentity.fromAddress.toLowerCase()!==SENDER)throw Error('SUPPORTS_NATIVE_SENDER_MISMATCH')
  const accepted=sent.info.accepted.some(x=>String(x).toLowerCase()===message.recipient.toLowerCase())
  result=accepted&&!sent.info.rejected.length?{state:'provider_accepted',code:null,messageId:sent.info.messageId}:{state:'delivery_unknown',code:'DELIVERY_ACKNOWLEDGEMENT_UNKNOWN'}
 } catch(error) { const classified=classifyDeliveryError(error);result={...classified} }
 const saved=await db.rpc('angelcare_marketplace_auth_email_finish',{p_id:job.id,p_lease:job.lease_token,p_state:result.state,p_code:result.code,p_message_id:result.messageId||null})
 if(saved.error||saved.data!==true)throw Error('AUTH_EMAIL_RESULT_NOT_RECORDED')
 return {id:job.id,action:job.action,state:result.state,errorCode:result.code,providerAcceptance:result.state==='provider_accepted',inboxDelivery:'not_observed'}
}
export async function readAuthEmailStatus(): Promise<unknown> {
 const db=await createServiceClient();const {data,error}=await db.rpc('angelcare_marketplace_auth_email_status')
 if(error)throw Error('AUTH_EMAIL_LEDGER_UNAVAILABLE');
 return {...(data as Record<string,unknown>),runtime:{authOrigin:process.env.NEXT_PUBLIC_SUPABASE_URL||null,marketplaceOrigin:process.env.ANGELCARE_AUTH_EMAIL_MARKETPLACE_ORIGIN||'https://my.angelcarehub.com',workerSecretConfigured:(process.env.ANGELCARE_AUTH_EMAIL_WORKER_SECRET||'').length>=32,bridgeUrlConfigured:Boolean(process.env.EMAIL_OS_BRIDGE_URL?.trim()),bridgeTokenConfigured:Boolean(process.env.EMAIL_OS_BRIDGE_TOKEN?.trim()),sender:'supports@angelcarehub.ma'},inboxDelivery:'not_observed'}
}
