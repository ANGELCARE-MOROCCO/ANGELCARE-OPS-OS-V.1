import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
// Source-only checks on Node 24: resolve the new renderer's relative TS modules.
registerHooks({resolve(specifier,context,nextResolve){
 try{return nextResolve(specifier,context)}catch(error){
  if(error.code==='ERR_MODULE_NOT_FOUND'&&specifier.startsWith('.')&&/\/(customer-email-design\/|auth-email-native\/messages\.ts)/.test(context.parentURL||'')&&!/\.[a-z]+$/i.test(specifier))return nextResolve(specifier+'.ts',context)
  throw error
 }
}})
const { composeAuthEmail, classifyDeliveryError, escapeHtml } = await import('../../angelcare-marketplace/customer-commerce/auth-email-native/messages.ts')
let checks=0
function check(name,fn){fn();checks++;console.log('PASS '+name)}
const config={authOrigin:'https://angelcare-supabase.duckdns.org',marketplaceOrigin:'https://my.angelcarehub.com'}
const base={id:'job',lease_token:'lease',attempts:1,action:'signup',recipient_slot:'primary',payload:{user:{id:'user',email:'customer@example.com',user_metadata:{locale:'fr',marketplace_account_kind:'family'}},email_data:{email_action_type:'signup',token:'123456',token_hash:'abcdefghijklmnop1234567890',redirect_to:'https://my.angelcarehub.com/angelcare-marketplace/auth/callback?locale=fr&returnTo=%2Faccount&code=stale'}}}
function job(action='signup',locale='fr'){const j=structuredClone(base);j.action=action;j.payload.email_data.email_action_type=action;j.payload.user.user_metadata.locale=locale;return j}
for(const locale of ['fr','en','ar'])for(const action of ['signup','recovery','magiclink','invite','reauthentication','password_changed_notification'])check(locale+'_'+action,()=>{const m=composeAuthEmail(job(action,locale),config);assert.equal(m.sender,'supports@angelcarehub.ma');assert.equal(m.locale,locale);assert.ok(m.subject&&m.html&&m.text);assert.ok(m.html.includes(`dir="${locale==='ar'?'rtl':'ltr'}"`));if(action==='reauthentication')assert.ok(m.text.includes('123456'));else assert.ok(!m.text.includes('Code de sécurité: 123456'));if(action.endsWith('_notification'))assert.ok(!m.text.includes('token='))})
for(const action of ['signup','recovery','magiclink'])check(action+'_callback_continuity',()=>{const m=composeAuthEmail(job(action),config);const link=new URL(m.text.match(/https:\/\/[^\s]+/)[0]);assert.equal(link.pathname,'/angelcare-marketplace/auth/callback');assert.equal(link.searchParams.get('type'),action);assert.equal(link.searchParams.get('flow'),action==='magiclink'?'magic':action);assert.equal(link.searchParams.get('returnTo'),'/account');assert.equal(link.searchParams.get('code'),null)})
for(const [slot,email,hash] of [['current','customer@example.com','newhashabcdefgh1234567890'],['new','new@example.com','abcdefghijklmnop1234567890']])check('email_change_'+slot,()=>{const j=job('email_change');j.recipient_slot=slot;j.payload.user.new_email='new@example.com';j.payload.email_data.token_hash_new='newhashabcdefgh1234567890';const m=composeAuthEmail(j,config);assert.equal(m.recipient,email);const link=new URL(m.text.match(/https:\/\/[^\s]+/)[0]);assert.equal(link.searchParams.get('token'),hash);assert.equal(link.searchParams.get('type'),'email_change')})
check('single_email_change',()=>{const j=job('email_change');j.recipient_slot='new';j.payload.user.new_email='new@example.com';assert.equal(composeAuthEmail(j,config).recipient,'new@example.com')})
for(const bad of ['https://evil.example/auth','https://user:pass@my.angelcarehub.com/auth','javascript:alert(1)','http://my.angelcarehub.com/auth'])check('reject_'+bad,()=>{const j=job();j.payload.email_data.redirect_to=bad;assert.throws(()=>composeAuthEmail(j,config))})
for(const origin of ['https://opsmanagement.angelcarehub.com','https://ops.angelcarehub.com','http://localhost:3000','https://project-angelcare-its-projects.vercel.app'])check('native_destination_'+origin,()=>{const j=job();j.payload.email_data.redirect_to=origin+'/auth/callback';const m=composeAuthEmail(j,config);assert.equal(m.sender,'it.support@angelcarehub.ma');const link=new URL(m.text.match(/https:\/\/[^\s]+/)[0]);assert.equal(link.origin,config.authOrigin);assert.equal(new URL(link.searchParams.get('redirect_to')).origin,origin)})
check('unknown_preview_rejected',()=>{const j=job();j.payload.email_data.redirect_to='https://project-other.vercel.app/auth';assert.throws(()=>composeAuthEmail(j,config))})
check('missing_customer_redirect',()=>{const j=job();delete j.payload.email_data.redirect_to;j.payload.email_data.site_url='https://opsmanagement.angelcarehub.com';assert.equal(composeAuthEmail(j,config).sender,'supports@angelcarehub.ma')})
check('existing_ops_default',()=>{const j=job();delete j.payload.email_data.redirect_to;delete j.payload.user.user_metadata.marketplace_account_kind;j.payload.email_data.site_url='https://opsmanagement.angelcarehub.com';assert.equal(composeAuthEmail(j,config).sender,'it.support@angelcarehub.ma')})
check('invalid_recipient',()=>{const j=job();j.payload.user.email='bad\r\nBcc:evil@example.com';assert.throws(()=>composeAuthEmail(j,config))})
check('invalid_hash',()=>{const j=job();j.payload.email_data.token_hash='bad';assert.throws(()=>composeAuthEmail(j,config))})
check('invalid_otp',()=>{const j=job('reauthentication');j.payload.email_data.token='<script>';assert.throws(()=>composeAuthEmail(j,config))})
check('unsupported_action',()=>assert.throws(()=>composeAuthEmail(job('unrelated'),config)))
check('html_escape',()=>assert.equal(escapeHtml('<>&"\''),'&lt;&gt;&amp;&quot;&#39;'))
for(const [error,state,code] of [[{responseCode:535},'retry_wait','SMTP_AUTH_535'],[{diagnostics:{bridgeResponseBodyPreview:'SMTP 535 secret value'}},'retry_wait','SMTP_AUTH_535'],[{responseCode:421},'retry_wait','SMTP_TRANSIENT'],[{responseCode:550},'failed','SMTP_RECIPIENT_REJECTED'],[{message:'BRIDGE_REQUIRED'},'failed','AUTH_EMAIL_CONFIGURATION'],[{code:'ETIMEDOUT'},'delivery_unknown','DELIVERY_ACKNOWLEDGEMENT_UNKNOWN']])check('classify_'+code,()=>assert.deepEqual(classifyDeliveryError(error),{state,code}))
const sql=readFileSync(new URL('../../database/marketplace-auth-email-native-r1.sql',import.meta.url),'utf8')
check('sql_is_scoped',()=>{assert.ok(!/update\s+auth\.users|delete\s+from\s+auth\.users|drop\s+table/i.test(sql));assert.ok(sql.includes('security invoker'));assert.ok(sql.includes('security definer set search_path=pg_catalog'));assert.ok(sql.includes('for update skip locked'));assert.ok(sql.includes('lease_token=p_lease'));assert.ok(sql.includes('revoke all on function public.angelcare_marketplace_auth_email_hook(jsonb) from public,anon,authenticated,service_role'))})
console.log(`OFFLINE_AUTH_EMAIL=${checks}/${checks} PASS; no network, SQL execution or email sent`)
