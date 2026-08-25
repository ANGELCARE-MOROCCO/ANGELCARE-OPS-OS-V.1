'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AlertTriangle, Box, ImageOff, Plus, Search } from 'lucide-react'
import styles from '../commerce-studio.module.css'
import type { CatalogAdminItem } from '../types'

type CatalogFilter = 'all' | 'incomplete' | 'published'

function incomplete(item: CatalogAdminItem) {
  return !item.media?.length || (item.price_mode !== 'quote_only' && item.price_amount === null) || !item.short_description_fr
}

export function CatalogRegistryStudio({ items }: { items: CatalogAdminItem[] }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<CatalogFilter>('all')
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items.filter((item) => {
      const haystack = `${item.name_fr} ${item.public_reference} ${item.kind} ${item.short_description_fr || ''}`.toLowerCase()
      if (needle && !haystack.includes(needle)) return false
      if (filter === 'incomplete' && !incomplete(item)) return false
      if (filter === 'published' && item.status !== 'published') return false
      return true
    })
  }, [filter, items, query])

  return <main className={styles.shell}>
    <section className={styles.workspaceHero} data-accent="catalog"><div><span>CATALOG REGISTRY</span><h1>Tous les objets commerciaux, une seule autorité.</h1><p>Produits, services, kits, programmes, Academy, B2B, SaaS et Quality Check 360.</p></div><Link className={styles.heroPrimaryAction} href="/angelcare-marketplace/admin/catalog/items/new"><Plus size={17}/> Créer un objet</Link></section>
    <section className={styles.registryToolbar}>
      <label><Search size={17}/><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Nom, référence, type, description…"/></label>
      <div role="group" aria-label="Filtrer le catalogue">
        <button type="button" data-selected={filter==='all'} onClick={()=>setFilter('all')}>Tous</button>
        <button type="button" data-selected={filter==='incomplete'} onClick={()=>setFilter('incomplete')}>À compléter</button>
        <button type="button" data-selected={filter==='published'} onClick={()=>setFilter('published')}>Publiés</button>
      </div>
    </section>
    <section className={styles.catalogRegistry}>{filtered.map((item)=><Link href={`/angelcare-marketplace/admin/catalog/items/${item.id}`} key={item.id}><div className={styles.registryMedia}>{item.media?.[0]?.asset_url?<img src={String(item.media[0].asset_url)} alt=""/>:<ImageOff size={29}/>}</div><div><span>{item.kind} · {item.public_reference}</span><h2>{item.name_fr}</h2><p>{item.short_description_fr||'Description commerciale à compléter.'}</p><div className={styles.registryBadges}><b data-risk={!item.media?.length}>{item.media?.length?'MEDIA':'NO MEDIA'}</b><b data-risk={item.price_mode!=='quote_only'&&item.price_amount===null}>{item.price_mode==='quote_only'?'QUOTE':item.price_amount!==null?`${item.price_amount} ${item.currency_label}`:'NO PRICE'}</b><b>{item.status}</b></div></div><div className={styles.registryEnd}><Box size={20}/><strong>{item.variants?.length||0}</strong><span>variants</span></div></Link>)}</section>
    {!filtered.length?<div className={styles.empty}><AlertTriangle size={24}/><p>{items.length?'Aucun objet ne correspond aux filtres.':'Aucun objet. Créez le premier produit ou service depuis Product Studio.'}</p></div>:null}
  </main>
}
