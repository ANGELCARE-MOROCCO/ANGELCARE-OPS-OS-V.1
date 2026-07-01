'use client'

import { useMemo, useState, type CSSProperties } from 'react'

type JsonRecord = Record<string, any>

type Organization = {
  id: string
  name?: string | null
  legal_name?: string | null
  organization_type?: string | null
  status?: string | null
  city?: string | null
  currency_code?: string | null
}

type Course = {
  id: string
  ref?: string | null
  title?: string | null
  short_description?: string | null
  onsite_entry_price_minor?: number | null
  refresh_entry_price_minor?: number | null
  currency_code?: string | null
  starter_min_participants?: number | null
  starter_max_participants?: number | null
  min_hours?: number | null
  max_hours?: number | null
  positioning_tags?: string[] | null
}

type Proposal = {
  id: string
  organization_id?: string | null
  proposal_number?: string | null
  status?: string | null
  title?: string | null
  valid_until?: string | null
  currency_code?: string | null
  subtotal_minor?: number | null
  discount_total_minor?: number | null
  grand_total_minor?: number | null
  sent_at?: string | null
  accepted_at?: string | null
  converted_order_id?: string | null
  created_at?: string | null
}

type Props = {
  organizations: Organization[]
  courses: Course[]
  proposals: Proposal[]
  proposalItems: JsonRecord[]
  orders: JsonRecord[]
  invoices: JsonRecord[]
  pricingRules: JsonRecord[]
}

type DraftItem = {
  courseRef: string
  participantCount: number
  requestedHours: number
  travelFeeMinor: number
  rushFeeMinor: number
  kitFeeMinor: number
  customMaterialFeeMinor: number
  commercialDiscountMinor: number
}

function money(amountMinor?: number | null, currency = 'MAD') {
  const value = Number(amountMinor || 0) / 100
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(value)} ${currency}`
}

function todayPlus(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function normalize(value: unknown) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function numberFromInput(value: string, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function minorFromMad(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 100)) : 0
}

export default function TrainingHubCommercialWorkspaceClient({ organizations, courses, proposals, proposalItems, orders, invoices, pricingRules }: Props) {
  const partnerOrganizations = useMemo(
    () => organizations.filter((org) => org.organization_type === 'partner_school' || org.organization_type === 'angelcare_internal'),
    [organizations],
  )

  const defaultOrgId = partnerOrganizations[0]?.id || organizations[0]?.id || ''
  const defaultCourseRef = courses[0]?.ref || 'TR-01-01'

  const [organizationId, setOrganizationId] = useState(defaultOrgId)
  const [title, setTitle] = useState('Proposition formations AngelCare TrainingHub')
  const [validUntil, setValidUntil] = useState(todayPlus(15))
  const [paymentTerms, setPaymentTerms] = useState('Acompte requis avant planification. Solde selon accord commercial.')
  const [partnerNotes, setPartnerNotes] = useState('Prix starter valable pour 3 à 8 participants. Distribution 6 à 15 heures à valider en réunion.')
  const [items, setItems] = useState<DraftItem[]>([
    { courseRef: defaultCourseRef, participantCount: 8, requestedHours: 6, travelFeeMinor: 0, rushFeeMinor: 0, kitFeeMinor: 0, customMaterialFeeMinor: 0, commercialDiscountMinor: 0 },
  ])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [previewResult, setPreviewResult] = useState<JsonRecord | null>(null)
  const [createResult, setCreateResult] = useState<JsonRecord | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const organizationsById = useMemo(() => {
    const map = new Map<string, Organization>()
    for (const org of organizations) map.set(org.id, org)
    return map
  }, [organizations])

  const coursesByRef = useMemo(() => {
    const map = new Map<string, Course>()
    for (const course of courses) if (course.ref) map.set(course.ref, course)
    return map
  }, [courses])

  const filteredProposals = useMemo(() => {
    const q = normalize(search)
    return proposals.filter((proposal) => {
      const org = proposal.organization_id ? organizationsById.get(proposal.organization_id) : null
      const text = normalize([proposal.proposal_number, proposal.title, proposal.status, org?.name, org?.city].join(' '))
      const matchesSearch = !q || text.includes(q)
      const matchesStatus = statusFilter === 'ALL' || proposal.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [organizationsById, proposals, search, statusFilter])

  const proposalCounts = useMemo(() => {
    const draft = proposals.filter((p) => p.status === 'draft').length
    const sent = proposals.filter((p) => p.status === 'sent').length
    const accepted = proposals.filter((p) => p.status === 'accepted').length
    const converted = proposals.filter((p) => p.status === 'converted_to_order' || p.converted_order_id).length
    return { draft, sent, accepted, converted }
  }, [proposals])

  const estimatedTotal = items.reduce((sum, item) => {
    const course = coursesByRef.get(item.courseRef)
    return sum + Number(course?.onsite_entry_price_minor || 0) + item.travelFeeMinor + item.rushFeeMinor + item.kitFeeMinor + item.customMaterialFeeMinor - item.commercialDiscountMinor
  }, 0)

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
  }

  function addItem() {
    setItems((current) => [
      ...current,
      { courseRef: defaultCourseRef, participantCount: 8, requestedHours: 6, travelFeeMinor: 0, rushFeeMinor: 0, kitFeeMinor: 0, customMaterialFeeMinor: 0, commercialDiscountMinor: 0 },
    ])
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_item, itemIndex) => itemIndex !== index))
  }

  async function previewFirstItem() {
    setBusy(true)
    setError(null)
    setPreviewResult(null)
    try {
      const first = items[0]
      const response = await fetch('/api/traininghub/pricing/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_ref: first.courseRef,
          participant_count: first.participantCount,
          requested_hours: first.requestedHours,
          city: organizationsById.get(organizationId)?.city || 'Rabat',
        }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json?.error || json?.message || 'Pricing preview failed')
      setPreviewResult(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function createDraftProposal() {
    if (!organizationId) {
      setError('Create a partner organization first or select an available organization.')
      return
    }
    setBusy(true)
    setError(null)
    setCreateResult(null)
    try {
      const response = await fetch('/api/traininghub/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          title,
          valid_until: validUntil,
          payment_terms: paymentTerms,
          partner_notes: partnerNotes,
          items: items.map((item) => ({
            course_ref: item.courseRef,
            participant_count: item.participantCount,
            requested_hours: item.requestedHours,
            estimated_hours: item.requestedHours,
            travel_fee_minor: item.travelFeeMinor,
            rush_fee_minor: item.rushFeeMinor,
            kit_fee_minor: item.kitFeeMinor,
            custom_material_fee_minor: item.customMaterialFeeMinor,
            commercial_discount_minor: item.commercialDiscountMinor,
            metadata: { source: 'traininghub_commercial_workspace_ui' },
          })),
          metadata: { source: 'traininghub_commercial_workspace_ui' },
        }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json?.error || json?.message || 'Proposal creation failed')
      setCreateResult(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={workspaceStyle}>
      <section style={kpiGridStyle}>
        <Metric label="Drafts" value={proposalCounts.draft} detail="À préparer" />
        <Metric label="Envoyées" value={proposalCounts.sent} detail="En attente client" />
        <Metric label="Acceptées" value={proposalCounts.accepted} detail="À convertir" />
        <Metric label="Orders" value={orders.length} detail={`${invoices.length} invoices`} />
      </section>

      <section style={builderPanelStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <div style={eyebrowStyle}>PROPOSAL BUILDER</div>
            <h2 style={sectionTitleStyle}>Créer une proposition formation</h2>
            <p style={sectionTextStyle}>Le workspace respecte le pricing DB : starter 3–8 participants, 6–15h, custom quote si dépassement, proposition → order → invoice.</p>
          </div>
          <div style={estimateCardStyle}>
            <span>Estimation locale</span>
            <strong>{money(estimatedTotal)}</strong>
            <small>Le calcul officiel reste côté API.</small>
          </div>
        </div>

        <div style={formGridStyle}>
          <label style={fieldStyle}>
            <span>Organisation partenaire</span>
            <select value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} style={inputStyle}>
              <option value="">Sélectionner une organisation</option>
              {partnerOrganizations.map((org) => (
                <option key={org.id} value={org.id}>{org.name} • {org.organization_type} • {org.city || 'Ville'}</option>
              ))}
            </select>
          </label>
          <label style={fieldStyle}>
            <span>Titre proposition</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} style={inputStyle} />
          </label>
          <label style={fieldStyle}>
            <span>Validité</span>
            <input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} style={inputStyle} />
          </label>
        </div>

        <div style={itemsStyle}>
          {items.map((item, index) => {
            const course = coursesByRef.get(item.courseRef)
            const customFlag = item.participantCount > Number(course?.starter_max_participants || 8) || item.requestedHours > Number(course?.max_hours || 15)
            const minimumFlag = item.participantCount < Number(course?.starter_min_participants || 3)
            return (
              <div key={`${item.courseRef}-${index}`} style={itemCardStyle}>
                <div style={itemTopStyle}>
                  <strong>Formation #{index + 1}</strong>
                  <div style={itemActionsStyle}>
                    {customFlag ? <span style={dangerPillStyle}>Custom quote</span> : null}
                    {minimumFlag ? <span style={warningPillStyle}>Minimum commercial</span> : null}
                    {items.length > 1 ? <button type="button" onClick={() => removeItem(index)} style={ghostDangerButtonStyle}>Retirer</button> : null}
                  </div>
                </div>
                <div style={itemGridStyle}>
                  <label style={fieldStyle}>
                    <span>Cours</span>
                    <select value={item.courseRef} onChange={(event) => updateItem(index, { courseRef: event.target.value })} style={inputStyle}>
                      {courses.map((courseOption) => <option key={courseOption.id} value={courseOption.ref || ''}>{courseOption.ref} — {courseOption.title}</option>)}
                    </select>
                  </label>
                  <label style={fieldStyle}>
                    <span>Participants</span>
                    <input type="number" min={1} value={item.participantCount} onChange={(event) => updateItem(index, { participantCount: numberFromInput(event.target.value, 8) })} style={inputStyle} />
                  </label>
                  <label style={fieldStyle}>
                    <span>Heures</span>
                    <input type="number" min={1} value={item.requestedHours} onChange={(event) => updateItem(index, { requestedHours: numberFromInput(event.target.value, 6) })} style={inputStyle} />
                  </label>
                  <label style={fieldStyle}>
                    <span>Déplacement MAD</span>
                    <input type="number" min={0} onChange={(event) => updateItem(index, { travelFeeMinor: minorFromMad(event.target.value) })} style={inputStyle} placeholder="0" />
                  </label>
                  <label style={fieldStyle}>
                    <span>Rush MAD</span>
                    <input type="number" min={0} onChange={(event) => updateItem(index, { rushFeeMinor: minorFromMad(event.target.value) })} style={inputStyle} placeholder="0" />
                  </label>
                  <label style={fieldStyle}>
                    <span>Remise MAD</span>
                    <input type="number" min={0} onChange={(event) => updateItem(index, { commercialDiscountMinor: minorFromMad(event.target.value) })} style={inputStyle} placeholder="0" />
                  </label>
                </div>
                <div style={courseInfoStyle}>
                  <span><strong>{money(course?.onsite_entry_price_minor, course?.currency_code || 'MAD')}</strong> onsite starter</span>
                  <span>Refresh {money(course?.refresh_entry_price_minor, course?.currency_code || 'MAD')}</span>
                  <span>{course?.starter_min_participants || 3}-{course?.starter_max_participants || 8} participants</span>
                  <span>{course?.min_hours || 6}-{course?.max_hours || 15}h</span>
                </div>
              </div>
            )
          })}
        </div>

        <div style={notesGridStyle}>
          <label style={fieldStyle}>
            <span>Conditions paiement</span>
            <textarea value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} style={textareaStyle} />
          </label>
          <label style={fieldStyle}>
            <span>Notes partenaire</span>
            <textarea value={partnerNotes} onChange={(event) => setPartnerNotes(event.target.value)} style={textareaStyle} />
          </label>
        </div>

        <div style={builderActionsStyle}>
          <button type="button" onClick={addItem} style={secondaryButtonStyle}>+ Ajouter une formation</button>
          <button type="button" onClick={previewFirstItem} disabled={busy} style={secondaryButtonStyle}>Preview pricing #1</button>
          <button type="button" onClick={createDraftProposal} disabled={busy || !organizationId} style={primaryButtonStyle}>Créer draft proposal</button>
        </div>

        {error ? <div style={errorStyle}>{error}</div> : null}
        {previewResult ? <Result title="Pricing preview" data={previewResult} /> : null}
        {createResult ? <Result title="Proposal créée" data={createResult} /> : null}
      </section>

      <section style={mainGridStyle}>
        <div style={panelStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={eyebrowStyle}>PIPELINE</div>
              <h2 style={sectionTitleStyle}>Propositions</h2>
            </div>
            <div style={filterBarStyle}>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Recherche proposal, école, statut..." style={smallInputStyle} />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={smallInputStyle}>
                <option value="ALL">Tous</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="converted_to_order">Converted</option>
              </select>
            </div>
          </div>

          <div style={proposalListStyle}>
            {filteredProposals.length ? filteredProposals.map((proposal) => {
              const org = proposal.organization_id ? organizationsById.get(proposal.organization_id) : null
              const itemsCount = proposalItems.filter((item) => item.proposal_id === proposal.id).length
              return (
                <article key={proposal.id} style={proposalCardStyle}>
                  <div style={proposalTopStyle}>
                    <strong>{proposal.proposal_number || 'Proposal'}</strong>
                    <span style={statusPillStyle}>{proposal.status || 'draft'}</span>
                  </div>
                  <h3 style={proposalTitleStyle}>{proposal.title || 'Training proposal'}</h3>
                  <p style={proposalMetaStyle}>{org?.name || 'Organisation'} • {itemsCount} ligne(s) • validité {proposal.valid_until || 'à définir'}</p>
                  <div style={proposalBottomStyle}>
                    <strong>{money(proposal.grand_total_minor, proposal.currency_code || 'MAD')}</strong>
                    <a href={`/api/traininghub/proposals/${proposal.id}`} style={apiLinkStyle}>API detail</a>
                  </div>
                </article>
              )
            }) : <div style={emptyStyle}>Aucune proposition ne correspond au filtre.</div>}
          </div>
        </div>

        <aside style={sidePanelStyle}>
          <h2 style={sectionTitleStyle}>Commercial control</h2>
          <div style={controlListStyle}>
            <Control label="Pricing rules" value={pricingRules.length} detail="Règles DB actives" />
            <Control label="Orders" value={orders.length} detail="Convertis depuis proposals" />
            <Control label="Invoices" value={invoices.length} detail="Facturation TrainingHub" />
            <Control label="Courses" value={courses.length} detail="Catalogue disponible" />
          </div>
          <div style={doctrineBoxStyle}>
            <strong>Doctrine</strong>
            <span>Une proposition ne démarre pas le delivery. Elle doit être acceptée, convertie en order, puis liée à invoice / payment avant planification.</span>
          </div>
        </aside>
      </section>
    </div>
  )
}

function Metric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <div style={metricStyle}><strong>{value}</strong><span>{label}</span><small>{detail}</small></div>
}

function Control({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <div style={controlStyle}><strong>{value}</strong><span>{label}</span><small>{detail}</small></div>
}

function Result({ title, data }: { title: string; data: JsonRecord }) {
  return (
    <details open style={resultStyle}>
      <summary style={resultSummaryStyle}>{title}</summary>
      <pre style={preStyle}>{JSON.stringify(data, null, 2)}</pre>
    </details>
  )
}

const workspaceStyle: CSSProperties = { display: 'grid', gap: 18 }
const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }
const metricStyle: CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: 18, boxShadow: '0 16px 40px rgba(15,23,42,.06)', display: 'grid', gap: 4 }
const builderPanelStyle: CSSProperties = { background: '#fff', border: '1px solid #dbeafe', borderRadius: 30, padding: 20, boxShadow: '0 18px 46px rgba(15,23,42,.08)' }
const sectionHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 16 }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 6 }
const sectionTitleStyle: CSSProperties = { margin: 0, fontSize: 22, fontWeight: 950, color: '#0f172a', letterSpacing: '-.03em' }
const sectionTextStyle: CSSProperties = { margin: '8px 0 0', color: '#64748b', fontSize: 13, fontWeight: 750, lineHeight: 1.55, maxWidth: 720 }
const estimateCardStyle: CSSProperties = { minWidth: 180, border: '1px solid #bfdbfe', background: '#eff6ff', borderRadius: 22, padding: 14, display: 'grid', gap: 4, color: '#1e3a8a' }
const formGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1.2fr 1.4fr .7fr', gap: 12, marginBottom: 14 }
const fieldStyle: CSSProperties = { display: 'grid', gap: 6, color: '#334155', fontSize: 12, fontWeight: 950 }
const inputStyle: CSSProperties = { width: '100%', border: '1px solid #cbd5e1', borderRadius: 14, padding: '12px 12px', fontWeight: 850, color: '#0f172a', background: '#fff' }
const smallInputStyle: CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 13, padding: '10px 11px', fontWeight: 850, color: '#0f172a', background: '#fff' }
const textareaStyle: CSSProperties = { ...inputStyle, minHeight: 92, resize: 'vertical' }
const itemsStyle: CSSProperties = { display: 'grid', gap: 12 }
const itemCardStyle: CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 22, padding: 15, background: '#f8fafc' }
const itemTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }
const itemActionsStyle: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }
const itemGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1.6fr .55fr .45fr .55fr .45fr .45fr', gap: 10 }
const courseInfoStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, color: '#475569', fontSize: 12, fontWeight: 850 }
const warningPillStyle: CSSProperties = { borderRadius: 999, background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', padding: '6px 9px', fontSize: 11, fontWeight: 950 }
const dangerPillStyle: CSSProperties = { borderRadius: 999, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '6px 9px', fontSize: 11, fontWeight: 950 }
const statusPillStyle: CSSProperties = { borderRadius: 999, background: '#eff6ff', color: '#1d4ed8', padding: '6px 9px', fontSize: 11, fontWeight: 950 }
const notesGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }
const builderActionsStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14, flexWrap: 'wrap' }
const primaryButtonStyle: CSSProperties = { border: 0, background: '#0f2a52', color: '#fff', borderRadius: 15, padding: '12px 14px', fontWeight: 950, cursor: 'pointer' }
const secondaryButtonStyle: CSSProperties = { border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', borderRadius: 15, padding: '12px 14px', fontWeight: 950, cursor: 'pointer' }
const ghostDangerButtonStyle: CSSProperties = { border: '1px solid #fecaca', background: '#fff', color: '#991b1b', borderRadius: 13, padding: '8px 10px', fontWeight: 950, cursor: 'pointer' }
const errorStyle: CSSProperties = { marginTop: 12, border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', borderRadius: 16, padding: 12, fontWeight: 850 }
const resultStyle: CSSProperties = { marginTop: 12, border: '1px solid #dbeafe', background: '#eff6ff', borderRadius: 18, padding: 12 }
const resultSummaryStyle: CSSProperties = { cursor: 'pointer', fontWeight: 950, color: '#1e3a8a' }
const preStyle: CSSProperties = { overflow: 'auto', maxHeight: 280, whiteSpace: 'pre-wrap', fontSize: 11, color: '#0f172a' }
const mainGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 330px', gap: 16 }
const panelStyle: CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 28, padding: 20, boxShadow: '0 16px 40px rgba(15,23,42,.06)' }
const filterBarStyle: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center' }
const proposalListStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }
const proposalCardStyle: CSSProperties = { border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: 20, padding: 15, display: 'grid', gap: 8 }
const proposalTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', color: '#1d4ed8', fontSize: 12, fontWeight: 950 }
const proposalTitleStyle: CSSProperties = { margin: 0, color: '#0f172a', fontSize: 16, fontWeight: 950 }
const proposalMetaStyle: CSSProperties = { margin: 0, color: '#64748b', fontSize: 12, fontWeight: 800, lineHeight: 1.45 }
const proposalBottomStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginTop: 4 }
const apiLinkStyle: CSSProperties = { borderRadius: 12, background: '#0f2a52', color: '#fff', padding: '8px 10px', textDecoration: 'none', fontWeight: 950, fontSize: 11 }
const emptyStyle: CSSProperties = { color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 18, padding: 14, fontWeight: 850 }
const sidePanelStyle: CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 28, padding: 20, boxShadow: '0 16px 40px rgba(15,23,42,.06)', alignSelf: 'start' }
const controlListStyle: CSSProperties = { display: 'grid', gap: 10, marginTop: 15 }
const controlStyle: CSSProperties = { border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: 18, padding: 13, display: 'grid', gap: 3 }
const doctrineBoxStyle: CSSProperties = { marginTop: 14, borderRadius: 20, padding: 15, background: '#0f2a52', color: '#fff', display: 'grid', gap: 8, fontWeight: 850, lineHeight: 1.5 }
