'use client'

import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'slate'
type OfferView = 'overview' | 'drafts' | 'sent' | 'accepted' | 'converted' | 'portal' | 'expired' | 'audit'
type ModalType = null | 'create' | 'edit' | 'preview' | 'delete' | 'bulk' | 'convert' | 'portal' | 'print'

type OfferLine = { id: string; label: string; code: string; quantity: number; unitMinor: number; totalMinor: number; category: string }
type PartnerOption = { id: string; name: string; city: string; status: string; owner: string }
type OfferRecord = {
  id: string; organizationId: string; partnerName: string; partnerCity: string; owner: string; number: string; title: string; status: string; packageId: string; packageLabel: string; amountMinor: number; currency: string; credits: number; participants: number; portalVisible: boolean; createdAt: string; updatedAt: string; validUntil: string; linked: Record<string, boolean>; lines: OfferLine[]
}
type Workspace = {
  generatedAt: string
  offers: OfferRecord[]
  partners: PartnerOption[]
  kpis: Array<{ id: string; label: string; value: string | number; sublabel: string; tone: Tone }>
  packages: Array<{ id: string; label: string; amountMinor: number; credits: number; participants: number; description: string }>
  lineCatalogue: OfferLine[]
  syncHealth: { score: number; warnings: string[]; tables: Array<{ table: string; count: number; ok: boolean; error: string | null }> }
}
type OfferForm = {
  offer_id: string; organization_id: string; title: string; package: string; amount_minor: number; credits: number; participants: number; status: string; currency: string; billing_period: string; payment_policy: string; renewal_policy: string; valid_until: string; portal_visible: boolean; notes: string; lines: OfferLine[]; packages: string[]
}

const DEFAULT_FORM: OfferForm = { offer_id: '', organization_id: '', title: 'Offre TrainingHub partenaire', package: 'activation', amount_minor: 720000, credits: 10, participants: 10, status: 'draft', currency: 'MAD', billing_period: 'annual', payment_policy: 'manual_agreement', renewal_policy: 'manual_review_30_days_before_end', valid_until: '', portal_visible: false, notes: '', lines: [], packages: ['activation', 'growth'] }
const NAV: Array<{ id: OfferView; label: string }> = [{ id: 'overview', label: 'Toutes' }, { id: 'drafts', label: 'Brouillons' }, { id: 'sent', label: 'Envoyées' }, { id: 'accepted', label: 'Acceptées' }, { id: 'converted', label: 'Converties' }, { id: 'portal', label: 'Portail visible' }, { id: 'expired', label: 'Expirées' }, { id: 'audit', label: 'Audit' }]
const money = (minor: number) => `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format((Number(minor) || 0) / 100)} MAD`
const normal = (v: unknown) => String(v || '').trim().toLowerCase()
const toneBg = (tone: Tone) => tone === 'green' ? '#ecfdf5' : tone === 'amber' ? '#fff7ed' : tone === 'red' ? '#fef2f2' : tone === 'violet' ? '#f5f3ff' : tone === 'slate' ? '#f8fafc' : '#eff6ff'
const toneBorder = (tone: Tone) => tone === 'green' ? '#bbf7d0' : tone === 'amber' ? '#fed7aa' : tone === 'red' ? '#fecaca' : tone === 'violet' ? '#ddd6fe' : tone === 'slate' ? '#e2e8f0' : '#bfdbfe'
const toneText = (tone: Tone) => tone === 'green' ? '#047857' : tone === 'amber' ? '#c2410c' : tone === 'red' ? '#b91c1c' : tone === 'violet' ? '#6d28d9' : tone === 'slate' ? '#475569' : '#1d4ed8'
const statusTone = (status: string): Tone => ['accepted','converted','signed','validated'].includes(normal(status)) ? 'green' : ['sent','viewed','negotiation'].includes(normal(status)) ? 'amber' : ['rejected','expired'].includes(normal(status)) ? 'red' : ['draft','archived'].includes(normal(status)) ? 'slate' : 'blue'
const dateLabel = (value: string) => { try { return value ? new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium' }).format(new Date(value)) : '—' } catch { return value || '—' } }
const sidebarHref = (item: string) => ({ 'Command Center': '/traininghub', 'Partenaires': '/traininghub/partners', 'Dossier partenaire': '/traininghub/partners?view=dossier', 'Commercial': '/traininghub/commercial', 'Offres': '/traininghub/offres', 'Commandes': '/traininghub/commercial?view=orders', 'Facturation': '/traininghub/commercial?view=billing', 'Crédits formation': '/traininghub/commercial?view=credits', 'Catalogue': '/traininghub/catalogue', 'Catégories': '/traininghub/categories', 'Sessions': '/traininghub/sessions', 'Participants': '/traininghub/participants', 'Formateurs': '/traininghub/trainers', 'Présences': '/traininghub/attendance', 'Certificats': '/traininghub/certificates', 'Documents': '/traininghub/documents', 'Rapports': '/traininghub/reports' }[item] || '/traininghub')

export default function TrainingHubOffersCommandCenter() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [view, setView] = useState<OfferView>('overview')
  const [query, setQuery] = useState('')
  const [partnerFilter, setPartnerFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<OfferRecord | null>(null)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [modal, setModal] = useState<ModalType>(null)
  const [form, setForm] = useState<OfferForm>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch('/api/traininghub/offres/workspace', { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        setMessage(payload?.error || 'Impossible de charger les offres.')
        return
      }
      setWorkspace(payload.data)
      const warnings = payload.data?.syncHealth?.warnings || []
      setMessage(warnings.length ? `${warnings.length} table(s) à vérifier. Les offres disponibles restent affichées.` : null)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const offers = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (workspace?.offers || []).filter((offer) => {
      const s = normal(offer.status)
      const matchesQuery = !q || `${offer.title} ${offer.partnerName} ${offer.number} ${offer.owner} ${offer.packageLabel}`.toLowerCase().includes(q)
      const matchesPartner = partnerFilter === 'all' || offer.organizationId === partnerFilter
      const matchesStatus = statusFilter === 'all' || s === statusFilter
      const matchesView = view === 'overview' || (view === 'drafts' && s === 'draft') || (view === 'sent' && ['sent','viewed','negotiation'].includes(s)) || (view === 'accepted' && ['accepted','signed','validated'].includes(s)) || (view === 'converted' && (s === 'converted' || offer.linked.order)) || (view === 'portal' && offer.portalVisible) || (view === 'expired' && ['expired','rejected'].includes(s)) || view === 'audit'
      return matchesQuery && matchesPartner && matchesStatus && matchesView
    })
  }, [workspace, query, partnerFilter, statusFilter, view])

  const selectedCount = Object.values(checked).filter(Boolean).length
  const patch = (key: keyof OfferForm, value: any) => setForm((current) => ({ ...current, [key]: value }))

  function resetForm(offer?: OfferRecord | null) {
    if (!offer) {
      const first = workspace?.partners?.[0]
      setForm({ ...DEFAULT_FORM, organization_id: first?.id || '' })
      return
    }
    setForm({ offer_id: offer.id, organization_id: offer.organizationId, title: offer.title, package: offer.packageId, amount_minor: offer.amountMinor, credits: offer.credits, participants: offer.participants, status: offer.status, currency: offer.currency, billing_period: 'annual', payment_policy: 'manual_agreement', renewal_policy: 'manual_review_30_days_before_end', valid_until: offer.validUntil, portal_visible: offer.portalVisible, notes: '', lines: offer.lines, packages: ['activation','growth'] })
  }

  function openModal(type: ModalType, offer?: OfferRecord | null) {
    if (offer) setSelected(offer)
    resetForm(offer || selected)
    setModal(type)
  }

  function selectPackage(packageId: string) {
    const pack = workspace?.packages?.find((p) => p.id === packageId)
    if (!pack) return
    setForm((current) => ({ ...current, package: pack.id, title: `${pack.label} TrainingHub`, amount_minor: pack.amountMinor || current.amount_minor, credits: pack.credits || current.credits, participants: pack.participants || current.participants }))
  }

  function toggleLine(line: OfferLine) {
    setForm((current) => ({ ...current, lines: current.lines.some((item) => item.id === line.id) ? current.lines.filter((item) => item.id !== line.id) : [...current.lines, line] }))
  }

  async function runAction(action: string, extra?: Record<string, any>) {
    setSaving(true)
    setMessage(null)
    try {
      const response = await fetch('/api/traininghub/offres/actions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', body: JSON.stringify({ action, payload: { ...form, ...(extra || {}) } }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        setMessage(payload?.error || `Action impossible : ${action}`)
        return
      }
      setMessage(`Action exécutée : ${action}`)
      setModal(null)
      setChecked({})
      await load()
    } finally { setSaving(false) }
  }

  async function bulkStatus(status: string) {
    const ids = Object.entries(checked).filter(([, v]) => v).map(([id]) => id)
    for (const id of ids) await runAction(status === 'sent' ? 'send_offer' : status === 'accepted' ? 'accept_offer' : 'archive_offer', { offer_id: id })
  }

  if (loading && !workspace) return <main style={loadingStyle}>Chargement du cockpit Offres TrainingHub…</main>

  return (
    <main style={shellStyle}>
      <aside style={sidebarStyle}>
        <div style={brandCardStyle}><div style={logoBoxStyle}>ANGEL CARE</div><strong>TrainingHub</strong><span>Internal Admin OS</span></div>
        <SideGroup title="Pilotage" items={['Command Center']} active="" />
        <SideGroup title="Partenaires" items={['Partenaires', 'Dossier partenaire']} active="" />
        <SideGroup title="Revenus" items={['Commercial', 'Offres', 'Commandes', 'Facturation', 'Crédits formation']} active="Offres" />
        <SideGroup title="Delivery" items={['Catalogue', 'Catégories', 'Sessions', 'Participants', 'Formateurs', 'Présences']} active="" />
        <SideGroup title="Preuves" items={['Certificats', 'Documents', 'Rapports']} active="" />
      </aside>

      <section style={workspaceStyle}>
        <header style={topbarStyle}>
          <div><div style={eyebrowStyle}>ANGELCARE TRAININGHUB • REVENUS</div><h1 style={pageTitleStyle}>Offres management</h1><p style={pageLeadStyle}>Créer, éditer, convertir, publier, imprimer et supprimer définitivement les offres TrainingHub.</p></div>
          <div style={topActionsStyle}><button style={ghostButtonStyle} onClick={() => openModal('print')}>Rapport A4</button><button style={ghostButtonStyle} onClick={() => openModal('bulk')}>Créer multiple</button><button style={primaryButtonStyle} onClick={() => openModal('create', null)}>Créer offre</button></div>
        </header>

        {message ? <div style={messageStyle}>{message}</div> : null}

        <section style={heroStyle}>
          <div><div style={eyebrowStyle}>OFFER STUDIO • COMMERCIAL OPS</div><h2 style={heroTitleStyle}>Pilotez toutes les offres existantes et créez des propositions prêtes à convertir.</h2><p style={heroLeadStyle}>Chaque offre reste liée au partenaire, au dossier commercial, aux commandes, à la facturation, aux crédits, à la delivery et au portail partenaire.</p><div style={heroButtonsStyle}><button style={primaryButtonStyle} onClick={() => openModal('create', null)}>Nouvelle offre</button><button style={softButtonStyle} onClick={() => openModal('bulk')}>Créer plusieurs offres</button><button style={softButtonStyle} onClick={load}>Rafraîchir live</button></div></div>
          <div style={syncCardStyle}><span>Offer Sync Health</span><strong>{workspace?.syncHealth?.score || 0}/100</strong><small>{workspace?.offers?.length || 0} offre(s) • {workspace?.partners?.length || 0} partenaire(s)</small></div>
        </section>

        <section style={kpiGridStyle}>{(workspace?.kpis || []).map((kpi) => <article key={kpi.id} style={{ ...kpiStyle, borderColor: toneBorder(kpi.tone) }}><span style={{ ...kpiIconStyle, background: toneBg(kpi.tone), color: toneText(kpi.tone) }}>◆</span><span>{kpi.label}</span><strong>{typeof kpi.value === 'number' && kpi.id === 'forecast' ? money(kpi.value) : kpi.value}</strong><small>{kpi.sublabel}</small></article>)}</section>

        <nav style={navStyle}>{NAV.map((item) => <button key={item.id} onClick={() => setView(item.id)} style={view === item.id ? navActiveStyle : navItemStyle}>{item.label}</button>)}</nav>

        <section style={toolbarStyle}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher offre, partenaire, owner, référence…" style={searchStyle} />
          <select value={partnerFilter} onChange={(e) => setPartnerFilter(e.target.value)} style={selectStyle}><option value="all">Tous partenaires</option>{(workspace?.partners || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}><option value="all">Tous statuts</option><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="converted">Converted</option><option value="rejected">Rejected</option></select>
          <button style={smallButtonStyle} onClick={() => bulkStatus('sent')} disabled={!selectedCount}>Envoyer sélection</button>
          <button style={smallButtonStyle} onClick={() => bulkStatus('accepted')} disabled={!selectedCount}>Accepter sélection</button>
        </section>

        <section style={mainGridStyle}>
          <div style={offersPanelStyle}>
            <div style={sectionHeaderStyle}><div><div style={eyebrowStyle}>MASTER OFFERS PORTFOLIO</div><h3 style={sectionTitleStyle}>Offres existantes ({offers.length})</h3></div><span style={pillStyle}>{selectedCount} sélectionnée(s)</span></div>
            <div style={tableWrapStyle}>
              <div style={tableHeaderStyle}><strong></strong><strong>Offre</strong><strong>Partenaire</strong><strong>Package</strong><strong>Montant</strong><strong>Status</strong><strong>Sync</strong><strong>Actions</strong></div>
              {offers.length ? offers.map((offer) => (
                <article key={offer.id} style={tableRowStyle}>
                  <label style={checkboxWrapStyle}><input type="checkbox" checked={Boolean(checked[offer.id])} onChange={(e) => setChecked((cur) => ({ ...cur, [offer.id]: e.target.checked }))} /></label>
                  <div style={identityCellStyle}><strong>{offer.title}</strong><span>{offer.number} • validité {dateLabel(offer.validUntil)}</span></div>
                  <div style={identityCellStyle}><strong>{offer.partnerName}</strong><span>{offer.partnerCity} • {offer.owner}</span></div>
                  <div><span style={{ ...packagePillStyle, background: toneBg('blue'), color: toneText('blue') }}>{offer.packageLabel}</span></div>
                  <div style={identityCellStyle}><strong>{money(offer.amountMinor)}</strong><span>{offer.credits} crédits • {offer.participants} participants</span></div>
                  <div><span style={{ ...packagePillStyle, background: toneBg(statusTone(offer.status)), color: toneText(statusTone(offer.status)) }}>{offer.status}</span></div>
                  <div style={syncMiniStyle}>{Object.entries(offer.linked).map(([key, ok]) => <span key={key} style={{ color: ok ? '#047857' : '#c2410c' }}>{ok ? '✓' : '•'} {key}</span>)}</div>
                  <div style={rowActionsStyle}><button style={miniButtonStyle} onClick={() => { setSelected(offer); openModal('preview', offer) }}>Preview</button><button style={miniButtonStyle} onClick={() => { setSelected(offer); openModal('edit', offer) }}>Edit</button><button style={miniButtonStyle} onClick={() => runAction('duplicate_offer', { offer_id: offer.id })}>Dupliquer</button><button style={miniDangerStyle} onClick={() => { setSelected(offer); openModal('delete', offer) }}>Delete</button></div>
                </article>
              )) : <div style={emptyStyle}>Aucune offre dans ce filtre.</div>}
            </div>
          </div>

          <aside style={rightPanelStyle}>
            <section style={rightCardStyle}><div style={eyebrowStyle}>ACTIONS UTILES</div><h3 style={rightTitleStyle}>Workflow offre</h3><div style={actionStackStyle}><button style={actionCardStyle} onClick={() => openModal('create', null)}><strong>Créer offre</strong><span>Package + lignes + partenaire</span></button><button style={actionCardStyle} onClick={() => openModal('bulk')}><strong>Créer plusieurs</strong><span>Activation + Growth + Premium</span></button><button style={actionCardStyle} onClick={() => selected && openModal('convert', selected)}><strong>Convertir commande</strong><span>Offre acceptée → commande</span></button><button style={actionCardStyle} onClick={() => selected && openModal('portal', selected)}><strong>Publier portail</strong><span>Visibilité partenaire</span></button></div></section>
            <section style={rightCardStyle}><div style={eyebrowStyle}>PRODUCTION BINDING</div><h3 style={rightTitleStyle}>Tables connectées</h3><div style={syncGridStyle}>{(workspace?.syncHealth?.tables || []).map((table) => <div key={table.table} style={{ ...syncPillStyle, background: table.ok ? '#ecfdf5' : '#fff7ed', borderColor: table.ok ? '#bbf7d0' : '#fed7aa' }}><strong>{table.count}</strong><span>{table.table}</span></div>)}</div></section>
          </aside>
        </section>
      </section>

      {modal ? <OfferModal type={modal} workspace={workspace} offer={selected} form={form} patch={patch} selectPackage={selectPackage} toggleLine={toggleLine} saving={saving} onClose={() => setModal(null)} onRun={runAction} /> : null}
    </main>
  )
}

function SideGroup({ title, items, active }: { title: string; items: string[]; active: string }) {
  return <nav style={sideGroupStyle} aria-label={title}><p>{title}</p>{items.map((item) => <a key={item} href={sidebarHref(item)} style={item === active ? sideItemActiveStyle : sideItemStyle}><span>{item === active ? '◆' : '●'}</span><strong>{item}</strong></a>)}</nav>
}

function OfferModal({ type, workspace, offer, form, patch, selectPackage, toggleLine, saving, onClose, onRun }: { type: Exclude<ModalType, null>; workspace: Workspace | null; offer: OfferRecord | null; form: OfferForm; patch: (key: keyof OfferForm, value: any) => void; selectPackage: (id: string) => void; toggleLine: (line: OfferLine) => void; saving: boolean; onClose: () => void; onRun: (action: string, extra?: Record<string, any>) => Promise<void> }) {
  const titleMap: Record<Exclude<ModalType, null>, string> = { create: 'Créer une nouvelle offre', edit: 'Modifier offre', preview: 'Prévisualisation offre', delete: 'Supprimer définitivement', bulk: 'Créer plusieurs offres', convert: 'Convertir en commande', portal: 'Publier au portail partenaire', print: 'Impression & export' }
  return (
    <div style={modalBackdropStyle}>
      <section style={modalStyle}>
        <header style={modalHeaderStyle}><div><div style={eyebrowStyle}>TRAININGHUB OFFER STUDIO</div><h2 style={modalTitleStyle}>{titleMap[type]}</h2><p style={modalLeadStyle}>{offer ? `${offer.partnerName} • ${offer.number}` : 'Offre commerciale synchronisée avec partenaire, billing, crédits et portail.'}</p></div><button style={closeButtonStyle} onClick={onClose}>×</button></header>

        {['create','edit'].includes(type) ? <div style={modalGridStyle}>
          <Panel eyebrow="Partenaire" title="Destination de l’offre"><div style={formGridStyle}><label style={fieldStyle}>Partenaire<select value={form.organization_id} onChange={(e) => patch('organization_id', e.target.value)}><option value="">Sélectionner partenaire</option>{(workspace?.partners || []).map((p) => <option key={p.id} value={p.id}>{p.name} • {p.city}</option>)}</select></label><label style={fieldStyle}>Titre offre<input value={form.title} onChange={(e) => patch('title', e.target.value)} /></label><label style={fieldStyle}>Statut<select value={form.status} onChange={(e) => patch('status', e.target.value)}><option value="draft">Draft</option><option value="ready">Ready</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option></select></label></div></Panel>
          <Panel eyebrow="Packages préintégrés" title="Choisir un modèle"><div style={packageGridStyle}>{(workspace?.packages || []).map((pack) => <button key={pack.id} style={{ ...packageCardStyle, borderColor: form.package === pack.id ? '#2563eb' : '#dbeafe', background: form.package === pack.id ? '#eff6ff' : '#fff' }} onClick={() => selectPackage(pack.id)}><strong>{pack.label}</strong><span>{money(pack.amountMinor)}</span><small>{pack.credits} crédits • {pack.participants} participants</small><p>{pack.description}</p></button>)}</div></Panel>
          <Panel eyebrow="Configuration" title="Montants, crédits et règles"><div style={formGridStyle}><label style={fieldStyle}>Montant centimes MAD<input type="number" value={form.amount_minor} onChange={(e) => patch('amount_minor', Number(e.target.value))} /></label><label style={fieldStyle}>Crédits<input type="number" value={form.credits} onChange={(e) => patch('credits', Number(e.target.value))} /></label><label style={fieldStyle}>Participants<input type="number" value={form.participants} onChange={(e) => patch('participants', Number(e.target.value))} /></label><label style={fieldStyle}>Billing<select value={form.billing_period} onChange={(e) => patch('billing_period', e.target.value)}><option value="annual">Annual</option><option value="monthly">Monthly</option><option value="one_shot">One shot</option></select></label><label style={fieldStyle}>Paiement<select value={form.payment_policy} onChange={(e) => patch('payment_policy', e.target.value)}><option value="manual_agreement">Accord manuel</option><option value="deposit_then_balance">Acompte puis solde</option><option value="full_before_delivery">100% avant delivery</option></select></label><label style={fieldStyle}>Renouvellement<select value={form.renewal_policy} onChange={(e) => patch('renewal_policy', e.target.value)}><option value="manual_review_30_days_before_end">Review 30 jours avant fin</option><option value="manual_renewal">Renouvellement manuel</option><option value="auto_prepare">Préparation automatique</option></select></label></div></Panel>
          <Panel eyebrow="Lignes opérationnelles" title="Services inclus"><div style={lineGridStyle}>{(workspace?.lineCatalogue || []).map((line) => { const active = form.lines.some((i) => i.id === line.id); return <button key={line.id} style={active ? lineActiveStyle : lineStyle} onClick={() => toggleLine(line)}>{active ? '✓' : '+'} {line.label} · {money(line.totalMinor)}</button> })}</div></Panel>
        </div> : null}

        {type === 'bulk' ? <Panel eyebrow="Création multiple" title="Créer plusieurs offres pour un même partenaire"><div style={formGridStyle}><label style={fieldStyle}>Partenaire<select value={form.organization_id} onChange={(e) => patch('organization_id', e.target.value)}><option value="">Sélectionner partenaire</option>{(workspace?.partners || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label></div><div style={packageGridStyle}>{(workspace?.packages || []).filter((p) => p.id !== 'custom').map((p) => <label key={p.id} style={togglePackageStyle}><input type="checkbox" checked={form.packages.includes(p.id)} onChange={(e) => patch('packages', e.target.checked ? [...form.packages, p.id] : form.packages.filter((id) => id !== p.id))} /><strong>{p.label}</strong><span>{money(p.amountMinor)}</span></label>)}</div></Panel> : null}
        {type === 'preview' && offer ? <Panel eyebrow="Preview A4" title={offer.title}><div style={previewStyle}><div><strong>{offer.partnerName}</strong><p>{offer.partnerCity} • {offer.owner}</p></div><div><strong>{money(offer.amountMinor)}</strong><p>{offer.credits} crédits • {offer.participants} participants</p></div><div style={lineGridStyle}>{offer.lines.map((line) => <span key={line.id} style={lineActiveStyle}>{line.label}</span>)}</div></div></Panel> : null}
        {type === 'delete' && offer ? <Panel eyebrow="Suppression définitive" title="Action dangereuse"><p style={dangerStyle}>Cette action supprime définitivement l’offre sélectionnée. Si la base refuse à cause de liens commerciaux, l’erreur sera affichée.</p><strong>{offer.title}</strong><span>{offer.number} • {offer.partnerName}</span></Panel> : null}
        {type === 'convert' && offer ? <Panel eyebrow="Conversion" title="Offre → commande"><p style={hintStyle}>La conversion crée une commande liée à cette offre et marque l’offre comme converted lorsque possible.</p></Panel> : null}
        {type === 'portal' && offer ? <Panel eyebrow="Portail partenaire" title="Publier l’offre"><p style={hintStyle}>L’offre devient visible dans le portail partenaire si les pages portail lisent les propositions visibles.</p></Panel> : null}
        {type === 'print' ? <Panel eyebrow="Rapports" title="Impression offres"><div style={printGridStyle}>{['Portfolio offres','Offre sélectionnée','Prévision CA','Offres envoyées','Offres acceptées','Audit offres'].map((item) => <button key={item} style={printCardStyle} onClick={() => window.print()}>{item}</button>)}</div></Panel> : null}

        <footer style={modalFooterStyle}><button style={ghostButtonStyle} onClick={onClose}>Fermer</button>{type === 'create' ? <button style={primaryButtonStyle} disabled={saving} onClick={() => onRun('create_offer')}>Créer offre</button> : null}{type === 'edit' ? <button style={primaryButtonStyle} disabled={saving} onClick={() => onRun('update_offer')}>Enregistrer</button> : null}{type === 'bulk' ? <button style={primaryButtonStyle} disabled={saving} onClick={() => onRun('create_multiple_offers')}>Créer plusieurs</button> : null}{type === 'convert' ? <button style={primaryButtonStyle} disabled={saving} onClick={() => onRun('convert_offer_to_order', { offer_id: offer?.id })}>Convertir</button> : null}{type === 'portal' ? <button style={primaryButtonStyle} disabled={saving} onClick={() => onRun('publish_offer_to_portal', { offer_id: offer?.id })}>Publier</button> : null}{type === 'delete' ? <button style={dangerButtonStyle} disabled={saving} onClick={() => onRun('delete_offer_permanently', { offer_id: offer?.id })}>Supprimer définitivement</button> : null}</footer>
      </section>
    </div>
  )
}

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <section style={panelStyle}><div style={eyebrowStyle}>{eyebrow}</div><h3 style={panelTitleStyle}>{title}</h3>{children}</section>
}

const loadingStyle: CSSProperties = { minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f6f9ff', color: '#0f172a', fontWeight: 950 }
const shellStyle: CSSProperties = { minHeight: '100vh', display: 'grid', gridTemplateColumns: '290px minmax(0,1fr)', background: 'linear-gradient(135deg,#eef6ff,#f8fbff)', color: '#0f172a', fontFamily: 'Inter, ui-sans-serif, system-ui' }
const sidebarStyle: CSSProperties = { position: 'sticky', top: 0, height: '100vh', overflow: 'auto', padding: 14, background: 'rgba(255,255,255,.94)', borderRight: '1px solid #dbeafe', boxShadow: '16px 0 44px rgba(15,23,42,.05)' }
const brandCardStyle: CSSProperties = { border: '1px solid #dbeafe', borderRadius: 24, padding: 16, display: 'grid', gap: 8, background: '#fff', marginBottom: 18 }
const logoBoxStyle: CSSProperties = { border: '1px solid #bfdbfe', borderRadius: 16, padding: 14, color: '#1d4ed8', fontWeight: 950, textAlign: 'center' }
const sideGroupStyle: CSSProperties = { display: 'grid', gap: 8, marginBottom: 18 }
const sideItemStyle: CSSProperties = { display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 14, color: '#475569', textDecoration: 'none', fontWeight: 900 }
const sideItemActiveStyle: CSSProperties = { ...sideItemStyle, background: 'linear-gradient(135deg,#0b49b7,#2563eb)', color: '#fff', boxShadow: '0 14px 28px rgba(37,99,235,.22)' }
const workspaceStyle: CSSProperties = { minWidth: 0, padding: 22, display: 'grid', gap: 18, alignContent: 'start' }
const topbarStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, background: '#fff', borderRadius: 26, padding: '20px 24px', border: '1px solid #dbeafe', boxShadow: '0 18px 45px rgba(15,23,42,.05)' }
const topActionsStyle: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.16em', textTransform: 'uppercase' }
const pageTitleStyle: CSSProperties = { margin: '6px 0', fontSize: 31, lineHeight: 1, letterSpacing: '-.055em' }
const pageLeadStyle: CSSProperties = { margin: 0, color: '#64748b', fontWeight: 800 }
const primaryButtonStyle: CSSProperties = { border: 0, borderRadius: 17, padding: '12px 16px', color: '#fff', background: 'linear-gradient(135deg,#0b2348,#2563eb)', fontWeight: 950, cursor: 'pointer', boxShadow: '0 16px 34px rgba(37,99,235,.25)' }
const softButtonStyle: CSSProperties = { border: '1px solid #bfdbfe', borderRadius: 17, padding: '12px 16px', color: '#12366d', background: '#fff', fontWeight: 950, cursor: 'pointer' }
const ghostButtonStyle: CSSProperties = { ...softButtonStyle, boxShadow: 'none' }
const smallButtonStyle: CSSProperties = { ...softButtonStyle, padding: '10px 12px' }
const heroStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 330px', gap: 18, background: 'linear-gradient(135deg,#ffffff,#eaf3ff)', border: '1px solid #dbeafe', borderRadius: 34, padding: 24, boxShadow: '0 24px 62px rgba(37,99,235,.10)' }
const heroTitleStyle: CSSProperties = { margin: '8px 0', maxWidth: 900, fontSize: 42, lineHeight: .98, letterSpacing: '-.065em' }
const heroLeadStyle: CSSProperties = { margin: 0, maxWidth: 850, color: '#64748b', fontWeight: 800, lineHeight: 1.55 }
const heroButtonsStyle: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }
const syncCardStyle: CSSProperties = { borderRadius: 28, padding: 22, color: '#fff', background: 'linear-gradient(135deg,#0b2348,#2563eb)', boxShadow: '0 26px 64px rgba(37,99,235,.25)', display: 'grid', gap: 12, alignContent: 'center' }
const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(7,minmax(150px,1fr))', gap: 12, overflowX: 'auto' }
const kpiStyle: CSSProperties = { minHeight: 125, display: 'grid', justifyItems: 'start', gap: 5, borderRadius: 24, padding: 16, background: '#fff', border: '1px solid', boxShadow: '0 18px 42px rgba(15,23,42,.05)', color: '#0f172a' }
const kpiIconStyle: CSSProperties = { width: 34, height: 34, borderRadius: 999, display: 'grid', placeItems: 'center' }
const navStyle: CSSProperties = { display: 'flex', gap: 9, flexWrap: 'wrap', borderRadius: 24, background: '#fff', border: '1px solid #dbeafe', padding: 10 }
const navItemStyle: CSSProperties = { border: 0, background: 'transparent', borderRadius: 999, padding: '11px 14px', color: '#475569', fontWeight: 950, cursor: 'pointer' }
const navActiveStyle: CSSProperties = { ...navItemStyle, background: '#eff6ff', color: '#1d4ed8', boxShadow: 'inset 0 0 0 1px #bfdbfe' }
const toolbarStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(260px,1fr) 220px 170px auto auto', gap: 10, background: '#fff', border: '1px solid #dbeafe', padding: 12, borderRadius: 24 }
const searchStyle: CSSProperties = { border: '1px solid #dbeafe', borderRadius: 16, padding: '12px 14px', fontWeight: 800, outline: 'none', background: '#f8fbff' }
const selectStyle: CSSProperties = { ...searchStyle }
const mainGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 18, alignItems: 'start' }
const offersPanelStyle: CSSProperties = { minWidth: 0, background: '#fff', border: '1px solid #dbeafe', borderRadius: 28, padding: 16, boxShadow: '0 20px 54px rgba(15,23,42,.05)' }
const sectionHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', marginBottom: 12 }
const sectionTitleStyle: CSSProperties = { margin: '4px 0 0', fontSize: 24, letterSpacing: '-.045em' }
const pillStyle: CSSProperties = { borderRadius: 999, background: '#eff6ff', color: '#1d4ed8', padding: '8px 12px', fontWeight: 950 }
const tableWrapStyle: CSSProperties = { display: 'grid', gap: 10, overflowX: 'auto' }
const tableHeaderStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '38px 1.25fr 1.05fr .75fr .85fr .65fr 1.05fr 1.25fr', gap: 10, minWidth: 1220, padding: 14, borderRadius: 18, background: '#eff6ff', color: '#475569' }
const tableRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '38px 1.25fr 1.05fr .75fr .85fr .65fr 1.05fr 1.25fr', gap: 10, alignItems: 'center', minWidth: 1220, padding: 14, borderRadius: 20, border: '1px solid #dbeafe', background: '#fff', boxShadow: '0 12px 24px rgba(15,23,42,.035)' }
const checkboxWrapStyle: CSSProperties = { display: 'grid', placeItems: 'center' }
const identityCellStyle: CSSProperties = { display: 'grid', gap: 4 }
const packagePillStyle: CSSProperties = { display: 'inline-flex', width: 'fit-content', borderRadius: 999, padding: '7px 10px', fontSize: 12, fontWeight: 950 }
const syncMiniStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, fontSize: 11, fontWeight: 900 }
const rowActionsStyle: CSSProperties = { display: 'flex', gap: 6, flexWrap: 'wrap' }
const miniButtonStyle: CSSProperties = { border: '1px solid #bfdbfe', color: '#1d4ed8', background: '#fff', borderRadius: 12, padding: '7px 9px', fontWeight: 900, cursor: 'pointer' }
const miniDangerStyle: CSSProperties = { ...miniButtonStyle, borderColor: '#fecaca', color: '#b91c1c', background: '#fef2f2' }
const emptyStyle: CSSProperties = { padding: 22, color: '#64748b', fontWeight: 850 }
const rightPanelStyle: CSSProperties = { display: 'grid', gap: 14, position: 'sticky', top: 18 }
const rightCardStyle: CSSProperties = { background: '#fff', border: '1px solid #dbeafe', borderRadius: 26, padding: 18, boxShadow: '0 18px 42px rgba(15,23,42,.05)' }
const rightTitleStyle: CSSProperties = { margin: '6px 0 12px', fontSize: 20, letterSpacing: '-.04em' }
const actionStackStyle: CSSProperties = { display: 'grid', gap: 9 }
const actionCardStyle: CSSProperties = { display: 'grid', gap: 4, textAlign: 'left', border: '1px solid #dbeafe', borderRadius: 18, padding: 13, background: '#f8fbff', color: '#0f172a', cursor: 'pointer' }
const syncGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }
const syncPillStyle: CSSProperties = { display: 'grid', gap: 3, borderRadius: 14, padding: 10, border: '1px solid' }
const messageStyle: CSSProperties = { border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', borderRadius: 20, padding: '12px 16px', fontWeight: 900 }
const modalBackdropStyle: CSSProperties = { position: 'fixed', inset: 0, zIndex: 80, display: 'grid', placeItems: 'center', background: 'rgba(15,23,42,.48)', backdropFilter: 'blur(12px)', padding: 24 }
const modalStyle: CSSProperties = { width: 'min(1480px, 96vw)', maxHeight: '92vh', overflow: 'auto', borderRadius: 34, background: 'linear-gradient(135deg,#ffffff,#f6f9ff)', border: '1px solid #dbeafe', boxShadow: '0 40px 140px rgba(2,6,23,.32)', padding: 18, display: 'grid', gap: 16 }
const modalHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'start', background: '#fff', border: '1px solid #dbeafe', borderRadius: 26, padding: 18 }
const modalTitleStyle: CSSProperties = { margin: '6px 0', fontSize: 32, letterSpacing: '-.05em' }
const modalLeadStyle: CSSProperties = { margin: 0, color: '#64748b', fontWeight: 800 }
const closeButtonStyle: CSSProperties = { width: 42, height: 42, borderRadius: 999, border: '1px solid #dbeafe', background: '#fff', color: '#0f172a', fontSize: 24, fontWeight: 950, cursor: 'pointer' }
const modalGridStyle: CSSProperties = { display: 'grid', gap: 14 }
const panelStyle: CSSProperties = { borderRadius: 26, border: '1px solid #dbeafe', background: '#fff', padding: 18, display: 'grid', gap: 14 }
const panelTitleStyle: CSSProperties = { margin: 0, fontSize: 22, letterSpacing: '-.04em' }
const formGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const fieldStyle: CSSProperties = { display: 'grid', gap: 7, fontWeight: 900, color: '#334155' }
const packageGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 10 }
const packageCardStyle: CSSProperties = { display: 'grid', gap: 6, textAlign: 'left', borderRadius: 20, padding: 14, border: '1px solid', background: '#fff', cursor: 'pointer', color: '#0f172a' }
const lineGridStyle: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' }
const lineStyle: CSSProperties = { border: '1px solid #dbeafe', background: '#fff', color: '#334155', borderRadius: 999, padding: '9px 12px', fontWeight: 900, cursor: 'pointer' }
const lineActiveStyle: CSSProperties = { ...lineStyle, background: '#ecfdf5', color: '#047857', borderColor: '#bbf7d0' }
const togglePackageStyle: CSSProperties = { display: 'grid', gap: 6, border: '1px solid #dbeafe', borderRadius: 18, padding: 14, background: '#f8fbff', fontWeight: 900 }
const previewStyle: CSSProperties = { borderRadius: 22, border: '1px solid #dbeafe', background: '#f8fbff', padding: 18, display: 'grid', gap: 14 }
const hintStyle: CSSProperties = { margin: 0, color: '#64748b', fontWeight: 800, lineHeight: 1.5 }
const dangerStyle: CSSProperties = { margin: 0, color: '#b91c1c', fontWeight: 900, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 18, padding: 14 }
const printGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }
const printCardStyle: CSSProperties = { border: '1px solid #dbeafe', background: '#fff', borderRadius: 18, padding: 18, fontWeight: 950, cursor: 'pointer', color: '#12366d' }
const modalFooterStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap', background: '#fff', border: '1px solid #dbeafe', borderRadius: 24, padding: 14 }
const dangerButtonStyle: CSSProperties = { border: 0, borderRadius: 17, padding: '12px 16px', color: '#fff', background: 'linear-gradient(135deg,#991b1b,#dc2626)', fontWeight: 950, cursor: 'pointer', boxShadow: '0 16px 34px rgba(220,38,38,.22)' }
