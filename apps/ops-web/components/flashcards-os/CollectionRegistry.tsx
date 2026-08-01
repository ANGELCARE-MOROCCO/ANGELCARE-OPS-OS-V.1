'use client'

import Link from 'next/link'
import { useMemo, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Database, Filter, Layers3, Plus, Search, X } from 'lucide-react'
import type { CollectionSummary, TaxonomyNode } from '@/lib/flashcards-os/types'
import styles from './flashcards-os.module.css'

function flatten(nodes: TaxonomyNode[]): TaxonomyNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)])
}

function statusClass(status: string) {
  if (status === 'needs_review') return `${styles.statusPill} ${styles.statusReview}`
  if (status === 'approved' || status === 'active') return `${styles.statusPill} ${styles.statusGood}`
  return styles.statusPill
}

function money(value: number | null) {
  if (value == null) return '—'
  return `${new Intl.NumberFormat('fr-FR').format(value)} Dh`
}

export default function CollectionRegistry({
  collections,
  taxonomy,
  sourceMode,
  initialQuery = '',
  openCreate = false,
}: {
  collections: CollectionSummary[]
  taxonomy: TaxonomyNode[]
  sourceMode: 'database' | 'catalogue_seed'
  initialQuery?: string
  openCreate?: boolean
}) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [domain, setDomain] = useState('all')
  const [status, setStatus] = useState('all')
  const [modal, setModal] = useState(openCreate)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const nodes = useMemo(() => flatten(taxonomy), [taxonomy])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return collections.filter((collection) => {
      const matchesQuery = !q || `${collection.code} ${collection.name} ${collection.categoryName} ${collection.parentCategoryName}`.toLowerCase().includes(q)
      const matchesDomain = domain === 'all' || collection.parentCategoryName === domain
      const matchesStatus = status === 'all' || collection.status === status
      return matchesQuery && matchesDomain && matchesStatus
    })
  }, [collections, domain, query, status])

  const totalExpected = collections.reduce((sum, item) => sum + Number(item.expectedCardCount || 0), 0)
  const missingCounts = collections.filter((item) => item.expectedCardCount == null).length
  const flagged = collections.filter((item) => item.issueCount > 0).length
  const historicalValue = collections.reduce((sum, item) => sum + Number(item.historicalPriceDh || 0), 0)
  const rootDomains = [...new Set(collections.map((item) => item.parentCategoryName))].sort()

  async function createCollection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    const data = new FormData(event.currentTarget)
    try {
      const response = await fetch('/api/flashcards-os/collections', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          code: String(data.get('code') || ''),
          name: String(data.get('name') || ''),
          categoryId: String(data.get('categoryId') || ''),
          expectedCardCount: data.get('expectedCardCount') ? Number(data.get('expectedCardCount')) : null,
          historicalPriceDh: data.get('historicalPriceDh') ? Number(data.get('historicalPriceDh')) : null,
          ageMinMonths: data.get('ageMinMonths') ? Number(data.get('ageMinMonths')) : null,
          ageMaxMonths: data.get('ageMaxMonths') ? Number(data.get('ageMaxMonths')) : null,
          primaryObjective: String(data.get('primaryObjective') || ''),
          owner: String(data.get('owner') || 'Direction Produit'),
          languages: String(data.get('languages') || 'fr').split(',').map((value) => value.trim()).filter(Boolean),
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'La collection n’a pas pu être créée.')
      setMessage('Collection créée et enregistrée dans le registre canonique.')
      router.refresh()
      setTimeout(() => setModal(false), 700)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur inconnue.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Product · Canonical registry</p>
          <h1 className={styles.pageTitle}>Collection Registry</h1>
          <p className={styles.pageLead}>
            Le registre unique des collections, codes, rattachements, quantités attendues, prix historiques, readiness,
            formats et anomalies. Les fichiers finaux ne sont jamais confondus avec l’identité produit.
          </p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.sourceBanner}><Database size={13} /> {sourceMode === 'database' ? 'Database live' : 'Read-only seed mode'}</span>
          <button className={styles.actionButton} type="button" onClick={() => setModal(true)}><Plus size={15} /> Nouvelle collection</button>
        </div>
      </header>

      <section className={styles.registryLayout}>
        <div className={styles.registryMain}>
          <div className={styles.registryTools}>
            <div className={styles.registryFilters}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 11, top: 12, color: '#7b879a' }} />
                <input className={styles.filterInput} style={{ paddingLeft: 32 }} value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder="Code, collection, catégorie…" />
              </div>
              <select className={styles.filterSelect} value={domain} onChange={(event: ChangeEvent<HTMLSelectElement>) => setDomain(event.target.value)}>
                <option value="all">Tous les domaines</option>
                {rootDomains.map((item) => <option key={item}>{item}</option>)}
              </select>
              <select className={styles.filterSelect} value={status} onChange={(event: ChangeEvent<HTMLSelectElement>) => setStatus(event.target.value)}>
                <option value="all">Tous les statuts</option>
                <option value="needs_structuring">Needs structuring</option>
                <option value="needs_review">Needs review</option>
                <option value="approved">Approved</option>
              </select>
            </div>
            <span className={styles.sourceBanner}><Filter size={12} /> {visible.length}/{collections.length} visibles</span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.registryTable}>
              <thead><tr><th>Collection</th><th>Architecture</th><th>Format</th><th>Cartes</th><th>Prix legacy</th><th>Readiness</th><th>Décisions</th><th></th></tr></thead>
              <tbody>
                {visible.map((collection) => (
                  <tr key={collection.id}>
                    <td>
                      <div className={styles.collectionIdentity}>
                        <span className={styles.collectionGlyph}>{collection.code.split('-')[1] || 'FC'}</span>
                        <div><div className={styles.collectionName}>{collection.name}</div><div className={styles.collectionCode}>{collection.code} · v{collection.version}</div></div>
                      </div>
                    </td>
                    <td><div style={{ fontWeight: 850, color: '#26334e' }}>{collection.categoryName}</div><div className={styles.collectionCode}>{collection.parentCategoryName}</div></td>
                    <td><span className={statusClass(collection.status)}>{collection.primaryFormat.replace(/_/g, ' ')}</span></td>
                    <td><strong>{collection.structuredCardCount}</strong> / {collection.expectedCardCount ?? 'N/A'}</td>
                    <td>{money(collection.historicalPriceDh)}</td>
                    <td><div className={styles.readinessMini}><div className={styles.readinessTrack}><div className={styles.readinessFill} style={{ width: `${collection.readiness}%` }} /></div><strong>{collection.readiness}%</strong></div></td>
                    <td>{collection.issueCount ? <span className={styles.issuePill}>{collection.issueCount}</span> : <span className={`${styles.statusPill} ${styles.statusGood}`}>clear</span>}</td>
                    <td><Link className={styles.rowLink} href={`/flashcards-os/product/collections/${collection.code.toLowerCase()}`}>Ouvrir dossier →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className={styles.registryAside}>
          <section className={styles.registryInsight}><div className={styles.insightLabel}>Canonical records</div><div className={styles.insightValue}>{collections.length}</div><p className={styles.insightCopy}>Collections importées et codifiées depuis le catalogue fourni.</p></section>
          <section className={styles.registryInsight}><div className={styles.insightLabel}>Expected card volume</div><div className={styles.insightValue}>{totalExpected}</div><p className={styles.insightCopy}>{missingCounts} collections gardent une quantité N/A, sans estimation inventée.</p></section>
          <section className={styles.registryInsight}><div className={styles.insightLabel}>Decision exposure</div><div className={styles.insightValue}>{flagged}</div><p className={styles.insightCopy}>Collections portant au moins une anomalie importée à arbitrer.</p></section>
          <section className={styles.registryInsight}><div className={styles.insightLabel}>Historical price sum</div><div className={styles.insightValue}>{new Intl.NumberFormat('fr-FR').format(historicalValue)}</div><p className={styles.insightCopy}>Dh · somme indicative des prix unitaires du catalogue, pas un chiffre d’affaires.</p></section>
          <section className={styles.registryInsight}>
            <div className={styles.integrityTop}><span className={styles.integrityIcon}><AlertTriangle size={18} /></span><div><div className={styles.integrityTitle}>Source limitation</div><div className={styles.insightLabel}>Card content absent</div></div></div>
            <p className={styles.insightCopy}>Le catalogue documente les noms, quantités et prix, mais ne fournit pas le contenu carte par carte. Flashcards OS expose ce manque au lieu de fabriquer un faux registre.</p>
          </section>
        </aside>
      </section>

      {modal ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="Nouvelle collection">
          <form className={styles.modal} onSubmit={createCollection}>
            <div className={styles.modalHeader}>
              <div><h2 className={styles.modalTitle}>Créer une collection canonique</h2><p className={styles.modalCopy}>L’identité produit sera séparée des futures éditions, formats, variantes et livrables.</p></div>
              <button className={styles.iconButton} type="button" onClick={() => setModal(false)}><X size={16} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <label className={styles.field}><span className={styles.fieldLabel}>Code stable</span><input className={styles.fieldInput} name="code" required placeholder="FC-LANG-104" /></label>
                <label className={styles.field}><span className={styles.fieldLabel}>Owner</span><input className={styles.fieldInput} name="owner" defaultValue="Direction Produit" /></label>
                <label className={`${styles.field} ${styles.fieldWide}`}><span className={styles.fieldLabel}>Nom officiel</span><input className={styles.fieldInput} name="name" required placeholder="Actions de la vie quotidienne" /></label>
                <label className={`${styles.field} ${styles.fieldWide}`}><span className={styles.fieldLabel}>Sous-catégorie</span><select className={styles.fieldSelect} name="categoryId" required><option value="">Sélectionner…</option>{nodes.filter((node) => node.parentId).map((node) => <option value={node.id} key={node.id}>{node.code} · {node.name}</option>)}</select></label>
                <label className={styles.field}><span className={styles.fieldLabel}>Nombre attendu</span><input className={styles.fieldInput} type="number" min="1" name="expectedCardCount" /></label>
                <label className={styles.field}><span className={styles.fieldLabel}>Prix indicatif Dh</span><input className={styles.fieldInput} type="number" min="0" step="0.01" name="historicalPriceDh" /></label>
                <label className={styles.field}><span className={styles.fieldLabel}>Âge minimum (mois)</span><input className={styles.fieldInput} type="number" min="0" name="ageMinMonths" /></label>
                <label className={styles.field}><span className={styles.fieldLabel}>Âge maximum (mois)</span><input className={styles.fieldInput} type="number" min="0" name="ageMaxMonths" /></label>
                <label className={`${styles.field} ${styles.fieldWide}`}><span className={styles.fieldLabel}>Langues (codes séparés par virgule)</span><input className={styles.fieldInput} name="languages" defaultValue="fr" placeholder="fr, ar, en" /></label>
                <label className={`${styles.field} ${styles.fieldWide}`}><span className={styles.fieldLabel}>Objectif principal</span><textarea className={styles.fieldTextarea} name="primaryObjective" required placeholder="Compétence, problème traité et résultat d’apprentissage attendu…" /></label>
              </div>
              {message ? <div className={message.includes('créée') ? styles.formSuccess : styles.formError}>{message}</div> : null}
            </div>
            <div className={styles.modalFooter}><button className={styles.ghostButton} type="button" onClick={() => setModal(false)}>Annuler</button><button className={styles.actionButton} disabled={saving} type="submit"><Layers3 size={15} /> {saving ? 'Création…' : 'Créer la collection'}</button></div>
          </form>
        </div>
      ) : null}
    </>
  )
}
