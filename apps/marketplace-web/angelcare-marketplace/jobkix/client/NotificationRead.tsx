'use client';
import { useRouter } from 'next/navigation';
import type { Locale } from '../contracts';
import { w } from '../workforce-copy';
import { t,errorText } from '../i18n';
import { useCommand } from './commands';
import s from '../jobkix.module.css';
export function NotificationRead({locale,id}:{locale:Locale;id:string}){const router=useRouter(),command=useCommand();return <div><button className={`${s.button} ${s.secondary}`} type="button" disabled={command.pending} onClick={async()=>{if(await command.run('notification.read',{id}))router.refresh();}}>{command.pending?t(locale,'saving'):w(locale,'markRead')}</button>{command.error?<p className={s.notice} role="alert">{errorText(locale,command.error.code)}</p>:null}</div>;}
