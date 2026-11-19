'use client';
import { useEffect,useRef,useState } from 'react';
import type { PlayerProps } from './shared';
import s from './interactive-player-controls.module.css';
const uuid=(v:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
type KfBridge={contract:string;channel:string;action:string;data?:any};
const SMALL={padding:'8px 12px',border:'1px solid #d8e4ee',borderRadius:9,background:'#fff',color:'#275274',fontSize:11,fontWeight:750,cursor:'pointer'} as const;
export function UniversalInteractivePlayer({p,packageId,checksum,entry='index.html'}:{p:PlayerProps;packageId:string;checksum:string;entry?:string}){
  const t=(en:string,fr:string,ar:string)=>p.locale==='fr'?fr:p.locale==='ar'?ar:en;
  const frame=useRef<HTMLIFrameElement>(null),shell=useRef<HTMLDivElement>(null);
  const [failure,setFailure]=useState(''),[ready,setReady]=useState(false),[bridge,setBridge]=useState(false),[busy,setBusy]=useState(false),[channel,setChannel]=useState(''),[reload,setReload]=useState(0);
  const [percent,setPercent]=useState<number|null>(null);
  const viewport=useRef<HTMLDivElement>(null);
  const [zoom,setZoom]=useState(1);
  const [size,setSize]=useState({width:800,height:600});
  const [fullscreen,setFullscreen]=useState(false);
  const [landscape,setLandscape]=useState(false);
  const [orientationError,setOrientationError]=useState('');
  const fallbackLandscape=landscape&&!fullscreen;
  useEffect(()=>{setChannel(crypto.randomUUID());setReady(false);setBridge(false);setFailure('');setPercent(null)},[packageId,p.m.releaseId,reload]);
  const configuredOrigin=process.env.NEXT_PUBLIC_KIDFLIX_INTERACTIVE_RUNTIME_ORIGIN||'';
  const officialLogo=process.env.NEXT_PUBLIC_KIDFLIX_OFFICIAL_LOGO_PATH||'/kidflix/kidflix-official.png';
  const [origin,setOrigin]=useState('');
  useEffect(()=>{
    try{
      const u=new URL(configuredOrigin||window.location.origin);
      // KIDFLIX_RUNTIME_ROOT_HOST_BRIDGE_R1: The root is a public application
      // entrypoint. Executable HTML remains on the existing authorized runtime.
      if(window.location.hostname.toLowerCase()==='angelcarehub.com'&&
         u.origin==='https://angelcarehub.com'&&u.pathname==='/'&&!u.search&&!u.hash)
        u.hostname='my.angelcarehub.com';
      setOrigin(u.protocol==='https:'&&u.pathname==='/'&&!u.search&&!u.hash?u.origin:'');
    }catch{setOrigin('')}
  },[configuredOrigin]);
  const valid=!!channel&&uuid(packageId)&&uuid(String(p.m.releaseId))&&/^[a-f0-9]{64}$/i.test(checksum)&&!!origin&&/^[A-Za-z0-9/_.-]+\.html$/.test(entry)&&!entry.split('/').includes('..')&&/^\/[A-Za-z0-9/_.-]+\.png$/.test(officialLogo);
  // Read the host viewport only. The sandboxed educational iframe is not inspected or reloaded.
  useEffect(()=>{
    const el=viewport.current;
    if(!el)return;
    const measure=()=>setSize(v=>{
      const width=Math.max(1,Math.floor(el.clientWidth));
      const height=Math.max(1,Math.floor(el.clientHeight));
      return v.width===width&&v.height===height?v:{width,height};
    });
    measure();
    const observer=new ResizeObserver(measure);
    observer.observe(el);
    return()=>observer.disconnect();
  },[valid,fullscreen,landscape]);
  useEffect(()=>{
    const changed=()=>{
      const active=document.fullscreenElement===shell.current;
      setFullscreen(active);
      if(!active)setLandscape(false);
    };
    document.addEventListener('fullscreenchange',changed);
    return()=>document.removeEventListener('fullscreenchange',changed);
  },[]);
  useEffect(()=>{
    if(!fallbackLandscape)return;
    const prior=document.body.style.overflow;
    document.body.style.overflow='hidden';
    return()=>{document.body.style.overflow=prior};
  },[fallbackLandscape]);
  const exitScreen=async()=>{
    if(document.fullscreenElement===shell.current){
      try{await document.exitFullscreen()}catch{setOrientationError(t('Could not exit fullscreen.','Impossible de quitter le plein écran.','تعذر الخروج من ملء الشاشة.'))}
    }
    try{screen.orientation.unlock?.()}catch{/* Browser may not support orientation unlock */}
    setLandscape(false);
    setOrientationError('');
  };
  const toggleFullscreen=async(requestLandscape:boolean)=>{
    if(fullscreen||fallbackLandscape){await exitScreen();return}
    setOrientationError('');
    let native=false;
    try{
      if(shell.current?.requestFullscreen){
        await shell.current.requestFullscreen();
        native=document.fullscreenElement===shell.current;
      }
    }catch{/* Use reversible page-level fullscreen fallback on unsupported browsers. */}
    if(native){
      setFullscreen(true);
      setLandscape(requestLandscape);
      if(requestLandscape){
        try{
          const orientation=screen.orientation as ScreenOrientation & {lock?:(value:'landscape')=>Promise<void>};
          if(!orientation.lock)throw Error('ORIENTATION_LOCK_UNAVAILABLE');
          await orientation.lock('landscape');
        }catch{
          setOrientationError(t('Rotate your device for landscape viewing.','Tournez votre appareil pour le mode paysage.','أدر جهازك للعرض الأفقي.'));
        }
      }
    }else{
      setLandscape(true);
      setOrientationError(requestLandscape
        ?t('Rotate your device if needed.','Tournez votre appareil si nécessaire.','أدر جهازك إذا لزم الأمر.')
        :'');
    }
  };
  const src=valid?`${origin}/api/kidflix/interactive/runtime/release/${encodeURIComponent(String(p.m.releaseId))}/${packageId}/${entry.split('/').map(encodeURIComponent).join('/')}#kfchannel=${channel}`:'';
  useEffect(()=>{
    if(!valid)return;
    const receive=(e:MessageEvent<KfBridge>)=>{
      if(e.source!==frame.current?.contentWindow||e.origin!=='null'||e.data?.contract!=='kidflix.interactive.bridge.1'||e.data?.channel!==channel)return;
      const d=e.data.data||{};
      switch(e.data.action){
        case 'host.loaded':setReady(true);setBusy(false);if(d.assetsReady===false)setFailure(t('Some experience assets could not load. Reload or contact the publisher.','Certains fichiers n’ont pas pu être chargés. Relancez ou contactez l’éditeur.','تعذر تحميل بعض الملفات. أعد المحاولة أو اتصل بالناشر.'));break;
        case 'host.assetError':case 'host.runtimeError':setFailure(String(d.message||d.source||t('An experience asset could not load.','Un fichier de l’expérience n’a pas pu être chargé.','تعذر تحميل ملف من التجربة.')).slice(0,240));break;
        case 'ready':setReady(true);setBridge(true);setBusy(false);frame.current?.contentWindow?.postMessage({contract:'kidflix.interactive.bridge.1',channel,action:'restore',data:{state:p.state.interactiveState||{}}},'*');break;
        case 'progress':{const v=Number(d.percent);if(Number.isFinite(v)&&v>=0&&v<=100){setPercent(v);p.update({started:true,interactivePercent:v})}break}
        case 'save':{const v=d.state;if(v&&typeof v==='object'&&!Array.isArray(v)&&JSON.stringify(v).length<=12000)p.update({started:true,interactiveState:v});break}
        case 'answer':p.update({started:true});break;
        case 'complete':p.update({started:true,interactiveReportedComplete:true});break;
        case 'error':setFailure(t('The experience reported an error. Reload or contact the publisher.','L’expérience a signalé une erreur. Relancez ou contactez l’éditeur.','أبلغت التجربة عن خطأ. أعد المحاولة أو اتصل بالناشر.'));setBusy(false);break;
      }
    };
    window.addEventListener('message',receive);
    return()=>window.removeEventListener('message',receive);
  },[origin,channel,valid,p.update,p.state.interactiveState]);
  useEffect(()=>{if(!valid||ready)return;const timeoutId=setTimeout(()=>{if(!ready)setFailure(t('The experience is not responding yet. You can reload it.','L’expérience ne répond pas encore. Vous pouvez la relancer.','التجربة لا تستجيب بعد. يمكنك إعادة تحميلها.'))},16000);return()=>clearTimeout(timeoutId)},[valid,ready,src]);
  if(!valid)return <div role="alert" style={{padding:22,background:'#fff5f1',borderRadius:12}}>{t('The interactive player configuration is unavailable. Please contact the publisher.','La configuration du lecteur interactif est indisponible. Contactez l’éditeur.','إعداد المشغل التفاعلي غير متاح. يرجى الاتصال بالناشر.')}</div>;
  return <section ref={shell} className={`${s.shell} ${fallbackLandscape?s.fullscreenShell:''} ${fallbackLandscape?s.rotated:''}`} aria-label={t('KidFlix interactive experience','Expérience KidFlix interactive','تجربة كيدفليكس التفاعلية')}>
    <div className={s.toolbar}>
      <div className={s.brand}>
        <span className={`${s.liveDot} ${ready?s.readyDot:''}`}/>
        <div className={s.brandText}><strong>KidFlix Interactive</strong><span>{ready?(bridge?t('Connected','Connecté','متصل'):t('Loaded','Chargé','تم التحميل')):t('Loading','Chargement','جارٍ التحميل')}{percent!==null?` · ${Math.round(percent)}%`:''}</span></div>
      </div>
      <div className={s.controls} role="group" aria-label={t('Player controls','Commandes du lecteur','أدوات التحكم بالمشغل')}>
        <button type="button" className={s.control} disabled={zoom<=0.75} title={t('Zoom out','Réduire','تصغير')} aria-label={t('Zoom out','Réduire','تصغير')} onClick={()=>setZoom(z=>Math.max(.75,Math.round((z-.25)*100)/100))}>−</button>
        <output className={s.scale} aria-label={t('Zoom level','Niveau de zoom','مستوى التكبير')}>{Math.round(zoom*100)}%</output>
        <button type="button" className={s.control} disabled={zoom>=2} title={t('Zoom in','Agrandir','تكبير')} aria-label={t('Zoom in','Agrandir','تكبير')} onClick={()=>setZoom(z=>Math.min(2,Math.round((z+.25)*100)/100))}>+</button>
        <button type="button" className={`${s.control} ${s.fit}`} aria-label={t('Fit to player','Ajuster au lecteur','ملاءمة المشغل')} onClick={()=>{setZoom(1);viewport.current?.scrollTo({top:0,left:0})}}>{t('Fit','Ajuster','ملاءمة')}</button>
        <button type="button" className={s.control} onClick={()=>{setReady(false);setFailure('');setBusy(true);setReload(x=>x+1)}}>{t('Reload','Relancer','إعادة التحميل')}</button>
        <button type="button" className={s.control} onClick={()=>{void toggleFullscreen(false)}} aria-pressed={fullscreen||fallbackLandscape}>{fullscreen||fallbackLandscape?t('Exit fullscreen','Quitter le plein écran','الخروج من ملء الشاشة'):t('Fullscreen','Plein écran','ملء الشاشة')}</button>
        <button type="button" className={`${s.control} ${s.landscape}`} onClick={()=>{void toggleFullscreen(true)}} aria-pressed={landscape||fallbackLandscape}>{landscape||fallbackLandscape?t('Exit landscape','Quitter paysage','إنهاء العرض الأفقي'):t('Landscape','Paysage','أفقي')}</button>
      </div>
    </div>
    <div ref={viewport} className={s.viewport}>
      <div className={s.canvas} style={{width:Math.ceil(size.width*zoom),height:Math.ceil(size.height*zoom)}}>
        <iframe key={src} ref={frame} className={s.frame} title={String(p.m.title||'KidFlix interactive experience')} src={src} sandbox="allow-scripts" referrerPolicy="no-referrer" allow="fullscreen" style={{width:size.width,height:size.height,transform:`scale(${zoom})`,transformOrigin:'top left'}}/>
      </div>
    </div>
    {orientationError&&<p className={s.message} role="status">{orientationError}</p>}
    {!ready&&!failure&&<p className={s.message} role="status">{t('Opening your interactive experience…','Ouverture de votre expérience interactive…','جارٍ فتح تجربتك التفاعلية…')}</p>}
    {failure&&<p className={s.error} role="alert">{failure} {busy?t('Retrying…','Nouvelle tentative…','جارٍ إعادة المحاولة…'):''}</p>}
  </section>;
}
