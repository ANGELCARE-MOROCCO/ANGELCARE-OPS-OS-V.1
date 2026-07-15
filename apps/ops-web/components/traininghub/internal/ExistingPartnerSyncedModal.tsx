'use client'

import { getTrainingHubBrowserClient } from '@/lib/traininghub/browser-client'
import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'

type AnyRow = Record<string, any>

type ModalProps = {
  partner?: AnyRow
  selectedPartner?: AnyRow
  dossier?: AnyRow
  onClose: () => void
  onUpdated?: (payload?: unknown) => void | Promise<void>
  onChanged?: (payload?: unknown) => void | Promise<void>
  onSaved?: (payload?: unknown) => void | Promise<void>
  onDeleted?: (payload?: unknown) => void | Promise<void>
}

const steps = [
  ['overview', 'Vue dossier', '✦'],
  ['identity', 'Identité', '◉'],
  ['access', 'Accès & password', '🔐'],
  ['billing', 'Billing & règles', '▥'],
  ['offer', 'Offres & services', '◆'],
  ['delivery', 'Delivery', '▣'],
  ['proofs', 'Preuves & SLA', '◇'],
  ['review', 'Validation', '✓'],
]

const offerCatalog = [
  { id: 'activation', title: 'Activation TrainingHub', family: 'Activation', pricingModel: 'setup_plus_credits', setup: 7200, mrr: 0, annual: 0, credits: 10, participants: 10, sla: 'standard_48h', proofPack: 'starter_kit', status: 'draft', classification: 'first_offer', next: 'Valider périmètre, créer proposition, ouvrir accès portail et planifier onboarding.' },
  { id: 'growth', title: 'Growth annuel', family: 'Abonnement', pricingModel: 'annual_subscription_plus_credits', setup: 0, mrr: 1500, annual: 18500, credits: 24, participants: 24, sla: 'priority_24h', proofPack: 'quarterly_report_pack', status: 'draft', classification: 'subscription_growth', next: 'Créer abonnement annuel, wallet crédits et refresh trimestriel.' },
  { id: 'premium', title: 'Premium multi-site', family: 'Premium', pricingModel: 'premium_account_subscription', setup: 0, mrr: 3500, annual: 42000, credits: 60, participants: 60, sla: 'priority_24h', proofPack: 'premium_proof_pack', status: 'draft', classification: 'premium_multisite', next: 'Qualifier multi-site, SLA renforcé, reporting et preuves premium.' },
  { id: 'enterprise', title: 'Enterprise réseau', family: 'Enterprise', pricingModel: 'custom_enterprise_account', setup: 15000, mrr: 7900, annual: 95000, credits: 120, participants: 120, sla: 'enterprise_8h', proofPack: 'executive_report_pack', status: 'draft', classification: 'network_enterprise', next: 'Préparer architecture réseau, gouvernance et revue exécutive.' },
]

const billingRulesSeed = [
  { id: 'deposit', name: 'Activation facturée avant démarrage', status: 'active', trigger: 'offer_accepted', execution: 'create_deposit_invoice', basis: 'setup', owner: 'finance', risk: 'low', impact: 'Sécurise le cash avant onboarding.' },
  { id: 'subscription', name: 'Abonnement partenaire récurrent', status: 'active', trigger: 'subscription_active', execution: 'monthly_or_annual_invoice', basis: 'mrr_or_annual', owner: 'finance', risk: 'medium', impact: 'Rend le modèle prévisible et renouvelable.' },
  { id: 'wallet', name: 'Crédits formation consommables', status: 'active', trigger: 'session_confirmed', execution: 'decrement_credit_wallet', basis: 'credits', owner: 'operations', risk: 'medium', impact: 'Empêche livraison non couverte.' },
  { id: 'renewal', name: 'Renouvellement avant échéance', status: 'active', trigger: '30_days_before_end', execution: 'prepare_renewal_offer', basis: 'plan_value', owner: 'account_owner', risk: 'high', impact: 'Protège le revenu et prépare l’upsell.' },
]

const deliverySeed = [
  { id: 'onboarding', title: 'Onboarding partenaire', status: 'ready', mode: 'hybrid', location: 'Site partenaire', checklist: 'partner_onboarding_delivery', capacity: 8, cadence: 'first_30_days', owner: 'training_coordinator', startsAt: '', next: 'Valider accès, participants et kit de démarrage.' },
  { id: 'training', title: 'Session formation équipe', status: 'planned', mode: 'onsite', location: 'Site partenaire', checklist: 'onsite_training_delivery', capacity: 12, cadence: 'per_cohort', owner: 'trainer', startsAt: '', next: 'Assigner formateur, présence et supports.' },
  { id: 'refresh', title: 'Refresh e-learning', status: 'draft', mode: 'online', location: 'Portail partenaire', checklist: 'online_refresh_delivery', capacity: 20, cadence: 'quarterly', owner: 'academy_ops', startsAt: '', next: 'Ouvrir refresh et suivre complétion.' },
  { id: 'governance', title: 'Revue gouvernance partenaire', status: 'draft', mode: 'hybrid', location: 'Direction partenaire', checklist: 'enterprise_governance_delivery', capacity: 6, cadence: 'monthly_or_quarterly', owner: 'account_owner', startsAt: '', next: 'Préparer rapport, risques, renouvellement et preuves.' },
]

const proofSeed = [
  { id: 'presence', title: 'Preuve présence & assiduité', status: 'required', sla: 'same_day_after_session', evidence: 'presence_sheet', owner: 'trainer', visibility: 'partner_portal', impact: 'Débloque certificat et crédibilise la formation livrée.', next: 'Valider les présences après session.' },
  { id: 'certificate', title: 'Certificats & attestations', status: 'required', sla: '48h_after_presence_validation', evidence: 'certificate_pdf', owner: 'academy_ops', visibility: 'partner_portal', impact: 'Matérialise la valeur remise à l’équipe du partenaire.', next: 'Émettre certificats après validation présence.' },
  { id: 'report', title: 'Rapport progression partenaire', status: 'recommended', sla: 'monthly_or_quarterly', evidence: 'progress_report', owner: 'account_owner', visibility: 'partner_and_internal', impact: 'Justifie renouvellement, upsell et maintien de confiance.', next: 'Préparer rapport avant renouvellement.' },
  { id: 'sla', title: 'SLA demandes & corrections', status: 'required', sla: '24h_to_48h', evidence: 'request_resolution_log', owner: 'support_ops', visibility: 'internal_and_partner_summary', impact: 'Contrôle qualité, support et risque relationnel.', next: 'Suivre demandes ouvertes et retards.' },
]

function str(source: AnyRow | undefined, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = key.split('.').reduce((acc, part) => acc?.[part], source)
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value)
  }
  return fallback
}

function money(value: unknown) {
  const n = Number(value || 0)
  if (!Number.isFinite(n)) return '0 MAD'
  if (n >= 1000) return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 1 }).format(n / 1000)} K MAD`
  return `${new Intl.NumberFormat('fr-MA').format(n)} MAD`
}

function newPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const specials = '!@#%*-_'
  let out = 'AC-'
  out += chars[Math.floor(Math.random() * chars.length)]
  out += specials[Math.floor(Math.random() * specials.length)]
  while (out.length < 14) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

function cloneOffer(template: AnyRow, index: number) {
  return {
    ...template,
    id: `${template.id}_${Date.now()}_${index}`,
    code: `TH-${template.id.toUpperCase()}-${String(index + 1).padStart(2, '0')}`,
    modules: template.modules || ['formations', 'team', 'certificates', 'documents'],
  }
}

function initialForm(input: AnyRow) {
  const raw = input?.raw || input
  const metadata = raw?.metadata || {}
  const accessInfo = input?.accessInfo || {}
  const depth = input?.commercialDepth || metadata?.commercialDepth || {}
  return {
    id: input?.id || raw?.id || '',
    name: str(input, ['name'], str(raw, ['name', 'display_name', 'legal_name'], 'Partenaire')),
    legalName: str(input, ['legalName'], str(raw, ['legal_name', 'display_name', 'name'], '')),
    city: str(input, ['city'], str(raw, ['city', 'metadata.city'], 'Rabat')),
    address: str(raw, ['address', 'metadata.address'], ''),
    website: str(raw, ['website', 'metadata.website'], ''),
    segment: str(input, ['segment'], str(raw, ['segment', 'organization_type', 'partner_type'], 'partner_school')),
    partnerType: str(input, ['partnerType'], str(raw, ['partner_type', 'organization_type'], 'school_partner')),
    owner: str(input, ['owner'], str(raw, ['owner_name', 'account_owner', 'metadata.commercial.owner'], 'Non assigné')),
    plan: str(input, ['plan'], str(raw, ['plan_name', 'metadata.commercial.plan'], 'Aucun plan')),
    status: str(input, ['status', 'stage'], str(raw, ['status', 'stage'], 'active')),
    stage: str(input, ['stage'], str(raw, ['stage', 'status'], 'active')),
    health: str(input, ['health'], str(raw, ['health_score', 'metadata.governance.health'], '62')),
    risk: str(input, ['risk'], str(raw, ['risk_level', 'metadata.governance.riskLevel'], 'À surveiller')),
    contactFullName: str(metadata, ['contact.fullName'], ''),
    contactEmail: str(accessInfo, ['loginEmail'], str(metadata, ['contact.email'], str(raw, ['email'], ''))),
    contactPhone: str(metadata, ['contact.phone'], str(raw, ['phone'], '')),
    contactFunction: str(metadata, ['contact.function'], 'Direction partenaire'),
    authUserId: str(accessInfo, ['authUserId'], str(metadata, ['access.authUserId'], '')),
    profileId: str(accessInfo, ['profileId'], ''),
    passwordLastResetAt: str(accessInfo, ['passwordLastResetAt'], str(metadata, ['access.passwordLastResetAt'], '')),
    passwordStatus: str(metadata, ['access.passwordStatus'], str(accessInfo, ['accessStatus'], 'not_configured')),
    accessRole: str(metadata, ['access.role'], 'partner_admin'),
    accessLevel: str(metadata, ['access.accessLevel'], 'standard_partner_access'),
    portalPolicy: str(metadata, ['access.portalPolicy'], 'restricted_partner_scope'),
    enabledModules: Array.isArray(metadata?.access?.enabledModules) ? metadata.access.enabledModules : ['formations', 'refresh', 'preuves', 'demandes'],
    billingModel: str(metadata, ['billing.billingModel'], 'account_subscription'),
    accountType: str(metadata, ['billing.accountType'], 'partner_training_account'),
    paymentTerms: str(metadata, ['billing.paymentTerms'], 'due_15'),
    invoicePolicy: str(metadata, ['billing.invoicePolicy'], 'manual_review_before_issue'),
    renewalPolicy: str(metadata, ['billing.renewalPolicy'], 'manual_review_30_days_before_end'),
    currency: str(metadata, ['billing.currency'], 'MAD'),
    monthlyAmount: str(metadata, ['commercial.monthlyAmount'], '0'),
    mode: str(metadata, ['delivery.mode'], 'onsite'),
    location: str(metadata, ['delivery.location'], 'Site partenaire'),
    checklistTemplate: str(metadata, ['delivery.checklistTemplate'], 'standard_training_delivery'),
    proofVisibility: str(metadata, ['proofs.proofVisibility'], 'partner_portal'),
    slaPolicy: str(metadata, ['governance.slaPolicy'], 'standard_48h'),
    priority: str(metadata, ['governance.priority'], 'high'),
    offers: Array.isArray(depth.offers) ? depth.offers : [],
    billingRules: Array.isArray(depth.billingRules) && depth.billingRules.length ? depth.billingRules : billingRulesSeed,
    deliveryServices: Array.isArray(depth.deliveryServices) && depth.deliveryServices.length ? depth.deliveryServices : deliverySeed,
    proofControls: Array.isArray(depth.proofControls) && depth.proofControls.length ? depth.proofControls : proofSeed,
    raw,
  }
}

export default function ExistingPartnerSyncedModal(props: ModalProps) {
  const base = props.partner || props.selectedPartner || props.dossier || {}
  const [active, setActive] = useState('overview')
  const [editMode, setEditMode] = useState(false)
  const [busy, setBusy] = useState(false)
  const [syncBusy, setSyncBusy] = useState(false)
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [showPassword, setShowPassword] = useState(true)
  const [dossier, setDossier] = useState<AnyRow | null>(null)
  const [form, setForm] = useState<any>(() => initialForm(base))
  const id = String(form.id || base?.id || '')
  const readonly = !editMode

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!id) return
      try {
        const response = await fetch(`/api/traininghub/internal/partner-dossier/${id}`)
        const payload = await response.json().catch(() => ({}))
        if (!cancelled && payload?.ok && payload?.data) {
          setDossier(payload.data)
          setForm(initialForm({ ...payload.data.partner, raw: payload.data.organization, accessInfo: payload.data.accessInfo, commercialDepth: payload.data.commercialDepth || payload.data.organization?.metadata?.commercialDepth }))
        }
      } catch {}
    }
    load()
    return () => { cancelled = true }
  }, [id])

  const totals = useMemo(() => {
    const offers = Array.isArray(form.offers) ? form.offers : []
    return {
      setup: offers.reduce((s: number, o: AnyRow) => s + Number(o.setup || 0), 0),
      mrr: offers.reduce((s: number, o: AnyRow) => s + Number(o.mrr || 0), 0),
      annual: offers.reduce((s: number, o: AnyRow) => s + Number(o.annual || 0), 0),
      credits: offers.reduce((s: number, o: AnyRow) => s + Number(o.credits || 0), 0),
      participants: offers.reduce((s: number, o: AnyRow) => s + Number(o.participants || 0), 0),
      activeOffers: offers.filter((o: AnyRow) => ['accepted', 'active', 'ready_to_convert'].includes(o.status)).length,
    }
  }, [form.offers])

  const counts = dossier?.counts || {}
  const accessReady = Boolean(form.contactEmail && (form.authUserId || form.passwordStatus === 'temporary_password_set'))
  const readiness = useMemo(() => {
    const checks = [
      form.name,
      form.city,
      form.owner && form.owner !== 'Non assigné',
      form.plan && form.plan !== 'Aucun plan',
      Number(form.health || 0) >= 70,
      form.contactEmail,
      accessReady,
      form.offers?.length,
      form.billingRules?.some((r: AnyRow) => r.status === 'active'),
      form.deliveryServices?.some((s: AnyRow) => ['ready', 'planned'].includes(s.status)),
      form.proofControls?.some((p: AnyRow) => p.status === 'required'),
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }, [form, accessReady])
  const inactive = form.status === 'inactive' || form.stage === 'inactive'
  const suspended = form.status === 'suspended' || form.stage === 'suspended'

  const patch = (next: AnyRow) => setForm((current: AnyRow) => ({ ...current, ...next }))
  const updateArray = (key: string, itemId: string, next: AnyRow) => {
    if (readonly) return
    setForm((current: AnyRow) => ({ ...current, [key]: current[key].map((item: AnyRow) => item.id === itemId ? { ...item, ...next } : item) }))
  }

  function addOffer(template: AnyRow) {
    if (readonly) return
    setForm((current: AnyRow) => ({ ...current, offers: [...current.offers, cloneOffer(template, current.offers.length)] }))
  }

  function removeOffer(offerId: string) {
    if (readonly) return
    setForm((current: AnyRow) => ({ ...current, offers: current.offers.filter((offer: AnyRow) => offer.id !== offerId) }))
  }

  async function save() {
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(`/api/traininghub/internal/partner-dossier/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', form }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        setMessage(payload?.message || 'Sauvegarde impossible.')
        return
      }
      setEditMode(false)
      setMessage('Dossier sauvegardé.')
      await props.onUpdated?.(payload)
      await props.onChanged?.(payload)
      await props.onSaved?.(payload)
    } finally {
      setBusy(false)
    }
  }

  async function syncBusiness() {
    setSyncBusy(true)
    setMessage('')
    try {
      const response = await fetch(`/api/traininghub/internal/partner-dossier/${id}/commercial-depth`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        setMessage(payload?.message || 'Sync business impossible.')
        return
      }
      setMessage('Offres, billing, delivery et SLA synchronisés.')
      await props.onUpdated?.(payload)
      await props.onChanged?.(payload)
    } finally {
      setSyncBusy(false)
    }
  }

  async function setPassword() {
    if (!editMode) {
      setPasswordMessage('Cliquez sur Modifier pour gérer les accès.')
      return
    }
    const password = tempPassword || newPassword()
    if (!tempPassword) setTempPassword(password)
    setPasswordBusy(true)
    try {
      const response = await fetch(`/api/traininghub/internal/partner-dossier/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_password', form, password }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        setPasswordMessage(payload?.message || 'Mot de passe impossible.')
        return
      }
      patch({ authUserId: payload?.data?.authUserId || form.authUserId, passwordStatus: 'temporary_password_set', passwordLastResetAt: new Date().toISOString() })
      setPasswordMessage('Mot de passe temporaire défini. Copiez-le maintenant.')
    } finally {
      setPasswordBusy(false)
    }
  }

  async function copyPassword() {
    if (!tempPassword) return
    try {
      await navigator.clipboard.writeText(tempPassword)
      setPasswordMessage('Mot de passe copié.')
    } catch {
      setPasswordMessage('Copie impossible.')
    }
  }


  async function activatePartner() {
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(`/api/traininghub/internal/partner-dossier/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate' }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        setMessage(payload?.message || 'Activation impossible.')
        return
      }
      patch({ status: 'active', stage: 'active' })
      setMessage('Dossier partenaire activé. Le partenaire peut maintenant accéder au portail si son login/mot de passe est configuré.')
      await props.onUpdated?.(payload)
      await props.onChanged?.(payload)
    } finally {
      setBusy(false)
    }
  }

  async function suspendOrRestore() {
    const action = suspended ? 'restore' : 'suspend'
    if (!suspended && !window.confirm('Suspendre temporairement l’accès partenaire ?')) return
    setBusy(true)
    try {
      const response = await fetch(`/api/traininghub/internal/partner-dossier/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        setMessage(payload?.message || 'Action impossible.')
        return
      }
      patch({ status: suspended ? 'active' : 'suspended', stage: suspended ? 'active' : 'suspended' })
      await props.onUpdated?.(payload)
      await props.onChanged?.(payload)
    } finally {
      setBusy(false)
    }
  }

  async function deletePartner() {
    try {
      const organizationId = String((props.partner?.id || props.selectedPartner?.id || props.dossier?.id || props.dossier?.organization_id) || '').trim()

      if (!organizationId) {
        alert('Suppression impossible: identifiant partenaire introuvable dans cette modale.')
        return
      }

      if (!confirm('Supprimer définitivement ce partenaire smoke/test ? Cette action est irréversible.')) return

      const modalSupabase = getTrainingHubBrowserClient()
      const { data: modalSessionData } = modalSupabase ? await modalSupabase.auth.getSession() : { data: { session: null } as any }
      const modalSession = modalSessionData?.session

      const response = await fetch(`/api/traininghub/internal/partners/${organizationId}/hard-delete`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(modalSession?.access_token ? { Authorization: `Bearer ${modalSession.access_token}` } : {}),
        },
        cache: 'no-store',
        body: JSON.stringify({
          reason: 'Existing partner modal permanent delete',
          allowNonSmoke: false,
        }),
      })

      const deletePayload = await response.json().catch(() => ({}))

      if (!response.ok || deletePayload?.ok === false) {
        const message =
          deletePayload?.message ||
          deletePayload?.error ||
          deletePayload?.data?.message ||
          deletePayload?.data?.error ||
          'Suppression impossible. Endpoint hard-delete a refusé la demande.'
        throw new Error(message)
      }

      window.location.reload()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Suppression impossible.'
      console.error(error)
      alert(message)
    }
  }

  return (
    <div style={overlay}>
      <section style={modal}>
        <header style={header}>
          <div>
            <span style={eyebrow}>DOSSIER PARTENAIRE · {editMode ? 'MODE ÉDITION SYNCHRONISÉ' : 'MODE PREVIEW SYNCHRONISÉ'}</span>
            <h2>{form.name}</h2>
            <p>{form.city} · {form.segment} · {form.plan}</p>
            <div style={tagRow}>
              <Badge tone={inactive ? 'orange' : suspended ? 'red' : 'green'}>{inactive ? 'Dossier inactif' : suspended ? 'Accès suspendu' : 'Accès actif'}</Badge>
              <Badge tone={accessReady ? 'green' : 'orange'}>{accessReady ? 'Login configuré' : 'Login à compléter'}</Badge>
              <Badge tone={form.offers.length ? 'blue' : 'orange'}>{form.offers.length} offre(s)</Badge>
              <Badge tone="blue">{form.billingRules.filter((r: AnyRow) => r.status === 'active').length} règles billing</Badge>
              <Badge tone="green">Readiness {readiness}/100</Badge>
            </div>
          </div>
          <div style={headerActions}>
            {inactive ? <button style={primaryButton} disabled={busy} onClick={activatePartner}>Activer dossier</button> : null}
            {!editMode ? <button style={primaryButton} onClick={() => setEditMode(true)}>Modifier</button> : <button style={primaryButton} disabled={busy} onClick={save}>Enregistrer modifications</button>}
            <button style={secondaryButton} disabled={syncBusy} onClick={syncBusiness}>{syncBusy ? 'Sync…' : 'Sync business'}</button>
            <button style={dangerSoftButton} disabled={busy || inactive} onClick={suspendOrRestore}>{suspended ? 'Réactiver accès' : 'Suspendre accès'}</button>
            <button style={dangerButton} disabled={busy} onClick={deletePartner}>Supprimer définitivement</button>
            <button style={closeButton} onClick={props.onClose}>×</button>
          </div>
        </header>

        {message ? <div style={message.includes('impossible') ? errorBox : successBox}>{message}</div> : null}

        <div style={body}>
          <aside style={leftRail}>
            <div style={miniCard}>
              <span style={avatar}>{form.name.slice(0, 1).toUpperCase()}</span>
              <strong>{form.name}</strong>
              <small>{editMode ? 'Édition live activée' : 'Preview verrouillée'}</small>
              <div style={track}><i style={{ width: `${readiness}%` }} /></div>
              <small>{form.city} · {form.status}</small>
            </div>
            <nav style={stepNav}>
              {steps.map(([key, label, icon], index) => (
                <button key={key} style={active === key ? stepActive : stepButton} onClick={() => setActive(key)}>
                  <span>{icon}</span><b>{label}</b><em>{String(index + 1).padStart(2, '0')}</em>
                </button>
              ))}
            </nav>
            <div style={modeBox}>
              <span style={eyebrow}>LOGIQUE BUSINESS</span>
              <p>Offres, règles billing, delivery et preuves sont pré-intégrées. L’utilisateur choisit, classe, active et synchronise au lieu de saisir une structure fragile à la main.</p>
            </div>
          </aside>

          <main style={content}>
            <section style={topCards}>
              <Score label="Setup" value={money(totals.setup)} />
              <Score label="MRR" value={money(totals.mrr)} />
              <Score label="Crédits" value={totals.credits} />
              <Score label="Services prêts" value={form.deliveryServices.filter((s: AnyRow) => ['ready', 'planned'].includes(s.status)).length} />
            </section>

            <section style={mainCard}>
              {active === 'overview' && (
                <Step title="Vue 360 du partenaire" eyebrowText="SYNCHRONISATION">
                  <SummaryGrid totals={totals} form={form} counts={counts} />
                  <div style={chainGrid}>{['Dossier', 'Accès', 'Offres', 'Billing rules', 'Commande', 'Facture', 'Crédits', 'Delivery', 'Présence', 'Certificat', 'Preuves', 'Renouvellement'].map((x, i) => <div key={x} style={chainBox}><b>{String(i + 1).padStart(2, '0')}</b><span>{x}</span></div>)}</div>
                </Step>
              )}

              {active === 'identity' && (
                <Step title="Identité établissement" eyebrowText="BASE DOSSIER">
                  <div style={formGrid}>
                    <Field readonly={readonly} label="Nom établissement" value={form.name} onChange={(v) => patch({ name: v })} />
                    <Field readonly={readonly} label="Raison sociale" value={form.legalName} onChange={(v) => patch({ legalName: v })} />
                    <Field readonly={readonly} label="Ville" value={form.city} onChange={(v) => patch({ city: v })} />
                    <Field readonly={readonly} label="Owner AngelCare" value={form.owner} onChange={(v) => patch({ owner: v })} />
                    <Field readonly={readonly} label="Adresse" value={form.address} onChange={(v) => patch({ address: v })} wide />
                    <Select readonly={readonly} label="Segment" value={form.segment} onChange={(v) => patch({ segment: v })} options={['partner_school', 'kindergarten', 'nursery_group', 'training_partner', 'angelcare_internal']} />
                    <Select readonly={readonly} label="Plan" value={form.plan} onChange={(v) => patch({ plan: v })} options={['Aucun plan', 'Activation', 'Growth', 'Premium', 'Enterprise', 'Custom']} />
                  </div>
                </Step>
              )}

              {active === 'access' && (
                <Step title="Accès portail, login & mot de passe" eyebrowText="PORTAIL PARTENAIRE + RBAC">
                  <div style={infoBlue}><strong>{form.contactEmail || 'Email login à compléter'}</strong><p>/traininghub/partner · {form.accessRole} · {form.accessLevel}</p></div>
                  <div style={formGrid}>
                    <Field readonly={readonly} label="Nom contact" value={form.contactFullName} onChange={(v) => patch({ contactFullName: v })} />
                    <Field readonly={readonly} label="Email login" value={form.contactEmail} onChange={(v) => patch({ contactEmail: v })} />
                    <Field readonly={readonly} label="Téléphone" value={form.contactPhone} onChange={(v) => patch({ contactPhone: v })} />
                    <Select readonly={readonly} label="Rôle portail" value={form.accessRole} onChange={(v) => patch({ accessRole: v })} options={['partner_admin', 'partner_director', 'training_coordinator', 'billing_contact', 'readonly_auditor']} />
                    <ReadOnly label="Auth user ID" value={form.authUserId || 'Non créé'} />
                    <ReadOnly label="Dernier reset" value={form.passwordLastResetAt || 'Jamais'} />
                  </div>
                  <div style={passwordPanel}>
                    <div><span style={eyebrow}>MOT DE PASSE TEMPORAIRE</span><h3>Créer ou régénérer l’accès</h3><p>Les anciens mots de passe ne sont pas lisibles. Générez un nouveau mot de passe temporaire et copiez-le.</p></div>
                    <div style={passwordBox}>
                      <input style={readonly ? inputReadonly : inputStyle} type={showPassword ? 'text' : 'password'} readOnly={readonly} value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} placeholder={editMode ? 'Générer ou saisir un mot de passe' : 'Preview verrouillée'} />
                      <div style={buttonRow}>
                        <button style={secondaryButton} disabled={readonly} onClick={() => setTempPassword(newPassword())}>Générer</button>
                        <button style={secondaryButton} disabled={!tempPassword} onClick={() => setShowPassword((x) => !x)}>{showPassword ? 'Masquer' : 'Afficher'}</button>
                        <button style={secondaryButton} disabled={!tempPassword} onClick={copyPassword}>Copier</button>
                        <button style={primaryButton} disabled={readonly || passwordBusy} onClick={setPassword}>Définir / régénérer</button>
                      </div>
                      {passwordMessage ? <div style={successBox}>{passwordMessage}</div> : null}
                    </div>
                  </div>
                </Step>
              )}

              {active === 'offer' && (
                <Step title="Offres & services pré-intégrés" eyebrowText="CATALOGUE COMMERCIAL">
                  <SummaryGrid totals={totals} form={form} counts={counts} />
                  <div style={templateGrid}>{offerCatalog.map((tpl, i) => <button key={tpl.id} style={templateCard} disabled={readonly} onClick={() => addOffer(tpl)}><span style={eyebrow}>{tpl.family}</span><h3>{tpl.title}</h3><p>{tpl.pricingModel}</p><strong>{money(tpl.setup || tpl.annual || tpl.mrr)} · {tpl.credits} crédits</strong><small>{tpl.next}</small></button>)}</div>
                  <div style={sectionToolbar}><div><span style={eyebrow}>OFFRES PARTENAIRE</span><h3>{form.offers.length} offre(s) configurée(s)</h3></div><button style={secondaryButton} disabled={readonly} onClick={() => addOffer(offerCatalog[0])}>+ Ajouter offre</button></div>
                  <div style={list}>{form.offers.length ? form.offers.map((offer: AnyRow) => <article key={offer.id} style={richCard}>
                    <div style={offerHeader}><div><span style={eyebrow}>{offer.code || offer.family}</span><Field readonly={readonly} label="Titre offre" value={offer.title} onChange={(v) => updateArray('offers', offer.id, { title: v })} /></div><div style={twoCols}><Select readonly={readonly} label="Statut" value={offer.status} onChange={(v) => updateArray('offers', offer.id, { status: v })} options={['draft', 'ready_to_send', 'sent', 'negotiation', 'accepted', 'ready_to_convert', 'active', 'rejected', 'archived']} /><Select readonly={readonly} label="Classification" value={offer.classification} onChange={(v) => updateArray('offers', offer.id, { classification: v })} options={['first_offer', 'subscription_growth', 'premium_multisite', 'network_enterprise', 'renewal', 'upsell', 'retention']} /></div></div>
                    <div style={formGrid}><Select readonly={readonly} label="Pricing model" value={offer.pricingModel} onChange={(v) => updateArray('offers', offer.id, { pricingModel: v })} options={['setup_plus_credits', 'annual_subscription_plus_credits', 'premium_account_subscription', 'training_credit_wallet', 'custom_enterprise_account']} /><NumberField readonly={readonly} label="Setup MAD" value={offer.setup} onChange={(v) => updateArray('offers', offer.id, { setup: v })} /><NumberField readonly={readonly} label="MRR MAD" value={offer.mrr} onChange={(v) => updateArray('offers', offer.id, { mrr: v })} /><NumberField readonly={readonly} label="Annual MAD" value={offer.annual} onChange={(v) => updateArray('offers', offer.id, { annual: v })} /><NumberField readonly={readonly} label="Crédits" value={offer.credits} onChange={(v) => updateArray('offers', offer.id, { credits: v })} /><NumberField readonly={readonly} label="Participants" value={offer.participants} onChange={(v) => updateArray('offers', offer.id, { participants: v })} /><Select readonly={readonly} label="SLA" value={offer.sla} onChange={(v) => updateArray('offers', offer.id, { sla: v })} options={['standard_48h', 'priority_24h', 'enterprise_8h']} /><Select readonly={readonly} label="Preuves" value={offer.proofPack} onChange={(v) => updateArray('offers', offer.id, { proofPack: v })} options={['starter_kit', 'quarterly_report_pack', 'premium_proof_pack', 'executive_report_pack']} /></div>
                    <Field readonly={readonly} label="Next action" value={offer.next} onChange={(v) => updateArray('offers', offer.id, { next: v })} wide />
                    <div style={cardFooter}><Badge tone={['accepted', 'active'].includes(offer.status) ? 'green' : 'blue'}>{offer.status}</Badge><strong>{money(Number(offer.setup || 0) + Number(offer.annual || 0))} · MRR {money(offer.mrr)}</strong><button style={dangerSoftButton} disabled={readonly} onClick={() => removeOffer(offer.id)}>Retirer</button></div>
                  </article>) : <Empty text="Choisissez Activation, Growth, Premium ou Enterprise. Les montants, crédits, SLA, modules et preuves sont pré-remplis." />}</div>
                </Step>
              )}

              {active === 'billing' && (
                <Step title="Billing, règles et contrôle monétisation" eyebrowText="MOTEUR COMMERCIAL & FINANCE">
                  <SummaryGrid totals={totals} form={form} counts={counts} />
                  <div style={infoBlue}><strong>Logique fiable</strong><p>AngelCare ne prend pas de commission marketplace ici. La monétisation repose sur compte partenaire, activation, abonnements, crédits formation, refresh, preuves premium, reporting et gouvernance.</p></div>
                  <div style={twoGrid}>{form.billingRules.map((rule: AnyRow) => <article style={richCard} key={rule.id}><span style={eyebrow}>{rule.trigger}</span><h3>{rule.name}</h3><p>{rule.impact}</p><div style={formGrid}><Select readonly={readonly} label="Statut" value={rule.status} onChange={(v) => updateArray('billingRules', rule.id, { status: v })} options={['active', 'paused', 'draft', 'blocked', 'archived']} /><Select readonly={readonly} label="Exécution" value={rule.execution} onChange={(v) => updateArray('billingRules', rule.id, { execution: v })} options={['create_deposit_invoice', 'monthly_or_annual_invoice', 'decrement_credit_wallet', 'prepare_renewal_offer', 'manual_finance_review']} /><Select readonly={readonly} label="Base" value={rule.basis} onChange={(v) => updateArray('billingRules', rule.id, { basis: v })} options={['setup', 'mrr_or_annual', 'credits', 'plan_value', 'custom_amount']} /><Select readonly={readonly} label="Risque" value={rule.risk} onChange={(v) => updateArray('billingRules', rule.id, { risk: v })} options={['low', 'medium', 'high']} /></div><div style={cardFooter}><Badge tone={rule.status === 'active' ? 'green' : 'orange'}>{rule.status}</Badge><strong>{rule.owner}</strong></div></article>)}</div>
                </Step>
              )}

              {active === 'delivery' && (
                <Step title="Delivery opérationnelle & services livrables" eyebrowText="ORCHESTRATION FORMATION">
                  <div style={sectionToolbar}><div><span style={eyebrow}>SERVICES LIVRABLES</span><h3>{form.deliveryServices.length} flux contrôlés</h3></div><button style={secondaryButton} disabled={readonly} onClick={() => setForm((c: AnyRow) => ({ ...c, deliveryServices: [...c.deliveryServices, { ...deliverySeed[1], id: `service_${Date.now()}` }] }))}>+ Ajouter service</button></div>
                  <div style={twoGrid}>{form.deliveryServices.map((service: AnyRow) => <article style={richCard} key={service.id}><span style={eyebrow}>{service.cadence}</span><h3>{service.title}</h3><p>{service.next}</p><div style={formGrid}><Select readonly={readonly} label="Statut" value={service.status} onChange={(v) => updateArray('deliveryServices', service.id, { status: v })} options={['draft', 'ready', 'planned', 'in_progress', 'delivered', 'validated', 'blocked']} /><Select readonly={readonly} label="Mode" value={service.mode} onChange={(v) => updateArray('deliveryServices', service.id, { mode: v })} options={['onsite', 'online', 'hybrid']} /><Field readonly={readonly} label="Lieu" value={service.location} onChange={(v) => updateArray('deliveryServices', service.id, { location: v })} /><Select readonly={readonly} label="Checklist" value={service.checklist} onChange={(v) => updateArray('deliveryServices', service.id, { checklist: v })} options={['partner_onboarding_delivery', 'onsite_training_delivery', 'online_refresh_delivery', 'certificate_ready_delivery', 'enterprise_governance_delivery']} /><NumberField readonly={readonly} label="Capacité" value={service.capacity} onChange={(v) => updateArray('deliveryServices', service.id, { capacity: v })} /><Field readonly={readonly} label="Date cible" value={service.startsAt} onChange={(v) => updateArray('deliveryServices', service.id, { startsAt: v })} /><Select readonly={readonly} label="Owner" value={service.owner} onChange={(v) => updateArray('deliveryServices', service.id, { owner: v })} options={['training_coordinator', 'trainer', 'academy_ops', 'account_owner', 'support_ops']} /></div><div style={cardFooter}><Badge tone={['delivered', 'validated'].includes(service.status) ? 'green' : 'blue'}>{service.status}</Badge><strong>{service.mode} · capacité {service.capacity}</strong></div></article>)}</div>
                </Step>
              )}

              {active === 'proofs' && (
                <Step title="Preuves, SLA & impact business" eyebrowText="GOUVERNANCE PARTENAIRE">
                  <div style={infoBlue}><strong>Pourquoi c’est stratégique</strong><p>Les preuves transforment la livraison en valeur visible : présence validée, certificats émis, rapports de progression et SLA support. Elles protègent AngelCare, rassurent le partenaire et justifient renouvellement / upsell.</p></div>
                  <div style={twoGrid}>{form.proofControls.map((proof: AnyRow) => <article style={richCard} key={proof.id}><span style={eyebrow}>{proof.evidence} · {proof.visibility}</span><h3>{proof.title}</h3><p>{proof.impact}</p><div style={formGrid}><Select readonly={readonly} label="Statut" value={proof.status} onChange={(v) => updateArray('proofControls', proof.id, { status: v })} options={['required', 'recommended', 'optional', 'blocked', 'archived']} /><Select readonly={readonly} label="SLA" value={proof.sla} onChange={(v) => updateArray('proofControls', proof.id, { sla: v })} options={['same_day_after_session', '24h_to_48h', '48h_after_presence_validation', 'monthly_or_quarterly', 'manual_review']} /><Select readonly={readonly} label="Owner" value={proof.owner} onChange={(v) => updateArray('proofControls', proof.id, { owner: v })} options={['trainer', 'academy_ops', 'account_owner', 'support_ops', 'finance']} /><Select readonly={readonly} label="Visibilité" value={proof.visibility} onChange={(v) => updateArray('proofControls', proof.id, { visibility: v })} options={['partner_portal', 'internal_only', 'partner_and_internal', 'internal_and_partner_summary', 'executive_only']} /></div><Field readonly={readonly} label="Next action" value={proof.next} onChange={(v) => updateArray('proofControls', proof.id, { next: v })} wide /><div style={cardFooter}><Badge tone={proof.status === 'required' ? 'orange' : 'blue'}>{proof.status}</Badge><strong>{proof.sla}</strong></div></article>)}</div>
                </Step>
              )}

              {active === 'review' && (
                <Step title="Validation dossier" eyebrowText="REVIEW & COMMIT">
                  <div style={reviewGrid}>
                    <Review title="Dossier" value={form.name} note={`${form.city} · ${form.segment}`} />
                    <Review title="Accès" value={accessReady ? 'Configuré' : 'À configurer'} note={form.contactEmail || 'Email requis'} />
                    <Review title="Offres" value={form.offers.length} note={`${money(totals.annual)} annuel potentiel`} />
                    <Review title="Billing" value={form.billingRules.filter((r: AnyRow) => r.status === 'active').length} note="règles actives" />
                    <Review title="Delivery" value={form.deliveryServices.filter((s: AnyRow) => ['ready', 'planned'].includes(s.status)).length} note="prêts/planifiés" />
                    <Review title="Preuves" value={form.proofControls.filter((p: AnyRow) => p.status === 'required').length} note="obligatoires" />
                    <Review title="Crédits" value={totals.credits} note="wallet potentiel" />
                    <Review title="Readiness" value={`${readiness}/100`} note="production dossier" />
                  </div>
                </Step>
              )}
            </section>

            <footer style={footer}>
              <button style={secondaryButton} onClick={props.onClose}>Fermer</button>
              <div style={dots}>{steps.map(([key]) => <button key={key} style={key === active ? dotActive : dot} onClick={() => setActive(key)} />)}</div>
              {!editMode ? <button style={primaryButton} onClick={() => setEditMode(true)}>Modifier ce dossier</button> : <button style={primaryButton} disabled={busy} onClick={save}>Enregistrer modifications</button>}
            </footer>
          </main>
        </div>
      </section>
    </div>
  )
}

function Step({ title, eyebrowText, children }: { title: string; eyebrowText: string; children: ReactNode }) {
  return <div style={stepSection}><span style={eyebrow}>{eyebrowText}</span><h3>{title}</h3>{children}</div>
}
function Score({ label, value }: { label: string; value: ReactNode }) {
  return <article style={scoreCard}><span style={scoreDot}>●</span><div><p>{label}</p><strong>{value}</strong></div></article>
}
function SummaryGrid({ totals, form, counts }: { totals: AnyRow; form: AnyRow; counts: AnyRow }) {
  return <div style={summaryGrid}><Metric title="Offres" value={form.offers.length} note="multi-offres" /><Metric title="Setup" value={money(totals.setup)} note="activation" /><Metric title="MRR" value={money(totals.mrr)} note="récurrent" /><Metric title="Annuel" value={money(totals.annual)} note="contrat" /><Metric title="Crédits" value={totals.credits} note="formation" /><Metric title="Sessions" value={counts.sessions || 0} note="synced" /></div>
}
function Metric({ title, value, note }: { title: string; value: ReactNode; note: string }) {
  return <div style={metricBox}><span>{title}</span><strong>{value}</strong><small>{note}</small></div>
}
function Field({ label, value, onChange, readonly, wide }: { label: string; value: string; onChange: (value: string) => void; readonly?: boolean; wide?: boolean }) {
  return <label style={wide ? fieldWide : field}><span>{label}</span><input style={readonly ? inputReadonly : inputStyle} readOnly={readonly} value={value || ''} onChange={(e) => onChange(e.target.value)} /></label>
}
function NumberField({ label, value, onChange, readonly }: { label: string; value: number; onChange: (value: number) => void; readonly?: boolean }) {
  return <label style={field}><span>{label}</span><input type="number" style={readonly ? inputReadonly : inputStyle} readOnly={readonly} value={Number(value || 0)} onChange={(e) => onChange(Number(e.target.value || 0))} /></label>
}
function Select({ label, value, onChange, options, readonly }: { label: string; value: string; onChange: (value: string) => void; options: string[]; readonly?: boolean }) {
  return <label style={field}><span>{label}</span><select style={readonly ? inputReadonly : inputStyle} disabled={readonly} value={value || options[0]} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
}
function ReadOnly({ label, value }: { label: string; value: ReactNode }) {
  return <div style={readOnlyBox}><span>{label}</span><strong>{value}</strong></div>
}
function Badge({ children, tone }: { children: ReactNode; tone: 'green' | 'red' | 'orange' | 'blue' }) {
  const style = tone === 'green' ? greenTag : tone === 'red' ? redTag : tone === 'orange' ? orangeTag : blueTag
  return <span style={style}>{children}</span>
}
function Empty({ text }: { text: string }) {
  return <div style={emptyState}><h3>Aucune offre configurée</h3><p>{text}</p></div>
}
function Review({ title, value, note }: { title: string; value: ReactNode; note: string }) {
  return <div style={reviewCard}><span>{title}</span><strong>{value}</strong><small>{note}</small></div>
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, zIndex: 9999, padding: 8, background: 'rgba(8,18,38,.58)', backdropFilter: 'blur(14px)', display: 'grid', placeItems: 'center' }
const modal: CSSProperties = { width: 'calc(100vw - 16px)', height: 'calc(100dvh - 16px)', display: 'grid', gridTemplateRows: 'auto auto minmax(0,1fr)', gap: 12, padding: 20, borderRadius: 34, background: 'linear-gradient(135deg,#fff,#f8fbff 55%,#eef6ff)', border: '1px solid #dce7f6', boxShadow: '0 50px 120px rgba(5,16,36,.34)', overflow: 'hidden' }
const header: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, padding: 20, borderRadius: 28, background: 'rgba(255,255,255,.9)', border: '1px solid #dce7f6', boxShadow: '0 18px 44px rgba(17,42,88,.07)' }
const eyebrow: CSSProperties = { color: '#1169ff', fontWeight: 950, letterSpacing: '.16em', fontSize: 12, textTransform: 'uppercase' }
const headerActions: CSSProperties = { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }
const primaryButton: CSSProperties = { border: '1px solid #1169ff', color: '#fff', background: 'linear-gradient(135deg,#073b9d,#1169ff)', borderRadius: 16, padding: '13px 18px', fontWeight: 950, boxShadow: '0 16px 30px rgba(17,105,255,.22)', cursor: 'pointer' }
const secondaryButton: CSSProperties = { border: '1px solid #d9e5f6', color: '#16406f', background: '#fff', borderRadius: 16, padding: '12px 15px', fontWeight: 950, cursor: 'pointer' }
const dangerSoftButton: CSSProperties = { border: '1px solid #fecdd3', color: '#be123c', background: '#fff1f2', borderRadius: 16, padding: '12px 15px', fontWeight: 950, cursor: 'pointer' }
const dangerButton: CSSProperties = { border: '1px solid #b91c1c', color: '#fff', background: 'linear-gradient(135deg,#991b1b,#dc2626)', borderRadius: 16, padding: '12px 15px', fontWeight: 950, cursor: 'pointer' }
const closeButton: CSSProperties = { width: 48, height: 48, borderRadius: 16, border: '1px solid #d9e5f6', background: '#fff', color: '#0b1733', fontSize: 26, fontWeight: 950, cursor: 'pointer' }
const tagRow: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }
const tagBase: CSSProperties = { width: 'fit-content', padding: '8px 11px', borderRadius: 999, fontSize: 12, fontWeight: 950 }
const greenTag: CSSProperties = { ...tagBase, color: '#047857', background: '#ecfdf5', border: '1px solid #bbf7d0' }
const redTag: CSSProperties = { ...tagBase, color: '#be123c', background: '#fff1f2', border: '1px solid #fecdd3' }
const orangeTag: CSSProperties = { ...tagBase, color: '#c2410c', background: '#fff7ed', border: '1px solid #fed7aa' }
const blueTag: CSSProperties = { ...tagBase, color: '#0f57e2', background: '#eff6ff', border: '1px solid #bfdbfe' }
const successBox: CSSProperties = { padding: 12, borderRadius: 16, background: '#ecfdf5', color: '#047857', border: '1px solid #bbf7d0', fontWeight: 900 }
const errorBox: CSSProperties = { padding: 12, borderRadius: 16, background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3', fontWeight: 900 }
const body: CSSProperties = { minHeight: 0, height: '100%', overflow: 'hidden', display: 'grid', gridTemplateColumns: '390px minmax(0,1fr)', gap: 18 }
const leftRail: CSSProperties = { minHeight: 0, overflowY: 'auto', display: 'grid', alignContent: 'start', gap: 16, paddingRight: 6 }
const miniCard: CSSProperties = { display: 'grid', placeItems: 'center', textAlign: 'center', gap: 9, padding: 20, borderRadius: 28, color: '#fff', background: 'linear-gradient(135deg,#09265e,#1169ff)', boxShadow: '0 26px 60px rgba(17,105,255,.22)' }
const avatar: CSSProperties = { width: 64, height: 64, display: 'grid', placeItems: 'center', borderRadius: 22, background: 'rgba(255,255,255,.18)', fontWeight: 950, fontSize: 24 }
const track: CSSProperties = { width: '100%', height: 10, borderRadius: 99, background: 'rgba(255,255,255,.22)', overflow: 'hidden' }
const stepNav: CSSProperties = { display: 'grid', gap: 8 }
const stepButton: CSSProperties = { minHeight: 54, display: 'grid', gridTemplateColumns: '34px 1fr 34px', alignItems: 'center', gap: 10, padding: '0 12px', borderRadius: 17, border: '1px solid #dce7f6', color: '#425872', background: '#fff', textAlign: 'left', fontWeight: 900, cursor: 'pointer' }
const stepActive: CSSProperties = { ...stepButton, color: '#fff', background: 'linear-gradient(135deg,#073b9d,#1169ff)', boxShadow: '0 18px 34px rgba(17,105,255,.22)' }
const modeBox: CSSProperties = { padding: 16, borderRadius: 22, background: '#fff', border: '1px solid #dce7f6', color: '#243955', fontWeight: 800 }
const content: CSSProperties = { minHeight: 0, overflow: 'hidden', display: 'grid', gridTemplateRows: 'auto minmax(0,1fr) auto', gap: 14 }
const topCards: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(180px,1fr))', gap: 12 }
const scoreCard: CSSProperties = { minHeight: 96, display: 'grid', gridTemplateColumns: '52px 1fr', gap: 12, alignItems: 'center', padding: 16, borderRadius: 22, background: '#fff', border: '1px solid #dce7f6', boxShadow: '0 16px 32px rgba(17,42,88,.055)' }
const scoreDot: CSSProperties = { width: 50, height: 50, display: 'grid', placeItems: 'center', borderRadius: 18, background: '#e8f1ff', color: '#1169ff' }
const mainCard: CSSProperties = { minHeight: 0, overflowY: 'auto', padding: 24, borderRadius: 28, background: '#fff', border: '1px solid #dce7f6', boxShadow: '0 18px 38px rgba(17,42,88,.055)' }
const stepSection: CSSProperties = { display: 'grid', gap: 18 }
const formGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }
const twoCols: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
const twoGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }
const field: CSSProperties = { display: 'grid', gap: 8, fontWeight: 900, color: '#243955' }
const fieldWide: CSSProperties = { ...field, gridColumn: 'span 2' }
const inputStyle: CSSProperties = { minHeight: 48, border: '1px solid #d9e5f6', borderRadius: 15, padding: '0 13px', color: '#0b1733', background: '#fbfdff', fontWeight: 850 }
const inputReadonly: CSSProperties = { ...inputStyle, color: '#334155', background: '#f8fbff' }
const readOnlyBox: CSSProperties = { minHeight: 72, display: 'grid', gap: 7, padding: 13, borderRadius: 16, background: '#f8fbff', border: '1px solid #dce7f6', color: '#243955', fontWeight: 900 }
const passwordPanel: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,.8fr) minmax(0,1.2fr)', gap: 18, padding: 18, borderRadius: 24, background: 'linear-gradient(135deg,#fff,#f8fbff)', border: '1px solid #dce7f6' }
const passwordBox: CSSProperties = { display: 'grid', gap: 12 }
const buttonRow: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10 }
const infoBlue: CSSProperties = { padding: 18, borderRadius: 24, background: 'linear-gradient(135deg,#eff6ff,#ecfeff)', border: '1px solid #dbeafe', color: '#243955' }
const summaryGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 12 }
const metricBox: CSSProperties = { minHeight: 100, display: 'grid', alignContent: 'center', gap: 7, padding: 16, borderRadius: 20, background: '#f8fbff', border: '1px solid #e1e9f6' }
const chainGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(150px,1fr))', gap: 10 }
const chainBox: CSSProperties = { minHeight: 76, display: 'grid', placeItems: 'center', textAlign: 'center', borderRadius: 18, background: '#f8fbff', color: '#16406f', border: '1px solid #dce7f6', fontWeight: 950 }
const templateGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }
const templateCard: CSSProperties = { minHeight: 180, display: 'grid', alignContent: 'start', gap: 10, padding: 18, borderRadius: 24, background: 'linear-gradient(135deg,#fff,#f8fbff)', border: '1px solid #dce7f6', color: '#0b1733', textAlign: 'left', cursor: 'pointer', boxShadow: '0 18px 38px rgba(17,42,88,.06)' }
const sectionToolbar: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: 16, borderRadius: 24, background: '#f8fbff', border: '1px solid #e1e9f6' }
const list: CSSProperties = { display: 'grid', gap: 14 }
const richCard: CSSProperties = { display: 'grid', gap: 14, padding: 18, borderRadius: 26, border: '1px solid #dce7f6', background: '#fff', boxShadow: '0 18px 38px rgba(17,42,88,.055)' }
const offerHeader: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 520px', gap: 16, alignItems: 'start' }
const cardFooter: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderTop: '1px solid #eef3fb', paddingTop: 12 }
const emptyState: CSSProperties = { minHeight: 180, display: 'grid', placeItems: 'center', textAlign: 'center', borderRadius: 24, border: '1px dashed #bfdbfe', background: '#f8fbff', color: '#425872' }
const reviewGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(220px,1fr))', gap: 12 }
const reviewCard: CSSProperties = { minHeight: 112, display: 'grid', alignContent: 'center', gap: 7, padding: 16, borderRadius: 20, background: '#f8fbff', border: '1px solid #e1e9f6' }
const footer: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 14, borderRadius: 24, background: 'rgba(255,255,255,.96)', border: '1px solid #dce7f6', boxShadow: '0 -12px 30px rgba(17,42,88,.055)' }
const dots: CSSProperties = { display: 'flex', gap: 7, alignItems: 'center' }
const dot: CSSProperties = { width: 10, height: 10, borderRadius: 999, border: 0, background: '#cbd8ec' }
const dotActive: CSSProperties = { ...dot, width: 30, background: '#1169ff' }

