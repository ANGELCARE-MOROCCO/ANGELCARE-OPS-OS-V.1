'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, BookOpenCheck, Database, Plus, ShieldCheck, X } from 'lucide-react'
import type { CollectionDossier } from '@/lib/flashcards-os/types'
import styles from './flashcards-os.module.css'

export default function CardContentRegistry({ dossier, sourceMode }: { dossier: CollectionDossier; sourceMode: 'database' | 'catalogue_seed' }) {
  const router = useRouter()
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [selected, setSelected] = useState(dossier.cards[0]?.id || '')
  const selectedCard = dossier.cards.find((card) => card.id === selected)
  const expected = dossier.expectedCardCount || 0
  const sequenceSlots = useMemo(() => Array.from({ length: Math.min(expected || 0, 120) }, (_, index) => index + 1), [expected])
  const nextSequence = dossier.cards.length ? Math.max(...dossier.cards.map((card) => card.sequence)) + 1 : 1

  async function createCard(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    const data = new FormData(event.currentTarget)
    try {
      const response = await fetch(`/api/flashcards-os/collections/${encodeURIComponent(dossier.code)}/cards`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sequence: Number(data.get('sequence')),
          concept: String(data.get('concept') || ''),
          frontText: String(data.get('frontText') || ''),
          backGuidance: String(data.get('backGuidance') || ''),
          language: String(data.get('language') || 'fr'),
          translation: String(data.get('translation') || ''),
          pronunciation: String(data.get('pronunciation') || ''),
          example: String(data.get('example') || ''),
          activity: String(data.get('activity') || ''),
          difficulty: String(data.get('difficulty') || 'foundation'),
          imageBrief: String(data.get('imageBrief') || ''),
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'La carte n’a pas pu être créée.')
      setMessage('Carte structurée ajoutée au registre.')
      router.refresh()
      setTimeout(() => setModal(false), 650)
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
          <p className={styles.eyebrow}>Product · Editorial operating surface</p>
          <h1 className={styles.pageTitle}>Card Content Registry</h1>
          <p className={styles.pageLead}>
            {dossier.code} · {dossier.name}. Chaque carte devient un enregistrement stable, ordonné et révisable — jamais une ligne anonyme enfermée dans un PDF.
          </p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.sourceBanner}><Database size={13} /> {sourceMode === 'database' ? 'Live editorial registry' : 'Seed evidence mode'}</span>
          <button className={styles.actionButton} type="button" onClick={() => setModal(true)}><Plus size={15} /> Structurer une carte</button>
        </div>
      </header>

      <section className={styles.cardsLayout}>
        <aside className={styles.sequenceRail}>
          <div className={styles.sequenceSummary}>
            <div className={styles.sequenceValue}>{dossier.cards.length}/{dossier.expectedCardCount ?? 'N/A'}</div>
            <div className={styles.sequenceLabel}>Structured card sequence</div>
          </div>
          {sequenceSlots.length ? (
            <div className={styles.sequenceSlots}>
              {sequenceSlots.map((slot) => {
                const card = dossier.cards.find((item) => item.sequence === slot)
                return <button className={`${styles.sequenceSlot} ${card ? styles.sequenceSlotDone : ''}`} type="button" key={slot} onClick={() => card && setSelected(card.id)} title={card?.concept || `Slot ${slot} non structuré`}>{slot}</button>
              })}
            </div>
          ) : (
            <div className={styles.inspectorAlert} style={{ marginTop: 13 }}>Le nombre attendu est N/A dans le catalogue historique. Validez d’abord la spécification produit.</div>
          )}
        </aside>

        <article className={styles.cardMatrix}>
          <div className={styles.cardMatrixHead}>
            <div><h2 className={styles.panelTitle}>Editorial matrix</h2><p className={styles.panelSubtitle}>Concept, recto, verso, langue, traduction, activité, difficulté, brief visuel et droits.</p></div>
            <span className={styles.statusPill}>{dossier.cards.length} records</span>
          </div>
          {dossier.cards.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.registryTable}>
                <thead><tr><th>#</th><th>Concept</th><th>Recto</th><th>Langue</th><th>Difficulté</th><th>Approval</th></tr></thead>
                <tbody>{dossier.cards.map((card) => <tr key={card.id} onClick={() => setSelected(card.id)} style={{ cursor: 'pointer' }}><td><strong>{card.sequence}</strong></td><td>{card.concept || 'Non renseigné'}</td><td>{card.frontText || 'Non renseigné'}</td><td>{card.language.toUpperCase()}</td><td>{card.difficulty}</td><td><span className={styles.statusPill}>{card.approvalStatus}</span></td></tr>)}</tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyRegistry}>
              <div className={styles.emptyRegistryInner}>
                <span className={styles.emptyRegistryIcon}><BookOpenCheck size={28} /></span>
                <h3 className={styles.emptyRegistryTitle}>Le registre carte par carte n’est pas présent dans le catalogue fourni.</h3>
                <p className={styles.emptyRegistryCopy}>
                  Le document source indique le nom de la collection, une quantité et un prix historique. Il ne fournit pas les concepts, textes, traductions, activités ou briefs visuels des cartes. Flashcards OS conserve donc un registre vide au lieu de fabriquer un faux contenu.
                </p>
                <button className={styles.actionButton} type="button" onClick={() => setModal(true)} style={{ marginTop: 16 }}><Plus size={15} /> Commencer la structuration réelle</button>
              </div>
            </div>
          )}
        </article>

        <aside className={styles.cardInspector}>
          <div className={styles.panelHeader} style={{ padding: 0, paddingBottom: 14 }}><div><h3 className={styles.panelTitle}>Card inspector</h3><p className={styles.panelSubtitle}>Détail éditorial du record sélectionné.</p></div><ShieldCheck size={17} color="#3150b5" /></div>
          {selectedCard ? (
            <div className={styles.sectionGrid} style={{ gridTemplateColumns: '1fr' }}>
              <div className={styles.sectionCard}><div className={styles.sectionLabel}>Concept</div><div className={styles.sectionValue}>{selectedCard.concept || 'Non renseigné'}</div></div>
              <div className={styles.sectionCard}><div className={styles.sectionLabel}>Recto</div><div className={styles.sectionValue}>{selectedCard.frontText || 'Non renseigné'}</div></div>
              <div className={styles.sectionCard}><div className={styles.sectionLabel}>Verso / guidance</div><div className={styles.sectionValue}>{selectedCard.backGuidance || 'Non renseigné'}</div></div>
              <div className={styles.sectionCard}><div className={styles.sectionLabel}>Brief visuel</div><div className={styles.sectionValue}>{selectedCard.imageBrief || 'Non renseigné'}</div></div>
            </div>
          ) : (
            <>
              <div className={styles.inspectorAlert}><AlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Aucun record structuré sélectionné.</div>
              <p className={styles.inspectorCopy}>L’inspecteur affichera le contenu, les traductions, les activités, le statut de droits et la décision d’approbation.</p>
            </>
          )}
        </aside>
      </section>

      {modal ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="Structurer une carte">
          <form className={styles.modal} onSubmit={createCard}>
            <div className={styles.modalHeader}>
              <div><h2 className={styles.modalTitle}>Créer un record carte</h2><p className={styles.modalCopy}>Saisir uniquement le contenu réel et vérifié. Les champs non connus peuvent rester vides.</p></div>
              <button className={styles.iconButton} type="button" onClick={() => setModal(false)}><X size={16} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <label className={styles.field}><span className={styles.fieldLabel}>Séquence</span><input className={styles.fieldInput} name="sequence" type="number" min="1" defaultValue={nextSequence} required /></label>
                <label className={styles.field}><span className={styles.fieldLabel}>Langue</span><input className={styles.fieldInput} name="language" defaultValue="fr" required /></label>
                <label className={`${styles.field} ${styles.fieldWide}`}><span className={styles.fieldLabel}>Concept canonique</span><input className={styles.fieldInput} name="concept" required /></label>
                <label className={`${styles.field} ${styles.fieldWide}`}><span className={styles.fieldLabel}>Texte recto</span><input className={styles.fieldInput} name="frontText" /></label>
                <label className={`${styles.field} ${styles.fieldWide}`}><span className={styles.fieldLabel}>Guidance verso</span><textarea className={styles.fieldTextarea} name="backGuidance" /></label>
                <label className={styles.field}><span className={styles.fieldLabel}>Traduction</span><input className={styles.fieldInput} name="translation" /></label>
                <label className={styles.field}><span className={styles.fieldLabel}>Prononciation</span><input className={styles.fieldInput} name="pronunciation" /></label>
                <label className={`${styles.field} ${styles.fieldWide}`}><span className={styles.fieldLabel}>Exemple</span><textarea className={styles.fieldTextarea} name="example" /></label>
                <label className={`${styles.field} ${styles.fieldWide}`}><span className={styles.fieldLabel}>Activité</span><textarea className={styles.fieldTextarea} name="activity" /></label>
                <label className={styles.field}><span className={styles.fieldLabel}>Difficulté</span><select className={styles.fieldSelect} name="difficulty"><option value="foundation">Foundation</option><option value="developing">Developing</option><option value="advanced">Advanced</option></select></label>
                <label className={`${styles.field} ${styles.fieldWide}`}><span className={styles.fieldLabel}>Brief visuel</span><textarea className={styles.fieldTextarea} name="imageBrief" /></label>
              </div>
              {message ? <div className={message.includes('ajoutée') ? styles.formSuccess : styles.formError}>{message}</div> : null}
            </div>
            <div className={styles.modalFooter}><button className={styles.ghostButton} type="button" onClick={() => setModal(false)}>Annuler</button><button className={styles.actionButton} disabled={saving} type="submit"><Plus size={15} /> {saving ? 'Enregistrement…' : 'Ajouter au registre'}</button></div>
          </form>
        </div>
      ) : null}
    </>
  )
}
