import type { DataRow } from '../server/repository';
import s from '../jobkix.module.css';

/** The same reviewed snapshots whose revision is submitted and checked by SQL. */
export function ConsentDocuments({terms}:{terms:DataRow}){
 return <div>{(['terms','privacy'] as const).map(key=>{
  const document=terms[key];if(!document||typeof document!=='object'||Array.isArray(document))return null;
  const row=document as DataRow,sections=Array.isArray(row.sections)?row.sections:[];
  return <details key={key} className={s.panel}><summary>{typeof row.title==='string'?row.title:key}</summary>
   {typeof row.summary==='string'?<p className={s.authoredText}>{row.summary}</p>:null}
   {sections.map((value,index)=>{
    if(!value||typeof value!=='object'||Array.isArray(value))return null;const section=value as DataRow;
    return <section key={index}>{typeof section.title==='string'?<h3>{section.title}</h3>:null}
     {typeof section.body==='string'?<p className={s.authoredText}>{section.body}</p>:null}
     {Array.isArray(section.paragraphs)?section.paragraphs.filter((item):item is string=>typeof item==='string').map((item,i)=><p key={i} className={s.authoredText}>{item}</p>):null}
     {Array.isArray(section.items)?<ul>{section.items.filter((item):item is string=>typeof item==='string').map((item,i)=><li key={i}>{item}</li>)}</ul>:null}
    </section>;
   })}
  </details>;
 })}</div>;
}
