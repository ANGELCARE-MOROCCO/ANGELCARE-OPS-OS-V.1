'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import {
  ActionButton, CommercialNav, EmptyState, Field, HeroStat, MetricTile, Notice, Panel, Pill,
  SalesHero, SourceBadge, styles,
} from '../_components/Sales360UI'

type Option = { id: string; area: string; option_key?: string; label: string; value: string; description?: string; sort_order?: number; is_active?: boolean; updated_at?: string }
const areas = ['customer_type', 'service_category', 'service_type', 'city', 'segment', 'payment_method', 'payment_term', 'order_status', 'discount_type', 'communication_script', 'next_action']
const areaLabels: Record<string, string> = {
  customer_type: 'Types de clients', service_category: 'Catégories de services', service_type: 'Types de services', city: 'Villes', segment: 'Segments',
  payment_method: 'Méthodes de paiement', payment_term: 'Conditions de paiement', order_status: 'Statuts de commande', discount_type: 'Types de remise',
  communication_script: 'Scripts de communication', next_action: 'Prochaines actions',
}

export default function ConfigurationPage() {
  const [items, setItems] = useState<Option[]>([])
  const [message, setMessage] = useState('Chargement de la gouvernance commerciale…')
  const [form, setForm] = useState({ area: 'customer_type', label: '', value: '', description: '', sort_order: 0, is_active: true })
  const [query, setQuery] = useState('')
  const [activeArea, setActiveArea] = useState('all')
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const response = await fetch('/api/sales-terminal/options', { cache: 'no-store' })
      const json = await response.json()
      if (!json.ok) throw new Error(json.message || 'Options API indisponible')
      setItems(json.data || [])
      setMessage(`${json.data?.length || 0} options chargées.`)
    } catch (error) { setMessage(`Configuration partielle : ${error instanceof Error ? error.message : 'erreur inconnue'}`) }
  }

  useEffect(() => { void load() }, [])

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!form.label.trim()) return setMessage('Le libellé est obligatoire.')
    setSaving(true)
    try {
      const response = await fetch('/api/sales-terminal/options', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const json = await response.json()
      if (!json.ok) throw new Error(json.message || 'Enregistrement impossible')
      setMessage('Option enregistrée et disponible selon son statut.')
      setForm(current => ({ ...current, label: '', value: '', description: '', sort_order: 0 }))
      await load()
    } catch (error) { setMessage(`Enregistrement bloqué : ${error instanceof Error ? error.message : 'erreur inconnue'}`) }
    finally { setSaving(false) }
  }

  async function toggle(item: Option) {
    const response = await fetch('/api/sales-terminal/options', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, is_active: !item.is_active }) })
    const json = await response.json()
    setMessage(json.ok ? 'Statut de l’option mis à jour.' : `Action bloquée : ${json.message}`)
    if (json.ok) await load()
  }

  async function remove(item: Option) {
    if (!window.confirm(`Supprimer l’option « ${item.label} » ? Les commandes historiques ne sont pas réécrites automatiquement.`)) return
    const response = await fetch(`/api/sales-terminal/options?id=${item.id}`, { method: 'DELETE' })
    const json = await response.json()
    setMessage(json.ok ? 'Option supprimée.' : `Suppression bloquée : ${json.message}`)
    if (json.ok) await load()
  }

  const visible = useMemo(() => items.filter(item => (activeArea === 'all' || item.area === activeArea) && `${item.label} ${item.value} ${item.option_key || ''} ${item.description || ''}`.toLowerCase().includes(query.toLowerCase())), [items, activeArea, query])
  const active = items.filter(item => item.is_active !== false).length
  const inactive = items.length - active
  const usedAreas = new Set(items.map(item => item.area)).size

  return <AppShell title="Configuration Sales 360" subtitle="Commercial Configuration Governance" breadcrumbs={[{ label: 'Sales', href: '/sales' }, { label: 'Configuration' }]} actions={<PageAction href="/sales">Command Center</PageAction>}>
    <div className={styles.page}>
      <SalesHero eyebrow="Commercial Configuration Governance" title="Gouverner les options qui structurent les formulaires et les statuts du Sales Terminal." text="Chaque option est gérée dans son périmètre actuel. L’activation, la désactivation ou la suppression ne réécrit pas automatiquement les commandes historiques." actions={<ActionButton tone="navy" icon="refresh" onClick={() => void load()}>Actualiser</ActionButton>} aside={<><HeroStat label="Options" value={items.length} detail={`${active} actives · ${inactive} inactives`} /><HeroStat label="Domaines couverts" value={usedAreas} detail={`${areas.length} familles prévues`} tone="blue" /><HeroStat label="Source" value="Sales Terminal" detail="sales_terminal_options" tone="green" /></>} />
      <CommercialNav active="configuration" />
      <div className={styles.metricsGrid}><MetricTile label="Options" value={items.length} detail="Toutes catégories" icon="settings" /><MetricTile label="Actives" value={active} detail="Disponibles dans les formulaires" icon="check" tone="green" /><MetricTile label="Inactives" value={inactive} detail="Conservées mais non proposées" icon="alert" tone={inactive ? 'amber' : 'green'} /><MetricTile label="Domaines" value={usedAreas} detail="Familles configurées" icon="service" tone="violet" /></div>
      <Notice tone="amber" title="Impact historique" text="La suppression ou la désactivation d’une option ne met pas à jour les commandes existantes qui utilisent déjà sa valeur." />

      <div className={styles.grid2} style={{ marginTop: 18 }}>
        <Panel title="Créer ou mettre à jour une option" subtitle={message} action={<SourceBadge tone="green">API options existante</SourceBadge>}>
          <form onSubmit={save} className={styles.formGrid2}>
            <Field label="Domaine"><select className={styles.select} value={form.area} onChange={event => setForm({ ...form, area: event.target.value })}>{areas.map(area => <option key={area} value={area}>{areaLabels[area]}</option>)}</select></Field>
            <Field label="Libellé *"><input className={styles.input} value={form.label} onChange={event => setForm({ ...form, label: event.target.value })} /></Field>
            <Field label="Valeur" hint="Générée depuis le libellé si vide."><input className={styles.input} value={form.value} onChange={event => setForm({ ...form, value: event.target.value })} /></Field>
            <Field label="Ordre"><input className={styles.input} type="number" value={form.sort_order} onChange={event => setForm({ ...form, sort_order: Number(event.target.value) })} /></Field>
            <Field label="Description" wide><textarea className={styles.textarea} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></Field>
            <div className={styles.fieldWide}><ActionButton type="submit" tone="navy" icon="check" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer l’option'}</ActionButton></div>
          </form>
        </Panel>

        <Panel title="Couverture de configuration" subtitle="Répartition par domaine.">
          <div className={styles.recordList}>{areas.map(area => {
            const group = items.filter(item => item.area === area)
            return <button key={area} className={`${styles.choiceCard} ${activeArea === area ? styles.choiceCardActive : ''}`} onClick={() => setActiveArea(activeArea === area ? 'all' : area)}><div className={styles.recordTitle}><strong>{areaLabels[area]}</strong><Pill tone={group.length ? 'blue' : 'amber'}>{group.length}</Pill></div><small>{group.filter(item => item.is_active !== false).length} actives</small></button>
          })}</div>
        </Panel>
      </div>

      <Panel title="Inventaire des options" subtitle={`${visible.length} options dans la vue actuelle`} action={<SourceBadge tone="green">sales_terminal_options</SourceBadge>} className="" >
        <div className={styles.toolbar}><input className={styles.input} value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher libellé, valeur, clé ou description…" /><select className={styles.select} value={activeArea} onChange={event => setActiveArea(event.target.value)} style={{ maxWidth: 240 }}><option value="all">Tous les domaines</option>{areas.map(area => <option key={area} value={area}>{areaLabels[area]}</option>)}</select></div>
        <div className={styles.recordList}>{visible.length === 0 ? <EmptyState title="Aucune option visible" text="Aucune configuration ne correspond aux filtres actuels." /> : visible.map(item => <article key={item.id} className={styles.recordCard}><div className={styles.recordMain}><div className={styles.recordTitle}><strong>{item.label}</strong><Pill tone={item.is_active !== false ? 'green' : 'red'}>{item.is_active !== false ? 'Active' : 'Inactive'}</Pill><Pill tone="slate">{areaLabels[item.area] || item.area}</Pill></div><div className={styles.recordMeta}><span>Valeur : {item.value}</span><span>Clé : {item.option_key || 'générée'}</span><span>Ordre : {item.sort_order || 0}</span></div><p className={styles.muted}>{item.description || 'Aucune description.'}</p></div><div className={styles.recordActions}><ActionButton tone="light" onClick={() => void toggle(item)}>{item.is_active !== false ? 'Désactiver' : 'Activer'}</ActionButton><ActionButton tone="red" onClick={() => void remove(item)}>Supprimer</ActionButton></div></article>)}</div>
      </Panel>
    </div>
  </AppShell>
}
