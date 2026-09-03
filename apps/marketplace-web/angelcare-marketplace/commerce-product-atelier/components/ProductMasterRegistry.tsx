'use client'

import { useMemo, useState } from 'react'
import { Filter, PackagePlus, Search, X } from 'lucide-react'
import type { CommerceProductAtelierSnapshot, ProductDrawerTab } from '../types'
import styles from '../commerce-product-atelier.module.css'
import { atelierApi, money, pct } from './AtelierUi'
import { ProductMegaDrawer } from './ProductMegaDrawer'
import { CreateOfferDrawer } from './CreateOfferDrawer'

type BulkAction = 'publish' | 'unpublish' | 'archive' | 'purge'
type Result = { itemKey: string; id: string; previousState: string; newState: string; result: 'success' | 'blocked' | 'failed'; error?: string }
type MediaRow = { itemKey: string; mediaReference: string; role: 'primary' | 'gallery' }
const labels: Record<string, string> = {
  CONTENT_MISSING: 'Contenu manquant', PRICING_MISSING: 'Pricing manquant',
  CATEGORY_MISSING: 'Catégorie manquante', MEDIA_MISSING: 'Média manquant',
  AVAILABILITY_MISSING: 'Disponibilité manquante', FULFILLMENT_MISSING: 'Fulfillment manquant',
  TRUST_MISSING: 'Trust manquant', SEO_MISSING: 'SEO manquant',
}

export function ProductMasterRegistry({ snapshot, openCreate = false }: { snapshot: CommerceProductAtelierSnapshot; openCreate?: boolean }) {
  const [query, setQuery] = useState(''), [health, setHealth] = useState('all')
  const [doctrine, setDoctrine] = useState('all'), [status, setStatus] = useState('all'), [readiness, setReadiness] = useState('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([]), [drawer, setDrawer] = useState<{ id: string; tab: ProductDrawerTab } | null>(null)
  const [create, setCreate] = useState(openCreate), [minimized, setMinimized] = useState<string[]>([]), [action, setAction] = useState<BulkAction | null>(null), [purgeConfirmation, setPurgeConfirmation] = useState('')
  const [categoryId, setCategoryId] = useState(''), [mediaId, setMediaId] = useState(''), [mediaRole, setMediaRole] = useState<'primary' | 'gallery'>('primary'), [mapping, setMapping] = useState('')
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [results, setResults] = useState<Result[]>([]), [mediaPreview, setMediaPreview] = useState<MediaRow[] | null>(null)
  const visible = useMemo(() => snapshot.products.filter(p => {
    const text = !query || `${p.name} ${p.reference} ${p.itemKey}`.toLowerCase().includes(query.toLowerCase())
    const gate = readiness === 'all' || (readiness === 'ready' ? p.readiness.ready : readiness === 'blocked' ? !p.readiness.ready : p.readiness.reasons.includes(readiness))
    return text && (health === 'all' || p.health === health) && (doctrine === 'all' || p.doctrine === doctrine) && (status === 'all' || p.status === status) && gate
  }), [snapshot.products, query, health, doctrine, status, readiness])
  const selected = useMemo(() => snapshot.products.filter(p => selectedIds.includes(p.id)), [snapshot.products, selectedIds])
  const allSelected = visible.length > 0 && visible.every(p => selectedIds.includes(p.id))
  const product = drawer ? snapshot.products.find(p => p.id === drawer.id) || null : null
  const toggle = (id: string) => setSelectedIds(value => value.includes(id) ? value.filter(x => x !== id) : [...value, id])
  const open = (id: string, tab: ProductDrawerTab = 'overview') => { setDrawer({ id, tab }); setMinimized(value => value.filter(x => x !== id)) }

  async function execute() {
    if (!action) return
    setBusy(true)
    const next: Result[] = []
    for (const item of selected) {
      if (action === 'purge' && item.status !== 'archived') {
        next.push({ itemKey: item.itemKey, id: item.id, previousState: item.status, newState: item.status, result: 'blocked', error: 'Le produit doit être archivé avant toute purge définitive.' })
        continue
      }
      if (action === 'publish' && !item.readiness.ready) {
        next.push({ itemKey: item.itemKey, id: item.id, previousState: item.status, newState: item.status, result: 'blocked', error: item.readiness.reasons.join(', ') })
        continue
      }
      try {
        await atelierApi(`/api/angelcare-marketplace/admin/commerce/catalog-items/${item.id}/${action}`, { method: 'POST', body: JSON.stringify(action === 'purge' ? { confirmation_reference: item.reference } : {}) })
        next.push({ itemKey: item.itemKey, id: item.id, previousState: item.status, newState: action === 'publish' ? 'published' : action === 'unpublish' ? 'paused' : action === 'archive' ? 'archived' : 'purged', result: 'success' })
      } catch (error) {
        next.push({ itemKey: item.itemKey, id: item.id, previousState: item.status, newState: item.status, result: 'failed', error: error instanceof Error ? error.message : 'Action impossible.' })
      }
    }
    setResults(next); setNotice(`${next.filter(x => x.result === 'success').length} succès · ${next.filter(x => x.result === 'blocked').length} bloqués · ${next.filter(x => x.result === 'failed').length} échecs`); setBusy(false); setAction(null); setPurgeConfirmation('')
  }

  async function assignCategory() {
    if (!categoryId) return
    setBusy(true); const next: Result[] = []
    for (const item of selected) {
      try {
        await atelierApi(`/api/angelcare-marketplace/admin/commerce/catalog-items/${item.id}/assign-category`, { method: 'POST', body: JSON.stringify({ category_ids: [categoryId] }) })
        next.push({ itemKey: item.itemKey, id: item.id, previousState: item.status, newState: item.status, result: 'success' })
      } catch (error) { next.push({ itemKey: item.itemKey, id: item.id, previousState: item.status, newState: item.status, result: 'failed', error: error instanceof Error ? error.message : 'Action impossible.' }) }
    }
    setResults(next); setNotice(`${next.filter(x => x.result === 'success').length} catégorie(s) synchronisée(s)`); setBusy(false)
  }

  async function assignMedia() {
    const rows: MediaRow[] = mapping.trim()
      ? mapping.split(/\r?\n/).map(line => line.trim()).filter(Boolean).filter((_, index) => index > 0).map(line => {
        const [itemKey, mediaReference, role = 'primary'] = line.split(',').map(x => x.trim())
        return { itemKey, mediaReference, role: role.toLowerCase() === 'gallery' ? 'gallery' as const : 'primary' as const }
      })
      : selected.map(item => ({ itemKey: item.itemKey, mediaReference: mediaId, role: mediaRole })).filter(row => row.mediaReference)
    if (!mediaPreview) { setMediaPreview(rows); setNotice(`${rows.length} média(s) proposés. Vérifiez les correspondances puis confirmez.`); return }
    setBusy(true); const next: Result[] = []
    for (const row of mediaPreview) {
      const item = snapshot.products.find(p => p.itemKey === row.itemKey)
      const asset = snapshot.media.find(m => m.id === row.mediaReference || m.asset_key === row.mediaReference || m.file_name === row.mediaReference)
      if (!item || !asset) { next.push({ itemKey: row.itemKey, id: item?.id || '', previousState: item?.status || 'unknown', newState: item?.status || 'unknown', result: 'failed', error: item ? 'Média introuvable.' : 'Produit introuvable.' }); continue }
      try {
        await atelierApi('/api/angelcare-marketplace/admin/commerce/catalog-media', { method: 'POST', body: JSON.stringify({ catalog_item_id: item.id, media_key: row.role === 'primary' ? 'primary' : `gallery-${asset.id}`, media_type: asset.media_type, asset_url: asset.desktop_url, alt_text_fr: asset.alt_text_fr, status: 'active', sort_order: row.role === 'primary' ? 0 : 100 }) })
        next.push({ itemKey: item.itemKey, id: item.id, previousState: item.status, newState: item.status, result: 'success' })
      } catch (error) { next.push({ itemKey: item.itemKey, id: item.id, previousState: item.status, newState: item.status, result: 'failed', error: error instanceof Error ? error.message : 'Action impossible.' }) }
    }
    setResults(next); setNotice(`${next.filter(x => x.result === 'success').length} média(s) assigné(s) · aucune publication automatique`); setMediaPreview(null); setBusy(false)
  }

  return <main className={styles.canvas}>
    <section className={styles.hero}><div className={styles.heroMain}><div className={styles.eyebrow}>PRODUCT MASTER REGISTRY</div><h2>One catalog estate. Every doctrine, price, territory and publication state visible before action.</h2><p>Registry-level triage opens directly into a persistent Product Mega Drawer.</p></div><aside className={styles.heroSide}><div className={styles.eyebrow}>REGISTRY POSTURE</div><div className={styles.specLine}><span>Visible result</span><strong>{visible.length}</strong></div><div className={styles.specLine}><span>Selected</span><strong>{selected.length}</strong></div><div className={styles.specLine}><span>Ready to publish</span><strong>{snapshot.products.filter(p => p.readiness.ready).length}</strong></div></aside></section>
    <div className={styles.registryToolbar}><label className={styles.search}><Search size={14}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Reference, offer, item key…"/></label><div className={styles.filterRow}><Filter size={14}/>{['all','critical','attention','healthy','opportunity'].map(x => <button type="button" className={styles.chip} data-active={health === x} key={x} onClick={() => setHealth(x)}>{x}</button>)}<select className={styles.select} value={doctrine} onChange={e => setDoctrine(e.target.value)}><option value="all">All doctrines</option>{snapshot.doctrines.map(d => <option key={d.definition.key} value={d.definition.key}>{d.definition.label}</option>)}</select><select className={styles.select} value={status} onChange={e => setStatus(e.target.value)}><option value="all">All status</option>{['draft','review','approved','published','paused','archived'].map(x => <option key={x}>{x}</option>)}</select><select className={styles.select} value={readiness} onChange={e => setReadiness(e.target.value)}><option value="all">Readiness: all</option><option value="ready">Ready to publish</option><option value="blocked">Blocked</option>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><button type="button" className={styles.button} onClick={() => setCreate(true)}><PackagePlus size={13}/>Create offer</button></div></div>
    <section className={styles.bulkPanel}><div><strong>{selected.length} selected</strong><span>Canonical per-product authorities · no auto-publication after media</span></div><div className={styles.filterRow}><button type="button" className={styles.buttonSecondary} disabled={!selected.length || busy} onClick={() => setAction('publish')}>Publish</button><button type="button" className={styles.buttonSecondary} disabled={!selected.length || busy} onClick={() => setAction('unpublish')}>Unpublish</button><button type="button" className={styles.dangerButton} disabled={!selected.length || busy} onClick={() => setAction('archive')}>Archive</button><button type="button" className={styles.dangerButton} disabled={!selected.length || busy} onClick={() => setAction('purge')}>Permanently delete</button><select className={styles.select} value={categoryId} onChange={e => setCategoryId(e.target.value)}><option value="">Assign category…</option>{snapshot.categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select><button type="button" className={styles.buttonSecondary} disabled={!selected.length || !categoryId || busy} onClick={() => void assignCategory()}>Assign</button><select className={styles.select} value={mediaId} onChange={e => setMediaId(e.target.value)}><option value="">Choose media…</option>{snapshot.media.map(m => <option key={m.id} value={m.id}>{m.file_name}</option>)}</select><select className={styles.select} value={mediaRole} onChange={e => setMediaRole(e.target.value as 'primary' | 'gallery')}><option value="primary">Primary</option><option value="gallery">Gallery</option></select><button type="button" className={styles.buttonSecondary} disabled={!selected.length || !mediaId || busy} onClick={() => void assignMedia()}>Assign media</button><button type="button" className={styles.buttonGhost} disabled={!selected.length} onClick={() => setSelectedIds([])}>Clear</button></div></section>
    {selected.length ? <section className={styles.bulkPanel}><div><strong>CSV media mapping</strong><span>item_key,media_reference,role · proposed rows execute through existing media authority</span></div><textarea className={styles.textarea} value={mapping} onChange={e => setMapping(e.target.value)} placeholder={'item_key,media_reference,role\nhs-ek-005-08h,asset-id,primary'}/><button type="button" className={styles.buttonSecondary} disabled={!mapping.trim() || busy} onClick={() => void assignMedia()}>Preview / assign mapping</button></section> : null}
    {mediaPreview ? <section className={styles.resultPanel}><div className={styles.panelHeader}><h3>Proposed media matches ({mediaPreview.length})</h3><button type="button" className={styles.buttonGhost} onClick={() => setMediaPreview(null)}><X size={14}/></button></div>{mediaPreview.map(row => <div className={styles.resultRow} key={`${row.itemKey}:${row.mediaReference}`}><strong>{row.itemKey}</strong><span>{row.mediaReference}</span><b>{row.role}</b></div>)}<div className={styles.filterRow} style={{ padding: 12 }}><button type="button" className={styles.button} disabled={busy} onClick={() => void assignMedia()}>Confirm media assignment</button></div></section> : null}
    {notice ? <div className={`${styles.notice} ${styles.success}`}>{notice}</div> : null}
    {results.length ? <section className={styles.resultPanel}><div className={styles.panelHeader}><h3>Bulk result</h3><button type="button" className={styles.buttonGhost} onClick={() => setResults([])}><X size={14}/></button></div><div className={styles.resultSummary}><strong>Processed {results.length}</strong><span>Success {results.filter(x => x.result === 'success').length}</span><span>Blocked {results.filter(x => x.result === 'blocked').length}</span><span>Failed {results.filter(x => x.result === 'failed').length}</span></div>{results.map(row => <div className={styles.resultRow} key={`${row.id}:${row.itemKey}`}><strong>{row.itemKey}</strong><span>{row.previousState} → {row.newState}</span><b data-result={row.result}>{row.result}</b>{row.error ? <small>{row.error}</small> : null}</div>)}</section> : null}
    <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th><input type="checkbox" aria-label="Select all visible products" checked={allSelected} onChange={() => setSelectedIds(allSelected ? selectedIds.filter(id => !visible.some(p => p.id === id)) : Array.from(new Set([...selectedIds, ...visible.map(p => p.id)])))}/></th><th>Offer</th><th>Doctrine</th><th>Status</th><th>Readiness</th><th>Price</th><th>Territories</th><th>Providers</th><th>Conversion 30d</th><th>Orders</th><th>Revenue</th><th>Health</th><th>Updated</th></tr></thead><tbody>{visible.map(p => <tr key={p.id}><td><input type="checkbox" aria-label={`Select ${p.name}`} checked={selectedIds.includes(p.id)} onChange={() => toggle(p.id)}/></td><td role="button" tabIndex={0} onClick={() => open(p.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(p.id) } }}><div className={styles.productIdentity}><div className={styles.productThumb}>{p.mediaCount ? 'IMG' : 'AC'}</div><div><strong>{p.name}</strong><div className={styles.ref}>{p.reference} · {p.itemKey}</div></div></div></td><td>{p.doctrine}</td><td><span className={styles.status}>{p.status}</span></td><td><span className={p.readiness.ready ? styles.readyBadge : styles.blockedBadge}>{p.readiness.ready ? 'READY' : p.readiness.reasons.map(reason => labels[reason] || reason).join(' · ')}</span></td><td>{money(p.priceAmount, p.currencyLabel)}</td><td>{p.availableTerritories}</td><td>{p.providerCoverage}</td><td>{pct(p.conversion30d)}</td><td>{p.orders30d}</td><td>{money(p.revenue30d)}</td><td><span className={styles.healthDot} data-health={p.health}/>{p.health}</td><td>{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('fr-FR') : '—'}</td></tr>)}</tbody></table></div>
    {product ? <ProductMegaDrawer key={product.id} product={product} categories={snapshot.categories} territories={snapshot.territories} priceBooks={snapshot.priceBooks} media={snapshot.media} catalogItems={snapshot.catalogItems} publicationEvents={snapshot.publicationEvents} initialTab={drawer?.tab} onClose={() => setDrawer(null)} onMinimize={() => { setMinimized(v => v.includes(product.id) ? v : [...v, product.id]); setDrawer(null) }}/> : null}{create ? <CreateOfferDrawer categories={snapshot.categories} territories={snapshot.territories} onClose={() => setCreate(false)} onCreated={id => { setCreate(false); open(id) }}/> : null}{minimized.length ? <div className={styles.dock}>{minimized.map(id => { const p = snapshot.products.find(x => x.id === id); return p ? <button type="button" key={id} onClick={() => open(id)}>{p.reference} · {p.name}</button> : null })}</div> : null}
    {action ? <div className={styles.confirmBackdrop}><section className={styles.confirmCard}><h3>{action === 'purge' ? 'Permanently delete' : `Confirm ${action}`}</h3>{action === 'purge' ? <><p><strong>Irreversible action.</strong> {selected.length} selected product(s) will be checked and sent through the canonical dependency-protected purge authority. Archived products only; protected history remains intact.</p><div className={styles.resultPanel}>{selected.map(item => <div className={styles.resultRow} key={item.id}><strong>{item.itemKey}</strong><span>{item.reference}</span><b>{item.status}</b></div>)}</div><label className={styles.field}><span>Type DELETE PRODUCT CATALOG to confirm</span><input className={styles.input} value={purgeConfirmation} onChange={event => setPurgeConfirmation(event.target.value)} placeholder="DELETE PRODUCT CATALOG" aria-label="Type DELETE PRODUCT CATALOG to confirm"/></label></> : <p>{selected.length} product(s) will be processed individually; blocked products remain unchanged.</p>}<div className={styles.filterRow}><button type="button" className={styles.buttonSecondary} onClick={() => { setAction(null); setPurgeConfirmation('') }}>Cancel</button><button type="button" className={styles.button} disabled={busy || (action === 'purge' && purgeConfirmation !== 'DELETE PRODUCT CATALOG')} onClick={() => void execute()}>{action === 'purge' ? 'Permanently delete' : 'Confirm'}</button></div></section></div> : null}
  </main>
}
