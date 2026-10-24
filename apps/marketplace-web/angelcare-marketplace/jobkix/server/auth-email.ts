import { composeAuthEmail,escapeHtml,type AuthEmailJob,type EmailConfig } from '../../customer-commerce/auth-email-native/messages';
import { isLocale,type Locale } from '../contracts';
import { e } from '../experience-copy';
import { t,direction } from '../i18n';
import { authIntent,authContext } from '../auth-navigation';
/** Dispatch only explicit JOBKIX callback journeys. Other identity contexts retain their renderer. */
export function jobkixAuthLocale(job:AuthEmailJob):Locale|null {
 try{const destination=new URL(job.payload.email_data.redirect_to||'');const match=/^\/jobkix\/([^/]+)\/auth\/callback$/.exec(destination.pathname);return match&&isLocale(match[1])?match[1]:null;}catch{return null;}
}
const security:Record<Locale,string>={
 en:'If you did not request this action, ignore this message. Never share your personal link. It expires and can only be used once.',
 fr:'Si vous n’avez pas demandé cette action, ignorez ce message. Ne partagez jamais ce lien personnel. Il expire et ne peut servir qu’une fois.',
 es:'Si no solicitaste esta acción, ignora este mensaje. Nunca compartas tu enlace personal. Caduca y solo puede usarse una vez.',
 hi:'यदि आपने यह कार्रवाई नहीं माँगी, तो इस संदेश को अनदेखा करें। अपना निजी लिंक कभी साझा न करें। यह सीमित समय और एक बार के उपयोग के लिए है।',
 tl:'Kung hindi mo hiniling ito, balewalain ang mensahe. Huwag ibahagi ang personal mong link. May takdang bisa ito at isang beses lamang magagamit.',
 id:'Jika Anda tidak meminta tindakan ini, abaikan pesan ini. Jangan bagikan tautan pribadi Anda. Tautan memiliki batas waktu dan hanya dapat digunakan sekali.',
 ar:'إذا لم تطلب هذا الإجراء فتجاهل الرسالة. لا تشارك رابطك الشخصي؛ تنتهي صلاحيته ولا يمكن استخدامه إلا مرة واحدة.'
};
export function composeJobkixAuthEmail(job:AuthEmailJob,config:EmailConfig){
 const locale=jobkixAuthLocale(job);if(!locale)throw Error('AUTH_EMAIL_JOBKIX_CONTEXT_INVALID');
 if(!['signup','recovery','magiclink','invite','email_change'].includes(job.action))throw Error('AUTH_EMAIL_JOBKIX_ACTION_UNSUPPORTED');
 // Reuse the existing native token, recipient-slot, allowed-origin and sender authority.
 const native=composeAuthEmail(job,config),destination=new URL(job.payload.email_data.redirect_to||'');
 if(!native.link)throw Error('AUTH_EMAIL_JOBKIX_LINK_MISSING');
 const token=new URL(native.link).searchParams.get('token');if(!token)throw Error('AUTH_EMAIL_JOBKIX_LINK_MISSING');
 const callback=new URL(destination.pathname,destination.origin);
 callback.search=authContext(locale,authIntent(destination.searchParams.get('intent'),destination.searchParams.get('next')),destination.searchParams.get('next')).toString();
 callback.searchParams.set('token_hash',token);callback.searchParams.set('type',job.action);
 const link=callback.href;
 const label=job.action==='recovery'?t(locale,'resetPassword'):job.action==='signup'?e(locale,'confirmation'):t(locale,'continue');
 const subject='JOBKIX · '+label;
 const help=new URL('/jobkix/'+locale+'/help',destination.origin).href;
 const intro=job.action==='recovery'?t(locale,'resetPassword'):e(locale,'confirmation');
 const text=[subject,intro,label+': '+link,security[locale],t(locale,'support')+': '+help].join('\n\n');
 const esc=escapeHtml;
 const html=`<!doctype html><html lang="${locale}" dir="${direction(locale)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f4f5fb;color:#101a32;font-family:Arial,Helvetica,sans-serif"><table role="presentation" style="width:100%;padding:32px 16px"><tr><td align="center"><table role="presentation" style="width:100%;max-width:600px;background:#fff;border:1px solid #e4e7f1;border-radius:12px"><tr><td style="padding:32px;border-bottom:1px solid #e4e7f1"><strong style="font-size:25px">JOBKIX</strong><p style="font-size:10px;letter-spacing:1px">GLOBAL CAREERS PLATFORM</p></td></tr><tr><td style="padding:32px"><h1 style="font-size:26px;line-height:1.4">${esc(label)}</h1><p style="font-size:16px;line-height:1.8">${esc(intro)}</p><p style="margin:28px 0"><a style="display:inline-block;padding:15px 24px;background:#4e43ef;color:#fff;border-radius:7px;font-weight:bold;text-decoration:none" href="${esc(link)}">${esc(label)}</a></p><p style="font-size:12px;word-break:break-all"><a href="${esc(link)}">${esc(link)}</a></p><p style="font-size:13px;line-height:1.8">${esc(security[locale])}</p><p><a href="${esc(help)}">${esc(t(locale,'support'))}</a></p></td></tr><tr><td style="padding:20px 32px;background:#071425;color:white;font-size:12px">JOBKIX · GLOBAL CAREERS PLATFORM</td></tr></table></td></tr></table></body></html>`;
 return {...native,locale,subject,text,html};
}
