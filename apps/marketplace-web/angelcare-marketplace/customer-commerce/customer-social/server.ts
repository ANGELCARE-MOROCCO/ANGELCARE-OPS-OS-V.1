import {randomBytes} from 'node:crypto'
import {cookies} from 'next/headers'
import {createServiceClient,createUserClient} from '@/lib/supabase/server'
import {getSupabaseEnv} from '@/lib/supabase/env'
import {apiFailure,apiSuccess,parseJsonObject,requestId} from '../../server/request'
import {MarketplaceError} from '../../server/errors'
import {requireCustomerSameOrigin} from '../customer-access-api'
import {customerPublicOrigin} from '../customer-auth-links'
import {customerAuthHref,customerReturnTo} from '../auth-navigation'
import {claimGuestCommerce,getCustomerContext} from '../customer-auth'
import {localeValue} from '../validation'
import {CUSTOMER_SOCIAL_REVISION,SOCIAL_COOKIE,SOCIAL_PROVIDERS,completionHref,readSocialFlow,socialProvider,supportedSocialIdentity,validatedSocialProfile,type SocialFlow} from './contracts'

type Row=Record<string,unknown>
function socialApiFailure(error:unknown,rid:string){
 const message=error instanceof Error?error.message:''
 if(message.startsWith('SOCIAL_')){const field=message.includes('CONSENT')?'accepted':message.includes('NAME')?'fullName':message.includes('PHONE')?'phone':message.includes('ACCOUNT_KIND')?'accountKind':'provider';return apiFailure(new MarketplaceError('VALIDATION_ERROR','Vérifiez les informations du dossier.',{fieldErrors:{[field]:['Valeur requise ou invalide.']}}),rid)}
 return apiFailure(error,rid)
}
export async function socialReadiness(){
 const env=getSupabaseEnv(),providers={google:false,facebook:false,apple:false};let profileReady=false,settingsAvailable=false
 try{
  if(!env.url||!env.anonKey)return{providers,profileReady,settingsAvailable}
  const db=await createServiceClient()
  const [settings,ledger]=await Promise.allSettled([fetch(env.url.replace(/\/$/,'')+'/auth/v1/settings',{headers:{apikey:env.anonKey},cache:'no-store',signal:AbortSignal.timeout(8000)}),db.rpc('angelcare_marketplace_customer_social_ready').abortSignal(AbortSignal.timeout(8000))])
  if(settings.status==='fulfilled'&&settings.value.ok){const data=await settings.value.json();for(const p of SOCIAL_PROVIDERS)providers[p]=data.external?.[p]===true;settingsAvailable=true}
  profileReady=ledger.status==='fulfilled'&&!ledger.value.error&&ledger.value.data===CUSTOMER_SOCIAL_REVISION
 }catch{/* Configuration failure never advertises a ready provider. */}
 return{providers,profileReady,settingsAvailable}
}
function failure(message:string,code:'VALIDATION_ERROR'|'AUTHENTICATION_REQUIRED'|'PERMISSION_DENIED'|'CONFIGURATION_ERROR'='VALIDATION_ERROR'):never{throw new MarketplaceError(code,message)}
export async function currentSocialProfile(){
 const client=await createUserClient(),auth=await client.auth.getUser(),user=auth.data.user
 if(auth.error||!user||!user.email||!user.email_confirmed_at)failure('Une identité avec email confirmé est requise.','AUTHENTICATION_REQUIRED')
 const provider=supportedSocialIdentity(user);if(!provider)failure('Cette session ne vient pas d’un fournisseur client autorisé.','AUTHENTICATION_REQUIRED')
 const db=await createServiceClient(),result=await db.from('angelcare_marketplace_customer_accounts').select('id,status,display_name,phone,account_kind').eq('auth_user_id',user.id).maybeSingle()
 if(result.error)failure('Dossier client momentanément indisponible.','CONFIGURATION_ERROR')
 const account=result.data as Row|null;if(account&&!['active','pending_verification'].includes(String(account.status)))failure('Ce compte ne peut pas accéder au portail.','PERMISSION_DENIED')
 const metadata=user.user_metadata||{}
 return{user,provider,account,view:{email:user.email,name:account?String(account.display_name||''):String(metadata.full_name||metadata.name||''),phone:account?String(account.phone||''):'',accountKind:account?String(account.account_kind||'family'):'family',provider,complete:Boolean(account)}}
}
export async function handleSocialReadiness(request:Request){const rid=requestId(request);try{return apiSuccess(await socialReadiness(),{requestId:rid})}catch(e){return socialApiFailure(e,rid)}}
export async function handleSocialStart(request:Request){const rid=requestId(request);try{
 requireCustomerSameOrigin(request);const body=await parseJsonObject(request),provider=socialProvider(body.provider),locale=localeValue(body.locale)
 const ready=await socialReadiness();if(!ready.profileReady||!ready.providers[provider])failure('Ce moyen de connexion n’est pas encore disponible.','CONFIGURATION_ERROR')
 const flow:SocialFlow={provider,locale,intent:body.intent==='register'?'register':'login',destination:customerReturnTo(body.returnTo,locale),nonce:randomBytes(32).toString('hex'),createdAt:Date.now()}
 const origin=customerPublicOrigin(request),callback=new URL('/angelcare-marketplace/auth/social/callback',origin);callback.searchParams.set('nonce',flow.nonce)
 const client=await createUserClient(),result=await client.auth.signInWithOAuth({provider,options:{redirectTo:callback.toString(),skipBrowserRedirect:true,...(provider==='facebook'?{scopes:'email'}:{})}})
 if(result.error||!result.data.url)failure('Connexion au fournisseur indisponible.','CONFIGURATION_ERROR')
 const url=new URL(result.data.url),expected=new URL(getSupabaseEnv().url);if(url.origin!==expected.origin||url.pathname!==expected.pathname.replace(/\/$/,'')+'/auth/v1/authorize'||url.username||url.password)failure('Destination Auth invalide.','CONFIGURATION_ERROR')
 const store=await cookies();store.set(SOCIAL_COOKIE,JSON.stringify(flow),{httpOnly:true,secure:new URL(origin).protocol==='https:',sameSite:'lax',path:'/angelcare-marketplace/auth/social/callback',maxAge:600})
 return apiSuccess({url:url.toString()},{requestId:rid})
 }catch(e){return socialApiFailure(e,rid)}}
export async function handleSocialCallback(request:Request){
 const url=new URL(request.url),store=await cookies();let flow:SocialFlow|null=null,exchanged=false
 const response=(target:string)=>new Response(null,{status:303,headers:{Location:new URL(target,customerPublicOrigin(request)).toString(),'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}})
 try{
  flow=readSocialFlow(store.get(SOCIAL_COOKIE)?.value,url.searchParams.get('nonce'))
  if(url.searchParams.has('error')||!url.searchParams.get('code'))failure('Connexion annulée ou incomplète.','AUTHENTICATION_REQUIRED')
  const client=await createUserClient(),result=await client.auth.exchangeCodeForSession(url.searchParams.get('code')!)
  if(result.error)failure('Le lien de connexion est invalide ou expiré.','AUTHENTICATION_REQUIRED');exchanged=true
  const current=await currentSocialProfile();if(!current.user.identities?.some(i=>i.provider===flow!.provider))failure('Fournisseur inattendu.','AUTHENTICATION_REQUIRED')
  if(!current.account)return response(completionHref(flow.locale,flow.destination))
  const context=await getCustomerContext();if(!context)failure('Le dossier client doit être complété.','AUTHENTICATION_REQUIRED')
  const visitor=store.get('ac_marketplace_visitor')?.value;if(visitor&&/^[a-f\d-]{36}$/i.test(visitor))await claimGuestCommerce({visitorReference:visitor,account:context.account})
  return response(flow.destination)
 }catch{
  if(exchanged){try{const client=await createUserClient();await client.auth.signOut({scope:'local'})}catch{/* return to the customer screen without exposing provider diagnostics */}}
  const target=customerAuthHref(flow?.locale||'fr',flow?.intent==='register'?'register':'login',flow?.destination);return response(target+'&socialError=1')
 }finally{store.set(SOCIAL_COOKIE,'',{httpOnly:true,sameSite:'lax',path:'/angelcare-marketplace/auth/social/callback',maxAge:0,secure:url.protocol==='https:'})}
}
export async function handleSocialProfile(request:Request){const rid=requestId(request);try{
 const current=await currentSocialProfile()
 if(request.method==='GET')return apiSuccess(current.view,{requestId:rid})
 if(request.method!=='POST')throw new MarketplaceError('METHOD_NOT_ALLOWED','Méthode non prise en charge.')
 requireCustomerSameOrigin(request);const body=await parseJsonObject(request),profile=validatedSocialProfile(body),locale=localeValue(body.locale),destination=customerReturnTo(body.returnTo,locale)
 if(!current.account){
  const db=await createServiceClient(),saved=await db.rpc('angelcare_marketplace_complete_customer_social_profile',{p_user_id:current.user.id,p_provider:current.provider,p_full_name:profile.fullName,p_phone:profile.phone,p_account_kind:profile.accountKind,p_locale:locale,p_accepted:profile.accepted,p_consent_version:CUSTOMER_SOCIAL_REVISION})
  if(saved.error||!saved.data)failure('Le dossier n’a pas pu être enregistré. Vos saisies sont conservées.','CONFIGURATION_ERROR')
 }
 const context=await getCustomerContext();if(!context)failure('Le dossier enregistré nécessite une vérification.','CONFIGURATION_ERROR')
 const visitor=(await cookies()).get('ac_marketplace_visitor')?.value;if(visitor&&/^[a-f\d-]{36}$/i.test(visitor))await claimGuestCommerce({visitorReference:visitor,account:context.account})
 // Public hints for existing email/localisation flows; never a profile-completion authority.
 try{const client=await createUserClient();await client.auth.updateUser({data:{full_name:context.account.display_name,phone:context.account.phone,locale:context.account.preferred_locale,marketplace_account_kind:context.account.account_kind}})}catch{/* The canonical customer record remains authoritative. */}
 return apiSuccess({complete:true,reference:context.account.public_reference,returnTo:destination},{requestId:rid})
 }catch(e){return socialApiFailure(e,rid)}}
