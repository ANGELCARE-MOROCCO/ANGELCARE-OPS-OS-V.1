'use client';
import { CommandForm } from '../client/CommandForm';
import { useState,type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card,Button,StatusChip } from '../../design-system/ui';
import ui from '../../design-system/marketplace.module.css';
import { LOCALES,type Locale } from '../contracts';
import type { DataRow } from '../server/repository';
import { LANGUAGE_NAMES,t,errorText } from '../i18n';
import { a,type AdminLocale } from '../admin-copy';
import { str,number } from '../components/Public';
import { useCommand } from '../client/commands';
const KINDS=['occupation','skill','age_cohort','collection'] as const;
const STATUSES=['draft','published','archived'] as const;
function namesFrom(row:DataRow|null):Record<Locale,string>{const names=row?.localized_names,result:Record<Locale,string>={en:'',fr:'',es:'',hi:'',tl:'',id:'',ar:''};if(names&&typeof names==='object'&&!Array.isArray(names))for(const locale of LOCALES){const value=Reflect.get(names,locale);if(typeof value==='string')result[locale]=value;}return result;}
function DefinitionForm({locale,row,onSaved}:{locale:AdminLocale;row:DataRow|null;onSaved:()=>void}){
 const command=useCommand('/api/jobkix/admin/commands'),[names,setNames]=useState(()=>namesFrom(row)),[status,setStatus]=useState(row?str(row,'status'):'draft'),[source,setSource]=useState(row?str(row,'source_name_en'):''),[updated,setUpdated]=useState(false);
 const setting=row?.kind==='setting';
 async function save(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=new FormData(event.currentTarget);const result=await command.run('taxonomy.save',{kind:setting?'setting':String(form.get('kind')),key:String(form.get('key')),sourceName:source,localizedNames:Object.fromEntries(Object.entries(names).filter(([,value])=>value.trim())),synonyms:String(form.get('synonyms')||'').split('\n').map(value=>value.trim()).filter(Boolean),status:setting?'published':status,sortOrder:setting?number(row,'sort_order'):Number(form.get('sortOrder')),note:String(form.get('note')||'')},row?number(row,'version')||1:0);if(result){setUpdated(true);onSaved();}}
 return <Card title={row?str(row,'source_name_en'):a(locale,'newDefinition')}><CommandForm locale={locale} onSubmit={save}><div className={ui.formGrid}>
  <label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'taxonomyKind')}</span><select className={ui.selectField} name="kind" defaultValue={row?str(row,'kind'):'occupation'} disabled={Boolean(row)}>{setting?<option value="setting">{t(locale,'sectors')}</option>:KINDS.map(kind=><option key={kind} value={kind}>{a(locale,kind)}</option>)}</select>{row?<input type="hidden" name="kind" value={str(row,'kind')}/>:null}</label>
  <label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'stableKey')}</span><input className={ui.textField} name="key" defaultValue={row?str(row,'key'):''} readOnly={Boolean(row)} pattern="[a-z0-9][a-z0-9-]{1,100}" required minLength={2} maxLength={100}/></label>
  <label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'sourceName')}</span><input className={ui.textField} value={source} onChange={event=>{setSource(event.target.value);setNames(current=>({...current,en:event.target.value}));setUpdated(false);}} required maxLength={240}/></label>
  <label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'status')}</span><select className={ui.selectField} value={setting?'published':status} onChange={event=>{setStatus(event.target.value);setUpdated(false);}} disabled={setting}>{STATUSES.map(value=><option key={value} value={value}>{a(locale,value)}</option>)}</select></label>
  {LOCALES.map(language=><label className={ui.fieldGroup} key={language}><span className={ui.fieldLabel}>{LANGUAGE_NAMES[language]}</span><input className={ui.textField} lang={language} dir={language==='ar'?'rtl':'ltr'} value={names[language]} readOnly={language==='en'} required={setting||status==='published'} maxLength={240} onChange={event=>{setNames(current=>({...current,[language]:event.target.value}));setUpdated(false);}}/></label>)}
  <label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'sortOrder')}</span><input type="number" className={ui.textField} name="sortOrder" min={0} max={100000} required defaultValue={row?number(row,'sort_order')||0:0} readOnly={setting}/></label>
  <label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'synonyms')}</span><textarea className={ui.textArea} name="synonyms" defaultValue={row&&Array.isArray(row.synonyms)?row.synonyms.filter((value):value is string=>typeof value==='string').join('\n'):''} maxLength={24000}/></label>
  <label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'note')}</span><textarea className={ui.textArea} name="note" minLength={20} maxLength={4000} required/></label>
 </div><p className={ui.fieldHelp}>{a(locale,'taxonomyHelp')}</p>{command.error?<p role="alert">{errorText(locale,command.error.code)}</p>:null}{updated?<p role="status">{t(locale,'saved')}</p>:null}<div className={ui.toolbar}><Button type="submit" disabled={command.pending}>{t(locale,command.pending?'saving':'save')}</Button></div></CommandForm></Card>;
}
export function TaxonomyEditor({locale,rows}:{locale:AdminLocale;rows:DataRow[]}){
 const router=useRouter(),[selected,setSelected]=useState<string|null>(null),[creating,setCreating]=useState(false);
 const row=rows.find(item=>str(item,'kind')+':'+str(item,'key')===selected)||null;
 return <div className={ui.stack}><div className={ui.toolbar}><Button onClick={()=>{setCreating(true);setSelected(null);}}>{a(locale,'newDefinition')}</Button><Button variant="secondary" onClick={()=>router.refresh()}>{a(locale,'reload')}</Button></div><Card title={a(locale,'taxonomyKind')}><div className={ui.tableWrap}><table className={ui.table}><thead><tr><th>{a(locale,'sourceName')}</th><th>{a(locale,'taxonomyKind')}</th><th>{a(locale,'status')}</th><th>{a(locale,'version')}</th><th>{a(locale,'review')}</th></tr></thead><tbody>{rows.map(item=><tr key={str(item,'kind')+':'+str(item,'key')}><td><strong>{str(item,'source_name_en')}</strong><div className={ui.tableSecondary}>{str(item,'key')}</div></td><td>{item.kind==='setting'?t(locale,'sectors'):KINDS.some(kind=>kind===item.kind)?a(locale,KINDS.find(kind=>kind===item.kind)||'occupation'):str(item,'kind')}</td><td><StatusChip status={str(item,'status')}/></td><td>{number(item,'version')}</td><td><Button variant="secondary" onClick={()=>{setSelected(str(item,'kind')+':'+str(item,'key'));setCreating(false);}}>{a(locale,'review')}</Button></td></tr>)}</tbody></table></div>{!rows.length?<p>{a(locale,'noRecords')}</p>:null}</Card>{creating||row?<DefinitionForm key={row?selected:'new'} locale={locale} row={row} onSaved={()=>{setCreating(false);setSelected(null);router.refresh();}}/>:null}</div>;
}
