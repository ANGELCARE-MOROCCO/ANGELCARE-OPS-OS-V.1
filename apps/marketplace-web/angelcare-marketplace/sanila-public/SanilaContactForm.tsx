'use client'

import { FormEvent, useState } from 'react'
import styles from './SanilaPublic.module.css'

const intents = ['Question commerciale','Démonstration','Tarification','Mise en service','Partenariat','Avant-vente','Question générale']

export function SanilaContactForm() {
  const [intent, setIntent] = useState('Question commerciale')
  const [state, setState] = useState<'idle'|'sending'|'success'|'error'>('idle')
  const [reference,setReference]=useState('')
  const [error,setError]=useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(state==='sending')return; setState('sending');setError('')
    const form=new FormData(event.currentTarget)
    const message=`Intention: ${intent}\nRôle: ${String(form.get('role')||'Non précisé')}\nMessage: ${String(form.get('message')||'')}`
    try{
      const response=await fetch('/api/angelcare-marketplace/public/inquiries',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({audience:intent==='Partenariat'?'other':'school',locale:'fr',territoryCode:'MA-MASTER',sourceRoute:'/angelcare-marketplace/fr/sanila/contact',fullName:String(form.get('fullName')||''),email:String(form.get('email')||''),phone:String(form.get('phone')||''),organization:String(form.get('organization')||''),city:String(form.get('city')||''),message,consent:form.get('consent')==='on',website:String(form.get('website')||'')})})
      const payload=await response.json().catch(()=>null) as {data?:{publicReference?:string};error?:{message?:string}}|null
      if(!response.ok||!payload?.data)throw new Error(payload?.error?.message||'Votre demande n’a pas pu être enregistrée.')
      setReference(payload.data.publicReference||'');setState('success')
    }catch(cause){setState('error');setError(cause instanceof Error?cause.message:'Votre demande n’a pas pu être enregistrée.')}
  }

  return <form className={styles.formPanel} onSubmit={submit} id="contact">
    <div className={styles.formHeader}><span>INTENTION D’ABORD</span><h2>Pourquoi souhaitez-vous nous contacter ?</h2><p>Le circuit commence par votre intention, puis seulement par vos coordonnées.</p></div>
    <div className={styles.contactIntentGrid} role="radiogroup" aria-label="Sujet de contact">{intents.map((item)=><label key={item}><input type="radio" name="intent-choice" value={item} checked={intent===item} onChange={()=>setIntent(item)}/><span>{item}</span></label>)}</div>
    <input type="hidden" name="intent" value={intent}/>
    <div className={styles.formGrid}>
      <label><span>Nom complet *</span><input name="fullName" required autoComplete="name"/></label><label><span>Organisation *</span><input name="organization" required/></label>
      <label><span>Votre rôle</span><input name="role" placeholder="Direction, finance, pédagogie…"/></label><label><span>Ville</span><input name="city"/></label>
      <label><span>E-mail *</span><input name="email" type="email" required autoComplete="email"/></label><label><span>Téléphone</span><input name="phone" autoComplete="tel"/></label>
    </div>
    <div className={styles.formGridWide}><label><span>Votre message *</span><textarea name="message" required rows={7} placeholder={`Décrivez votre besoin — ${intent.toLowerCase()}.`}/></label></div>
    <input className={styles.honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
    <label className={styles.consentRow}><input type="checkbox" name="consent" required/><span>J’accepte qu’AngelCare utilise ces informations pour traiter ma demande et me recontacter.</span></label>
    <div className={styles.formSubmitRow}><button type="submit" disabled={state==='sending'}>{state==='sending'?'Envoi en cours…':'Transmettre ma demande'}</button><small>Autorité publique Marketplace existante.</small></div>
    <div className={styles.formStatus} aria-live="polite">{state==='success'?<p className={styles.formSuccess}>Demande enregistrée.{reference?` Référence : ${reference}.`:''}</p>:null}{state==='error'?<p className={styles.formError}>{error}</p>:null}</div>
  </form>
}
