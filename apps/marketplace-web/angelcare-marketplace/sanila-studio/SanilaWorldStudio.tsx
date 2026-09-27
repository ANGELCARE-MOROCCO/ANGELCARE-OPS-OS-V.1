'use client'

import { Puck, type Data } from '@puckeditor/core'
import '@puckeditor/core/puck.css'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Save, ExternalLink, ShieldCheck } from 'lucide-react'
import { SANILA_WORLD_ROUTES } from '@/angelcare-marketplace/sanila-world/contract'
import type { SanilaWorldState } from '@/angelcare-marketplace/sanila-admin/types'
import { SANILA_PUCK_CONFIG } from './puck'
import { sanilaInitialPuckData } from './initial-data'
import styles from './sanila-studio.module.css'

export function SanilaWorldStudio({ initialState }: { initialState: SanilaWorldState }) {
  const searchParams = useSearchParams()
  const requested = searchParams.get('route') || 'accueil'
  const initialSlug = initialState.pages[requested] ? requested : 'accueil'
  const [slug, setSlug] = useState(initialSlug)
  const [state, setState] = useState(initialState)
  const [message, setMessage] = useState('Prêt')
  const data = useMemo(() => state.pages[slug]?.data || sanilaInitialPuckData(slug), [slug, state])
  const [draft, setDraft] = useState<Data>(data)

  async function save(next = draft) {
    setMessage('Enregistrement…')
    const response = await fetch('/api/angelcare-marketplace/admin/sanila/world', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'save_page', slug, data: next }) })
    const body = await response.json()
    if (!response.ok || !body.ok) { setMessage(body.error || 'Échec enregistrement'); return }
    setState(body.state)
    setDraft(next)
    setMessage('Enregistré')
  }

  function switchPage(nextSlug: string) {
    setSlug(nextSlug)
    setDraft(state.pages[nextSlug]?.data || sanilaInitialPuckData(nextSlug))
    setMessage('Prêt')
  }

  return <div>
    <div style={{display:'flex',gap:10,alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap'}}>
      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><select value={slug} onChange={(event)=>switchPage(event.target.value)}>{SANILA_WORLD_ROUTES.map((route)=><option key={route.slug} value={route.slug}>{route.nav} · {route.slug}</option>)}</select><span style={{fontSize:12,fontWeight:800,color:'#5e7487'}}>{message}</span></div>
      <div style={{display:'flex',gap:8}}><a href={SANILA_WORLD_ROUTES.find((route)=>route.slug===slug)?.href} target="_blank" rel="noreferrer"><ExternalLink size={14}/> Public</a><button type="button" onClick={()=>void save()}><Save size={14}/> Enregistrer</button><span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:11,fontWeight:850}}><ShieldCheck size={14}/> SANILA isolé</span></div>
    </div>
    <div className={styles.studio}><Puck key={`${slug}-${state.pages[slug]?.updatedAt || 'source'}`} config={SANILA_PUCK_CONFIG} data={draft} onChange={next=>setDraft(next)} onPublish={next=>save(next)} dnd={{behavior:'auto'}} iframe={{enabled:false}} /></div>
  </div>
}
