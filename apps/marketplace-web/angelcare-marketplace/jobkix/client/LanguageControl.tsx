'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Globe2 } from 'lucide-react';
import { LOCALES,isLocale,type Locale } from '../contracts';
import { LANGUAGE_NAMES,t } from '../i18n';
import { switchLocale } from '../routes';
import { useCommand } from './commands';
import { errorText } from '../i18n';
import { useInteractive } from './RuntimeClock';
import s from '../jobkix.module.css';
export interface LanguagePreferences {version:number;timezone:string;emailNotifications:boolean}
export function LanguageControl({locale,preferences}:{locale:Locale;preferences?:LanguagePreferences}){
 const router=useRouter(),[pending,startTransition]=useTransition();
 const command=useCommand(),ready=useInteractive();
 return <div><label className={s.language}><Globe2 size={17} aria-hidden="true"/><span className={s.srOnly}>{t(locale,'language')}</span><select value={locale} aria-busy={!ready||pending||command.pending} disabled={!ready||pending||command.pending} onChange={event=>{const value=event.target.value;if(!isLocale(value))return;startTransition(async()=>{if(preferences){const result=await command.run('settings.save',{locale:value,timezone:preferences.timezone,emailNotifications:preferences.emailNotifications},preferences.version);if(!result)return;}router.push(switchLocale(window.location.pathname+window.location.search+window.location.hash,value));});}}>{LOCALES.map(value=><option key={value} value={value}>{LANGUAGE_NAMES[value]}</option>)}</select></label>{command.error?<p role="alert" className={s.fieldError}>{errorText(locale,command.error.code)}</p>:null}</div>;
}
