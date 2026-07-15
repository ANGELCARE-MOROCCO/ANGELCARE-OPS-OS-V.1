'use client'

const normalizePhase13Status = (value: unknown) => {
  if (value === "active" || value === "inactive" || value === "archived" || value === "draft") {
    return value
  }
  return "active"
}


import { useMemo, useState } from 'react'
import type { InterventionsState } from '@/lib/interventions/types'
import type { InterventionModalKey } from '@/lib/interventions/enterprise-config'
import { formatMad, formatDateFr } from '@/lib/interventions/format'
import {
  PHASE13_ADMIN_GUARDS,
  PHASE13_CONFIG_TABS,
  PHASE13_CONFIG_WRITE_TARGETS,
  PHASE13_DEFAULT_CONFIG_ITEMS,
  buildConfigurationAuditRows,
  buildModalDynamicOptionCoverage,
  buildPhase13ConfigurationScore,
  type ConfigScope,
  type InterventionConfigItem,
} from '@/lib/interventions/phase13-configuration-control'

type Props = {
  state: InterventionsState
  open: (key: InterventionModalKey, entityId?: string, entityType?: string) => void
}

type ConfigDraft = Record<string, string | number | boolean>

const NEW_ITEM_TEMPLATE: Record<ConfigScope, ConfigDraft> = {
  cities: { label: 'Nouvelle ville', region: 'Rabat-Salé-Kénitra', defaultSla: 120, travelBuffer: 25, active: true },
  regions: { label: 'Nouvelle région', manager: 'Manager Opérations', coverage: 'Couverture à définir', active: true },
  zones: { label: 'Nouvelle zone', city: 'Rabat', priority: 'Normale', travelBuffer: 25 },
  'service-types': { label: 'Nouvelle intervention', category: 'Médecin', requiredRole: 'Médecin', duration: 45, basePriceMad: 450, riskDefault: 'Modéré' },
  'service-categories': { label: 'Nouvelle catégorie', active: true },
  'pricing-rules': { label: 'Nouveau tarif', serviceType: 'Consultation médicale à domicile', basePriceMad: 450, urgencySurchargeMad: 0, nightSurchargeMad: 0, maxDiscountMad: 0 },
  'staff-roles': { label: 'Nouveau rôle', canDispatch: false, canBill: false, assignedOnly: true },
  'staff-skills': { label: 'Nouvelle compétence', roleFamily: 'Infirmier', requiresDocument: false },
  'workflow-statuses': { label: 'Nouveau statut', color: 'cyan', final: false, requiresReason: false, requiresReport: false },
  'sla-rules': { label: 'Nouvelle règle SLA', serviceType: 'Médecin', risk: 'Modéré', targetMinutes: 180, escalationOwner: 'Manager Opérations' },
  checklists: { label: 'Nouvelle checklist', serviceType: 'Consultation', required: true, blocksCompletion: true },
  documents: { label: 'Nouveau document', requiredBefore: 'Dispatch', serviceFamily: 'Médecin' },
  'equipment-types': { label: 'Nouveau matériel', category: 'Matériel médical', depositMad: 0, maintenanceDays: 90 },
  'equipment-statuses': { label: 'Nouveau statut équipement', active: true },
  'modal-options': { label: 'Nouvelle option', targetModal: 'RequestIntakeModal', optionGroup: 'source', active: true },
  'cancellation-reasons': { label: 'Patient indisponible', active: true },
  'escalation-reasons': { label: 'Risque médical élevé', active: true },
  'payment-methods': { label: 'Espèces', requiresReceipt: true, cashClosure: true },
  'report-templates': { label: 'Nouveau modèle', usage: 'Bureau', active: true },
  'permission-rules': { label: 'Nouvelle permission', role: 'Coordinateur Dispatch', page: 'interventions', canView: true, canMutate: true, assignedOnly: false },
}

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

function makeItem(scope: ConfigScope, draft: ConfigDraft, index: number): InterventionConfigItem {
  const label = String(draft.label || `Configuration ${index + 1}`)
  const metadata = { ...draft }
  delete metadata.label
  return {
    id: `cfg-custom-${scope}-${Date.now()}-${index}`,
    scope,
    label,
    code: slugify(label),
    status: draft.active === false ? 'Inactif' : 'Actif',
    sortOrder: index + 1,
    ownerRole: scope.includes('pricing') || scope.includes('payment') ? 'Finance' : scope.includes('permission') ? 'Direction / CEO' : 'Manager Opérations',
    updatedAt: new Date().toISOString(),
    description: `${label} administré depuis le Configuration Center sans rebuild développeur.`,
    impacts: scope.includes('pricing') ? ['billing'] : scope.includes('permission') ? ['rbac'] : scope.includes('sla') ? ['sla'] : scope.includes('equipment') ? ['equipment'] : ['modal', 'dispatch'],
    auditEvent: 'settings changed',
    metadata: metadata as InterventionConfigItem['metadata'],
  }
}

function ConfigMetric({ label, value, detail, tone = 'cyan' }: { label: string; value: string | number; detail: string; tone?: 'cyan' | 'emerald' | 'amber' | 'rose' }) {
  const cls = tone === 'emerald' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : tone === 'amber' ? 'border-amber-200 bg-amber-50 text-amber-900' : tone === 'rose' ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-cyan-200 bg-cyan-50 text-cyan-900'
  return <div className={`rounded-[24px] border p-4 ${cls}`}><p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">{label}</p><p className="mt-2 text-2xl font-black tracking-tight">{value}</p><p className="mt-1 text-xs font-bold opacity-75">{detail}</p></div>
}

function FieldEditor({ field, value, onChange }: { field: any; value: any; onChange: (value: string | number | boolean) => void }) {
  const label = <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{field.label}{field.required ? ' *' : ''}</span>
  if (field.kind === 'toggle') return <label className="rounded-2xl border border-slate-200 bg-white p-3"><div className="flex items-center justify-between gap-3">{label}<button type="button" onClick={() => onChange(!value)} className={`rounded-full px-3 py-1 text-xs font-black ${value ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>{value ? 'Actif' : 'Inactif'}</button></div></label>
  if (field.kind === 'select') return <label className="rounded-2xl border border-slate-200 bg-white p-3">{label}<select value={String(value || field.options?.[0] || '')} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-cyan-500"><option value="">Sélectionner</option>{field.options?.map((option: string) => <option key={option}>{option}</option>)}</select></label>
  if (field.kind === 'textarea') return <label className="rounded-2xl border border-slate-200 bg-white p-3 md:col-span-2">{label}<textarea value={String(value || '')} onChange={(event) => onChange(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-cyan-500" /></label>
  const type = ['money','number','minutes'].includes(field.kind) ? 'number' : 'text'
  return <label className="rounded-2xl border border-slate-200 bg-white p-3">{label}<input type={type} value={String(value ?? '')} onChange={(event) => onChange(type === 'number' ? Number(event.target.value) : event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-cyan-500" /></label>
}

function ConfigRow({ item, onEdit, onArchive, onDuplicate }: { item: InterventionConfigItem; onEdit: (item: InterventionConfigItem) => void; onArchive: (item: InterventionConfigItem) => void; onDuplicate: (item: InterventionConfigItem) => void }) {
  const statusCls = item.status === 'Actif' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : item.status === 'Archivé' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-amber-50 text-amber-800 border-amber-200'
  return <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2"><p className="text-lg font-black text-slate-950">{item.label}</p><span className={`rounded-full border px-2 py-1 text-[10px] font-black ${statusCls}`}>{item.status}</span><span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-1 text-[10px] font-black text-cyan-800">{item.scope}</span></div>
        <p className="mt-1 text-sm font-semibold leading-5 text-slate-600">{item.description}</p>
        <div className="mt-3 flex flex-wrap gap-1">{item.impacts.map(impact => <span key={impact} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black text-slate-600">{impact}</span>)}</div>
      </div>
      <div className="flex flex-wrap gap-2"><button onClick={() => onEdit(item)} className="rounded-2xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-800">Éditer</button><button onClick={() => onDuplicate(item)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">Dupliquer</button><button onClick={() => onArchive(item)} className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">Archiver</button></div>
    </div>
    <div className="mt-3 grid gap-2 md:grid-cols-3">{Object.entries(item.metadata).slice(0, 6).map(([key, value]) => <div key={key} className="rounded-2xl border border-slate-100 bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{key}</p><p className="mt-1 truncate text-sm font-black text-slate-700">{Array.isArray(value) ? value.join(', ') : String(value)}</p></div>)}</div>
  </div>
}

function ConfigEditorModal({ item, scope, onClose, onSave }: { item?: InterventionConfigItem | null; scope: ConfigScope; onClose: () => void; onSave: (scope: ConfigScope, draft: ConfigDraft, existing?: InterventionConfigItem | null) => void }) {
  const tab = PHASE13_CONFIG_TABS.find(t => t.key === scope) || PHASE13_CONFIG_TABS[0]
  const [draft, setDraft] = useState<ConfigDraft>(() => item ? { label: item.label, ...item.metadata, active: item.status === 'Actif' } : NEW_ITEM_TEMPLATE[scope])
  function setField(key: string, value: string | number | boolean) { setDraft(current => ({ ...current, [key]: value })) }
  return <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-xl"><div className="max-h-[92vh] w-[min(1180px,100%)] overflow-auto rounded-[34px] border border-slate-200 bg-white shadow-[0_40px_120px_rgba(15,23,42,.28)]">
    <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 p-6 backdrop-blur"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-700">Phase 13 • no-code configuration • {scope}</p><h2 className="mt-2 text-3xl font-black text-slate-950">{item ? 'Éditer configuration' : tab.primaryAction}</h2><p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">{tab.subtitle}</p></div><button onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">Fermer</button></div></div>
    <div className="p-6"><div className="grid gap-3 md:grid-cols-2">{tab.fields.map(field => <FieldEditor key={field.key} field={field} value={draft[field.key]} onChange={(value) => setField(field.key, value)} />)}</div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3"><div className="rounded-[24px] border border-cyan-200 bg-cyan-50 p-4"><p className="text-xs font-black uppercase tracking-wider text-cyan-700">Écriture</p><p className="mt-2 text-sm font-black text-cyan-950">{PHASE13_CONFIG_WRITE_TARGETS[scope]}</p></div><div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-black uppercase tracking-wider text-emerald-700">Consommateurs dynamiques</p><p className="mt-2 text-sm font-black text-emerald-950">{tab.dynamicConsumers.join(' • ')}</p></div><div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-black uppercase tracking-wider text-amber-700">Audit</p><p className="mt-2 text-sm font-black text-amber-950">settings changed + historique configuration</p></div></div>
      <div className="mt-6 flex flex-wrap justify-end gap-2"><button onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">Annuler</button><button onClick={() => onSave(scope, draft, item)} className="rounded-2xl border border-cyan-700 bg-cyan-700 px-5 py-3 text-sm font-black text-white">{item ? 'Enregistrer modification' : 'Créer configuration'}</button></div>
    </div>
  </div></div>
}

export default function Phase13ConfigurationCenter({ state, open }: Props) {
  const [items, setItems] = useState<InterventionConfigItem[]>(PHASE13_DEFAULT_CONFIG_ITEMS)
  const [activeScope, setActiveScope] = useState<ConfigScope>('cities')
  const [query, setQuery] = useState('')
  const [editor, setEditor] = useState<{ scope: ConfigScope; item?: InterventionConfigItem | null } | null>(null)
  const score = useMemo(() => buildPhase13ConfigurationScore(items), [items])
  const coverage = useMemo(() => buildModalDynamicOptionCoverage(items), [items])
  const auditRows = useMemo(() => buildConfigurationAuditRows(items), [items])
  const activeTab = PHASE13_CONFIG_TABS.find(tab => tab.key === activeScope) || PHASE13_CONFIG_TABS[0]
  const filtered = items.filter(item => item.scope === activeScope && `${item.label} ${item.description} ${item.code}`.toLowerCase().includes(query.toLowerCase()))

  async function syncConfig(action: string, item: InterventionConfigItem) {
    try { await fetch(`/api/interventions/config/${item.scope}`, { method: action === 'archive' ? 'DELETE' : item.id.includes('custom') && action === 'create' ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, item }) }) } catch {}
  }
  function save(scope: ConfigScope, draft: ConfigDraft, existing?: InterventionConfigItem | null) {
    if (existing) {
      const updated: InterventionConfigItem = {
        ...existing,
        label: String(draft.label || existing.label),
        status: normalizePhase13Status(draft.status || existing.status) as InterventionConfigItem["status"],
        metadata: (draft.metadata || existing.metadata) as InterventionConfigItem["metadata"],
        updatedAt: new Date().toISOString(),
      }
      setItems(current => current.map(item => item.id === existing.id ? updated : item))
      syncConfig('update', updated)
    } else {
      const created = makeItem(scope, draft, items.length)
      setItems(current => [created, ...current])
      syncConfig('create', created)
    }
    setEditor(null)
  }
  function archive(item: InterventionConfigItem) {
    const archived = { ...item, status: 'Archivé' as const, updatedAt: new Date().toISOString() }
    setItems(current => current.map(row => row.id === item.id ? archived : row))
    syncConfig('archive', archived)
  }
  function duplicate(item: InterventionConfigItem) {
    const copy = { ...item, id: `cfg-copy-${Date.now()}`, label: `${item.label} copie`, code: `${item.code}_copy`, status: 'Brouillon' as const, updatedAt: new Date().toISOString() }
    setItems(current => [copy, ...current])
    syncConfig('duplicate', copy)
  }

  return <section className="space-y-5" id="phase13-configuration-center">
    <div className="rounded-[34px] border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-6 shadow-sm">
      <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <div><p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-700">Mega Phase 13 • Configuration Freedom / No-Code Admin Control</p><h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Centre de configuration libre AngelCare</h2><p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-600">Les villes, régions, zones, types d’intervention, tarifs MAD, SLA, rôles, statuts, checklists, documents, équipements, options modales et permissions deviennent configurables sans développement. Chaque changement écrit une configuration et un audit.</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => setEditor({ scope: activeScope })} className="rounded-2xl border border-cyan-700 bg-cyan-700 px-4 py-3 text-sm font-black text-white">Ajouter dans {activeTab.title}</button><button onClick={() => open(activeTab.modalKey)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800">Ouvrir modal liée</button><button onClick={() => open('PermissionMatrixModal')} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800">Contrôler RBAC</button></div></div>
        <div className="grid gap-3 sm:grid-cols-2"><ConfigMetric label="Score liberté" value={`${score.score}%`} detail={score.label} tone="emerald"/><ConfigMetric label="Scopes éditables" value={score.editableScopes} detail="familles configuration"/><ConfigMetric label="Options modales" value={score.modalDynamic} detail="sources dynamiques"/><ConfigMetric label="Audit config" value={score.audited} detail="événements settings changed" tone="amber"/></div>
      </div>
    </div>

    <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
      <aside className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm"><p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Familles configurables</p><div className="space-y-2">{PHASE13_CONFIG_TABS.map(tab => { const count = items.filter(item => item.scope === tab.key && item.status !== 'Archivé').length; const active = activeScope === tab.key; return <button key={tab.key} onClick={() => setActiveScope(tab.key)} className={`w-full rounded-2xl border p-3 text-left transition ${active ? 'border-cyan-300 bg-cyan-50 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}><div className="flex items-center justify-between gap-2"><span className="font-black text-slate-900">{tab.icon} {tab.title}</span><span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-600">{count}</span></div><p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{tab.subtitle}</p></button> })}</div></aside>
      <main className="space-y-4">
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-700">{activeTab.icon} {activeTab.key}</p><h3 className="mt-1 text-3xl font-black text-slate-950">{activeTab.title}</h3><p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-600">{activeTab.subtitle}</p></div><div className="flex flex-wrap gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher configuration..." className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-500"/><button onClick={() => setEditor({ scope: activeScope })} className="rounded-2xl border border-cyan-700 bg-cyan-700 px-4 py-3 text-sm font-black text-white">{activeTab.primaryAction}</button></div></div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">{activeTab.controls.map(control => <div key={control} className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-black text-emerald-900">✓ {control}</div>)}</div>
          <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50 p-3"><p className="text-xs font-black uppercase tracking-wider text-cyan-700">Consommateurs dynamiques</p><p className="mt-1 text-sm font-black text-cyan-950">{activeTab.dynamicConsumers.join(' • ')}</p></div>
        </div>
        <div className="space-y-3">{filtered.length ? filtered.map(item => <ConfigRow key={item.id} item={item} onEdit={(row) => setEditor({ scope: row.scope, item: row })} onArchive={archive} onDuplicate={duplicate}/>) : <div className="rounded-[30px] border border-dashed border-slate-300 bg-white p-10 text-center"><p className="text-2xl font-black text-slate-950">{activeTab.emptyLabel}</p><p className="mt-2 font-semibold text-slate-500">Ajoutez une configuration pour éviter toute option figée dans le code.</p><button onClick={() => setEditor({ scope: activeScope })} className="mt-4 rounded-2xl border border-cyan-700 bg-cyan-700 px-4 py-3 text-sm font-black text-white">{activeTab.primaryAction}</button></div>}</div>
      </main>
    </div>

    <div className="grid gap-4 xl:grid-cols-3">
      <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Garde-fous production</p><div className="mt-4 space-y-2">{PHASE13_ADMIN_GUARDS.map(guard => <div key={guard} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm font-bold text-slate-700">✓ {guard}</div>)}</div></div>
      <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Couverture options dynamiques</p><div className="mt-4 space-y-2">{coverage.slice(0, 8).map(row => <div key={row.id} className="rounded-2xl border border-cyan-100 bg-cyan-50 p-3"><div className="flex items-center justify-between gap-2"><b className="text-sm text-cyan-950">{row.modal}</b><span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-cyan-700">{row.status}</span></div><p className="mt-1 text-xs font-bold text-cyan-800">{row.dynamicSources.join(' • ')}</p></div>)}</div></div>
      <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Audit configuration</p><div className="mt-4 space-y-2">{auditRows.slice(0, 8).map(row => <div key={row.id} className="rounded-2xl border border-amber-100 bg-amber-50 p-3"><div className="flex items-center justify-between gap-2"><b className="text-sm text-amber-950">{row.scope}</b><span className="text-[10px] font-black text-amber-700">{formatDateFr(row.at)}</span></div><p className="mt-1 text-xs font-bold text-amber-800">{row.summary}</p></div>)}</div></div>
    </div>
    {editor && <ConfigEditorModal scope={editor.scope} item={editor.item} onClose={() => setEditor(null)} onSave={save}/>} 
  </section>
}
