'use client'

import { FormEvent, useState } from 'react'
import styles from './SanilaPublic.module.css'

const priorities = ['Admissions', 'Présences', 'Pédagogie', 'Finance', 'Paie', 'Transport', 'Communication familles', 'Rapports & direction']

export function SanilaDemoForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state === 'sending') return
    setState('sending')
    setError('')
    const form = new FormData(event.currentTarget)
    const selectedPriorities = priorities.filter((priority) => form.getAll('priorities').includes(priority))
    const message = [
      `Rôle: ${String(form.get('role') || 'Non précisé')}`,
      `Type d’établissement: ${String(form.get('schoolType') || 'Non précisé')}`,
      `Effectif estimé: ${String(form.get('size') || 'Non précisé')}`,
      `Nombre de sites: ${String(form.get('campuses') || 'Non précisé')}`,
      `Priorités: ${selectedPriorities.join(', ') || 'Non précisées'}`,
      `Outils / processus actuels: ${String(form.get('currentTools') || 'Non précisé')}`,
      `Calendrier souhaité: ${String(form.get('timing') || 'Non précisé')}`,
      `Message: ${String(form.get('message') || 'Demande de démonstration SANILA')}`,
    ].join('\n')

    try {
      const response = await fetch('/api/angelcare-marketplace/public/inquiries', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          audience: 'school',
          locale: 'fr',
          territoryCode: 'MA-MASTER',
          sourceRoute: '/angelcare-marketplace/fr/sanila/demonstration',
          fullName: String(form.get('fullName') || ''),
          email: String(form.get('email') || ''),
          phone: String(form.get('phone') || ''),
          organization: String(form.get('organization') || ''),
          city: String(form.get('city') || ''),
          message,
          consent: form.get('consent') === 'on',
          website: String(form.get('website') || ''),
        }),
      })
      const payload = await response.json().catch(() => null) as { data?: { publicReference?: string }; error?: { message?: string } } | null
      if (!response.ok || !payload?.data) throw new Error(payload?.error?.message || 'Votre demande n’a pas pu être enregistrée.')
      setReference(payload.data.publicReference || '')
      setState('success')
      event.currentTarget.reset()
    } catch (cause) {
      setState('error')
      setError(cause instanceof Error ? cause.message : 'Votre demande n’a pas pu être enregistrée.')
    }
  }

  return (
    <form className={styles.formPanel} onSubmit={submit} id="demande">
      <div className={styles.formHeader}>
        <span>DEMANDE QUALIFIÉE</span>
        <h2>Préparons une démonstration qui ressemble à votre établissement.</h2>
        <p>Les champs ci-dessous nous permettent d’éviter une présentation générique et de concentrer l’échange sur vos priorités.</p>
      </div>
      <div className={styles.formGrid}>
        <label><span>Nom complet *</span><input name="fullName" required autoComplete="name" placeholder="Votre nom" /></label>
        <label><span>Établissement *</span><input name="organization" required placeholder="Nom de l’établissement" /></label>
        <label><span>Votre rôle *</span><select name="role" required defaultValue=""><option value="" disabled>Sélectionner</option><option>Propriétaire / fondateur</option><option>Direction générale</option><option>Direction administrative</option><option>Direction financière</option><option>Direction pédagogique</option><option>Responsable IT / transformation</option><option>Autre</option></select></label>
        <label><span>Ville *</span><input name="city" required placeholder="Casablanca, Rabat, Kénitra…" /></label>
        <label><span>E-mail professionnel *</span><input name="email" type="email" required autoComplete="email" placeholder="vous@ecole.ma" /></label>
        <label><span>Téléphone *</span><input name="phone" required autoComplete="tel" placeholder="+212 ..." /></label>
        <label><span>Type d’établissement *</span><select name="schoolType" required defaultValue=""><option value="" disabled>Sélectionner</option><option>Crèche & maternelle</option><option>École privée</option><option>Groupe scolaire / multi-sites</option><option>Autre structure éducative</option></select></label>
        <label><span>Effectif approximatif</span><select name="size" defaultValue=""><option value="">Non précisé</option><option>Moins de 100 élèves</option><option>100–300 élèves</option><option>301–700 élèves</option><option>701–1 500 élèves</option><option>Plus de 1 500 élèves</option></select></label>
        <label><span>Nombre de sites</span><select name="campuses" defaultValue=""><option value="">Non précisé</option><option>1</option><option>2</option><option>3–5</option><option>6 et plus</option></select></label>
        <label><span>Calendrier souhaité</span><select name="timing" defaultValue=""><option value="">À définir</option><option>Dès que possible</option><option>Dans 1–3 mois</option><option>Avant la prochaine rentrée</option><option>Dans 3–6 mois</option><option>Projet exploratoire</option></select></label>
      </div>
      <fieldset className={styles.checkFieldset}>
        <legend>Vos priorités principales</legend>
        <div className={styles.checkGrid}>{priorities.map((priority) => <label key={priority}><input type="checkbox" name="priorities" value={priority} /><span>{priority}</span></label>)}</div>
      </fieldset>
      <div className={styles.formGridWide}>
        <label><span>Outils ou processus actuels</span><textarea name="currentTools" rows={3} placeholder="Excel, papier, logiciel actuel, WhatsApp, procédures internes…" /></label>
        <label><span>Ce que vous souhaitez voir pendant la démonstration</span><textarea name="message" rows={4} placeholder="Décrivez le problème, le workflow ou la priorité que vous voulez évaluer." /></label>
      </div>
      <input className={styles.honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label className={styles.consentRow}><input type="checkbox" name="consent" required /><span>J’accepte qu’AngelCare utilise ces informations pour traiter ma demande SANILA et me recontacter à ce sujet.</span></label>
      <div className={styles.formSubmitRow}>
        <button type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Envoi en cours…' : 'Demander ma démonstration'}</button>
        <small>Aucun environnement SANILA n’est créé par ce formulaire.</small>
      </div>
      <div className={styles.formStatus} aria-live="polite">
        {state === 'success' && <p className={styles.formSuccess}>Votre demande a bien été enregistrée.{reference ? ` Référence : ${reference}.` : ''}</p>}
        {state === 'error' && <p className={styles.formError}>{error || 'Votre demande n’a pas pu être enregistrée.'}</p>}
      </div>
    </form>
  )
}
