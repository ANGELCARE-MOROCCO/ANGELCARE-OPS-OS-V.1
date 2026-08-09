'use client'

import { useState } from 'react'
import { CalendarDays, Check, Clock3, Home, MapPin, UsersRound } from 'lucide-react'
import type { CatalogLocale, DiscoveryItem } from '../../catalog-discovery/types'
import type { ConversionOption } from '../types'
import { conversionCopy } from '../content'
import { ConversionFrame, EvidencePanel } from './ConversionFrame'
import { useConversionEngine } from './useConversionEngine'
import styles from '../conversion.module.css'

export function ServiceBookingExperience({ item, locale, territories }: { item: DiscoveryItem; locale: CatalogLocale; territories: ConversionOption[] }) {
  const engine = useConversionEngine({ item, locale, journey: 'service_booking' })
  const copy = conversionCopy(locale)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    territoryCode: '', city: '', requestedDate: '', startTime: '', duration: '3h', frequency: 'one_time',
    childAge: '', locationType: 'home', locationNotes: '', fullName: '', email: '', phone: '',
  })
  const set = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }))

  async function configurationNext() {
    await engine.update({ territoryCode: form.territoryCode, configuration: { ...form, schedule: { startTime: form.startTime, frequency: form.frequency } }, status: 'identity_pending' })
    await engine.revalidatePrice(1)
    await engine.revalidateAvailability({ ...form, schedule: { startTime: form.startTime, frequency: form.frequency } })
    setStep(2)
  }
  async function identityNext() {
    await engine.update({ identity: { fullName: form.fullName, email: form.email, phone: form.phone, city: form.city }, status: 'consent_pending' })
    setStep(3)
  }
  async function consentNext() {
    await engine.consent('marketplace_terms', true, { channel: 'service_booking' })
    await engine.consent('privacy_notice', true, { channel: 'service_booking' })
    setStep(4)
  }
  async function confirm() {
    await engine.update({ status: 'ready' })
    await engine.confirm()
    setStep(5)
  }

  return <ConversionFrame item={item} locale={locale} journey="service_booking" step={Math.min(step, 5)} price={engine.price} error={engine.error} busy={engine.busy || engine.loading} outcome={engine.outcome} sidebar={<><EvidencePanel locale={locale} item={item}/><div className={styles.sidePromise}><Check size={18}/><b>{locale === 'fr' ? 'Aucun créneau n’est confirmé sans validation opérationnelle.' : locale === 'ar' ? 'لا يتم تأكيد أي موعد دون تحقق تشغيلي.' : 'No slot is confirmed without operational validation.'}</b></div></>}>
    {step === 1 ? <section className={styles.stagePanel}>
      <div className={styles.stageHeading}><span>01 · SERVICE CONFIGURATION</span><h2>{locale === 'fr' ? 'Construisez le bon cadre de service' : locale === 'ar' ? 'قم بإعداد إطار الخدمة المناسب' : 'Build the right service setup'}</h2><p>{locale === 'fr' ? 'Territoire, date, durée et contexte sont revérifiés contre la disponibilité publiée.' : locale === 'ar' ? 'يتم التحقق من النطاق والتاريخ والمدة والسياق مقابل التوفر المنشور.' : 'Territory, date, duration and context are checked against published availability.'}</p></div>
      <div className={styles.choiceGrid}>
        <label><span><MapPin size={17}/>{locale === 'fr' ? 'Territoire publié' : locale === 'ar' ? 'النطاق المنشور' : 'Published territory'}</span><select value={form.territoryCode} onChange={event => set('territoryCode', event.target.value)}><option value="">—</option>{territories.map(option=><option key={option.id} value={String(option.metadata.territoryCode||'')}>{option.label}{option.subtitle?` · ${option.subtitle}`:''}</option>)}</select></label><label><span><MapPin size={17}/>{locale === 'fr' ? 'Ville / zone de service' : locale === 'ar' ? 'المدينة / منطقة الخدمة' : 'City / service zone'}</span><input value={form.city} onChange={event => set('city', event.target.value)} placeholder={locale==='fr'?'Ville à confirmer':locale==='ar'?'المدينة المطلوب تأكيدها':'City to confirm'}/></label>
        <label><span><CalendarDays size={17}/>{locale === 'fr' ? 'Date souhaitée' : locale === 'ar' ? 'التاريخ المطلوب' : 'Preferred date'}</span><input type="date" value={form.requestedDate} onChange={event => set('requestedDate', event.target.value)}/></label>
        <label><span><Clock3 size={17}/>{locale === 'fr' ? 'Heure de début' : locale === 'ar' ? 'وقت البدء' : 'Start time'}</span><input type="time" value={form.startTime} onChange={event => set('startTime', event.target.value)}/></label>
        <label><span><Clock3 size={17}/>{locale === 'fr' ? 'Durée' : locale === 'ar' ? 'المدة' : 'Duration'}</span><select value={form.duration} onChange={event => set('duration', event.target.value)}><option value="2h">2 h</option><option value="3h">3 h</option><option value="4h">4 h</option><option value="full_day">Journée</option></select></label>
        <label><span><UsersRound size={17}/>{locale === 'fr' ? 'Âge de l’enfant' : locale === 'ar' ? 'عمر الطفل' : 'Child age'}</span><input value={form.childAge} onChange={event => set('childAge', event.target.value)} placeholder="4 ans"/></label>
        <label><span><Home size={17}/>{locale === 'fr' ? 'Lieu' : locale === 'ar' ? 'المكان' : 'Location'}</span><select value={form.locationType} onChange={event => set('locationType', event.target.value)}><option value="home">Domicile</option><option value="hotel">Hôtel</option><option value="event">Événement</option><option value="other">Autre</option></select></label>
      </div>
      <label className={styles.fullField}><span>{locale === 'fr' ? 'Contexte du lieu et priorités' : locale === 'ar' ? 'سياق المكان والأولويات' : 'Location context and priorities'}</span><textarea value={form.locationNotes} onChange={event => set('locationNotes', event.target.value)} rows={4}/></label>
      <div className={styles.stageActions}><button type="button" onClick={() => void configurationNext()} disabled={engine.busy || !form.territoryCode || !form.city || !form.requestedDate || territories.length===0}>{copy.save}</button></div>
    </section> : null}
    {step === 2 ? <section className={styles.stagePanel}>
      <div className={styles.stageHeading}><span>02 · FAMILY IDENTITY</span><h2>{locale === 'fr' ? 'Identifiez le responsable de la demande' : locale === 'ar' ? 'حدد المسؤول عن الطلب' : 'Identify the request owner'}</h2></div>
      <div className={styles.identityGrid}><label><span>Nom complet</span><input value={form.fullName} onChange={event => set('fullName', event.target.value)}/></label><label><span>Email</span><input type="email" value={form.email} onChange={event => set('email', event.target.value)}/></label><label><span>Téléphone</span><input type="tel" value={form.phone} onChange={event => set('phone', event.target.value)}/></label></div>
      <div className={styles.stageActions}><button className={styles.secondaryAction} type="button" onClick={() => setStep(1)}>{copy.back}</button><button type="button" onClick={() => void identityNext()} disabled={!form.fullName || !form.email || !form.phone}>{copy.continue}</button></div>
    </section> : null}
    {step === 3 ? <section className={styles.stagePanel}>
      <div className={styles.stageHeading}><span>03 · CONSENT & BOUNDARIES</span><h2>{locale === 'fr' ? 'Validez les règles du parcours' : locale === 'ar' ? 'تحقق من قواعد المسار' : 'Validate the journey rules'}</h2></div>
      <div className={styles.consentCards}><article><Check size={20}/><div><b>Conditions Marketplace 2026.1</b><p>Prix, disponibilité, périmètre et confirmation restent soumis aux autorités opérationnelles actives.</p></div></article><article><Check size={20}/><div><b>Notice de confidentialité 2026.1</b><p>Les données sont utilisées pour qualifier et exécuter cette demande dans le périmètre ANGELCARE.</p></div></article></div>
      <div className={styles.stageActions}><button className={styles.secondaryAction} type="button" onClick={() => setStep(2)}>{copy.back}</button><button type="button" onClick={() => void consentNext()}>{locale === 'fr' ? 'J’accepte et je continue' : locale === 'ar' ? 'أوافق وأتابع' : 'Accept and continue'}</button></div>
    </section> : null}
    {step === 4 ? <section className={styles.reviewPanel}><span>04 · FINAL REVIEW</span><h2>{locale === 'fr' ? 'Vérifiez avant de transmettre' : locale === 'ar' ? 'تحقق قبل الإرسال' : 'Review before submission'}</h2><div className={styles.reviewGrid}><div><small>Service</small><b>{item.name}</b></div><div><small>{locale==='fr'?'Territoire / ville':locale==='ar'?'النطاق / المدينة':'Territory / city'}</small><b>{territories.find(option=>String(option.metadata.territoryCode||'')===form.territoryCode)?.label||form.territoryCode} · {form.city}</b></div><div><small>Date</small><b>{form.requestedDate} · {form.startTime}</b></div><div><small>Durée</small><b>{form.duration}</b></div><div><small>Demandeur</small><b>{form.fullName}</b></div><div><small>Disponibilité</small><b>{engine.availability?.status || 'À revérifier'}</b></div></div><div className={styles.stageActions}><button className={styles.secondaryAction} type="button" onClick={() => setStep(3)}>{copy.back}</button><button type="button" onClick={() => void confirm()}>{copy.confirm}</button></div></section> : null}
    {step === 5 && engine.outcome ? <section className={styles.confirmationPanel}><Check size={54}/><span>ANGELCARE CONVERSION AUTHORITY</span><h2>{engine.outcome.public_reference}</h2><p>{locale === 'fr' ? 'La demande a été enregistrée et transmise au moteur canonique approprié. Une confirmation opérationnelle suivra selon la disponibilité réelle.' : locale === 'ar' ? 'تم تسجيل الطلب وإرساله إلى المحرك الأساسي المناسب. سيتبع تأكيد تشغيلي وفقًا للتوفر الفعلي.' : 'The request was recorded and handed to the appropriate canonical engine. Operational confirmation will follow according to real availability.'}</p></section> : null}
  </ConversionFrame>
}
