'use client'

import { useMemo, useState } from 'react'
import {
  BadgeDollarSign, CalendarClock, CalendarPlus, ChevronDown, ChevronUp, Home, PencilLine,
  RefreshCcw, Save, UserPlus, UsersRound, WalletCards,
} from 'lucide-react'
import type { CustomerMegaDossier } from '../types'
import styles from '../enterprise-command.module.css'

type Row = Record<string, unknown>
type Props = { data: CustomerMegaDossier; onReload: () => Promise<void> }
type ApiError = { error?: { message?: string } }
const txt = (r: Row | null | undefined, k: string) => String(r?.[k] ?? '')
const bool = (v: unknown) => v === true
const isoLocal = (v: unknown) => {
  const raw = String(v ?? '')
  if (!raw) return ''
  const d = new Date(raw)
  if (!Number.isFinite(d.getTime())) return raw.slice(0, 16)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function request(url: string, method: string, body: Row) {
  const response = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const payload = await response.json().catch(() => ({})) as ApiError
  if (!response.ok) throw new Error(payload.error?.message || 'Action impossible.')
  return payload
}

export function CustomerInlineOperations({ data, onReload }: Props) {
  const c = data.customer
  const [idName, setIdName] = useState(txt(c, 'display_name'))
  const [email, setEmail] = useState(txt(c, 'email'))
  const [phone, setPhone] = useState(txt(c, 'phone'))
  const [status, setStatus] = useState(txt(c, 'status') || 'active')
  const [premium, setPremium] = useState(Boolean(c.premium_status))
  const [guardianName, setGuardianName] = useState('')
  const [guardianRelation, setGuardianRelation] = useState('parent')
  const [guardianEmail, setGuardianEmail] = useState('')
  const [childName, setChildName] = useState('')
  const [birth, setBirth] = useState('')
  const [ageGroup, setAgeGroup] = useState('0-3')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentRef, setPaymentRef] = useState('')
  const [bookingStart, setBookingStart] = useState('')
  const [bookingTitle, setBookingTitle] = useState('Service AngelCare')
  const [creditAmount, setCreditAmount] = useState('')
  const [creditReason, setCreditReason] = useState('Ajustement commercial documenté')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [section, setSection] = useState<'family' | 'commerce' | 'crm'>('family')

  const familyId = useMemo(() => txt(data.family, 'id') || txt(c, 'family_account_id'), [data.family, c])

  async function call(url: string, method: string, body: Row, ok: string) {
    setBusy(true); setNotice('')
    try {
      await request(url, method, body)
      setNotice(ok)
      await onReload()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Action impossible.')
    } finally { setBusy(false) }
  }

  async function walletAdjust() {
    const accountId = txt(data.walletAccount, 'id')
    const amount = Number(creditAmount)
    if (!accountId || !Number.isFinite(amount) || amount === 0) return
    await call(`/api/angelcare-marketplace/admin/wallet/accounts/${accountId}/adjustment`, 'POST', {
      amount: Math.abs(amount), direction: amount > 0 ? 'credit' : 'debit', bucketKind: 'goodwill', reason: creditReason,
      idempotencyKey: crypto.randomUUID(),
    }, 'AngelCare Credit ajusté et journalisé.')
    setCreditAmount('')
  }

  return <div className={styles.command}>
    <section className={styles.panel}>
      <div className={styles.panelTitle}><div><div className={styles.eyebrow}>Customer Operating Desktop</div><h3>Opérations client sans perte de contexte</h3></div><span className={styles.chip}>inline + nested</span></div>
      <div className={styles.grid3}>
        <F label="Nom"><input className={styles.input} value={idName} onChange={e => setIdName(e.target.value)} /></F>
        <F label="Email"><input className={styles.input} value={email} onChange={e => setEmail(e.target.value)} /></F>
        <F label="Téléphone"><input className={styles.input} value={phone} onChange={e => setPhone(e.target.value)} /></F>
        <F label="Statut"><select className={styles.select} value={status} onChange={e => setStatus(e.target.value)}><option value="active">Active</option><option value="pending_verification">Pending verification</option><option value="restricted">Restricted</option><option value="suspended">Suspended</option><option value="closed">Closed</option></select></F>
        <F label="Premium"><label className={styles.checkRow}><input type="checkbox" checked={premium} onChange={e => setPremium(e.target.checked)} /> Client premium</label></F>
        <div className={styles.field}><label>Action</label><button className={styles.button} disabled={busy || !idName || !email} onClick={() => void call(`/api/angelcare-marketplace/admin/customers/${txt(c, 'id')}`, 'PATCH', { displayName: idName, email, phone, status, premiumStatus: premium }, 'Identité client enregistrée.')}><Save size={14} />Enregistrer identité</button></div>
      </div>
    </section>

    <div className={styles.tabs}>
      {([['family', 'Famille & adresses'], ['commerce', 'Bookings · abonnements · finance'], ['crm', 'CRM & commercial']] as const).map(([key, label]) => <button key={key} className={`${styles.tab} ${section === key ? styles.tabActive : ''}`} onClick={() => setSection(key)}>{label}</button>)}
    </div>

    {section === 'family' ? <>
      <div className={styles.grid2}>
        <section className={styles.panel}><div className={styles.panelTitle}><h3><UsersRound size={16} /> Responsables familiaux</h3><span className={styles.chip}>{data.guardians.length}</span></div>
          <div className={styles.stackList}>{data.guardians.map((row, index) => <GuardianEditor key={txt(row, 'id') || index} row={row} familyId={familyId} customerId={txt(c, 'id')} busy={busy} execute={call} />)}</div>
          <div className={styles.inlineCreate}><div className={styles.grid3}><F label="Nouveau nom"><input className={styles.input} value={guardianName} onChange={e => setGuardianName(e.target.value)} /></F><F label="Relation"><input className={styles.input} value={guardianRelation} onChange={e => setGuardianRelation(e.target.value)} /></F><F label="Email"><input className={styles.input} value={guardianEmail} onChange={e => setGuardianEmail(e.target.value)} /></F></div><button className={styles.buttonSecondary} disabled={busy || !familyId || !guardianName} onClick={() => void call(`/api/angelcare-marketplace/admin/families/${familyId}/guardians`, 'POST', { fullName: guardianName, relationship: guardianRelation, email: guardianEmail, customerAccountId: txt(c, 'id') }, 'Responsable ajouté.')}><UserPlus size={14} />Ajouter responsable</button></div>
        </section>
        <section className={styles.panel}><div className={styles.panelTitle}><h3><UserPlus size={16} /> Enfants / bénéficiaires</h3><span className={styles.chip}>{data.children.length}</span></div>
          <div className={styles.stackList}>{data.children.map((row, index) => <ChildEditor key={txt(row, 'id') || index} row={row} customerId={txt(c, 'id')} busy={busy} execute={call} />)}</div>
          <div className={styles.inlineCreate}><div className={styles.grid3}><F label="Prénom"><input className={styles.input} value={childName} onChange={e => setChildName(e.target.value)} /></F><F label="Naissance"><input className={styles.input} type="date" value={birth} onChange={e => setBirth(e.target.value)} /></F><F label="Tranche d’âge"><input className={styles.input} value={ageGroup} onChange={e => setAgeGroup(e.target.value)} /></F></div><button className={styles.buttonSecondary} disabled={busy || !childName || !birth} onClick={() => void call(`/api/angelcare-marketplace/admin/customers/${txt(c, 'id')}/family/children`, 'POST', { firstName: childName, birthDate: birth, ageGroup }, 'Enfant ajouté.')}><UserPlus size={14} />Ajouter enfant</button></div>
        </section>
      </div>
      <section className={styles.panel}><div className={styles.panelTitle}><h3><Home size={16} /> Adresses & service</h3><span className={styles.chip}>{data.addresses.length}</span></div>
        <div className={styles.stackList}>{data.addresses.map((row, index) => <AddressEditor key={txt(row, 'id') || index} row={row} customerId={txt(c, 'id')} busy={busy} execute={call} />)}</div>
        <div className={styles.inlineCreate}><div className={styles.grid2}><F label="Ville"><input className={styles.input} value={city} onChange={e => setCity(e.target.value)} /></F><F label="Adresse"><input className={styles.input} value={address} onChange={e => setAddress(e.target.value)} /></F></div><button className={styles.buttonSecondary} disabled={busy || !city || !address} onClick={() => void call(`/api/angelcare-marketplace/admin/customers/${txt(c, 'id')}/addresses`, 'POST', { city, addressLine: address, addressType: 'home', label: 'Domicile' }, 'Adresse ajoutée.')}><Home size={14} />Ajouter adresse</button></div>
      </section>
    </> : null}

    {section === 'commerce' ? <div className={styles.grid2}>
      <section className={styles.panel}><div className={styles.panelTitle}><h3><CalendarClock size={16} /> Bookings</h3><span className={styles.chip}>{data.bookings.length}</span></div><div className={styles.stackList}>{data.bookings.map((row, index) => <BookingEditor key={txt(row, 'id') || index} row={row} busy={busy} execute={call} />)}</div>
        <div className={styles.inlineCreate}><div className={styles.grid2}><F label="Titre"><input className={styles.input} value={bookingTitle} onChange={e => setBookingTitle(e.target.value)} /></F><F label="Début"><input className={styles.input} type="datetime-local" value={bookingStart} onChange={e => setBookingStart(e.target.value)} /></F></div><button className={styles.buttonSecondary} disabled={busy || !bookingStart} onClick={() => void call('/api/angelcare-marketplace/admin/bookings', 'POST', { customerId: txt(c, 'id'), title: bookingTitle, scheduledStartAt: new Date(bookingStart).toISOString(), journeyType: 'family_booking', notes: 'Créé depuis Customer 360' }, 'Booking créé.')}><CalendarPlus size={14} />Créer booking</button></div>
      </section>
      <section className={styles.panel}><div className={styles.panelTitle}><h3>Abonnements</h3><span className={styles.chip}>{data.subscriptions.length}</span></div><div className={styles.stackList}>{data.subscriptions.map((row, index) => <SubscriptionEditor key={txt(row, 'id') || index} row={row} customerId={txt(c, 'id')} busy={busy} execute={call} />)}</div>{!data.subscriptions.length ? <p className={styles.muted}>Aucun abonnement actif ou historique.</p> : null}</section>
      <section className={styles.panel}><div className={styles.panelTitle}><h3><BadgeDollarSign size={16} /> Paiement manuel</h3><span className={styles.chip}>Finance</span></div><div className={styles.grid2}><F label="Montant Dh"><input className={styles.input} type="number" min="0.01" step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} /></F><F label="Référence"><input className={styles.input} value={paymentRef} onChange={e => setPaymentRef(e.target.value)} /></F></div><button className={styles.button} disabled={busy || Number(paymentAmount) <= 0} onClick={() => void call('/api/angelcare-marketplace/admin/payments', 'POST', { action: 'manual_create', customerId: txt(c, 'id'), amount: Number(paymentAmount), method: 'manual_verified', providerReference: paymentRef, note: 'Créé depuis Customer 360 Operating Desktop' }, 'Paiement manuel enregistré.')}><BadgeDollarSign size={14} />Enregistrer paiement</button></section>
      <section className={styles.panel}><div className={styles.panelTitle}><h3><WalletCards size={16} /> AngelCare Credit</h3><span className={styles.chip}>{Number(data.walletAccount?.available_balance || data.walletAccount?.balance || 0).toLocaleString('fr-FR')} Dh</span></div><div className={styles.grid2}><F label="Montant (+ crédit / - débit)"><input className={styles.input} type="number" step="0.01" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} /></F><F label="Motif"><input className={styles.input} value={creditReason} onChange={e => setCreditReason(e.target.value)} /></F></div><button className={styles.buttonSecondary} disabled={busy || !data.walletAccount?.id || Number(creditAmount) === 0} onClick={() => void walletAdjust()}><WalletCards size={14} />Journaliser ajustement</button></section>
    </div> : null}

    {section === 'crm' ? <div className={styles.grid2}>
      <section className={styles.panel}><div className={styles.panelTitle}><h3>Opportunités</h3><span className={styles.chip}>{data.crmOpportunities.length}</span></div><div className={styles.stackList}>{data.crmOpportunities.map((row, index) => <OpportunityEditor key={txt(row, 'id') || index} row={row} busy={busy} execute={call} />)}</div>{!data.crmOpportunities.length ? <p className={styles.muted}>Aucune opportunité reliée.</p> : null}</section>
      <section className={styles.panel}><div className={styles.panelTitle}><h3>Devis</h3><span className={styles.chip}>{data.crmQuotes.length}</span></div><div className={styles.stackList}>{data.crmQuotes.map((row, index) => <QuoteEditor key={txt(row, 'id') || index} row={row} busy={busy} execute={call} />)}</div>{!data.crmQuotes.length ? <p className={styles.muted}>Aucun devis relié.</p> : null}</section>
      <section className={styles.panel}><div className={styles.panelTitle}><h3>Demandes & support</h3><span className={styles.chip}>{data.inquiries.length + data.supportTickets.length}</span></div><div className={styles.stackList}>{data.inquiries.slice(0, 30).map((row, index) => <InquiryEditor key={txt(row, 'id') || index} row={row} busy={busy} execute={call} />)}</div>{data.supportTickets.length?<div className={styles.compactList} style={{marginTop:10}}>{data.supportTickets.slice(0, 20).map((row, index) => <div className={styles.compactRow} key={txt(row, 'id') || `support-${index}`}><strong>{txt(row, 'public_reference') || `SUP-${index + 1}`}</strong><span>{txt(row, 'subject') || txt(row, 'title')}</span><span className={styles.chip}>{txt(row, 'status') || 'open'}</span></div>)}</div>:null}</section>
    </div> : null}

    {notice ? <div className={styles.notice}>{notice}</div> : null}
  </div>
}

function ExpandRow({ title, subtitle, status, children }: { title: string; subtitle?: string; status?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return <div className={styles.inlineRecord}><button className={styles.inlineRecordHeader} onClick={() => setOpen(v => !v)}><span><strong>{title || 'Sans nom'}</strong><small>{subtitle || '—'}</small></span><span className={styles.toolbar}>{status ? <span className={styles.chip}>{status}</span> : null}{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span></button>{open ? <div className={styles.inlineRecordBody}>{children}</div> : null}</div>
}

function GuardianEditor({ row, familyId, customerId, busy, execute }: { row: Row; familyId: string; customerId: string; busy: boolean; execute: (u: string, m: string, b: Row, ok: string) => Promise<void> }) {
  const [name, setName] = useState(txt(row, 'full_name') || txt(row, 'display_name') || txt(row, 'name'))
  const [relationship, setRelationship] = useState(txt(row, 'relationship') || txt(row, 'relationship_kind') || 'guardian')
  const [email, setEmail] = useState(txt(row, 'email')); const [phone, setPhone] = useState(txt(row, 'phone'))
  const [status, setStatus] = useState(txt(row, 'status') || 'active'); const [primary, setPrimary] = useState(bool(row.is_primary))
  return <ExpandRow title={name} subtitle={`${relationship} · ${email || phone || 'contact non renseigné'}`} status={status}><div className={styles.grid3}><F label="Nom"><input className={styles.input} value={name} onChange={e => setName(e.target.value)} /></F><F label="Relation"><input className={styles.input} value={relationship} onChange={e => setRelationship(e.target.value)} /></F><F label="Email"><input className={styles.input} value={email} onChange={e => setEmail(e.target.value)} /></F><F label="Téléphone"><input className={styles.input} value={phone} onChange={e => setPhone(e.target.value)} /></F><F label="Statut"><select className={styles.select} value={status} onChange={e => setStatus(e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option><option value="archived">Archived</option></select></F><F label="Principal"><label className={styles.checkRow}><input type="checkbox" checked={primary} onChange={e => setPrimary(e.target.checked)} /> Contact principal</label></F></div><button className={styles.button} disabled={busy || !familyId || !name} onClick={() => void execute(`/api/angelcare-marketplace/admin/families/${familyId}/guardians/${txt(row, 'id')}`, 'PATCH', { fullName: name, relationship, email, phone, isPrimary: primary, status, customerAccountId: customerId }, 'Responsable mis à jour.')}><PencilLine size={14} />Enregistrer</button></ExpandRow>
}

function ChildEditor({ row, customerId, busy, execute }: { row: Row; customerId: string; busy: boolean; execute: (u: string, m: string, b: Row, ok: string) => Promise<void> }) {
  const [firstName, setFirstName] = useState(txt(row, 'first_name') || txt(row, 'display_name') || txt(row, 'name'))
  const [birthDate, setBirthDate] = useState(txt(row, 'birth_date').slice(0, 10)); const [age, setAge] = useState(txt(row, 'age_group') || txt(row, 'age_band'))
  const [school, setSchool] = useState(txt(row, 'school_level')); const [status, setStatus] = useState(txt(row, 'status') || 'active')
  return <ExpandRow title={firstName} subtitle={[birthDate, age, school].filter(Boolean).join(' · ')} status={status}><div className={styles.grid3}><F label="Prénom"><input className={styles.input} value={firstName} onChange={e => setFirstName(e.target.value)} /></F><F label="Naissance"><input className={styles.input} type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} /></F><F label="Tranche d’âge"><input className={styles.input} value={age} onChange={e => setAge(e.target.value)} /></F><F label="Niveau scolaire"><input className={styles.input} value={school} onChange={e => setSchool(e.target.value)} /></F><F label="Statut"><select className={styles.select} value={status} onChange={e => setStatus(e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option><option value="archived">Archived</option></select></F></div><button className={styles.button} disabled={busy || !firstName} onClick={() => void execute(`/api/angelcare-marketplace/admin/customers/${customerId}/family/children/${txt(row, 'id')}`, 'PATCH', { first_name: firstName, birth_date: birthDate || null, age_group: age || null, school_level: school || null, status }, 'Enfant mis à jour.')}><Save size={14} />Enregistrer</button></ExpandRow>
}

function AddressEditor({ row, customerId, busy, execute }: { row: Row; customerId: string; busy: boolean; execute: (u: string, m: string, b: Row, ok: string) => Promise<void> }) {
  const [label, setLabel] = useState(txt(row, 'label') || 'Adresse'); const [city, setCity] = useState(txt(row, 'city'))
  const [line, setLine] = useState(txt(row, 'address_line') || txt(row, 'address_line1') || txt(row, 'address'))
  const [phone, setPhone] = useState(txt(row, 'phone')); const [instructions, setInstructions] = useState(txt(row, 'service_instructions'))
  const [isDefault, setDefault] = useState(bool(row.is_default))
  return <ExpandRow title={label} subtitle={`${line || 'Adresse non renseignée'} · ${city}`} status={isDefault ? 'default' : txt(row, 'status')}><div className={styles.grid3}><F label="Libellé"><input className={styles.input} value={label} onChange={e => setLabel(e.target.value)} /></F><F label="Ville"><input className={styles.input} value={city} onChange={e => setCity(e.target.value)} /></F><F label="Adresse"><input className={styles.input} value={line} onChange={e => setLine(e.target.value)} /></F><F label="Téléphone"><input className={styles.input} value={phone} onChange={e => setPhone(e.target.value)} /></F><F label="Instructions"><input className={styles.input} value={instructions} onChange={e => setInstructions(e.target.value)} /></F><F label="Par défaut"><label className={styles.checkRow}><input type="checkbox" checked={isDefault} onChange={e => setDefault(e.target.checked)} /> Adresse par défaut</label></F></div><button className={styles.button} disabled={busy || !city || !line} onClick={() => void execute(`/api/angelcare-marketplace/admin/customers/${customerId}/addresses/${txt(row, 'id')}`, 'PATCH', { addressType: txt(row, 'address_type') || 'home', label, recipientName: txt(row, 'recipient_name') || null, phone, city, addressLine: line, postalCode: txt(row, 'postal_code') || null, territoryId: txt(row, 'territory_id') || null, isDefault, serviceInstructions: instructions }, 'Adresse mise à jour.')}><Save size={14} />Enregistrer</button></ExpandRow>
}

function BookingEditor({ row, busy, execute }: { row: Row; busy: boolean; execute: (u: string, m: string, b: Row, ok: string) => Promise<void> }) {
  const [title, setTitle] = useState(txt(row, 'title') || 'Booking AngelCare'); const [status, setStatus] = useState(txt(row, 'status') || 'confirmed')
  const scheduling = (row.scheduling && typeof row.scheduling === 'object' && !Array.isArray(row.scheduling) ? row.scheduling : {}) as Row
  const [start, setStart] = useState(isoLocal(row.scheduled_start_at || scheduling.starts_at || scheduling.scheduled_at)); const [end, setEnd] = useState(isoLocal(row.scheduled_end_at || scheduling.ends_at))
  const [next, setNext] = useState(txt(row, 'next_action_label'))
  return <ExpandRow title={txt(row, 'public_reference') || title} subtitle={`${title} · ${start || 'non planifié'}`} status={status}><div className={styles.grid3}><F label="Titre"><input className={styles.input} value={title} onChange={e => setTitle(e.target.value)} /></F><F label="Statut"><select className={styles.select} value={status} onChange={e => setStatus(e.target.value)}><option value="confirmed">Confirmed</option><option value="scheduled">Scheduled</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></F><F label="Début"><input className={styles.input} type="datetime-local" value={start} onChange={e => setStart(e.target.value)} /></F><F label="Fin"><input className={styles.input} type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} /></F><F label="Prochaine action"><input className={styles.input} value={next} onChange={e => setNext(e.target.value)} /></F></div><button className={styles.button} disabled={busy} onClick={() => void execute(`/api/angelcare-marketplace/admin/bookings/${txt(row, 'id')}`, 'PATCH', { title, status, scheduledStartAt: start ? new Date(start).toISOString() : null, scheduledEndAt: end ? new Date(end).toISOString() : null, nextActionLabel: next || null }, 'Booking mis à jour.')}><CalendarClock size={14} />Enregistrer booking</button></ExpandRow>
}

function SubscriptionEditor({ row, customerId, busy, execute }: { row: Row; customerId: string; busy: boolean; execute: (u: string, m: string, b: Row, ok: string) => Promise<void> }) {
  const [status, setStatus] = useState(txt(row, 'status') || 'active'); const [billing, setBilling] = useState(txt(row, 'billing_period') || 'monthly')
  const [quantity, setQuantity] = useState(txt(row, 'quantity') || '1'); const [amount, setAmount] = useState(txt(row, 'amount') || '0'); const [renewal, setRenewal] = useState(txt(row, 'renewal_mode') || 'automatic')
  return <ExpandRow title={txt(row, 'public_reference') || txt(row, 'name') || 'Abonnement'} subtitle={`${billing} · ${Number(amount || 0).toLocaleString('fr-FR')} ${txt(row, 'currency_label') || 'Dh'}`} status={status}><div className={styles.grid3}><F label="Statut"><select className={styles.select} value={status} onChange={e => setStatus(e.target.value)}><option value="active">Active</option><option value="paused">Paused</option><option value="cancelled">Cancelled</option><option value="expired">Expired</option></select></F><F label="Période"><input className={styles.input} value={billing} onChange={e => setBilling(e.target.value)} /></F><F label="Quantité"><input className={styles.input} type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} /></F><F label="Montant"><input className={styles.input} type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} /></F><F label="Renouvellement"><select className={styles.select} value={renewal} onChange={e => setRenewal(e.target.value)}><option value="automatic">Automatic</option><option value="manual">Manual</option><option value="non_renewing">Non-renewing</option></select></F></div><button className={styles.button} disabled={busy} onClick={() => void execute(`/api/angelcare-marketplace/admin/subscriptions/${txt(row, 'id')}`, 'PATCH', { customerId, status, billingPeriod: billing, quantity: Number(quantity), amount: Number(amount), currencyLabel: txt(row, 'currency_label') || 'Dh', renewalMode: renewal, startsAt: txt(row, 'starts_at') || null, currentPeriodStartsAt: txt(row, 'current_period_starts_at') || null, currentPeriodEndsAt: txt(row, 'current_period_ends_at') || null, nextBillingAt: txt(row, 'next_billing_at') || null, cancelReason: status === 'cancelled' ? 'Mise à jour depuis Customer 360' : null, metadata: row.metadata || {} }, 'Abonnement mis à jour.')}><RefreshCcw size={14} />Enregistrer abonnement</button></ExpandRow>
}

function InquiryEditor({ row, busy, execute }: { row: Row; busy: boolean; execute: (u: string, m: string, b: Row, ok: string) => Promise<void> }) {
  const [status, setStatus] = useState(txt(row, 'status') || 'new'); const [notes, setNotes] = useState(txt(row, 'admin_notes'))
  return <ExpandRow title={txt(row, 'public_reference') || txt(row, 'contact_name') || 'Inquiry'} subtitle={txt(row, 'subject') || txt(row, 'message')} status={status}><div className={styles.grid2}><F label="Statut"><select className={styles.select} value={status} onChange={e => setStatus(e.target.value)}><option value="new">New</option><option value="triaged">Triaged</option><option value="in_progress">In progress</option><option value="qualified">Qualified</option><option value="closed">Closed</option><option value="spam">Spam</option></select></F><F label="Note commerciale"><input className={styles.input} value={notes} onChange={e => setNotes(e.target.value)} /></F></div><div className={styles.rowActions}><button className={styles.button} disabled={busy} onClick={() => void execute(`/api/angelcare-marketplace/admin/public-inquiries/${txt(row, 'id')}`, 'PATCH', { status, admin_notes: notes, event_type: 'customer_360_updated', event_title: 'Inquiry opérée depuis Customer 360' }, 'Inquiry mise à jour.')}><Save size={14}/>Enregistrer inquiry</button>{!txt(row, 'linked_customer_account_id')?<button className={styles.buttonSecondary} disabled={busy} onClick={() => void execute(`/api/angelcare-marketplace/admin/public-inquiries/${txt(row, 'id')}`, 'PATCH', { action: 'create_customer', event_type: 'customer_linked' }, 'Inquiry reliée au client.')}>Lier / créer client</button>:null}</div></ExpandRow>
}

function OpportunityEditor({ row, busy, execute }: { row: Row; busy: boolean; execute: (u: string, m: string, b: Row, ok: string) => Promise<void> }) {
  const [target, setTarget] = useState(txt(row, 'stage') || 'qualified'); const [reason, setReason] = useState('Mise à jour Customer 360')
  return <ExpandRow title={txt(row, 'name') || txt(row, 'public_reference')} subtitle={txt(row, 'next_action')} status={txt(row, 'stage')}><div className={styles.grid2}><F label="Nouvelle étape"><input className={styles.input} value={target} onChange={e => setTarget(e.target.value)} /></F><F label="Motif"><input className={styles.input} value={reason} onChange={e => setReason(e.target.value)} /></F></div><button className={styles.button} disabled={busy || !target} onClick={() => void execute(`/api/angelcare-marketplace/crm/opportunities/${txt(row, 'id')}/transition`, 'POST', { target, reason }, 'Opportunité mise à jour.')}><Save size={14} />Transition</button></ExpandRow>
}

function QuoteEditor({ row, busy, execute }: { row: Row; busy: boolean; execute: (u: string, m: string, b: Row, ok: string) => Promise<void> }) {
  const [target, setTarget] = useState(txt(row, 'quote_status') || 'submitted'); const [decision, setDecision] = useState(txt(row, 'approval_status') || 'pending'); const [reason, setReason] = useState('Mise à jour Customer 360')
  return <ExpandRow title={txt(row, 'public_reference') || 'Devis'} subtitle={`${Number(row.grand_total || 0).toLocaleString('fr-FR')} ${txt(row, 'currency_label') || 'Dh'}`} status={txt(row, 'quote_status')}><div className={styles.grid3}><F label="Statut"><input className={styles.input} value={target} onChange={e => setTarget(e.target.value)} /></F><F label="Approbation"><select className={styles.select} value={decision} onChange={e => setDecision(e.target.value)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></F><F label="Motif"><input className={styles.input} value={reason} onChange={e => setReason(e.target.value)} /></F></div><div className={styles.rowActions}><button className={styles.button} disabled={busy || !target} onClick={() => void execute(`/api/angelcare-marketplace/crm/quotes/${txt(row, 'id')}/transition`, 'POST', { target, reason }, 'Statut devis mis à jour.')}>Transition devis</button><button className={styles.buttonSecondary} disabled={busy} onClick={() => void execute(`/api/angelcare-marketplace/crm/quotes/${txt(row, 'id')}/approval`, 'POST', { decision, reason }, 'Décision devis enregistrée.')}>Décider approbation</button></div></ExpandRow>
}

function F({ label, children }: { label: string; children: React.ReactNode }) { return <div className={styles.field}><label>{label}</label>{children}</div> }
