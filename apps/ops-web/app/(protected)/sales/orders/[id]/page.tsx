'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import {
  ActionButton, ActionLink, CommercialNav, ContinuityRibbon, EmptyState, Field, formatDate, formatDh,
  HeroStat, LoadingState, MetricTile, Notice, Panel, Pill, SalesHero, SourceBadge, styles, toneForStatus,
} from '../../_components/Sales360UI'

type Order = { id: string; order_ref: string; client_id?: string; client_name: string; customer_type?: string; service_category?: string; service_type?: string; city?: string; service_date?: string; start_time?: string; end_time?: string; quantity?: number; unit_price?: number; discount_amount?: number; tax_amount?: number; total_amount?: number; status?: string; payment_status?: string; fulfillment_status?: string; payment_method?: string; payment_term?: string; next_action?: string; notes?: string; cancellation_reason?: string; created_at?: string; updated_at?: string; last_action_at?: string; manager_review_required?: boolean }
type DocumentRow = { id: string; document_ref: string; document_type: string; status?: string; created_at?: string }
type NoteRow = { id: string; note_type?: string; message: string; created_at?: string; metadata?: unknown }
type Communication = { id: string; order_id?: string; channel?: string; direction?: string; message?: string; outcome?: string; created_at?: string }
type ActionRow = { id: string; order_id?: string; action_type?: string; title?: string; priority?: string; status?: string; due_at?: string }
type Workspace = 'overview' | 'order' | 'documents' | 'payment' | 'handoff' | 'communication' | 'history' | 'controls'

export default function SalesOrderDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [order, setOrder] = useState<Order | null>(null)
  const [documents, setDocuments] = useState<DocumentRow[]>([])
  const [notes, setNotes] = useState<NoteRow[]>([])
  const [communications, setCommunications] = useState<Communication[]>([])
  const [actions, setActions] = useState<ActionRow[]>([])
  const [message, setMessage] = useState('Chargement du dossier commercial…')
  const [workspace, setWorkspace] = useState<Workspace>('overview')
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [communication, setCommunication] = useState({ channel: 'whatsapp', direction: 'outbound', message: '', outcome: '' })
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ client_name: '', city: '', service_type: '', quantity: '1', unit_price: '0', discount_amount: '0', tax_amount: '0', payment_method: '', payment_term: '', next_action: '', notes: '' })

  const total = useMemo(() => Math.max(0, Number(form.quantity || 0) * Number(form.unit_price || 0) - Number(form.discount_amount || 0) + Number(form.tax_amount || 0)), [form])

  async function load() {
    if (!id) return
    try {
      const [detailResponse, communicationsResponse, actionsResponse] = await Promise.all([
        fetch(`/api/sales-terminal/order-detail?id=${id}`, { cache: 'no-store' }),
        fetch('/api/sales-terminal/communications', { cache: 'no-store' }),
        fetch('/api/sales-terminal/actions', { cache: 'no-store' }),
      ])
      const [detailJson, communicationsJson, actionsJson] = await Promise.all([detailResponse.json(), communicationsResponse.json(), actionsResponse.json()])
      if (!detailJson.ok) throw new Error(detailJson.message || 'Dossier indisponible')
      const loaded: Order = detailJson.order
      setOrder(loaded)
      setDocuments(detailJson.documents || [])
      setNotes(detailJson.notes || [])
      setCommunications(communicationsJson.ok ? (communicationsJson.data || []).filter((item: Communication) => item.order_id === id) : [])
      setActions(actionsJson.ok ? (actionsJson.data || []).filter((item: ActionRow) => item.order_id === id) : [])
      setForm({ client_name: loaded.client_name || '', city: loaded.city || '', service_type: loaded.service_type || '', quantity: String(loaded.quantity || 1), unit_price: String(loaded.unit_price || 0), discount_amount: String(loaded.discount_amount || 0), tax_amount: String(loaded.tax_amount || 0), payment_method: loaded.payment_method || '', payment_term: loaded.payment_term || '', next_action: loaded.next_action || '', notes: loaded.notes || '' })
      setMessage(`Dossier ${loaded.order_ref} synchronisé.`)
    } catch (error) { setMessage(`Dossier bloqué : ${error instanceof Error ? error.message : 'erreur inconnue'}`) }
  }

  useEffect(() => { void load() }, [id])

  async function patch(updates: Record<string, unknown>, successMessage: string) {
    if (!order) return
    setBusy(true)
    try {
      const response = await fetch('/api/sales-terminal/order-detail', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: order.id, ...updates }) })
      const json = await response.json()
      if (!json.ok) throw new Error(json.message || 'Mise à jour impossible')
      setMessage(successMessage)
      await load()
    } catch (error) { setMessage(`Action bloquée : ${error instanceof Error ? error.message : 'erreur inconnue'}`) }
    finally { setBusy(false) }
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    await patch({ ...form, quantity: Number(form.quantity || 1), unit_price: Number(form.unit_price || 0), discount_amount: Number(form.discount_amount || 0), tax_amount: Number(form.tax_amount || 0), total_amount: total }, 'Commande mise à jour.')
    setEditing(false)
  }

  async function createDocument(type: 'quote' | 'invoice' | 'delivery') {
    if (!order) return
    if (type === 'invoice' && order.status !== 'confirmed') return setMessage('Contrôle existant : confirmer la commande avant de créer le document facture.')
    if (type === 'delivery' && !['confirmed', 'delivered'].includes(order.status || '')) return setMessage('Contrôle existant : confirmer la commande avant le document de livraison.')
    setBusy(true)
    try {
      const response = await fetch('/api/sales-terminal/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: order.id, document_type: type }) })
      const json = await response.json()
      if (!json.ok) throw new Error(json.message || 'Document impossible')
      setMessage(`Document ${type} créé.`)
      window.open(`/api/sales-terminal/print?id=${json.data.id}`, '_blank')
      await load()
    } catch (error) { setMessage(`Document bloqué : ${error instanceof Error ? error.message : 'erreur inconnue'}`) }
    finally { setBusy(false) }
  }

  async function addNote(event: FormEvent) {
    event.preventDefault()
    if (!order || !note.trim()) return
    setBusy(true)
    try {
      const response = await fetch('/api/sales-terminal/order-detail', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_note', order_id: order.id, note_type: 'agent_note', message: note }) })
      const json = await response.json()
      if (!json.ok) throw new Error(json.message || 'Note impossible')
      setNote(''); setMessage('Note interne ajoutée.'); await load()
    } catch (error) { setMessage(`Note bloquée : ${error instanceof Error ? error.message : 'erreur inconnue'}`) }
    finally { setBusy(false) }
  }

  async function logCommunication(event: FormEvent) {
    event.preventDefault()
    if (!order || !communication.message.trim()) return
    setBusy(true)
    try {
      const response = await fetch('/api/sales-terminal/communications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: order.id, ...communication }) })
      const json = await response.json()
      if (!json.ok) throw new Error(json.message || 'Journalisation impossible')
      setCommunication({ channel: communication.channel, direction: communication.direction, message: '', outcome: '' })
      setMessage('Communication enregistrée dans le journal interne. Aucun envoi externe n’est affirmé.')
      await load()
    } catch (error) { setMessage(`Journalisation bloquée : ${error instanceof Error ? error.message : 'erreur inconnue'}`) }
    finally { setBusy(false) }
  }

  async function cancelOrder() {
    if (!order || !cancelReason.trim()) return setMessage('La raison d’annulation est obligatoire.')
    if (!window.confirm(`Annuler définitivement la progression commerciale de ${order.order_ref} ?`)) return
    setBusy(true)
    try {
      const response = await fetch('/api/sales-terminal/order-detail', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'cancel_order', order_id: order.id, cancellation_reason: cancelReason }) })
      const json = await response.json()
      if (!json.ok) throw new Error(json.message || 'Annulation impossible')
      setCancelReason(''); setMessage('Commande annulée.'); await load()
    } catch (error) { setMessage(`Annulation bloquée : ${error instanceof Error ? error.message : 'erreur inconnue'}`) }
    finally { setBusy(false) }
  }

  if (!order) return <AppShell title="Dossier de commande" subtitle={message} breadcrumbs={[{ label: 'Sales', href: '/sales' }, { label: 'Commandes', href: '/sales/orders' }]}><LoadingState label={message}/></AppShell>

  const nextAction = order.next_action || (order.status === 'draft' ? 'Préparer le devis' : order.status === 'quoted' ? 'Relancer le client' : order.status === 'confirmed' && order.payment_status !== 'paid' ? 'Sécuriser le règlement' : order.payment_status === 'paid' && order.fulfillment_status !== 'handoff_ready' ? 'Préparer le handoff' : 'Maintenir le suivi')
  const documentByType = (type: string) => documents.filter(document => document.document_type === type).length

  const workspaceButtons: Array<{ id: Workspace; label: string }> = [
    { id: 'overview', label: 'Vue exécutive' }, { id: 'order', label: 'Commande' }, { id: 'documents', label: 'Devis & documents' },
    { id: 'payment', label: 'Paiement' }, { id: 'handoff', label: 'Handoff' }, { id: 'communication', label: 'Notes & communications' },
    { id: 'history', label: 'Historique' }, { id: 'controls', label: 'Contrôles' },
  ]

  return <AppShell title={`Commande ${order.order_ref}`} subtitle="Order 360 Commercial Execution Dossier" breadcrumbs={[{ label: 'Sales', href: '/sales' }, { label: 'Commandes', href: '/sales/orders' }, { label: order.order_ref }]} actions={<><PageAction href="/sales/orders">Portefeuille</PageAction><PageAction href="/sales/orders/new" variant="light">Nouvelle commande</PageAction></>}>
    <div className={styles.page}>
      <SalesHero eyebrow="Order 360 Commercial Execution Dossier" title={`${order.order_ref} · ${order.client_name}`} text="Un dossier unique pour piloter la commande, ses documents commerciaux, son statut de règlement déclaré, sa préparation de handoff et son historique interne." actions={<><ActionButton tone="light" icon="settings" onClick={() => { setEditing(current => !current); setWorkspace('order') }}>{editing ? 'Fermer la modification' : 'Modifier la commande'}</ActionButton><ActionButton tone="blue" icon="document" onClick={() => void createDocument('quote')} disabled={busy}>Créer le devis</ActionButton><ActionButton tone="navy" icon="refresh" onClick={() => void load()} disabled={busy}>Actualiser</ActionButton></>} aside={<><HeroStat label="Valeur commerciale" value={formatDh(order.total_amount)} detail={`${order.quantity || 1} × ${formatDh(order.unit_price)}`} /><HeroStat label="Situation commerciale" value={order.status || 'draft'} detail={nextAction} tone={toneForStatus(order.status)} /><HeroStat label="Paiement déclaré" value={order.payment_status || 'unpaid'} detail={`${order.payment_method || 'Méthode non renseignée'} · ${order.payment_term || 'Condition non renseignée'}`} tone={toneForStatus(order.payment_status)} /><HeroStat label="Transmission opérationnelle" value={order.fulfillment_status || 'not_started'} detail="Statut de handoff, pas preuve de mission" tone={toneForStatus(order.fulfillment_status)} /></>} />
      <CommercialNav active="orders" />
      <ContinuityRibbon items={[
        { label: 'Client', value: order.client_name, tone: 'blue' }, { label: 'Service', value: order.service_type || 'Non renseigné', tone: order.service_type ? 'green' : 'amber', href: '/services' },
        { label: 'Commande', value: order.status || 'draft', tone: toneForStatus(order.status) }, { label: 'Devis', value: `${documentByType('quote')} document(s)`, tone: documentByType('quote') ? 'green' : 'amber' },
        { label: 'Paiement', value: order.payment_status || 'unpaid', tone: toneForStatus(order.payment_status) }, { label: 'Handoff', value: order.fulfillment_status || 'not_started', tone: toneForStatus(order.fulfillment_status) },
        { label: 'Contrat', value: 'Lien non vérifié', tone: 'slate' }, { label: 'Billing', value: 'Document distinct', tone: 'amber', href: '/billing' },
      ]} />
      <div className={styles.metricsGrid}><MetricTile label="Total" value={formatDh(order.total_amount)} detail="Valeur de commande" icon="money" tone="navy" /><MetricTile label="Documents" value={documents.length} detail="Devis, facture documentaire, livraison" icon="document" /><MetricTile label="Notes" value={notes.length} detail="Historique interne" icon="command" tone="violet" /><MetricTile label="Actions ouvertes" value={actions.filter(action => action.status === 'open').length} detail="Source sales_action_queue" icon="alert" tone="amber" /></div>

      <nav className={styles.tabs}>{workspaceButtons.map(item => <button key={item.id} className={`${styles.tab} ${workspace === item.id ? styles.tabActive : ''}`} onClick={() => setWorkspace(item.id)}>{item.label}</button>)}</nav>
      <div style={{ height: 13 }}/>

      {workspace === 'overview' ? <div className={styles.grid2}>
        <div className={styles.stack}>
          <Panel title="Brief d’exécution" subtitle={message} action={<SourceBadge tone="green">Sales Terminal live</SourceBadge>}><div className={styles.summaryGrid}><div className={styles.summaryCell}><small>Client</small><strong>{order.client_name}</strong></div><div className={styles.summaryCell}><small>Service</small><strong>{order.service_type || 'Non renseigné'}</strong></div><div className={styles.summaryCell}><small>Ville</small><strong>{order.city || 'Non renseignée'}</strong></div><div className={styles.summaryCell}><small>Date service</small><strong>{formatDate(order.service_date)}</strong></div><div className={`${styles.summaryCell} ${styles.summaryWide}`}><small>Action recommandée</small><strong>{nextAction}</strong></div></div></Panel>
          <Panel title="Contrôle rapide" subtitle="Actions existantes, sans modification des statuts ou gardes backend."><div className={styles.inlineActions}><ActionButton tone="blue" onClick={() => void patch({ status: 'quoted' }, 'Commande marquée comme devis émis.')} disabled={busy}>Marquer devis émis</ActionButton><ActionButton tone="green" onClick={() => void patch({ status: 'confirmed' }, 'Commande confirmée.')} disabled={busy}>Confirmer</ActionButton><ActionButton tone="amber" onClick={() => { if (window.confirm('Déclarer cette commande comme réglée dans le Sales Terminal ?')) void patch({ payment_status: 'paid' }, 'Commande déclarée réglée.') }} disabled={busy}>Déclarer réglée</ActionButton><ActionButton tone="navy" onClick={() => void patch({ fulfillment_status: 'handoff_ready' }, 'Commande marquée prête pour handoff.')} disabled={busy}>Handoff prêt</ActionButton></div></Panel>
        </div>
        <div className={styles.stack}>
          <Notice tone="amber" title="Statut de paiement ≠ preuve bancaire" text="L’action Déclarer réglée met à jour le statut de la commande. Elle ne crée pas de transaction bancaire, de reçu ou de facture Billing 360." />
          <Notice tone="blue" title="Handoff prêt ≠ activation opérationnelle" text="Ce statut ne prouve ni contrat créé, ni mission générée, ni dispatch confirmé." />
          {order.manager_review_required ? <Notice tone="red" title="Revue manager signalée" text="La commande porte le marqueur manager_review_required du backend actuel." /> : null}
        </div>
      </div> : null}

      {workspace === 'order' ? <div className={styles.grid2}>
        <Panel title="Contenu de la commande" subtitle="État commercial et paramètres enregistrés."><div className={styles.summaryGrid}><div className={styles.summaryCell}><small>Référence</small><strong>{order.order_ref}</strong></div><div className={styles.summaryCell}><small>Client</small><strong>{order.client_name}</strong></div><div className={styles.summaryCell}><small>Service</small><strong>{order.service_type || 'Non renseigné'}</strong></div><div className={styles.summaryCell}><small>Ville</small><strong>{order.city || 'Non renseignée'}</strong></div><div className={styles.summaryCell}><small>Quantité</small><strong>{order.quantity || 1}</strong></div><div className={styles.summaryCell}><small>Prix unitaire</small><strong>{formatDh(order.unit_price)}</strong></div><div className={styles.summaryCell}><small>Remise</small><strong>{formatDh(order.discount_amount)}</strong></div><div className={styles.summaryCell}><small>Frais</small><strong>{formatDh(order.tax_amount)}</strong></div><div className={`${styles.summaryCell} ${styles.summaryWide}`}><small>Notes</small><strong>{order.notes || 'Aucune note'}</strong></div></div></Panel>
        {editing ? <Panel title="Modifier la commande" subtitle="Enregistrement via /api/sales-terminal/order-detail PATCH."><form onSubmit={save} className={styles.formGrid2}><Field label="Client"><input className={styles.input} value={form.client_name} onChange={event => setForm({ ...form, client_name: event.target.value })} /></Field><Field label="Ville"><input className={styles.input} value={form.city} onChange={event => setForm({ ...form, city: event.target.value })} /></Field><Field label="Service" wide><input className={styles.input} value={form.service_type} onChange={event => setForm({ ...form, service_type: event.target.value })} /></Field><Field label="Quantité"><input className={styles.input} type="number" value={form.quantity} onChange={event => setForm({ ...form, quantity: event.target.value })} /></Field><Field label="Prix unitaire"><input className={styles.input} type="number" value={form.unit_price} onChange={event => setForm({ ...form, unit_price: event.target.value })} /></Field><Field label="Remise"><input className={styles.input} type="number" value={form.discount_amount} onChange={event => setForm({ ...form, discount_amount: event.target.value })} /></Field><Field label="Frais"><input className={styles.input} type="number" value={form.tax_amount} onChange={event => setForm({ ...form, tax_amount: event.target.value })} /></Field><Field label="Méthode de paiement"><input className={styles.input} value={form.payment_method} onChange={event => setForm({ ...form, payment_method: event.target.value })} /></Field><Field label="Condition de paiement"><input className={styles.input} value={form.payment_term} onChange={event => setForm({ ...form, payment_term: event.target.value })} /></Field><Field label="Prochaine action" wide><input className={styles.input} value={form.next_action} onChange={event => setForm({ ...form, next_action: event.target.value })} /></Field><Field label="Notes" wide><textarea className={styles.textarea} value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} /></Field><div className={`${styles.summaryCell} ${styles.summaryWide}`}><small>Nouveau total</small><strong>{formatDh(total)}</strong></div><div className={styles.fieldWide}><ActionButton type="submit" tone="navy" icon="check" disabled={busy}>Valider les modifications</ActionButton></div></form></Panel> : <Notice tone="slate" title="Lecture seule" text="Utilisez Modifier la commande dans le passeport pour ouvrir la gouvernance des champs existants." />}
      </div> : null}

      {workspace === 'documents' ? <div className={styles.grid2}>
        <Panel title="Studio documentaire" subtitle="Documents commerciaux Sales Terminal, distincts des enregistrements Billing 360."><div className={styles.inlineActions}><ActionButton tone="blue" icon="document" onClick={() => void createDocument('quote')} disabled={busy}>Créer devis</ActionButton><ActionButton tone="amber" icon="document" onClick={() => void createDocument('invoice')} disabled={busy}>Créer document facture</ActionButton><ActionButton tone="green" icon="document" onClick={() => void createDocument('delivery')} disabled={busy}>Créer document livraison</ActionButton></div><div className={styles.divider}/><div className={styles.recordList}>{documents.length === 0 ? <EmptyState title="Aucun document généré" text="Créez un devis ou, lorsque les gardes existantes le permettent, un document facture ou livraison." /> : documents.map(document => <article key={document.id} className={styles.recordCard}><div className={styles.recordMain}><div className={styles.recordTitle}><strong>{document.document_ref}</strong><Pill tone={toneForStatus(document.status)}>{document.status || 'issued'}</Pill></div><div className={styles.recordMeta}><span>{document.document_type}</span><span>{formatDate(document.created_at, true)}</span></div></div><a className={`${styles.actionButton} ${styles.actionLight}`} href={`/api/sales-terminal/print?id=${document.id}`} target="_blank" rel="noreferrer">Imprimer</a></article>)}</div></Panel>
        <div className={styles.stack}><Notice tone="amber" title="Facture documentaire Sales" text="Le PDF créé ici n’est pas automatiquement une ligne billing_invoices. Billing 360 reste un domaine financier distinct." /><Panel title="Couverture documentaire"><div className={styles.summaryGrid}><div className={styles.summaryCell}><small>Devis</small><strong>{documentByType('quote')}</strong></div><div className={styles.summaryCell}><small>Factures documentaires</small><strong>{documentByType('invoice')}</strong></div><div className={styles.summaryCell}><small>Livraison</small><strong>{documentByType('delivery')}</strong></div><div className={styles.summaryCell}><small>Total</small><strong>{documents.length}</strong></div></div></Panel></div>
      </div> : null}

      {workspace === 'payment' ? <div className={styles.grid2}>
        <Panel title="Situation du règlement" subtitle="Contrôle du statut Sales Terminal existant."><div className={styles.summaryGrid}><div className={styles.summaryCell}><small>Valeur commande</small><strong>{formatDh(order.total_amount)}</strong></div><div className={styles.summaryCell}><small>Statut paiement</small><strong>{order.payment_status || 'unpaid'}</strong></div><div className={styles.summaryCell}><small>Méthode</small><strong>{order.payment_method || 'Non renseignée'}</strong></div><div className={styles.summaryCell}><small>Condition</small><strong>{order.payment_term || 'Non renseignée'}</strong></div></div><div className={styles.inlineActions} style={{ marginTop: 14 }}><ActionButton tone="green" icon="check" onClick={() => { if (window.confirm('Cette action met uniquement à jour le statut Sales Terminal. Continuer ?')) void patch({ payment_status: 'paid' }, 'Commande déclarée réglée.') }} disabled={busy || order.payment_status === 'paid'}>Déclarer la commande réglée</ActionButton></div></Panel>
        <div className={styles.stack}><Notice tone="red" title="Aucune preuve de transaction créée" text="Cette action ne stocke ni référence bancaire, ni paiement partiel, ni reçu, ni rapprochement. Ne l’utilisez qu’en accord avec votre procédure interne." /><ActionLink href="/billing" tone="light" icon="money">Ouvrir Billing 360</ActionLink></div>
      </div> : null}

      {workspace === 'handoff' ? <div className={styles.grid2}>
        <Panel title="Préparation de la transmission" subtitle="Statut de fulfilment existant."><div className={styles.summaryGrid}><div className={styles.summaryCell}><small>État actuel</small><strong>{order.fulfillment_status || 'not_started'}</strong></div><div className={styles.summaryCell}><small>Paiement déclaré</small><strong>{order.payment_status || 'unpaid'}</strong></div><div className={styles.summaryCell}><small>Service</small><strong>{order.service_type || 'Non renseigné'}</strong></div><div className={styles.summaryCell}><small>Ville</small><strong>{order.city || 'Non renseignée'}</strong></div></div><div className={styles.inlineActions} style={{ marginTop: 14 }}><ActionButton tone="navy" icon="handoff" onClick={() => void patch({ fulfillment_status: 'handoff_ready' }, 'Commande prête pour transmission opérationnelle.')} disabled={busy || order.fulfillment_status === 'handoff_ready'}>Marquer Handoff prêt</ActionButton></div></Panel>
        <Notice tone="amber" title="Limite de l’intégration" text="Aucun contrat, mission ou dispatch n’est affirmé. Le statut indique uniquement que le dossier commercial est prêt à être transmis." />
      </div> : null}

      {workspace === 'communication' ? <div className={styles.grid2}>
        <Panel title="Note interne" subtitle="Ajout au timeline sales_terminal_order_notes."><form onSubmit={addNote} className={styles.stack}><textarea className={styles.textarea} value={note} onChange={event => setNote(event.target.value)} placeholder="Contexte, décision, blocage ou suivi interne…"/><ActionButton type="submit" tone="navy" icon="plus" disabled={busy || !note.trim()}>Ajouter la note</ActionButton></form></Panel>
        <Panel title="Journaliser une communication" subtitle="Journal interne uniquement — aucune livraison externe n’est affirmée."><form onSubmit={logCommunication} className={styles.stack}><div className={styles.formGrid2}><Field label="Canal"><select className={styles.select} value={communication.channel} onChange={event => setCommunication({ ...communication, channel: event.target.value })}><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="phone">Téléphone</option><option value="meeting">Réunion</option></select></Field><Field label="Direction"><select className={styles.select} value={communication.direction} onChange={event => setCommunication({ ...communication, direction: event.target.value })}><option value="outbound">Sortante</option><option value="inbound">Entrante</option></select></Field><Field label="Message / résumé" wide><textarea className={styles.textarea} value={communication.message} onChange={event => setCommunication({ ...communication, message: event.target.value })} /></Field><Field label="Résultat" wide><input className={styles.input} value={communication.outcome} onChange={event => setCommunication({ ...communication, outcome: event.target.value })} /></Field></div><ActionButton type="submit" tone="blue" icon="plus" disabled={busy || !communication.message.trim()}>Enregistrer dans le journal</ActionButton></form></Panel>
        <Panel title="Communications enregistrées" subtitle="Log ≠ envoi confirmé." className={styles.fieldWide}><div className={styles.recordList}>{communications.length === 0 ? <EmptyState title="Aucune communication enregistrée" text="Aucun log interne n’est actuellement associé à cette commande." /> : communications.map(item => <article key={item.id} className={styles.recordCard}><div><div className={styles.recordTitle}><strong>{item.channel || 'Canal'}</strong><Pill tone="slate">{item.direction || 'direction'}</Pill></div><p className={styles.muted}>{item.message || 'Sans contenu'}</p><div className={styles.recordMeta}><span>{item.outcome || 'Résultat non renseigné'}</span><span>{formatDate(item.created_at, true)}</span></div></div></article>)}</div></Panel>
      </div> : null}

      {workspace === 'history' ? <div className={styles.grid2}>
        <Panel title="Timeline des notes et systèmes" subtitle="Événements retournés par le dossier de commande."><div className={styles.timeline}>{notes.length === 0 ? <EmptyState title="Historique vide" text="Aucune note ou trace système n’est actuellement visible." /> : notes.map(item => <div key={item.id} className={styles.timelineItem}><span className={styles.timelineDot}/><div><strong>{item.note_type || 'note'}</strong><p>{item.message}</p><small className={styles.muted}>{formatDate(item.created_at, true)}</small></div></div>)}</div></Panel>
        <Panel title="Actions commerciales" subtitle="Source sales_action_queue, distincte du dossier principal."><div className={styles.recordList}>{actions.length === 0 ? <EmptyState title="Aucune action liée" text="Aucune action de la file sales_action_queue ne correspond à cette commande." /> : actions.map(item => <article key={item.id} className={styles.recordCard}><div><div className={styles.recordTitle}><strong>{item.title || item.action_type || 'Action'}</strong><Pill tone={toneForStatus(item.status)}>{item.status || 'open'}</Pill></div><div className={styles.recordMeta}><span>{item.priority || 'Priorité non définie'}</span><span>{formatDate(item.due_at, true)}</span></div></div></article>)}</div></Panel>
      </div> : null}

      {workspace === 'controls' ? <div className={styles.grid2}>
        <Panel title="Contrôles commerciaux" subtitle="Progression manuelle et explicite des statuts."><div className={styles.inlineActions}><ActionButton tone="blue" onClick={() => void patch({ status: 'quoted' }, 'Commande marquée devis émis.')} disabled={busy}>Devis émis</ActionButton><ActionButton tone="green" onClick={() => void patch({ status: 'confirmed' }, 'Commande confirmée.')} disabled={busy}>Confirmer</ActionButton><ActionButton tone="amber" onClick={() => void patch({ payment_status: 'paid' }, 'Commande déclarée réglée.')} disabled={busy}>Déclarer réglée</ActionButton><ActionButton tone="navy" onClick={() => void patch({ fulfillment_status: 'handoff_ready' }, 'Handoff prêt.')} disabled={busy}>Handoff prêt</ActionButton></div></Panel>
        <section className={styles.dangerZone}><h3>Annulation contrôlée</h3><p>La raison est obligatoire et sera enregistrée par l’action existante. L’annulation ne supprime pas les documents ou notes historiques.</p><textarea className={styles.textarea} value={cancelReason} onChange={event => setCancelReason(event.target.value)} placeholder="Raison d’annulation obligatoire…"/><div style={{ marginTop: 10 }}><ActionButton tone="red" icon="alert" onClick={() => void cancelOrder()} disabled={busy || !cancelReason.trim()}>Annuler la commande</ActionButton></div></section>
      </div> : null}

      <details className={styles.technicalEvidence}><summary>Évidence technique du dossier</summary><pre>{JSON.stringify({ order, documents, notes, communications, actions }, null, 2)}</pre></details>
    </div>
  </AppShell>
}
