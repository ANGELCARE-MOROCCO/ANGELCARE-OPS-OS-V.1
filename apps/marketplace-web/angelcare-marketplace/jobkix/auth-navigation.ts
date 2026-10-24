import type { Locale } from './contracts';
import { href,safeReturnTo } from './routes';

export type AuthIntent='candidate'|'hirer';
export function authIntent(input:unknown,next?:unknown):AuthIntent {
 if(input==='hirer'||input==='candidate')return input;
 if(typeof next==='string'){
  try{const url=new URL(next,'https://jobkix.invalid');if(url.origin==='https://jobkix.invalid'&&/^\/jobkix\/[^/]+\/hiring(?:\/|$)/.test(url.pathname))return 'hirer';}catch{/* Use the candidate entry when context is absent. */}
 }
 return 'candidate';
}
export function authContext(locale:Locale,intent:AuthIntent,next:unknown):URLSearchParams {
 return new URLSearchParams({intent,next:safeReturnTo(next,locale,intent==='hirer'?'hiring':'career')});
}
export function authCallbackDestination(locale:Locale,intent:AuthIntent,next:unknown,action:string|null):string {
 const context=authContext(locale,intent,next),destination=context.get('next')!;
 // Older recovery links already carry a reset URL. Do not nest that URL again.
 if(action==='recovery'){
  if(new URL(destination,'https://jobkix.invalid').pathname===href(locale,'auth/reset'))return destination;
  return href(locale,'auth/reset',context);
 }
 return action==='signup'?href(locale,'onboarding',context):destination;
}
