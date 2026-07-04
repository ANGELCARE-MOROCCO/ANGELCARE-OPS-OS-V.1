'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useMemo, useState } from 'react'

type Props = {
  onClose: () => void
  onCreated?: (payload?: unknown) => void | Promise<void>
}

type Preset = {
  key: string
  label: string
  note: string
  plan: string
  amount: string
  monthlyAmount: string
  participants: string
  services: string[]
  modules: string[]
  kits: string[]
}

const presets: Preset[] = [
  {
    key: 'activation',
    label: 'Activation partenaire',
    note: 'Créer dossier + offre + accès + première session + kit démarrage.',
    plan: 'Activation',
    amount: '7200',
    monthlyAmount: '0',
    participants: '10',
    services: ['training_activation_pack', 'partner_portal_setup', 'starter_proof_kit'],
    modules: ['formations', 'refresh', 'preuves', 'demandes'],
    kits: ['starter_kit', 'partner_welcome_pack'],
  },
  {
    key: 'growth',
    label: 'Growth annuel',
    note: 'Abonnement + crédits formation + refresh annuel + reporting.',
    plan: 'Growth',
    amount: '18500',
    monthlyAmount: '2500',
    participants: '24',
    services: ['training_credit_wallet', 'annual_refresh_cycle', 'premium_reporting', 'certificate_pack'],
    modules: ['formations', 'team', 'certificates', 'billing', 'documents', 'requests'],
    kits: ['starter_kit', 'certificate_branding_kit', 'quarterly_report_pack'],
  },
  {
    key: 'premium',
    label: 'Premium multi-site',
    note: 'Compte partenaire avancé, portefeuille multi-site, preuves premium et SLA renforcé.',
    plan: 'Premium',
    amount: '42000',
    monthlyAmount: '6500',
    participants: '60',
    services: ['multi_site_training_program', 'premium_proof_pack', 'priority_sla', 'management_dashboard'],
    modules: ['formations', 'team', 'certificates', 'billing', 'documents', 'requests', 'analytics', 'renewal'],
    kits: ['starter_kit', 'premium_proof_pack', 'board_report_pack', 'renewal_pack'],
  },
  {
    key: 'enterprise',
    label: 'Enterprise réseau',
    note: 'Dossier stratégique, accès contrôlés, gouvernance, analytics et renouvellement.',
    plan: 'Enterprise',
    amount: '95000',
    monthlyAmount: '14000',
    participants: '120',
    services: ['enterprise_partner_account', 'network_training_governance', 'advanced_analytics', 'executive_reporting'],
    modules: ['formations', 'team', 'certificates', 'billing', 'documents', 'requests', 'analytics', 'renewal', 'governance'],
    kits: ['starter_kit', 'premium_proof_pack', 'executive_report_pack', 'audit_readiness_pack'],
  },
]

const steps = [
  { key: 'preset', label: 'Preset business', icon: '✦' },
  { key: 'identity', label: 'Identité établissement', icon: '◉' },
  { key: 'contact', label: 'Contact & accès', icon: '●' },
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

const serviceOptions = [
  ['partner_portal_setup', 'Configuration portail partenaire'],
  ['training_activation_pack', 'Pack activation formation'],
  ['training_credit_wallet', 'Wallet crédits formation'],
  ['annual_refresh_cycle', 'Refresh annuel'],
  ['certificate_pack', 'Pack certificats'],
  ['starter_proof_kit', 'Kit preuves standard'],
  ['premium_proof_pack', 'Preuves premium'],
  ['priority_sla', 'SLA prioritaire'],
  ['premium_reporting', 'Reporting premium'],
  ['management_dashboard', 'Dashboard direction'],
  ['multi_site_training_program', 'Programme multi-site'],
  ['advanced_analytics', 'Analytics avancés'],
  ['executive_reporting', 'Reporting exécutif'],
  ['network_training_governance', 'Gouvernance réseau'],
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

function formatMoney(value: string) {
  const n = Number(value || 0)
  if (!Number.isFinite(n)) return '0 MAD'
  if (n >= 1000) return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 1 }).format(n / 1000)} K MAD`
  return `${new Intl.NumberFormat('fr-MA').format(n)} MAD`
}

export default function CreatePartnerDossierMegaModal({ onClose, onCreated }: Props) {
  const [activeStep, setActiveStep] = useState('preset')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [created, setCreated] = useState<Record<string, any> | null>(null)

  const [form, setForm] = useState({
    preset: 'activation',
    name: '',
    legalName: '',
    city: 'Rabat',
    address: '',
    website: '',
    segment: 'partner_school',
    partnerType: 'school_partner',
    owner: 'Non assigné',
    health: '76',

    contactFullName: '',
    contactEmail: '',
    contactPhone: '',
    contactFunction: 'Direction partenaire',
    accessRole: 'partner_admin',
    accessLevel: 'standard_partner_access',
    portalPolicy: 'restricted_partner_scope',
    temporaryPassword: '20262026',

    plan: 'Activation',
    billingModel: 'account_subscription',
    accountType: 'partner_training_account',
    billingPeriod: 'monthly',
    currency: 'MAD',
    paymentTerms: 'due_15',
    invoicePolicy: 'manual_review_before_issue',
    renewalPolicy: 'manual_review_30_days_before_end',
    monthlyAmount: '0',
    setupFee: '7200',
    createSubscription: false,
    creditWalletEnabled: true,
    creditQuantity: '10',
    creditAmount: '7200',
    creditType: 'training_course',
    refreshEnabled: true,

    createInitialOffer: true,
    offerTitle: 'Offre TrainingHub Activation',
    offerDescription: 'Activation partenaire, crédits formation, refresh, preuves et reporting.',
    offerAmount: '7200',
    participants: '10',
    packageType: 'training_activation_pack',
    selectedServices: ['training_activation_pack', 'partner_portal_setup', 'starter_proof_kit'],

    createFirstSession: true,
    sessionTitle: 'Session TrainingHub de lancement',
    mode: 'onsite',
    location: 'Site partenaire',
    maxParticipants: '10',
    checklistTemplate: 'standard_training_delivery',

    createStarterKit: true,
    selectedKits: ['starter_kit', 'partner_welcome_pack'],
    proofVisibility: 'partner_portal',
    slaPolicy: 'standard_48h',
    priority: 'high',
    riskLevel: 'Faible',
    firstRequestType: 'onboarding',
    firstRequestTitle: 'Finaliser onboarding partenaire TrainingHub',
    welcomeNotificationTitle: 'Bienvenue sur AngelCare TrainingHub',
    welcomeNotificationBody: 'Votre dossier partenaire est créé. Votre référent AngelCare finalisera l’activation.',

    enabledModules: ['formations', 'refresh', 'preuves', 'demandes'],
  })

  const activeIndex = steps.findIndex((step) => step.key === activeStep)
  const nextStep = steps[Math.min(steps.length - 1, activeIndex + 1)]?.key
  const previousStep = steps[Math.max(0, activeIndex - 1)]?.key

  const readiness = useMemo(() => {
    const checks = [
      Boolean(form.name.trim()),
      Boolean(form.city.trim()),
      Boolean(form.segment.trim()),
      Boolean(form.owner.trim()),
      Boolean(form.plan.trim()),
      Boolean(form.billingModel.trim()),
      Boolean(form.paymentTerms.trim()),
      Boolean(form.invoicePolicy.trim()),
      form.enabledModules.length > 0,
      form.selectedServices.length > 0,
      Number(form.offerAmount || 0) >= 0,
      Boolean(form.createInitialOffer || form.createFirstSession || form.createStarterKit),
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }, [form])

  const creationChain = useMemo(() => [
    { label: 'Dossier', active: Boolean(form.name.trim()) },
    { label: 'Compte billing', active: true },
    { label: 'Accès portail', active: Boolean(form.contactEmail.trim()) },
    { label: 'RBAC modules', active: form.enabledModules.length > 0 },
    { label: 'Offre', active: form.createInitialOffer },
    { label: 'Abonnement', active: form.createSubscription || form.billingModel === 'account_subscription' },
    { label: 'Crédits', active: form.creditWalletEnabled },
    { label: 'Session', active: form.createFirstSession },
    { label: 'Preuves', active: form.createStarterKit || form.selectedKits.length > 0 },
    { label: 'SLA', active: Boolean(form.slaPolicy) },
  ], [form])

  function patch(next: Partial<typeof form>) {
    setForm((current) => ({ ...current, ...next }))
  }

  function toggleArray(key: 'selectedServices' | 'selectedKits' | 'enabledModules', value: string) {
    setForm((current) => {
      const currentValues = current[key]
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value]
      return { ...current, [key]: nextValues }
    })
  }

  function applyPreset(preset: Preset) {
    patch({
      preset: preset.key,
      plan: preset.plan,
      offerAmount: preset.amount,
      setupFee: preset.amount,
      monthlyAmount: preset.monthlyAmount,
      participants: preset.participants,
      maxParticipants: preset.participants,
      creditQuantity: preset.participants,
      creditAmount: preset.amount,
      selectedServices: preset.services,
      enabledModules: preset.modules,
      selectedKits: preset.kits,
      offerTitle: `${preset.plan} TrainingHub`,
      createSubscription: Number(preset.monthlyAmount) > 0,
      creditWalletEnabled: true,
      createInitialOffer: true,
      createStarterKit: true,
      createFirstSession: true,
    })
  }

  async function submit() {
    setMessage('')
    setCreated(null)

    if (!form.name.trim()) {
      setActiveStep('identity')
      setMessage('Nom établissement requis.')
      return
    }

    setBusy(true)
    try {
      const response = await fetch('/api/traininghub/internal/partner-dossier/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner: {
            name: form.name,
            legalName: form.legalName,
            city: form.city,
            address: form.address,
            website: form.website,
            segment: form.segment,
            partnerType: form.partnerType,
            stage: 'onboarding',
            status: 'active',
          },
          contact: {
            fullName: form.contactFullName,
            email: form.contactEmail,
            phone: form.contactPhone,
            function: form.contactFunction,
          },
          access: {
            role: form.accessRole,
            accessLevel: form.accessLevel,
            portalPolicy: form.portalPolicy,
            password: form.temporaryPassword,
            enabledModules: form.enabledModules,
            permissions: form.enabledModules.map((moduleKey) => `traininghub.${moduleKey}.read`),
          },
          commercial: {
            owner: form.owner,
            health: form.health,
            plan: form.plan,
            monthlyAmount: form.monthlyAmount,
            createSubscription: form.createSubscription,
            subscriptionStatus: 'active',
          },
          billing: {
            model: form.billingModel,
            accountType: form.accountType,
            billingPeriod: form.billingPeriod,
            currency: form.currency,
            paymentTerms: form.paymentTerms,
            invoicePolicy: form.invoicePolicy,
            renewalPolicy: form.renewalPolicy,
            setupFee: form.setupFee,
            creditWalletEnabled: form.creditWalletEnabled,
            creditQuantity: form.creditQuantity,
            creditAmount: form.creditAmount,
            creditType: form.creditType,
            creditPolicy: 'consume_by_session_participation',
            refreshEnabled: form.refreshEnabled,
          },
          offer: {
            createInitialOffer: form.createInitialOffer,
            title: form.offerTitle,
            description: form.offerDescription,
            amount: form.offerAmount,
            participants: form.participants,
            packageType: form.packageType,
            selectedServices: form.selectedServices,
            status: 'draft',
          },
          delivery: {
            createFirstSession: form.createFirstSession,
            sessionTitle: form.sessionTitle,
            mode: form.mode,
            location: form.location,
            maxParticipants: form.maxParticipants,
            checklistTemplate: form.checklistTemplate,
          },
          governance: {
            riskLevel: form.riskLevel,
            health: form.health,
            slaPolicy: form.slaPolicy,
            priority: form.priority,
            firstRequestType: form.firstRequestType,
            firstRequestTitle: form.firstRequestTitle,
            welcomeNotificationTitle: form.welcomeNotificationTitle,
            welcomeNotificationBody: form.welcomeNotificationBody,
          },
          proofs: {
            createStarterKit: form.createStarterKit,
            selectedKits: form.selectedKits,
            visibility: form.proofVisibility,
          },
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        setMessage(payload?.message || payload?.error || 'Création non finalisée.')
        return
      }

      setCreated(payload.data)
      setMessage('Dossier partenaire créé et synchronisé avec les systèmes TrainingHub.')
      await onCreated?.(payload.data)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={overlay}>
      <section style={modal}>
        <div style={ambientOne} />
        <div style={ambientTwo} />

        <header style={header}>
          <div>
            <span style={eyebrow}>NOUVEAU DOSSIER PARTENAIRE · TRAININGHUB 360</span>
            <h2>Créer un partenaire complet</h2>
            <p>Création structurée : dossier, billing, accès contrôlés, offres, crédits, sessions, preuves, SLA et renouvellement.</p>
            <small style={wideScrollMarker}>WIDE SCROLL V2 ACTIVE</small>
          </div>
          <div style={headerActions}>
            <div style={readinessPill}><span>Readiness</span><strong>{readiness}/100</strong></div>
            <button style={closeButton} onClick={onClose}>×</button>
          </div>
        </header>

        {message ? <div style={created ? successMessage : warningMessage}>{message}</div> : null}

        <div style={body}>
          <aside style={leftRail}>
            <div style={miniDossier}>
              <div style={avatar}>{form.name.slice(0, 1).toUpperCase() || 'P'}</div>
              <strong>{form.name || 'Nouveau partenaire'}</strong>
              <span>{form.city} · {form.plan}</span>
              <div style={progressTrack}><i style={{ width: `${readiness}%` }} /></div>
              <small>Dossier {readiness >= 85 ? 'prêt à créer' : 'à compléter'}</small>
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

            <div style={commercialBox}>
              <span style={eyebrow}>MODÈLE APPLIQUÉ</span>
              <p>Compte partenaire + abonnement + crédits + refresh + preuves premium. Pas de commission par vente et pas de gestion TVA marketplace.</p>
            </div>
          </aside>

          <main style={content}>
            <section style={topCards}>
              <Score label="Plan" value={form.plan} tone="blue" />
              <Score label="Setup / offre" value={formatMoney(form.offerAmount)} tone="green" />
              <Score label="MRR" value={formatMoney(form.monthlyAmount)} tone="violet" />
              <Score label="Modules" value={form.enabledModules.length} tone="cyan" />
            </section>

            <section style={mainCard}>
              {activeStep === 'preset' ? (
                <StepSection title="Presets préintégrés" eyebrowText="BUSINESS CONFIGURATION">
                  <div style={presetGrid}>
                    {presets.map((preset) => (
                      <button key={preset.key} style={form.preset === preset.key ? presetActive : presetCard} onClick={() => applyPreset(preset)}>
                        <span>{preset.plan}</span>
                        <strong>{preset.label}</strong>
                        <p>{preset.note}</p>
                        <em>{formatMoney(preset.amount)} · {preset.participants} crédits</em>
                      </button>
                    ))}
                  </div>
                  <div style={presetExplain}>
                    <strong>Objectif</strong>
                    <p>Le formulaire ne part plus de zéro. Il propose des modèles prêts pour la vraie monétisation TrainingHub : activation, abonnement, crédits formation, refresh annuel, preuves premium, reporting et gouvernance.</p>
                  </div>
                </StepSection>
              ) : null}

              {activeStep === 'identity' ? (
                <StepSection title="Identité établissement" eyebrowText="BASE DOSSIER">
                  <div style={formGrid}>
                    <Field label="Nom établissement" value={form.name} onChange={(value) => patch({ name: value })} placeholder="Crèche / école partenaire" required />
                    <Field label="Raison sociale" value={form.legalName} onChange={(value) => patch({ legalName: value })} placeholder="Nom légal" />
                    <Field label="Ville" value={form.city} onChange={(value) => patch({ city: value })} />
                    <Field label="Adresse" value={form.address} onChange={(value) => patch({ address: value })} wide />
                    <Field label="Site web" value={form.website} onChange={(value) => patch({ website: value })} />
                    <SelectField label="Segment" value={form.segment} onChange={(value) => patch({ segment: value })} options={['partner_school', 'kindergarten', 'nursery_group', 'training_partner', 'angelcare_internal']} />
                    <SelectField label="Type partenaire" value={form.partnerType} onChange={(value) => patch({ partnerType: value })} options={['school_partner', 'network_partner', 'academy_partner', 'internal_partner']} />
                    <Field label="Owner interne AngelCare" value={form.owner} onChange={(value) => patch({ owner: value })} />
                  </div>
                </StepSection>
              ) : null}

              {activeStep === 'contact' ? (
                <StepSection title="Contact principal & accès contrôlé" eyebrowText="PORTAIL PARTENAIRE + RBAC">
                  <div style={formGrid}>
                    <Field label="Nom complet" value={form.contactFullName} onChange={(value) => patch({ contactFullName: value })} placeholder="Direction / référent partenaire" />
                    <Field label="Email professionnel" value={form.contactEmail} onChange={(value) => patch({ contactEmail: value })} placeholder="email@partenaire.ma" />
                    <Field label="Téléphone" value={form.contactPhone} onChange={(value) => patch({ contactPhone: value })} />
                    <Field label="Fonction" value={form.contactFunction} onChange={(value) => patch({ contactFunction: value })} />
                    <SelectField label="Rôle portail" value={form.accessRole} onChange={(value) => patch({ accessRole: value })} options={['partner_admin', 'partner_director', 'training_coordinator', 'billing_contact', 'readonly_auditor']} />
                    <SelectField label="Niveau d’accès" value={form.accessLevel} onChange={(value) => patch({ accessLevel: value })} options={['restricted_partner_scope', 'standard_partner_access', 'billing_only_access', 'training_only_access', 'executive_partner_access']} />
                    <SelectField label="Politique portail" value={form.portalPolicy} onChange={(value) => patch({ portalPolicy: value })} options={['restricted_partner_scope', 'own_org_only', 'billing_hidden', 'proofs_readonly', 'full_partner_visibility']} />
                    <Field label="Mot de passe temporaire" value={form.temporaryPassword} onChange={(value) => patch({ temporaryPassword: value })} />
                  </div>
                  <OptionGrid title="Modules activés pour le partenaire" options={moduleOptions} selected={form.enabledModules} onToggle={(value) => toggleArray('enabledModules', value)} />
                </StepSection>
              ) : null}

              {activeStep === 'billing' ? (
                <StepSection title="Billing, compte & contrôle commercial" eyebrowText="MONÉTISATION TRAININGHUB">
                  <div style={formGrid}>
                    <SelectField label="Plan partenaire" value={form.plan} onChange={(value) => patch({ plan: value })} options={['Activation', 'Growth', 'Premium', 'Enterprise', 'Custom']} />
                    <SelectField label="Modèle de facturation" value={form.billingModel} onChange={(value) => patch({ billingModel: value })} options={['account_subscription', 'training_credit_wallet', 'one_shot_activation', 'hybrid_subscription_credits', 'custom_enterprise']} />
                    <SelectField label="Type compte billing" value={form.accountType} onChange={(value) => patch({ accountType: value })} options={['partner_training_account', 'multi_site_partner_account', 'internal_account', 'enterprise_network_account']} />
                    <SelectField label="Période billing" value={form.billingPeriod} onChange={(value) => patch({ billingPeriod: value })} options={['monthly', 'quarterly', 'yearly', 'one_shot']} />
                    <SelectField label="Devise" value={form.currency} onChange={(value) => patch({ currency: value })} options={['MAD', 'EUR', 'USD']} />
                    <SelectField label="Paiement" value={form.paymentTerms} onChange={(value) => patch({ paymentTerms: value })} options={['due_7', 'due_15', 'due_30', 'advance_payment', 'manual_agreement']} />
                    <SelectField label="Politique facture" value={form.invoicePolicy} onChange={(value) => patch({ invoicePolicy: value })} options={['manual_review_before_issue', 'auto_issue_after_order', 'deposit_then_balance', 'invoice_after_delivery']} />
                    <SelectField label="Renouvellement" value={form.renewalPolicy} onChange={(value) => patch({ renewalPolicy: value })} options={['manual_review_30_days_before_end', 'auto_prepare_renewal_quote', 'refresh_required_before_renewal', 'executive_review']} />
                    <Field label="MRR MAD" value={form.monthlyAmount} onChange={(value) => patch({ monthlyAmount: value })} />
                    <Field label="Frais setup MAD" value={form.setupFee} onChange={(value) => patch({ setupFee: value })} />
                    <Toggle label="Créer abonnement" checked={form.createSubscription} onChange={(value) => patch({ createSubscription: value })} />
                    <Toggle label="Créer wallet crédits" checked={form.creditWalletEnabled} onChange={(value) => patch({ creditWalletEnabled: value })} />
                    <Field label="Quantité crédits" value={form.creditQuantity} onChange={(value) => patch({ creditQuantity: value })} />
                    <Field label="Montant wallet MAD" value={form.creditAmount} onChange={(value) => patch({ creditAmount: value })} />
                    <SelectField label="Type crédits" value={form.creditType} onChange={(value) => patch({ creditType: value })} options={['training_course', 'refresh', 'certificate', 'proof_kit', 'custom_credit']} />
                    <Toggle label="Refresh annuel activé" checked={form.refreshEnabled} onChange={(value) => patch({ refreshEnabled: value })} />
                  </div>
                </StepSection>
              ) : null}

              {activeStep === 'offer' ? (
                <StepSection title="Offre initiale & services inclus" eyebrowText="COMMERCIAL PACKAGING">
                  <div style={formGrid}>
                    <Toggle label="Créer offre initiale" checked={form.createInitialOffer} onChange={(value) => patch({ createInitialOffer: value })} />
                    <Field label="Titre offre" value={form.offerTitle} onChange={(value) => patch({ offerTitle: value })} />
                    <Field label="Montant MAD" value={form.offerAmount} onChange={(value) => patch({ offerAmount: value, setupFee: value, creditAmount: value })} />
                    <Field label="Participants / crédits" value={form.participants} onChange={(value) => patch({ participants: value, maxParticipants: value, creditQuantity: value })} />
                    <SelectField label="Package" value={form.packageType} onChange={(value) => patch({ packageType: value })} options={['training_activation_pack', 'team_certification_pack', 'refresh_pack', 'premium_proof_pack', 'enterprise_governance_pack', 'custom_training_pack']} />
                    <Field label="Description" value={form.offerDescription} onChange={(value) => patch({ offerDescription: value })} wide />
                  </div>
                  <OptionGrid title="Services facturables préintégrés" options={serviceOptions} selected={form.selectedServices} onToggle={(value) => toggleArray('selectedServices', value)} />
                </StepSection>
              ) : null}

              {activeStep === 'delivery' ? (
                <StepSection title="Delivery & première session" eyebrowText="OPÉRATIONS FORMATION">
                  <div style={formGrid}>
                    <Toggle label="Planifier première session" checked={form.createFirstSession} onChange={(value) => patch({ createFirstSession: value })} />
                    <Field label="Titre session" value={form.sessionTitle} onChange={(value) => patch({ sessionTitle: value })} />
                    <SelectField label="Mode" value={form.mode} onChange={(value) => patch({ mode: value })} options={['onsite', 'online', 'hybrid']} />
                    <Field label="Lieu" value={form.location} onChange={(value) => patch({ location: value })} />
                    <Field label="Capacité" value={form.maxParticipants} onChange={(value) => patch({ maxParticipants: value })} />
                    <SelectField label="Checklist delivery" value={form.checklistTemplate} onChange={(value) => patch({ checklistTemplate: value })} options={['standard_training_delivery', 'onsite_partner_delivery', 'online_session_delivery', 'certificate_ready_delivery', 'enterprise_governance_delivery']} />
                  </div>
                  <div style={deliveryFlow}>
                    <FlowBox title="Avant session" text="Brief, participants, supports, agenda, validation partenaire." />
                    <FlowBox title="Pendant session" text="Présence, progression, incidents, formateur, preuves." />
                    <FlowBox title="Après session" text="Certificats, documents, refresh, renouvellement." />
                  </div>
                </StepSection>
              ) : null}

              {activeStep === 'proofs' ? (
                <StepSection title="Preuves, SLA, demandes & onboarding" eyebrowText="GOUVERNANCE PARTENAIRE">
                  <div style={formGrid}>
                    <Toggle label="Créer kit de démarrage" checked={form.createStarterKit} onChange={(value) => patch({ createStarterKit: value })} />
                    <SelectField label="Visibilité documents" value={form.proofVisibility} onChange={(value) => patch({ proofVisibility: value })} options={['partner_portal', 'internal_only', 'partner_and_internal', 'executive_only']} />
                    <SelectField label="SLA" value={form.slaPolicy} onChange={(value) => patch({ slaPolicy: value })} options={['standard_48h', 'priority_24h', 'enterprise_8h', 'manual_sla']} />
                    <SelectField label="Priorité onboarding" value={form.priority} onChange={(value) => patch({ priority: value })} options={['low', 'normal', 'high', 'urgent']} />
                    <SelectField label="Risque initial" value={form.riskLevel} onChange={(value) => patch({ riskLevel: value })} options={['Faible', 'À surveiller', 'Élevé']} />
                    <Field label="Health score initial" value={form.health} onChange={(value) => patch({ health: value })} />
                    <Field label="Type demande" value={form.firstRequestType} onChange={(value) => patch({ firstRequestType: value })} />
                    <Field label="Titre demande" value={form.firstRequestTitle} onChange={(value) => patch({ firstRequestTitle: value })} wide />
                    <Field label="Titre notification" value={form.welcomeNotificationTitle} onChange={(value) => patch({ welcomeNotificationTitle: value })} />
                    <Field label="Message notification" value={form.welcomeNotificationBody} onChange={(value) => patch({ welcomeNotificationBody: value })} wide />
                  </div>
                  <OptionGrid title="Kits de preuves à publier" options={proofOptions} selected={form.selectedKits} onToggle={(value) => toggleArray('selectedKits', value)} />
                </StepSection>
              ) : null}

              {activeStep === 'review' ? (
                <StepSection title="Validation finale" eyebrowText="REVIEW & COMMIT">
                  <div style={reviewGrid}>
                    <ReviewCard title="Dossier" value={form.name || 'À compléter'} note={`${form.city} · ${form.segment}`} />
                    <ReviewCard title="Accès" value={form.contactEmail ? 'Créé' : 'Sans email'} note={`${form.accessRole} · ${form.enabledModules.length} module(s)`} />
                    <ReviewCard title="Billing" value={form.billingModel} note={`${form.paymentTerms} · ${form.invoicePolicy}`} />
                    <ReviewCard title="Plan" value={form.plan} note={`MRR ${formatMoney(form.monthlyAmount)}`} />
                    <ReviewCard title="Offre" value={form.createInitialOffer ? formatMoney(form.offerAmount) : 'Désactivée'} note={`${form.selectedServices.length} service(s)`} />
                    <ReviewCard title="Crédits" value={form.creditWalletEnabled ? form.creditQuantity : 'Désactivé'} note={form.creditType} />
                    <ReviewCard title="Session" value={form.createFirstSession ? 'Planifiée' : 'Non créée'} note={form.sessionTitle} />
                    <ReviewCard title="Preuves" value={`${form.selectedKits.length} kit(s)`} note={form.proofVisibility} />
                    <ReviewCard title="SLA" value={form.slaPolicy} note={`${form.priority} · ${form.riskLevel}`} />
                  </div>

                  <div style={chainPreview}>
                    {creationChain.map((item, index) => (
                      <div key={item.label} style={item.active ? chainActive : chainInactive}>
                        <b>{String(index + 1).padStart(2, '0')}</b>
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>

                  {created ? (
                    <div style={successBox}>
                      <strong>Dossier créé</strong>
                      <p>Organisation: {String(created.organization_id || '')}</p>
                      <p>
                        Offre: {created.summary?.created_offer ? 'créée' : 'non créée'} ·
                        Accès: {created.summary?.created_user_access ? 'créé' : 'non créé'} ·
                        Crédits: {created.summary?.created_training_credits ? 'créés' : 'non créés'} ·
                        Documents: {created.summary?.created_documents || 0}
                      </p>
                    </div>
                  ) : null}
                </StepSection>
              ) : null}
            </section>

            <footer style={footer}>
              <button style={secondaryButton} disabled={activeIndex === 0} onClick={() => setActiveStep(previousStep)}>Retour</button>
              <div style={footerCenter}>
                {steps.map((step) => <button key={step.key} style={step.key === activeStep ? dotActive : dot} onClick={() => setActiveStep(step.key)} />)}
              </div>
              {activeStep !== 'review' ? (
                <button style={primaryButton} onClick={() => setActiveStep(nextStep)}>Continuer</button>
              ) : (
                <button style={primaryButton} disabled={busy} onClick={submit}>{busy ? 'Création synchronisée…' : 'Créer le dossier complet'}</button>
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

function Field({ label, value, onChange, placeholder, wide, required }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; wide?: boolean; required?: boolean }) {
  return (
    <label style={wide ? fieldWide : field}>
      <span>{label}{required ? ' *' : ''}</span>
      <input style={inputStyle} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  )
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label style={field}>
      <span>{label}</span>
      <select style={inputStyle} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button type="button" style={checked ? toggleActive : toggle} onClick={() => onChange(!checked)}>
      <span>{checked ? '✓' : '○'}</span>
      <b>{label}</b>
    </button>
  )
}

function OptionGrid({ title, options, selected, onToggle }: { title: string; options: string[][]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div style={optionBlock}>
      <strong>{title}</strong>
      <div style={optionGrid}>
        {options.map(([value, label]) => (
          <button key={value} type="button" style={selected.includes(value) ? optionActive : optionButton} onClick={() => onToggle(value)}>
            <span>{selected.includes(value) ? '✓' : '+'}</span>
            <b>{label}</b>
            <small>{value}</small>
          </button>
        ))}
      </div>
    </div>
  )
}

function FlowBox({ title, text }: { title: string; text: string }) {
  return <div style={flowBox}><strong>{title}</strong><span>{text}</span></div>
}

function ReviewCard({ title, value, note }: { title: string; value: ReactNode; note: string }) {
  return <div style={reviewCard}><span>{title}</span><strong>{value}</strong><small>{note}</small></div>
}

const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  padding: 8,
  display: 'grid',
  placeItems: 'center',
  background: 'rgba(8,18,38,.58)',
  backdropFilter: 'blur(14px)',
  overflow: 'hidden',
}
const modal: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  width: 'calc(100vw - 16px)',
  maxWidth: 'none',
  height: 'calc(100dvh - 16px)',
  maxHeight: 'calc(100dvh - 16px)',
  display: 'grid',
  gridTemplateRows: 'auto auto minmax(0,1fr)',
  gap: 12,
  padding: 20,
  borderRadius: 34,
  background: 'linear-gradient(135deg,#ffffff 0%,#f8fbff 54%,#eef6ff 100%)',
  border: '1px solid rgba(221,231,246,.96)',
  boxShadow: '0 50px 120px rgba(5,16,36,.34)',
}
const ambientOne: CSSProperties = { position: 'absolute', right: -160, top: -220, width: 580, height: 580, borderRadius: '50%', background: 'radial-gradient(circle, rgba(17,105,255,.16), transparent 64%)' }
const ambientTwo: CSSProperties = { position: 'absolute', left: -180, bottom: -240, width: 540, height: 540, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,214,201,.14), transparent 64%)' }
const header: CSSProperties = { position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, padding: 20, borderRadius: 28, background: 'rgba(255,255,255,.82)', border: '1px solid #dce7f6', boxShadow: '0 18px 44px rgba(17,42,88,.07)', backdropFilter: 'blur(18px)' }
const eyebrow: CSSProperties = { color: '#1169ff', fontWeight: 950, letterSpacing: '.16em', fontSize: 12, textTransform: 'uppercase' }
const headerActions: CSSProperties = { display: 'flex', gap: 12, alignItems: 'center' }
const readinessPill: CSSProperties = { minWidth: 150, display: 'grid', gap: 4, padding: 14, color: '#fff', borderRadius: 20, background: 'linear-gradient(135deg,#073b9d,#1169ff)', boxShadow: '0 16px 34px rgba(17,105,255,.24)' }
const closeButton: CSSProperties = { width: 54, height: 54, display: 'grid', placeItems: 'center', borderRadius: 18, border: '1px solid #d9e5f6', background: '#fff', color: '#0b1733', fontSize: 28, fontWeight: 950, cursor: 'pointer' }
const successMessage: CSSProperties = { position: 'relative', zIndex: 1, padding: 12, borderRadius: 16, background: '#ecfdf5', color: '#047857', border: '1px solid #bbf7d0', fontWeight: 900 }
const warningMessage: CSSProperties = { position: 'relative', zIndex: 1, padding: 12, borderRadius: 16, background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa', fontWeight: 900 }
const body: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  minHeight: 0,
  height: '100%',
  overflow: 'hidden',
  display: 'grid',
  gridTemplateColumns: 'minmax(360px,410px) minmax(0,1fr)',
  gap: 18,
}
const leftRail: CSSProperties = {
  minHeight: 0,
  height: '100%',
  maxHeight: '100%',
  overflowY: 'auto',
  overflowX: 'hidden',
  display: 'grid',
  alignContent: 'start',
  gap: 16,
  paddingRight: 6,
  scrollbarGutter: 'stable',
}
const miniDossier: CSSProperties = { display: 'grid', placeItems: 'center', textAlign: 'center', gap: 9, padding: 20, borderRadius: 28, color: '#fff', background: 'radial-gradient(circle at 20% 0%, rgba(110,231,183,.28), transparent 34%), linear-gradient(135deg,#09265e,#1169ff)', boxShadow: '0 26px 60px rgba(17,105,255,.22)' }
const avatar: CSSProperties = { width: 64, height: 64, display: 'grid', placeItems: 'center', borderRadius: 22, background: 'rgba(255,255,255,.18)', fontWeight: 950, fontSize: 24 }
const progressTrack: CSSProperties = { width: '100%', height: 10, borderRadius: 99, background: 'rgba(255,255,255,.22)', overflow: 'hidden' }
const stepNav: CSSProperties = { display: 'grid', gap: 8 }
const stepButton: CSSProperties = { minHeight: 54, display: 'grid', gridTemplateColumns: '34px 1fr 34px', alignItems: 'center', gap: 10, padding: '0 12px', borderRadius: 17, border: '1px solid #dce7f6', color: '#425872', background: '#fff', textAlign: 'left', fontWeight: 900, cursor: 'pointer' }
const stepActive: CSSProperties = { ...stepButton, color: '#fff', background: 'linear-gradient(135deg,#073b9d,#1169ff)', boxShadow: '0 18px 34px rgba(17,105,255,.22)' }
const commercialBox: CSSProperties = { padding: 16, borderRadius: 22, background: '#fff', border: '1px solid #dce7f6', color: '#243955', fontWeight: 800 }
const content: CSSProperties = {
  minHeight: 0,
  height: '100%',
  overflow: 'hidden',
  display: 'grid',
  gridTemplateRows: 'auto minmax(0,1fr) auto',
  gap: 14,
  paddingRight: 6,
}
const topCards: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4,minmax(220px,1fr))',
  gap: 12,
  minHeight: 112,
}
const scoreCard: CSSProperties = { minHeight: 112, display: 'grid', gridTemplateColumns: '52px 1fr', gap: 12, alignItems: 'center', padding: 16, borderRadius: 22, background: '#fff', border: '1px solid #dce7f6', boxShadow: '0 16px 32px rgba(17,42,88,.055)' }
const scoreIcon: CSSProperties = { width: 50, height: 50, display: 'grid', placeItems: 'center', borderRadius: 18 }
const scoreBlue: CSSProperties = { ...scoreIcon, background: '#e8f1ff', color: '#1169ff' }
const scoreGreen: CSSProperties = { ...scoreIcon, background: '#ecfdf5', color: '#059669' }
const scoreViolet: CSSProperties = { ...scoreIcon, background: '#f5f3ff', color: '#7c3aed' }
const scoreCyan: CSSProperties = { ...scoreIcon, background: '#ecfeff', color: '#0891b2' }
const mainCard: CSSProperties = {
  minHeight: 0,
  height: '100%',
  maxHeight: '100%',
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: 24,
  borderRadius: 28,
  background: '#fff',
  border: '1px solid #dce7f6',
  boxShadow: '0 18px 38px rgba(17,42,88,.055)',
  scrollBehavior: 'smooth',
  scrollbarGutter: 'stable',
}
const stepSection: CSSProperties = { display: 'grid', alignContent: 'start', gap: 18 }
const formGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
  gap: 14,
}
const field: CSSProperties = { display: 'grid', gap: 8, fontWeight: 900, color: '#243955' }
const fieldWide: CSSProperties = { ...field, gridColumn: 'span 2' }
const inputStyle: CSSProperties = { minHeight: 48, border: '1px solid #d9e5f6', borderRadius: 15, padding: '0 13px', color: '#0b1733', background: '#fbfdff', fontWeight: 850 }
const toggle: CSSProperties = { minHeight: 72, display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, border: '1px solid #dce7f6', background: '#f8fbff', color: '#425872', fontWeight: 900, cursor: 'pointer' }
const toggleActive: CSSProperties = { ...toggle, background: '#ecfdf5', color: '#047857', borderColor: '#bbf7d0' }
const presetGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4,minmax(260px,1fr))',
  gap: 14,
}
const presetCard: CSSProperties = { minHeight: 190, display: 'grid', alignContent: 'start', gap: 10, padding: 18, borderRadius: 24, border: '1px solid #dce7f6', background: '#f8fbff', color: '#10203f', textAlign: 'left', cursor: 'pointer', fontWeight: 850 }
const presetActive: CSSProperties = { ...presetCard, color: '#fff', background: 'linear-gradient(135deg,#073b9d,#1169ff)', boxShadow: '0 18px 34px rgba(17,105,255,.24)' }
const presetExplain: CSSProperties = { padding: 16, borderRadius: 20, background: '#f8fbff', border: '1px solid #e1e9f6', color: '#243955' }
const optionBlock: CSSProperties = { display: 'grid', gap: 12 }
const optionGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5,minmax(190px,1fr))',
  gap: 10,
}
const optionButton: CSSProperties = { minHeight: 78, display: 'grid', alignContent: 'center', gap: 4, padding: 12, borderRadius: 18, border: '1px solid #dce7f6', background: '#f8fbff', color: '#243955', textAlign: 'left', cursor: 'pointer' }
const optionActive: CSSProperties = { ...optionButton, color: '#047857', background: '#ecfdf5', borderColor: '#bbf7d0' }
const deliveryFlow: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3,minmax(260px,1fr))',
  gap: 12,
}
const flowBox: CSSProperties = { minHeight: 110, display: 'grid', gap: 8, padding: 16, borderRadius: 20, background: '#f8fbff', border: '1px solid #e1e9f6' }
const reviewGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4,minmax(240px,1fr))',
  gap: 12,
}
const reviewCard: CSSProperties = { minHeight: 112, display: 'grid', alignContent: 'center', gap: 7, padding: 16, borderRadius: 20, background: '#f8fbff', border: '1px solid #e1e9f6' }
const chainPreview: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(10,minmax(120px,1fr))', gap: 9, overflowX: 'auto' }
const chainActive: CSSProperties = { minHeight: 74, display: 'grid', placeItems: 'center', textAlign: 'center', borderRadius: 18, background: '#ecfdf5', color: '#047857', border: '1px solid #bbf7d0', fontWeight: 900 }
const chainInactive: CSSProperties = { ...chainActive, background: '#f8fbff', color: '#64748b', borderColor: '#e1e9f6' }
const successBox: CSSProperties = { display: 'grid', gap: 6, padding: 16, borderRadius: 20, background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#047857', fontWeight: 850 }
const footer: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  padding: 14,
  borderRadius: 24,
  background: 'rgba(255,255,255,.96)',
  border: '1px solid #dce7f6',
  boxShadow: '0 -12px 30px rgba(17,42,88,.055)',
}
const footerCenter: CSSProperties = { display: 'flex', gap: 7, alignItems: 'center' }
const primaryButton: CSSProperties = { border: 0, color: '#fff', background: 'linear-gradient(135deg,#073b9d,#1169ff)', borderRadius: 16, padding: '13px 18px', fontWeight: 950, boxShadow: '0 16px 30px rgba(17,105,255,.24)', cursor: 'pointer' }
const secondaryButton: CSSProperties = { border: '1px solid #d9e5f6', color: '#16406f', background: '#fff', borderRadius: 16, padding: '12px 15px', fontWeight: 950, cursor: 'pointer' }
const dot: CSSProperties = { width: 10, height: 10, borderRadius: 999, border: 0, background: '#cbd8ec' }
const dotActive: CSSProperties = { ...dot, width: 30, background: '#1169ff' }


const wideScrollMarker: CSSProperties = {
  display: 'inline-flex',
  width: 'fit-content',
  marginTop: 8,
  padding: '6px 10px',
  borderRadius: 999,
  background: '#ecfdf5',
  color: '#047857',
  border: '1px solid #bbf7d0',
  fontWeight: 950,
  letterSpacing: '.08em',
  fontSize: 11,
}


const CREATE_PARTNER_MODAL_FORCE_WIDE_RESPONSIVE = 'CREATE_PARTNER_MODAL_FORCE_WIDE_RESPONSIVE'
