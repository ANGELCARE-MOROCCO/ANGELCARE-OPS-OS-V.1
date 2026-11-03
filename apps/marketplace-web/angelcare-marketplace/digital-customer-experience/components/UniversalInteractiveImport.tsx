'use client';
import { useEffect,useRef,useState } from 'react';
import type { Locale } from '../types';
import styles from './universal-interactive.module.css';
import {StudioProjectIntelligence} from './StudioProjectIntelligence';
import {StudioCodeEditor} from './StudioCodeEditor';
import {StudioAssetWorkbench} from './StudioAssetWorkbench';
import {StudioBatchMedia} from './StudioBatchMedia';
import {StudioRevisionCompare} from './StudioRevisionCompare';
import {StudioVisualInspector,type Selection,type VisualProperty} from './StudioVisualInspector';
import {StudioAIRepairHandoff} from './StudioAIRepairHandoff';
const API='/api/angelcare-marketplace/admin/digital-customer-experience/interactive-package';
type FileMeta={path:string;size:number;mime:string;sha256:string};
type Result={id:string;checksum:string;family:string;locale:string;title:string;fileCount?:number;totalBytes?:number;state:string;entry:string;previewUrl:string;files?:FileMeta[];recordId?:string|null;releaseId?:string|null;parentId?:string|null;createdAt?:string;capabilities?:string[];audience?:{age_min?:number;age_max?:number};rights?:{holder?:string;license?:string}};
type Listing={id:string;checksum:string;title:string;state:string;locale:string;family:string;recordId?:string|null;releaseId?:string|null;entry:string;createdAt?:string;files:number;parentId?:string|null};
type Step='start'|'understand'|'perfect'|'experience'|'publish'|'manage';
const steps:Step[]=['start','understand','perfect','experience','publish','manage'];
const stepLabels:Record<Step,[string,string,string]>={
 start:['Start','Départ','ابدأ'],understand:['Understand','Comprendre','فهم'],perfect:['Perfect','Perfectionner','تحسين'],
 experience:['Experience','Expérience','تجربة'],publish:['Publish','Publier','نشر'],manage:['Manage','Gérer','إدارة']
};
const editable=(name:string)=>/\.(html?|css|m?js|json|md|txt|csv|vtt)$/i.test(name);
const money=(size:number)=>size>=1048576?(size/1048576).toFixed(1)+' MiB':(size/1024).toFixed(0)+' KiB';

const L=(locale:Locale,en:string,fr:string,ar:string)=>locale==='fr'?fr:locale==='ar'?ar:en;
function crc32(bytes:Uint8Array){let c=0xffffffff;for(const b of bytes){c^=b;for(let n=0;n<8;n++)c=(c&1)?(c>>>1)^0xedb88320:c>>>1}return (c^0xffffffff)>>>0}
function u16(v:number){return [v&255,(v>>>8)&255]}
function u32(v:number){return [v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255]}
/** ZIP store format for native folder selection. No arbitrary server-side directory traversal. */
async function folderZip(files:File[]){
  if(files.length<1||files.length>1600)throw Error('Choose a project folder with up to 1600 files.');
  const encoder=new TextEncoder(),chunks:BlobPart[]=[],directory:Uint8Array[]=[];let offset=0,total=0;
  const listed=files.map(f=>({file:f,path:(f.webkitRelativePath||f.name).replace(/^[^/]+\//,'')}));
  for(const {file,path} of listed){
    if(!path||path.includes('\\')||path.startsWith('/')||path.split('/').some(x=>!x||x==='.'||x==='..'))throw Error('Unsafe folder path: '+path);
    const name=encoder.encode(path);if(name.length>512)throw Error('Path too long');
    total+=file.size;if(total>60*1024*1024||file.size>36*1024*1024)throw Error('Folder exceeds upload limits; select a ZIP instead.');
    const bytes=new Uint8Array(await file.arrayBuffer()),crc=crc32(bytes),size=bytes.length;
    const head=Uint8Array.from([...u32(0x04034b50),...u16(20),...u16(0x800),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(size),...u32(size),...u16(name.length),...u16(0)]);
    chunks.push(head,name,bytes);const central=Uint8Array.from([...u32(0x02014b50),...u16(20),...u16(20),...u16(0x800),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(size),...u32(size),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset)]);
    directory.push(central,name);offset+=head.length+name.length+size;
  }
  const cdLen=directory.reduce((sum,b)=>sum+b.length,0);const end=Uint8Array.from([...u32(0x06054b50),...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(cdLen),...u32(offset),...u16(0)]);
  const zipTail=[...directory,end].map(bytes=>{
    const buffer=new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    return buffer;
  });
  return new File([...chunks,...zipTail],'kidflix-folder-import.zip',{type:'application/zip'});
}
async function filesFromDraggedEntries(entries:any[]):Promise<File[]> {
  const all:File[]=[];
  async function visit(entry:any,prefix:string,depth:number):Promise<void> {
    if(depth>20||all.length>1600)throw Error('Folder exceeds depth or file limit.');
    if(entry.isFile){
      const file:File=await new Promise((resolve,reject)=>entry.file(resolve,reject));
      const relative=prefix+file.name;
      Object.defineProperty(file,'webkitRelativePath',{configurable:true,value:relative});
      all.push(file);return;
    }
    if(!entry.isDirectory)throw Error('Unsupported dropped entry');
    const reader=entry.createReader();
    for(;;){
      const batch:any[]=await new Promise((resolve,reject)=>reader.readEntries(resolve,reject));
      if(!batch.length)break;
      for(const child of batch)await visit(child,prefix+entry.name+'/',depth+1);
    }
  }
  for(const e of entries)await visit(e,'',0);
  return all;
}

export function UniversalInteractiveImport({
  locale,family,canManage,attached,recordId,currentTitle,publicPath,onSaveDraft,onTitleChange,onContinue,onOpenDossier,onAttach,
}:{
  locale:Locale;family:string;canManage:boolean;
  attached?:{id?:unknown;checksum?:unknown;locale?:unknown};recordId?:string;currentTitle?:string;publicPath?:string;onSaveDraft?:()=>Promise<void>;
  onTitleChange?:(value:string)=>void;onContinue?:()=>void;onOpenDossier?:()=>void;
  onAttach:(p:Result)=>void;
}){
  const fileInput=useRef<HTMLInputElement>(null),folderInput=useRef<HTMLInputElement>(null),replacementInput=useRef<HTMLInputElement>(null),frame=useRef<HTMLIFrameElement>(null),controller=useRef<AbortController|null>(null);
  const [expanded,setExpanded]=useState(false),[step,setStep]=useState<Step>('start');
  const [source,setSource]=useState<File|null>(null),[selection,setSelection]=useState(''),[drag,setDrag]=useState(false);
  const [phase,setPhase]=useState('idle'),[message,setMessage]=useState(''),[failure,setFailure]=useState(''),[transferProgress,setTransferProgress]=useState(0);
  const [result,setResult]=useState<Result|null>(null),[library,setLibrary]=useState<Listing[]>([]),[listingBusy,setListingBusy]=useState(false);
  const [fileSearch,setFileSearch]=useState(''),[currentPath,setCurrentPath]=useState(''),[content,setContent]=useState(''),[originalText,setOriginalText]=useState(''),[textBusy,setTextBusy]=useState(false);
  const [device,setDevice]=useState<'desktop'|'tablet'|'mobile'>('desktop'),[session,setSession]=useState(''),[events,setEvents]=useState<string[]>([]),[previewError,setPreviewError]=useState(''),[previewVersion,setPreviewVersion]=useState(0);
  const [confirmReplace,setConfirmReplace]=useState('');
  // KF_EXPERIENCE_STUDIO_ULTIMATE_20261103: one protected preview inspector and edit session.
  const [inspectEnabled,setInspectEnabled]=useState(false);
  const [inspectorSelection,setInspectorSelection]=useState<Selection|null>(null);
  const t=(en:string,fr:string,ar:string)=>L(locale,en,fr,ar);
  const foreign=!!result?.recordId&&result.recordId!==recordId;
  const isAttached=!!result&&!foreign&&String(attached?.id||'')===result.id&&String(attached?.checksum||'')===result.checksum;
  const selected=result?.files?.find(f=>f.path===currentPath);
  const visibleFiles=(result?.files||[]).filter(f=>f.path.toLowerCase().includes(fileSearch.toLowerCase())).slice(0,250);
  const packageFiles=result?.files||[];
  const assetUrl=(()=>{
    if(!result||!selected||!result.previewUrl)return '';
    try{
      const u=new URL(result.previewUrl),entryParts=result.entry.split('/').length;
      const pieces=u.pathname.split('/');pieces.splice(pieces.length-entryParts,entryParts);
      u.pathname=pieces.join('/')+'/'+selected.path.split('/').map(encodeURIComponent).join('/');
      u.hash='';return u.href;
    }catch{return ''}
  })();
  useEffect(()=>{folderInput.current?.setAttribute('webkitdirectory','');folderInput.current?.setAttribute('directory','');return()=>controller.current?.abort()},[]);
  function sendForm(form:FormData,signal:AbortSignal):Promise<any>{
    setTransferProgress(0);
    return new Promise((resolve,reject)=>{
      const xhr=new XMLHttpRequest();
      xhr.open('POST',API,true);xhr.withCredentials=true;
      const cancel=()=>xhr.abort();
      const cleanup=()=>signal.removeEventListener('abort',cancel);
      signal.addEventListener('abort',cancel,{once:true});
      xhr.upload.onprogress=e=>{
        if(e.lengthComputable&&e.total>0){const n=Math.min(96,Math.round(e.loaded/e.total*96));setTransferProgress(n);
          if(e.loaded>=e.total)setPhase('verifying');
        }
      };
      xhr.onerror=()=>{cleanup();reject(Error('Network interrupted. The selected source remains available for retry.'))};
      xhr.onabort=()=>{cleanup();reject(Error('Upload cancelled. You can retry the same source.'))};
      xhr.onload=()=>{
        cleanup();setTransferProgress(100);
        let body:any={};try{body=JSON.parse(xhr.responseText)}catch{}
        if(xhr.status<200||xhr.status>=300||!body?.data?.id)reject(Error(body?.error||'The server rejected this package.'));
        else resolve(body.data);
      };
      xhr.send(form);
    });
  }
  async function apiGet(params:Record<string,string>){
    const response=await fetch(API+'?'+new URLSearchParams(params).toString(),{credentials:'same-origin',cache:'no-store'});
    const body=await response.json();if(!response.ok)throw Error(body?.error||'Studio request failed');
    return body.data as any;
  }
  async function loadPackage(id:string,nextStep:Step='understand'){
    setFailure('');setPhase('loading');
    try{
      const data=await apiGet({operation:'info',id}) as Result;
      if(data.family!==family||data.locale!==locale)throw Error('Package category or language does not match this dossier.');
      setResult(data);setCurrentPath('');setContent('');setOriginalText('');setStep(nextStep);
      setInspectEnabled(false);setInspectorSelection(null);
      setSession(crypto.randomUUID());setPreviewVersion(v=>v+1);setEvents([]);setPreviewError('');setPhase('validated');
      setExpanded(true);
    }catch(e){setFailure((e as Error).message);setPhase('failed')}
  }
  const attachedId=typeof attached?.id==='string'?attached.id:'';
  useEffect(()=>{if(!attachedId)return;if(result?.id===attachedId&&result?.family===family&&result?.locale===locale)return;void loadPackage(attachedId,'understand');},[attachedId,family,locale]);
  async function reloadLibrary(){
    setListingBusy(true);
    try{const list=await apiGet({operation:'list',family,locale}) as Listing[];setLibrary(list)}
    catch(e){setFailure((e as Error).message)}finally{setListingBusy(false)}
  }
  useEffect(()=>{if(expanded&&step==='manage')void reloadLibrary()},[expanded,step,family,locale]);
  async function choose(files:FileList|File[]|null,folder:boolean){
    if(!files?.length)return;setFailure('');setMessage('');setPhase('preparing');
    try{
      if(!folder&&files.length!==1)throw Error('Select one complete ZIP or one project folder.');
      const value=folder?await folderZip(Array.from(files)):Array.from(files)[0];
      if(!value.name.toLowerCase().endsWith('.zip'))throw Error('Choose a .zip archive.');
      if(value.size>64*1024*1024)throw Error('ZIP exceeds 64 MiB.');
      setSource(value);setSelection(folder?files.length+' '+t('folder files','fichiers du dossier','ملفات المجلد'):value.name);
      setPhase('ready');setStep('start');setExpanded(true);
    }catch(e){setSource(null);setPhase('failed');setFailure((e as Error).message)}
  }
  async function submit(){
    if(!source||!canManage)return;
    setFailure('');setPhase('uploading');controller.current?.abort();controller.current=new AbortController();
    try{
      const form=new FormData();form.set('action','create');form.set('package',source);form.set('family',family);form.set('locale',locale);
      const saved=await sendForm(form,controller.current.signal);
      await loadPackage(saved.id,'understand');setSource(null);setSelection('');
      setMessage(t('Package validated and ready for review.','Package validé, prêt à être perfectionné.','تم التحقق من الحزمة وهي جاهزة للمراجعة.'));
    }catch(e){setPhase('failed');setFailure((e as Error).name==='AbortError'?t('Upload cancelled','Téléversement annulé','تم إلغاء الرفع'):(e as Error).message)}
  }
  async function selectFile(file:FileMeta){
    if(content!==originalText&&currentPath&&currentPath!==file.path&&
      !window.confirm(t('Discard unsaved edits before opening another file?',
        'Abandonner les modifications non enregistrées avant de changer de fichier ?',
        'هل تريد تجاهل التعديلات غير المحفوظة؟')))return;
    setCurrentPath(file.path);setContent('');setOriginalText('');setFailure('');
    if(!result||!editable(file.path)){setConfirmReplace(file.path);return}
    setTextBusy(true);try{
      const data=await apiGet({operation:'file',id:result.id,path:file.path});
      setContent(data.content);setOriginalText(data.content);
    }catch(e){setFailure((e as Error).message)}finally{setTextBusy(false)}
  }
  async function replaceFile(path:string,bytes:File){
    if(!canManage||!result)return;
    const selected=result.files?.find(x=>x.path===path);
    if(!selected)throw Error('Choose a real package asset.');
    setFailure('');setPhase('updating');controller.current?.abort();controller.current=new AbortController();
    const form=new FormData();form.set('action','derive');form.set('id',result.id);form.set('path',path);form.set('checksum',selected.sha256);form.set('replacement',bytes);
    try{
      const saved=await sendForm(form,controller.current.signal);
      await loadPackage(saved.id,'perfect');setMessage(t('New immutable revision created. Preview it and attach it to your draft.','Nouvelle révision créée. Vérifiez-la puis associez-la au brouillon.','تم إنشاء نسخة جديدة. عاينها ثم اربطها بالمسودة.'));
    }catch(e){setPhase('failed');setFailure((e as Error).message)}
  }
  async function cloneForThisDossier(){
    if(!result)return;setFailure('');setPhase('updating');
    try{
      const form=new FormData();form.set('action','clone');form.set('id',result.id);
      const response=await fetch(API,{method:'POST',credentials:'same-origin',body:form});
      const body=await response.json();if(!response.ok||!body?.data?.id)throw Error(body?.error||'Unable to copy this project');
      await loadPackage(body.data.id,'perfect');
      setMessage(t('Independent copy prepared. The original published experience remains unchanged.','Copie indépendante créée. L’expérience publiée d’origine reste intacte.','تم إعداد نسخة مستقلة دون تغيير التجربة الأصلية.'));
    }catch(e){setPhase('failed');setFailure((e as Error).message)}
  }
  async function downloadArchive(){
    if(!result)return;
    setFailure('');
    try{
      const response=await fetch(API+'?'+new URLSearchParams({operation:'archive',id:result.id}),{credentials:'same-origin',cache:'no-store'});
      if(!response.ok){const body=await response.json().catch(()=>({}));throw Error(body?.error||'Source archive unavailable')}
      const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download='kidflix-experience-'+result.id+'.zip';a.style.display='none';
      document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
    }catch(e){setFailure((e as Error).message)}
  }
  function saveText(){
    if(!selected||content===originalText)return;
    const file=new File([content],selected.path.split('/').pop()||'source.txt',{type:'text/plain;charset=utf-8'});
    void replaceFile(selected.path,file);
  }
  const previewUrl=result?.previewUrl||'';
  const previewOrigin=(()=>{try{return new URL(previewUrl).origin}catch{return ''}})();
  useEffect(()=>{if(!result||!session||!previewOrigin)return;const receive=(e:MessageEvent)=>{
    if(e.source!==frame.current?.contentWindow||e.origin!==previewOrigin||e.data?.contract!=='kidflix.interactive.bridge.1'||e.data?.channel!==session)return;
    const action=String(e.data.action||'');    if(action==='studio.select'){
      const next=e.data?.data as Selection;
      if(next&&typeof next.tag==='string'&&typeof next.selector==='string')setInspectorSelection(next);
      return;
    }
    if(action==='studio.runtimeError'||action==='studio.assetError'){
      const detail=String(e.data?.data?.message||e.data?.data?.source||'Unknown runtime problem').slice(0,230);
      setPreviewError((action==='studio.assetError'?'Missing asset: ':'Runtime error: ')+detail);
      setEvents(old=>[...old.slice(-18),action+' · '+detail]);return;
    }
    if(!['ready','progress','answer','save','complete','error','studio.inspect.available','studio.inspect.status'].includes(action))return;
    const label=action+(action==='progress'&&Number.isFinite(Number(e.data.data?.percent))?' · '+Number(e.data.data.percent)+'%':'');
    setEvents(old=>[...old.slice(-18),new Date().toLocaleTimeString()+' · '+label]);
    if(action==='error')setPreviewError(String(e.data?.data?.message||'Runtime error').slice(0,240));
    if(action==='ready'){
      frame.current?.contentWindow?.postMessage({contract:'kidflix.interactive.bridge.1',channel:session,action:'restore',data:{state:{}}},previewOrigin);
      frame.current?.contentWindow?.postMessage({contract:'kidflix.interactive.bridge.1',channel:session,action:'studio.inspect.set',data:{enabled:inspectEnabled}},previewOrigin);
    }
  };window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive)},[result?.id,session,previewOrigin,inspectEnabled]);
   useEffect(()=>{
     if(previewOrigin&&session)frame.current?.contentWindow?.postMessage({contract:'kidflix.interactive.bridge.1',channel:session,action:'studio.inspect.set',data:{enabled:inspectEnabled}},previewOrigin);
   },[inspectEnabled,previewOrigin,session]);
  async function refreshPreview(){if(!result)return;await loadPackage(result.id,'experience')}
  const previewSrc=previewUrl&&session?previewUrl+'#kfchannel='+encodeURIComponent(session)+'&view='+previewVersion:'';
  async function refreshPublicationProof(){
    if(!result)return;
    try{
      const updated=await apiGet({operation:'info',id:result.id}) as Result;
      setResult(updated);
      setMessage(updated.releaseId?t('Published release binding verified.','Liaison à la publication vérifiée.','تم التحقق من ربط النشر.'):
        t('Package is stored but not yet tied to a published release.','Package enregistré, pas encore lié à une publication.','الحزمة محفوظة ولم تُنشر بعد.'));
    }catch(e){setFailure((e as Error).message)}
  }
  async function saveVisualChanges(items:Partial<Record<VisualProperty,string>>,selector:string){
    if(!result||!canManage)throw Error('A validated editable package is required.');
    if(!/^(?:#[a-zA-Z_][\w-]{0,80}|\[data-kf-edit="[a-zA-Z0-9_-]{1,80}"\])$/.test(selector))throw Error('Only a stable id or data-kf-edit selector can be persisted.');
    const allowed=new Set(['color','backgroundColor','fontSize','borderRadius','padding']);
    const declarations=Object.entries(items).filter(([key,value])=>allowed.has(key)&&typeof value==='string'&&value.length<=80&&!/url\(|expression\(|[{};<>]/i.test(value));
    if(!declarations.length)throw Error('No safe visual properties to save.');
    const file=(result.files||[]).find(f=>/\.css$/i.test(f.path)&&f.size<248*1024)
      ||(result.files||[]).find(f=>f.path===result.entry&&f.size<248*1024);
    if(!file)throw Error('No editable stylesheet or entry HTML is available. Use the source editor to add a CSS file.');
    const payload=await apiGet({operation:'file',id:result.id,path:file.path});
    const body=String(payload.content||'');
    const cssName=(key:string)=>key.replace(/[A-Z]/g,s=>'-'+s.toLowerCase());
    const rule='\n/* KidFlix Studio · approved visual override */\n'+selector+' {\n'+declarations.map(([k,v])=>'  '+cssName(k)+': '+v+';').join('\n')+'\n}\n';
    const next=/\.css$/i.test(file.path)?body+rule:body.replace(/<\/head\s*>/i,'<style>'+rule+'</style></head>');
    if(next===body)throw Error('The HTML entry is missing a closing head element.');
    const replacement=new File([next],file.path.split('/').pop()||'source.css',{type:'text/plain;charset=utf-8'});
    const form=new FormData();form.set('action','derive');form.set('id',result.id);form.set('path',file.path);
    form.set('checksum',file.sha256);form.set('replacement',replacement);
    controller.current?.abort();controller.current=new AbortController();
    const saved=await sendForm(form,controller.current.signal);
    await loadPackage(saved.id,'perfect');
    setMessage(t('Visual changes saved in a new validated revision. Attach this revision when ready.',
      'Styles enregistrés dans une nouvelle révision vérifiée. Associez-la lorsque vous êtes prêt.',
      'تم حفظ التغييرات المرئية في إصدار جديد؛ اربطه عندما تكون جاهزًا.'));
  }
  const selectStep=(s:Step)=>{
    if(s!=='perfect'&&content!==originalText&&currentPath&&
       !window.confirm(t('Leave this step and discard unsaved source edits?',
         'Quitter cette étape et abandonner les modifications non enregistrées ?',
         'مغادرة الخطوة وتجاهل التعديلات غير المحفوظة؟')))return;
    setExpanded(true);setStep(s);setFailure('');
  };
  return <section className={styles.root} aria-label="KidFlix interactive experience production studio">
    <header className={styles.header}>
      <div className={styles.identity}>
        <span className={styles.eyebrow}>KIDFLIX · INTERACTIVE EXPERIENCE STUDIO</span>
        <h3>{t('From project to published experience','Du projet à l’expérience publiée','من المشروع إلى التجربة المنشورة')}</h3>
        <p>{t('Import, inspect, perfect, experience, publish and manage — without leaving Content 360.','Importer, comprendre, perfectionner, tester, publier et gérer — dans Content 360.','استيراد وفحص وتحسين وتجربة ونشر وإدارة ضمن Content 360.')}</p>
      </div>
      <button type="button" onClick={()=>setExpanded(x=>!x)} aria-expanded={expanded} className={styles.toggle}>{expanded?t('Close Studio','Fermer le studio','إغلاق'):t('Open Studio','Ouvrir le studio','فتح الاستوديو')}</button>
    </header>
    {expanded&&<div className={styles.body}>
      <nav className={styles.journey} aria-label="Experience production journey">
        {steps.map((s,index)=><button type="button" key={s} onClick={()=>selectStep(s)} className={`${styles.journeyStep} ${step===s?styles.active:''}`} aria-current={step===s?'step':undefined}>
          <small>{String(index+1).padStart(2,'0')}</small><span>{L(locale,...stepLabels[s])}</span>
        </button>)}
      </nav>
      <div className={styles.statusbar}>
        <span><b>{family}</b> · {locale.toUpperCase()}</span>
        <span>{result?result.title:t('New project','Nouveau projet','مشروع جديد')}</span>
        <span className={styles.state}>{phase}</span>
      </div>
      {failure&&<div className={styles.error} role="alert"><b>{t('Needs attention','À corriger','يتطلب الانتباه')}</b><p>{failure}</p><button type="button" onClick={()=>setFailure('')}>{t('Dismiss','Fermer','إغلاق')}</button></div>}
      {message&&<div className={styles.notice} role="status">{message}<button type="button" onClick={()=>setMessage('')}>×</button></div>}

      {step==='start'&&<div className={styles.stage}>
        <div className={styles.stageTitle}><h4>{t('Start with your complete project','Commencez avec votre projet complet','ابدأ بمشروعك الكامل')}</h4><p>{t('Your original HTML, CSS, JavaScript, photographs, audio and animations stay together.','Vos fichiers HTML, CSS, JavaScript, images, sons et animations restent ensemble.','تبقى ملفات HTML وCSS وJavaScript والصور والصوت والرسوم معًا.')}</p></div>
        <div className={styles.startGrid}>
          <button type="button" disabled={!canManage} onClick={()=>fileInput.current?.click()}><span className={styles.startIcon}>ZIP</span><strong>{t('Import complete ZIP','Importer un ZIP complet','استيراد ZIP كامل')}</strong><small>{t('Recommended universal format','Format universel conseillé','الصيغة العامة الموصى بها')}</small></button>
          <button type="button" disabled={!canManage} onClick={()=>folderInput.current?.click()}><span className={styles.startIcon}>DIR</span><strong>{t('Import project folder','Importer un dossier','استيراد مجلد')}</strong><small>{t('Retains nested project files','Conserve les sous-dossiers','يحفظ مجلدات المشروع')}</small></button>
          <a href="/kidflix/universal-interactive/KIDFLIX_UNIVERSAL_EXPERIENCE_MASTER.zip" download><span className={styles.startIcon}>SDK</span><strong>{t('Get AI Builder Master','Télécharger le master IA','تنزيل قالب الذكاء')}</strong><small>{t('One SDK, one chosen language','Un SDK, une langue choisie','قالب واحد ولغة محددة')}</small></a>
          <button type="button" onClick={()=>selectStep('manage')}><span className={styles.startIcon}>↻</span><strong>{t('Resume existing work','Reprendre un projet','استئناف مشروع')}</strong><small>{t('No repeat upload necessary','Aucun réimport nécessaire','دون إعادة رفع')}</small></button>
        </div>
        <input ref={fileInput} type="file" accept=".zip,application/zip" hidden onChange={e=>{void choose(e.target.files,false);e.target.value=''}}/>
        <input ref={folderInput} type="file" multiple hidden onChange={e=>{void choose(e.target.files,true);e.target.value=''}}/>
        <div className={styles.dropzone} data-drag={drag} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);const items=Array.from(e.dataTransfer.items).filter(x=>x.kind==='file'),entries=items.map(x=>(x as any).webkitGetAsEntry?.()).filter(Boolean);const files=Array.from(e.dataTransfer.files);if(entries.some((x:any)=>x.isDirectory))void filesFromDraggedEntries(entries).then(xs=>choose(xs,true)).catch(err=>setFailure(err.message));else void choose(files,files.length>1||files.some(x=>!!x.webkitRelativePath))}}>
          <strong>{selection||t('Drop your complete ZIP or folder here','Déposez votre ZIP ou dossier complet ici','أفلت ملف ZIP أو المجلد الكامل هنا')}</strong>
          <p>{t('Original assets remain organized. No separate Shared Media Vault visit.','Tous les fichiers restent organisés. Aucun passage par la médiathèque partagée.','تظل الملفات منظمة دون زيارة مكتبة الوسائط المشتركة.')}</p>
        </div>
        {(phase==='uploading'||phase==='verifying')&&<div className={styles.transferArea} role="status"><div className={styles.transferHead}><span>{phase==='verifying'?t('Transfer complete; validating the real project…','Transfert fini, analyse du projet en cours…','اكتمل الرفع، جارٍ الفحص…'):t('Transferring project…','Téléversement du projet…','جارٍ رفع المشروع…')}</span><b>{transferProgress}%</b></div><div className={styles.transferTrack}><span style={{width:transferProgress+'%'}}/></div></div>}
        <div className={styles.toolbar}><button type="button" className={styles.primary} onClick={()=>void submit()} disabled={!source||!canManage||phase==='uploading'||phase==='verifying'}>{['uploading','verifying'].includes(phase)?t('Processing project…','Analyse du projet…','جارٍ تجهيز المشروع…'):t('Import and understand this project','Importer et analyser le projet','استيراد وتحليل المشروع')}</button>{['uploading','verifying'].includes(phase)&&<button type="button" onClick={()=>controller.current?.abort()}>{t('Cancel','Annuler','إلغاء')}</button>}</div>
      </div>}

      {step==='understand'&&<div className={styles.stage}>
        {!result?<div className={styles.empty}>{t('Import a package or select a saved project to inspect its real contents.','Importez ou rouvrez un projet enregistré pour l’inspecter.','استورد أو افتح مشروعًا محفوظًا لفحصه.')}</div>:<>
          <div className={styles.stageTitle}><h4>{result.title}</h4><p>{t('The exact uploaded project and its declared capabilities.','Votre projet réel et les capacités qu’il déclare.','المشروع الحقيقي وقدراته المعلنة.')}</p></div>
          <div className={styles.metrics}>
            <div><small>{t('Files','Fichiers','الملفات')}</small><strong>{packageFiles.length||result.fileCount||'—'}</strong></div>
            <div><small>{t('Total size','Taille totale','الحجم')}</small><strong>{money(packageFiles.reduce((n,x)=>n+x.size,0)||result.totalBytes||0)}</strong></div>
            <div><small>{t('Edition','Édition','اللغة')}</small><strong>{result.locale.toUpperCase()}</strong></div>
            <div><small>{t('State','État','الحالة')}</small><strong>{result.state}</strong></div>
          </div>
          <div className={styles.overviewGrid}>
            <div className={styles.infoPanel}><h5>{t('Experience identity','Identité de l’expérience','هوية التجربة')}</h5>
              <p><b>{t('Category','Catégorie','الفئة')}:</b> {result.family}</p><p><b>{t('Entry point','Point d’entrée','نقطة الدخول')}:</b> <code>{result.entry}</code></p>
              <p><b>{t('Age range','Tranche d’âge','العمر')}:</b> {result.audience?.age_min??'—'}–{result.audience?.age_max??'—'}</p>
              <p><b>{t('Rights holder','Ayant droit','صاحب الحقوق')}:</b> {result.rights?.holder||'—'}</p>
              <p><b>{t('License','Licence','الترخيص')}:</b> {result.rights?.license||'—'}</p>
            </div>
            <div className={styles.infoPanel}><h5>{t('Runtime capabilities','Capacités interactives','القدرات التفاعلية')}</h5>
              <div className={styles.chips}>{(result.capabilities||[]).map(x=><span key={x}>{x}</span>)}{!result.capabilities?.length&&<span>{t('No optional capabilities declared','Aucune capacité facultative déclarée','لا قدرات إضافية معلنة')}</span>}</div>
              <p><b>{t('Package SHA-256','Empreinte SHA-256','البصمة')}:</b> <code>{result.checksum.slice(0,24)}…</code></p>
              <p>{t('Official KidFlix branding is provided by the trusted player host.','L’identité officielle KidFlix est fournie par le lecteur hôte.','هوية KidFlix الرسمية يوفرها مشغل المنصة.')}</p>
            </div>
          </div>
                     <StudioProjectIntelligence id={result.id} entry={result.entry} files={result.files||[]} locale={locale} onOpenFile={path=>{const file=result.files?.find(f=>f.path===path);if(file){setStep('perfect');void selectFile(file)}}}/>
<div className={styles.toolbar}><button type="button" className={styles.primary} onClick={()=>selectStep('perfect')}>{t('Perfect the experience','Perfectionner l’expérience','تحسين التجربة')}</button><button type="button" onClick={()=>selectStep('experience')}>{t('Play full preview','Ouvrir la prévisualisation','فتح المعاينة')}</button></div>
        </>}
      </div>}

      {step==='perfect'&&<div className={styles.stage}>{['updating','verifying'].includes(phase)&&<div className={styles.transferArea} role='status'><div className={styles.transferHead}><span>{t('Saving new validated revision…','Enregistrement de la révision…','جارٍ حفظ النسخة…')}</span><b>{transferProgress}%</b></div><div className={styles.transferTrack}><span style={{width:transferProgress+'%'}}/></div></div>}
        {!result?<div className={styles.empty}>{t('Choose a package first.','Choisissez d’abord un package.','اختر حزمة أولًا.')}</div>:<>
          <div className={styles.stageTitle}><h4>{t('Perfect without starting over','Perfectionnez sans recommencer','حسّن دون البدء من جديد')}</h4><p>{t('Edit supported project files or replace an existing asset. Each save creates a new complete validated revision.','Corrigez les fichiers et remplacez les médias. Chaque sauvegarde crée une nouvelle révision complète.','عدل الملفات والوسائط؛ كل حفظ ينشئ نسخة جديدة مستقلة.')}</p></div>
          <div className={styles.titleField}><label htmlFor="kf-studio-title">{t('Native dossier title','Titre du dossier natif','عنوان الملف')}</label><input id="kf-studio-title" value={currentTitle||''} onChange={e=>onTitleChange?.(e.target.value)} disabled={!canManage||!onTitleChange} placeholder={result.title}/><small>{t('Title edits are saved by Content 360, not by rewriting project source.','Le titre appartient au dossier Content 360, pas au code HTML.','العنوان يُحفظ في ملف Content 360 لا كود HTML.')}</small></div>
          <div className={styles.editorGrid}>
            <div className={styles.fileBrowser}><div className={styles.fileSearch}><strong>{t('Project files','Fichiers du projet','ملفات المشروع')}</strong><input aria-label="Search package files" placeholder={t('Find file…','Rechercher…','ابحث…')} value={fileSearch} onChange={e=>setFileSearch(e.target.value)}/></div>
              <div className={styles.files}>{visibleFiles.map(f=><button type="button" key={f.path} onClick={()=>void selectFile(f)} className={currentPath===f.path?styles.fileActive:''} title={f.path}><span>{editable(f.path)?'≡':'◆'}</span><span className={styles.fileName}>{f.path}</span><small>{money(f.size)}</small></button>)}</div>
              <small className={styles.fileCount}>{visibleFiles.length}/{packageFiles.length} {t('files','fichiers','ملفات')}</small>
            </div>
            <div className={styles.editorPanel}>{!selected?<div className={styles.empty}>{t('Choose a source file, image or audio asset from the project tree.','Choisissez un code, une image ou un fichier audio dans l’arborescence.','اختر ملفًا من شجرة المشروع.')}</div>:<>
              <div className={styles.editorHead}><strong>{selected.path}</strong><small>SHA {selected.sha256.slice(0,12)}…</small></div>
              {!editable(selected.path)&&<StudioAssetWorkbench packageId={result.id} file={selected} locale={locale} disabled={!canManage||phase==='updating'} onReplace={file=>replaceFile(selected.path,file)}/>}
              {editable(selected.path)?<>
                {textBusy?<p>{t('Loading source…','Chargement du code…','تحميل الكود…')}</p>:<StudioCodeEditor path={selected.path} value={content} original={originalText} onChange={setContent} onSave={saveText} disabled={!canManage||phase==='updating'} locale={locale}/>}
                <div className={styles.toolbar}><button type="button" onClick={()=>setContent(originalText)} disabled={content===originalText}>{t('Discard edits','Annuler les modifications','تراجع')}</button></div>
              </>:<><p>{t('Binary media is replaced directly; the rest of the project stays unchanged.','Remplacez directement ce média sans modifier le reste du projet.','استبدل الملف دون تعديل بقية المشروع.')}</p><button type="button" className={styles.primary} onClick={()=>{setConfirmReplace(selected.path);replacementInput.current?.click()}} disabled={!canManage||phase==='updating'}>{t('Replace this asset','Remplacer ce média','استبدال الملف')}</button></>}
            </>}</div>
          </div>
                     <StudioBatchMedia packageId={result.id} files={result.files||[]} locale={locale} disabled={!canManage||phase==='updating'} onRevision={pkg=>{void loadPackage(pkg.id,'perfect');setMessage(t('Batch replacement created a new validated package revision.','Remplacement groupé enregistré dans une nouvelle révision.','تم إنشاء إصدار جديد للاستبدال الجماعي.'))}}/>
<input ref={replacementInput} hidden type="file" onChange={e=>{const file=e.target.files?.[0];if(file&&confirmReplace)void replaceFile(confirmReplace,file);e.target.value='';setConfirmReplace('')}}/>
          <div className={styles.toolbar}><button type="button" onClick={()=>selectStep('experience')}>{t('Preview this revision','Tester cette révision','معاينة النسخة')}</button><button type="button" onClick={()=>void downloadArchive()}>{t('Export full source ZIP','Exporter le ZIP source complet','تصدير ملف ZIP الكامل')}</button>{onOpenDossier&&<button type="button" onClick={onOpenDossier}>{t('Full Content 360 editor','Éditeur Content 360 complet','محرر Content 360 الكامل')}</button>}</div>
        </>}
      </div>}

      {step==='experience'&&<div className={styles.stage}>
        {!result?<div className={styles.empty}>{t('Choose an imported package to play its real HTML application.','Choisissez un projet pour exécuter sa vraie application HTML.','اختر حزمة لتشغيل تطبيق HTML الحقيقي.')}</div>:<>
          <div className={styles.stageTitle}><h4>{t('Experience the actual application','Testez la vraie application','جرّب التطبيق الحقيقي')}</h4><p>{t('Interact with the executable package, not a screenshot or approximation.','Interagissez avec le package réel, pas une capture.','تفاعل مع الحزمة الحقيقية لا صورة ثابتة.')}</p></div>
          <div className={styles.previewTools}><div className={styles.deviceSwitch}>{(['desktop','tablet','mobile'] as const).map(x=><button type="button" key={x} className={device===x?styles.active:''} onClick={()=>setDevice(x)}>{x}</button>)}</div><button type="button" onClick={()=>void refreshPreview()}>{t('Restart / refresh session','Relancer la session','إعادة تشغيل الجلسة')}</button></div>
          <div className={styles.previewZone}><iframe key={result.id+session+previewVersion} ref={frame} title="KidFlix isolated interactive experience preview" className={styles.frame} style={{maxWidth:device==='desktop'?'100%':device==='tablet'?820:390}} src={previewSrc} sandbox="allow-scripts allow-same-origin" referrerPolicy="no-referrer"/></div>
                     <StudioVisualInspector locale={locale} enabled={inspectEnabled} selection={inspectorSelection} onToggle={setInspectEnabled} disabled={!canManage||phase==='updating'}
             onApply={(key,value)=>{if(inspectorSelection?.selector&&previewOrigin&&session)frame.current?.contentWindow?.postMessage({contract:'kidflix.interactive.bridge.1',channel:session,action:'studio.inspect.apply',data:{selector:inspectorSelection.selector,property:key,value}},previewOrigin)}}
             onSave={saveVisualChanges}/>
<div className={styles.eventsPanel}><div><strong>{t('Live interaction diagnostics','Diagnostic des interactions','تشخيص التفاعلات')}</strong><button type="button" onClick={()=>setEvents([])}>{t('Clear','Effacer','مسح')}</button></div><p>{previewError||events.slice(-6).join(' · ')||t('Start interacting; events will appear here.','Interagissez ; les événements apparaîtront ici.','ابدأ التفاعل وستظهر الأحداث هنا.')}</p></div>
                     <StudioAIRepairHandoff locale={locale} family={family} title={result.title} packageId={result.id} files={result.files||[]} events={events} previewError={previewError} onExportSource={downloadArchive}/>
           <div className={styles.toolbar}><button type="button" className={styles.primary} onClick={()=>selectStep('publish')}>{t('Ready for publication review','Passer à la publication','متابعة النشر')}</button><button type="button" onClick={()=>selectStep('perfect')}>{t('Improve something','Modifier un élément','تحسين عنصر')}</button></div>
        </>}
      </div>}

      {step==='publish'&&<div className={styles.stage}>
        {!result?<div className={styles.empty}>{t('Choose and preview a package first.','Choisissez et testez d’abord un package.','اختر وعاين الحزمة أولًا.')}</div>:<>
          <div className={styles.stageTitle}><h4>{t('Connect to native publication','Rejoindre la publication native','الربط بالنشر الأصلي')}</h4><p>{t('The existing Content 360 review and publish controls remain authoritative.','Le dossier Content 360 conserve l’autorité de validation et publication.','يظل ملف Content 360 مسؤولًا عن المراجعة والنشر.')}</p></div>
          <div className={styles.publishRow}><div><small>{t('Chosen project','Projet choisi','المشروع')}</small><strong>{result.title}</strong><p>{result.family} · {result.locale.toUpperCase()} · {result.checksum.slice(0,18)}…</p></div><span className={isAttached?styles.ok:styles.pending}>{isAttached?t('Linked to this draft','Lié au brouillon','مرتبط بالمسودة'):t('Not linked yet','Non lié','غير مرتبط')}</span></div>
                     <div className={styles.publishRow}>
             <div><small>{t('Publication proof','Preuve de publication','إثبات النشر')}</small>
             <strong>{result.releaseId?t('Native published release detected','Publication native détectée','تم رصد النشر الأصلي'):t('Awaiting native publication','En attente de publication native','بانتظار النشر')}</strong>
             {result.releaseId&&<p>Release ID: <code>{result.releaseId}</code></p>}
             {result.releaseId&&publicPath&&publicPath.startsWith('/')&&!publicPath.startsWith('//')&&
               <a href={publicPath} target="_blank" rel="noopener noreferrer">{t('Open actual public page','Ouvrir la page publique','فتح الصفحة العامة')}</a>}
             <p>{t('A saved package alone is not a published resource.','Le simple enregistrement du package ne constitue pas une publication.','حفظ الحزمة لا يعني نشرها.')}</p>
           </div>
           </div>
           <button type="button" onClick={()=>void refreshPublicationProof()}>{t('Verify real publication status','Vérifier la publication réelle','التحقق من النشر الفعلي')}</button>
           {foreign&&<p className={styles.publishNote} role="status">{t('This package belongs to another dossier. Make an independent copy before attaching it here.','Ce package est lié à un autre dossier. Créez une copie indépendante avant de l’associer.','هذه الحزمة مرتبطة بملف آخر. أنشئ نسخة مستقلة قبل الربط.')}</p>}
          <div className={styles.toolbar}>{foreign&&<button type="button" className={styles.primary} disabled={!canManage} onClick={()=>void cloneForThisDossier()}>{t('Make independent copy','Créer une copie indépendante','إنشاء نسخة مستقلة')}</button>}{!foreign&&!isAttached&&<button type="button" className={styles.primary} disabled={!canManage} onClick={()=>{onAttach(result);setMessage(t('Package attached locally. Save this native dossier to persist the revision.','Package associé. Enregistrez le dossier natif pour conserver la révision.','تم الربط. احفظ الملف الأصلي لتثبيت النسخة.'))}}>{t('Attach this exact revision','Associer cette révision','اربط هذه النسخة')}</button>}{isAttached&&onSaveDraft&&<button type="button" disabled={!canManage||phase==='saving'} onClick={()=>{setPhase('saving');void onSaveDraft().then(()=>{setPhase('validated');setMessage(t('Native dossier saved. Continue with final Content 360 review.','Dossier natif enregistré. Continuez vers la vérification finale.','تم حفظ الملف الأصلي؛ تابع المراجعة النهائية.'))}).catch(e=>{setPhase('failed');setFailure(String(e))})}}>{t('Save native draft','Enregistrer le brouillon natif','حفظ المسودة الأصلية')}</button>}{isAttached&&<button type="button" className={styles.primary} onClick={onContinue}>{t('Continue to native Save / Review / Publish','Continuer vers Enregistrer / Vérifier / Publier','متابعة الحفظ والمراجعة والنشر')}</button>}{onOpenDossier&&<button type="button" onClick={onOpenDossier}>{t('Open complete dossier','Ouvrir le dossier complet','فتح الملف الكامل')}</button>}</div>
          <p className={styles.publishNote}>{t('Publishing is only confirmed when Content 360 reports the real active public release. Uploading or attaching a package alone is not publication.','La publication n’est confirmée qu’après activation réelle de l’édition publique. Le téléversement ne suffit pas.','النشر مؤكد فقط بعد تفعيل الإصدار العام في Content 360.')}</p>
        </>}
      </div>}

      {step==='manage'&&<div className={styles.stage}>
        <div className={styles.stageTitle}><h4>{t('All your recoverable experience packages','Retrouvez vos expériences enregistrées','استعد مشاريعك المحفوظة')}</h4><p>{t('Resume, compare, reuse or restore validated revisions. No repeat uploads.','Reprenez, comparez, réutilisez ou restaurez sans nouvel import.','استأنف أو قارن أو استعد دون إعادة رفع.')}</p></div>
        <div className={styles.toolbar}><button type="button" disabled={listingBusy} onClick={()=>void reloadLibrary()}>{listingBusy?t('Loading…','Chargement…','تحميل…'):t('Refresh library','Actualiser la liste','تحديث القائمة')}</button><button type="button" onClick={()=>selectStep('start')}>{t('Import another experience','Importer une autre expérience','استيراد تجربة أخرى')}</button></div>
                 {library.length>1&&<StudioRevisionCompare locale={locale} library={library} activeId={result?.id} onOpen={id=>{void loadPackage(id,'understand')}} onRestore={id=>{void loadPackage(id,'publish');setMessage(t('Older revision loaded. Attach it to your draft to prepare a new publication.','Ancienne révision chargée. Associez-la au brouillon pour préparer une republication.','تم تحميل الإصدار السابق؛ اربطه بالمسودة للنشر.'))}}/>}
{!library.length?<div className={styles.empty}>{listingBusy?t('Loading packages…','Chargement des packages…','تحميل الحزم…'):t('No saved packages for this category and language yet.','Aucun package pour cette catégorie et cette langue.','لا توجد حزم محفوظة لهذه الفئة واللغة.')}</div>:<div className={styles.library}>{library.map(item=><div key={item.id} className={styles.libraryRow}><div><strong>{item.title}</strong><p>{item.state} · {item.files} {t('files','fichiers','ملفات')} · {item.createdAt?new Date(item.createdAt).toLocaleString(locale):''}</p>{item.parentId&&<small>{t('Revision of','Révision de','نسخة من')} {item.parentId.slice(0,8)}…</small>}</div><div className={styles.toolbar}><button type="button" onClick={()=>void loadPackage(item.id,'understand')}>{t('Open','Ouvrir','فتح')}</button>{item.id!==attachedId&&<button type="button" onClick={()=>void loadPackage(item.id,'experience')}>{t('Preview','Prévisualiser','معاينة')}</button>}</div></div>)}</div>}
      </div>}
    </div>}
  </section>;
}
