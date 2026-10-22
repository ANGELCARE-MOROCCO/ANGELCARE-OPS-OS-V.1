'use client';
import { CommandForm } from '../client/CommandForm';
import { useState } from 'react';
import { useRouter,useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card,Button } from '../../design-system/ui';
import ui from '../../design-system/marketplace.module.css';
import type { DataRow } from '../server/repository';
import { object } from '../validation';
import { LOCALES,isLocale } from '../contracts';
import { str,number } from '../components/Public';
import { a,type AdminLocale } from '../admin-copy';
import { t,errorText,LANGUAGE_NAMES } from '../i18n';
import { useCommand } from '../client/commands';
import { editorialPreviewTarget } from '../editorial-preview';
import { EditorialImagePicker,storedMedia } from './EditorialImagePicker';
import type { EditorialMedia } from '../editorial-media';
interface Section {id:string;title:string;body:string;paragraphs:string[];items:string[];media:EditorialMedia|null}
const lines=(value:string)=>value.split('\n').map(value=>value.trim()).filter(Boolean);
const sectionRows=(value:unknown):Section[]=>Array.isArray(value)?value.map(value=>{const row=object(value);return {id:str(row,'id'),title:str(row,'title'),body:str(row,'body'),paragraphs:Array.isArray(row.paragraphs)?row.paragraphs.filter((v):v is string=>typeof v==='string'):[],items:Array.isArray(row.items)?row.items.filter((v):v is string=>typeof v==='string'):[],media:storedMedia(row.media)};}):[];
export function EditorialEditor({locale,rows,focus=null}:{locale:AdminLocale;rows:DataRow[];focus?:DataRow|null}){
 const params=useSearchParams(),[create,setCreate]=useState(false),selected=rows.find(row=>row.id===params.get('edition'))||(focus?.id===params.get('edition')?focus:null);
 return <div className={ui.stack}><div className={ui.toolbar}><Button onClick={()=>setCreate(value=>!value)}>{a(locale,'newDocument')}</Button></div>
  <Card title={a(locale,'language')}><div className={ui.tableWrap}><table className={ui.table}><thead><tr><th>{a(locale,'title')}</th><th>{a(locale,'language')}</th><th>{a(locale,'version')}</th><th>{a(locale,'status')}</th></tr></thead><tbody>{rows.map(row=><tr key={str(row,'id')}><td><Link href={'/angelcare-marketplace/admin/jobkix/editorial?'+new URLSearchParams({edition:str(row,'id'),page:params.get('page')||'1'})} onClick={()=>setCreate(false)}>{str(row,'title')}</Link></td><td>{str(row,'locale')}</td><td>{number(row,'version')}</td><td>{str(row,'status')}</td></tr>)}</tbody></table></div>{!rows.length?<p>{a(locale,'noRecords')}</p>:null}</Card>
  {create?<EditorForm key="new" locale={locale} edition={null} afterSave={()=>setCreate(false)}/>:selected?<EditorForm key={str(selected,'id')} locale={locale} edition={selected} afterSave={()=>{}}/>:null}
 </div>;
}
function EditorForm({locale,edition,afterSave}:{locale:AdminLocale;edition:DataRow|null;afterSave:()=>void}){
 const router=useRouter(),command=useCommand('/api/jobkix/admin/commands');
 const [title,setTitle]=useState(edition?str(edition,'title'):''),[summary,setSummary]=useState(edition?str(edition,'summary'):''),[author,setAuthor]=useState(edition?str(edition,'author_name'):''),[provenance,setProvenance]=useState(edition?str(edition,'translator_provenance'):''),[sections,setSections]=useState<Section[]>(sectionRows(edition?.sections));
 const [note,setNote]=useState(''),[slug,setSlug]=useState(''),[kind,setKind]=useState('guide'),[targetLanguage,setTargetLanguage]=useState('fr'),[rebase,setRebase]=useState(false);
 const editionLocale=edition&&isLocale(str(edition,'locale'))?str(edition,'locale'):'en';
 const initial=JSON.stringify({title:edition?str(edition,'title'):'',summary:edition?str(edition,'summary'):'',author:edition?str(edition,'author_name'):'',provenance:edition?str(edition,'translator_provenance'):'',sections:sectionRows(edition?.sections)});
 const dirty=initial!==JSON.stringify({title,summary,author,provenance,sections});
 const sourceChanged=Boolean(edition&&edition.locale!=='en'&&edition.source_hash!==edition.current_source_hash);
 async function run(action:string,payload:DataRow){const result=await command.run(action,{...payload,note},edition?number(edition,'version')||0:0);if(result&&typeof result.id==='string'){afterSave();router.replace('/angelcare-marketplace/admin/jobkix/editorial?edition='+encodeURIComponent(result.id));router.refresh();}}
 function move(index:number,delta:number){setSections(current=>{const result=[...current],target=index+delta;if(target<0||target>=result.length)return current;[result[index],result[target]]=[result[target],result[index]];return result;});}
 function update(id:string,field:'title'|'body'|'paragraphs'|'items',value:string){setSections(current=>current.map(section=>section.id===id?{...section,[field]:field==='paragraphs'||field==='items'?value.split('\n'):value}:section));}
 const storedAction=(action:string)=>run(action,{id:edition?.id,contentHash:edition?.content_hash});
 return <Card title={edition?str(edition,'title'):a(locale,'newDocument')}>
  <p>{a(locale,'stale')}</p>{command.error?<p role="alert">{errorText(locale,command.error.code)}</p>:null}
  <CommandForm locale={locale} onSubmit={event=>{event.preventDefault();if(sourceChanged&&!rebase)return;run(edition?'editorial.save':'editorial.create',{...(edition?{id:edition.id}:{slug,kind}),locale:editionLocale,title,summary,author,provenance,sections:sections.map(section=>({...section,paragraphs:lines(section.paragraphs.join('\n')),items:lines(section.items.join('\n'))})),sourceHash:rebase?edition?.current_source_hash:edition?.source_hash||null});}}>
   {sourceChanged?<label className={ui.checkboxRow}><input type="checkbox" required checked={rebase} onChange={event=>setRebase(event.target.checked)}/><span>{a(locale,'rebase')}</span></label>:null}
   <div className={ui.formGrid}>
    {!edition?<><label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'slug')}</span><input className={ui.textField} value={slug} onChange={event=>setSlug(event.target.value)} pattern="[a-z0-9][a-z0-9/-]+" required maxLength={180}/></label><label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'kind')}</span><select className={ui.selectField} value={kind} onChange={event=>setKind(event.target.value)}>{['front','guide','help','legal','sector','profession','country','city','trust'].map(kind=><option key={kind} value={kind}>{kind}</option>)}</select></label></>:null}
    <label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'title')}</span><input className={ui.textField} value={title} onChange={event=>setTitle(event.target.value)} required maxLength={240}/></label>
    <label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'author')}</span><input className={ui.textField} value={author} onChange={event=>setAuthor(event.target.value)} required maxLength={180}/></label>
    <label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'summary')}</span><textarea className={ui.textArea} value={summary} onChange={event=>setSummary(event.target.value)} maxLength={4000}/></label>
    <label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'provenance')}</span><textarea className={ui.textArea} value={provenance} onChange={event=>setProvenance(event.target.value)} required maxLength={1000}/></label>
   </div><h3>{a(locale,'sections')}</h3>
   <div className={ui.stack}>{sections.map((section,index)=><fieldset key={section.id} className={ui.cardBody}><legend>{index+1} · {section.id}</legend><div className={ui.formGrid}>
    <label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'title')}</span><input className={ui.textField} value={section.title} onChange={event=>update(section.id,'title',event.target.value)} required maxLength={240}/></label>
    <label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'body')}</span><textarea className={ui.textArea} value={section.body} onChange={event=>update(section.id,'body',event.target.value)} maxLength={40000}/></label>
    <label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'body')} · ¶</span><textarea className={ui.textArea} value={section.paragraphs.join('\n')} onChange={event=>update(section.id,'paragraphs',event.target.value)}/></label>
    <label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'items')}</span><textarea className={ui.textArea} value={section.items.join('\n')} onChange={event=>update(section.id,'items',event.target.value)}/></label>
   </div><EditorialImagePicker locale={locale} value={section.media} onChange={media=>setSections(current=>current.map(value=>value.id===section.id?{...value,media}:value))}/><div className={ui.toolbar}><Button type="button" variant="secondary" disabled={index===0} onClick={()=>move(index,-1)}>{a(locale,'up')}</Button><Button type="button" variant="secondary" disabled={index===sections.length-1} onClick={()=>move(index,1)}>{a(locale,'down')}</Button><Button type="button" variant="danger" onClick={()=>setSections(current=>current.filter(value=>value.id!==section.id))}>{a(locale,'remove')}</Button></div></fieldset>)}</div>
   <Button type="button" variant="secondary" disabled={sections.length>=100} onClick={()=>setSections(current=>[...current,{id:current.some(section=>section.id==='opening')?'section-'+crypto.randomUUID():'opening',title:'',body:'',paragraphs:[],items:[],media:null}])}>{a(locale,'addSection')}</Button>
   <label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'note')}</span><textarea className={ui.textArea} required minLength={20} maxLength={4000} value={note} onChange={event=>setNote(event.target.value)}/></label>
   <div className={ui.toolbar}><Button type="submit" disabled={command.pending}>{command.pending?t(locale,'saving'):t(locale,'save')}</Button></div>
  </CommandForm>
  {edition?<div className={ui.stack}><p>{a(locale,'version')}: {number(edition,'version')} · {editionLocale} · {str(edition,'content_hash')}</p>{editorialPreviewTarget(str(edition,'document_kind'),str(edition,'document_slug'))?<Link href={`/jobkix/${editionLocale}/preview/${str(edition,'id')}`}>{a(locale,'preview')}</Link>:<p>{a(locale,'previewPending')}</p>}<div className={ui.toolbar}>
   {edition.status==='draft'?<Button disabled={dirty||command.pending||note.trim().length<20} onClick={()=>storedAction('editorial.review')}>{a(locale,'review')}</Button>:null}
   {edition.status==='reviewed'?<Button disabled={dirty||command.pending||note.trim().length<20} onClick={()=>storedAction('editorial.publish')}>{a(locale,'publish')}</Button>:null}
   {edition.status==='published'?<Button variant="danger" disabled={dirty||command.pending||note.trim().length<20} onClick={()=>storedAction('editorial.unpublish')}>{a(locale,'unpublish')}</Button>:null}
   {edition.status==='retired'&&edition.published_at?<Button variant="secondary" disabled={dirty||command.pending||note.trim().length<20} onClick={()=>storedAction('editorial.rollback')}>{a(locale,'rollback')}</Button>:null}
  </div>{edition.locale==='en'&&edition.status==='published'?<div className={ui.toolbar}><label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'language')}</span><select className={ui.selectField} value={targetLanguage} onChange={event=>setTargetLanguage(event.target.value)}>{LOCALES.filter(language=>language!=='en').map(language=><option key={language} value={language}>{LANGUAGE_NAMES[language]}</option>)}</select></label><Button variant="secondary" disabled={dirty||command.pending||note.trim().length<20} onClick={()=>run('editorial.translate',{id:edition.id,locale:targetLanguage,title,summary,author,provenance,sections,sourceHash:edition.source_hash})}>{a(locale,'translate')}</Button></div>:null}</div>:null}
 </Card>;
}
