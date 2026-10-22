'use client';
import { CommandForm } from '../client/CommandForm';
import { useState,type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card,Button,StatusChip } from '../../design-system/ui';
import ui from '../../design-system/marketplace.module.css';
import type { DataRow } from '../server/repository';
import { object } from '../validation';
import { str,number } from '../components/Public';
import { a,type AdminLocale } from '../admin-copy';
import { t,errorText } from '../i18n';
import { useCommand } from '../client/commands';
import { EmployerMediaReview } from './EmployerMediaReview';
import { EditorialEditor } from './EditorialEditor';
import { TaxonomyEditor } from './TaxonomyEditor';
const NEXT_CASE_STATES:Record<string,string[]>={reported:['triaged','under_review'],triaged:['under_review','needs_information'],under_review:['needs_information','action','no_action','resolved'],needs_information:['under_review','resolved'],appealed:['under_review','action','no_action','resolved'],action:['resolved'],no_action:['resolved']};
export function AdminWorkspace({locale,slug,rows,focus=null}:{locale:AdminLocale;slug:string;rows:DataRow[];focus?:DataRow|null}){
 const router=useRouter(),command=useCommand('/api/jobkix/admin/commands'),[selected,setSelected]=useState<string|null>(null),[success,setSuccess]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>,row:DataRow){
  event.preventDefault();const native=event.nativeEvent,submitter=native instanceof SubmitEvent&&native.submitter instanceof HTMLButtonElement?native.submitter:undefined,form=new FormData(event.currentTarget,submitter);
  const action=String(form.get('action')||'');let payload:DataRow={id:row.id,note:String(form.get('note')||'')};let version=number(row,'version')||0;
  if(slug==='verification'){
   const organization=object(row.organization);payload={...payload,id:organization.id,caseId:row.id,caseVersion:row.version,validUntil:String(form.get('validUntil')||''),reference:String(form.get('reference')||''),evidenceIds:typeof row.evidence_file_id==='string'?[row.evidence_file_id]:[]};version=number(organization,'version')||0;
  }
  if(slug==='cases')payload={...payload,state:String(form.get('state')||''),visibility:String(form.get('visibility')||'internal')};
  if(slug==='reputation')payload={...payload,state:String(form.get('state')||''),methodologyRevision:String(form.get('methodologyRevision')||'')};
  const result=await command.run(action,payload,version);if(result){setSuccess(true);setSelected(null);router.refresh();}
 }
 if(slug==='editorial')return <EditorialEditor locale={locale} rows={rows} focus={focus}/>;
 if(slug==='taxonomy')return <TaxonomyEditor locale={locale} rows={rows}/>;
 if(slug==='health')return null;
 return <div className={ui.stack}>
  <div className={ui.toolbar}><Button variant="secondary" onClick={()=>router.refresh()}>{a(locale,'reload')}</Button></div>
  {success?<p role="status">{t(locale,'saved')}</p>:null}{command.error?<p role="alert">{errorText(locale,command.error.code)}</p>:null}
  <Card title={a(locale,'record')}><div className={ui.tableWrap}><table className={ui.table}><thead><tr><th>{a(locale,'record')}</th><th>{a(locale,'status')}</th><th>{a(locale,'version')}</th><th>{a(locale,'review')}</th></tr></thead><tbody>{rows.map((row,index)=><tr key={str(row,'id')||str(row,'key')||index}><td><strong>{str(row,'title')||str(row,'public_reference')||str(row,'source_name_en')||str(row,'type')||str(row,'id')}</strong><div className={ui.tableSecondary}>{str(row,'country')||str(row,'category')||str(row,'kind')}</div></td><td><StatusChip status={str(row,'state')||str(row,'status')||'registered'}/></td><td>{number(row,'version')||'—'}</td><td><Button variant="secondary" onClick={()=>setSelected(str(row,'id')||str(row,'key'))}>{a(locale,'review')}</Button></td></tr>)}</tbody></table></div>{!rows.length?<p>{a(locale,'noRecords')}</p>:null}</Card>
  {rows.filter(row=>(row.id||row.key)===selected).map(row=><Card key={String(row.id||row.key)} title={str(row,'title')||str(row,'public_reference')||a(locale,'review')}><p>{str(row,'description')||str(row,'body')||str(row,'source_name_en')}</p>
   {slug==='verification'?<EmployerMediaReview locale={locale} organization={object(row.organization)} evidenceId={str(row,'evidence_file_id')}/>:null}
   {slug==='audit'?<dl>{Object.entries(object(row.detail||{})).filter(([,value])=>typeof value==='string'||typeof value==='number').map(([key,value])=><div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}</dl>:null}
   {slug==='verification'?<dl>{Object.entries(object(row.organization)).filter(([,value])=>typeof value==='string'||typeof value==='number').map(([key,value])=><div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}</dl>:null}
   {['vacancies','verification','cases','reputation'].includes(slug)?<CommandForm locale={locale} onSubmit={event=>submit(event,row)}><div className={ui.formGrid}>
    {slug==='verification'?<><label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'validUntil')}</span><input className={ui.textField} name="validUntil" type="text" required placeholder="2027-01-01T00:00:00Z"/></label><label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'reference')}</span><input className={ui.textField} name="reference" minLength={3} maxLength={240} required/></label><p>{a(locale,'evidence')}: {str(row,'evidence_file_id')||t(locale,'notDeclared')}</p></>:null}
    {slug==='cases'||slug==='reputation'?<label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'state')}</span><select className={ui.selectField} name="state" required>{(slug==='cases'?NEXT_CASE_STATES[str(row,'state')]||[]:['under_review','published','rejected','withdrawn']).map(state=><option key={state} value={state}>{state}</option>)}</select></label>:null}
    {slug==='cases'?<label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'visibility')}</span><select className={ui.selectField} name="visibility"><option value="internal">{a(locale,'internal')}</option><option value="reporter">{a(locale,'reporter')}</option></select></label>:null}
    {slug==='reputation'?<label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'methodology')}</span><input className={ui.textField} name="methodologyRevision" maxLength={100} defaultValue={str(row,'current_methodology_hash')}/></label>:null}
    <label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'note')}</span><textarea className={ui.textArea} name="note" required minLength={20} maxLength={4000}/><small className={ui.fieldHelp}>{a(locale,'noteHelp')}</small></label>
   </div><div className={ui.toolbar}>
    {slug==='vacancies'?<>{row.state==='pending_review'?<Button name="action" value="vacancy.approve" type="submit" disabled={command.pending}>{a(locale,'approve')}</Button>:null}<Button name="action" value="vacancy.return" type="submit" variant="secondary" disabled={command.pending}>{a(locale,'return')}</Button><Button name="action" value="vacancy.suspend" type="submit" variant="danger" disabled={command.pending}>{a(locale,'suspend')}</Button></>:null}
    {slug==='verification'?<Button name="action" value="organization.review" type="submit" disabled={command.pending||!row.evidence_file_id}>{a(locale,'approve')}</Button>:null}
    {slug==='cases'||slug==='reputation'?<Button name="action" value={slug==='cases'?'case.advance':'reputation.review'} type="submit" disabled={command.pending}>{t(locale,'save')}</Button>:null}
   </div></CommandForm>:null}
  </Card>)}
 </div>;
}
