'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Database, FileSearch, ShieldCheck, X } from 'lucide-react'
import type { ImportIssue } from '@/lib/flashcards-os/types'
import styles from './flashcards-os.module.css'

export default function LegacyImportControl({ issues, sourceMode, collectionCount }: { issues: ImportIssue[]; sourceMode: 'database' | 'catalogue_seed'; collectionCount: number }) {
  const router = useRouter()
  const [selected, setSelected] = useState<ImportIssue | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const openIssues = issues.filter((item) => item.status === 'open')
  const high = openIssues.filter((item) => item.severity === 'high' || item.severity === 'critical').length
  const types = new Set(issues.map((item) => item.type)).size
  const pages = new Set(issues.map((item) => item.sourcePage)).size

  async function arbitrate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    setSaving(true)
    setMessage('')
    const data = new FormData(event.currentTarget)
    try {
      const response = await fetch(`/api/flashcards-os/import-issues/${encodeURIComponent(selected.id)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: data.get('status'), resolution: data.get('resolution') }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'L’arbitrage n’a pas pu être enregistré.')
      setMessage('Décision enregistrée avec traçabilité.')
      router.refresh()
      setTimeout(() => setSelected(null), 650)
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
          <p className={styles.eyebrow}>Governance · Legacy intake control</p>
          <h1 className={styles.pageTitle}>Catalogue Integrity Ledger</h1>
          <p className={styles.pageLead}>
            Le catalogue 2022 reste la preuve historique. Flashcards OS structure ses données sans corriger, fusionner ou deviner silencieusement les éléments ambigus.
          </p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.sourceBanner}><Database size={13} /> {sourceMode === 'database' ? 'Live issue ledger' : 'Seed evidence ledger'}</span>
          <Link className={styles.actionButton} href="/flashcards-os/product/collections">Retour au registre</Link>
        </div>
      </header>

      <section className={styles.importLayout}>
        <article className={styles.importLedger}>
          <div className={styles.importHero}>
            <div className={styles.integrityTop}>
              <span className={styles.horizonSeal} style={{ width: 58, height: 58 }}><FileSearch size={23} /></span>
              <div>
                <p className={styles.eyebrow}>Import batch · FC-CATALOGUE-2022-U1</p>
                <h2 className={styles.atlasCanvasTitle}>Source intake, anomaly preservation and human arbitration</h2>
                <p className={styles.atlasCanvasCopy}>Pages 3 à 7 structurées : Langage, Géographie, Mathématiques, Zoologie et Culture générale.</p>
              </div>
            </div>
            <div className={styles.importHeroGrid}>
              <div className={styles.importMetric}><div className={styles.importMetricValue}>{collectionCount}</div><div className={styles.importMetricLabel}>Records created</div></div>
              <div className={styles.importMetric}><div className={styles.importMetricValue}>{openIssues.length}</div><div className={styles.importMetricLabel}>Open decisions</div></div>
              <div className={styles.importMetric}><div className={styles.importMetricValue}>{high}</div><div className={styles.importMetricLabel}>High severity</div></div>
              <div className={styles.importMetric}><div className={styles.importMetricValue}>{types}</div><div className={styles.importMetricLabel}>Issue classes</div></div>
            </div>
          </div>

          <div className={styles.issueRows}>
            {issues.map((issue) => (
              <div className={styles.issueRow} key={issue.id}>
                <div><div className={styles.issueType}>{issue.type.replace(/_/g, ' ')}</div><div className={styles.collectionCode}>Page {issue.sourcePage} · {issue.severity} · {issue.status}</div></div>
                <div><div className={styles.issueCollection}>{issue.collectionName}</div><div className={styles.collectionCode}>{issue.collectionCode}</div></div>
                <div className={styles.issueExplanation}>{issue.explanation}</div>
                <div className={styles.issueActions}>
                  <Link className={styles.rowLink} href={`/flashcards-os/product/collections/${issue.collectionCode.toLowerCase()}`}>Dossier</Link>
                  <button className={styles.compactButton} type="button" disabled={sourceMode !== 'database' || issue.status !== 'open'} onClick={() => { setSelected(issue); setMessage('') }} title={sourceMode !== 'database' ? 'Appliquez d’abord la migration UMZ1' : issue.status !== 'open' ? 'Cette anomalie possède déjà une décision' : 'Enregistrer une décision gouvernée'}>Arbitrer</button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <aside className={styles.importDoctrine}>
          <div className={styles.integrityTop}><span className={styles.integrityIcon}><ShieldCheck size={18} /></span><div><div className={styles.decisionTitle}>Intake doctrine</div><div className={styles.insightLabel}>Binding governance</div></div></div>
          <div className={styles.doctrineItem}><div className={styles.doctrineIndex}>01 · SOURCE FIDELITY</div><div className={styles.doctrineTitle}>Conserver le fait historique</div><div className={styles.doctrineCopy}>Un doublon ou un N/A reste visible tant qu’une source supérieure ou une décision humaine ne l’a pas résolu.</div></div>
          <div className={styles.doctrineItem}><div className={styles.doctrineIndex}>02 · NO INVENTION</div><div className={styles.doctrineTitle}>Ne pas fabriquer le card register</div><div className={styles.doctrineCopy}>Le catalogue ne donne pas le contenu individuel des cartes. Aucun faux texte ou concept générique n’a été injecté.</div></div>
          <div className={styles.doctrineItem}><div className={styles.doctrineIndex}>03 · VERSIONED DECISION</div><div className={styles.doctrineTitle}>Arbitrer avec justification</div><div className={styles.doctrineCopy}>Fusion, renommage, reclassification ou maintien séparé doit produire une justification et un événement d’audit.</div></div>
          <div className={styles.doctrineItem}><div className={styles.doctrineIndex}>04 · COMMERCIAL SEPARATION</div><div className={styles.doctrineTitle}>Prix historique ≠ prix actif</div><div className={styles.doctrineCopy}>Les valeurs du catalogue sont conservées comme références historiques, sans devenir automatiquement un price book actuel.</div></div>
          <div className={styles.doctrineItem}><div className={styles.doctrineIndex}>05 · TRACEABILITY</div><div className={styles.doctrineTitle}>Lier page, code et décision</div><div className={styles.doctrineCopy}>Chaque record conserve son domaine, numéro et page source pour permettre un audit ultérieur.</div></div>
          <div className={styles.inspectorAlert} style={{ marginTop: 16 }}><AlertTriangle size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />{pages} page(s) du catalogue contiennent au moins une anomalie ouverte.</div>
        </aside>
      </section>

      {selected ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="Arbitrer une anomalie catalogue">
          <form className={styles.modal} onSubmit={arbitrate}>
            <div className={styles.modalHeader}>
              <div><h2 className={styles.modalTitle}>Arbitrage gouverné</h2><p className={styles.modalCopy}>{selected.collectionCode} · {selected.collectionName}<br />La source historique reste inchangée; la décision et sa justification sont ajoutées au ledger.</p></div>
              <button className={styles.iconButton} type="button" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <label className={styles.field}><span className={styles.fieldLabel}>Décision</span><select className={styles.fieldSelect} name="status" required><option value="resolved">Résolu par correction structurée</option><option value="accepted">Accepté comme fait historique</option><option value="rejected">Rejeté / donnée source non exploitable</option></select></label>
                <div className={styles.sectionCard}><div className={styles.sectionLabel}>Anomalie</div><div className={styles.sectionValue}>{selected.type.replace(/_/g, ' ')}</div></div>
                <label className={`${styles.field} ${styles.fieldWide}`}><span className={styles.fieldLabel}>Justification et décision appliquée</span><textarea className={styles.fieldTextarea} name="resolution" minLength={12} maxLength={2000} required placeholder="Source de vérité utilisée, décision de fusion/maintien/reclassification, impact et responsable…" /></label>
              </div>
              {message ? <div className={message.includes('enregistrée') ? styles.formSuccess : styles.formError}>{message}</div> : null}
            </div>
            <div className={styles.modalFooter}><button className={styles.ghostButton} type="button" onClick={() => setSelected(null)}>Annuler</button><button className={styles.actionButton} disabled={saving} type="submit"><CheckCircle2 size={15} /> {saving ? 'Enregistrement…' : 'Enregistrer la décision'}</button></div>
          </form>
        </div>
      ) : null}
    </>
  )
}
