'use client';
import { CommandForm } from './CommandForm';
import { useEffect,useRef,useState,type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { FileText,Upload,Download } from 'lucide-react';
import { JobkixFault,type Locale } from '../contracts';
import type { DataRow } from '../server/repository';
import { str,number } from '../components/Public';
import { readResponse } from './commands';
import { t,errorText } from '../i18n';
import { st } from '../studio-copy';
import s from '../jobkix.module.css';
export function DocumentLibrary({locale,files,organizationId,verification=false}:{locale:Locale;files:DataRow[];organizationId?:string;verification?:boolean}){
 const router=useRouter(),[file,setFile]=useState<File|null>(null),[purpose,setPurpose]=useState(verification?'verification':'cv'),[pending,setPending]=useState(false),[error,setError]=useState<JobkixFault|null>(null),[success,setSuccess]=useState(false),[showArchived,setShowArchived]=useState(false),[resume,setResume]=useState<DataRow|null>(null);
 const key=useRef<string|null>(null),controller=useRef<AbortController|null>(null),mounted=useRef(true),busy=useRef(false),input=useRef<HTMLInputElement>(null);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;controller.current?.abort();};},[]);
 async function upload(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!file||busy.current)return;busy.current=true;setPending(true);setError(null);setSuccess(false);const abort=new AbortController();controller.current=abort;
  try{if(!key.current)key.current=crypto.randomUUID();const params=new URLSearchParams({purpose:resume?str(resume,'purpose'):purpose});if(organizationId)params.set('organizationId',organizationId);
   await readResponse(await fetch('/api/jobkix/files?'+params,{method:'POST',signal:abort.signal,headers:{'Content-Type':resume?str(resume,'mime'):file.type,'X-Jobkix-Filename':encodeURIComponent(resume?str(resume,'filename'):file.name),'X-Jobkix-Idempotency-Key':key.current},body:file}));
   if(mounted.current){setSuccess(true);setFile(null);setResume(null);key.current=null;if(input.current)input.current.value='';router.refresh();}
  }catch(error){if(mounted.current)setError(error instanceof JobkixFault?error:new JobkixFault('DEPENDENCY_UNAVAILABLE'));}
  finally{busy.current=false;if(mounted.current)setPending(false);}
 }
 async function archive(row:DataRow){if(busy.current)return;busy.current=true;setPending(true);setError(null);try{await readResponse(await fetch('/api/jobkix/files/'+str(row,'id'),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({archived:!row.library_archived_at})}));router.refresh();}catch(error){setError(error instanceof JobkixFault?error:new JobkixFault('DEPENDENCY_UNAVAILABLE'));}finally{busy.current=false;if(mounted.current)setPending(false);}}
 return <div className={s.stack}><section className={s.panel}><div className={s.sectionHeading}><div><span className={s.eyebrow}>JOBKIX · {t(locale,'privateByDefault')}</span><h2>{st(locale,'documents')}</h2><p>{st(locale,'fileHelp')}</p></div><Upload aria-hidden="true"/></div>
  <CommandForm locale={locale} onSubmit={upload} className={s.formGrid}><label className={s.field}>{st(locale,'chooseFile')}<input ref={input} type="file" required accept={purpose==='cv'?'.pdf,application/pdf':'.pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg'} onChange={event=>{setFile(event.target.files?.[0]||null);if(!resume)key.current=crypto.randomUUID();setSuccess(false);}}/></label>
   {!verification&&!resume?<label className={s.field}>{st(locale,'documents')}<select value={purpose} onChange={event=>{setPurpose(event.target.value);key.current=crypto.randomUUID();setSuccess(false);}}><option value="cv">CV</option><option value="credential">{st(locale,'education')}</option><option value="portfolio">{st(locale,'experience')}</option><option value="report">{t(locale,'report')}</option></select></label>:null}
   {resume?<p className={s.notice}>{t(locale,'retry')}: {str(resume,'filename')}</p>:null}<div className={s.inlineActions}><button className={s.button} disabled={pending||!file} type="submit">{pending?t(locale,'loading'):st(locale,'upload')}</button>{pending?<button type="button" className={`${s.button} ${s.secondary}`} onClick={()=>controller.current?.abort()}>{t(locale,'cancel')}</button>:null}</div>
  </CommandForm>{pending?<progress aria-label={st(locale,'upload')}/>:null}{error?<p className={s.notice} role="alert">{errorText(locale,error.code)}</p>:null}{success?<p className={s.notice} role="status">{t(locale,'saved')}</p>:null}
 </section><section className={s.panel}><p>{st(locale,'historyKept')}</p><label className={s.checkbox}><input type="checkbox" checked={showArchived} onChange={event=>setShowArchived(event.target.checked)}/><span>{st(locale,'archive')}</span></label><div className={s.documentList}>{files.filter(row=>(showArchived||!row.library_archived_at)&&(!verification||row.organization_id===organizationId)).map(row=><article className={s.documentRow} key={str(row,'id')}><FileText aria-hidden="true"/><div><h3>{str(row,'filename')}</h3><p>{new Intl.NumberFormat(locale,{style:'unit',unit:'megabyte',maximumFractionDigits:1}).format((number(row,'expected_bytes')||0)/1048576)} · {str(row,'mime')}</p><small>{row.state==='ready'?t(locale,'saved'):errorText(locale,'DOCUMENT_NOT_READY')}</small></div><div className={s.inlineActions}>{row.state==='ready'?<a className={`${s.button} ${s.secondary}`} href={'/api/jobkix/files/'+str(row,'id')} download><Download size={16} aria-hidden="true"/>{st(locale,'download')}</a>:row.upload_key?<button type="button" className={`${s.button} ${s.secondary}`} onClick={()=>{setResume(row);setFile(null);key.current=str(row,'upload_key');input.current?.click();}}>{t(locale,'retry')}</button>:null}<button type="button" className={`${s.button} ${s.quiet}`} onClick={()=>archive(row)} disabled={pending}>{st(locale,row.library_archived_at?'restore':'archive')}</button></div></article>)}</div>{!files.length?<p>{st(locale,'noActivity')}</p>:null}</section></div>;
}
