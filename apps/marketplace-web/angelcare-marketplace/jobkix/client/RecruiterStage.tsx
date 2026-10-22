'use client';
import { CommandForm } from './CommandForm';
import { useState,type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale,ApplicationState } from '../contracts';
import type { DataRow } from '../server/repository';
import { APPLICATION_STATUS,applicationStatus } from '../application-copy';
import { recruiterStages } from '../policy';
import { useCommand } from './commands';
import { h } from '../hiring-copy';
import { t,errorText } from '../i18n';
import { str,number } from '../components/Public';
import s from '../jobkix.module.css';
const isState=(value:string):value is ApplicationState=>Object.hasOwn(APPLICATION_STATUS,value);
export function RecruiterStage({locale,application}:{locale:Locale;application:DataRow}){
 const router=useRouter(),command=useCommand(),current=str(application,'state'),options=isState(current)?recruiterStages(current):[],[next,setNext]=useState(''),[confirmed,setConfirmed]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!options.some(value=>value===next)||!confirmed)return;const result=await command.run('application.stage',{applicationId:application.id,state:next},number(application,'version')||0);if(result){setNext('');setConfirmed(false);router.refresh();}}
 if(!options.length)return null;return <section className={s.panel}><h2>{h(locale,'moveStage')}</h2><p>{h(locale,'stageHelp')}</p><CommandForm locale={locale} onSubmit={submit}><fieldset className={s.vacancyEditorFields} disabled={command.pending}><label className={s.field}>{h(locale,'nextStage')}<select value={next} required onChange={event=>{setNext(event.target.value);setConfirmed(false);}}><option value="">{h(locale,'nextStage')}</option>{options.map(state=><option key={state} value={state}>{applicationStatus(locale,state)}</option>)}</select></label><label className={s.checkbox}><input type="checkbox" required checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/><span>{h(locale,'confirmStage')}</span></label><button className={s.button} type="submit">{command.pending?t(locale,'saving'):t(locale,'save')}</button></fieldset>{command.error?<p className={s.notice} role="alert">{errorText(locale,command.error.code)} {t(locale,'inputPreserved')}</p>:null}</CommandForm></section>;
}
