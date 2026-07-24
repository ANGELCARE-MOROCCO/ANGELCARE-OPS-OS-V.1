'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import {
  ActionButton, ActionLink, CommercialNav, Field, formatDh, HeroStat, Icon, Notice, Panel, Pill,
  SalesHero, SourceBadge, styles,
} from '../../_components/Sales360UI'

type Client = { id: string; client_name: string; client_type?: string; phone?: string; email?: string; city?: string }
type CatalogItem = { id: string; service_name?: string; variation_name?: string; category?: string; price?: number; description?: string; source?: string; status?: string }

const initialForm = {
  client_id: '', client_name: '', customer_type: 'family', phone: '', email: '', city: '',
  service_category: 'childcare', service_type: '', service_label: '', quantity: '1', unit_price: '0', discount: '0', tax: '0',
  payment_method: 'cash', payment_term: 'immediate', devis_object: '', devis_region: '', devis_contact: '', devis_program: '', devis_session: '', devis_note: '', notes: '',
}

export default function NewOrderPage() {
  const searchParams = useSearchParams()
  const requestedClientId = searchParams.get('client_id') || ''
  const [clients, setClients] = useState<Client[]>([])
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('Chargement du studio commercial…')
  const [saving, setSaving] = useState(false)
  const [activeStage, setActiveStage] = useState(1)
  const [form, setForm] = useState(initialForm)

  async function load() {
    try {
      const [clientResponse, serviceResponse] = await Promise.all([
        fetch('/api/sales-terminal/clients', { cache: 'no-store' }),
        fetch('/api/sales-terminal/service-catalog', { cache: 'no-store' }),
      ])
      const [clientJson, serviceJson] = await Promise.all([clientResponse.json(), serviceResponse.json()])
      const loadedClients: Client[] = clientJson.ok ? clientJson.data || [] : []
      setClients(loadedClients)
      setCatalog(serviceJson.ok ? serviceJson.data || [] : [])
      setMessage(serviceJson.ok ? 'Clients et catalogue Services chargés.' : 'Clients chargés, catalogue Services partiellement indisponible.')
      if (requestedClientId) {
        const client = loadedClients.find(item => item.id === requestedClientId)
        if (client) selectClient(client.id, loadedClients)
      }
    } catch (error) {
      setMessage(`Studio partiellement disponible : ${error instanceof Error ? error.message : 'erreur inconnue'}`)
    }
  }

  useEffect(() => { void load() }, [])

  const subtotal = Number(form.quantity || 0) * Number(form.unit_price || 0)
  const total = useMemo(() => Math.max(0, subtotal - Number(form.discount || 0) + Number(form.tax || 0)), [subtotal, form.discount, form.tax])
  const visibleServices = useMemo(() => catalog.filter(item => `${item.service_name || ''} ${item.variation_name || ''} ${item.category || ''} ${item.description || ''}`.toLowerCase().includes(query.toLowerCase())).slice(0, 18), [catalog, query])
  const completeness = [form.client_name, form.service_label || form.service_type, Number(form.unit_price) > 0, form.payment_method, form.payment_term].filter(Boolean).length
  const score = Math.round((completeness / 5) * 100)

  function selectClient(id: string, source = clients) {
    const client = source.find(item => item.id === id)
    setForm(current => ({ ...current, client_id: id, client_name: client?.client_name || '', customer_type: client?.client_type || 'family', city: client?.city || '', devis_region: client?.city || '', devis_contact: client?.client_name || '', phone: client?.phone || '', email: client?.email || '' }))
  }

  function selectService(service: CatalogItem) {
    const label = service.variation_name ? `${service.service_name} — ${service.variation_name}` : String(service.service_name || '')
    setForm(current => ({ ...current, service_category: service.category || 'service', service_type: service.service_name || '', service_label: label, devis_object: label, unit_price: String(service.price || 0), notes: [current.notes, service.description ? `Service description: ${service.description}` : ''].filter(Boolean).join('\n') }))
    setActiveStage(3)
  }

  async function save() {
    if (!form.client_name.trim()) return setMessage('Le nom du client est obligatoire.')
    setSaving(true)
    const notes = [
      form.notes, '--- DEVIS TEMPLATE DATA ---', `Devis object: ${form.devis_object}`, `Devis contact: ${form.devis_contact || form.client_name}`,
      `Devis phone: ${form.phone}`, `Devis region: ${form.devis_region || form.city}`, `Program proposal: ${form.devis_program}`,
      `Session déroulement: ${form.devis_session}`, `Note devis: ${form.devis_note}`, `Service label: ${form.service_label}`,
    ].join('\n')
    try {
      const response = await fetch('/api/sales-terminal/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: form.client_id || null, client_name: form.client_name, customer_type: form.customer_type, city: form.city || form.devis_region, service_category: form.service_category, service_type: form.service_label || form.service_type, quantity: Number(form.quantity || 1), unit_price: Number(form.unit_price || 0), discount_amount: Number(form.discount || 0), tax_amount: Number(form.tax || 0), total_amount: total, payment_method: form.payment_method, payment_term: form.payment_term, payment_status: 'unpaid', fulfillment_status: 'not_started', status: 'draft', next_action: 'Create/send quote', notes }) })
      const json = await response.json()
      if (!json.ok) throw new Error(json.message || 'Création impossible')
      window.location.href = `/sales/orders/${json.data.id}`
    } catch (error) {
      setMessage(`Création bloquée : ${error instanceof Error ? error.message : 'erreur inconnue'}`)
      setSaving(false)
    }
  }

  const stages = [
    { id: 1, label: 'Client' }, { id: 2, label: 'Service' }, { id: 3, label: 'Composition' },
    { id: 4, label: 'Contexte de devis' }, { id: 5, label: 'Revue' },
  ]

  return <AppShell title="Nouvelle commande Sales 360" subtitle="Commercial Order Design Studio connecté au catalogue Services et au Sales Terminal." breadcrumbs={[{ label: 'Sales', href: '/sales' }, { label: 'Commandes', href: '/sales/orders' }, { label: 'Nouvelle' }]} actions={<PageAction href="/sales/orders" variant="light">Retour aux commandes</PageAction>}>
    <div className={styles.page}>
      <SalesHero eyebrow="Commercial Order Design Studio" title="Composer une commande claire, valorisée et prête à devenir un devis contrôlé." text="Le service et son prix peuvent être importés depuis le catalogue existant. Le montant est ensuite enregistré dans la commande et ne se resynchronise pas automatiquement avec les changements futurs du catalogue." actions={<><ActionLink href="/sales/orders" tone="light">Portefeuille des commandes</ActionLink><ActionLink href="/services" tone="blue" icon="service">Catalogue Services</ActionLink></>} aside={<><HeroStat label="Total de la commande" value={formatDh(total)} detail={`Sous-total ${formatDh(subtotal)}`} /><HeroStat label="Préparation" value={`${score} %`} detail={`${completeness}/5 contrôles essentiels`} tone={score === 100 ? 'green' : 'amber'} /><HeroStat label="Source service" value={form.service_label ? 'Catalogue importé' : 'Saisie manuelle'} detail={`${catalog.length} offres disponibles`} tone={form.service_label ? 'green' : 'slate'} /></>} />
      <CommercialNav active="orders" />

      <nav className={styles.subnav}>{stages.map(stage => <button key={stage.id} className={activeStage === stage.id ? styles.subnavActive : ''} onClick={() => setActiveStage(stage.id)}>{String(stage.id).padStart(2, '0')} · {stage.label}</button>)}</nav>
      <Notice tone="blue" title="Contrat de persistance" text="Les données avancées de devis restent encodées dans le champ notes selon l’API actuelle. Aucun contrat, mission ou enregistrement Billing 360 n’est créé automatiquement." />

      <div className={styles.grid2} style={{ marginTop: 18 }}>
        <div className={styles.stack}>
          <Panel title="01 — Client et identité commerciale" subtitle="Sélectionner un dossier existant ou saisir un client manuellement.">
            <div className={styles.formGrid}>
              <Field label="Client existant"><select className={styles.select} value={form.client_id} onChange={event => selectClient(event.target.value)}><option value="">Saisie manuelle</option>{clients.map(client => <option key={client.id} value={client.id}>{client.client_name}</option>)}</select></Field>
              <Field label="Nom du client *"><input className={styles.input} value={form.client_name} onChange={event => setForm({ ...form, client_name: event.target.value, devis_contact: event.target.value })} /></Field>
              <Field label="Type de client"><input className={styles.input} value={form.customer_type} onChange={event => setForm({ ...form, customer_type: event.target.value })} /></Field>
              <Field label="Téléphone"><input className={styles.input} value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} /></Field>
              <Field label="Email"><input className={styles.input} type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></Field>
              <Field label="Ville / région"><input className={styles.input} value={form.city} onChange={event => setForm({ ...form, city: event.target.value, devis_region: event.target.value })} /></Field>
            </div>
          </Panel>

          <Panel title="02 — Sélection du service" subtitle={message} action={<SourceBadge tone={catalog.length ? 'green' : 'amber'}>{catalog.length ? 'Catalogue Services' : 'Saisie manuelle'}</SourceBadge>}>
            <div className={styles.toolbar}><div className={styles.searchWrap}><Icon name="search"/><input className={styles.input} value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher service, variation ou catégorie…" /></div><ActionLink href="/services" tone="light" icon="service">Ouvrir Services 360</ActionLink></div>
            {visibleServices.length ? <div className={styles.cardGrid}>{visibleServices.map(service => <button key={service.id} className={`${styles.choiceCard} ${form.service_label === (service.variation_name ? `${service.service_name} — ${service.variation_name}` : service.service_name) ? styles.choiceCardActive : ''}`} onClick={() => selectService(service)}><div className={styles.recordTitle}><strong>{service.service_name || 'Service'}</strong>{service.variation_name ? <Pill tone="violet">{service.variation_name}</Pill> : null}</div><small>{service.category || 'Catégorie non renseignée'} · {formatDh(service.price)}</small><SourceBadge tone="green">Catalogue existant</SourceBadge></button>)}</div> : <Notice tone="amber" title="Catalogue non disponible" text="La commande peut rester en saisie manuelle. Aucun service fictif n’est généré." />}
            <div className={styles.formGrid} style={{ marginTop: 14 }}><Field label="Catégorie"><input className={styles.input} value={form.service_category} onChange={event => setForm({ ...form, service_category: event.target.value })} /></Field><Field label="Type de service"><input className={styles.input} value={form.service_type} onChange={event => setForm({ ...form, service_type: event.target.value })} /></Field><Field label="Libellé devis"><input className={styles.input} value={form.service_label} onChange={event => setForm({ ...form, service_label: event.target.value })} /></Field></div>
          </Panel>

          <Panel title="03 — Composition commerciale" subtitle="Le total utilise exactement la formule existante : quantité × prix − remise + frais.">
            <div className={styles.formGrid}><Field label="Quantité"><input className={styles.input} type="number" min="0" value={form.quantity} onChange={event => setForm({ ...form, quantity: event.target.value })} /></Field><Field label="Prix unitaire"><input className={styles.input} type="number" min="0" value={form.unit_price} onChange={event => setForm({ ...form, unit_price: event.target.value })} /></Field><Field label="Remise"><input className={styles.input} type="number" min="0" value={form.discount} onChange={event => setForm({ ...form, discount: event.target.value })} /></Field><Field label="Taxes / frais"><input className={styles.input} type="number" min="0" value={form.tax} onChange={event => setForm({ ...form, tax: event.target.value })} /></Field><Field label="Méthode de paiement"><input className={styles.input} value={form.payment_method} onChange={event => setForm({ ...form, payment_method: event.target.value })} /></Field><Field label="Condition de paiement"><input className={styles.input} value={form.payment_term} onChange={event => setForm({ ...form, payment_term: event.target.value })} /></Field></div>
          </Panel>

          <Panel title="04 — Contexte du devis" subtitle="Ces informations restent consolidées dans la note de commande.">
            <div className={styles.formGrid}><Field label="Objet du devis"><input className={styles.input} value={form.devis_object} onChange={event => setForm({ ...form, devis_object: event.target.value })} /></Field><Field label="Contact devis"><input className={styles.input} value={form.devis_contact} onChange={event => setForm({ ...form, devis_contact: event.target.value })} /></Field><Field label="Région devis"><input className={styles.input} value={form.devis_region} onChange={event => setForm({ ...form, devis_region: event.target.value })} /></Field><Field label="Programme d’activités" wide><textarea className={styles.textarea} value={form.devis_program} onChange={event => setForm({ ...form, devis_program: event.target.value })} /></Field><Field label="Déroulement de session" wide><textarea className={styles.textarea} value={form.devis_session} onChange={event => setForm({ ...form, devis_session: event.target.value })} /></Field><Field label="Note devis" wide><textarea className={styles.textarea} value={form.devis_note} onChange={event => setForm({ ...form, devis_note: event.target.value })} /></Field><Field label="Notes opérationnelles" wide><textarea className={styles.textarea} value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} /></Field></div>
          </Panel>
        </div>

        <aside className={`${styles.stack} ${styles.stickyRail}`}>
          <Panel title="Revue de la commande" subtitle="Contrôle avant création du brouillon.">
            <div className={styles.commercialScore}><div><strong style={{ fontSize: 28 }}>{formatDh(total)}</strong><p className={styles.muted}>Valeur calculée et enregistrée dans la commande.</p></div><div className={styles.scoreRing} style={{ '--score': `${score}%` } as React.CSSProperties}><strong>{score}%</strong></div></div>
            <div className={styles.divider}/>
            <div className={styles.summaryGrid}><div className={styles.summaryCell}><small>Client</small><strong>{form.client_name || 'Manquant'}</strong></div><div className={styles.summaryCell}><small>Service</small><strong>{form.service_label || form.service_type || 'Manquant'}</strong></div><div className={styles.summaryCell}><small>Sous-total</small><strong>{formatDh(subtotal)}</strong></div><div className={styles.summaryCell}><small>Remise</small><strong>{formatDh(form.discount)}</strong></div><div className={styles.summaryCell}><small>Frais</small><strong>{formatDh(form.tax)}</strong></div><div className={styles.summaryCell}><small>Paiement</small><strong>{form.payment_method} · {form.payment_term}</strong></div></div>
          </Panel>
          {Number(form.discount || 0) > subtotal ? <Notice tone="red" title="Remise supérieure au sous-total" text="Le backend ramène le total à zéro. Vérifiez la composition avant enregistrement." /> : null}
          <Notice tone="amber" title="Handoff et finance" text="La création produit une commande brouillon. Elle ne crée ni contrat, ni mission, ni facture Billing 360, ni paiement vérifié." />
          <ActionButton tone="navy" icon="check" onClick={() => void save()} disabled={saving || !form.client_name.trim()}>{saving ? 'Création en cours…' : 'Créer la commande commerciale'}</ActionButton>
        </aside>
      </div>
    </div>
  </AppShell>
}
