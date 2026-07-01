'use client'

import TrainingHubPartnerLifecycleCommandDock from './TrainingHubPartnerLifecycleCommandDock'
import TrainingHubCommercialBusinessOverviewPanel from './TrainingHubCommercialBusinessOverviewPanel'
import TrainingHubPartnerBusinessDossierBoard from './TrainingHubPartnerBusinessDossierBoard'
import type { CSSProperties, FormEvent, ReactNode } from 'react'
import TrainingHubDeliveryCertificationPanel from './TrainingHubDeliveryCertificationPanel'
import TrainingHubRevenueLifecyclePanel from './TrainingHubRevenueLifecyclePanel'
import TrainingHubProductionHardeningPanel from './TrainingHubProductionHardeningPanel'
import TrainingHubPartnerMegaDossierPanel from './TrainingHubPartnerMegaDossierPanel'
import TrainingHubPartnerAccountsPanel from './TrainingHubPartnerAccountsPanel'
import { useMemo, useState } from 'react'

type Props = {
  organizations: any[]
  sites?: any[]
  courses: any[]
  proposals: any[]
  proposalItems: any[]
  orders: any[]
  orderItems: any[]
  invoices: any[]
  invoiceItems: any[]
  payments: any[]
  accounts: any[]
  subscriptions: any[]
  credits: any[]
  sessions?: any[]
  participants?: any[]
  certificates?: any[]
  profiles?: any[]
  memberships?: any[]
  roleAssignments?: any[]
  roles?: any[]
  queryWarnings: string[]
}

type DetailTab = 'vue' | 'offre' | 'facturation' | 'partenaire' | 'actions'
type ModalMode = 'proposal-detail' | 'proposal-create' | null

const activeStatuses = new Set(['active', 'paid', 'confirmed', 'accepted', 'sent', 'current', 'trial'])
const proposalStages = [
  { key: 'draft', label: 'Brouillons', color: '#2563eb' },
  { key: 'sent', label: 'Envoyées', color: '#0f766e' },
  { key: 'accepted', label: 'Acceptées', color: '#059669' },
  { key: 'converted_to_order', label: 'Converties', color: '#7c3aed' },
  { key: 'attention', label: 'À relancer', color: '#ea580c' },
]

function n(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function money(amountMinor?: number | null, currency = 'MAD') {
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(n(amountMinor) / 100)} ${currency || 'MAD'}`
}

function sum(rows: any[], selector: (row: any) => number) {
  return rows.reduce((total, row) => total + selector(row), 0)
}

function clean(value: unknown, fallback = 'Non défini') {
  const text = String(value || '').trim()
  return text || fallback
}

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function statusLabel(value?: string | null) {
  const status = normalize(value || 'draft')
  if (status === 'draft') return 'Brouillon'
  if (status === 'sent') return 'Envoyée'
  if (status === 'viewed') return 'Vue'
  if (status === 'negotiation') return 'Négociation'
  if (status === 'accepted') return 'Acceptée'
  if (status === 'converted_to_order') return 'Convertie'
  if (status === 'issued') return 'Émise'
  if (status === 'paid') return 'Payée'
  if (status === 'overdue') return 'En retard'
  if (status === 'cancelled') return 'Annulée'
  if (status === 'active') return 'Actif'
  if (status === 'trial') return 'Essai'
  return String(value || 'draft').replace(/_/g, ' ')
}

function statusTone(value?: string | null) {
  const status = normalize(value)
  if (['accepted', 'converted_to_order', 'paid', 'active', 'confirmed'].includes(status)) return { bg: '#ecfdf5', fg: '#047857', border: '#bbf7d0' }
  if (['sent', 'viewed', 'issued', 'trial'].includes(status)) return { bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' }
  if (['negotiation', 'draft'].includes(status)) return { bg: '#fff7ed', fg: '#c2410c', border: '#fed7aa' }
  if (['overdue', 'cancelled', 'rejected', 'expired'].includes(status)) return { bg: '#fef2f2', fg: '#b91c1c', border: '#fecaca' }
  return { bg: '#f8fafc', fg: '#475569', border: '#e2e8f0' }
}

function dateLabel(value?: string | null) {
  if (!value) return 'Non défini'
  try {
    return new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return value
  }
}

function organizationName(org?: any) {
  return clean(org?.name || org?.legal_name || org?.display_name, 'Partenaire non renseigné')
}

function isPartner(org: any) {
  const type = normalize(org.organization_type)
  return type.includes('partner') || type.includes('school') || type.includes('creche') || type.includes('crèche') || type !== 'angelcare_internal'
}

function amountOfPayment(payment: any) {
  return n(payment.amount_minor || payment.amount_paid_minor || payment.payment_amount_minor || payment.grand_total_minor)
}

function invoiceDue(invoice: any) {
  return n(invoice.amount_due_minor ?? invoice.balance_due_minor ?? invoice.grand_total_minor)
}

function proposalAmount(proposal: any) {
  return n(proposal.grand_total_minor || proposal.subtotal_minor)
}

function accountLabel(account?: any, subscription?: any) {
  if (subscription?.plan_name) return String(subscription.plan_name)
  if (subscription?.plan_code) return String(subscription.plan_code)
  if (subscription?.billing_interval) return `Compte ${subscription.billing_interval}`
  if (activeStatuses.has(normalize(subscription?.status || account?.status))) return 'Compte actif'
  if (account) return 'Compte à finaliser'
  return 'Compte à créer'
}

function lifecycleScore(row: any) {
  const status = normalize(row.status)
  if (status === 'converted_to_order') return 100
  if (status === 'accepted') return 82
  if (status === 'sent' || status === 'viewed') return 58
  if (status === 'negotiation') return 66
  if (status === 'draft') return 32
  return 18
}

export default function TrainingHubCommercialEnterpriseWorkspace({
  organizations,
  sites = [],
  courses,
  proposals,
  proposalItems,
  orders,
  orderItems,
  invoices,
  invoiceItems,
  payments,
  accounts,
  subscriptions,
  credits,
  sessions = [],
  participants = [],
  certificates = [],
  profiles = [],
  memberships = [],
  roleAssignments = [],
  roles = [],
  queryWarnings,
}: Props) {
  const partnerOrganizations = organizations.filter(isPartner)
  const [search, setSearch] = useState('')
  const [partnerId, setPartnerId] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [amountFilter, setAmountFilter] = useState('all')
  const [selected, setSelected] = useState<any | null>(null)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>('vue')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState({
    organization_id: partnerOrganizations[0]?.id || '',
    course_id: courses[0]?.id || '',
    title: '',
    participant_count: 8,
    requested_hours: 6,
    commercial_discount_minor: 0,
    valid_until: '',
    partner_notes: '',
  })

  const orgById = useMemo(() => new Map(organizations.map((org) => [org.id, org])), [organizations])
  const courseById = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses])
  const accountByOrg = useMemo(() => new Map(accounts.map((account) => [account.organization_id || account.org_id, account])), [accounts])
  const subscriptionByOrg = useMemo(() => new Map(subscriptions.map((sub) => [sub.organization_id || sub.org_id, sub])), [subscriptions])

  const proposalRows = useMemo(() => {
    return proposals.map((proposal) => {
      const org = orgById.get(proposal.organization_id)
      const items = proposalItems.filter((item) => item.proposal_id === proposal.id)
      const order = orders.find((item) => item.proposal_id === proposal.id || item.id === proposal.converted_order_id)
      const invoice = invoices.find((item) => item.proposal_id === proposal.id || item.order_id === order?.id)
      const account = accountByOrg.get(proposal.organization_id)
      const subscription = subscriptionByOrg.get(proposal.organization_id)
      return {
        ...proposal,
        org,
        items,
        order,
        invoice,
        account,
        subscription,
        score: lifecycleScore(proposal),
        orgName: organizationName(org),
        accountType: accountLabel(account, subscription),
      }
    })
  }, [proposals, proposalItems, orders, invoices, orgById, accountByOrg, subscriptionByOrg])

  const filtered = useMemo(() => {
    const q = normalize(search)
    return proposalRows
      .filter((row) => {
        const matchSearch = !q || normalize(`${row.proposal_number} ${row.title} ${row.orgName} ${row.accountType}`).includes(q)
        const matchPartner = partnerId === 'all' || row.organization_id === partnerId
        const matchStatus = statusFilter === 'all' || normalize(row.status) === statusFilter
        const amount = proposalAmount(row)
        const matchAmount =
          amountFilter === 'all' ||
          (amountFilter === 'small' && amount < 500000) ||
          (amountFilter === 'medium' && amount >= 500000 && amount < 2000000) ||
          (amountFilter === 'large' && amount >= 2000000)
        return matchSearch && matchPartner && matchStatus && matchAmount
      })
      .sort((a, b) => b.score - a.score || proposalAmount(b) - proposalAmount(a))
  }, [proposalRows, search, partnerId, statusFilter, amountFilter])

  const activeProposalRows = proposalRows.filter((row) => !['cancelled', 'rejected', 'expired'].includes(normalize(row.status)))
  const pipelineAmount = sum(activeProposalRows, proposalAmount)
  const acceptedAmount = sum(proposalRows.filter((row) => ['accepted', 'converted_to_order'].includes(normalize(row.status))), proposalAmount)
  const orderAmount = sum(orders, (row) => n(row.grand_total_minor || row.subtotal_minor))
  const invoiceOpen = sum(invoices.filter((row) => !['paid', 'cancelled'].includes(normalize(row.status))), invoiceDue)
  const paidAmount = sum(payments, amountOfPayment)
  const activeAccounts = accounts.filter((account) => activeStatuses.has(normalize(account.status || account.account_status))).length
  const conversionRate = proposalRows.length ? Math.round((proposalRows.filter((row) => ['accepted', 'converted_to_order'].includes(normalize(row.status))).length / proposalRows.length) * 100) : 0

  function openDetail(row: any, tab: DetailTab = 'vue') {
    setSelected(row)
    setDetailTab(tab)
    setModalMode('proposal-detail')
  }

  function openCreate() {
    setCreateForm((current) => ({
      ...current,
      organization_id: current.organization_id || partnerOrganizations[0]?.id || '',
      course_id: current.course_id || courses[0]?.id || '',
      valid_until: current.valid_until || '',
    }))
    setModalMode('proposal-create')
  }

  async function postAction(url: string, success: string) {
    setBusy(true)
    setMessage(null)
    try {
      const response = await fetch(url, { method: 'POST' })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || result?.ok === false) {
        setMessage(result?.error?.message || result?.message || 'Action commerciale non finalisée.')
        return
      }
      setMessage(success)
      setModalMode(null)
      window.location.reload()
    } finally {
      setBusy(false)
    }
  }

  async function createProposal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      const course = courseById.get(createForm.course_id)
      const response = await fetch('/api/traininghub/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: createForm.organization_id,
          title: createForm.title || `Proposition formation — ${course?.title || 'AngelCare'}`,
          valid_until: createForm.valid_until || undefined,
          currency_code: 'MAD',
          partner_notes: createForm.partner_notes || undefined,
          items: [
            {
              course_id: createForm.course_id,
              participant_count: Number(createForm.participant_count || 3),
              requested_hours: Number(createForm.requested_hours || 6),
              commercial_discount_minor: Math.round(Number(createForm.commercial_discount_minor || 0) * 100),
              description: course ? `${course.ref} — ${course.title}` : undefined,
            },
          ],
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || result?.ok === false) {
        setMessage(result?.error?.message || result?.message || 'Création de proposition non finalisée.')
        return
      }
      setMessage('Proposition créée avec succès.')
      setModalMode(null)
      window.location.reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={pageStackStyle}>
      <TrainingHubCommercialBusinessOverviewPanel
        organizations={organizations}
        accounts={accounts}
        subscriptions={subscriptions}
        proposals={proposals}
        orders={orders}
        invoices={invoices}
        credits={credits}
        sessions={sessions}
        participants={participants}
        certificates={certificates}
      />


      <TrainingHubProductionHardeningPanel
        organizations={organizations}
        proposals={proposals}
        orders={orders}
        invoices={invoices}
        accounts={accounts}
        subscriptions={subscriptions}
        profiles={profiles}
        memberships={memberships}
        roleAssignments={roleAssignments}
        sessions={sessions}
        participants={participants}
        certificates={certificates}
      />


      <section style={heroStyle}>
        <div style={heroCopyStyle}>
          <div style={heroEyebrowStyle}>CENTRE COMMERCIAL & FACTURATION</div>
          <h2 style={heroTitleStyle}>Transformer les partenaires en revenus récurrents, offres signées et formations livrées.</h2>
          <p style={heroTextStyle}>
            Une console commerciale large pour suivre les comptes actifs, créer des propositions, convertir en commandes, piloter factures, paiements, abonnements et crédits formation.
          </p>
          <div style={heroActionsStyle}>
            <button type="button" onClick={openCreate} style={primaryActionStyle}>+ Nouvelle proposition</button>
            <button type="button" onClick={() => setStatusFilter('sent')} style={secondaryActionStyle}>À relancer</button>
            <button type="button" onClick={() => setAmountFilter('large')} style={ghostActionStyle}>Grandes opportunités</button>
          </div>
        </div>

        <aside style={scorePanelStyle}>
          <div style={scoreTopStyle}>
            <span>Performance commerciale</span>
            <strong>{conversionRate}%</strong>
          </div>
          <div style={scoreTrackStyle}><div style={{ ...scoreFillStyle, width: `${conversionRate}%` }} /></div>
          <div style={scoreGridStyle}>
            <Mini label="Offres actives" value={activeProposalRows.length} />
            <Mini label="Comptes actifs" value={activeAccounts} />
            <Mini label="Commandes" value={orders.length} />
            <Mini label="Factures" value={invoices.length} />
          </div>
        </aside>
      </section>

      <section style={metricGridStyle}>
        <Metric label="Pipeline ouvert" value={money(pipelineAmount)} detail={`${activeProposalRows.length} offre(s) suivies`} accent="#2563eb" />
        <Metric label="Accepté / signé" value={money(acceptedAmount)} detail={`${conversionRate}% conversion`} accent="#059669" />
        <Metric label="Commandes" value={money(orderAmount)} detail={`${orders.length} commande(s)`} accent="#7c3aed" />
        <Metric label="À encaisser" value={money(invoiceOpen)} detail="factures non soldées" accent="#ea580c" />
        <Metric label="Paiements reçus" value={money(paidAmount)} detail={`${payments.length} paiement(s)`} accent="#0f766e" />
        <Metric label="Crédits formation" value={credits.length} detail="droits et consommation" accent="#db2777" />
      </section>

      <section style={operatingGridStyle}>
        <article style={panelStyle}>
          <SectionHeader eyebrow="MODÈLE DE REVENUS" title="Comptes, offres, commandes et crédits" text="Le modèle commercial suit les partenaires, pas des ventes isolées : compte actif, proposition, commande, facture, paiement et crédits de formation." />
          <div style={modelGridStyle}>
            <ModelCard title="Compte partenaire" value={accounts.length} text="Établissement rattaché à une logique commerciale." />
            <ModelCard title="Abonnement" value={subscriptions.length} text="Plan mensuel ou annuel selon le niveau de partenariat." />
            <ModelCard title="Proposition" value={proposals.length} text="Offre de formation créée pour un partenaire." />
            <ModelCard title="Commande" value={orders.length} text="Proposition acceptée et convertie." />
            <ModelCard title="Facture" value={invoices.length} text="Montant à suivre et à encaisser." />
            <ModelCard title="Crédit formation" value={credits.length} text="Droits utilisés pour sessions, refresh ou packs." />
          </div>
        </article>

        <article style={panelStyle}>
          <SectionHeader eyebrow="PIPELINE" title="Lecture par étape" text="La priorité commerciale se lit par statut : brouillon, envoyé, accepté, converti ou à relancer." />
          <div style={stageListStyle}>
            {proposalStages.map((stage) => {
              const stageRows = proposalRows.filter((row) =>
                stage.key === 'attention'
                  ? ['sent', 'viewed', 'negotiation'].includes(normalize(row.status))
                  : normalize(row.status) === stage.key,
              )
              return (
                <button key={stage.key} type="button" onClick={() => setStatusFilter(stage.key === 'attention' ? 'sent' : stage.key)} style={stageRowStyle}>
                  <span style={{ ...stageDotStyle, background: stage.color }} />
                  <strong>{stage.label}</strong>
                  <small>{stageRows.length} offre(s)</small>
                  <b>{money(sum(stageRows, proposalAmount))}</b>
                </button>
              )
            })}
          </div>
        </article>
      </section>


      <TrainingHubPartnerAccountsPanel
        organizations={organizations}
        profiles={profiles}
        memberships={memberships}
        roleAssignments={roleAssignments}
        roles={roles}
      />


      <TrainingHubRevenueLifecyclePanel
        organizations={organizations}
        courses={courses}
        proposals={proposals}
        orders={orders}
        invoices={invoices}
        credits={credits}
        sessions={sessions}
      />

      <TrainingHubDeliveryCertificationPanel
        organizations={organizations}
        courses={courses}
        sessions={sessions}
        participants={participants}
        certificates={certificates}
      />

      <TrainingHubPartnerBusinessDossierBoard
        organizations={organizations}
        accounts={accounts}
        subscriptions={subscriptions}
        proposals={proposals}
        orders={orders}
        invoices={invoices}
        credits={credits}
        sessions={sessions}
        participants={participants}
        certificates={certificates}
        profiles={profiles}
        memberships={memberships}
        courses={courses}
      />

      <TrainingHubPartnerLifecycleCommandDock
        organizations={organizations}
        courses={courses}
        proposals={proposals}
        orders={orders}
        invoices={invoices}
        credits={credits}
        sessions={sessions}
        participants={participants}
        certificates={certificates}
      />

      <TrainingHubPartnerMegaDossierPanel
        organizations={organizations}
        sites={sites}
        courses={courses}
        proposals={proposals}
        proposalItems={proposalItems}
        orders={orders}
        invoices={invoices}
        payments={payments}
        accounts={accounts}
        subscriptions={subscriptions}
        credits={credits}
        sessions={sessions}
        participants={participants}
        certificates={certificates}
        profiles={profiles}
        memberships={memberships}
        roleAssignments={roleAssignments}
        roles={roles}
      />

      <section style={filterPanelStyle}>
        <div style={filterHeaderStyle}>
          <div>
            <div style={sectionEyebrowStyle}>CONSOLE DES PROPOSITIONS</div>
            <h2 style={sectionTitleStyle}>Offres partenaires à piloter</h2>
            <p style={sectionTextStyle}>Cliquez sur une proposition pour ouvrir sa fiche complète : items, partenaire, facture, actions et conversion.</p>
          </div>
          <div style={resultBadgeStyle}>{filtered.length} résultat(s)</div>
        </div>

        <div style={filterBarStyle}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher proposition, partenaire ou type de compte…" style={searchStyle} />
          <select value={partnerId} onChange={(event) => setPartnerId(event.target.value)} style={selectStyle}>
            <option value="all">Tous les partenaires</option>
            {partnerOrganizations.map((org) => <option key={org.id} value={org.id}>{organizationName(org)}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={selectStyle}>
            <option value="all">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="sent">Envoyée</option>
            <option value="negotiation">Négociation</option>
            <option value="accepted">Acceptée</option>
            <option value="converted_to_order">Convertie</option>
          </select>
          <select value={amountFilter} onChange={(event) => setAmountFilter(event.target.value)} style={selectStyle}>
            <option value="all">Tous les montants</option>
            <option value="small">Moins de 5 000 MAD</option>
            <option value="medium">5 000 à 20 000 MAD</option>
            <option value="large">Plus de 20 000 MAD</option>
          </select>
        </div>

        <div style={proposalGridStyle}>
          {filtered.length ? filtered.slice(0, 80).map((row) => (
            <ProposalCard key={row.id} row={row} openDetail={openDetail} postAction={postAction} busy={busy} />
          )) : <Empty text="Aucune proposition ne correspond aux filtres." />}
        </div>
      </section>

      <section style={bottomGridStyle}>
        <article style={panelStyle}>
          <SectionHeader eyebrow="COMPTES PARTENAIRES" title="Activation commerciale" text="Vue rapide des partenaires avec compte ou abonnement." />
          <div style={accountListStyle}>
            {partnerOrganizations.slice(0, 12).map((org) => {
              const account = accountByOrg.get(org.id)
              const subscription = subscriptionByOrg.get(org.id)
              const tone = statusTone(subscription?.status || account?.status)
              return (
                <div key={org.id} style={accountRowStyle}>
                  <div>
                    <strong>{organizationName(org)}</strong>
                    <span>{clean(org.city, 'Ville non renseignée')} • {accountLabel(account, subscription)}</span>
                  </div>
                  <span style={{ ...badgeStyle, background: tone.bg, color: tone.fg, borderColor: tone.border }}>{statusLabel(subscription?.status || account?.status || 'pending')}</span>
                </div>
              )
            })}
          </div>
        </article>

        <article style={panelStyle}>
          <SectionHeader eyebrow="FACTURATION" title="Factures et encaissements" text="Liste courte des montants à suivre." />
          <div style={accountListStyle}>
            {invoices.slice(0, 12).map((invoice) => {
              const tone = statusTone(invoice.status)
              return (
                <div key={invoice.id} style={accountRowStyle}>
                  <div>
                    <strong>{invoice.invoice_number || invoice.id}</strong>
                    <span>Échéance {dateLabel(invoice.due_date)} • {money(invoiceDue(invoice), invoice.currency_code)}</span>
                  </div>
                  <span style={{ ...badgeStyle, background: tone.bg, color: tone.fg, borderColor: tone.border }}>{statusLabel(invoice.status)}</span>
                </div>
              )
            })}
            {!invoices.length ? <Empty text="Aucune facture à afficher." /> : null}
          </div>
        </article>
      </section>

      {message ? <div style={messageStyle}>{message}</div> : null}
      {queryWarnings.length ? <div style={warningStyle}>Certaines données commerciales ne sont pas encore alimentées. Les cartes se mettront à jour automatiquement dès que les comptes, factures ou paiements seront enregistrés.</div> : null}

      {modalMode === 'proposal-create' ? (
        <div style={modalBackdropStyle}>
          <div style={modalStyle}>
            <ModalHeader title="Nouvelle proposition partenaire" eyebrow="PROPOSAL BUILDER" close={() => setModalMode(null)} />
            <form onSubmit={createProposal} style={formStyle}>
              <div style={formGridStyle}>
                <SelectField label="Partenaire" value={createForm.organization_id} onChange={(value) => setCreateForm((current) => ({ ...current, organization_id: value }))} options={partnerOrganizations.map((org) => [org.id, organizationName(org)])} />
                <SelectField label="Formation" value={createForm.course_id} onChange={(value) => setCreateForm((current) => ({ ...current, course_id: value }))} options={courses.map((course) => [course.id, `${course.ref} • ${course.title}`])} />
              </div>
              <Field label="Titre de proposition" value={createForm.title} onChange={(value) => setCreateForm((current) => ({ ...current, title: value }))} />
              <div style={formGridStyle}>
                <Field label="Participants" type="number" value={createForm.participant_count} onChange={(value) => setCreateForm((current) => ({ ...current, participant_count: Number(value) }))} />
                <Field label="Heures demandées" type="number" value={createForm.requested_hours} onChange={(value) => setCreateForm((current) => ({ ...current, requested_hours: Number(value) }))} />
                <Field label="Remise commerciale MAD" type="number" value={createForm.commercial_discount_minor} onChange={(value) => setCreateForm((current) => ({ ...current, commercial_discount_minor: Number(value) }))} />
                <Field label="Validité" type="date" value={createForm.valid_until} onChange={(value) => setCreateForm((current) => ({ ...current, valid_until: value }))} />
              </div>
              <TextArea label="Note partenaire" value={createForm.partner_notes} onChange={(value) => setCreateForm((current) => ({ ...current, partner_notes: value }))} />
              <div style={modalActionsStyle}>
                <button type="button" onClick={() => setModalMode(null)} style={cancelButtonStyle}>Annuler</button>
                <button type="submit" disabled={busy} style={saveButtonStyle}>{busy ? 'Création…' : 'Créer la proposition'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {modalMode === 'proposal-detail' && selected ? (
        <div style={modalBackdropStyle}>
          <div style={modalStyle}>
            <ModalHeader title={selected.proposal_number || selected.title || 'Proposition'} eyebrow="FICHE COMMERCIALE" close={() => setModalMode(null)} />

            <section style={detailHeroStyle}>
              <div>
                <div style={detailRefStyle}>{selected.orgName} • {selected.accountType}</div>
                <h3 style={detailTitleStyle}>{selected.title || 'Proposition formation AngelCare'}</h3>
                <p style={detailTextStyle}>Montant proposé {money(proposalAmount(selected), selected.currency_code)} • validité {dateLabel(selected.valid_until)} • {selected.items.length} ligne(s).</p>
              </div>
              <div style={detailScoreStyle}>
                <span>Avancement</span>
                <strong>{selected.score}%</strong>
                <small>{statusLabel(selected.status)}</small>
              </div>
            </section>

            <div style={detailTabsStyle}>
              {(['vue', 'offre', 'facturation', 'partenaire', 'actions'] as DetailTab[]).map((tab) => (
                <button key={tab} type="button" onClick={() => setDetailTab(tab)} style={detailTab === tab ? detailTabActiveStyle : detailTabStyle}>
                  {tab === 'vue' && 'Vue globale'}
                  {tab === 'offre' && 'Offre'}
                  {tab === 'facturation' && 'Facturation'}
                  {tab === 'partenaire' && 'Partenaire'}
                  {tab === 'actions' && 'Actions'}
                </button>
              ))}
            </div>

            {detailTab === 'vue' ? (
              <section style={detailGridStyle}>
                <InfoCell label="Montant proposition" value={money(proposalAmount(selected), selected.currency_code)} text="Total proposé au partenaire" />
                <InfoCell label="Statut" value={statusLabel(selected.status)} text="Position dans le pipeline" />
                <InfoCell label="Commande" value={selected.order?.order_number || 'Non convertie'} text="Conversion commerciale" />
                <InfoCell label="Facture" value={selected.invoice?.invoice_number || 'Non générée'} text="Suivi encaissement" />
              </section>
            ) : null}

            {detailTab === 'offre' ? (
              <section style={listPanelStyle}>
                {selected.items.length ? selected.items.map((item: any) => {
                  const course = courseById.get(item.course_id)
                  return (
                    <div key={item.id} style={lineItemStyle}>
                      <div>
                        <strong>{item.description || course?.title || 'Formation'}</strong>
                        <span>{course?.ref || 'TRN'} • {item.participant_count || 0} participant(s) • {item.estimated_hours || 0}h</span>
                      </div>
                      <b>{money(item.line_total_minor, selected.currency_code)}</b>
                    </div>
                  )
                }) : <Empty text="Aucune ligne de proposition visible." />}
              </section>
            ) : null}

            {detailTab === 'facturation' ? (
              <section style={detailGridStyle}>
                <InfoCell label="Commande" value={selected.order?.order_number || 'À convertir'} text={selected.order ? statusLabel(selected.order.status) : 'Pas encore de commande'} />
                <InfoCell label="Facture" value={selected.invoice?.invoice_number || 'À générer'} text={selected.invoice ? `${statusLabel(selected.invoice.status)} • ${money(invoiceDue(selected.invoice), selected.invoice.currency_code)}` : 'Pas encore de facture'} />
                <InfoCell label="Paiements" value={money(paidAmount)} text="Total paiements enregistrés dans TrainingHub" />
                <InfoCell label="À encaisser" value={money(invoiceOpen)} text="Factures ouvertes sur le portefeuille" />
              </section>
            ) : null}

            {detailTab === 'partenaire' ? (
              <section style={detailGridStyle}>
                <InfoCell label="Établissement" value={selected.orgName} text={clean(selected.org?.city, 'Ville non renseignée')} />
                <InfoCell label="Compte" value={selected.accountType} text={statusLabel(selected.subscription?.status || selected.account?.status || 'pending')} />
                <InfoCell label="Date création" value={dateLabel(selected.created_at)} text="Entrée dans le pipeline" />
                <InfoCell label="Validité" value={dateLabel(selected.valid_until)} text="Date limite commerciale" />
              </section>
            ) : null}

            {detailTab === 'actions' ? (
              <section style={actionPanelStyle}>
                <button type="button" disabled={busy} onClick={() => postAction(`/api/traininghub/proposals/${selected.id}/send`, 'Proposition envoyée.')} style={actionPrimaryStyle}>Envoyer au partenaire</button>
                <button type="button" disabled={busy} onClick={() => postAction(`/api/traininghub/proposals/${selected.id}/accept`, 'Proposition acceptée.')} style={actionSuccessStyle}>Marquer acceptée</button>
                <button type="button" disabled={busy} onClick={() => postAction(`/api/traininghub/proposals/${selected.id}/convert-to-order`, 'Commande et facture générées.')} style={actionPrimaryStyle}>Convertir en commande + facture</button>
                <div style={actionNoteStyle}>Les actions respectent le cycle commercial : brouillon → envoyé → accepté → commande/facture. Les états non compatibles sont refusés automatiquement.</div>
              </section>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ProposalCard({ row, openDetail, postAction, busy }: { row: any; openDetail: (row: any, tab?: DetailTab) => void; postAction: (url: string, success: string) => Promise<void>; busy: boolean }) {
  const tone = statusTone(row.status)
  return (
    <article role="button" tabIndex={0} onClick={() => openDetail(row)} onKeyDown={(event) => { if (event.key === 'Enter') openDetail(row) }} style={proposalCardStyle}>
      <div style={proposalGlowStyle} />
      <div style={proposalTopStyle}>
        <div>
          <div style={proposalNumberStyle}>{row.proposal_number || 'Proposition'}</div>
          <h3 style={proposalTitleStyle}>{row.title || 'Offre formation partenaire'}</h3>
          <p style={proposalMetaStyle}>{row.orgName} • {row.accountType}</p>
        </div>
        <span style={{ ...badgeStyle, background: tone.bg, color: tone.fg, borderColor: tone.border }}>{statusLabel(row.status)}</span>
      </div>

      <div style={proposalAmountStyle}>{money(proposalAmount(row), row.currency_code)}</div>
      <div style={progressTrackStyle}><div style={{ ...progressFillStyle, width: `${row.score}%` }} /></div>

      <div style={proposalStatsStyle}>
        <div><strong>{row.items.length}</strong><span>lignes</span></div>
        <div><strong>{row.order ? 1 : 0}</strong><span>commande</span></div>
        <div><strong>{row.invoice ? 1 : 0}</strong><span>facture</span></div>
      </div>

      <div style={cardActionsStyle}>
        <button type="button" onClick={(event) => { event.stopPropagation(); openDetail(row, 'offre') }} style={cardButtonStyle}>Détail</button>
        <button type="button" disabled={busy} onClick={(event) => { event.stopPropagation(); postAction(`/api/traininghub/proposals/${row.id}/send`, 'Proposition envoyée.') }} style={cardButtonStyle}>Envoyer</button>
        <button type="button" disabled={busy} onClick={(event) => { event.stopPropagation(); postAction(`/api/traininghub/proposals/${row.id}/convert-to-order`, 'Commande et facture générées.') }} style={cardPrimaryButtonStyle}>Convertir</button>
      </div>
    </article>
  )
}

function Mini({ label, value }: { label: string; value: number }) {
  return <div style={miniStyle}><strong>{value}</strong><span>{label}</span></div>
}

function Metric({ label, value, detail, accent }: { label: string; value: ReactNode; detail: string; accent: string }) {
  return <article style={metricCardStyle}><div style={{ ...metricAccentStyle, background: accent }} /><strong>{value}</strong><span>{label}</span><small>{detail}</small></article>
}

function ModelCard({ title, value, text }: { title: string; value: number; text: string }) {
  return <div style={modelCardStyle}><strong>{value}</strong><span>{title}</span><small>{text}</small></div>
}

function SectionHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <div style={sectionHeaderStyle}><div style={sectionEyebrowStyle}>{eyebrow}</div><h2 style={sectionTitleStyle}>{title}</h2><p style={sectionTextStyle}>{text}</p></div>
}

function ModalHeader({ eyebrow, title, close }: { eyebrow: string; title: string; close: () => void }) {
  return <div style={modalTopStyle}><div><div style={sectionEyebrowStyle}>{eyebrow}</div><h2 style={modalTitleStyle}>{title}</h2></div><button type="button" onClick={close} style={closeButtonStyle}>×</button></div>
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: any; onChange: (value: string) => void; type?: string }) {
  return <label style={fieldStyle}><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle} /></label>
}

function TextArea({ label, value, onChange }: { label: string; value: any; onChange: (value: string) => void }) {
  return <label style={fieldStyle}><span>{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} style={textAreaStyle} /></label>
}

function SelectField({ label, value, onChange, options }: { label: string; value: any; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return <label style={fieldStyle}><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
}

function InfoCell({ label, value, text }: { label: string; value: ReactNode; text: string }) {
  return <div style={infoCellStyle}><span>{label}</span><strong>{value}</strong><small>{text}</small></div>
}

function Empty({ text }: { text: string }) {
  return <div style={emptyStyle}>{text}</div>
}

const pageStackStyle: CSSProperties = { display: 'grid', gap: 18 }
const heroStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1.25fr) minmax(360px,.75fr)', gap: 18 }
const heroCopyStyle: CSSProperties = { borderRadius: 34, padding: 28, background: 'radial-gradient(circle at top right, rgba(37,99,235,.13), transparent 36%), linear-gradient(135deg,#ffffff,#f8fbff)', border: '1px solid #dbeafe', boxShadow: '0 24px 64px rgba(15,23,42,.08)' }
const heroEyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 12, fontWeight: 950, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 12 }
const heroTitleStyle: CSSProperties = { margin: 0, maxWidth: 900, fontSize: 46, lineHeight: 1, letterSpacing: '-.06em', fontWeight: 980, color: '#0f172a' }
const heroTextStyle: CSSProperties = { margin: '15px 0 0', maxWidth: 830, color: '#475569', lineHeight: 1.7, fontSize: 15, fontWeight: 750 }
const heroActionsStyle: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 22 }
const primaryActionStyle: CSSProperties = { border: 0, borderRadius: 17, padding: '13px 16px', background: 'linear-gradient(135deg,#0f2a52,#2563eb)', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const secondaryActionStyle: CSSProperties = { ...primaryActionStyle, background: '#ecfeff', color: '#0f766e', border: '1px solid #99f6e4' }
const ghostActionStyle: CSSProperties = { ...primaryActionStyle, background: '#fff', color: '#475569', border: '1px solid #e2e8f0' }
const scorePanelStyle: CSSProperties = { borderRadius: 34, padding: 24, color: '#fff', background: 'radial-gradient(circle at top right, rgba(96,165,250,.32), transparent 34%), linear-gradient(160deg,#0b2348,#123c72 52%,#2557d6)', boxShadow: '0 24px 64px rgba(15,42,82,.22)' }
const scoreTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 16, fontWeight: 950 }
const scoreTrackStyle: CSSProperties = { height: 12, borderRadius: 999, background: 'rgba(255,255,255,.18)', overflow: 'hidden', marginBottom: 16 }
const scoreFillStyle: CSSProperties = { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#34d399,#60a5fa)' }
const scoreGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }
const miniStyle: CSSProperties = { display: 'grid', gap: 4, borderRadius: 18, padding: 13, background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.14)' }
const metricGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }
const metricCardStyle: CSSProperties = { position: 'relative', overflow: 'hidden', borderRadius: 24, padding: 18, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 16px 42px rgba(15,23,42,.06)', display: 'grid', gap: 5 }
const metricAccentStyle: CSSProperties = { position: 'absolute', top: 0, left: 0, right: 0, height: 4 }
const operatingGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 18 }
const panelStyle: CSSProperties = { borderRadius: 30, padding: 22, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 18px 48px rgba(15,23,42,.06)' }
const sectionHeaderStyle: CSSProperties = { marginBottom: 16 }
const sectionEyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }
const sectionTitleStyle: CSSProperties = { margin: 0, fontSize: 25, lineHeight: 1.08, letterSpacing: '-.04em', fontWeight: 950 }
const sectionTextStyle: CSSProperties = { margin: '7px 0 0', color: '#64748b', lineHeight: 1.55, fontSize: 13, fontWeight: 700, maxWidth: 780 }
const modelGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const modelCardStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 20, padding: 16, background: '#f8fbff', border: '1px solid #dbeafe' }
const stageListStyle: CSSProperties = { display: 'grid', gap: 10 }
const stageRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '12px minmax(0,1fr) 80px 140px', gap: 10, alignItems: 'center', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: 18, padding: 13, textAlign: 'left', cursor: 'pointer', color: '#0f172a' }
const stageDotStyle: CSSProperties = { width: 12, height: 12, borderRadius: 999 }
const filterPanelStyle: CSSProperties = { borderRadius: 32, padding: 22, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 18px 48px rgba(15,23,42,.06)' }
const filterHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 16 }
const resultBadgeStyle: CSSProperties = { borderRadius: 999, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '10px 12px', fontWeight: 950, whiteSpace: 'nowrap' }
const filterBarStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1.35fr) repeat(3,minmax(0,1fr))', gap: 10, marginBottom: 16 }
const searchStyle: CSSProperties = { border: '1px solid #dbeafe', background: '#fff', borderRadius: 16, padding: '13px 14px', fontWeight: 850, color: '#0f172a', outline: 'none' }
const selectStyle: CSSProperties = { border: '1px solid #e2e8f0', background: '#fff', borderRadius: 16, padding: '12px 13px', color: '#334155', fontWeight: 850 }
const proposalGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 16 }
const proposalCardStyle: CSSProperties = { position: 'relative', overflow: 'hidden', borderRadius: 28, padding: 20, background: 'linear-gradient(180deg,#ffffff,#f8fbff)', border: '1px solid #dbeafe', boxShadow: '0 18px 48px rgba(15,23,42,.07)', display: 'grid', gap: 14, cursor: 'pointer', outline: 'none' }
const proposalGlowStyle: CSSProperties = { position: 'absolute', right: -48, top: -48, width: 130, height: 130, borderRadius: 999, background: 'rgba(37,99,235,.10)', filter: 'blur(18px)' }
const proposalTopStyle: CSSProperties = { position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }
const proposalNumberStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 5 }
const proposalTitleStyle: CSSProperties = { margin: 0, fontSize: 18, lineHeight: 1.12, letterSpacing: '-.03em', fontWeight: 950 }
const proposalMetaStyle: CSSProperties = { margin: '7px 0 0', color: '#64748b', fontSize: 12, lineHeight: 1.45, fontWeight: 750 }
const proposalAmountStyle: CSSProperties = { position: 'relative', fontSize: 28, lineHeight: 1, fontWeight: 980, letterSpacing: '-.05em' }
const progressTrackStyle: CSSProperties = { position: 'relative', height: 8, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }
const progressFillStyle: CSSProperties = { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#34d399,#60a5fa)' }
const proposalStatsStyle: CSSProperties = { position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }
const cardActionsStyle: CSSProperties = { position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }
const cardButtonStyle: CSSProperties = { border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', borderRadius: 14, padding: '10px 12px', fontWeight: 950, cursor: 'pointer' }
const cardPrimaryButtonStyle: CSSProperties = { ...cardButtonStyle, background: '#0f2a52', color: '#fff', borderColor: '#0f2a52' }
const badgeStyle: CSSProperties = { border: '1px solid', borderRadius: 999, padding: '7px 10px', fontSize: 11, fontWeight: 950, whiteSpace: 'nowrap' }
const bottomGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }
const accountListStyle: CSSProperties = { display: 'grid', gap: 10 }
const accountRowStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: 18, padding: 13 }
const messageStyle: CSSProperties = { borderRadius: 18, padding: 14, background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#047857', fontWeight: 850 }
const warningStyle: CSSProperties = { borderRadius: 18, padding: 14, background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', fontWeight: 850 }
const emptyStyle: CSSProperties = { padding: 14, borderRadius: 16, background: '#f8fafc', color: '#64748b', fontWeight: 800, border: '1px dashed #cbd5e1' }
const modalBackdropStyle: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.42)', display: 'grid', placeItems: 'center', padding: 20, zIndex: 60 }
const modalStyle: CSSProperties = { width: 'min(1120px, 100%)', maxHeight: '90vh', overflow: 'auto', borderRadius: 34, padding: 26, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 30px 100px rgba(15,23,42,.30)' }
const modalTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 16 }
const modalTitleStyle: CSSProperties = { margin: 0, fontSize: 28, letterSpacing: '-.045em', fontWeight: 950 }
const closeButtonStyle: CSSProperties = { border: '1px solid #e2e8f0', background: '#fff', borderRadius: 14, width: 42, height: 42, fontSize: 24, cursor: 'pointer' }
const formStyle: CSSProperties = { display: 'grid', gap: 13 }
const formGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }
const fieldStyle: CSSProperties = { display: 'grid', gap: 6, color: '#334155', fontSize: 12, fontWeight: 950 }
const inputStyle: CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 15, padding: '12px 13px', color: '#0f172a', fontWeight: 800 }
const textAreaStyle: CSSProperties = { ...inputStyle, minHeight: 92, resize: 'vertical' }
const modalActionsStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, flexWrap: 'wrap' }
const cancelButtonStyle: CSSProperties = { border: '1px solid #e2e8f0', background: '#fff', color: '#475569', borderRadius: 15, padding: '12px 14px', fontWeight: 950, cursor: 'pointer' }
const saveButtonStyle: CSSProperties = { border: 0, background: 'linear-gradient(135deg,#0f2a52,#2563eb)', color: '#fff', borderRadius: 15, padding: '12px 14px', fontWeight: 950, cursor: 'pointer' }
const detailHeroStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 180px', gap: 18, borderRadius: 28, padding: 22, color: '#fff', background: 'radial-gradient(circle at top right, rgba(96,165,250,.30), transparent 38%), linear-gradient(135deg,#0b2348,#123c72 52%,#2557d6)', marginBottom: 14 }
const detailRefStyle: CSSProperties = { color: 'rgba(255,255,255,.72)', fontSize: 12, fontWeight: 950, letterSpacing: '.13em', textTransform: 'uppercase', marginBottom: 9 }
const detailTitleStyle: CSSProperties = { margin: 0, fontSize: 36, lineHeight: 1, letterSpacing: '-.055em', fontWeight: 980 }
const detailTextStyle: CSSProperties = { margin: '12px 0 0', color: 'rgba(255,255,255,.78)', lineHeight: 1.65, fontWeight: 750 }
const detailScoreStyle: CSSProperties = { display: 'grid', gap: 4, alignContent: 'center', justifyItems: 'center', borderRadius: 22, background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.14)', padding: 16 }
const detailTabsStyle: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', padding: 8, borderRadius: 20, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 14 }
const detailTabStyle: CSSProperties = { border: 0, borderRadius: 14, background: 'transparent', color: '#475569', padding: '10px 13px', fontWeight: 950, cursor: 'pointer' }
const detailTabActiveStyle: CSSProperties = { ...detailTabStyle, background: '#0f2a52', color: '#fff' }
const detailGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }
const infoCellStyle: CSSProperties = { display: 'grid', gap: 6, borderRadius: 20, padding: 18, background: '#f8fbff', border: '1px solid #dbeafe' }
const listPanelStyle: CSSProperties = { display: 'grid', gap: 10 }
const lineItemStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', borderRadius: 18, padding: 14, background: '#f8fafc', border: '1px solid #e2e8f0' }
const actionPanelStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const actionPrimaryStyle: CSSProperties = { border: 0, borderRadius: 18, padding: 16, color: '#fff', background: 'linear-gradient(135deg,#0f2a52,#2563eb)', fontWeight: 950, cursor: 'pointer' }
const actionSuccessStyle: CSSProperties = { ...actionPrimaryStyle, background: 'linear-gradient(135deg,#047857,#10b981)' }
const actionNoteStyle: CSSProperties = { gridColumn: '1 / -1', padding: 14, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 750, lineHeight: 1.5 }
