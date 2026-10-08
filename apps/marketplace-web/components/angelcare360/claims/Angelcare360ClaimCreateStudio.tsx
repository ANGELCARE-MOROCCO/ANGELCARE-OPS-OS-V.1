'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import styles from './TrustResolutionOS.module.css'

type RequesterType = 'submittedByParentId' | 'submittedByStudentId' | 'submittedByStaffId' | 'submittedByAppUserId'
export type ClaimRequesterOption = { id: string; label: string; code?: string | null; type: RequesterType }

export default function Angelcare360ClaimCreateStudio({ schoolId, requesterOptions = [] }: { schoolId: string; requesterOptions?: ClaimRequesterOption[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [requesterType, setRequesterType] = useState<RequesterType>('submittedByParentId')
  const availableRequesters = requesterOptions.filter((option) => option.type === requesterType)

  async function submit(formData: FormData) {
    setBusy(true); setMessage(null); setError(false)
    const requesterId = String(formData.get('requesterId') || '').trim()
    const payload: Record<string, unknown> = {
      schoolId,
      reclamationCode: String(formData.get('reclamationCode') || '').trim(),
      subject: String(formData.get('subject') || '').trim(),
      description: String(formData.get('description') || '').trim(),
      priority: String(formData.get('priority') || 'normal'),
      category: String(formData.get('category') || '').trim() || null,
      status: 'new',
      [requesterType]: requesterId,
    }
    try {
      const response = await fetch('/api/angelcare360/claims', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'claim', operation: 'create', payload }) })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.ok) throw new Error(result?.error || 'Création impossible.')
      setMessage('Signal enregistré dans l’autorité Réclamations.')
      router.refresh()
      setTimeout(() => setOpen(false), 550)
    } catch (cause) {
      setError(true); setMessage(cause instanceof Error ? cause.message : 'Création impossible.')
    } finally { setBusy(false) }
  }

  return <>
    <button type="button" className={styles.primaryButton} onClick={() => setOpen(true)}><Plus size={15} />Nouveau signal</button>
    {open ? <div className={styles.overlay} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
      <section className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="claim-create-title">
        <header className={styles.sheetHero}><div><div className={styles.eyebrow}>SIGNAL INTAKE STUDIO</div><h2 id="claim-create-title">Ouvrir un dossier avec précision</h2><p>La création écrit dans l’autorité existante `angelcare360_reclamations`. Aucun faux canal ou statut de livraison externe n’est créé.</p></div><button className={styles.closeButton} type="button" onClick={() => setOpen(false)} aria-label="Fermer"><X size={17} /></button></header>
        <form action={submit}>
          <div className={styles.sheetForm}>
            <section className={styles.formSection}><h3>Identité du signal</h3><p>Une référence métier et une description factuelle rendent le dossier auditable dès l’ouverture.</p><div className={styles.formGrid}>
              <label className={styles.field}><span>Code réclamation</span><input className={styles.input} name="reclamationCode" required defaultValue={`RC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`} /></label>
              <label className={styles.field}><span>Priorité</span><select className={styles.select} name="priority" defaultValue="normal"><option value="low">Faible</option><option value="normal">Normale</option><option value="high">Élevée</option><option value="urgent">Urgente</option></select></label>
              <label className={styles.field} data-span="2"><span>Sujet</span><input className={styles.input} name="subject" required placeholder="Situation à comprendre et résoudre" /></label>
              <label className={styles.field} data-span="2"><span>Description factuelle</span><textarea className={styles.textarea} name="description" required placeholder="Décrire les faits, l’impact observé et le contexte connu. Éviter les suppositions." /></label>
              <label className={styles.field} data-span="2"><span>Catégorie</span><input className={styles.input} name="category" placeholder="Transport, finance, accueil, pédagogie…" /></label>
            </div></section>
            <section className={styles.formSection}><h3>Autorité du demandeur</h3><p>L’API actuelle exige un identifiant canonique parent, élève, personnel ou compte utilisateur. Le studio ne remplace pas cette identité par du texte libre.</p><div className={styles.formGrid}>
              <label className={styles.field}><span>Type de demandeur</span><select className={styles.select} value={requesterType} onChange={(event) => setRequesterType(event.target.value as RequesterType)}><option value="submittedByParentId">Parent / tuteur</option><option value="submittedByStudentId">Élève</option><option value="submittedByStaffId">Personnel</option><option value="submittedByAppUserId">Compte applicatif</option></select></label>
              <label className={styles.field}><span>{availableRequesters.length ? 'Dossier autorisé' : 'Identifiant canonique'}</span>{availableRequesters.length ? <select className={styles.select} name="requesterId" required defaultValue=""><option value="" disabled>Choisir dans l’autorité disponible</option>{availableRequesters.map((option) => <option key={`${option.type}-${option.id}`} value={option.id}>{option.label}{option.code ? ` · ${option.code}` : ''}</option>)}</select> : <input className={styles.input} name="requesterId" required placeholder="UUID du dossier autorisé" />}<small className={styles.helper}>{availableRequesters.length ? 'Cette liste provient de l’autorité personnes accessible au rôle courant.' : 'La liste personnes n’est pas accessible avec les permissions courantes ; un identifiant canonique reste requis par le backend.'}</small></label>
            </div></section>
            {message ? <div className={styles.formMessage} data-error={error}>{message}</div> : null}
          </div>
          <footer className={styles.formFooter}><button className={styles.secondaryButton} type="button" onClick={() => setOpen(false)}>Annuler</button><button className={styles.primaryButton} type="submit" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer le signal'}</button></footer>
        </form>
      </section>
    </div> : null}
  </>
}
