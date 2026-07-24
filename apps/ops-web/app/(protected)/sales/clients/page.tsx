'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import {
  ActionButton, ActionLink, CommercialNav, Drawer, EmptyState, Field, formatDate, formatDh, HeroStat,
  Icon, MetricTile, Notice, Panel, Pill, SalesHero, SourceBadge, styles, toneForStatus,
} from '../_components/Sales360UI'

type Client = { id: string; client_name: string; client_type?: string; phone?: string; email?: string; city?: string; address?: string; source?: string; notes?: string; status?: string; created_at?: string; updated_at?: string }
type Order = { id: string; order_ref: string; client_id?: string; client_name: string; status?: string; payment_status?: string; fulfillment_status?: string; total_amount?: number; service_type?: string; created_at?: string }
type Option = { id: string; area: string; label: string; value: string; is_active?: boolean }
type Pathway = { title: string; market: string; client_type: string; segment: string; primary_need: string; urgency: string; source: string; status: string; language: string; budget: string; schedule: string; beneficiaries: string; decision: string; billing: string; notes: string }

const customerTypes = [
  { label: 'Famille / Parent B2C', value: 'family' }, { label: 'École privée', value: 'school' }, { label: 'Crèche', value: 'nursery' },
  { label: 'Hôtel / Hospitality', value: 'hotel' }, { label: 'Entreprise / Corporate', value: 'company' }, { label: 'Clinique / Santé', value: 'clinic' },
  { label: 'Association / Institution', value: 'institution' }, { label: 'Agence partenaire', value: 'partner_agency' }, { label: 'Academy learner', value: 'academy_learner' }, { label: 'Autre', value: 'custom' },
]
const segments = ['B2C standard', 'B2C premium', 'B2C urgent', 'B2B school', 'B2B hospitality', 'B2B corporate', 'Institutional', 'Partner / referral', 'Recurring monthly', 'High value opportunity']
const sources = ['whatsapp', 'phone', 'website', 'facebook', 'instagram', 'referral', 'walk_in', 'partner', 'b2b_prospecting', 'existing_client', 'campaign', 'other']
const cities = ['Casablanca', 'Rabat', 'Temara', 'Marrakech', 'Tanger', 'Agadir', 'Fès', 'Meknès', 'Kénitra', 'Other']
const needs = ['Garde d’enfants à domicile', 'Babysitting ponctuel', 'Nanny mensuelle', 'Sortie école / accompagnement', 'Garde hôtel', 'Garde événementielle', 'Assistance senior', 'Aide à domicile', 'Caregiver replacement', 'Formation / Academy', 'Contrat B2B récurrent', 'Demande personnalisée']
const urgencies = ['low', 'normal', 'urgent', 'same_day', 'critical']
const languages = ['French', 'Arabic', 'Darija', 'English', 'Spanish']
const statuses = ['active', 'lead', 'vip', 'risk', 'inactive', 'archived']
const pathways: Pathway[] = [
  { title: 'Famille — garde régulière', market: 'B2C', client_type: 'family', segment: 'Recurring monthly', primary_need: 'Garde d’enfants à domicile', urgency: 'normal', source: 'whatsapp', status: 'lead', language: 'French', budget: '2 500–6 000 Dh / mois', schedule: 'Créneau récurrent en semaine', beneficiaries: '1 à 3 enfants', decision: 'Parent / tuteur', billing: 'Parent principal', notes: 'Qualifier horaires, âges, école, allergies, habitudes et préférences caregiver.' },
  { title: 'Famille — babysitting urgent', market: 'B2C', client_type: 'family', segment: 'B2C urgent', primary_need: 'Babysitting ponctuel', urgency: 'same_day', source: 'phone', status: 'lead', language: 'French', budget: '250–800 Dh / intervention', schedule: 'Même jour, soirée ou weekend', beneficiaries: 'Nombre et âges obligatoires', decision: 'Parent demandeur', billing: 'Parent demandeur', notes: 'Vérifier disponibilité immédiate, lieu, durée, consignes de sécurité et paiement avant confirmation.' },
  { title: 'École privée — contrat récurrent', market: 'B2B', client_type: 'school', segment: 'B2B school', primary_need: 'Contrat B2B récurrent', urgency: 'normal', source: 'b2b_prospecting', status: 'lead', language: 'French', budget: 'Contrat mensuel sur devis', schedule: 'Calendrier scolaire / remplacement', beneficiaries: 'Classes, effectifs, âges et ratios', decision: 'Direction école', billing: 'Administration / comptabilité', notes: 'Collecter ICE, calendrier, exigences RH, sécurité, documents et validation direction.' },
  { title: 'Hôtel — garde guest', market: 'B2B', client_type: 'hotel', segment: 'B2B hospitality', primary_need: 'Garde hôtel', urgency: 'urgent', source: 'partner', status: 'lead', language: 'English', budget: 'Sur devis / intervention', schedule: 'Soirée, nuit ou weekend', beneficiaries: 'Enfants guests', decision: 'Conciergerie / Guest relations', billing: 'Hôtel ou guest selon accord', notes: 'Confirmer lieu, langue, âge, durée, paiement, protocole hôtel et identité guest.' },
  { title: 'Entreprise — care collaborateurs', market: 'B2B', client_type: 'company', segment: 'B2B corporate', primary_need: 'Contrat B2B récurrent', urgency: 'normal', source: 'b2b_prospecting', status: 'lead', language: 'French', budget: 'Contrat cadre / devis', schedule: 'Programme collaborateurs', beneficiaries: 'Employés bénéficiaires', decision: 'RH / Direction générale', billing: 'Finance / Achats', notes: 'Cadrer volume, SLA, reporting, validation contractuelle et cycle de règlement.' },
]

const initialForm = { client_name: '', client_type: 'family', segment: 'B2C standard', primary_need: 'Garde d’enfants à domicile', urgency: 'normal', phone: '', secondary_phone: '', email: '', city: 'Casablanca', address: '', source: 'whatsapp', preferred_language: 'French', decision_maker: '', billing_contact: '', tax_or_ice: '', children_or_beneficiaries: '', schedule_need: '', budget_range: '', expected_start_date: '', status: 'lead', notes: '' }

function mergeOptions(primary: Array<{ label: string; value: string }>, fallback: Array<{ label: string; value: string }>) {
  const map = new Map<string, { label: string; value: string }>()
  ;[...primary, ...fallback].forEach(item => map.set(item.value, item))
  return [...map.values()]
}

function initials(name: string) { return name.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'AC' }

export default function SalesClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [options, setOptions] = useState<Option[]>([])
  const [message, setMessage] = useState('Connexion au portefeuille clients…')
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('newest')
  const [form, setForm] = useState(initialForm)
  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<Client | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedPathway, setSelectedPathway] = useState<Pathway>(pathways[0])

  async function load() {
    try {
      const [clientsResponse, ordersResponse, optionsResponse] = await Promise.all([
        fetch('/api/sales-terminal/clients', { cache: 'no-store' }),
        fetch('/api/sales-terminal/orders', { cache: 'no-store' }),
        fetch('/api/sales-terminal/options', { cache: 'no-store' }),
      ])
      const [clientsJson, ordersJson, optionsJson] = await Promise.all([clientsResponse.json(), ordersResponse.json(), optionsResponse.json()])
      if (!clientsJson.ok) throw new Error(clientsJson.message || 'Clients API indisponible')
      setClients(clientsJson.data || [])
      setOrders(ordersJson.ok ? ordersJson.data || [] : [])
      setOptions(optionsJson.ok ? optionsJson.data || [] : [])
      setMessage(`${clientsJson.data?.length || 0} dossiers clients chargés depuis le Sales Terminal.`)
    } catch (error) {
      setMessage(`Périmètre incomplet : ${error instanceof Error ? error.message : 'erreur inconnue'}`)
    }
  }

  useEffect(() => { void load() }, [])

  const typeOptions = useMemo(() => mergeOptions(options.filter(item => item.area === 'customer_type' && item.is_active !== false).map(item => ({ label: item.label, value: item.value })), customerTypes), [options])
  const visible = useMemo(() => clients.filter(client => {
    const text = `${client.client_name} ${client.client_type || ''} ${client.phone || ''} ${client.email || ''} ${client.city || ''} ${client.source || ''} ${client.status || ''} ${client.notes || ''}`.toLowerCase()
    return text.includes(query.toLowerCase()) && (city === 'all' || client.city === city) && (status === 'all' || (client.status || 'active') === status)
  }).sort((a, b) => sort === 'name' ? a.client_name.localeCompare(b.client_name) : sort === 'city' ? String(a.city || '').localeCompare(String(b.city || '')) : String(b.created_at || '').localeCompare(String(a.created_at || ''))), [clients, query, city, status, sort])

  const active = clients.filter(client => (client.status || 'active') === 'active').length
  const b2b = clients.filter(client => ['school', 'nursery', 'hotel', 'company', 'clinic', 'institution', 'partner_agency'].includes(String(client.client_type))).length
  const withoutOrder = clients.filter(client => !orders.some(order => order.client_id === client.id || order.client_name === client.client_name)).length
  const attention = clients.filter(client => ['risk', 'inactive'].includes(String(client.status)) || !client.phone).length
  const selectedOrders = selected ? orders.filter(order => order.client_id === selected.id || order.client_name === selected.client_name) : []
  const selectedValue = selectedOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)

  function preload(pathway: Pathway) {
    setSelectedPathway(pathway)
    setCreateOpen(true)
    setForm(current => ({ ...current, client_type: pathway.client_type, segment: pathway.segment, primary_need: pathway.primary_need, urgency: pathway.urgency, source: pathway.source, status: pathway.status, preferred_language: pathway.language, decision_maker: pathway.decision, billing_contact: pathway.billing, children_or_beneficiaries: pathway.beneficiaries, schedule_need: pathway.schedule, budget_range: pathway.budget, notes: pathway.notes }))
  }

  async function createClient(event: FormEvent) {
    event.preventDefault()
    if (!form.client_name.trim()) return setMessage('Le nom du client ou de l’organisation est obligatoire.')
    setSaving(true)
    const notes = [
      `Parcours commercial : ${selectedPathway.title}`, `Segment : ${form.segment}`, `Besoin principal : ${form.primary_need}`, `Urgence : ${form.urgency}`, `Langue : ${form.preferred_language}`,
      form.decision_maker && `Décisionnaire : ${form.decision_maker}`, form.billing_contact && `Contact facturation : ${form.billing_contact}`,
      form.tax_or_ice && `ICE / Tax : ${form.tax_or_ice}`, form.children_or_beneficiaries && `Bénéficiaires : ${form.children_or_beneficiaries}`,
      form.schedule_need && `Planning : ${form.schedule_need}`, form.budget_range && `Budget : ${form.budget_range}`,
      form.expected_start_date && `Démarrage attendu : ${form.expected_start_date}`, form.secondary_phone && `Téléphone secondaire : ${form.secondary_phone}`, form.notes,
    ].filter(Boolean).join('\n')
    try {
      const response = await fetch('/api/sales-terminal/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_name: form.client_name, client_type: form.client_type, phone: form.phone, email: form.email, city: form.city, address: form.address, source: form.source, status: form.status, notes }) })
      const json = await response.json()
      if (!json.ok) throw new Error(json.message || 'Création impossible')
      setMessage(`Dossier créé : ${json.data?.client_name || form.client_name}`)
      setForm(initialForm)
      setCreateOpen(false)
      await load()
      setSelected(json.data || null)
    } catch (error) { setMessage(`Création bloquée : ${error instanceof Error ? error.message : 'erreur inconnue'}`) }
    finally { setSaving(false) }
  }

  async function updateClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    const data = new FormData(event.currentTarget)
    const patch = { id: selected.id, client_name: String(data.get('client_name') || ''), client_type: String(data.get('client_type') || ''), phone: String(data.get('phone') || ''), email: String(data.get('email') || ''), city: String(data.get('city') || ''), address: String(data.get('address') || ''), source: String(data.get('source') || ''), status: String(data.get('status') || ''), notes: String(data.get('notes') || '') }
    setSaving(true)
    try {
      const response = await fetch('/api/sales-terminal/clients', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
      const json = await response.json()
      if (!json.ok) throw new Error(json.message || 'Mise à jour impossible')
      setSelected(json.data)
      setEditing(false)
      setMessage('Dossier client mis à jour.')
      await load()
    } catch (error) { setMessage(`Mise à jour bloquée : ${error instanceof Error ? error.message : 'erreur inconnue'}`) }
    finally { setSaving(false) }
  }

  function exportCsv() {
    const headers = ['client_name', 'client_type', 'phone', 'email', 'city', 'source', 'status', 'created_at']
    const rows = [headers.join(','), ...visible.map(client => headers.map(header => `"${String((client as Record<string, unknown>)[header] || '').replaceAll('"', '""')}"`).join(','))]
    const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `sales-clients-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url)
  }

  return <AppShell title="Clients Sales 360" subtitle="Acquisition, qualification et portefeuille commercial B2C, B2B et institutionnel." breadcrumbs={[{ label: 'Sales', href: '/sales' }, { label: 'Clients' }]} actions={<><PageAction href="/sales/orders/new">Nouvelle commande</PageAction><PageAction href="/sales" variant="light">Command Center</PageAction></>}>
    <div className={styles.page}>
      <SalesHero eyebrow="Client Acquisition & Qualification" title="Construire un dossier commercial exploitable dès le premier contact." text="Centralisez l’identité, le besoin, le contexte décisionnaire et les commandes visibles, tout en restant transparent sur les informations avancées stockées dans la note commerciale." actions={<><ActionButton tone="light" icon="plus" onClick={() => setCreateOpen(true)}>Créer un client</ActionButton><ActionLink href="/sales/orders/new" tone="blue" icon="order">Composer une commande</ActionLink><ActionButton tone="navy" icon="document" onClick={exportCsv}>Exporter le portefeuille</ActionButton></>} aside={<><HeroStat label="Portefeuille" value={clients.length} detail={`${active} actifs · ${b2b} B2B`} /><HeroStat label="Sans commande" value={withoutOrder} detail="Clients sans activité commerciale visible" tone={withoutOrder ? 'amber' : 'green'} /><HeroStat label="Qualité de données" value={attention} detail="Risque, inactif ou téléphone manquant" tone={attention ? 'red' : 'green'} /></>} />
      <CommercialNav active="clients" />
      <div className={styles.metricsGrid}><MetricTile label="Clients" value={clients.length} detail="Dossiers Sales Terminal" icon="client" /><MetricTile label="B2B" value={b2b} detail="Écoles, hôtels, entreprises…" icon="service" tone="violet" /><MetricTile label="Sans commande" value={withoutOrder} detail="Potentiel non activé" icon="order" tone="amber" /><MetricTile label="À contrôler" value={attention} detail="Qualité ou risque" icon="alert" tone={attention ? 'red' : 'green'} /></div>
      <Notice tone="blue" title="Identité commerciale propre au module Sales" text="Un client Sales Terminal n’est pas automatiquement une Famille, un Lead ou un compte Browser OS. Aucun lien externe n’est affirmé sans identifiant vérifié." />

      <div className={styles.grid2} style={{ marginTop: 18 }}>
        <Panel title="Portefeuille clients" subtitle={message} action={<SourceBadge tone="green">sales_terminal_clients</SourceBadge>}>
          <div className={styles.toolbar}><div className={styles.searchWrap}><Icon name="search"/><input className={styles.input} value={query} onChange={event => setQuery(event.target.value)} placeholder="Nom, téléphone, email, ville, source ou note…" /></div><select className={styles.select} value={city} onChange={event => setCity(event.target.value)} style={{ maxWidth: 170 }}><option value="all">Toutes les villes</option>{cities.map(item => <option key={item}>{item}</option>)}</select><select className={styles.select} value={status} onChange={event => setStatus(event.target.value)} style={{ maxWidth: 160 }}><option value="all">Tous les statuts</option>{statuses.map(item => <option key={item}>{item}</option>)}</select><select className={styles.select} value={sort} onChange={event => setSort(event.target.value)} style={{ maxWidth: 160 }}><option value="newest">Plus récents</option><option value="name">Nom</option><option value="city">Ville</option></select></div>
          <div className={styles.recordList}>{visible.length === 0 ? <EmptyState title="Aucun client visible" text="Aucun dossier ne correspond aux critères actuels." action={<ActionButton tone="navy" icon="plus" onClick={() => setCreateOpen(true)}>Créer un dossier</ActionButton>} /> : visible.map(client => {
            const clientOrders = orders.filter(order => order.client_id === client.id || order.client_name === client.client_name)
            const value = clientOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
            return <article key={client.id} className={styles.recordCard}><div className={styles.recordMain}><div className={styles.recordTitle}><span className={styles.metricIcon}>{initials(client.client_name)}</span><strong>{client.client_name}</strong><Pill tone={toneForStatus(client.status)}>{client.status || 'active'}</Pill></div><div className={styles.recordMeta}><span>{client.client_type || 'Type non renseigné'}</span><span>{client.city || 'Ville non renseignée'}</span><span>{client.phone || 'Téléphone manquant'}</span><span>{clientOrders.length} commande(s)</span><span>{formatDh(value)}</span></div><div className={styles.recordTags}><SourceBadge>Sales Terminal</SourceBadge>{!client.phone ? <Pill tone="amber">Téléphone manquant</Pill> : null}</div></div><div className={styles.recordActions}><ActionButton tone="light" onClick={() => { setSelected(client); setEditing(false) }}>Dossier 360</ActionButton><ActionLink href={`/sales/orders/new?client_id=${client.id}`} tone="navy" icon="plus">Commande</ActionLink></div></article>
          })}</div>
        </Panel>

        <div className={`${styles.stack} ${styles.stickyRail}`}>
          <Panel title="Parcours d’acquisition" subtitle="Précharger un contexte sans créer de nouvelle logique backend.">
            <div className={styles.stack}>{pathways.map(pathway => <button key={pathway.title} className={`${styles.choiceCard} ${selectedPathway.title === pathway.title ? styles.choiceCardActive : ''}`} onClick={() => preload(pathway)}><div className={styles.recordTitle}><strong>{pathway.title}</strong><Pill tone={pathway.market === 'B2B' ? 'violet' : 'blue'}>{pathway.market}</Pill></div><small>{pathway.primary_need} · {pathway.budget}</small></button>)}</div>
          </Panel>
          <Panel title="Priorités de qualification" subtitle="Contrôles simples issus des données visibles."><div className={styles.summaryGrid}><div className={styles.summaryCell}><small>Téléphone manquant</small><strong>{clients.filter(client => !client.phone).length}</strong></div><div className={styles.summaryCell}><small>Email manquant</small><strong>{clients.filter(client => !client.email).length}</strong></div><div className={styles.summaryCell}><small>À risque</small><strong>{clients.filter(client => client.status === 'risk').length}</strong></div><div className={styles.summaryCell}><small>Sans commande</small><strong>{withoutOrder}</strong></div></div></Panel>
        </div>
      </div>

      <Drawer open={createOpen} title="Client Acquisition Studio" subtitle="Les informations avancées restent encodées dans la note commerciale selon le contrat actuel." onClose={() => setCreateOpen(false)}>
        <form onSubmit={createClient} className={styles.stack}>
          <Notice tone="amber" title="Persistance transparente" text="Segment, besoin, urgence, décisionnaire, ICE, bénéficiaires, planning et budget sont consolidés dans le champ notes par l’API actuelle." />
          <Panel title="01 — Identité et marché"><div className={styles.formGrid2}><Field label="Client / organisation *"><input className={styles.input} value={form.client_name} onChange={event => setForm({ ...form, client_name: event.target.value })} /></Field><Field label="Type de client"><select className={styles.select} value={form.client_type} onChange={event => setForm({ ...form, client_type: event.target.value })}>{typeOptions.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field><Field label="Segment"><select className={styles.select} value={form.segment} onChange={event => setForm({ ...form, segment: event.target.value })}>{segments.map(item => <option key={item}>{item}</option>)}</select></Field><Field label="Besoin principal"><select className={styles.select} value={form.primary_need} onChange={event => setForm({ ...form, primary_need: event.target.value })}>{needs.map(item => <option key={item}>{item}</option>)}</select></Field><Field label="Urgence"><select className={styles.select} value={form.urgency} onChange={event => setForm({ ...form, urgency: event.target.value })}>{urgencies.map(item => <option key={item}>{item}</option>)}</select></Field><Field label="Statut initial"><select className={styles.select} value={form.status} onChange={event => setForm({ ...form, status: event.target.value })}>{statuses.map(item => <option key={item}>{item}</option>)}</select></Field></div></Panel>
          <Panel title="02 — Contact et localisation"><div className={styles.formGrid2}><Field label="Téléphone"><input className={styles.input} value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} /></Field><Field label="Téléphone secondaire"><input className={styles.input} value={form.secondary_phone} onChange={event => setForm({ ...form, secondary_phone: event.target.value })} /></Field><Field label="Email"><input className={styles.input} type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></Field><Field label="Ville"><select className={styles.select} value={form.city} onChange={event => setForm({ ...form, city: event.target.value })}>{cities.map(item => <option key={item}>{item}</option>)}</select></Field><Field label="Adresse" wide><input className={styles.input} value={form.address} onChange={event => setForm({ ...form, address: event.target.value })} /></Field></div></Panel>
          <Panel title="03 — Décision et service"><div className={styles.formGrid2}><Field label="Source"><select className={styles.select} value={form.source} onChange={event => setForm({ ...form, source: event.target.value })}>{sources.map(item => <option key={item}>{item}</option>)}</select></Field><Field label="Langue"><select className={styles.select} value={form.preferred_language} onChange={event => setForm({ ...form, preferred_language: event.target.value })}>{languages.map(item => <option key={item}>{item}</option>)}</select></Field><Field label="Décisionnaire"><input className={styles.input} value={form.decision_maker} onChange={event => setForm({ ...form, decision_maker: event.target.value })} /></Field><Field label="Contact facturation"><input className={styles.input} value={form.billing_contact} onChange={event => setForm({ ...form, billing_contact: event.target.value })} /></Field><Field label="ICE / Tax"><input className={styles.input} value={form.tax_or_ice} onChange={event => setForm({ ...form, tax_or_ice: event.target.value })} /></Field><Field label="Bénéficiaires"><input className={styles.input} value={form.children_or_beneficiaries} onChange={event => setForm({ ...form, children_or_beneficiaries: event.target.value })} /></Field><Field label="Planning"><input className={styles.input} value={form.schedule_need} onChange={event => setForm({ ...form, schedule_need: event.target.value })} /></Field><Field label="Budget"><input className={styles.input} value={form.budget_range} onChange={event => setForm({ ...form, budget_range: event.target.value })} /></Field><Field label="Démarrage attendu"><input className={styles.input} type="date" value={form.expected_start_date} onChange={event => setForm({ ...form, expected_start_date: event.target.value })} /></Field><Field label="Notes" wide><textarea className={styles.textarea} value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} /></Field></div></Panel>
          <div className={styles.inlineActions}><ActionButton type="submit" tone="navy" icon="check" disabled={saving}>{saving ? 'Création…' : 'Créer le dossier commercial'}</ActionButton><ActionButton tone="light" onClick={() => setCreateOpen(false)}>Annuler</ActionButton></div>
        </form>
      </Drawer>

      <Drawer open={Boolean(selected)} title={selected?.client_name || 'Client 360'} subtitle="Dossier commercial en lecture, commandes visibles et mise à jour contrôlée." onClose={() => { setSelected(null); setEditing(false) }}>
        {selected ? <div className={styles.stack}>
          <Panel title="Passeport commercial" action={<Pill tone={toneForStatus(selected.status)}>{selected.status || 'active'}</Pill>}><div className={styles.summaryGrid}><div className={styles.summaryCell}><small>Type</small><strong>{selected.client_type || 'Non renseigné'}</strong></div><div className={styles.summaryCell}><small>Ville</small><strong>{selected.city || 'Non renseignée'}</strong></div><div className={styles.summaryCell}><small>Téléphone</small><strong>{selected.phone || 'Non renseigné'}</strong></div><div className={styles.summaryCell}><small>Email</small><strong>{selected.email || 'Non renseigné'}</strong></div><div className={`${styles.summaryCell} ${styles.summaryWide}`}><small>Adresse</small><strong>{selected.address || 'Non renseignée'}</strong></div><div className={`${styles.summaryCell} ${styles.summaryWide}`}><small>Créé le</small><strong>{formatDate(selected.created_at, true)}</strong></div></div></Panel>
          <Panel title="Position commerciale"><div className={styles.summaryGrid}><div className={styles.summaryCell}><small>Commandes</small><strong>{selectedOrders.length}</strong></div><div className={styles.summaryCell}><small>Valeur visible</small><strong>{formatDh(selectedValue)}</strong></div><div className={`${styles.summaryCell} ${styles.summaryWide}`}><small>Dernière commande</small><strong>{formatDate(selectedOrders[0]?.created_at, true)}</strong></div></div><div className={styles.recordList} style={{ marginTop: 12 }}>{selectedOrders.slice(0, 5).map(order => <article key={order.id} className={styles.recordCard}><div><strong>{order.order_ref}</strong><div className={styles.recordMeta}><span>{order.service_type || 'Service non renseigné'}</span><span>{formatDh(order.total_amount)}</span></div></div><ActionLink href={`/sales/orders/${order.id}`} tone="light">Ouvrir</ActionLink></article>)}</div></Panel>
          <details className={styles.technicalEvidence}><summary>Note commerciale consolidée</summary><pre>{selected.notes || 'Aucune note.'}</pre></details>
          <div className={styles.inlineActions}><ActionButton tone="light" icon="settings" onClick={() => setEditing(current => !current)}>{editing ? 'Fermer la modification' : 'Modifier le dossier'}</ActionButton><ActionLink href={`/sales/orders/new?client_id=${selected.id}`} tone="navy" icon="plus">Nouvelle commande</ActionLink></div>
          {editing ? <Panel title="Mise à jour du dossier" subtitle="Utilise l’endpoint PATCH existant /api/sales-terminal/clients."><form onSubmit={updateClient} className={styles.formGrid2}><Field label="Nom"><input name="client_name" className={styles.input} defaultValue={selected.client_name} /></Field><Field label="Type"><select name="client_type" className={styles.select} defaultValue={selected.client_type || 'family'}>{typeOptions.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field><Field label="Téléphone"><input name="phone" className={styles.input} defaultValue={selected.phone || ''} /></Field><Field label="Email"><input name="email" className={styles.input} defaultValue={selected.email || ''} /></Field><Field label="Ville"><input name="city" className={styles.input} defaultValue={selected.city || ''} /></Field><Field label="Source"><input name="source" className={styles.input} defaultValue={selected.source || ''} /></Field><Field label="Statut"><select name="status" className={styles.select} defaultValue={selected.status || 'active'}>{statuses.map(item => <option key={item}>{item}</option>)}</select></Field><Field label="Adresse" wide><input name="address" className={styles.input} defaultValue={selected.address || ''} /></Field><Field label="Notes" wide><textarea name="notes" className={styles.textarea} defaultValue={selected.notes || ''} /></Field><div className={styles.fieldWide}><ActionButton type="submit" tone="navy" icon="check" disabled={saving}>{saving ? 'Enregistrement…' : 'Valider les modifications'}</ActionButton></div></form></Panel> : null}
        </div> : null}
      </Drawer>
    </div>
  </AppShell>
}
