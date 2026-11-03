'use client';
import {useEffect,useMemo,useState} from 'react';
import {inspectStudioProject,type StudioFile,type StudioReport} from './studio-intelligence';
import st from './studio-ultimate.module.css';
type Props={id:string;entry:string;files:StudioFile[];locale:string;onOpenFile?:(path:string)=>void};
const API='/api/angelcare-marketplace/admin/digital-customer-experience/interactive-package';
const label=(locale:string,en:string,fr:string,ar:string)=>locale==='fr'?fr:locale==='ar'?ar:en;
export function StudioProjectIntelligence({id,entry,files,locale,onOpenFile}:Props){
 const [data,setData]=useState<StudioReport|null>(null),[working,setWorking]=useState(false),[failure,setFailure]=useState('');
 const inventory=useMemo(()=>files.filter(f=>/\.(html?|css|m?js|json)$/i.test(f.path)&&f.size<=256*1024).slice(0,60),[files]);
 useEffect(()=>{
  let cancelled=false;const ac=new AbortController();
  async function inspect(){
   setWorking(true);setFailure('');setData(null);
   const sources:Record<string,string>={};let next=0;
   const jobs=Array.from({length:Math.min(4,inventory.length)},async()=>{
    while(next<inventory.length&&!ac.signal.aborted){
     const f=inventory[next++];
     try{
      const q=new URLSearchParams({operation:'file',id,path:f.path});
      const r=await fetch(API+'?'+q.toString(),{credentials:'same-origin',cache:'no-store',signal:ac.signal});
      if(!r.ok)continue;
      const json=await r.json();if(typeof json.data?.content==='string')sources[f.path]=json.data.content;
     }catch(e){if(ac.signal.aborted)return}
    }
   });
   await Promise.all(jobs);
   if(cancelled)return;
   setData(inspectStudioProject(files,sources,entry));setWorking(false);
  }
  void inspect().catch(e=>{if(!cancelled){setFailure(String(e));setWorking(false)}});
  return()=>{cancelled=true;ac.abort()};
 },[id,entry,files,inventory]);
 const T=(en:string,fr:string,ar:string)=>label(locale,en,fr,ar);
 return <section className={st.panel} aria-label={T('Project intelligence','Intelligence du projet','تحليل المشروع')}>
  <div className={st.heading}><div><span className={st.eyebrow}>KIDFLIX · PROJECT INTELLIGENCE</span><h4>{T('Actual project anatomy','Anatomie réelle du projet','بنية المشروع الفعلية')}</h4><p>{T('Inspects source and dependencies without executing its JavaScript.','Analyse le code et les dépendances sans exécuter le JavaScript.','يفحص الملفات دون تنفيذ جافاسكريبت.')}</p></div><span className={st.pill}>{working?T('Inspecting','Analyse','جارٍ الفحص'):data?T('Inspected','Analysé','تم الفحص'):'—'}</span></div>
  {failure&&<p role="alert" className={st.error}>{failure}</p>}
  {data&&<>
   <div className={st.metrics}>
    {[['HTML',data.html],['JavaScript',data.scripts],['CSS',data.styles],[T('Images','Images','صور'),data.images],[T('Audio','Audio','صوت'),data.audio],[T('Video','Vidéos','فيديو'),data.video],[T('Controls','Contrôles','عناصر التحكم'),data.interactiveControls],[T('Editable','Modifiables','قابلة للتحرير'),data.editableElements]].map(([name,value])=><div key={String(name)}><b>{value}</b><small>{name}</small></div>)}
   </div>
   {data.frameworks.length>0&&<p className={st.note}><strong>{T('Detected technologies','Technologies détectées','التقنيات المكتشفة')}:</strong> {data.frameworks.join(' · ')}</p>}
   <div className={st.diagnosticsTitle}><strong>{T('Actionable findings','Constats exploitables','ملاحظات قابلة للتنفيذ')}</strong><small>{data.issues.filter(x=>x.severity==='error').length} {T('errors','erreurs','أخطاء')} · {data.issues.filter(x=>x.severity==='warning').length} {T('warnings','avertissements','تحذيرات')}</small></div>
   <div className={st.findings}>
    {data.issues.length===0?<p className={st.note}>{T('No issues detected in the inspected files. This is not a substitute for running the application.','Aucun problème détecté dans les fichiers inspectés. L’exécution réelle reste indispensable.','لم تُكتشف مشاكل؛ يجب اختبار التشغيل الفعلي.')}</p>:
    data.issues.slice(0,35).map((finding,i)=><div className={st.finding} key={i} data-severity={finding.severity}>
     <span className={st.severity}>{finding.severity.toUpperCase()}</span><div><strong>{finding.message}</strong><small>{finding.file}</small></div>{onOpenFile&&files.some(f=>f.path===finding.file)&&<button type="button" onClick={()=>onOpenFile(finding.file)}>{T('Open file','Ouvrir','فتح')}</button>}
    </div>)}
   </div>
   <p className={st.note}>{T('Inspected','Sources lues','الملفات المقروءة')}: {data.filesChecked}/{inventory.length} · {data.localReferences} {T('local references','références locales','مراجع محلية')} · {data.externalReferences} {T('external references','références externes','مراجع خارجية')}</p>
  </>}
 </section>;
}
