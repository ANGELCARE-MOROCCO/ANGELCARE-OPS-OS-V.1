import { JobkixFault,type Locale } from './contracts';
import { locale as parseLocale,uuid,object,text } from './validation';
import { href } from './routes';
import { w } from './workforce-copy';
import { t,direction } from './i18n';
import { escapeHtml } from '../customer-commerce/auth-email-native/messages';
import { savedSearchFilters } from './account-input';
import { filtersParams } from './discovery';
import { ac } from './account-copy';
export function notificationDestination(value:unknown){
 const context=object(value),locale=parseLocale(context.locale);
 if(context.type==='team.invited')return href(locale,'onboarding',new URLSearchParams({intent:'hirer',invitation:uuid(context.invitationId),token:text(context.token,'token',64,64)}));
 if(context.type==='search.match'){uuid(context.savedSearchId);return href(locale,'career/discovery',filtersParams(savedSearchFilters(context.filters)));}
 const application=uuid(context.applicationId),organization=uuid(context.organizationId);
 if(typeof context.candidate!=='boolean')throw new JobkixFault('INVALID_INPUT');
 return context.candidate?href(locale,'career/applications/'+application):href(locale,'hiring/applications',new URLSearchParams({organization,application}));
}
export function composeOperationalMail(value:unknown,origin:string){
 const context=object(value),locale=parseLocale(context.locale),recipient=text(context.recipient,'recipient',3,320),base=new URL(origin);
 if(base.protocol!=='https:'||base.username||base.password||base.pathname!=='/'||base.search||base.hash||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient))throw new JobkixFault('INVALID_INPUT');
 const link=new URL(notificationDestination(context),base).href,invitation=context.type==='team.invited',alert=context.type==='search.match',label=alert?ac(locale,'openSearch'):w(locale,invitation?'invitationAccept':'openUpdate'),subject='JOBKIX · '+notificationTitle(locale,String(context.type)),body=w(locale,invitation?'invitationHelp':'notificationBody'),privacy=w(locale,'privateLinkHelp');
 const preferences=alert?new URL(href(locale,'career/alerts'),base).href:null;
 const textBody=[subject,body,label+': '+link,privacy,...(preferences?[ac(locale,'editFilters')+': '+preferences]:[])].join('\n\n'),esc=escapeHtml;
 const html=`<!doctype html><html lang="${locale}" dir="${direction(locale)}"><head><meta charset="utf-8"></head><body style="margin:0;background:#f4f5fb;color:#101a32;font-family:Arial,Helvetica,sans-serif;padding:24px"><main style="max-width:600px;margin:auto;background:white;border:1px solid #e4e7f1;border-radius:12px;padding:32px"><strong style="font-size:25px">JOBKIX</strong><p>GLOBAL CAREERS PLATFORM</p><h1 style="font-size:25px;line-height:1.5">${esc(subject)}</h1><p style="font-size:16px;line-height:1.8">${esc(body)}</p><p style="margin:30px 0"><a href="${esc(link)}" style="display:inline-block;padding:15px 24px;background:#4e43ef;color:white;border-radius:8px;font-weight:bold;text-decoration:none">${esc(label)}</a></p><p style="font-size:13px;line-height:1.7">${esc(privacy)}</p><p><a href="${esc(new URL(href(locale,'help'),base).href)}">${esc(t(locale,'support'))}</a></p></main></body></html>`;
 return {recipient,locale,subject,text:textBody,html:preferences?html.replace('</main>',`<p><a href="${esc(preferences)}">${esc(ac(locale,'editFilters'))}</a></p></main>`):html};
}
export function notificationTitle(locale:Locale,type:string){return type==='search.match'?ac(locale,'openSearch'):w(locale,type==='team.invited'?'invite':'notificationTitle');}
