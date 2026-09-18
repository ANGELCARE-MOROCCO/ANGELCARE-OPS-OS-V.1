'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { FilePlus2, Import, LayoutTemplate, Search, Sparkles } from 'lucide-react'
import type { CmsPage } from '@/angelcare-marketplace/experience-builder/types'
import styles from './studio-workspace.module.css'

type ApiEnvelope<T> = { data?: T; error?: { message?: string }; requestId?: string }

function statusLabel(status:string){return ({draft:'Brouillon',submitted:'Soumise',in_review:'En revue',approved:'Approuvée',scheduled:'Planifiée',published:'Publiée',retired:'Retirée',archived:'Archivée'} as Record<string,string>)[status]||status}

export function StudioIndex({pages}:{pages:CmsPage[]}){
  const [search,setSearch]=useState(''),[creating,setCreating]=useState(false),[message,setMessage]=useState(''),[title,setTitle]=useState(''),[slug,setSlug]=useState(''),[locale,setLocale]=useState<'fr'|'en'|'ar'>('fr')
  const filtered=useMemo(()=>{const q=search.trim().toLowerCase();return q?pages.filter(page=>[page.title,page.slug,page.route_key,page.locale].some(value=>String(value||'').toLowerCase().includes(q))):pages},[pages,search])
  async function create(){if(!title.trim()){setMessage('Donnez un nom à la nouvelle expérience.');return}setCreating(true);setMessage('Création de l’expérience…');try{const response=await fetch('/api/angelcare-marketplace/cms/studio/pages',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title:title.trim(),slug:slug.trim()||undefined,locale})});const body=await response.json() as ApiEnvelope<CmsPage>;if(!response.ok||body.error||!body.data)throw new Error(body.error?.message||'Création impossible.');window.location.assign(`/angelcare-marketplace/admin/experience/studio/${body.data.id}`)}catch(error){setMessage(error instanceof Error?error.message:'Création impossible.');setCreating(false)}}
  return <main className={styles.indexRoot}>
    <section className={styles.indexHero}>
      <div><span className={styles.kicker}>EXPERIENCE STUDIO · ANGELCARE MARKETPLACE</span><h1>Studio</h1><p>Créez, composez, importez, prévisualisez et publiez les expériences Marketplace depuis une seule autorité visuelle.</p></div>
      <div className={styles.indexHeroBadge}><Sparkles size={18}/><div><strong>Puck · Experience Core</strong><span>Une composition, un runtime, une source de vérité.</span></div></div>
    </section>
    <section className={styles.indexGrid}>
      <div className={styles.createCard}>
        <div className={styles.cardTitle}><FilePlus2 size={20}/><div><strong>Nouvelle expérience</strong><span>Le Studio génère l’identité technique. Vous choisissez le contenu.</span></div></div>
        <label>Nom<input value={title} onChange={e=>{setTitle(e.target.value);if(!slug) setSlug(e.target.value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''))}} placeholder="Campagne rentrée 2026"/></label>
        <div className={styles.formRow}><label>Langue<select value={locale} onChange={e=>setLocale(e.target.value as 'fr'|'en'|'ar')}><option value="fr">Français</option><option value="en">English</option><option value="ar">العربية</option></select></label><label>URL publique<input value={slug} onChange={e=>setSlug(e.target.value)} placeholder="rentree-2026"/></label></div>
        <button className={styles.primaryButton} onClick={create} disabled={creating}>{creating?'Création…':'Créer et ouvrir dans Studio'}</button>{message?<p className={styles.inlineMessage}>{message}</p>:null}
      </div>
      <div className={styles.quickCard}><div className={styles.cardTitle}><LayoutTemplate size={20}/><div><strong>Composer autrement</strong><span>Les autorités existantes restent reliées au Studio.</span></div></div><Link href="/angelcare-marketplace/admin/experience/templates">Templates versionnés</Link><Link href="/angelcare-marketplace/admin/experience/homepage">Theme Studio / Homepage</Link><Link href="/angelcare-marketplace/admin/configuration/web-presence">Présence Web</Link><Link href="/angelcare-marketplace/admin/media">Media Vault</Link><div className={styles.quickHint}><Import size={16}/>L’import universel est disponible à l’intérieur de chaque page.</div></div>
    </section>
    <section className={styles.pageIndex}>
      <div className={styles.pageIndexHead}><div><span className={styles.kicker}>PAGES</span><h2>{pages.length} expérience{pages.length>1?'s':''}</h2></div><label className={styles.searchBox}><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher une page, route ou langue…"/></label></div>
      <div className={styles.pageTable}>{filtered.map(page=><Link className={styles.pageRow} href={`/angelcare-marketplace/admin/experience/studio/${page.id}`} key={page.id}><div><strong>{page.title}</strong><span>/{page.locale}/{page.slug}</span></div><span className={styles.pageRoute}>{page.route_key}</span><span className={styles.statusPill} data-status={page.status}>{statusLabel(page.status)}</span><span>v{page.current_version||1}</span></Link>)}{!filtered.length?<div className={styles.emptyState}>Aucune expérience correspondante.</div>:null}</div>
    </section>
  </main>
}
