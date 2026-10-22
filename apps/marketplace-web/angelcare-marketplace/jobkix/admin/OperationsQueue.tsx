'use client';
import { CommandForm } from '../client/CommandForm';
import { useState,type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card,Button,ButtonLink } from '../../design-system/ui';
import ui from '../../design-system/marketplace.module.css';
import type { DataRow } from '../server/repository';
import { object } from '../validation';
import { str,number } from '../components/Public';
import { a,type AdminLocale } from '../admin-copy';
import { op,operationState } from '../admin-delivery-copy';
import { t,errorText,formatDate } from '../i18n';
import { useCommand } from '../client/commands';
const STATES=['pending','processing','provider_accepted','failed','delivery_unknown','cancelled'] as const;
export function OperationsQueue({locale,data,state}:{locale:AdminLocale;data:DataRow;state:string}){
 const router=useRouter(),command=useCommand('/api/jobkix/admin/commands'),[selected,setSelected]=useState<string|null>(null),[success,setSuccess]=useState(false);
 const rows=Array.isArray(data.items)?data.items.map(object):[],page=number(data,'page')||1,total=number(data,'total')||0;
 const destination=(next:number,filter=state)=>'/angelcare-marketplace/admin/jobkix/health?'+new URLSearchParams({page:String(next),state:filter});
 async function submit(event:FormEvent<HTMLFormElement>,row:DataRow){event.preventDefault();const native=event.nativeEvent,submitter=native instanceof SubmitEvent&&native.submitter instanceof HTMLButtonElement?native.submitter:undefined,form=new FormData(event.currentTarget,submitter);const result=await command.run(String(form.get('action')||''),{id:row.id,note:String(form.get('note')||'')},number(row,'version')||0);if(result){setSuccess(true);setSelected(null);router.refresh();}}
 return <div className={ui.stack}><Card title={op(locale,'queue')}><p>{op(locale,'help')}</p><dl>{Object.entries(object(data.counts||{})).map(([key,value])=><div key={key}><dt>{operationState(locale,key)}</dt><dd>{typeof value==='number'?new Intl.NumberFormat(locale).format(value):'—'}</dd></div>)}<div><dt>{op(locale,'expired')}</dt><dd>{number(data,'expiredPublishedVacancies')||0}</dd></div><div><dt>{op(locale,'filters')}</dt><dd>{number(data,'savedFilterFailures')||0}</dd></div></dl>{number(data,'savedFilterFailures')?<p>{op(locale,'filtersHelp')}</p>:null}
 <div className={ui.toolbar}><ButtonLink href={destination(1,'')} variant="secondary">{op(locale,'all')}</ButtonLink>{STATES.map(filter=><ButtonLink key={filter} href={destination(1,filter)} variant={state===filter?'primary':'secondary'}>{operationState(locale,filter)}</ButtonLink>)}<Button variant="secondary" onClick={()=>router.refresh()}>{a(locale,'reload')}</Button></div></Card>
 {success?<p role="status">{t(locale,'saved')}</p>:null}{command.error?<p role="alert">{errorText(locale,command.error.code)}</p>:null}
 <Card title={a(locale,'record')}><div className={ui.tableWrap}><table className={ui.table}><thead><tr><th>{a(locale,'record')}</th><th>{a(locale,'state')}</th><th>{op(locale,'attempts')}</th><th>{op(locale,'due')}</th><th>{a(locale,'review')}</th></tr></thead><tbody>{rows.map(row=><tr key={str(row,'id')}><td><strong>{str(row,'type')}</strong><div className={ui.tableSecondary}>{str(row,'id')}</div><div>{str(row,'errorCode')}</div></td><td><span className={ui.status}>{operationState(locale,str(row,'state'))}</span></td><td>{number(row,'attempts')||0} / {number(row,'attemptLimit')||8}</td><td><time dateTime={str(row,'availableAt')}>{formatDate(str(row,'availableAt'),locale,'UTC')}</time></td><td>{['pending','failed','delivery_unknown'].includes(str(row,'state'))?<Button variant="secondary" onClick={()=>setSelected(str(row,'id'))}>{op(locale,'choose')}</Button>:null}</td></tr>)}</tbody></table></div>{!rows.length?<p>{a(locale,'noRecords')}</p>:null}
 <nav className={ui.toolbar} aria-label={a(locale,'record')}>{page>1?<ButtonLink href={destination(page-1)} variant="secondary">{t(locale,'previous')}</ButtonLink>:null}<span>{new Intl.NumberFormat(locale).format(page)}</span>{page*24<total?<ButtonLink href={destination(page+1)} variant="secondary">{t(locale,'next')}</ButtonLink>:null}</nav></Card>
 {rows.filter(row=>row.id===selected).map(row=><Card key={str(row,'id')} title={op(locale,'choose')}><p>{op(locale,'help')}</p><CommandForm locale={locale} onSubmit={event=>submit(event,row)}><label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'note')}</span><textarea className={ui.textArea} name="note" required minLength={20} maxLength={4000}/></label><div className={ui.toolbar}>{row.state==='failed'?<Button type="submit" name="action" value="delivery.retry" disabled={command.pending}>{op(locale,'retry')}</Button>:null}<Button type="submit" name="action" value="delivery.cancel" variant="danger" disabled={command.pending}>{op(locale,'cancel')}</Button></div></CommandForm></Card>)}
 </div>;
}
