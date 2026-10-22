import { createHmac,timingSafeEqual } from 'node:crypto';
import { object,text } from './validation';
import { JobkixFault } from './contracts';
export function guestAccessCode(value:unknown){const normalized=text(value,'accessCode',64,64);if(!/^[a-f0-9]{64}$/.test(normalized))throw new JobkixFault('INVALID_INPUT');return normalized;}
export function guestMac(secret:string,label:string,value:string){if(secret.length<32)throw new JobkixFault('DEPENDENCY_UNAVAILABLE');return createHmac('sha256',secret).update(label+':'+value).digest('hex');}
export function issueGuestCredential(secret:string,token:string,expires:number){guestAccessCode(token);if(!Number.isSafeInteger(expires))throw new JobkixFault('INVALID_INPUT');const body=Buffer.from(JSON.stringify({token,expires})).toString('base64url');return body+'.'+guestMac(secret,'cookie',body);}
export function readGuestCredential(secret:string,value:string|undefined,now=Date.now()){
 if(!value||value.length>500)return null;const [body,signature,...tail]=value.split('.');if(tail.length||!/^[a-f0-9]{64}$/.test(signature||''))return null;
 const expected=Buffer.from(guestMac(secret,'cookie',body)),provided=Buffer.from(signature);if(expected.length!==provided.length||!timingSafeEqual(expected,provided))return null;
 try{const data=object(JSON.parse(Buffer.from(body,'base64url').toString('utf8')));if(typeof data.expires!=='number'||data.expires<=now)return null;return guestAccessCode(data.token);}catch{return null;}
}
