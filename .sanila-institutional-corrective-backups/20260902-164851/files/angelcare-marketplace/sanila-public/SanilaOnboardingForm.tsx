'use client'

import { FormEvent, useMemo, useState } from 'react'
import styles from './SanilaPublic.module.css'

const areas = ['Direction', 'Administration', 'Admissions', 'Présences', 'Pédagogie', 'Finance', 'Paie', 'Transport', 'Communication', 'Bibliothèque', 'Inventaire', 'Réclamations', 'Rapports']

export function SanilaOnboardingForm() {
  const [step, setStep] = useState(1)
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')
  const progress = useMemo(() => `${Math.round((step / 3) * 100)}%`, [step])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (step < 3) { setStep((value) => Math.min(3, value + 1)); return }
    if (state === 'sending') return
    setState('sending')
    setError('')
    const form = new FormData(event.currentTarget)
    const selectedAreas = areas.filter((area) => form.getAll('areas').includes(area))
    const message = [
      'INTENTION: DEMANDE DE PRÉPARATION D’UN ÉTABLISSEMENT SANILA — AUCUNE CRÉATION AUTOMATIQUE D’ENVIRONNEMENT',
      `Type: ${String(form.get('schoolType') || '')}`,
      `Sites: ${String(form.get('campuses') || '')}`,
      `Effectif: ${String(form.get('students') || '')}`,
      `Domaines souhaités: ${selectedAreas.join(', ') || 'À qualifier'}`,
      `Date cible: ${String(form.get('targetDate') || 'À définir')}`,
      `Processus actuels: ${String(form.get('currentContext') || 'Non précisé')}`,
      `Notes: ${String(form.get('notes') || 'Aucune')}`,
    ].join('\n')

    try {
      const response = await fetch('/api/angelcare-marketplace/public/inquiries', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          audience: 'school', locale: 'fr', territoryCode: 'MA-MASTER',
          sourceRoute: '/angelcare-marketplace/fr/sanila/creer-mon-etablissement',
          fullName: String(form.get('fullName') || ''), email: String(form.get('email') || ''), phone: String(form.get('phone') || ''),
          organization: String(form.get('organization') || ''), city: String(form.get('city') || ''), message,
          consent: form.get('consent') === 'on', website: String(form.get('website') || ''),
        }),
      })
      const payload = await response.json().catch(() => null) as { data?: { publicReference?: string }; error?: { message?: string } } | null
      if (!response.ok || !payload?.data) throw new Error(payload?.error?.message || 'Votre demande n’a pas pu être enregistrée.')
      setReference(payload.data.publicReference || '')
      setState('success')
    } catch (cause) {
      setState('error')
      setError(cause instanceof Error ? cause.message : 'Votre demande n’a pas pu être enregistrée.')
    }
  }

  return (
    <form className={styles.formPanel} onSubmit={submit} id="onboarding">
      <div className={styles.formHeader}><span>PRÉPARATION GUIDÉE</span><h2>Créer mon établissement SANILA</h2><p>Ce parcours prépare une revue AngelCare. Il ne crée pas automatiquement un environnement production.</p></div>
      <div className={styles.stepBar} aria-label={`Étape ${step} sur 3`}><span style={{ width: progress }} /></div>
      <div className={styles.stepLabels}><strong className={step >= 1 ? styles.stepActive : ''}>1. Organisation</strong><strong className={step >= 2 ? styles.stepActive : ''}>2. Périmètre</strong><strong className={step >= 3 ? styles.stepActive : ''}>3. Calendrier</strong></div>

      <div className={step === 1 ? styles.formStep : styles.formStepHidden} aria-hidden={step !== 1}>
        <div className={styles.formGrid}>
          <label><span>Établissement *</span><input name="organization" required={step === 1} /></label>
          <label><span>Responsable *</span><input name="fullName" required={step === 1} autoComplete="name" /></label>
          <label><span>E-mail *</span><input name="email" type="email" required={step === 1} autoComplete="email" /></label>
          <label><span>Téléphone *</span><input name="phone" required={step === 1} autoComplete="tel" /></label>
          <label><span>Ville *</span><input name="city" required={step === 1} /></label>
          <label><span>Type d’établissement *</span><select name="schoolType" required={step === 1} defaultValue=""><option value="" disabled>Sélectionner</option><option>Crèche & maternelle</option><option>École privée</option><option>Groupe scolaire / multi-sites</option><option>Autre</option></select></label>
        </div>
      </div>

      <div className={step === 2 ? styles.formStep : styles.formStepHidden} aria-hidden={step !== 2}>
        <div className={styles.formGrid}>
          <label><span>Nombre de sites</span><select name="campuses" defaultValue="1"><option>1</option><option>2</option><option>3–5</option><option>6 et plus</option></select></label>
          <label><span>Effectif estimé</span><input name="students" inputMode="numeric" placeholder="Ex. 480" /></label>
        </div>
        <fieldset className={styles.checkFieldset}><legend>Domaines SANILA souhaités</legend><div className={styles.checkGrid}>{areas.map((area) => <label key={area}><input type="checkbox" name="areas" value={area} /><span>{area}</span></label>)}</div></fieldset>
      </div>

      <div className={step === 3 ? styles.formStep : styles.formStepHidden} aria-hidden={step !== 3}>
        <div className={styles.formGrid}>
          <label><span>Date cible souhaitée</span><input name="targetDate" type="date" /></label>
          <label><span>Contexte actuel</span><select name="currentContext" defaultValue=""><option value="">À préciser</option><option>Principalement papier</option><option>Excel / Google Sheets</option><option>Plusieurs logiciels séparés</option><option>ERP / logiciel existant à remplacer</option><option>Nouveau projet / nouvel établissement</option></select></label>
        </div>
        <div className={styles.formGridWide}><label><span>Notes de préparation</span><textarea name="notes" rows={5} placeholder="Contraintes, échéances, système actuel, priorités internes…" /></label></div>
        <label className={styles.consentRow}><input type="checkbox" name="consent" required={step === 3} /><span>J’accepte qu’AngelCare utilise ces informations pour étudier la préparation de mon établissement SANILA et me recontacter.</span></label>
      </div>

      <input className={styles.honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className={styles.formSubmitRow}>
        <div className={styles.stepActions}>{step > 1 && <button type="button" className={styles.secondaryAction} onClick={() => setStep((value) => Math.max(1, value - 1))}>Retour</button>}<button type="submit" disabled={state === 'sending'}>{step < 3 ? 'Continuer' : state === 'sending' ? 'Envoi en cours…' : 'Soumettre pour revue'}</button></div>
        <small>Validation humaine requise avant toute création d’environnement.</small>
      </div>
      <div className={styles.formStatus} aria-live="polite">
        {state === 'success' && <p className={styles.formSuccess}>Demande de préparation enregistrée.{reference ? ` Référence : ${reference}.` : ''} Aucun environnement n’a été créé automatiquement.</p>}
        {state === 'error' && <p className={styles.formError}>{error}</p>}
      </div>
    </form>
  )
}
