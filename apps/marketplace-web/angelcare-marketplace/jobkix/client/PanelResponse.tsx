'use client';
import { useCurrentTime } from './RuntimeClock';
import {useJobkixRouter as useRouter} from './useJobkixRouter';
import type { Locale } from '../contracts';
import { useCommand } from './commands';
import { t,errorText } from '../i18n';
import { op,operationLabel } from '../operations-copy';
import { st } from '../studio-copy';
import { href } from '../routes';
import s from '../jobkix.module.css';
export function PanelResponse({locale,id,version,response,organizationId,startsAt}:{locale:Locale;id:string;version:number;response:string;organizationId:string;startsAt:string}){
 const now=useCurrentTime(),router=useRouter(),command=useCommand();
 async function respond(value:'accepted'|'declined'){const result=await command.run('interview.panel_respond',{id,response:value},version);if(result){if(value==='declined')router.replace(href(locale,'hiring/interviews',new URLSearchParams({organization:organizationId})));else router.refresh();}}
 return <section className={s.panel}><h2>{op(locale,'panel')}</h2><p className={s.notice}>{operationLabel(locale,response)}</p>{Date.parse(startsAt)>now?<div className={s.inlineActions}><button className={s.button} type="button" disabled={command.pending||response==='accepted'} onClick={()=>respond('accepted')}>{st(locale,'accept')}</button><button className={`${s.button} ${s.secondary}`} type="button" disabled={command.pending} onClick={()=>respond('declined')}>{st(locale,'decline')}</button></div>:null}{command.error?<p className={s.notice} role="alert">{errorText(locale,command.error.code)}</p>:null}</section>;
}
