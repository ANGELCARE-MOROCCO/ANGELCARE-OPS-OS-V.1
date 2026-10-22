import { renderAuthCustomerEmail } from '../customer-email-design/auth'
import { authOperationsMailbox } from '../../../lib/email-os-core/operational-mailboxes'
/** Auth owns tokens/accounts. This module only composes the native delivery. */
export type AuthLocale = 'fr' | 'en' | 'ar'
export type AuthEmailPayload = {
 user: { id: string; email: string; new_email?: string; user_metadata?: { locale?: string; marketplace_account_kind?: string } }
 email_data: { email_action_type: string; token?: string; token_hash?: string; token_new?: string; token_hash_new?: string; redirect_to?: string; site_url?: string; old_email?: string; old_phone?: string; provider?: string; factor_type?: string }
}
export type AuthEmailJob = { id: string; lease_token: string; action: string; recipient_slot: 'primary' | 'current' | 'new'; payload: AuthEmailPayload; attempts: number }
export type EmailConfig = { authOrigin: string; marketplaceOrigin: string; redirectOrigins?: string[]; allowDevelopment?: boolean }
export type AuthMessage = { sender: string; recipient: string; subject: string; html: string; text: string; action: string; locale: AuthLocale; link: string }
const copy = {
 fr: { signup: ['Confirmez votre compte AngelCare','Votre espace AngelCare vous attend. Confirmez votre adresse email pour terminer votre inscription.','Confirmer mon adresse'], recovery: ['Réinitialisez votre mot de passe AngelCare','Vous avez demandé à récupérer votre accès. Choisissez un nouveau mot de passe grâce à votre lien sécurisé.','Choisir mon nouveau mot de passe'], magiclink: ['Votre lien de connexion AngelCare','Utilisez ce lien personnel pour accéder à votre espace AngelCare.','Accéder à mon espace'], invite: ['Votre invitation AngelCare','Une invitation vous permet de rejoindre AngelCare. Utilisez votre lien sécurisé pour continuer.','Accepter mon invitation'], email_change: ['Confirmez votre changement d’adresse AngelCare','Confirmez cette étape du changement de votre adresse email. Deux confirmations peuvent être nécessaires si la protection renforcée est activée.','Confirmer cette adresse'], reauthentication: ['Votre code de sécurité AngelCare','Saisissez ce code dans la fenêtre AngelCare qui vous le demande.',''], notification: ['Sécurité de votre compte AngelCare','Une modification de sécurité a été enregistrée pour votre compte. Si vous ne reconnaissez pas cette opération, contactez notre assistance.',''], code: 'Code de sécurité', disclaimer: 'Si vous n’avez pas demandé cette opération, ignorez ce message. Ne partagez jamais votre lien ou votre code. Les liens et codes sont temporaires et à usage unique.', help: 'Besoin d’aide ? supports@angelcarehub.ma', link: 'Si le bouton ne fonctionne pas, utilisez ce lien :' },
 en: { signup: ['Confirm your AngelCare account','Your AngelCare space is ready for you. Confirm your email address to finish signing up.','Confirm my email'], recovery: ['Reset your AngelCare password','You requested access recovery. Use your secure link to choose a new password.','Choose my new password'], magiclink: ['Your AngelCare sign-in link','Use this personal link to access your AngelCare space.','Access my account'], invite: ['Your AngelCare invitation','You have been invited to join AngelCare. Continue using your secure link.','Accept my invitation'], email_change: ['Confirm your AngelCare email change','Confirm this step of your email address change. Enhanced protection may require confirmation from both addresses.','Confirm this address'], reauthentication: ['Your AngelCare security code','Enter this code in the AngelCare screen requesting it.',''], notification: ['Your AngelCare account security','A security change has been recorded for your account. Contact support if you do not recognise this action.',''], code: 'Security code', disclaimer: 'If you did not request this action, ignore this message. Never share your link or code. Links and codes expire and can only be used once.', help: 'Need help? supports@angelcarehub.ma', link: 'If the button does not work, use this link:' },
 ar: { signup: ['تأكيد حسابك في AngelCare','مساحتك في AngelCare بانتظارك. أكّد عنوان بريدك الإلكتروني لإكمال التسجيل.','تأكيد بريدي الإلكتروني'], recovery: ['إعادة تعيين كلمة مرور AngelCare','لقد طلبت استعادة الوصول إلى حسابك. استخدم رابطك الآمن لاختيار كلمة مرور جديدة.','اختيار كلمة مرور جديدة'], magiclink: ['رابط الدخول إلى AngelCare','استخدم هذا الرابط الشخصي للدخول إلى مساحتك في AngelCare.','الدخول إلى حسابي'], invite: ['دعوتك للانضمام إلى AngelCare','لقد تمت دعوتك للانضمام إلى AngelCare. تابع باستخدام رابطك الآمن.','قبول الدعوة'], email_change: ['تأكيد تغيير البريد الإلكتروني في AngelCare','أكّد هذه الخطوة من تغيير عنوان بريدك. قد تتطلب الحماية المعززة تأكيدًا من العنوانين.','تأكيد هذا العنوان'], reauthentication: ['رمز الأمان الخاص بك في AngelCare','أدخل هذا الرمز في شاشة AngelCare التي تطلبه.',''], notification: ['أمان حسابك في AngelCare','تم تسجيل تغيير أمني في حسابك. تواصل مع الدعم إذا لم تتعرف على هذه العملية.',''], code: 'رمز الأمان', disclaimer: 'إذا لم تطلب هذه العملية، تجاهل هذه الرسالة. لا تشارك الرابط أو الرمز مع أي شخص. الروابط والرموز مؤقتة وتُستخدم مرة واحدة فقط.', help: 'للمساعدة: supports@angelcarehub.ma', link: 'إذا لم يعمل الزر، استخدم هذا الرابط:' }
} as const
export function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c] || c)) }
function address(value: unknown): string { const s=typeof value==='string'?value.trim():''; if(s.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(s)||/[<>\r\n\x00]/.test(s)) throw Error('AUTH_EMAIL_RECIPIENT_INVALID'); return s }
function secureOrigin(value: string, development=false): string { const u=new URL(value); if(u.username||u.password||!(u.protocol==='https:'||(development&&u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname))))throw Error('AUTH_EMAIL_ORIGIN_INVALID'); return u.origin }
function redirect(value: unknown, config: EmailConfig): URL {
 const marketplace=secureOrigin(config.marketplaceOrigin,config.allowDevelopment)
 const u=new URL(typeof value==='string'&&value?value:marketplace)
 const allowed=[marketplace,'https://opsmanagement.angelcarehub.com','https://ops.angelcarehub.com',...(config.redirectOrigins||[])].map(s=>secureOrigin(s,config.allowDevelopment))
 const legacyDevelopment=u.origin==='http://localhost:3000'
 const legacyPreview=u.protocol==='https:'&&/^[a-z0-9][a-z0-9-]*-angelcare-its-projects\.vercel\.app$/.test(u.hostname)
 if(u.username||u.password||(!allowed.includes(u.origin)&&!legacyDevelopment&&!legacyPreview))throw Error('AUTH_EMAIL_REDIRECT_NOT_ALLOWED')
 return u
}
export function composeAuthEmail(job: AuthEmailJob, config: EmailConfig): AuthMessage {
 const p=job.payload, e=p?.email_data, user=p?.user
 if(!user?.id||!e||e.email_action_type!==job.action)throw Error('AUTH_EMAIL_PAYLOAD_INVALID')
 const lang=user.user_metadata?.locale; const locale: AuthLocale=lang==='en'||lang==='ar'?lang:'fr'
 const t=copy[locale], action=e.email_action_type
 const notification=action.endsWith('_notification')
 if(!['signup','recovery','magiclink','invite','email_change','reauthentication'].includes(action)&&!notification)throw Error('AUTH_EMAIL_ACTION_UNSUPPORTED')
 const key=notification?'notification':action as 'signup'|'recovery'|'magiclink'|'invite'|'email_change'|'reauthentication'
 const explicit=e.redirect_to||''
 const customer=['family','organization'].includes(user.user_metadata?.marketplace_account_kind||'')
 const destination=redirect(explicit||(!customer?e.site_url:'')||config.marketplaceOrigin,config)
 const sender=authOperationsMailbox(destination,secureOrigin(config.marketplaceOrigin,config.allowDevelopment))
 const help=t.help.replace('supports@angelcarehub.ma',sender)
 let to=address(user.email), hash=e.token_hash||'', token=e.token||''
 if(action==='email_change') {
  const dual=Boolean(e.token_hash&&e.token_hash_new)
  if(job.recipient_slot==='current'&&dual){hash=e.token_hash_new||'';token=e.token||''}
  else if(job.recipient_slot==='new'){to=address(user.new_email);hash=e.token_hash||'';token=e.token_new||e.token||''}
  else throw Error('AUTH_EMAIL_CHANGE_SLOT_INVALID')
 } else if(job.recipient_slot!=='primary')throw Error('AUTH_EMAIL_SLOT_INVALID')
 let link=''
 if(!notification&&action!=='reauthentication') {
  if(!/^[a-zA-Z0-9_-]{16,256}$/.test(hash))throw Error('AUTH_EMAIL_TOKEN_HASH_INVALID')
  if(destination.origin===secureOrigin(config.marketplaceOrigin,config.allowDevelopment)&&destination.pathname==='/angelcare-marketplace/auth/callback'&&['signup','recovery','magiclink'].includes(action)) {
   destination.searchParams.delete('code');destination.searchParams.delete('error');destination.searchParams.delete('error_description')
   destination.searchParams.set('token_hash',hash);destination.searchParams.set('type',action)
   destination.searchParams.set('flow',action==='magiclink'?'magic':action)
   link=destination.toString()
  } else {
   const u=new URL('/auth/v1/verify',secureOrigin(config.authOrigin,config.allowDevelopment))
   u.searchParams.set('token',hash);u.searchParams.set('type',action);u.searchParams.set('redirect_to',destination.toString());link=u.toString()
  }
 }
 if(action==='reauthentication'&&!/^[a-zA-Z0-9]{4,20}$/.test(token))throw Error('AUTH_EMAIL_SECURITY_CODE_INVALID')
 // OTP is deliberately limited to the flow that needs a typed code.
 const shownCode=action==='reauthentication'?token:''
 const [subject,intro,button]=t[key]
 const text=[subject,intro,link?button+': '+link:'',shownCode?t.code+': '+shownCode:'',t.disclaimer,help].filter(Boolean).join('\n\n')
 const legacyHtml=`<!doctype html><html lang="${locale}" dir="${locale==='ar'?'rtl':'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f5f3fa;font-family:Arial,sans-serif;color:#202039"><table role="presentation" style="width:100%;padding:28px 14px"><tr><td align="center"><table role="presentation" style="width:100%;max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden"><tr><td style="padding:7px;background:linear-gradient(90deg,#ec4e91,#8f6cda,#2fbbb8,#efbb53)"></td></tr><tr><td style="padding:32px"><p style="font-size:18px;font-weight:800;letter-spacing:2px;color:#803fa8;margin-top:0">ANGELCARE</p><h1 style="font-size:24px;line-height:1.3">${escapeHtml(subject)}</h1><p style="font-size:16px;line-height:1.8">${escapeHtml(intro)}</p>${link?`<p style="margin:28px 0"><a href="${escapeHtml(link)}" style="display:inline-block;background:#a143ae;color:#fff;padding:16px 24px;border-radius:14px;text-decoration:none;font-weight:bold">${escapeHtml(button)}</a></p><p style="font-size:12px;color:#626273">${escapeHtml(t.link)}</p><p style="font-size:12px;overflow-wrap:anywhere;word-break:break-all"><a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p>`:''}${shownCode?`<p>${escapeHtml(t.code)}</p><p dir="ltr" style="padding:18px;background:#f7eaf9;border-radius:12px;font-size:28px;letter-spacing:6px;text-align:center">${escapeHtml(shownCode)}</p>`:''}<hr style="border:0;border-top:1px solid #eee7f1;margin:28px 0"><p style="font-size:12px;line-height:1.8;color:#626273">${escapeHtml(t.disclaimer)}</p><p style="font-size:12px"><a href="mailto:supports@angelcarehub.ma">${escapeHtml(t.help)}</a></p></td></tr></table></td></tr></table></body></html>`
 const premium=sender==='supports@angelcarehub.ma'?renderAuthCustomerEmail({locale,origin:secureOrigin(config.marketplaceOrigin,config.allowDevelopment),action,subject,intro,buttonLabel:button,link,codeLabel:t.code,code:shownCode,security:t.disclaimer,allowDevelopment:config.allowDevelopment}):null
 return {sender,recipient:to,subject,html:premium?.html||legacyHtml.replaceAll('supports@angelcarehub.ma',sender),text:premium?.text||text,action,locale,link}
}
/** Only structured known failures are retryable. A lost acknowledgement stays unknown. */
export function classifyDeliveryError(error: unknown): {state:'retry_wait'|'failed'|'delivery_unknown';code:string} {
 const e=error&&typeof error==='object'?error as Record<string,unknown>:{}
 const d=e.diagnostics&&typeof e.diagnostics==='object'?e.diagnostics as Record<string,unknown>:{}
 // Read provider detail for classification only; never persist raw tokens, recipients or passwords.
 const value=String(e.responseCode||'')+' '+String(e.code||'')+' '+String(e.message||'')+' '+String(d.bridgeResponseBodyPreview||'')
 if(/\b535\b|EAUTH/.test(value))return {state:'retry_wait',code:'SMTP_AUTH_535'}
 if(/\b(421|450|451|452)\b/.test(value))return {state:'retry_wait',code:'SMTP_TRANSIENT'}
 if(/AUTH_EMAIL_|SUPPORTS_|BRIDGE_REQUIRED/.test(value))return {state:'failed',code:'AUTH_EMAIL_CONFIGURATION'}
 if(/\b(550|551|552|553|554)\b/.test(value))return {state:'failed',code:'SMTP_RECIPIENT_REJECTED'}
 return {state:'delivery_unknown',code:'DELIVERY_ACKNOWLEDGEMENT_UNKNOWN'}
}
