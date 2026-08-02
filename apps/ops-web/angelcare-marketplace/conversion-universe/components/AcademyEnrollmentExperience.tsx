'use client'

import { useState } from 'react'
import { Award, BadgeCheck, CalendarRange, Check, GraduationCap, MapPin, UsersRound } from 'lucide-react'
import type { CatalogLocale, DiscoveryItem } from '../../catalog-discovery/types'
import type { ConversionOption } from '../types'
import { conversionCopy } from '../content'
import { ConversionFrame, EvidencePanel } from './ConversionFrame'
import { useConversionEngine } from './useConversionEngine'
import styles from '../conversion.module.css'

export function AcademyEnrollmentExperience({ item, locale, cohorts }: { item: DiscoveryItem; locale: CatalogLocale; cohorts: ConversionOption[] }) {
  const engine = useConversionEngine({ item, locale, journey: 'academy_enrollment' })
  const copy = conversionCopy(locale)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ cohortId: cohorts[0]?.id || '', learnerType: 'individual', fullName: '', email: '', phone: '', learnerUserId: '', organizationName: '', motivation: '' })
  const selected = cohorts.find(option => option.id === form.cohortId)
  const set = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }))

  async function chooseCohort() {
    await engine.update({ configuration: { cohortId: form.cohortId, cohortReference: selected?.metadata.publicReference || null, learnerType: form.learnerType }, status: 'identity_pending' })
    await engine.revalidatePrice(1)
    await engine.revalidateAvailability({ cohortId: form.cohortId }, 1)
    setStep(2)
  }
  async function saveIdentity() {
    await engine.update({ identity: { fullName: form.fullName, email: form.email, phone: form.phone, learnerUserId: form.learnerUserId || null, organizationName: form.organizationName || null }, configuration: { motivation: form.motivation }, status: 'consent_pending' })
    setStep(3)
  }
  async function accept() {
    await engine.consent('marketplace_terms', true, { journey: 'academy_enrollment' })
    await engine.consent('privacy_notice', true, { journey: 'academy_enrollment' })
    await engine.consent('academy_attendance_and_assessment', true, { journey: 'academy_enrollment' })
    setStep(4)
  }
  async function confirm() { await engine.update({ status: 'ready' }); await engine.confirm(); setStep(5) }

  return <ConversionFrame item={item} locale={locale} journey="academy_enrollment" step={Math.min(step,5)} price={engine.price} error={engine.error} busy={engine.loading || engine.busy} outcome={engine.outcome} sidebar={<><EvidencePanel item={item} locale={locale}/><div className={styles.credentialPanel}><Award size={28}/><span>ACADEMY AUTHORITY</span><h3>{locale === 'fr' ? 'Inscription, présence, évaluation et certificat restent liés.' : locale === 'ar' ? 'يبقى التسجيل والحضور والتقييم والشهادة مترابطًا.' : 'Enrollment, attendance, assessment and certification remain linked.'}</h3></div></>}>
    {step === 1 ? <section className={styles.stagePanel}>
      <div className={styles.stageHeading}><span>01 · COHORT & CAPACITY</span><h2>{locale === 'fr' ? 'Choisissez une cohorte réellement ouverte' : locale === 'ar' ? 'اختر دفعة مفتوحة فعليًا' : 'Choose a genuinely open cohort'}</h2><p>{cohorts.length ? 'Les places affichées proviennent de la capacité Academy et du nombre d’inscrits.' : 'Aucune cohorte publiée n’est actuellement ouverte. La demande sera transmise pour qualification.'}</p></div>
      <div className={styles.optionCards}>{cohorts.map(option => <button type="button" key={option.id} data-selected={form.cohortId === option.id} onClick={() => set('cohortId', option.id)}><div><CalendarRange size={22}/><span>{option.status}</span></div><h3>{option.label}</h3><p>{option.subtitle || (option.startsAt ? new Date(option.startsAt).toLocaleDateString(locale) : 'Planning à confirmer')}</p><strong>{option.availableQuantity === null ? '—' : `${option.availableQuantity} places`}</strong></button>)}{!cohorts.length ? <div className={styles.noOption}><GraduationCap size={42}/><h3>Qualification Academy requise</h3><p>Le parcours reste disponible sans inventer une cohorte ou des places.</p></div> : null}</div>
      <div className={styles.segmentControl}><button type="button" data-selected={form.learnerType === 'individual'} onClick={() => set('learnerType','individual')}><UsersRound/>Individuel</button><button type="button" data-selected={form.learnerType === 'organization'} onClick={() => set('learnerType','organization')}><GraduationCap/>Organisation</button></div>
      <div className={styles.stageActions}><button type="button" onClick={() => void chooseCohort()}>{copy.continue}</button></div>
    </section> : null}
    {step === 2 ? <section className={styles.stagePanel}>
      <div className={styles.stageHeading}><span>02 · LEARNER IDENTITY</span><h2>{locale === 'fr' ? 'Identité et contexte d’apprentissage' : locale === 'ar' ? 'هوية المتعلم وسياق التعلم' : 'Learner identity and learning context'}</h2></div>
      <div className={styles.identityGrid}><label><span>Nom complet</span><input value={form.fullName} onChange={event => set('fullName',event.target.value)}/></label><label><span>Email</span><input type="email" value={form.email} onChange={event => set('email',event.target.value)}/></label><label><span>Téléphone</span><input value={form.phone} onChange={event => set('phone',event.target.value)}/></label>{form.learnerType === 'organization' ? <label><span>Organisation</span><input value={form.organizationName} onChange={event => set('organizationName',event.target.value)}/></label> : null}<label><span>Identifiant ANGELCARE (si existant)</span><input value={form.learnerUserId} onChange={event => set('learnerUserId',event.target.value)}/></label></div>
      <label className={styles.fullField}><span>Objectif / motivation</span><textarea rows={4} value={form.motivation} onChange={event => set('motivation',event.target.value)}/></label>
      <div className={styles.stageActions}><button className={styles.secondaryAction} type="button" onClick={() => setStep(1)}>{copy.back}</button><button type="button" disabled={!form.fullName || !form.email} onClick={() => void saveIdentity()}>{copy.continue}</button></div>
    </section> : null}
    {step === 3 ? <section className={styles.stagePanel}><div className={styles.stageHeading}><span>03 · ACADEMY CONSENTS</span><h2>Présence, évaluation et certification</h2></div><div className={styles.consentCards}><article><BadgeCheck/><div><b>Conditions Marketplace</b><p>Le prix et la capacité sont revérifiés avant confirmation.</p></div></article><article><Check/><div><b>Présence & évaluation</b><p>Les exigences d’assiduité, d’évaluation et de certification restent celles du programme Academy.</p></div></article><article><Check/><div><b>Confidentialité</b><p>Les données sont utilisées pour l’inscription et le suivi pédagogique autorisé.</p></div></article></div><div className={styles.stageActions}><button className={styles.secondaryAction} onClick={() => setStep(2)}>{copy.back}</button><button onClick={() => void accept()}>Accepter et vérifier</button></div></section> : null}
    {step === 4 ? <section className={styles.reviewPanel}><span>04 · ENROLLMENT REVIEW</span><h2>Vérification de l’inscription</h2><div className={styles.reviewGrid}><div><small>Programme</small><b>{item.name}</b></div><div><small>Cohorte</small><b>{selected?.label || 'Qualification manuelle'}</b></div><div><small>Places disponibles</small><b>{selected?.availableQuantity ?? 'À confirmer'}</b></div><div><small>Apprenant</small><b>{form.fullName}</b></div><div><small>Mode</small><b>{form.learnerType}</b></div><div><small>Disponibilité</small><b>{engine.availability?.status || 'configuration_required'}</b></div></div><div className={styles.stageActions}><button className={styles.secondaryAction} onClick={() => setStep(3)}>{copy.back}</button><button onClick={() => void confirm()}>{copy.confirm}</button></div></section> : null}
    {step === 5 && engine.outcome ? <section className={styles.confirmationPanel}><Award size={54}/><span>ACADEMY HANDOVER</span><h2>{engine.outcome.public_reference}</h2><p>{engine.outcome.status === 'created' ? 'L’inscription canonique a été créée.' : 'La demande d’inscription est enregistrée et doit être rapprochée de l’identité Academy.'}</p></section> : null}
  </ConversionFrame>
}
