'use client'
import {Puck,type Data} from '@puckeditor/core'
import '@puckeditor/core/puck.css'
import {useSearchParams} from 'next/navigation'
import {useMemo,useState} from 'react'
import {Save,ExternalLink,ShieldCheck,ImagePlus,RefreshCcw} from 'lucide-react'
import type {SanilaWorldState} from '../sanila-admin/types'
import {SANILA_DEFAULT_THEME_KEY,SANILA_LOCKED_ROUTES} from '../sanila-world/world-engine'
import {NativeExperienceMediaPicker} from '../live-experience-command/components/NativeExperienceMediaPicker'
import {SANILA_PUCK_CONFIG} from './puck'
import {sanilaInitialPuckData} from './initial-data'
import styles from './sanila-studio.module.css'
export function SanilaWorldStudio({initialState}:{initialState:SanilaWorldState}){
 const params=useSearchParams()
 const requested=params.get('route')||'accueil'
 const [world,setWorld]=useState(initialState)
 const [slug,setSlug]=useState(world.pages[requested]?requested:'accueil')
 const [draft,setDraft]=useState<Data>(()=>world.pages[world.pages[requested]?requested:'accueil']?.data||sanilaInitialPuckData(world.pages[requested]?requested:'accueil'))
 const [message,setMessage]=useState('Prêt'),[busy,setBusy]=useState(false)
 const route=world.pages[slug]
 const themes=world.themes||{}
 const available=useMemo(()=>Object.values(world.pages).filter(p=>!p.deletedAt),[world])
 const safe=(value:string)=>world.pages[value]?.data||sanilaInitialPuckData(value)
 const switchPage=(value:string)=>{setSlug(value);setDraft(safe(value));setMessage('Brouillon prêt')}
 async function save(next:Data=draft,options:Record<string,unknown>={}){
  if(SANILA_LOCKED_ROUTES.has(slug)){setMessage('Cette page métier est protégée ; dupliquez-la pour créer une nouvelle page.');return}
  setBusy(true);setMessage('Enregistrement…')
  try{
    const r=await fetch('/api/angelcare-marketplace/admin/sanila/world',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'edit_page',expectedRevision:world.revision,payload:{slug,data:next,...options}})})
    const b=await r.json()
    if(!r.ok||!b.ok)throw new Error(b.error||'Échec enregistrement')
    setWorld(b.state);setDraft(next);setMessage('Enregistré · révision '+b.state.revision)
  }catch(e){setMessage(e instanceof Error?e.message:'Échec enregistrement')}finally{setBusy(false)}
 }
 async function refresh(){
  const r=await fetch('/api/angelcare-marketplace/admin/sanila/world',{cache:'no-store'})
  const b=await r.json()
  if(b.ok){setWorld(b.state);setDraft(b.state.pages[slug]?.data||sanilaInitialPuckData(slug));setMessage('Source rechargée')}
 }
 const protectedPage=SANILA_LOCKED_ROUTES.has(slug)
 return <div className={styles.studioPage}>
   <div className={styles.toolbar}>
    <div><strong>WORLD STUDIO 360</strong><p>Composer en brouillon · visualiser puis publier depuis Publication</p></div>
    <div className={styles.actions}>
      <select value={slug} aria-label="Page à éditer" onChange={e=>switchPage(e.target.value)}>{available.map(p=><option key={p.slug} value={p.slug}>{p.nav} · {p.slug}</option>)}</select>
      <a href={'/angelcare-marketplace/admin/sanila/preview?route='+encodeURIComponent(slug)} target="_blank" rel="noreferrer"><ExternalLink size={15}/> Prévisualiser</a>
      <a href={'/angelcare-marketplace/fr/sanila'+(slug==='accueil'?'':'/'+slug)} target="_blank" rel="noreferrer"><ExternalLink size={15}/> Public</a>
      <button type="button" disabled={busy} onClick={()=>void refresh()}><RefreshCcw size={15}/></button>
      <button type="button" disabled={busy||protectedPage} onClick={()=>void save()}><Save size={15}/> Enregistrer</button>
    </div>
   </div>
   {protectedPage?<p className={styles.notice}><ShieldCheck size={17}/> Cette page contient un parcours métier protégé. Le formulaire et l’authentification restent sous leur code natif et ne sont pas remplacés par une publication Puck.</p>:null}
   <div className={styles.toolbar}>
    <label>Thème de la page <select aria-label="Thème page" value={route?.themeKey||''} onChange={e=>void save(draft,{themeKey:e.target.value||null})} disabled={busy}><option value="">Thème global ({themes[world.themeKey||SANILA_DEFAULT_THEME_KEY]?.name})</option>{Object.values(themes).filter(t=>!t.archivedAt).map(t=><option key={t.key} value={t.key}>{t.name}</option>)}</select></label>
    <div className={styles.actions}><NativeExperienceMediaPicker locale="fr" disabled={busy} onSelect={asset=>{setDraft(prev=>({...prev,content:[...prev.content,{type:'SanilaImage',props:{id:'sanila-native-'+crypto.randomUUID(),src:asset.url,alt:asset.title||'Photo SANILA',title:asset.title||''}}]}));setMessage('Image native ajoutée en brouillon. Enregistrez pour persister.')}}/><span className={styles.notice}><ImagePlus size={16}/> Native Media Vault</span></div>
   </div>
   <p role="status" className={styles.status}>{message}</p>
   {protectedPage?<div className={styles.notice}>Le contenu de cette page est protégé par les workflows SANILA. Utilisez « Dupliquer » dans Pages pour créer une page éditable.</div>:
    <div className={styles.studio}><Puck key={slug+'-'+(route?.updatedAt||'source')} config={SANILA_PUCK_CONFIG} data={draft} onChange={setDraft} onPublish={next=>void save(next)} dnd={{behavior:'auto'}} iframe={{enabled:false}}/></div>}
 </div>
}
