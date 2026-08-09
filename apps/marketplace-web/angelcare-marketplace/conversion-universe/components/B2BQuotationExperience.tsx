'use client'

import { useState } from 'react'
import { BadgeCheck, Building2, Check, Hotel, MapPin, ShieldCheck, UsersRound } from 'lucide-react'
import type { CatalogLocale, DiscoveryItem } from '../../catalog-discovery/types'
import { conversionCopy } from '../content'
import { ConversionFrame, EvidencePanel } from './ConversionFrame'
import { useConversionEngine } from './useConversionEngine'
import styles from '../conversion.module.css'

function verticalIcon(category: string | null) {
  if (category === 'hospitality') return Hotel
  if (category === 'health-partners') return ShieldCheck
  if (category === 'corporates') return UsersRound
  return Building2
}

export function B2BQuotationExperience({ item, locale }: { item: DiscoveryItem; locale: CatalogLocale }) {
  const journey = item.category_key === 'quality-check' ? 'quality_assessment' : 'b2b_quotation'
  const engine = useConversionEngine({ item, locale, journey })
  const copy = conversionCopy(locale)
  const Icon = verticalIcon(item.category_key)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ organizationName: '', organizationType: item.category_key || 'establishment', city: '', sites: '1', capacity: '', contactName: '', email: '', phone: '', scope: '', urgency: 'exploration', budgetContext: '' })
  const set = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }))

  async function saveScope() {
    await engine.update({ configuration: { organizationType: form.organizationType, city: form.city, sites: Number(form.sites || 1), capacity: Number(form.capacity || 0), scope: form.scope, urgency: form.urgency, budgetContext: form.budgetContext }, status: 'identity_pending' })
    await engine.revalidatePrice(Math.max(1, Number(form.sites || 1)))
    await engine.revalidateAvailability({ city: form.city, sites: Number(form.sites || 1), capacity: Number(form.capacity || 0) }, Math.max(1, Number(form.sites || 1)))
    setStep(2)
  }
  async function saveContact() {
    await engine.update({ identity: { organizationName: form.organizationName, contactName: form.contactName, fullName: form.contactName, email: form.email, phone: form.phone, city: form.city }, status: 'consent_pending' })
    setStep(3)
  }
  async function accept() {
    await engine.consent('marketplace_terms', true, { journey })
    await engine.consent('privacy_notice', true, { journey })
    if (item.category_key === 'health-partners') await engine.consent('non_medical_boundary', true, { explicitlyAcknowledged: true })
    setStep(4)
  }
  async function confirm() { await engine.update({ status: 'ready' }); await engine.confirm(); setStep(5) }

  return <ConversionFrame item={item} locale={locale} journey={journey} step={Math.min(step,5)} price={engine.price} error={engine.error} busy={engine.loading || engine.busy} outcome={engine.outcome} sidebar={<><EvidencePanel locale={locale} item={item}/><div className={styles.b2bSide}><Icon size={32}/><span>ENTERPRISE CONFIGURATION</span><h3>{locale === 'fr' ? 'La demande devient une entrée CRM qualifiable, jamais un faux contrat.' : locale === 'ar' ? 'يصبح الطلب مدخلاً قابلاً للتأهيل في CRM وليس عقدًا وهميًا.' : 'The request becomes a qualifiable CRM entry, never a fake contract.'}</h3></div></>}>
    {step === 1 ? <section className={styles.stagePanel}>
      <div className={styles.stageHeading}><span>01 · ORGANIZATION SCOPE</span><h2>{locale === 'fr' ? 'Définissez le périmètre réel de l’organisation' : locale === 'ar' ? 'حدد النطاق الفعلي للمؤسسة' : 'Define the organization’s real scope'}</h2><p>Sites, capacité, territoire et besoin alimentent la qualification commerciale et opérationnelle.</p></div>
      <div className={styles.identityGrid}><label><span><Building2 size={16}/>Organisation</span><input value={form.organizationName} onChange={event => set('organizationName', event.target.value)}/></label><label><span><MapPin size={16}/>Ville principale</span><input value={form.city} onChange={event => set('city', event.target.value)}/></label><label><span>Nombre de sites</span><input type="number" min="1" value={form.sites} onChange={event => set('sites', event.target.value)}/></label><label><span>Capacité / population concernée</span><input type="number" min="0" value={form.capacity} onChange={event => set('capacity', event.target.value)}/></label><label><span>Niveau d’urgence</span><select value={form.urgency} onChange={event => set('urgency', event.target.value)}><option value="exploration">Exploration</option><option value="planned">Projet planifié</option><option value="priority">Prioritaire</option><option value="critical">Critique</option></select></label><label><span>Contexte budgétaire</span><input value={form.budgetContext} onChange={event => set('budgetContext', event.target.value)} placeholder="Budget, appel d’offres, enveloppe…"/></label></div>
      <label className={styles.fullField}><span>Besoin, résultat attendu et contraintes</span><textarea rows={6} value={form.scope} onChange={event => set('scope',event.target.value)}/></label>
      <div className={styles.stageActions}><button onClick={() => void saveScope()} disabled={!form.organizationName || !form.city || !form.scope}>{copy.continue}</button></div>
    </section> : null}
    {step === 2 ? <section className={styles.stagePanel}>
      <div className={styles.stageHeading}><span>02 · DECISION CONTACT</span><h2>Responsable du parcours commercial</h2></div>
      <div className={styles.identityGrid}><label><span>Nom complet</span><input value={form.contactName} onChange={event => set('contactName',event.target.value)}/></label><label><span>Email professionnel</span><input type="email" value={form.email} onChange={event => set('email',event.target.value)}/></label><label><span>Téléphone</span><input value={form.phone} onChange={event => set('phone',event.target.value)}/></label></div>
      <div className={styles.stageActions}><button className={styles.secondaryAction} onClick={() => setStep(1)}>{copy.back}</button><button onClick={() => void saveContact()} disabled={!form.contactName || !form.email || !form.phone}>{copy.continue}</button></div>
    </section> : null}
    {step === 3 ? <section className={styles.stagePanel}><div className={styles.stageHeading}><span>03 · GOVERNANCE</span><h2>Consentement et limites de la proposition</h2></div><div className={styles.consentCards}><article><BadgeCheck/><div><b>Conditions Marketplace</b><p>La demande ne vaut ni contrat, ni disponibilité garantie, ni acceptation financière.</p></div></article><article><Check/><div><b>Confidentialité</b><p>Les données sont utilisées pour qualification, proposition et suivi autorisé.</p></div></article>{item.category_key === 'health-partners' ? <article><ShieldCheck/><div><b>Frontière explicitement non médicale</b><p>Le périmètre ne comprend aucun diagnostic, traitement, soin infirmier ou acte clinique.</p></div></article> : null}</div><div className={styles.stageActions}><button className={styles.secondaryAction} onClick={() => setStep(2)}>{copy.back}</button><button onClick={() => void accept()}>Accepter et vérifier</button></div></section> : null}
    {step === 4 ? <section className={styles.reviewPanel}><span>04 · PROPOSAL REVIEW</span><h2>Résumé de qualification</h2><div className={styles.reviewGrid}><div><small>Organisation</small><b>{form.organizationName}</b></div><div><small>Ville</small><b>{form.city}</b></div><div><small>Sites</small><b>{form.sites}</b></div><div><small>Capacité</small><b>{form.capacity || 'À préciser'}</b></div><div><small>Contact</small><b>{form.contactName}</b></div><div><small>Prix</small><b>{engine.price?.status === 'quote_required' ? 'Proposition requise' : `${engine.price?.grand_total || 0} ${engine.price?.currency_label || 'Dh'}`}</b></div></div><div className={styles.scopeReview}><small>Périmètre</small><p>{form.scope}</p></div><div className={styles.stageActions}><button className={styles.secondaryAction} onClick={() => setStep(3)}>{copy.back}</button><button onClick={() => void confirm()}>Transmettre la demande</button></div></section> : null}
    {step === 5 && engine.outcome ? <section className={styles.confirmationPanel}><Icon size={54}/><span>COMMERCIAL HANDOVER</span><h2>{engine.outcome.public_reference}</h2><p>La demande est enregistrée dans l’autorité de conversion et transmise au CRM canonique pour qualification.</p></section> : null}
  </ConversionFrame>
}
