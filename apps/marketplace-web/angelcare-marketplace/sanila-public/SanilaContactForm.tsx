'use client'

import { FormEvent, useState } from 'react'
import styles from './SanilaPublic.module.css'

export function SanilaContactForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state === 'sending') return
    setState('sending')
    setError('')
    const form = new FormData(event.currentTarget)
    const intent = String(form.get('intent') || 'Question générale')
    const message = `Intention: ${intent}\nRôle: ${String(form.get('role') || 'Non précisé')}\nMessage: ${String(form.get('message') || '')}`
    try {
      const response = await fetch('/api/angelcare-marketplace/public/inquiries', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          audience: intent === 'Partenariat' ? 'other' : 'school',
          locale: 'fr', territoryCode: 'MA-MASTER',
          sourceRoute: '/angelcare-marketplace/fr/sanila/contact',
          fullName: String(form.get('fullName') || ''),
          email: String(form.get('email') || ''), phone: String(form.get('phone') || ''),
          organization: String(form.get('organization') || ''), city: String(form.get('city') || ''),
          message, consent: form.get('consent') === 'on', website: String(form.get('website') || ''),
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
    <form className={styles.formPanel} onSubmit={submit} id="contact">
      <div className={styles.formHeader}><span>CONTACT SANILA</span><h2>Quel sujet voulez-vous faire avancer ?</h2><p>Votre intention nous aide à orienter la demande sans créer un circuit parallèle.</p></div>
      <div className={styles.formGrid}>
        <label><span>Sujet *</span><select name="intent" required defaultValue=""><option value="" disabled>Sélectionner</option><option>Question commerciale</option><option>Démonstration</option><option>Tarification</option><option>Mise en service</option><option>Partenariat</option><option>Avant-vente</option><option>Question générale</option></select></label>
        <label><span>Nom complet *</span><input name="fullName" required autoComplete="name" /></label>
        <label><span>Organisation *</span><input name="organization" required /></label>
        <label><span>Votre rôle</span><input name="role" placeholder="Direction, finance, pédagogie…" /></label>
        <label><span>E-mail *</span><input name="email" type="email" required autoComplete="email" /></label>
        <label><span>Téléphone</span><input name="phone" autoComplete="tel" /></label>
        <label><span>Ville</span><input name="city" /></label>
      </div>
      <div className={styles.formGridWide}><label><span>Votre message *</span><textarea name="message" required rows={6} placeholder="Expliquez ce que vous souhaitez comprendre, préparer ou résoudre." /></label></div>
      <input className={styles.honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label className={styles.consentRow}><input type="checkbox" name="consent" required /><span>J’accepte qu’AngelCare utilise ces informations pour traiter ma demande et me recontacter.</span></label>
      <div className={styles.formSubmitRow}><button type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Envoi en cours…' : 'Envoyer ma demande'}</button><small>La demande utilise l’autorité publique SANILA existante.</small></div>
      <div className={styles.formStatus} aria-live="polite">
        {state === 'success' && <p className={styles.formSuccess}>Demande enregistrée.{reference ? ` Référence : ${reference}.` : ''}</p>}
        {state === 'error' && <p className={styles.formError}>{error}</p>}
      </div>
    </form>
  )
}
