import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createUserClient } from '@/lib/supabase/server';
import { isLocale,type Locale } from '../contracts';
import { authIntent,type AuthIntent } from '../auth-navigation';
import { href,safeReturnTo } from '../routes';

/** The existing shared Supabase cookie client is the sole authentication authority. */
const OAUTH_CONTEXT_COOKIE = 'jobkix_google_oauth_context';
const OAUTH_CONTEXT_PATH = '/api/jobkix/auth/google';
const OAUTH_CALLBACK = '/api/jobkix/auth/google/callback';
const CONTEXT_AGE_SECONDS = 600;
type AuthContext={locale:Locale;intent:AuthIntent;next:string};

function cleanContext(localeInput:unknown,intentInput:unknown,nextInput:unknown):AuthContext{
 const locale:Locale=typeof localeInput==='string'&&isLocale(localeInput)?localeInput:'en';
 const intent=authIntent(intentInput,nextInput);
 const fallback=intent==='hirer'?'hiring':'career';
 const next=safeReturnTo(nextInput,locale,fallback);
 // Prevent returning straight into a reset, sign-in or callback route.
 const target=new URL(next,'https://jobkix.invalid');
 const invitation=target.pathname===href(locale,'onboarding')&&target.searchParams.has('invitation')&&target.searchParams.has('token');
 const unsafe=/^\/jobkix\/[a-z]{2}\/((auth(?:\/|$))|onboarding(?:\/|$)|(?:candidate|hirer)\/sign-(?:in|up)(?:\/|$))/.test(target.pathname)&&!invitation;
 return {locale,intent,next:unsafe?href(locale,fallback):next};
}
function readContext(request:NextRequest):AuthContext|null{
 const raw=request.cookies.get(OAUTH_CONTEXT_COOKIE)?.value;
 if(!raw||raw.length>3500)return null;
 try{
  const obj=JSON.parse(raw) as Record<string,unknown>;
  if(typeof obj.locale!=='string'||!isLocale(obj.locale)||!(obj.intent==='candidate'||obj.intent==='hirer')||typeof obj.next!=='string')return null;
  return cleanContext(obj.locale,obj.intent,obj.next);
 }catch{return null;}
}
function markNoStore(response:NextResponse):NextResponse{
 response.headers.set('Cache-Control','no-store, private');
 response.headers.set('Referrer-Policy','no-referrer');
 return response;
}
function failure(request:NextRequest,context:AuthContext):NextResponse{
 const params=new URLSearchParams({intent:context.intent,next:context.next,state:'link_failed'});
 return markNoStore(NextResponse.redirect(new URL(href(context.locale,context.intent+'/sign-in',params),request.url),303));
}
function clearFlowCookie(response:NextResponse):NextResponse{
 response.cookies.set(OAUTH_CONTEXT_COOKIE,'',{httpOnly:true,sameSite:'lax',secure:response.url.startsWith('https:'),path:OAUTH_CONTEXT_PATH,maxAge:0});
 return response;
}

/** Called from the official-brand button in either candidate/hirer sign-in or sign-up. */
export async function beginJobkixGoogleSignIn(request:NextRequest):Promise<NextResponse>{
 const context=cleanContext(request.nextUrl.searchParams.get('locale'),request.nextUrl.searchParams.get('intent'),request.nextUrl.searchParams.get('next'));
 try{
  const client=await createUserClient();
  // Use an exact redirect URL: no invitation tokens or role information sent to Google.
  const callback=new URL(OAUTH_CALLBACK,request.nextUrl.origin);
  const {data,error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:callback.toString(),skipBrowserRedirect:true}});
  if(error||!data.url)return failure(request,context);
  const provider=new URL(data.url);
  if(provider.protocol!=='https:'&&!(process.env.NODE_ENV==='development'&&provider.hostname==='localhost'))return failure(request,context);
  const response=markNoStore(NextResponse.redirect(provider.toString(),303));
  // Short-lived HttpOnly contextual navigation cookie. The normal Supabase PKCE verifier
  // remains in the shared auth client's cookies, not in this application cookie.
  response.cookies.set(OAUTH_CONTEXT_COOKIE,JSON.stringify(context),{
   httpOnly:true,sameSite:'lax',secure:request.nextUrl.protocol==='https:',path:OAUTH_CONTEXT_PATH,maxAge:CONTEXT_AGE_SECONDS
  });
  return response;
 }catch{return failure(request,context);}
}

/** PKCE exchange back into the exact same Supabase session used by JOBKIX elsewhere. */
export async function completeJobkixGoogleSignIn(request:NextRequest):Promise<NextResponse>{
 const context=readContext(request);
 const fallback:AuthContext=context||{locale:'en',intent:'candidate',next:href('en','career')};
 const code=request.nextUrl.searchParams.get('code');
 if(!context||!code||code.length>2048)return clearFlowCookie(failure(request,fallback));
 try{
  const client=await createUserClient();
  const {error}=await client.auth.exchangeCodeForSession(code);
  if(error)return clearFlowCookie(failure(request,context));
  const {data, error:identityError}=await client.auth.getUser();
  if(identityError||!data.user)return clearFlowCookie(failure(request,context));
  // Existing /onboarding page will: enforce terms/adult consent for new users;
  // route fully onboarded candidate/hirer accounts onward; block restricted users.
  const destination=href(context.locale,'onboarding',new URLSearchParams({intent:context.intent,next:context.next}));
  return clearFlowCookie(markNoStore(NextResponse.redirect(new URL(destination,request.url),303)));
 }catch{return clearFlowCookie(failure(request,context));}
}
