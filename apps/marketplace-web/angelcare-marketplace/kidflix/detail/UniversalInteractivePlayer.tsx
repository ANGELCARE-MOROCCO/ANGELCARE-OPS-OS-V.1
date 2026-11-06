'use client';
import { useEffect,useRef,useState } from 'react';
import type { PlayerProps } from './shared';
const uuid=(v:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
type KfBridge={contract:string;channel:string;action:string;data?:any};
const SMALL={padding:'8px 12px',border:'1px solid #d8e4ee',borderRadius:9,background:'#fff',color:'#275274',fontSize:11,fontWeight:750,cursor:'pointer'} as const;
export function UniversalInteractivePlayer({p,packageId,checksum,entry='index.html'}:{p:PlayerProps;packageId:string;checksum:string;entry?:string}){
  const t=(en:string,fr:string,ar:string)=>p.locale==='fr'?fr:p.locale==='ar'?ar:en;
  const frame=useRef<HTMLIFrameElement>(null),shell=useRef<HTMLDivElement>(null);
  const [failure,setFailure]=useState(''),[ready,setReady]=useState(false),[bridge,setBridge]=useState(false),[busy,setBusy]=useState(false),[channel,setChannel]=useState(''),[reload,setReload]=useState(0);
  const [percent,setPercent]=useState<number|null>(null);
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
  useEffect(()=>{if(!valid||ready)return;const t=setTimeout(()=>{if(!ready)setFailure(t('The experience is not responding yet. You can reload it.','L’expérience ne répond pas encore. Vous pouvez la relancer.','التجربة لا تستجيب بعد. يمكنك إعادة تحميلها.'))},16000);return()=>clearTimeout(t)},[valid,ready,src]);
  if(!valid)return <div role="alert" style={{padding:22,background:'#fff5f1',borderRadius:12}}>{t('The interactive player configuration is unavailable. Please contact the publisher.','La configuration du lecteur interactif est indisponible. Contactez l’éditeur.','إعداد المشغل التفاعلي غير متاح. يرجى الاتصال بالناشر.')}</div>;
  return <section ref={shell} aria-label="KidFlix interactive experience" style={{position:'relative',borderRadius:17,overflow:'hidden',border:'1px solid #dce5ef',background:'#fff',boxShadow:'0 4px 23px #1b364414'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap',padding:'10px 13px',borderBottom:'1px solid #e1eaf1',background:'#f9fbfe'}}>
      <div style={{display:'flex',gap:8,alignItems:'center'}}><span style={{display:'inline-block',width:7,height:7,borderRadius:8,background:ready?'#0fa77b':'#ddaa3f'}}/><strong style={{fontSize:12,color:'#17334e'}}>KidFlix Interactive</strong><span style={{fontSize:10,color:'#76879a'}}>{ready?(bridge?t('Connected','Connecté','متصل'):t('Loaded','Chargé','تم التحميل')):t('Loading','Chargement','جارٍ التحميل')}{percent!==null?` · ${Math.round(percent)}%`:''}</span></div>
      <div style={{display:'flex',gap:5,alignItems:'center',flexWrap:'wrap'}}>

        <button type="button" style={SMALL} onClick={()=>{setReady(false);setFailure('');setBusy(true);setReload(x=>x+1)}}>{t('Reload','Relancer','إعادة التحميل')}</button>
        <button type="button" style={SMALL} onClick={()=>{void shell.current?.requestFullscreen?.().catch(()=>setFailure(t('Fullscreen is unavailable on this device.','Le plein écran est indisponible sur cet appareil.','وضع ملء الشاشة غير متاح على هذا الجهاز.')))}}>{t('Fullscreen','Plein écran','ملء الشاشة')}</button>
      </div>
    </div>
    <div style={{display:'flex',justifyContent:'center',background:'#fff',padding:0}}>
      <iframe key={src} ref={frame} title={String(p.m.title||'KidFlix interactive experience')} src={src} sandbox="allow-scripts" referrerPolicy="no-referrer" allow="fullscreen" style={{width:'100%',height:'min(76vh,800px)',minHeight:460,border:0,display:'block',background:'#fff'}}/>
    </div>
    {!ready&&!failure&&<p role="status" style={{padding:'8px 13px',margin:0,fontSize:11,color:'#647789'}}>{t('Opening your interactive experience…','Ouverture de votre expérience interactive…','جارٍ فتح تجربتك التفاعلية…')}</p>}

    {failure&&<p role="alert" style={{padding:'10px 13px',margin:0,color:'#aa352b',fontSize:11,background:'#fff6f3'}}>{failure} {busy?t('Retrying…','Nouvelle tentative…','جارٍ إعادة المحاولة…'):''}</p>}
  </section>;
}
