'use client';
import {useMemo,useState} from 'react';
import st from './studio-ultimate.module.css';
const API='/api/angelcare-marketplace/admin/digital-customer-experience/interactive-package';
type Meta={path:string;sha256:string;size:number;mime:string};
type Result={id:string;checksum:string;title:string;locale:string;family:string;entry:string;previewUrl:string};
export function StudioBatchMedia({packageId,files,locale,disabled,onRevision}:{packageId:string;files:Meta[];locale:string;disabled:boolean;onRevision:(result:Result)=>void}){
 const [selection,setSelection]=useState<File[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[confirmed,setConfirmed]=useState(false);
 const T=(en:string,fr:string,ar:string)=>locale==='fr'?fr:locale==='ar'?ar:en;
 const media=useMemo(()=>files.filter(f=>/\.(png|jpe?g|webp|gif|avif|mp3|wav|ogg|mp4|webm)$/i.test(f.path)),[files]);
 const pairs=useMemo(()=>selection.map(file=>{
  const matches=media.filter(x=>x.path.split('/').pop()?.toLowerCase()===file.name.toLowerCase());
  return {file,path:matches.length===1?matches[0].path:'',meta:matches.length===1?matches[0]:null,ambiguous:matches.length>1};
 }),[selection,media]);
 const ready=pairs.length>0&&pairs.length<=24&&pairs.every(x=>x.meta)&&new Set(pairs.map(x=>x.path)).size===pairs.length;
 async function apply(){
  if(!ready||!confirmed||disabled)return;
  setBusy(true);setError('');try{
   const form=new FormData();form.set('action','derive_batch');form.set('id',packageId);
   form.set('changes',JSON.stringify(pairs.map((x,i)=>({path:x.path,checksum:x.meta!.sha256,field:'asset_'+i}))));
   pairs.forEach((x,i)=>form.append('asset_'+i,x.file,x.file.name));
   const response=await fetch(API,{method:'POST',body:form,credentials:'same-origin'});
   const body=await response.json();if(!response.ok||!body?.data?.id)throw Error(body?.error||'Batch revision failed');
   setSelection([]);setConfirmed(false);onRevision(body.data);
  }catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 return <div className={st.batchRoot}>
   <div className={st.heading}><div><span className={st.eyebrow}>BATCH · IMMUTABLE REVISION</span><h4>{T('Replace several media files together','Remplacer plusieurs médias en une fois','استبدال عدة ملفات دفعة واحدة')}</h4><p>{T('Exact filename matching; no gallery, no unrelated file modification.','Correspondance exacte des noms ; aucune médiathèque, aucun autre fichier modifié.','مطابقة الأسماء بدقة دون تعديل الملفات الأخرى.')}</p></div></div>
   <label className={st.batchPicker}>{T('Choose replacement files','Choisir les nouveaux médias','اختر الملفات البديلة')} <input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,image/avif,audio/mpeg,audio/ogg,audio/wav,video/mp4,video/webm" onChange={e=>{setSelection(Array.from(e.target.files||[]));setConfirmed(false)}} disabled={disabled||busy}/></label>
   {selection.length>0&&<div className={st.batchTable}>
     {pairs.map((x,i)=><div key={i}><span>{x.file.name}</span><span>{x.path||T(x.ambiguous?'Ambiguous filename':'Not found',x.ambiguous?'Nom ambigu':'Introuvable',x.ambiguous?'اسم مكرر':'غير موجود')}</span><strong data-good={!!x.meta}>{x.meta?'MATCH':'REVIEW'}</strong></div>)}
   </div>}
   {ready&&<label className={st.confirm}><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>{T('I have reviewed every exact destination. Create one new package revision.','J’ai vérifié chaque destination exacte. Créer une seule révision.','تمت مراجعة كل ملف؛ أنشئ إصدارًا جديدًا واحدًا.')}</label>}
   <button type="button" className={st.primaryButton} onClick={()=>void apply()} disabled={disabled||busy||!ready||!confirmed}>{busy?T('Validating…','Validation…','جارٍ التحقق…'):T('Create complete revised package','Créer le package révisé complet','إنشاء الحزمة المعدلة')}</button>
   {error&&<p role="alert" className={st.error}>{error}</p>}
   <p className={st.note}>{T('To replace an ambiguously named file, use its individual asset editor. Originals and published revisions are never overwritten.','Si le nom est ambigu, utilisez l’éditeur individuel. Les originaux et publications ne sont jamais écrasés.','للأسماء المكررة استخدم التحرير الفردي؛ الإصدارات الأصلية لا تتغير.')}</p>
 </div>;
}
