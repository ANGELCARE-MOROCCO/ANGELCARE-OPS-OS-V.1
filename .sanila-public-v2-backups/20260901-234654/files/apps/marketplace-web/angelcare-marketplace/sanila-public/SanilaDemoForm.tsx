'use client'

import { FormEvent, useState } from 'react'
import styles from './SanilaPublic.module.css'

export function SanilaDemoForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [reference, setReference] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state === 'sending') return
    setState('sending')
    const form = new FormData(event.currentTarget)
    const payload = {
      audience: 'school',
      locale: 'fr',
      sourceRoute: '/angelcare-marketplace/fr/demonstration',
      fullName: String(form.get('fullName') || ''),
      email: String(form.get('email') || ''),
      phone: String(form.get('phone') || ''),
      organization: String(form.get('organization') || ''),
      city: String(form.get('city') || ''),
      message: `Type d’établissement: ${String(form.get('schoolType') || '')}. Taille approximative: ${String(form.get('size') || '')}. Priorités: ${String(form.get('priorities') || '')}`,
      consent: form.get('consent') === 'on',
      website: String(form.get('website') || ''),
    }

    try {
      const response = await fetch('/api/angelcare-marketplace/public/inquiries', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error('request_failed')
      const publicReference = data?.data?.publicReference || data?.publicReference || ''
      setReference(publicReference)
      setState('success')
      event.currentTarget.reset()
    } catch {
      setState('error')
    }
  }

  return (
    <form className={styles.demoForm} onSubmit={submit}>
      <div className={styles.formGrid}>
        <label>
          <span>Nom complet *</span>
          <input name="fullName" required autoComplete="name" placeholder="Votre nom" />
        </label>
        <label>
          <span>Établissement *</span>
          <input name="organization" required placeholder="Nom de l’établissement" />
        </label>
        <label>
          <span>E-mail professionnel</span>
          <input name="email" type="email" autoComplete="email" placeholder="vous@ecole.ma" />
        </label>
        <label>
          <span>Téléphone</span>
          <input name="phone" autoComplete="tel" placeholder="+212 ..." />
        </label>
        <label>
          <span>Ville</span>
          <input name="city" placeholder="Casablanca, Rabat..." />
        </label>
        <label>
          <span>Type d’établissement</span>
          <select name="schoolType" defaultValue="">
            <option value="" disabled>Sélectionner</option>
            <option>Crèche & maternelle</option>
            <option>École privée</option>
            <option>Groupe scolaire / multi-sites</option>
            <option>Autre structure éducative</option>
          </select>
        </label>
        <label>
          <span>Taille approximative</span>
          <select name="size" defaultValue="">
            <option value="" disabled>Sélectionner</option>
            <option>Moins de 100 élèves</option>
            <option>100–300 élèves</option>
            <option>301–700 élèves</option>
            <option>Plus de 700 élèves</option>
            <option>Plusieurs établissements</option>
          </select>
        </label>
        <label className={styles.formWide}>
          <span>Vos priorités</span>
          <textarea name="priorities" rows={4} placeholder="Admissions, finance, pédagogie, transport, communication..." />
        </label>
      </div>

      <label className={styles.honeypot} aria-hidden="true">
        Site web
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>

      <label className={styles.consent}>
        <input type="checkbox" name="consent" required />
        <span>J’accepte d’être recontacté par AngelCare au sujet de SANILA.</span>
      </label>

      <div className={styles.formAction}>
        <button className={styles.primaryButton} type="submit" disabled={state === 'sending'}>
          {state === 'sending' ? 'Envoi en cours…' : 'Préparer ma démonstration'}
        </button>
        <p>Votre demande est transmise à l’équipe AngelCare. Aucun accès n’est créé automatiquement.</p>
      </div>

      {state === 'success' ? (
        <div className={styles.formSuccess} role="status">
          <strong>Demande reçue.</strong>
          <span>Notre équipe peut maintenant préparer votre démonstration{reference ? ` • Référence ${reference}` : ''}.</span>
        </div>
      ) : null}

      {state === 'error' ? (
        <div className={styles.formError} role="alert">
          <strong>La demande n’a pas pu être envoyée.</strong>
          <span>Vérifiez votre connexion puis réessayez. Vos données n’ont pas été confirmées comme reçues.</span>
        </div>
      ) : null}
    </form>
  )
}
