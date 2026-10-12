import type {CatalogLocale} from '../../catalog-discovery/types'
import {customerReturnTo} from '../auth-navigation'
export const CUSTOMER_SOCIAL_REVISION='customer-social-r1-20261012'
export const SOCIAL_PROVIDERS=['google','facebook','apple'] as const
export type SocialProvider=typeof SOCIAL_PROVIDERS[number]
export type SocialFlow={nonce:string;provider:SocialProvider;locale:CatalogLocale;intent:'login'|'register';destination:string;createdAt:number}
export const SOCIAL_COOKIE='ac_customer_social_flow'
export function socialProvider(value:unknown):SocialProvider{if(!SOCIAL_PROVIDERS.includes(value as SocialProvider))throw Error('SOCIAL_PROVIDER_INVALID');return value as SocialProvider}
export function supportedSocialIdentity(user:{identities?:Array<{provider?:string}>|null}):SocialProvider|null{return SOCIAL_PROVIDERS.find(p=>user.identities?.some(i=>i.provider===p))||null}
export function completionHref(locale:CatalogLocale,returnTo:unknown):string{return `/angelcare-marketplace/${locale}/auth/complete-profile?returnTo=${encodeURIComponent(customerReturnTo(returnTo,locale))}`}
export function readSocialFlow(encoded:unknown,nonce:unknown,now=Date.now()):SocialFlow{
 if(typeof encoded!=='string'||encoded.length>6000)throw Error('SOCIAL_FLOW_MISSING')
 const value=JSON.parse(encoded) as SocialFlow
 socialProvider(value.provider)
 if(!['fr','en','ar'].includes(value.locale)||!['login','register'].includes(value.intent)||typeof value.nonce!=='string'||!/^[a-f0-9]{64}$/.test(value.nonce)||value.nonce!==nonce||!Number.isFinite(value.createdAt)||value.createdAt>now+60000||now-value.createdAt>600000)throw Error('SOCIAL_FLOW_INVALID')
 return{...value,destination:customerReturnTo(value.destination,value.locale)}
}
export function validatedSocialProfile(input:Record<string,unknown>):{fullName:string;phone:string;accountKind:'family'|'organization';accepted:true}{
 if(input.accepted!==true)throw Error('SOCIAL_CONSENT_REQUIRED')
 if(typeof input.fullName!=='string'||input.fullName.trim().length<2||input.fullName.trim().length>180||/[\u0000-\u001f\u007f]/.test(input.fullName))throw Error('SOCIAL_NAME_INVALID')
 if(typeof input.phone!=='string')throw Error('SOCIAL_PHONE_INVALID')
 const phone=input.phone.trim().replace(/[\s().-]/g,'');if(!/^\+?\d{8,18}$/.test(phone))throw Error('SOCIAL_PHONE_INVALID')
 if(input.accountKind!=='family'&&input.accountKind!=='organization')throw Error('SOCIAL_ACCOUNT_KIND_INVALID')
 return{fullName:input.fullName.trim(),phone,accountKind:input.accountKind,accepted:true}
}
