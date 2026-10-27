'use client';
import { useRef,useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '../contracts';
import { readResponse } from './commands';
import { href } from '../routes';
import { t,errorText } from '../i18n';
import s from '../jobkix.module.css';
import { announceJobkixNavigation } from './navigation-buffer-events';
export function SignOut({locale}:{locale:Locale}){
 const router=useRouter(),[pending,setPending]=useState(false),[error,setError]=useState(false),busy=useRef(false);
 async function signOut(){if(busy.current)return;busy.current=true;setPending(true);setError(false);try{await readResponse(await fetch('/api/jobkix/auth/sign-out',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({locale})}));announceJobkixNavigation(href(locale));router.push(href(locale));router.refresh();}catch{setError(true);}finally{busy.current=false;setPending(false);}}
 return <><button className={`${s.button} ${s.quiet}`} onClick={signOut} disabled={pending}>{t(locale,pending?'loading':'signOut')}</button>{error?<p role="alert">{errorText(locale,'DEPENDENCY_UNAVAILABLE')}</p>:null}</>;
}
