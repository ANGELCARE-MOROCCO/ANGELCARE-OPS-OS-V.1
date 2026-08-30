'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CircleDollarSign,
  FileCheck2,
  Fingerprint,
  History,
  MapPin,
  RefreshCcw,
  ShieldCheck,
  X,
} from 'lucide-react'
import type { ConversionEvidenceRecord, ConversionSession, ConversionStatus } from '../types'
import styles from '../conversion.module.css'

type Envelope<T> = { data: T }
type DossierTab = 'overview' | 'configuration' | 'price' | 'availability' | 'consents' | 'evidence'

const recoveryTargets: Array<{ value: ConversionStatus; label: string; purpose: string }> = [
  { value: 'configuring', label: 'Reprendre la configuration', purpose: 'Rouvre le choix et la configuration de l’offre.' },
  { value: 'identity_pending', label: 'Reprendre l’identité', purpose: 'Replace la session au contrôle d’identité.' },
  { value: 'availability_pending', label: 'Revérifier la disponibilité', purpose: 'Replace la session avant la décision de disponibilité.' },
  { value: 'consent_pending', label: 'Reprendre les consentements', purpose: 'Replace la session avant la collecte des consentements.' },
  { value: 'review', label: 'Renvoyer en revue', purpose: 'Rouvre la revue finale avant confirmation.' },
  { value: 'ready', label: 'Rétablir comme prête', purpose: 'À utiliser uniquement lorsque les preuves requises sont déjà valides.' },
]

function displayJson(value: Record<string, unknown>) {
  const entries = Object.entries(value)
  if (!entries.length) return <div className={styles.dossierEmpty}>Aucune donnée persistée pour cette section.</div>
  return <dl className={styles.dossierObjectGrid}>{entries.map(([key, item]) => <div key={key}><dt>{key.replaceAll('_', ' ')}</dt><dd>{typeof item === 'object' && item !== null ? JSON.stringify(item, null, 2) : String(item ?? '—')}</dd></div>)}</dl>
}

function outcomeHref(session: ConversionSession): string | null {
  const outcome = session.outcome
  if (!outcome?.canonical_object_id) return null
  if (outcome.canonical_object_type === 'academy_enrollment') return '/angelcare-marketplace/admin/academy/enrollments'
  if (outcome.canonical_object_type === 'partner_subscription') return '/angelcare-marketplace/admin/subscriptions'
  if (outcome.canonical_object_type === 'family_quote_request') return '/angelcare-marketplace/admin/bookings'
  if (outcome.canonical_object_type === 'crm_lead') return '/angelcare-marketplace/admin/customers'
  return null
}

export function ConversionSessionDossier({
  initialSession,
  evidence,
  canRecover,
}: {
  initialSession: ConversionSession
  evidence: ConversionEvidenceRecord[]
  canRecover: boolean
}) {
  const [session, setSession] = useState(initialSession)
  const [tab, setTab] = useState<DossierTab>('overview')
  const [recoveryOpen, setRecoveryOpen] = useState(false)
  const [target, setTarget] = useState<ConversionStatus>('review')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const sessionEvidence = useMemo(() => evidence.filter((record) => record.sessionId === session.id), [evidence, session.id])
  const acceptedConsents = session.consents?.filter((consent) => consent.accepted).length || 0
  const publicOutcomeHref = outcomeHref(session)

  useEffect(() => {
    if (!recoveryOpen) return
    closeButtonRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) setRecoveryOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [busy, recoveryOpen])

  async function recover() {
    if (!canRecover || !reason.trim()) return
    setBusy(true)
    setError(null)
    try {
      const response = await fetch(`/api/angelcare-marketplace/conversion/admin/sessions/${session.id}/recover`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ target, reason: reason.trim() }),
      })
      const payload = await response.json() as Envelope<ConversionSession> | { error?: { message?: string } }
      if (!response.ok || !('data' in payload)) throw new Error('error' in payload ? payload.error?.message || 'Récupération impossible.' : 'Récupération impossible.')
      setSession(payload.data)
      setMessage(`Session restaurée au statut ${payload.data.status}.`)
      setReason('')
      setRecoveryOpen(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Récupération impossible.')
    } finally {
      setBusy(false)
    }
  }

  const tabs: Array<{ key: DossierTab; label: string; count?: number }> = [
    { key: 'overview', label: 'Vue d’ensemble' },
    { key: 'configuration', label: 'Identité & configuration' },
    { key: 'price', label: 'Prix' },
    { key: 'availability', label: 'Disponibilité' },
    { key: 'consents', label: 'Consentements', count: session.consents?.length || 0 },
    { key: 'evidence', label: 'Preuves & exceptions', count: sessionEvidence.length },
  ]

  return <main className={styles.dossierRoot}>
    <header className={styles.dossierHeader}>
      <div>
        <Link href="/angelcare-marketplace/admin/conversion/sessions"><ArrowLeft size={15} /> Sessions</Link>
        <span>CONVERSION SESSION 360</span>
        <h1>{session.public_reference}</h1>
        <p>{session.item?.name || session.catalog_item_id} · {session.journey.replaceAll('_', ' ')}</p>
      </div>
      <div className={styles.dossierHeaderActions}>
        <span className={styles.dossierStatus} data-status={session.status}>{session.status.replaceAll('_', ' ')}</span>
        <button type="button" onClick={() => setRecoveryOpen(true)} disabled={!canRecover} title={!canRecover ? 'Permission marketplace.conversion.recover requise' : undefined}><RefreshCcw size={16} /> Récupérer</button>
      </div>
    </header>

    {message ? <div className={styles.dossierNotice} role="status"><BadgeCheck size={17} />{message}</div> : null}
    {session.failure_message ? <div className={styles.dossierFailure} role="alert"><AlertTriangle size={18} /><div><strong>{session.failure_code || 'Échec de conversion'}</strong><span>{session.failure_message}</span></div></div> : null}

    <section className={styles.dossierSignals} aria-label="Signaux de session">
      <article><Fingerprint /><span>Session</span><strong>{session.session_key.slice(0, 12)}</strong><small>Clé technique traçable</small></article>
      <article><CircleDollarSign /><span>Prix</span><strong>{session.priceSnapshot?.status || 'non revérifié'}</strong><small>{session.priceSnapshot?.grand_total == null ? 'Montant non fixé' : `${session.priceSnapshot.grand_total.toLocaleString('fr-FR')} ${session.priceSnapshot.currency_label}`}</small></article>
      <article><MapPin /><span>Disponibilité</span><strong>{String(session.availability_result.status || 'non revérifiée')}</strong><small>{session.territory_id || 'Portée globale'}</small></article>
      <article><ShieldCheck /><span>Consentements</span><strong>{acceptedConsents}/{session.consents?.length || 0}</strong><small>Versions enregistrées</small></article>
      <article><CalendarClock /><span>Expiration</span><strong>{new Date(session.expires_at).toLocaleDateString('fr-FR')}</strong><small>{new Date(session.expires_at).toLocaleTimeString('fr-FR')}</small></article>
      <article><FileCheck2 /><span>Résultat</span><strong>{session.outcome?.status || 'absent'}</strong><small>{session.outcome?.public_reference || 'Aucun objet canonique'}</small></article>
    </section>

    <div className={styles.dossierLayout}>
      <nav className={styles.dossierTabs} aria-label="Sections du dossier">
        {tabs.map((item) => <button key={item.key} type="button" data-active={tab === item.key} onClick={() => setTab(item.key)}><span>{item.label}</span>{item.count !== undefined ? <b>{item.count}</b> : null}</button>)}
      </nav>

      <section className={styles.dossierMain}>
        {tab === 'overview' ? <>
          <header><div><span>READINESS & HANDOVER</span><h2>État opérationnel de la conversion</h2></div><span className={styles.dossierStatus} data-status={session.status}>{session.status}</span></header>
          <div className={styles.dossierReadiness}>
            <Readiness label="Offre publiée" value={Boolean(session.item)} detail={session.item?.public_reference || session.catalog_item_id} />
            <Readiness label="Prix revérifié" value={Boolean(session.priceSnapshot && ['valid', 'quote_required'].includes(session.priceSnapshot.status))} detail={session.priceSnapshot?.status || 'Aucun snapshot'} />
            <Readiness label="Disponibilité décidée" value={Boolean(session.availability_result.status)} detail={String(session.availability_result.status || 'Décision absente')} />
            <Readiness label="Consentements" value={acceptedConsents > 0} detail={`${acceptedConsents} acceptés`} />
            <Readiness label="Résultat canonique" value={Boolean(session.outcome)} detail={session.outcome?.public_reference || 'Pas encore créé'} />
          </div>
          <section className={styles.dossierOutcome} data-present={Boolean(session.outcome)}><div><span>OUTCOME CANONIQUE</span><h3>{session.outcome?.public_reference || 'Aucun handover confirmé'}</h3><p>{session.outcome ? `${session.outcome.outcome_type} · ${session.outcome.canonical_object_type} · ${session.outcome.status}` : 'L’interface ne présente jamais une conversion comme terminée sans résultat persistant.'}</p></div>{publicOutcomeHref ? <Link href={publicOutcomeHref}>Ouvrir l’autorité liée <ArrowRight size={15} /></Link> : null}</section>
          <div className={styles.dossierTimeline}><h3>Chronologie persistée</h3><div><History size={17}/><span>Dernière activité</span><strong>{new Date(session.last_activity_at).toLocaleString('fr-FR')}</strong></div><div><ArrowRight size={17}/><span>Soumission</span><strong>{session.submitted_at ? new Date(session.submitted_at).toLocaleString('fr-FR') : 'Non soumise'}</strong></div><div><BadgeCheck size={17}/><span>Confirmation</span><strong>{session.confirmed_at ? new Date(session.confirmed_at).toLocaleString('fr-FR') : 'Non confirmée'}</strong></div></div>
        </> : null}

        {tab === 'configuration' ? <><header><div><span>SESSION CONTEXT</span><h2>Identité & configuration</h2></div></header><h3>Contexte d’identité</h3>{displayJson(session.identity_context)}<h3>Configuration de parcours</h3>{displayJson(session.configuration)}<h3>Éligibilité</h3>{displayJson(session.eligibility_result)}</> : null}
        {tab === 'price' ? <><header><div><span>PRICE SNAPSHOT</span><h2>Autorité tarifaire figée</h2></div></header>{session.priceSnapshot ? <dl className={styles.dossierObjectGrid}><Fact label="Source" value={session.priceSnapshot.pricing_source}/><Fact label="Statut" value={session.priceSnapshot.status}/><Fact label="Modèle" value={session.priceSnapshot.pricing_model}/><Fact label="Quantité" value={session.priceSnapshot.quantity}/><Fact label="Unitaire" value={session.priceSnapshot.unit_price == null ? 'Sur devis' : `${session.priceSnapshot.unit_price} ${session.priceSnapshot.currency_label}`}/><Fact label="Sous-total" value={session.priceSnapshot.subtotal == null ? '—' : session.priceSnapshot.subtotal}/><Fact label="Remise" value={session.priceSnapshot.discount_total}/><Fact label="Taxe" value={session.priceSnapshot.tax_total}/><Fact label="Total" value={session.priceSnapshot.grand_total == null ? 'Sur devis' : `${session.priceSnapshot.grand_total} ${session.priceSnapshot.currency_label}`}/><Fact label="Valide jusqu’au" value={new Date(session.priceSnapshot.valid_until).toLocaleString('fr-FR')}/><Fact label="Empreinte source" value={session.priceSnapshot.source_hash}/></dl> : <div className={styles.dossierEmpty}>Aucun snapshot de prix réel n’a encore été enregistré.</div>}</> : null}
        {tab === 'availability' ? <><header><div><span>AVAILABILITY DECISION</span><h2>Disponibilité & territoire</h2></div></header>{displayJson(session.availability_result)}</> : null}
        {tab === 'consents' ? <><header><div><span>CONSENT PROOF</span><h2>Versions & acceptation</h2></div></header><div className={styles.dossierEvidenceList}>{session.consents?.map((consent) => <article key={consent.id} data-status={consent.accepted ? 'accepted' : 'declined'}><FileCheck2/><div><strong>{consent.consent_key} · v{consent.consent_version}</strong><span>{consent.locale.toUpperCase()} · {consent.accepted ? 'Accepté' : 'Refusé'}</span><small>Empreinte {consent.text_hash} · {consent.accepted_at ? new Date(consent.accepted_at).toLocaleString('fr-FR') : 'sans horodatage d’acceptation'}</small></div></article>)}</div>{!session.consents?.length ? <div className={styles.dossierEmpty}>Aucun consentement enregistré.</div> : null}</> : null}
        {tab === 'evidence' ? <><header><div><span>EVIDENCE & EXCEPTIONS</span><h2>Preuves rattachées à la session</h2></div><strong>{sessionEvidence.length}</strong></header><div className={styles.dossierEvidenceList}>{sessionEvidence.map((record) => <article key={`${record.recordType}-${record.id}`} data-status={record.status}><EvidenceIcon kind={record.recordType}/><div><strong>{record.title}</strong><span>{record.recordType} · {record.status}{record.severity ? ` · ${record.severity}` : ''}</span><small>{record.detail}</small>{record.expiresAt ? <time>Expire le {new Date(record.expiresAt).toLocaleString('fr-FR')}</time> : <time>{new Date(record.createdAt).toLocaleString('fr-FR')}</time>}</div></article>)}</div>{!sessionEvidence.length ? <div className={styles.dossierEmpty}>Aucune preuve hold, consentement ou exception supplémentaire.</div> : null}</> : null}
      </section>

      <aside className={styles.dossierRail}>
        <section><span>NEXT ACTION</span><h2>{session.failure_message ? 'Traiter l’exception' : session.outcome ? 'Suivre le handover' : 'Poursuivre la conversion'}</h2><p>{session.failure_message || (session.outcome ? `Résultat ${session.outcome.public_reference} enregistré.` : 'La session reste ouverte tant qu’un outcome canonique n’existe pas.')}</p><button type="button" disabled={!canRecover} onClick={() => setRecoveryOpen(true)}><RefreshCcw size={16}/> Ouvrir la récupération</button></section>
        <section><span>RELATIONS</span><h3>Continuité opérateur</h3><Link href="/angelcare-marketplace/admin/orders">Commandes <ArrowRight size={14}/></Link><Link href="/angelcare-marketplace/admin/bookings">Réservations <ArrowRight size={14}/></Link><Link href="/angelcare-marketplace/admin/commercial/quotes">Devis <ArrowRight size={14}/></Link><Link href="/angelcare-marketplace/admin/payments">Paiements <ArrowRight size={14}/></Link></section>
        <section><span>TRACE</span><dl><div><dt>Locale</dt><dd>{session.locale}</dd></div><div><dt>Tenant</dt><dd>{session.tenant_id || '—'}</dd></div><div><dt>Famille</dt><dd>{session.family_account_id || '—'}</dd></div><div><dt>CRM</dt><dd>{session.crm_account_id || '—'}</dd></div><div><dt>Panier devis</dt><dd>{session.quote_basket_id || '—'}</dd></div></dl></section>
      </aside>
    </div>

    {recoveryOpen ? <div className={styles.recoveryBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setRecoveryOpen(false) }}><section className={styles.recoveryModal} role="dialog" aria-modal="true" aria-labelledby="recovery-title">
      <header><div><span>GOVERNED RECOVERY</span><h2 id="recovery-title">Récupérer {session.public_reference}</h2></div><button ref={closeButtonRef} type="button" aria-label="Fermer" onClick={() => setRecoveryOpen(false)}><X size={18}/></button></header>
      <div className={styles.recoveryImpact}><div><span>État actuel</span><strong>{session.status}</strong></div><ArrowRight/><div><span>État proposé</span><strong>{target}</strong></div></div>
      <p>Cette action efface les informations d’échec, écrit un audit et un événement de récupération. Elle ne crée ni paiement, ni outcome, ni preuve manquante.</p>
      <label><span>Point de reprise</span><select value={target} onChange={(event) => setTarget(event.target.value as ConversionStatus)}>{recoveryTargets.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><small>{recoveryTargets.find((item) => item.value === target)?.purpose}</small></label>
      <label><span>Motif obligatoire</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Cause analysée, preuve vérifiée et prochaine action…"/></label>
      {error ? <div className={styles.dossierFailure} role="alert"><AlertTriangle size={17}/><span>{error}</span></div> : null}
      <footer><button type="button" onClick={() => setRecoveryOpen(false)} disabled={busy}>Annuler</button><button type="button" onClick={() => void recover()} disabled={busy || !reason.trim() || !canRecover}>{busy ? 'Récupération…' : 'Confirmer la récupération'}</button></footer>
    </section></div> : null}
  </main>
}

function Readiness({ label, value, detail }: { label: string; value: boolean; detail: string }) {
  return <article data-ready={value}><span>{value ? <BadgeCheck size={17}/> : <AlertTriangle size={17}/>} {label}</span><strong>{value ? 'Prêt' : 'À vérifier'}</strong><small>{detail}</small></article>
}

function Fact({ label, value }: { label: string; value: string | number }) {
  return <div><dt>{label}</dt><dd>{String(value)}</dd></div>
}

function EvidenceIcon({ kind }: { kind: ConversionEvidenceRecord['recordType'] }) {
  if (kind === 'exception') return <AlertTriangle/>
  if (kind === 'hold') return <CalendarClock/>
  return <FileCheck2/>
}
