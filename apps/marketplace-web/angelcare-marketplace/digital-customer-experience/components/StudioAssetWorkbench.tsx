'use client';
import {useEffect,useRef,useState} from 'react';
import st from './studio-ultimate.module.css';
const API='/api/angelcare-marketplace/admin/digital-customer-experience/interactive-package';
type MediaFile={path:string;size:number;mime:string;sha256:string};
function label(locale:string,en:string,fr:string,ar:string){return locale==='fr'?fr:locale==='ar'?ar:en}
export function StudioAssetWorkbench({packageId,file,onReplace,disabled,locale}:{packageId:string;file:MediaFile;onReplace:(file:File)=>Promise<void>|void;disabled:boolean;locale:string}){
 const [url,setUrl]=useState(''),[failure,setFailure]=useState(''),[scale,setScale]=useState(1),[quality,setQuality]=useState(.9),[progress,setProgress]=useState(false);
 const [natural,setNatural]=useState({width:0,height:0});const canvas=useRef<HTMLCanvasElement>(null);
 const T=(en:string,fr:string,ar:string)=>label(locale,en,fr,ar);
 useEffect(()=>{let alive=true;let object='';const ac=new AbortController();setUrl('');setFailure('');setScale(1);
  async function load(){try{
   const q=new URLSearchParams({operation:'asset',id:packageId,path:file.path});
   const r=await fetch(API+'?'+q.toString(),{credentials:'same-origin',cache:'no-store',signal:ac.signal});
   if(!r.ok)throw Error('Unable to retrieve this media through the authenticated Studio.');
   const blob=await r.blob();if(!alive)return;object=URL.createObjectURL(blob);setUrl(object);
  }catch(e){if(alive)setFailure((e as Error).message)}}
  void load();return()=>{alive=false;ac.abort();if(object)URL.revokeObjectURL(object)};
 },[packageId,file.path,file.sha256]);
 const preview=file.mime.startsWith('image/')?'image':file.mime.startsWith('audio/')?'audio':file.mime.startsWith('video/')?'video':'other';
 const editableImage=preview==='image'&&/\.(?:png|jpe?g)$/i.test(file.path);
 async function transform(){
  if(!editableImage||!url||disabled)return;
  setProgress(true);setFailure('');
  try{
   const img=new Image();img.src=url;await img.decode();
   const factor=Math.max(1,Math.min(3,scale));const cropW=img.naturalWidth/factor,cropH=img.naturalHeight/factor;
   const c=canvas.current||document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;
   if(c.width*c.height>32_000_000)throw Error('Image exceeds safe in-browser processing limit.');
   const ctx=c.getContext('2d');if(!ctx)throw Error('Canvas is unavailable.');
   ctx.drawImage(img,(img.naturalWidth-cropW)/2,(img.naturalHeight-cropH)/2,cropW,cropH,0,0,c.width,c.height);
   const mime=/\.png$/i.test(file.path)?'image/png':'image/jpeg';
   const blob:Blob=await new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(Error('Image processing failed')),mime,quality));
   if(blob.size>36*1024*1024)throw Error('Edited media exceeds the package limit.');
   await onReplace(new File([blob],file.path.split('/').pop()||'asset.png',{type:mime}));
  }catch(e){setFailure((e as Error).message)}finally{setProgress(false)}
 }
 return <section className={st.panel} aria-label={T('Media workbench','Atelier média','محرر الوسائط')}>
  <div className={st.heading}><div><span className={st.eyebrow}>MEDIA · PRIVATE PACKAGE ASSET</span><h4>{T('Refine this asset','Perfectionner ce média','تحسين الوسائط')}</h4><p>{file.path}</p></div><span className={st.pill}>{file.mime.split('/')[0]}</span></div>
  <div className={st.mediaFrame}>
   {url?(preview==='image'?<img src={url} alt={file.path} onLoad={e=>setNatural({width:e.currentTarget.naturalWidth,height:e.currentTarget.naturalHeight})}/>:preview==='audio'?<audio controls src={url} preload="metadata"/>:preview==='video'?<video controls src={url} preload="metadata"/>:null):<p>{T('Loading secure asset…','Chargement sécurisé…','جارٍ تحميل الملف…')}</p>}
  </div>
  {editableImage&&<div className={st.mediaControls}>
   <label>{T('Centre crop / zoom','Recadrage centré / zoom','قص مركزي / تكبير')} <input type="range" min={1} max={2.5} step={.05} value={scale} onChange={e=>setScale(+e.target.value)} disabled={disabled||progress}/><b>{scale.toFixed(2)}×</b></label>
   {/\.jpe?g$/i.test(file.path)&&<label>{T('JPEG quality','Qualité JPEG','جودة JPEG')} <input type="range" min={.65} max={1} step={.05} value={quality} onChange={e=>setQuality(+e.target.value)} disabled={disabled||progress}/><b>{Math.round(quality*100)}%</b></label>}
   <span>{natural.width} × {natural.height} px</span>
   <button type="button" onClick={()=>void transform()} disabled={disabled||progress||!url||scale===1}>{progress?T('Creating revision…','Création de la révision…','جارٍ الحفظ…'):T('Save crop as new revision','Enregistrer le recadrage en nouvelle révision','حفظ القص في إصدار جديد')}</button>
  </div>}
  {failure&&<p role="alert" className={st.error}>{failure}</p>}
  <p className={st.note}>{T('The original asset and published release remain untouched. PNG remains PNG; JPEG remains JPEG.','Le média original et la version publiée restent intacts. Le PNG reste PNG ; le JPEG reste JPEG.','يبقى الملف الأصلي والإصدار المنشور دون تغيير.')}</p>
  <canvas ref={canvas} hidden/>
 </section>;
}
