'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './B2BConfigurationCenter.module.css'

type ConfigItem = { id?: string; config_group: string; config_key: string; label: string; value?: any; description?: string; sort_order?: number; is_active?: boolean }
const groups = ['task_status','outreach_channel','template_category','automation_default','intern_target']
const defaults: ConfigItem = { config_group:'task_status', config_key:'', label:'', value:{}, description:'', sort_order:100, is_active:true }

async function readJson<T>(url:string): Promise<T> { const r=await fetch(url,{cache:'no-store'}); const p=await r.json().catch(()=>null); if(!r.ok || !p?.ok) throw new Error(p?.error || `Request failed: ${url}`); return p.data as T }

export default function B2BConfigurationCenter(){
  const [items,setItems]=useState<ConfigItem[]>([])
  const [group,setGroup]=useState('task_status')
  const [modal,setModal]=useState<ConfigItem | null>(null)
  const [error,setError]=useState<string | null>(null)
  const [busy,setBusy]=useState(false)

  async function load(){try{setError(null); setItems(await readJson<ConfigItem[]>('/api/b2b-partnerships/config'))}catch(e){setError(e instanceof Error?e.message:'Unable to load config')}}
  useEffect(()=>{load()},[])
  const current = useMemo(()=>items.filter(x=>x.config_group===group),[items,group])

  async function save(){if(!modal)return;setBusy(true);try{let parsed:any={};try{parsed=typeof modal.value==='string'?JSON.parse(modal.value):modal.value||{}}catch{throw new Error('Value JSON is invalid')};const r=await fetch('/api/b2b-partnerships/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...modal,value:parsed})});const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||'Unable to save config');setModal(null);await load()}catch(e){setError(e instanceof Error?e.message:'Unable to save config')}finally{setBusy(false)}}

  return <div className={styles.workspace}>
    <section className={styles.hero}><span>Configuration center</span><h1>B2B adjustable controls</h1><p>Rendez statuts, canaux, catégories de templates, objectifs intern et règles de relance configurables sans toucher au code.</p><button onClick={()=>setModal({...defaults,config_group:group})}>Ajouter configuration</button></section>
    {error && <div className={styles.alert}>{error}</div>}
    <section className={styles.layout}>
      <aside className={styles.groups}>{groups.map(g=><button key={g} className={group===g?styles.active:''} onClick={()=>setGroup(g)}><strong>{g.replaceAll('_',' ')}</strong><span>{items.filter(x=>x.config_group===g).length} éléments</span></button>)}</aside>
      <main className={styles.tableCard}><div className={styles.cardHeader}><div><span>Groupe sélectionné</span><h2>{group.replaceAll('_',' ')}</h2></div><button onClick={()=>setModal({...defaults,config_group:group})}>Nouveau</button></div><div className={styles.configGrid}>{current.map(item=><article key={`${item.config_group}-${item.config_key}`}><span>{item.config_key}</span><h3>{item.label}</h3><p>{item.description || '—'}</p><code>{JSON.stringify(item.value || {})}</code><button onClick={()=>setModal({...item,value:JSON.stringify(item.value||{},null,2)})}>Modifier</button></article>)}</div></main>
    </section>
    {modal && <div className={styles.backdrop}><section className={styles.modal}><header><div><span>Configuration B2B</span><h2>{modal.id?'Modifier':'Créer'} une règle configurable</h2></div><button onClick={()=>setModal(null)}>×</button></header><div className={styles.form}><label>Groupe<select value={modal.config_group} onChange={e=>setModal({...modal,config_group:e.target.value})}>{groups.map(g=><option key={g}>{g}</option>)}</select></label><label>Key<input value={modal.config_key} onChange={e=>setModal({...modal,config_key:e.target.value})}/></label><label>Label<input value={modal.label} onChange={e=>setModal({...modal,label:e.target.value})}/></label><label>Sort order<input type="number" value={modal.sort_order||100} onChange={e=>setModal({...modal,sort_order:Number(e.target.value)})}/></label><label className={styles.full}>Description<textarea value={modal.description||''} onChange={e=>setModal({...modal,description:e.target.value})}/></label><label className={styles.full}>Value JSON<textarea value={typeof modal.value==='string'?modal.value:JSON.stringify(modal.value||{},null,2)} onChange={e=>setModal({...modal,value:e.target.value})}/></label></div><footer><button onClick={()=>setModal(null)}>Annuler</button><button disabled={busy} onClick={save}>{busy?'Sauvegarde...':'Sauvegarder'}</button></footer></section></div>}
  </div>
}
