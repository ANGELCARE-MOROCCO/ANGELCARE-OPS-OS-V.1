'use client';
import {useEffect,useMemo,useState} from 'react';
import st from './studio-ultimate.module.css';
const API='/api/angelcare-marketplace/admin/digital-customer-experience/interactive-package';
type Listed={id:string;title:string;createdAt?:string;state:string;parentId?:string|null;files:number};
type Detail={id:string;checksum:string;files?:{path:string;size:number;sha256:string;mime:string}[];parentId?:string|null};
export function StudioRevisionCompare({locale,library,activeId,onOpen,onRestore}:{locale:string;library:Listed[];activeId?:string;onOpen:(id:string)=>void;onRestore:(id:string)=>void}){
 const [left,setLeft]=useState(''),[right,setRight]=useState(''),[a,setA]=useState<Detail|null>(null),[b,setB]=useState<Detail|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const T=(en:string,fr:string,ar:string)=>locale==='fr'?fr:locale==='ar'?ar:en;
 useEffect(()=>{
  if(!library.length)return;
  setRight(r=>r&&library.some(x=>x.id===r)?r:(activeId&&library.some(x=>x.id===activeId)?activeId:library[0].id));
  setLeft(l=>l&&library.some(x=>x.id===l)?l:(library.find(x=>x.id!==activeId)?.id||library[0].id));
 },[library,activeId]);
 useEffect(()=>{
  if(!left||!right)return;let alive=true;const ac=new AbortController();setBusy(true);setError('');
  async function get(id:string){const q=new URLSearchParams({operation:'info',id});const response=await fetch(API+'?'+q,{credentials:'same-origin',cache:'no-store',signal:ac.signal});if(!response.ok)throw Error('Unable to inspect saved revision '+id.slice(0,8));const j=await response.json();return j.data as Detail}
  void Promise.all([get(left),get(right)]).then(([x,y])=>{if(alive){setA(x);setB(y)}}).catch(e=>{if(alive)setError((e as Error).message)}).finally(()=>{if(alive)setBusy(false)});
  return()=>{alive=false;ac.abort()};
 },[left,right]);
 const differences=useMemo(()=>{
  if(!a?.files||!b?.files)return[];
  const old=new Map(a.files.map(x=>[x.path,x])),newFiles=new Map(b.files.map(x=>[x.path,x]));const paths=[...new Set([...old.keys(),...newFiles.keys()])].sort();
  return paths.map(path=>{const x=old.get(path),y=newFiles.get(path);const kind=!x?'added':!y?'removed':x.sha256!==y.sha256?'modified':'unchanged';return {path,kind,old:x,new:y}}).filter(x=>x.kind!=='unchanged');
 },[a,b]);
 return <section className={st.panel}>
  <div className={st.heading}><div><span className={st.eyebrow}>KIDFLIX · REVISION INTELLIGENCE</span><h4>{T('Compare complete source revisions','Comparer les révisions complètes','مقارنة الإصدارات')}</h4><p>{T('Find changed, added and removed files before reopening or restoring.','Repérez les fichiers ajoutés, modifiés ou retirés avant toute reprise.','قارن الملفات المضافة والمعدلة والمحذوفة.')}</p></div></div>
  <div className={st.compareSelect}>
   <label>{T('Previous','Précédente','السابقة')}<select value={left} onChange={e=>setLeft(e.target.value)}>{library.map(x=><option key={x.id} value={x.id}>{x.title} · {x.id.slice(0,8)} · {x.state}</option>)}</select></label>
   <label>{T('Candidate','Candidate','المرشحة')}<select value={right} onChange={e=>setRight(e.target.value)}>{library.map(x=><option key={x.id} value={x.id}>{x.title} · {x.id.slice(0,8)} · {x.state}</option>)}</select></label>
  </div>
  {busy&&<p role="status">{T('Comparing revisions…','Comparaison des révisions…','جارٍ المقارنة…')}</p>}
  {error&&<p role="alert" className={st.error}>{error}</p>}
  {a&&b&&!busy&&<>
   <div className={st.metrics}><div><b>{differences.filter(x=>x.kind==='added').length}</b><small>{T('Added','Ajoutés','مضاف')}</small></div><div><b>{differences.filter(x=>x.kind==='modified').length}</b><small>{T('Modified','Modifiés','معدل')}</small></div><div><b>{differences.filter(x=>x.kind==='removed').length}</b><small>{T('Removed','Retirés','محذوف')}</small></div><div><b>{(b.files||[]).length}</b><small>{T('Total files','Fichiers','ملفات')}</small></div></div>
   <div className={st.compareRows}>{differences.length===0?<p className={st.note}>{T('File contents are identical.','Contenu des fichiers identique.','محتوى الملفات متطابق.')}</p>:differences.slice(0,120).map(x=><div key={x.path}><span data-kind={x.kind}>{x.kind}</span><code>{x.path}</code></div>)}</div>
   <div className={st.codeActions}><button type="button" onClick={()=>onOpen(right)}>{T('Open candidate for inspection','Ouvrir la révision candidate','فتح الإصدار المرشح')}</button><button type="button" onClick={()=>onRestore(left)}>{T('Prepare older revision as draft','Préparer l’ancienne révision en brouillon','استعادة الإصدار القديم كمسودة')}</button></div>
   <p className={st.note}>{T('Reopening never changes the live public release. Publication remains controlled by Content 360.','La réouverture ne change jamais la version publique. La publication reste sous Content 360.','فتح الإصدار لا يغير النشر؛ التحكم من Content 360.')}</p>
  </>}
 </section>
}
