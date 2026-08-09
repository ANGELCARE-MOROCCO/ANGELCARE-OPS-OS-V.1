'use client'

import { useMemo, useState, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, Database, FolderPlus, GitBranch, Network, Plus, X } from 'lucide-react'
import type { TaxonomyNode } from '@/lib/flashcards-os/types'
import styles from './flashcards-os.module.css'

function flatten(nodes: TaxonomyNode[]): TaxonomyNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)])
}

export default function TaxonomyAtlas({ nodes, sourceMode }: { nodes: TaxonomyNode[]; sourceMode: 'database' | 'catalogue_seed' }) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState(nodes[0]?.id || '')
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => Object.fromEntries(nodes.map((node) => [node.id, true])))
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const allNodes = useMemo(() => flatten(nodes), [nodes])
  const selected = allNodes.find((node) => node.id === selectedId) || nodes[0]

  async function createCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    const data = new FormData(event.currentTarget)
    try {
      const response = await fetch('/api/flashcards-os/taxonomy', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          code: String(data.get('code') || ''),
          name: String(data.get('name') || ''),
          shortName: String(data.get('shortName') || ''),
          description: String(data.get('description') || ''),
          parentId: String(data.get('parentId') || '') || null,
          accent: String(data.get('accent') || 'indigo'),
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'La catégorie n’a pas pu être créée.')
      setMessage('Catégorie créée. Actualisation de la taxonomie…')
      router.refresh()
      setTimeout(() => setModal(false), 600)
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
          <p className={styles.eyebrow}>Product · Taxonomy governance</p>
          <h1 className={styles.pageTitle}>Taxonomy Atlas</h1>
          <p className={styles.pageLead}>
            Une architecture administrable, sans déploiement nécessaire pour créer de nouveaux domaines, catégories ou sous-catégories. Les cinq familles historiques sont replacées dans dix domaines maîtres extensibles.
          </p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.sourceBanner}><Database size={13} /> {sourceMode === 'database' ? 'Live taxonomy' : 'Seed preview · migration requise pour écrire'}</span>
          <button className={styles.actionButton} type="button" onClick={() => setModal(true)}><FolderPlus size={15} /> Ajouter un nœud</button>
        </div>
      </header>

      <section className={styles.atlasLayout}>
        <aside className={styles.atlasNavigator}>
          <div className={styles.atlasTree}>
            <div className={styles.panelHeader} style={{ padding: '5px 5px 12px' }}>
              <div>
                <h3 className={styles.panelTitle}>Architecture tree</h3>
                <p className={styles.panelSubtitle}>Domaines maîtres et sous-domaines.</p>
              </div>
              <Network size={17} color="#3150b5" />
            </div>
            {nodes.map((node) => (
              <div key={node.id}>
                <button
                  className={`${styles.treeNode} ${styles.treeRoot} ${selectedId === node.id ? styles.treeRootSelected : ''}`}
                  type="button"
                  onClick={() => setSelectedId(node.id)}
                >
                  <span className={styles.treeRootLine}>
                    <span
                      className={styles.treeChevron}
                      onClick={(event: MouseEvent<HTMLSpanElement>) => {
                        event.stopPropagation()
                        setExpanded((current) => ({ ...current, [node.id]: !current[node.id] }))
                      }}
                    >
                      {expanded[node.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                    <span className={styles.treeRootName}>{node.shortName}</span>
                    <span className={styles.treeCount}>{node.collectionCount}</span>
                  </span>
                </button>
                {expanded[node.id] && node.children.length ? (
                  <div className={styles.treeChildren}>
                    {node.children.map((child) => (
                      <button className={`${styles.treeNode} ${styles.treeChild}`} type="button" key={child.id} onClick={() => setSelectedId(child.id)}>
                        <span>{child.shortName}</span><span>{child.collectionCount}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </aside>

        <article className={styles.atlasCanvas}>
          <div className={styles.atlasCanvasHead}>
            <div>
              <p className={styles.eyebrow}>{selected?.code || 'TAXONOMY NODE'}</p>
              <h2 className={styles.atlasCanvasTitle}>{selected?.name || 'Aucun nœud sélectionné'}</h2>
              <p className={styles.atlasCanvasCopy}>{selected?.description}</p>
            </div>
            <span className={styles.domainCardIcon}><GitBranch size={18} /></span>
          </div>

          <div className={styles.coverageMatrix}>
            <div className={styles.coverageCell}><div className={styles.coverageCellLabel}>Collections</div><div className={styles.coverageCellValue}>{selected?.collectionCount || 0}</div><div className={styles.coverageCellFoot}>Directes et descendantes.</div></div>
            <div className={styles.coverageCell}><div className={styles.coverageCellLabel}>Cartes attendues</div><div className={styles.coverageCellValue}>{selected?.expectedCardCount || 0}</div><div className={styles.coverageCellFoot}>Quantités connues du catalogue.</div></div>
            <div className={styles.coverageCell}><div className={styles.coverageCellLabel}>Décisions</div><div className={styles.coverageCellValue}>{selected?.issueCount || 0}</div><div className={styles.coverageCellFoot}>Anomalies importées ouvertes.</div></div>
            <div className={styles.coverageCell}><div className={styles.coverageCellLabel}>Readiness</div><div className={styles.coverageCellValue}>{selected?.readinessAverage || 0}%</div><div className={styles.coverageCellFoot}>Moyenne pondérée.</div></div>
            <div className={styles.coverageCell}><div className={styles.coverageCellLabel}>Sous-domaines</div><div className={styles.coverageCellValue}>{selected?.children.length || 0}</div><div className={styles.coverageCellFoot}>Nœuds enfants directs.</div></div>
          </div>

          <div className={styles.subdomainGrid}>
            {(selected?.children.length ? selected.children : [selected]).filter(Boolean).map((child) => (
              <div className={styles.subdomainCard} key={child!.id}>
                <div className={styles.subdomainTop}>
                  <div className={styles.subdomainName}>{child!.shortName}</div>
                  <div className={styles.subdomainCode}>{child!.code}</div>
                </div>
                <div className={styles.subdomainMetrics}>
                  <div className={styles.subdomainMetric}><strong>{child!.collectionCount}</strong><span>Collections</span></div>
                  <div className={styles.subdomainMetric}><strong>{child!.expectedCardCount}</strong><span>Cartes</span></div>
                  <div className={styles.subdomainMetric}><strong>{child!.issueCount}</strong><span>Flags</span></div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <aside className={styles.atlasInspector}>
          <section className={styles.inspectorCard}>
            <div className={styles.inspectorCode}>{selected?.code}</div>
            <h3 className={styles.inspectorTitle}>Node inspector</h3>
            <p className={styles.inspectorCopy}>Le nœud sélectionné contrôle la classification et la couverture du portefeuille, mais ne contient pas les fichiers produit.</p>
            <div className={styles.inspectorStats}>
              <div className={styles.inspectorStat}><span>Parent</span><strong>{selected?.parentId || 'Portfolio root'}</strong></div>
              <div className={styles.inspectorStat}><span>Status</span><strong>{selected?.status}</strong></div>
              <div className={styles.inspectorStat}><span>Accent key</span><strong>{selected?.accent}</strong></div>
              <div className={styles.inspectorStat}><span>Sort order</span><strong>{selected?.order}</strong></div>
            </div>
          </section>
          <section className={styles.inspectorCard}>
            <div className={styles.insightLabel}>Architecture doctrine</div>
            <h3 className={styles.inspectorTitle}>Data-driven by contract</h3>
            <p className={styles.inspectorCopy}>Les administrateurs peuvent étendre la taxonomie sans modifier le code. Les relations restent traçables et les collections conservent leur lignée.</p>
          </section>
        </aside>
      </section>

      {modal ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="Nouvelle catégorie">
          <form className={styles.modal} onSubmit={createCategory}>
            <div className={styles.modalHeader}>
              <div><h2 className={styles.modalTitle}>Créer un nœud taxonomique</h2><p className={styles.modalCopy}>Ajout contrôlé d’un domaine ou sous-domaine sans déploiement applicatif.</p></div>
              <button className={styles.iconButton} type="button" onClick={() => setModal(false)}><X size={16} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <label className={styles.field}><span className={styles.fieldLabel}>Code stable</span><input className={styles.fieldInput} name="code" required placeholder="SCI-SPACE" /></label>
                <label className={styles.field}><span className={styles.fieldLabel}>Nom court</span><input className={styles.fieldInput} name="shortName" placeholder="Espace" /></label>
                <label className={`${styles.field} ${styles.fieldWide}`}><span className={styles.fieldLabel}>Nom officiel</span><input className={styles.fieldInput} name="name" required placeholder="Espace, astronomie & exploration" /></label>
                <label className={styles.field}><span className={styles.fieldLabel}>Parent</span><select className={styles.fieldSelect} name="parentId"><option value="">Domaine maître</option>{allNodes.map((node) => <option value={node.id} key={node.id}>{node.code} · {node.name}</option>)}</select></label>
                <label className={styles.field}><span className={styles.fieldLabel}>Accent</span><select className={styles.fieldSelect} name="accent"><option>indigo</option><option>blue</option><option>emerald</option><option>amber</option><option>rose</option><option>violet</option><option>teal</option></select></label>
                <label className={`${styles.field} ${styles.fieldWide}`}><span className={styles.fieldLabel}>Doctrine du nœud</span><textarea className={styles.fieldTextarea} name="description" required placeholder="Périmètre, finalité et critères de rattachement…" /></label>
              </div>
              {message ? <div className={message.includes('créée') ? styles.formSuccess : styles.formError}>{message}</div> : null}
            </div>
            <div className={styles.modalFooter}><button className={styles.ghostButton} type="button" onClick={() => setModal(false)}>Annuler</button><button className={styles.actionButton} disabled={saving} type="submit"><Plus size={15} /> {saving ? 'Création…' : 'Créer le nœud'}</button></div>
          </form>
        </div>
      ) : null}
    </>
  )
}
