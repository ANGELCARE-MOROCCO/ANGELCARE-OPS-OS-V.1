'use client';
import { useEffect,useMemo,useRef,useState } from 'react';
import type { PlayerProps } from './shared';
const uuid=(v:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
type KfBridge={contract:string;channel:string;action:string;data?:any};
const SMALL={padding:'8px 12px',border:'1px solid #d8e4ee',borderRadius:9,background:'#fff',color:'#275274',fontSize:11,fontWeight:750,cursor:'pointer'} as const;
export function UniversalInteractivePlayer({p,packageId,checksum,entry='index.html'}:{p:PlayerProps;packageId:string;checksum:string;entry?:string}){
  const frame=useRef<HTMLIFrameElement>(null),shell=useRef<HTMLDivElement>(null);
  const [failure,setFailure]=useState(''),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[channel,setChannel]=useState(''),[reload,setReload]=useState(0);
  const [viewport,setViewport]=useState<'full'|'tablet'|'mobile'>('full'),[percent,setPercent]=useState<number|null>(null);
  useEffect(()=>{setChannel(crypto.randomUUID());setReady(false);setFailure('');setPercent(null)},[packageId,p.m.releaseId,reload]);
  const configuredOrigin=process.env.NEXT_PUBLIC_KIDFLIX_INTERACTIVE_RUNTIME_ORIGIN||'';
  const officialLogo=process.env.NEXT_PUBLIC_KIDFLIX_OFFICIAL_LOGO_PATH||'';
  const origin=useMemo(()=>{try{const u=new URL(configuredOrigin);return u.protocol==='https:'&&u.origin!==(typeof window==='undefined'?'':window.location.origin)&&u.pathname==='/'?u.origin:''}catch{return ''}},[configuredOrigin]);
  const valid=!!channel&&uuid(packageId)&&uuid(String(p.m.releaseId))&&/^[a-f0-9]{64}$/i.test(checksum)&&!!origin&&/^[A-Za-z0-9/_.-]+\.html$/.test(entry)&&!entry.split('/').includes('..')&&/^\/[A-Za-z0-9/_.-]+\.png$/.test(officialLogo);
  const src=valid?`${origin}/api/kidflix/interactive/runtime/release/${encodeURIComponent(String(p.m.releaseId))}/${packageId}/${entry.split('/').map(encodeURIComponent).join('/')}#kfchannel=${channel}`:'';
  useEffect(()=>{
    if(!valid)return;
    const receive=(e:MessageEvent<KfBridge>)=>{
      if(e.source!==frame.current?.contentWindow||e.origin!==origin||e.data?.contract!=='kidflix.interactive.bridge.1'||e.data?.channel!==channel)return;
      const d=e.data.data||{};
      switch(e.data.action){
        case 'ready':setReady(true);setBusy(false);frame.current?.contentWindow?.postMessage({contract:'kidflix.interactive.bridge.1',channel,action:'restore',data:{state:p.state.interactiveState||{}}},origin);break;
        case 'progress':{const v=Number(d.percent);if(Number.isFinite(v)&&v>=0&&v<=100){setPercent(v);p.update({started:true,interactivePercent:v})}break}
        case 'save':{const v=d.state;if(v&&typeof v==='object'&&!Array.isArray(v)&&JSON.stringify(v).length<=12000)p.update({started:true,interactiveState:v});break}
        case 'answer':p.update({started:true});break;
        case 'complete':p.update({started:true,interactiveReportedComplete:true});break;
        case 'error':setFailure('The experience reported an error. Reload or contact the publisher.');setBusy(false);break;
      }
    };
    window.addEventListener('message',receive);
    return()=>window.removeEventListener('message',receive);
  },[origin,channel,valid,p.update,p.state.interactiveState]);
  useEffect(()=>{if(!valid||ready)return;const t=setTimeout(()=>{if(!ready)setFailure('The experience is not responding yet. You can reload it.')},16000);return()=>clearTimeout(t)},[valid,ready,src]);
  if(!valid)return <div role="alert" style={{padding:22,background:'#fff5f1',borderRadius:12}}>KidFlix interactive player requires its separate HTTPS runtime and official logo. The published content remains unchanged.</div>;
  return <section ref={shell} aria-label="KidFlix interactive experience" style={{position:'relative',borderRadius:17,overflow:'hidden',border:'1px solid #dce5ef',background:'#fff',boxShadow:'0 4px 23px #1b364414'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap',padding:'10px 13px',borderBottom:'1px solid #e1eaf1',background:'#f9fbfe'}}>
      <div style={{display:'flex',gap:8,alignItems:'center'}}><span style={{display:'inline-block',width:7,height:7,borderRadius:8,background:ready?'#0fa77b':'#ddaa3f'}}/><strong style={{fontSize:12,color:'#17334e'}}>KidFlix Interactive</strong><span style={{fontSize:10,color:'#76879a'}}>{ready?'Ready':'Loading'}{percent!==null?` · ${Math.round(percent)}%`:''}</span></div>
      <div style={{display:'flex',gap:5,alignItems:'center',flexWrap:'wrap'}}>
        {(['full','tablet','mobile'] as const).map(x=><button key={x} type="button" aria-pressed={viewport===x} onClick={()=>setViewport(x)} style={{...SMALL,background:viewport===x?'#e8f3ff':'#fff'}}>{x==='full'?'Desktop':x==='tablet'?'Tablet':'Mobile'}</button>)}
        <button type="button" style={SMALL} onClick={()=>{setReady(false);setFailure('');setBusy(true);setReload(x=>x+1)}}>Reload</button>
        <button type="button" style={SMALL} onClick={()=>{void shell.current?.requestFullscreen?.().catch(()=>setFailure('Fullscreen is unavailable on this device.'))}}>Fullscreen</button>
      </div>
    </div>
    <div style={{display:'flex',justifyContent:'center',background:viewport==='full'?'#fff':'#eaf0f5',padding:viewport==='full'?0:12}}>
      <iframe key={src} ref={frame} title={String(p.m.title||'KidFlix interactive experience')} src={src} sandbox="allow-scripts allow-same-origin" referrerPolicy="no-referrer" allow="fullscreen" style={{width:'100%',maxWidth:viewport==='full'?'100%':viewport==='tablet'?820:390,height:'min(76vh,800px)',minHeight:460,border:0,display:'block',background:'#fff'}}/>
    </div>
    {!ready&&!failure&&<p role="status" style={{padding:'8px 13px',margin:0,fontSize:11,color:'#647789'}}>Opening your interactive experience…</p>}
    <div aria-label="Official KidFlix identity" style={{position:'absolute',insetBlockEnd:9,insetInlineEnd:9,padding:'4px 7px',background:'rgba(255,255,255,.96)',border:'1px solid #d9e2ec',borderRadius:8,boxShadow:'0 1px 8px #293b4c18',display:'flex',alignItems:'center',gap:6,fontSize:9,pointerEvents:'none',zIndex:4}}><img src={officialLogo} alt="KidFlix" width={56} height={24} style={{objectFit:'contain'}}/><span>Official KidFlix experience</span></div>
    {failure&&<p role="alert" style={{padding:'10px 13px',margin:0,color:'#aa352b',fontSize:11,background:'#fff6f3'}}>{failure} {busy?'Retrying…':''}</p>}
  </section>;
}
