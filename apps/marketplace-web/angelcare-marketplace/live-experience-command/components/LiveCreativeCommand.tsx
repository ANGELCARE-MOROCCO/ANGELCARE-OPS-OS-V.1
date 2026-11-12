'use client'
import {useState} from 'react'
import Link from 'next/link'
import {CheckCircle2,ChevronLeft,Copy,LayoutTemplate,Palette,Pause,Play,Plus,RefreshCw,Save,Search,ShieldCheck,Trash2,Undo2} from 'lucide-react'
import {useGovernedAction} from '../../shells/GovernedActionProvider'
import type {CreativeRecord} from '../creative-360'
import styles from '../live-creative-360.module.css'
type Family='popup'|'broadcast'|'proof'
type Category='theme'|'preset'
type Dictionary={fr:string;en:string;ar:string}
type Definition={key:string;kind:Family;name:Dictionary}
type State={type:Category;kind:Family;key:string;name:Dictionary;purpose:string;theme:string;composition:string;background:string;surface:string;accent:string;text:string;placement:string;trigger:string}
type Collections={themes:CreativeRecord[];presets:CreativeRecord[]}
const themeLayouts=['split','poster','gallery','editorial','orbit','atrium','terrace','botanical','lilac','precision','bento','museum','glass','ledger','cinema']
const blank=(type:Category):State=>({type,kind:'popup',key:'',name:{fr:'',en:'',ar:''},purpose:'',theme:'',composition:'atrium',background:'#FFF9FC',surface:'#F6E9F1',accent:'#A23982',text:'#382441',placement:'modal',trigger:'delay'})
const t=(v:unknown):string=>typeof v==='string'?v:''
const obj=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{}
const apiRoot='/api/angelcare-marketplace/admin/live-experience/creatives'
const choices:Category[]=['theme','preset']
function draftOf(type:Category,row:CreativeRecord):State{
 const tokens=obj(row.tokens),config=obj(row.configuration)
 return {type,kind:row.kind,key:t(type==='theme'?row.theme_key:row.preset_key),name:{fr:t(obj(row.name).fr),en:t(obj(row.name).en),ar:t(obj(row.name).ar)},purpose:t(row.purpose_key),theme:t(row.theme_key),composition:t(tokens.composition)||'atrium',background:t(tokens.background)||'#FFF9FC',surface:t(tokens.surface)||'#F6E9F1',accent:t(tokens.accent)||'#A23982',text:t(tokens.text)||'#382441',placement:t(config.placement)||'modal',trigger:t(config.trigger)||'delay'}
}
export function LiveCreativeCommand({initial,themes,purposes,canManage,canPublish}:{initial:Collections;themes:Definition[];purposes:Definition[];canManage:boolean;canPublish:boolean}){
 const requestAction=useGovernedAction()
 const [collection,setCollection]=useState(initial)
 const [type,setType]=useState<Category>('theme')
 const [form,setForm]=useState<State>(blank('theme'))
 const [selected,setSelected]=useState<CreativeRecord|null>(null)
 const [busy,setBusy]=useState(false)
 const [notice,setNotice]=useState('')
 const [query,setQuery]=useState('')
 const [trash,setTrash]=useState(false)
 const [copyKey,setCopyKey]=useState('')
 const active=type==='theme'?collection.themes:collection.presets
 const entries=active.filter(row=>Boolean(row.deleted_at)===trash&&[t(row.theme_key),t(row.preset_key),t(obj(row.name).fr),t(obj(row.name).en)].join(' ').toLowerCase().includes(query.toLowerCase()))
 const presetsThemes=[...themes,...collection.themes.filter(row=>!row.deleted_at&&row.status==='active').map(row=>({key:t(row.theme_key),kind:row.kind,name:row.name as Dictionary}))]
 function choose(row:CreativeRecord){setSelected(row);setForm(draftOf(type,row));setNotice('');setCopyKey('')}
 function nextType(next:Category){setType(next);setForm(blank(next));setSelected(null);setNotice('')}
 function edit(patch:Partial<State>){setForm(old=>({...old,...patch}))}
 function editName(locale:keyof Dictionary,value:string){setForm(old=>({...old,name:{...old.name,[locale]:value}}))}
 function newDraft(){setSelected(null);setForm(blank(type));setNotice('Nouvelle création. Enregistrez le brouillon avant activation.')}
 async function reload(){const res=await fetch(apiRoot,{cache:'no-store'});const body=await res.json();if(!res.ok)throw Error(body?.error?.message||'Impossible de charger les créations');setCollection(body.data as Collections);return body.data as Collections}
 async function command(action:'create'|'update'|'duplicate'|'activate'|'pause'|'archive'|'trash'|'restore'){
  if(!canManage||busy)return
  if(action==='activate'&&!canPublish){setNotice('Publication non autorisée pour cet utilisateur.');return}
  if(action!=='create'&&action!=='update'&&!selected)return
  let reason=''
  if(!['create','update'].includes(action)){
   const value=await requestAction({title:'Création · '+action,objectLabel:selected?.name? t(obj(selected.name).fr):form.key,currentState:selected?.status||'draft',nextState:action,consequence:action==='trash'?'Retire cette création du catalogue opérateur, sous réserve des dépendances actives.':action==='restore'?'Retour en brouillon, sans mise en ligne automatique.':'Modifie le cycle de vie ou crée une copie du design.',reversibility:'L’historique est conservé et les modifications nécessitent une publication explicite.',permission:action==='activate'?'marketplace.live_experience.publish':'marketplace.live_experience.manage',danger:action==='trash'})
   if(!value)return;reason=value
  }
  let payload:Record<string,unknown>={type,action,reason,version:selected?.row_version||null,id:selected?.id||undefined}
  if(action==='create'||action==='update'){
   Object.assign(payload,{kind:form.kind,name:form.name})
   if(type==='theme')Object.assign(payload,{theme_key:form.key,tokens:{background:form.background,surface:form.surface,accent:form.accent,text:form.text,composition:form.composition}})
   else Object.assign(payload,{preset_key:form.key,purpose_key:form.purpose,theme_key:form.theme,configuration:{placement:form.placement,trigger:form.trigger}})
  }
  if(action==='duplicate')payload.new_key=copyKey.trim()||form.key+'-copy-'+Date.now()
  setBusy(true);setNotice('')
  try{
   const response=await fetch(apiRoot,{method:action==='create'?'POST':action==='trash'?'DELETE':'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(payload)})
   const body=await response.json()
   if(!response.ok)throw Error(body?.error?.message||'Commande indisponible')
   const latest=await reload(),result=body.data.record as CreativeRecord
   const rows=type==='theme'?latest.themes:latest.presets
   const row=rows.find(x=>x.id===result.id)||result
   setSelected(row);setForm(draftOf(type,row))
   setNotice('Opération persistée, auditée et relue : '+action+' · version '+row.row_version)
   setCopyKey('')
  }catch(error){setNotice(error instanceof Error?error.message:'Impossible de terminer l’opération')}finally{setBusy(false)}
 }
 return <main className={styles.root}>
  <div className={styles.head}><Link href="/angelcare-marketplace/admin/live-experience-command"><ChevronLeft size={16}/>Live Experience</Link><div className={styles.headCopy}><span>ANGELCARE · CREATIVE GOVERNANCE</span><h1>Design & Composition Studio 360</h1><p>Thèmes, compositions et variantes personnels. Gouvernance complète, sources protégées et révisions traçables.</p></div><div className={styles.headActions}><span><ShieldCheck size={16}/> Créations gouvernées</span><button type="button" onClick={()=>{void reload().then(()=>setNotice('Registre actualisé.')).catch(error=>setNotice(String(error)))}}><RefreshCw size={16}/> Actualiser</button></div></div>
  <div className={styles.metrics}><div><strong>{collection.themes.length}</strong><span>Thèmes personnalisés</span></div><div><strong>{collection.presets.length}</strong><span>Compositions personnelles</span></div><div><strong>{collection.themes.filter(x=>x.status==='active'&&!x.deleted_at).length+collection.presets.filter(x=>x.status==='active'&&!x.deleted_at).length}</strong><span>Actifs</span></div><div><strong>{collection.themes.filter(x=>x.deleted_at).length+collection.presets.filter(x=>x.deleted_at).length}</strong><span>Corbeille</span></div></div>
  <div className={styles.workspace}>
   <aside className={styles.library}><div className={styles.tabs}>{choices.map(k=><button type="button" key={k} aria-pressed={type===k} data-active={type===k} onClick={()=>nextType(k)}>{k==='theme'?<Palette size={17}/>:<LayoutTemplate size={17}/>} {k==='theme'?'Thèmes':'Compositions'}</button>)}</div><div className={styles.search}><Search size={15}/><input aria-label="Rechercher une création" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nom, référence…"/></div><div className={styles.registryActions}><button type="button" onClick={newDraft}><Plus size={15}/> Créer</button><button type="button" aria-pressed={trash} data-active={trash} onClick={()=>{setTrash(x=>!x);setSelected(null)}}>{trash?'Registre':'Corbeille'}</button></div><div className={styles.records}>{entries.map(row=><button key={row.id} type="button" data-active={selected?.id===row.id} onClick={()=>choose(row)}><span>{t(obj(row.name).fr)||t(row.theme_key)||t(row.preset_key)}</span><small>{t(row.theme_key||row.preset_key)} · {row.status} · v{row.row_version}{row.deleted_at?' · supprimé':''}</small></button>)}{!entries.length?<p className={styles.empty}>Aucune création pour ce filtre.</p>:null}</div></aside>
   <section className={styles.editor}><div className={styles.editorHead}><div><span>{selected?'RÉVISION · '+selected.row_version:'NOUVEAU BROUILLON'}</span><h2>{selected?'Modifier la création':'Créer '+(type==='theme'?'un thème':'une composition')}</h2></div><div className={styles.state}>{selected?.deleted_at?'Corbeille':selected?.status||'Brouillon'}</div></div>
   <fieldset disabled={!canManage||busy||Boolean(selected?.deleted_at)}>
    <div className={styles.fieldGrid}><label>Référence unique<input value={form.key} onChange={e=>edit({key:e.target.value})} disabled={Boolean(selected)} placeholder="my-editorial-experience"/></label><label>Famille<select value={form.kind} disabled={Boolean(selected)} onChange={e=>edit({kind:e.target.value as Family})}>{(['popup','broadcast','proof'] as Family[]).map(k=><option key={k}>{k}</option>)}</select></label></div>
    <div className={styles.fieldGrid}>{(['fr','en','ar'] as const).map(l=><label key={l}>Nom {l.toUpperCase()}<input dir={l==='ar'?'rtl':'ltr'} value={form.name[l]} onChange={e=>editName(l,e.target.value)}/></label>)}</div>
    {type==='theme'?<><h3>Visual Identity</h3><div className={styles.fieldGrid}><label>Architecture<select value={form.composition} onChange={e=>edit({composition:e.target.value})}>{themeLayouts.map(k=><option key={k}>{k}</option>)}</select></label>{(['background','surface','accent','text'] as const).map(k=><label key={k}>{k}<span className={styles.colorInput}><input type="color" value={form[k]} onChange={e=>edit({[k]:e.target.value})}/><input value={form[k]} onChange={e=>edit({[k]:e.target.value})}/></span></label>)}</div><div className={styles.miniature} style={{background:form.background,color:form.text,borderColor:form.accent}}><span style={{color:form.accent}}>ANGELCARE · EDITORIAL PREVIEW</span><h3>{form.name.fr||'Votre expérience'}</h3><p>Une composition distinctive, connectée à des offres authentiques et des médias natifs.</p><span className={styles.fakeCta} style={{background:form.accent}}>Découvrir</span></div></>:<><h3>Composition & Routage</h3><div className={styles.fieldGrid}><label>Objectif<select value={form.purpose} onChange={e=>edit({purpose:e.target.value})}><option value="">Choisir un objectif</option>{purposes.filter(p=>p.kind===form.kind).map(p=><option key={p.key} value={p.key}>{p.name.fr}</option>)}</select></label><label>Thème<select value={form.theme} onChange={e=>edit({theme:e.target.value})}><option value="">Choisir un thème</option>{presetsThemes.filter(x=>x.kind===form.kind).map(x=><option key={x.key} value={x.key}>{x.name.fr}</option>)}</select></label><label>Placement<input value={form.placement} onChange={e=>edit({placement:e.target.value})}/></label><label>Déclencheur<input value={form.trigger} onChange={e=>edit({trigger:e.target.value})}/></label></div></>}
    <div className={styles.buttons}><button type="button" disabled={busy||!canManage} onClick={()=>void command(selected?'update':'create')}><Save size={16}/>{selected?'Enregistrer la révision':'Créer en brouillon'}</button></div>
   </fieldset>
   {selected?<div className={styles.lifecycle}><h3>Contrôles complets</h3><div className={styles.buttons}>{selected.deleted_at?<button type="button" onClick={()=>void command('restore')}><Undo2 size={16}/> Restaurer</button>:<><button type="button" disabled={!canPublish||busy||selected.status==='active'} onClick={()=>void command('activate')}><Play size={16}/> Activer</button><button type="button" disabled={busy||selected.status!=='active'} onClick={()=>void command('pause')}><Pause size={16}/> Suspendre</button><button type="button" disabled={busy} onClick={()=>void command('archive')}>Archiver</button><button type="button" disabled={busy} onClick={()=>void command('trash')}><Trash2 size={16}/> Supprimer</button></>}</div>{!selected.deleted_at?<div className={styles.copy}><label>Nouvelle référence pour duplication<input value={copyKey} onChange={e=>setCopyKey(e.target.value)} placeholder={form.key+'-copy'}/></label><button type="button" disabled={busy} onClick={()=>void command('duplicate')}><Copy size={16}/> Dupliquer en brouillon</button></div>:null}</div>:null}
   {notice?<p className={styles.notice} role="status"><CheckCircle2 size={16}/>{notice}</p>:null}
   </section>
  </div>
 </main>
}
