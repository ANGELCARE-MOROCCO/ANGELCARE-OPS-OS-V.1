'use client'

import { FormEvent, useMemo, useState } from 'react'
import styles from './SanilaPublic.module.css'

const priorities = ['Admissions', 'Présences', 'Pédagogie', 'Finance', 'Paie', 'Transport', 'Communication familles', 'Rapports & direction']
const stepNames = ['Institution', 'Réalité actuelle', 'Priorités', 'Échelle', 'Calendrier', 'Contact']

export function SanilaDemoForm() {
  const [step, setStep] = useState(1)
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')
  const progress = useMemo(() => `${Math.round((step / stepNames.length) * 100)}%`, [step])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (step < stepNames.length || state === 'sending') return
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
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          audience: 'school', locale: 'fr', territoryCode: 'MA-MASTER',
          sourceRoute: '/angelcare-marketplace/fr/sanila/demonstration',
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
    <form className={styles.formPanel} onSubmit={submit} id="demande">
      <div className={styles.formHeader}><span>DÉMONSTRATION QUALIFIÉE</span><h2>Construisons l’ordre du jour avant d’ouvrir le produit.</h2><p>Six étapes courtes remplacent le formulaire générique : institution, réalité actuelle, priorités, échelle, calendrier et contact.</p></div>
      <div className={styles.stepBar} aria-label={`Étape ${step} sur ${stepNames.length}`}>{stepNames.map((name,index)=><span className={step >= index+1 ? styles.stepActive : ''} key={name} />)}</div>
      <div className={styles.stepLabels}>{stepNames.map((name,index)=><strong className={step === index+1 ? styles.stepActive : ''} key={name}>{index+1}. {name}</strong>)}</div>

      <div className={step===1?styles.formStep:styles.formStepHidden} aria-hidden={step!==1}><div className={styles.formGrid}>
        <label><span>Établissement *</span><input name="organization" required={step===1} placeholder="Nom de l’établissement" /></label>
        <label><span>Type d’établissement *</span><select name="schoolType" required={step===1} defaultValue=""><option value="" disabled>Sélectionner</option><option>Crèche & maternelle</option><option>École privée</option><option>Groupe scolaire / multi-sites</option><option>Autre structure éducative</option></select></label>
        <label><span>Ville *</span><input name="city" required={step===1} placeholder="Casablanca, Rabat, Kénitra…" /></label>
        <label><span>Votre rôle *</span><select name="role" required={step===1} defaultValue=""><option value="" disabled>Sélectionner</option><option>Propriétaire / fondateur</option><option>Direction générale</option><option>Direction administrative</option><option>Direction financière</option><option>Direction pédagogique</option><option>Responsable IT / transformation</option><option>Autre</option></select></label>
      </div></div>

      <div className={step===2?styles.formStep:styles.formStepHidden} aria-hidden={step!==2}><div className={styles.formGridWide}><label><span>Comment fonctionne l’établissement aujourd’hui ?</span><textarea name="currentTools" rows={6} placeholder="Excel, papier, logiciel actuel, WhatsApp, procédures internes, plusieurs outils séparés…" /></label><label><span>Qu’est-ce qui vous coûte le plus d’énergie ?</span><textarea name="message" rows={5} placeholder="Décrivez le workflow, le blocage ou la décision qui vous préoccupe le plus." /></label></div></div>

      <div className={step===3?styles.formStep:styles.formStepHidden} aria-hidden={step!==3}><fieldset className={styles.checkFieldset}><legend>Vos priorités principales</legend><div className={styles.checkGrid}>{priorities.map((priority)=><label key={priority}><input type="checkbox" name="priorities" value={priority}/><span>{priority}</span></label>)}</div></fieldset></div>

      <div className={step===4?styles.formStep:styles.formStepHidden} aria-hidden={step!==4}><div className={styles.formGrid}>
        <label><span>Effectif approximatif</span><select name="size" defaultValue=""><option value="">Non précisé</option><option>Moins de 100 élèves</option><option>100–300 élèves</option><option>301–700 élèves</option><option>701–1 500 élèves</option><option>Plus de 1 500 élèves</option></select></label>
        <label><span>Nombre de sites</span><select name="campuses" defaultValue=""><option value="">Non précisé</option><option>1</option><option>2</option><option>3–5</option><option>6 et plus</option></select></label>
      </div></div>

      <div className={step===5?styles.formStep:styles.formStepHidden} aria-hidden={step!==5}><div className={styles.formGrid}><label><span>Calendrier souhaité</span><select name="timing" defaultValue=""><option value="">À définir</option><option>Dès que possible</option><option>Dans 1–3 mois</option><option>Avant la prochaine rentrée</option><option>Dans 3–6 mois</option><option>Projet exploratoire</option></select></label><div className={styles.pagePatternPanel}><span>PRÉPARATION</span><h3>La démonstration suivra votre priorité.</h3><p>Nous utilisons les étapes précédentes pour concentrer l’échange sur le contexte le plus utile.</p></div></div></div>

      <div className={step===6?styles.formStep:styles.formStepHidden} aria-hidden={step!==6}><div className={styles.formGrid}>
        <label><span>Nom complet *</span><input name="fullName" required={step===6} autoComplete="name" /></label>
        <label><span>E-mail professionnel *</span><input name="email" type="email" required={step===6} autoComplete="email" /></label>
        <label><span>Téléphone *</span><input name="phone" required={step===6} autoComplete="tel" placeholder="+212 ..." /></label>
      </div><label className={styles.consentRow}><input type="checkbox" name="consent" required={step===6}/><span>J’accepte qu’AngelCare utilise ces informations pour traiter ma demande SANILA et me recontacter à ce sujet.</span></label></div>

      <input className={styles.honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className={styles.formSubmitRow}><div className={styles.stepActions}>{step>1?<button type="button" className={styles.secondaryAction} onClick={()=>setStep(v=>Math.max(1,v-1))}>Retour</button>:null}{step<6?<button type="button" onClick={(event:any)=>{if(event.currentTarget.form?.reportValidity())setStep(v=>Math.min(6,v+1))}}>Continuer</button>:<button type="submit" disabled={state==='sending'}>{state==='sending'?'Envoi en cours…':'Demander ma démonstration'}</button>}</div><small>Aucun environnement SANILA n’est créé par ce parcours.</small></div>
      <div className={styles.formStatus} aria-live="polite">{state==='success'?<p className={styles.formSuccess}>Votre demande a bien été enregistrée.{reference?` Référence : ${reference}.`:''}</p>:null}{state==='error'?<p className={styles.formError}>{error}</p>:null}</div>
    </form>
  )
}
