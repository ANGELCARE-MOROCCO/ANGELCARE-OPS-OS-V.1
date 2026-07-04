'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'

type AnyRow = Record<string, any>

type ExistingPartnerModalProps = {
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
  { key: 'overview', label: 'Vue dossier', icon: '✦' },
  { key: 'identity', label: 'Identité établissement', icon: '◉' },
  { key: 'access', label: 'Accès, login & mot de passe', icon: '🔐' },
  { key: 'billing', label: 'Billing & contrôle', icon: '▥' },
  { key: 'offer', label: 'Offre & services', icon: '◆' },
  { key: 'delivery', label: 'Delivery', icon: '▣' },
  { key: 'proofs', label: 'Preuves & SLA', icon: '◇' },
  { key: 'review', label: 'Validation', icon: '✓' },
]

const moduleOptions = [
  ['formations', 'Formations'],
  ['team', 'Équipe'],
  ['certificates', 'Certificats'],
  ['billing', 'Facturation'],
  ['documents', 'Documents'],
  ['requests', 'Demandes'],
  ['analytics', 'Analytics'],
  ['renewal', 'Renouvellement'],
  ['governance', 'Gouvernance'],
]

const proofOptions = [
  ['starter_kit', 'Kit de démarrage'],
  ['partner_welcome_pack', 'Pack bienvenue'],
  ['certificate_branding_kit', 'Branding certificats'],
  ['quarterly_report_pack', 'Rapport trimestriel'],
  ['premium_proof_pack', 'Preuves premium'],
  ['board_report_pack', 'Board report'],
  ['renewal_pack', 'Pack renouvellement'],
  ['executive_report_pack', 'Rapport exécutif'],
  ['audit_readiness_pack', 'Audit readiness'],
]

function valueOf(row: AnyRow | null | undefined, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = key.split('.').reduce((acc: any, part) => acc?.[part], row)
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value)
  }
  return fallback
}

function boolArray(value: unknown, fallback: string[]) {
  return Array.isArray(value) ? value.map(String) : fallback
}

function money(value: unknown) {
  const n = Number(value || 0)
  if (!Number.isFinite(n)) return '0 MAD'
  if (n >= 1000) return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 1 }).format(n / 1000)} K MAD`
  return `${new Intl.NumberFormat('fr-MA').format(n)} MAD`
}

function generatePassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const symbols = '!@#%*-_'
  const randomChar = (chars: string) => chars[Math.floor(Math.random() * chars.length)]
  let password = `AC-${randomChar('ABCDEFGHJKLMNPQRSTUVWXYZ')}${randomChar('23456789')}${randomChar(symbols)}`
  while (password.length < 14) password += randomChar(alphabet)
  return password
}

function normalizeInitial(partner: AnyRow) {
  const raw = partner?.raw || partner
  const metadata = raw?.metadata || {}
  const accessInfo = partner?.accessInfo || {}
  return {
    id: partner?.id || raw?.id || '',
    name: valueOf(partner, ['name'], valueOf(raw, ['name', 'display_name', 'legal_name'], 'Partenaire')),
    legalName: valueOf(partner, ['legalName'], valueOf(raw, ['legal_name', 'display_name', 'name'], '')),
    city: valueOf(partner, ['city'], valueOf(raw, ['city', 'metadata.city'], 'Rabat')),
    address: valueOf(raw, ['address', 'metadata.address'], ''),
    website: valueOf(raw, ['website', 'metadata.website'], ''),
    segment: valueOf(partner, ['segment'], valueOf(raw, ['segment', 'organization_type', 'partner_type'], 'partner_school')),
    partnerType: valueOf(partner, ['partnerType'], valueOf(raw, ['partner_type', 'organization_type'], 'school_partner')),
    owner: valueOf(partner, ['owner'], valueOf(raw, ['owner_name', 'account_owner', 'metadata.commercial.owner'], 'Non assigné')),
    plan: valueOf(partner, ['plan'], valueOf(raw, ['plan_name', 'metadata.commercial.plan'], 'Aucun plan')),
    status: valueOf(partner, ['status', 'stage'], valueOf(raw, ['status', 'stage'], 'active')),
    stage: valueOf(partner, ['stage'], valueOf(raw, ['stage', 'status'], 'active')),
    health: valueOf(partner, ['health'], valueOf(raw, ['health_score', 'metadata.governance.health'], '62')),
    risk: valueOf(partner, ['risk'], valueOf(raw, ['risk_level', 'metadata.governance.riskLevel'], 'À surveiller')),

    contactFullName: valueOf(metadata, ['contact.fullName'], valueOf(accessInfo, ['fullName'], '')),
    contactEmail: valueOf(accessInfo, ['loginEmail'], valueOf(metadata, ['contact.email'], valueOf(raw, ['email'], ''))),
    contactPhone: valueOf(metadata, ['contact.phone'], valueOf(raw, ['phone'], '')),
    contactFunction: valueOf(metadata, ['contact.function'], 'Direction partenaire'),

    authUserId: valueOf(accessInfo, ['authUserId'], valueOf(metadata, ['access.authUserId'], '')),
    profileId: valueOf(accessInfo, ['profileId'], ''),
    passwordLastResetAt: valueOf(accessInfo, ['passwordLastResetAt'], valueOf(metadata, ['access.passwordLastResetAt'], '')),
    passwordStatus: valueOf(metadata, ['access.passwordStatus'], valueOf(accessInfo, ['accessStatus'], 'not_configured')),
    passwordResetRequired: Boolean(accessInfo?.passwordResetRequired || metadata?.access?.passwordResetRequired),

    accessRole: valueOf(metadata, ['access.role'], 'partner_admin'),
    accessLevel: valueOf(metadata, ['access.accessLevel'], 'standard_partner_access'),
    portalPolicy: valueOf(metadata, ['access.portalPolicy'], 'restricted_partner_scope'),
    enabledModules: boolArray(metadata?.access?.enabledModules, ['formations', 'refresh', 'preuves', 'demandes']),

    billingModel: valueOf(metadata, ['billing.billingModel', 'billing.model'], 'account_subscription'),
    accountType: valueOf(metadata, ['billing.accountType'], 'partner_training_account'),
    billingPeriod: valueOf(metadata, ['billing.billingPeriod'], 'monthly'),
    currency: valueOf(metadata, ['billing.currency'], 'MAD'),
    paymentTerms: valueOf(metadata, ['billing.paymentTerms'], 'due_15'),
    invoicePolicy: valueOf(metadata, ['billing.invoicePolicy'], 'manual_review_before_issue'),
    renewalPolicy: valueOf(metadata, ['billing.renewalPolicy'], 'manual_review_30_days_before_end'),
    monthlyAmount: valueOf(metadata, ['commercial.monthlyAmount'], '0'),

    offerTitle: valueOf(metadata, ['offer.title'], 'Offre TrainingHub partenaire'),
    offerAmount: valueOf(metadata, ['offer.amount'], '0'),
    participants: valueOf(metadata, ['offer.participants'], '0'),

    mode: valueOf(metadata, ['delivery.mode'], 'onsite'),
    location: valueOf(metadata, ['delivery.location'], valueOf(raw, ['city'], 'Site partenaire')),
    checklistTemplate: valueOf(metadata, ['delivery.checklistTemplate'], 'standard_training_delivery'),

    proofVisibility: valueOf(metadata, ['proofs.proofVisibility'], 'partner_portal'),
    selectedKits: boolArray(metadata?.proofs?.selectedKits, ['starter_kit']),
    slaPolicy: valueOf(metadata, ['governance.slaPolicy'], 'standard_48h'),
    priority: valueOf(metadata, ['governance.priority'], 'high'),
    raw,
  }
}

export default function ExistingPartnerSyncedModal(props: ExistingPartnerModalProps) {
  const basePartner = props.partner || props.selectedPartner || props.dossier || {}
  const [activeStep, setActiveStep] = useState('overview')
  const [editMode, setEditMode] = useState(false)
  const [busy, setBusy] = useState(false)
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [dossier, setDossier] = useState<AnyRow | null>(null)
  const [tempPassword, setTempPassword] = useState('')
  const [showPassword, setShowPassword] = useState(true)
  const [form, setForm] = useState(() => normalizeInitial(basePartner))

  const id = String(form.id || basePartner?.id || '')

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!id) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/traininghub/internal/partner-dossier/${id}`)
        const payload = await response.json().catch(() => ({}))
        if (!cancelled && payload?.ok && payload?.data) {
          setDossier(payload.data)
          setForm(normalizeInitial({ ...payload.data.partner, raw: payload.data.organization, accessInfo: payload.data.accessInfo }))
        }
      } catch {
        // Keep local card data visible.
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  const counts = dossier?.counts || {}
  const readiness = useMemo(() => {
    const checks = [
      Boolean(form.name),
      Boolean(form.city),
      Boolean(form.segment),
      Boolean(form.owner && form.owner !== 'Non assigné'),
      Boolean(form.plan && form.plan !== 'Aucun plan'),
      Number(form.health || 0) >= 70,
      form.enabledModules.length > 0,
      Boolean(form.paymentTerms),
      Boolean(form.invoicePolicy),
      Boolean(form.renewalPolicy),
      Boolean(form.slaPolicy),
      Boolean(form.proofVisibility),
      Boolean(form.contactEmail),
      Boolean(form.authUserId || form.passwordStatus === 'temporary_password_set'),
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }, [form])

  const accessReady = Boolean(form.contactEmail && (form.authUserId || form.passwordStatus === 'temporary_password_set'))
  const suspended = form.status === 'suspended' || form.stage === 'suspended' || form.raw?.metadata?.access_temporarily_suspended

  function patch(next: Partial<typeof form>) {
    setForm((current) => ({ ...current, ...next }))
  }

  function toggleArray(key: 'enabledModules' | 'selectedKits', value: string) {
    if (!editMode) return
    setForm((current) => {
      const currentValues = current[key]
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value]
      return { ...current, [key]: nextValues }
    })
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
      setMessage('Dossier partenaire sauvegardé et synchronisé.')
      await props.onUpdated?.(payload)
      await props.onChanged?.(payload)
      await props.onSaved?.(payload)
    } finally {
      setBusy(false)
    }
  }

  async function setPassword() {
    if (!editMode) {
      setPasswordMessage('Cliquez d’abord sur Modifier pour gérer les accès.')
      return
    }

    const password = tempPassword || generatePassword()
    if (!tempPassword) setTempPassword(password)

    setPasswordBusy(true)
    setPasswordMessage('')
    try {
      const response = await fetch(`/api/traininghub/internal/partner-dossier/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_password', form, password }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        setPasswordMessage(payload?.message || 'Mot de passe impossible à définir.')
        return
      }

      patch({
        authUserId: payload?.data?.authUserId || form.authUserId,
        profileId: payload?.data?.profileId || form.profileId,
        contactEmail: payload?.data?.loginEmail || form.contactEmail,
        passwordStatus: 'temporary_password_set',
        passwordLastResetAt: new Date().toISOString(),
        passwordResetRequired: true,
      })
      setPasswordMessage('Mot de passe temporaire défini. Copiez-le maintenant : il ne sera pas stocké en clair.')
      await props.onUpdated?.(payload)
      await props.onChanged?.(payload)
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
      setPasswordMessage('Copie impossible. Sélectionnez le mot de passe manuellement.')
    }
  }

  async function suspendOrRestore() {
    const action = suspended ? 'restore' : 'suspend'
    if (!suspended && !window.confirm('Suspendre temporairement l’accès partenaire ?')) return

    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(`/api/traininghub/internal/partner-dossier/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, currentMetadata: form.raw?.metadata || {} }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        setMessage(payload?.message || 'Action impossible.')
        return
      }
      patch({ status: suspended ? 'active' : 'suspended', stage: suspended ? 'active' : 'suspended' })
      setMessage(suspended ? 'Accès partenaire réactivé.' : 'Accès partenaire suspendu temporairement.')
      await props.onUpdated?.(payload)
      await props.onChanged?.(payload)
    } finally {
      setBusy(false)
    }
  }

  async function deletePartner() {
    const confirmed = window.prompt('Suppression définitive. Tapez DELETE_PARTNER pour confirmer.')
    if (confirmed !== 'DELETE_PARTNER') return

    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(`/api/traininghub/internal/partner-dossier/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'DELETE_PARTNER' }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        setMessage(payload?.message || 'Suppression impossible.')
        return
      }
      await props.onDeleted?.(payload)
      await props.onUpdated?.(payload)
      await props.onChanged?.(payload)
      props.onClose()
    } finally {
      setBusy(false)
    }
  }

  const readonly = !editMode

  return (
    <div style={overlay}>
      <section style={modal}>
        <div style={ambientBlue} />
        <div style={ambientMint} />

        <header style={header}>
          <div>
            <span style={eyebrow}>DOSSIER PARTENAIRE · {editMode ? 'MODE ÉDITION SYNCHRONISÉ' : 'MODE PREVIEW SYNCHRONISÉ'}</span>
            <h2>{form.name}</h2>
            <p>{form.city} · {form.segment} · {form.plan}</p>
            <div style={tagRow}>
              <span style={suspended ? redTag : greenTag}>{suspended ? 'Accès suspendu' : 'Accès actif'}</span>
              <span style={accessReady ? greenTag : orangeTag}>{accessReady ? 'Login configuré' : 'Login à compléter'}</span>
              <span style={form.passwordStatus === 'temporary_password_set' ? blueTag : orangeTag}>{form.passwordStatus === 'temporary_password_set' ? 'Mot de passe défini' : 'Mot de passe à définir'}</span>
              <span style={blueTag}>{counts.users || 0} accès</span>
              <span style={blueTag}>{counts.roles || 0} rôle(s)</span>
              <span style={form.risk === 'Faible' ? greenTag : orangeTag}>{form.risk}</span>
              {loading ? <span style={slateTag}>Synchronisation…</span> : <span style={greenTag}>Synchronisé</span>}
            </div>
          </div>

          <div style={headerActions}>
            <div style={readinessPill}>
              <span>Readiness</span>
              <strong>{readiness}/100</strong>
            </div>
            {!editMode ? (
              <button style={primaryButton} onClick={() => setEditMode(true)}>Modifier</button>
            ) : (
              <button style={primaryButton} disabled={busy} onClick={save}>{busy ? 'Sauvegarde…' : 'Enregistrer modifications'}</button>
            )}
            <button style={dangerSoftButton} disabled={busy} onClick={suspendOrRestore}>
              {suspended ? 'Réactiver accès' : 'Suspendre accès'}
            </button>
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
              <div style={progressTrack}><i style={{ width: `${readiness}%` }} /></div>
              <small>{form.city} · {form.status}</small>
            </div>

            <nav style={stepNav}>
              {steps.map((step, index) => (
                <button key={step.key} style={activeStep === step.key ? stepActive : stepButton} onClick={() => setActiveStep(step.key)}>
                  <span>{step.icon}</span>
                  <b>{step.label}</b>
                  <em>{String(index + 1).padStart(2, '0')}</em>
                </button>
              ))}
            </nav>

            <div style={modeBox}>
              <span style={eyebrow}>ACCÈS PORTAIL</span>
              <p>
                Les mots de passe existants ne peuvent pas être relus depuis Supabase. Ici vous pouvez créer ou régénérer
                un mot de passe temporaire, le copier, puis le remettre au partenaire.
              </p>
            </div>
          </aside>

          <main style={content}>
            <section style={topCards}>
              <Score label="Plan" value={form.plan} tone="blue" />
              <Score label="Santé" value={`${form.health}/100`} tone="green" />
              <Score label="Accès portail" value={accessReady ? 'Configuré' : 'À définir'} tone="violet" />
              <Score label="Modules" value={form.enabledModules.length} tone="cyan" />
            </section>

            <section style={mainCard}>
              {activeStep === 'overview' ? (
                <StepSection title="Vue 360 du partenaire" eyebrowText="SYNCHRONISATION DOSSIER">
                  <div style={overviewGrid}>
                    <Metric title="Offres" value={counts.offers || 0} note="commercial" />
                    <Metric title="Commandes" value={counts.orders || 0} note="conversion" />
                    <Metric title="Factures" value={counts.invoices || 0} note="billing" />
                    <Metric title="Crédits" value={counts.credits || 0} note="wallet" />
                    <Metric title="Sessions" value={counts.sessions || 0} note="delivery" />
                    <Metric title="Participants" value={counts.participants || 0} note="présence" />
                    <Metric title="Certificats" value={counts.certificates || 0} note="preuves" />
                    <Metric title="Demandes" value={counts.requests || 0} note="SLA" />
                  </div>
                  <div style={chainGrid}>
                    {['Dossier', 'Accès', 'Mot de passe', 'Billing', 'Offre', 'Commande', 'Facture', 'Crédits', 'Session', 'Présence', 'Certificat', 'Preuves'].map((item, index) => (
                      <div style={chainBox} key={item}>
                        <b>{String(index + 1).padStart(2, '0')}</b>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </StepSection>
              ) : null}

              {activeStep === 'identity' ? (
                <StepSection title="Identité établissement" eyebrowText="BASE DOSSIER">
                  <div style={formGrid}>
                    <Field readonly={readonly} label="Nom établissement" value={form.name} onChange={(value) => patch({ name: value })} />
                    <Field readonly={readonly} label="Raison sociale" value={form.legalName} onChange={(value) => patch({ legalName: value })} />
                    <Field readonly={readonly} label="Ville" value={form.city} onChange={(value) => patch({ city: value })} />
                    <Field readonly={readonly} label="Adresse" value={form.address} onChange={(value) => patch({ address: value })} wide />
                    <Field readonly={readonly} label="Site web" value={form.website} onChange={(value) => patch({ website: value })} />
                    <SelectField disabled={readonly} label="Segment" value={form.segment} onChange={(value) => patch({ segment: value })} options={['partner_school', 'kindergarten', 'nursery_group', 'training_partner', 'angelcare_internal']} />
                    <SelectField disabled={readonly} label="Type partenaire" value={form.partnerType} onChange={(value) => patch({ partnerType: value })} options={['school_partner', 'network_partner', 'academy_partner', 'internal_partner']} />
                    <Field readonly={readonly} label="Owner interne AngelCare" value={form.owner} onChange={(value) => patch({ owner: value })} />
                  </div>
                </StepSection>
              ) : null}

              {activeStep === 'access' ? (
                <StepSection title="Accès portail, login & mot de passe" eyebrowText="PORTAIL PARTENAIRE + RBAC + PASSWORD">
                  <div style={accessHero}>
                    <div>
                      <span style={eyebrow}>LOGIN PARTENAIRE</span>
                      <h3>{form.contactEmail || 'Email à compléter'}</h3>
                      <p>/traininghub/partner · {form.accessRole} · {form.accessLevel}</p>
                    </div>
                    <span style={accessReady ? greenTag : orangeTag}>{accessReady ? 'Accès prêt' : 'À configurer'}</span>
                  </div>

                  <div style={formGrid}>
                    <Field readonly={readonly} label="Nom complet" value={form.contactFullName} onChange={(value) => patch({ contactFullName: value })} />
                    <Field readonly={readonly} label="Email login portail" value={form.contactEmail} onChange={(value) => patch({ contactEmail: value })} />
                    <Field readonly={readonly} label="Téléphone" value={form.contactPhone} onChange={(value) => patch({ contactPhone: value })} />
                    <Field readonly={readonly} label="Fonction" value={form.contactFunction} onChange={(value) => patch({ contactFunction: value })} />
                    <SelectField disabled={readonly} label="Rôle portail" value={form.accessRole} onChange={(value) => patch({ accessRole: value })} options={['partner_admin', 'partner_director', 'training_coordinator', 'billing_contact', 'readonly_auditor']} />
                    <SelectField disabled={readonly} label="Niveau d’accès" value={form.accessLevel} onChange={(value) => patch({ accessLevel: value })} options={['restricted_partner_scope', 'standard_partner_access', 'billing_only_access', 'training_only_access', 'executive_partner_access']} />
                    <SelectField disabled={readonly} label="Politique portail" value={form.portalPolicy} onChange={(value) => patch({ portalPolicy: value })} options={['restricted_partner_scope', 'own_org_only', 'billing_hidden', 'proofs_readonly', 'full_partner_visibility']} />
                    <ReadOnlyBox label="Auth user ID" value={form.authUserId || 'Non créé'} />
                    <ReadOnlyBox label="Dernière réinitialisation" value={form.passwordLastResetAt || 'Jamais'} />
                    <ReadOnlyBox label="Statut mot de passe" value={form.passwordStatus || 'not_configured'} />
                  </div>

                  <div style={passwordPanel}>
                    <div>
                      <span style={eyebrow}>MOT DE PASSE TEMPORAIRE</span>
                      <h3>Créer ou régénérer l’accès partenaire</h3>
                      <p>
                        Le mot de passe existant n’est pas lisible. Générez un nouveau mot de passe temporaire,
                        sauvegardez-le dans Supabase Auth, puis copiez-le avant de fermer le modal.
                      </p>
                    </div>

                    <div style={passwordBox}>
                      <label style={field}>
                        <span>Nouveau mot de passe temporaire</span>
                        <input
                          style={readonly ? inputReadonly : inputStyle}
                          type={showPassword ? 'text' : 'password'}
                          readOnly={readonly}
                          value={tempPassword}
                          placeholder={editMode ? 'Générer ou saisir un mot de passe temporaire' : 'Preview verrouillée'}
                          onChange={(event) => setTempPassword(event.target.value)}
                        />
                      </label>

                      <div style={passwordActions}>
                        <button type="button" style={secondaryButton} disabled={!editMode} onClick={() => setTempPassword(generatePassword())}>Générer</button>
                        <button type="button" style={secondaryButton} disabled={!tempPassword} onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Masquer' : 'Afficher'}</button>
                        <button type="button" style={secondaryButton} disabled={!tempPassword} onClick={copyPassword}>Copier</button>
                        <button type="button" style={primaryButton} disabled={!editMode || passwordBusy} onClick={setPassword}>
                          {passwordBusy ? 'Configuration…' : 'Définir / régénérer'}
                        </button>
                      </div>

                      {passwordMessage ? <div style={passwordMessage.includes('impossible') || passwordMessage.includes('requis') ? errorBox : successBox}>{passwordMessage}</div> : null}
                    </div>
                  </div>

                  <OptionGrid title="Modules activés pour le partenaire" options={moduleOptions} selected={form.enabledModules} onToggle={(value) => toggleArray('enabledModules', value)} disabled={readonly} />
                </StepSection>
              ) : null}

              {activeStep === 'billing' ? (
                <StepSection title="Billing, compte & contrôle commercial" eyebrowText="MONÉTISATION TRAININGHUB">
                  <div style={formGrid}>
                    <SelectField disabled={readonly} label="Plan partenaire" value={form.plan} onChange={(value) => patch({ plan: value })} options={['Aucun plan', 'Activation', 'Growth', 'Premium', 'Enterprise', 'Custom']} />
                    <SelectField disabled={readonly} label="Modèle de facturation" value={form.billingModel} onChange={(value) => patch({ billingModel: value })} options={['account_subscription', 'training_credit_wallet', 'one_shot_activation', 'hybrid_subscription_credits', 'custom_enterprise']} />
                    <SelectField disabled={readonly} label="Type compte billing" value={form.accountType} onChange={(value) => patch({ accountType: value })} options={['partner_training_account', 'multi_site_partner_account', 'internal_account', 'enterprise_network_account']} />
                    <SelectField disabled={readonly} label="Période billing" value={form.billingPeriod} onChange={(value) => patch({ billingPeriod: value })} options={['monthly', 'quarterly', 'yearly', 'one_shot']} />
                    <SelectField disabled={readonly} label="Devise" value={form.currency} onChange={(value) => patch({ currency: value })} options={['MAD', 'EUR', 'USD']} />
                    <SelectField disabled={readonly} label="Paiement" value={form.paymentTerms} onChange={(value) => patch({ paymentTerms: value })} options={['due_7', 'due_15', 'due_30', 'advance_payment', 'manual_agreement']} />
                    <SelectField disabled={readonly} label="Politique facture" value={form.invoicePolicy} onChange={(value) => patch({ invoicePolicy: value })} options={['manual_review_before_issue', 'auto_issue_after_order', 'deposit_then_balance', 'invoice_after_delivery']} />
                    <SelectField disabled={readonly} label="Renouvellement" value={form.renewalPolicy} onChange={(value) => patch({ renewalPolicy: value })} options={['manual_review_30_days_before_end', 'auto_prepare_renewal_quote', 'refresh_required_before_renewal', 'executive_review']} />
                    <Field readonly={readonly} label="MRR MAD" value={form.monthlyAmount} onChange={(value) => patch({ monthlyAmount: value })} />
                  </div>
                </StepSection>
              ) : null}

              {activeStep === 'offer' ? (
                <StepSection title="Offre & services" eyebrowText="PACKAGING COMMERCIAL">
                  <div style={formGrid}>
                    <Field readonly={readonly} label="Titre offre" value={form.offerTitle} onChange={(value) => patch({ offerTitle: value })} />
                    <Field readonly={readonly} label="Montant offre MAD" value={form.offerAmount} onChange={(value) => patch({ offerAmount: value })} />
                    <Field readonly={readonly} label="Participants / crédits" value={form.participants} onChange={(value) => patch({ participants: value })} />
                  </div>
                  <div style={infoPanel}>
                    <strong>Chaîne commerciale</strong>
                    <p>Les offres, commandes, factures et crédits restent lues depuis les tables réelles du partenaire. Les paramètres ci-dessus servent de configuration de dossier et de pilotage.</p>
                  </div>
                </StepSection>
              ) : null}

              {activeStep === 'delivery' ? (
                <StepSection title="Delivery & sessions" eyebrowText="OPÉRATIONS FORMATION">
                  <div style={formGrid}>
                    <SelectField disabled={readonly} label="Mode" value={form.mode} onChange={(value) => patch({ mode: value })} options={['onsite', 'online', 'hybrid']} />
                    <Field readonly={readonly} label="Lieu" value={form.location} onChange={(value) => patch({ location: value })} />
                    <SelectField disabled={readonly} label="Checklist delivery" value={form.checklistTemplate} onChange={(value) => patch({ checklistTemplate: value })} options={['standard_training_delivery', 'onsite_partner_delivery', 'online_session_delivery', 'certificate_ready_delivery', 'enterprise_governance_delivery']} />
                  </div>
                  <div style={deliveryFlow}>
                    <FlowBox title="Sessions" text={`${counts.sessions || 0} session(s) synchronisée(s)`} />
                    <FlowBox title="Participants" text={`${counts.participants || 0} participant(s) réel(s)`} />
                    <FlowBox title="Certificats" text={`${counts.certificates || 0} certificat(s) émis`} />
                  </div>
                </StepSection>
              ) : null}

              {activeStep === 'proofs' ? (
                <StepSection title="Preuves, SLA & risques" eyebrowText="GOUVERNANCE PARTENAIRE">
                  <div style={formGrid}>
                    <SelectField disabled={readonly} label="Visibilité documents" value={form.proofVisibility} onChange={(value) => patch({ proofVisibility: value })} options={['partner_portal', 'internal_only', 'partner_and_internal', 'executive_only']} />
                    <SelectField disabled={readonly} label="SLA" value={form.slaPolicy} onChange={(value) => patch({ slaPolicy: value })} options={['standard_48h', 'priority_24h', 'enterprise_8h', 'manual_sla']} />
                    <SelectField disabled={readonly} label="Priorité" value={form.priority} onChange={(value) => patch({ priority: value })} options={['low', 'normal', 'high', 'urgent']} />
                    <SelectField disabled={readonly} label="Risque" value={form.risk} onChange={(value) => patch({ risk: value })} options={['Faible', 'À surveiller', 'Élevé']} />
                    <Field readonly={readonly} label="Health score" value={form.health} onChange={(value) => patch({ health: value })} />
                  </div>
                  <OptionGrid title="Kits de preuves" options={proofOptions} selected={form.selectedKits} onToggle={(value) => toggleArray('selectedKits', value)} disabled={readonly} />
                </StepSection>
              ) : null}

              {activeStep === 'review' ? (
                <StepSection title="Validation dossier" eyebrowText="REVIEW & COMMIT">
                  <div style={reviewGrid}>
                    <ReviewCard title="Dossier" value={form.name} note={`${form.city} · ${form.segment}`} />
                    <ReviewCard title="Accès portail" value={accessReady ? 'Configuré' : 'À configurer'} note={form.contactEmail || 'Email requis'} />
                    <ReviewCard title="Mot de passe" value={form.passwordStatus === 'temporary_password_set' ? 'Défini' : 'À définir'} note={form.passwordLastResetAt || 'Jamais réinitialisé'} />
                    <ReviewCard title="RBAC" value={form.accessRole} note={`${form.enabledModules.length} module(s)`} />
                    <ReviewCard title="Billing" value={form.billingModel} note={`${form.paymentTerms} · ${form.invoicePolicy}`} />
                    <ReviewCard title="Plan" value={form.plan} note={`MRR ${money(form.monthlyAmount)}`} />
                    <ReviewCard title="Sessions" value={counts.sessions || 0} note="delivery" />
                    <ReviewCard title="Preuves" value={counts.certificates || counts.documents || 0} note={form.proofVisibility} />
                  </div>
                </StepSection>
              ) : null}
            </section>

            <footer style={footer}>
              <button style={secondaryButton} onClick={props.onClose}>Fermer</button>
              <div style={footerCenter}>
                {steps.map((step) => <button key={step.key} style={step.key === activeStep ? dotActive : dot} onClick={() => setActiveStep(step.key)} />)}
              </div>
              {!editMode ? (
                <button style={primaryButton} onClick={() => setEditMode(true)}>Modifier ce dossier</button>
              ) : (
                <button style={primaryButton} disabled={busy} onClick={save}>{busy ? 'Sauvegarde…' : 'Enregistrer modifications'}</button>
              )}
            </footer>
          </main>
        </div>
      </section>
    </div>
  )
}

function Score({ label, value, tone }: { label: string; value: ReactNode; tone: string }) {
  const style = tone === 'green' ? scoreGreen : tone === 'violet' ? scoreViolet : tone === 'cyan' ? scoreCyan : scoreBlue
  return (
    <article style={scoreCard}>
      <span style={style}>●</span>
      <div><p>{label}</p><strong>{value}</strong></div>
    </article>
  )
}

function StepSection({ title, eyebrowText, children }: { title: string; eyebrowText: string; children: ReactNode }) {
  return (
    <div style={stepSection}>
      <span style={eyebrow}>{eyebrowText}</span>
      <h3>{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, readonly, wide }: { label: string; value: string; onChange: (value: string) => void; readonly?: boolean; wide?: boolean }) {
  return (
    <label style={wide ? fieldWide : field}>
      <span>{label}</span>
      <input style={readonly ? inputReadonly : inputStyle} value={value} readOnly={readonly} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function SelectField({ label, value, onChange, options, disabled }: { label: string; value: string; onChange: (value: string) => void; options: string[]; disabled?: boolean }) {
  return (
    <label style={field}>
      <span>{label}</span>
      <select style={disabled ? inputReadonly : inputStyle} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

function ReadOnlyBox({ label, value }: { label: string; value: ReactNode }) {
  return <div style={readOnlyBox}><span>{label}</span><strong>{value}</strong></div>
}

function OptionGrid({ title, options, selected, onToggle, disabled }: { title: string; options: string[][]; selected: string[]; onToggle: (value: string) => void; disabled?: boolean }) {
  return (
    <div style={optionBlock}>
      <strong>{title}</strong>
      <div style={optionGrid}>
        {options.map(([value, label]) => (
          <button key={value} type="button" disabled={disabled} style={selected.includes(value) ? optionActive : optionButton} onClick={() => onToggle(value)}>
            <span>{selected.includes(value) ? '✓' : '+'}</span>
            <b>{label}</b>
            <small>{value}</small>
          </button>
        ))}
      </div>
    </div>
  )
}

function Metric({ title, value, note }: { title: string; value: ReactNode; note: string }) {
  return <div style={metricBox}><span>{title}</span><strong>{value}</strong><small>{note}</small></div>
}

function FlowBox({ title, text }: { title: string; text: string }) {
  return <div style={flowBox}><strong>{title}</strong><span>{text}</span></div>
}

function ReviewCard({ title, value, note }: { title: string; value: ReactNode; note: string }) {
  return <div style={reviewCard}><span>{title}</span><strong>{value}</strong><small>{note}</small></div>
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, zIndex: 9999, padding: 8, display: 'grid', placeItems: 'center', background: 'rgba(8,18,38,.58)', backdropFilter: 'blur(14px)', overflow: 'hidden' }
const modal: CSSProperties = { position: 'relative', overflow: 'hidden', width: 'calc(100vw - 16px)', maxWidth: 'none', height: 'calc(100dvh - 16px)', maxHeight: 'calc(100dvh - 16px)', display: 'grid', gridTemplateRows: 'auto auto minmax(0,1fr)', gap: 12, padding: 20, borderRadius: 34, background: 'linear-gradient(135deg,#ffffff 0%,#f8fbff 54%,#eef6ff 100%)', border: '1px solid rgba(221,231,246,.96)', boxShadow: '0 50px 120px rgba(5,16,36,.34)' }
const ambientBlue: CSSProperties = { position: 'absolute', right: -160, top: -220, width: 580, height: 580, borderRadius: '50%', background: 'radial-gradient(circle, rgba(17,105,255,.16), transparent 64%)' }
const ambientMint: CSSProperties = { position: 'absolute', left: -180, bottom: -240, width: 540, height: 540, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,214,201,.14), transparent 64%)' }
const header: CSSProperties = { position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, padding: 20, borderRadius: 28, background: 'rgba(255,255,255,.86)', border: '1px solid #dce7f6', boxShadow: '0 18px 44px rgba(17,42,88,.07)', backdropFilter: 'blur(18px)' }
const eyebrow: CSSProperties = { color: '#1169ff', fontWeight: 950, letterSpacing: '.16em', fontSize: 12, textTransform: 'uppercase' }
const headerActions: CSSProperties = { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }
const readinessPill: CSSProperties = { minWidth: 120, display: 'grid', gap: 4, padding: 12, color: '#fff', borderRadius: 18, background: 'linear-gradient(135deg,#073b9d,#1169ff)', boxShadow: '0 16px 34px rgba(17,105,255,.24)' }
const closeButton: CSSProperties = { width: 48, height: 48, display: 'grid', placeItems: 'center', borderRadius: 16, border: '1px solid #d9e5f6', background: '#fff', color: '#0b1733', fontSize: 26, fontWeight: 950, cursor: 'pointer' }
const primaryButton: CSSProperties = { border: '1px solid #1169ff', color: '#fff', background: 'linear-gradient(135deg,#073b9d,#1169ff)', borderRadius: 16, padding: '13px 18px', fontWeight: 950, boxShadow: '0 16px 30px rgba(17,105,255,.24)', cursor: 'pointer' }
const secondaryButton: CSSProperties = { border: '1px solid #d9e5f6', color: '#16406f', background: '#fff', borderRadius: 16, padding: '12px 15px', fontWeight: 950, cursor: 'pointer' }
const dangerSoftButton: CSSProperties = { border: '1px solid #fecdd3', color: '#be123c', background: '#fff1f2', borderRadius: 16, padding: '12px 15px', fontWeight: 950, cursor: 'pointer' }
const dangerButton: CSSProperties = { border: '1px solid #b91c1c', color: '#fff', background: 'linear-gradient(135deg,#991b1b,#dc2626)', borderRadius: 16, padding: '12px 15px', fontWeight: 950, cursor: 'pointer' }
const tagRow: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }
const tagBase: CSSProperties = { width: 'fit-content', padding: '8px 11px', borderRadius: 999, fontSize: 12, fontWeight: 950 }
const greenTag: CSSProperties = { ...tagBase, color: '#047857', background: '#ecfdf5', border: '1px solid #bbf7d0' }
const redTag: CSSProperties = { ...tagBase, color: '#be123c', background: '#fff1f2', border: '1px solid #fecdd3' }
const orangeTag: CSSProperties = { ...tagBase, color: '#c2410c', background: '#fff7ed', border: '1px solid #fed7aa' }
const blueTag: CSSProperties = { ...tagBase, color: '#0f57e2', background: '#eff6ff', border: '1px solid #bfdbfe' }
const slateTag: CSSProperties = { ...tagBase, color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0' }
const successBox: CSSProperties = { position: 'relative', zIndex: 1, padding: 12, borderRadius: 16, background: '#ecfdf5', color: '#047857', border: '1px solid #bbf7d0', fontWeight: 900 }
const errorBox: CSSProperties = { position: 'relative', zIndex: 1, padding: 12, borderRadius: 16, background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3', fontWeight: 900 }
const body: CSSProperties = { position: 'relative', zIndex: 1, minHeight: 0, height: '100%', overflow: 'hidden', display: 'grid', gridTemplateColumns: 'minmax(360px,410px) minmax(0,1fr)', gap: 18 }
const leftRail: CSSProperties = { minHeight: 0, height: '100%', maxHeight: '100%', overflowY: 'auto', overflowX: 'hidden', display: 'grid', alignContent: 'start', gap: 16, paddingRight: 6, scrollbarGutter: 'stable' }
const miniCard: CSSProperties = { display: 'grid', placeItems: 'center', textAlign: 'center', gap: 9, padding: 20, borderRadius: 28, color: '#fff', background: 'radial-gradient(circle at 20% 0%, rgba(110,231,183,.28), transparent 34%), linear-gradient(135deg,#09265e,#1169ff)', boxShadow: '0 26px 60px rgba(17,105,255,.22)' }
const avatar: CSSProperties = { width: 64, height: 64, display: 'grid', placeItems: 'center', borderRadius: 22, background: 'rgba(255,255,255,.18)', fontWeight: 950, fontSize: 24 }
const progressTrack: CSSProperties = { width: '100%', height: 10, borderRadius: 99, background: 'rgba(255,255,255,.22)', overflow: 'hidden' }
const stepNav: CSSProperties = { display: 'grid', gap: 8 }
const stepButton: CSSProperties = { minHeight: 54, display: 'grid', gridTemplateColumns: '34px 1fr 34px', alignItems: 'center', gap: 10, padding: '0 12px', borderRadius: 17, border: '1px solid #dce7f6', color: '#425872', background: '#fff', textAlign: 'left', fontWeight: 900, cursor: 'pointer' }
const stepActive: CSSProperties = { ...stepButton, color: '#fff', background: 'linear-gradient(135deg,#073b9d,#1169ff)', boxShadow: '0 18px 34px rgba(17,105,255,.22)' }
const modeBox: CSSProperties = { padding: 16, borderRadius: 22, background: '#fff', border: '1px solid #dce7f6', color: '#243955', fontWeight: 800 }
const content: CSSProperties = { minHeight: 0, height: '100%', overflow: 'hidden', display: 'grid', gridTemplateRows: 'auto minmax(0,1fr) auto', gap: 14, paddingRight: 6 }
const topCards: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(220px,1fr))', gap: 12, minHeight: 112 }
const scoreCard: CSSProperties = { minHeight: 112, display: 'grid', gridTemplateColumns: '52px 1fr', gap: 12, alignItems: 'center', padding: 16, borderRadius: 22, background: '#fff', border: '1px solid #dce7f6', boxShadow: '0 16px 32px rgba(17,42,88,.055)' }
const scoreIcon: CSSProperties = { width: 50, height: 50, display: 'grid', placeItems: 'center', borderRadius: 18 }
const scoreBlue: CSSProperties = { ...scoreIcon, background: '#e8f1ff', color: '#1169ff' }
const scoreGreen: CSSProperties = { ...scoreIcon, background: '#ecfdf5', color: '#059669' }
const scoreViolet: CSSProperties = { ...scoreIcon, background: '#f5f3ff', color: '#7c3aed' }
const scoreCyan: CSSProperties = { ...scoreIcon, background: '#ecfeff', color: '#0891b2' }
const mainCard: CSSProperties = { minHeight: 0, height: '100%', maxHeight: '100%', overflowY: 'auto', overflowX: 'hidden', padding: 24, borderRadius: 28, background: '#fff', border: '1px solid #dce7f6', boxShadow: '0 18px 38px rgba(17,42,88,.055)', scrollBehavior: 'smooth', scrollbarGutter: 'stable' }
const stepSection: CSSProperties = { display: 'grid', alignContent: 'start', gap: 18 }
const formGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }
const field: CSSProperties = { display: 'grid', gap: 8, fontWeight: 900, color: '#243955' }
const fieldWide: CSSProperties = { ...field, gridColumn: 'span 2' }
const inputStyle: CSSProperties = { minHeight: 48, border: '1px solid #d9e5f6', borderRadius: 15, padding: '0 13px', color: '#0b1733', background: '#fbfdff', fontWeight: 850 }
const inputReadonly: CSSProperties = { ...inputStyle, color: '#334155', background: '#f8fbff', cursor: 'default' }
const readOnlyBox: CSSProperties = { minHeight: 72, display: 'grid', gap: 7, padding: 13, borderRadius: 16, background: '#f8fbff', border: '1px solid #dce7f6', color: '#243955', fontWeight: 900 }
const accessHero: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', padding: 18, borderRadius: 24, background: 'linear-gradient(135deg,#eff6ff,#ecfeff)', border: '1px solid #dbeafe' }
const passwordPanel: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,.85fr) minmax(0,1.15fr)', gap: 18, padding: 18, borderRadius: 24, background: 'linear-gradient(135deg,#fff,#f8fbff)', border: '1px solid #dce7f6', boxShadow: '0 18px 38px rgba(17,42,88,.055)' }
const passwordBox: CSSProperties = { display: 'grid', gap: 12 }
const passwordActions: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10 }
const optionBlock: CSSProperties = { display: 'grid', gap: 12 }
const optionGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(190px,1fr))', gap: 10 }
const optionButton: CSSProperties = { minHeight: 78, display: 'grid', alignContent: 'center', gap: 4, padding: 12, borderRadius: 18, border: '1px solid #dce7f6', background: '#f8fbff', color: '#243955', textAlign: 'left', cursor: 'pointer' }
const optionActive: CSSProperties = { ...optionButton, color: '#047857', background: '#ecfdf5', border: '1px solid #bbf7d0' }
const overviewGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 }
const metricBox: CSSProperties = { minHeight: 110, display: 'grid', alignContent: 'center', gap: 7, padding: 16, borderRadius: 20, background: '#f8fbff', border: '1px solid #e1e9f6' }
const chainGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(150px,1fr))', gap: 10 }
const chainBox: CSSProperties = { minHeight: 76, display: 'grid', placeItems: 'center', textAlign: 'center', borderRadius: 18, background: '#f8fbff', color: '#16406f', border: '1px solid #dce7f6', fontWeight: 950 }
const infoPanel: CSSProperties = { padding: 16, borderRadius: 20, background: '#f8fbff', border: '1px solid #e1e9f6', color: '#243955' }
const deliveryFlow: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(260px,1fr))', gap: 12 }
const flowBox: CSSProperties = { minHeight: 110, display: 'grid', gap: 8, padding: 16, borderRadius: 20, background: '#f8fbff', border: '1px solid #e1e9f6' }
const reviewGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(240px,1fr))', gap: 12 }
const reviewCard: CSSProperties = { minHeight: 112, display: 'grid', alignContent: 'center', gap: 7, padding: 16, borderRadius: 20, background: '#f8fbff', border: '1px solid #e1e9f6' }
const footer: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 14, borderRadius: 24, background: 'rgba(255,255,255,.96)', border: '1px solid #dce7f6', boxShadow: '0 -12px 30px rgba(17,42,88,.055)' }
const footerCenter: CSSProperties = { display: 'flex', gap: 7, alignItems: 'center' }
const dot: CSSProperties = { width: 10, height: 10, borderRadius: 999, border: 0, background: '#cbd8ec' }
const dotActive: CSSProperties = { ...dot, width: 30, background: '#1169ff' }
