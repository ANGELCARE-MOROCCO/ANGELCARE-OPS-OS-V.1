'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Save, X } from 'lucide-react'
import type { RevenueTwinEditableEntity, RevenueTwinMutationInput } from '@/lib/revenue-command-os/types'
import { useDigitalTwin } from './DigitalTwinContext'

type Field = { key: string; label: string; type?: 'text' | 'textarea' | 'number' | 'list' | 'select'; required?: boolean; options?: string[]; placeholder?: string }

const fields: Record<RevenueTwinEditableEntity, Field[]> = {
  'business-unit': [
    { key: 'code', label: 'Code', required: true, placeholder: 'BU-...' }, { key: 'name', label: 'Nom commercial', required: true }, { key: 'tagline', label: 'Promesse / tagline' },
    { key: 'purpose', label: 'Rôle dans le modèle revenus', type: 'textarea', required: true }, { key: 'revenue_model', label: 'Modèle de revenus', type: 'textarea', required: true },
    { key: 'delivery_model', label: 'Modèle de livraison', type: 'textarea', required: true }, { key: 'owner_role', label: 'Rôle propriétaire', required: true },
    { key: 'commercial_priority', label: 'Priorité commerciale', type: 'number' }, { key: 'territories', label: 'Codes territoires', type: 'list' }, { key: 'dependencies', label: 'Dépendances', type: 'list' },
    { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'needs-validation', 'validated', 'active', 'inactive'] },
  ],
  offer: [
    { key: 'code', label: 'Code offre', required: true }, { key: 'business_unit_code', label: 'Business unit', required: true }, { key: 'family', label: 'Famille' },
    { key: 'name', label: 'Nom interne', required: true }, { key: 'commercial_name', label: 'Nom commercial', required: true }, { key: 'customer_problem', label: 'Problème client', type: 'textarea', required: true },
    { key: 'value_proposition', label: 'Proposition de valeur', type: 'textarea', required: true }, { key: 'delivery_formats', label: 'Formats de livraison', type: 'list' },
    { key: 'target_segment_codes', label: 'Segments cibles', type: 'list' }, { key: 'decision_maker_codes', label: 'Décideurs', type: 'list' }, { key: 'territory_codes', label: 'Territoires', type: 'list' },
    { key: 'required_capacity_codes', label: 'Capacités requises', type: 'list' }, { key: 'pricing_model', label: 'Modèle tarifaire' }, { key: 'sales_cycle_days', label: 'Cycle de vente (jours)', type: 'number' },
    { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'needs-validation', 'validated', 'active', 'inactive'] }, { key: 'availability', label: 'Disponibilité', type: 'select', options: ['available', 'conditional', 'unavailable', 'planned'] },
  ],
  bundle: [
    { key: 'code', label: 'Code bundle', required: true }, { key: 'name', label: 'Nom', required: true },
    { key: 'commercial_promise', label: 'Promesse commerciale', type: 'textarea', required: true },
    { key: 'segment_codes', label: 'Segments cibles', type: 'list' }, { key: 'offer_codes', label: 'Offres composantes', type: 'list' },
    { key: 'bundle_type', label: 'Rôle bundle', type: 'select', options: ['entry', 'growth', 'premium', 'retention', 'seasonal'] },
    { key: 'pricing_logic', label: 'Logique tarifaire', type: 'textarea' }, { key: 'protected_margin_pct', label: 'Marge protégée %', type: 'number' },
    { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'needs-validation', 'validated', 'active', 'inactive'] },
  ],
  'offer-relationship': [
    { key: 'code', label: 'Code relation', required: true }, { key: 'source_offer_code', label: 'Offre source', required: true },
    { key: 'target_offer_code', label: 'Offre cible', required: true }, { key: 'relationship_type', label: 'Type', required: true, type: 'select', options: ['prerequisite', 'complement', 'entry', 'premium', 'retention', 'cross-sell', 'upsell'] },
    { key: 'rationale', label: 'Justification', type: 'textarea' }, { key: 'eligibility_rules', label: 'Règles d’éligibilité', type: 'list' },
    { key: 'timing', label: 'Timing recommandé' }, { key: 'priority_score', label: 'Priorité', type: 'number' },
  ],
  segment: [
    { key: 'code', label: 'Code segment', required: true }, { key: 'name', label: 'Nom', required: true }, { key: 'category', label: 'Catégorie' }, { key: 'profile', label: 'Profil', type: 'textarea', required: true },
    { key: 'pain_points', label: 'Douleurs', type: 'list' }, { key: 'buying_triggers', label: 'Déclencheurs d’achat', type: 'list' }, { key: 'trust_requirements', label: 'Exigences de confiance', type: 'list' },
    { key: 'likely_objections', label: 'Objections probables', type: 'list' }, { key: 'preferred_channels', label: 'Canaux préférés', type: 'list' }, { key: 'best_fit_offer_codes', label: 'Offres adaptées', type: 'list' },
    { key: 'commercial_priority', label: 'Priorité', type: 'number' }, { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'needs-validation', 'validated', 'active', 'inactive'] },
  ],
  'decision-maker': [
    { key: 'code', label: 'Code', required: true }, { key: 'role_name', label: 'Rôle décideur', required: true }, { key: 'organization_types', label: 'Types d’organisation', type: 'list' },
    { key: 'authority_level', label: 'Autorité', type: 'select', options: ['influencer', 'recommender', 'co-decider', 'final-decider', 'gatekeeper'] }, { key: 'primary_concerns', label: 'Préoccupations', type: 'list' },
    { key: 'motivations', label: 'Motivations', type: 'list' }, { key: 'required_evidence', label: 'Preuves attendues', type: 'list' }, { key: 'objections', label: 'Objections', type: 'list' },
    { key: 'preferred_style', label: 'Style recommandé', type: 'textarea' }, { key: 'relevant_offer_codes', label: 'Offres pertinentes', type: 'list' }, { key: 'contact_strategy', label: 'Stratégie de contact', type: 'textarea' },
    { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'needs-validation', 'validated', 'active', 'inactive'] },
  ],
  market: [
    { key: 'code', label: 'Code marché', required: true }, { key: 'country', label: 'Pays', required: true }, { key: 'region', label: 'Région' }, { key: 'city', label: 'Ville', required: true }, { key: 'zones', label: 'Zones', type: 'list' },
    { key: 'market_maturity', label: 'Maturité', type: 'select', options: ['emerging', 'developing', 'established', 'strategic'] }, { key: 'priority', label: 'Priorité', type: 'number' },
    { key: 'active_business_unit_codes', label: 'Business units actives', type: 'list' }, { key: 'immediately_deliverable_offer_codes', label: 'Offres livrables', type: 'list' },
    { key: 'conditional_offer_codes', label: 'Offres conditionnelles', type: 'list' }, { key: 'delivery_constraints', label: 'Contraintes', type: 'list' },
    { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'needs-validation', 'validated', 'active', 'inactive'] },
  ],
  capacity: [
    { key: 'code', label: 'Code capacité', required: true }, { key: 'name', label: 'Nom', required: true }, { key: 'capacity_type', label: 'Type', type: 'select', options: ['trainer', 'caregiver', 'commercial', 'operations', 'inventory', 'transport', 'digital', 'venue'] },
    { key: 'unit', label: 'Unité' }, { key: 'available_quantity', label: 'Disponible', type: 'number' }, { key: 'reserved_quantity', label: 'Réservé', type: 'number' }, { key: 'maximum_quantity', label: 'Maximum', type: 'number' },
    { key: 'territory_codes', label: 'Territoires', type: 'list' }, { key: 'offer_codes', label: 'Offres supportées', type: 'list' }, { key: 'lead_time_days', label: 'Lead time (jours)', type: 'number' }, { key: 'constraints', label: 'Contraintes', type: 'list' },
    { key: 'availability', label: 'Disponibilité', type: 'select', options: ['available', 'conditional', 'unavailable', 'planned'] },
  ],
  channel: [{ key: 'code', label: 'Code', required: true }, { key: 'name', label: 'Nom', required: true }, { key: 'channel_type', label: 'Type', required: true }, { key: 'best_for_stages', label: 'Étapes adaptées', type: 'list' }, { key: 'best_for_segments', label: 'Segments adaptés', type: 'list' }, { key: 'governance', label: 'Gouvernance', type: 'textarea' }, { key: 'measurement', label: 'Mesures', type: 'list' }, { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'needs-validation', 'validated', 'active', 'inactive'] }],
  journey: [{ key: 'code', label: 'Code', required: true }, { key: 'name', label: 'Nom', required: true }, { key: 'objective', label: 'Objectif', type: 'textarea' }, { key: 'business_unit_codes', label: 'Business units', type: 'list' }, { key: 'segment_codes', label: 'Segments', type: 'list' }, { key: 'offer_codes', label: 'Offres', type: 'list' }, { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'needs-validation', 'validated', 'active', 'inactive'] }],
  'price-rule': [{ key: 'code', label: 'Code', required: true }, { key: 'offer_code', label: 'Offre', required: true }, { key: 'price_book', label: 'Price book' }, { key: 'pricing_model', label: 'Modèle' }, { key: 'public_price', label: 'Prix public', type: 'number' }, { key: 'partner_price', label: 'Prix partenaire', type: 'number' }, { key: 'internal_cost', label: 'Coût interne', type: 'number' }, { key: 'minimum_protected_price', label: 'Prix minimum protégé', type: 'number' }, { key: 'target_margin_pct', label: 'Marge cible %', type: 'number' }, { key: 'max_discount_pct', label: 'Remise max %', type: 'number' }, { key: 'approval_role', label: 'Autorité', required: true }, { key: 'effective_from', label: 'Date effet' }, { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'needs-validation', 'validated', 'active', 'inactive'] }],
  'seasonal-window': [{ key: 'code', label: 'Code', required: true }, { key: 'name', label: 'Nom', required: true }, { key: 'start_month_day', label: 'Début MM-JJ' }, { key: 'end_month_day', label: 'Fin MM-JJ' }, { key: 'segment_codes', label: 'Segments', type: 'list' }, { key: 'offer_codes', label: 'Offres', type: 'list' }, { key: 'opportunity', label: 'Opportunité', type: 'textarea' }, { key: 'urgency', label: 'Urgence', type: 'select', options: ['low', 'medium', 'high', 'critical'] }, { key: 'preparation_lead_days', label: 'Préparation jours', type: 'number' }, { key: 'risk_of_delay', label: 'Risque du retard', type: 'textarea' }, { key: 'recommended_actions', label: 'Actions recommandées', type: 'list' }, { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'needs-validation', 'validated', 'active', 'inactive'] }],
  'growth-path': [{ key: 'code', label: 'Code', required: true }, { key: 'path_type', label: 'Type', type: 'select', options: ['cross-sell', 'upsell', 'renewal', 'referral'] }, { key: 'source_offer_code', label: 'Offre source', required: true }, { key: 'destination_offer_code', label: 'Offre destination', required: true }, { key: 'trigger_signals', label: 'Signaux', type: 'list' }, { key: 'eligibility_rules', label: 'Éligibilité', type: 'list' }, { key: 'recommended_timing', label: 'Timing' }, { key: 'rationale', label: 'Rationale', type: 'textarea' }, { key: 'priority_score', label: 'Priorité', type: 'number' }, { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'needs-validation', 'validated', 'active', 'inactive'] }],
  dependency: [{ key: 'code', label: 'Code', required: true }, { key: 'source_type', label: 'Type source' }, { key: 'source_code', label: 'Code source', required: true }, { key: 'dependency_type', label: 'Type dépendance', required: true }, { key: 'target_type', label: 'Type cible' }, { key: 'target_code', label: 'Code cible', required: true }, { key: 'rule', label: 'Règle', type: 'textarea' }, { key: 'failure_effect', label: 'Effet en cas d’échec', type: 'textarea' }, { key: 'recovery_action', label: 'Action de récupération', type: 'textarea' }],
}

function toInitial(entity: RevenueTwinEditableEntity, item?: Record<string, unknown>) {
  const next: Record<string, string> = {}
  for (const field of fields[entity]) {
    const value = item?.[field.key]
    next[field.key] = Array.isArray(value) ? value.join(', ') : value == null ? '' : String(value)
  }
  if (!next.status && fields[entity].some((field) => field.key === 'status')) next.status = 'needs-validation'
  return next
}

export default function DigitalTwinEntityDrawer({ entity, item, onClose }: { entity: RevenueTwinEditableEntity | null; item?: Record<string, unknown>; onClose: () => void }) {
  const { mutate, busy } = useDigitalTwin()
  const definition = entity ? fields[entity] : []
  const [form, setForm] = useState<Record<string, string>>({})
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => { if (entity) setForm(toInitial(entity, item)) }, [entity, item])
  const title = useMemo(() => item ? 'Modifier l’objet commercial' : 'Créer un objet commercial', [item])
  if (!entity) return null
  const activeEntity: RevenueTwinEditableEntity = entity

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLocalError(null)
    const missing = definition.find((field) => field.required && !form[field.key]?.trim())
    if (missing) { setLocalError(`${missing.label} est requis.`); return }
    const payload: Record<string, unknown> = {}
    for (const field of definition) {
      const raw = form[field.key]?.trim() || ''
      if (!raw) continue
      payload[field.key] = field.type === 'list' ? raw.split(',').map((part) => part.trim()).filter(Boolean) : field.type === 'number' ? Number(raw) : raw
    }
    try {
      const input: RevenueTwinMutationInput = { entity: activeEntity, operation: item ? 'update' : 'create', id: item?.id ? String(item.id) : undefined, payload }
      await mutate(input); onClose()
    } catch (error) { setLocalError(error instanceof Error ? error.message : 'Enregistrement impossible.') }
  }

  return (
    <div className="fixed inset-0 z-[150] flex justify-end bg-slate-950/35 backdrop-blur-sm" role="dialog" aria-modal="true">
      <form onSubmit={submit} className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-[-24px_0_80px_rgba(15,23,42,.22)]">
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-700">Digital Twin Studio</p><h2 className="mt-1 text-2xl font-black text-slate-950">{title}</h2><p className="mt-1 text-xs text-slate-500">Objet: {activeEntity}. Toute mutation est validée, auditée et versionnable.</p></div>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><X size={18} /></button>
        </header>
        <div className="grid gap-4 px-6 py-6 sm:grid-cols-2">
          {definition.map((field) => <label key={field.key} className={field.type === 'textarea' || field.type === 'list' ? 'sm:col-span-2' : ''}>
            <span className="mb-2 block text-[10px] font-black uppercase tracking-[.13em] text-slate-500">{field.label}{field.required ? ' *' : ''}</span>
            {field.type === 'textarea' ? <textarea rows={3} value={form[field.key] || ''} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50" /> : field.type === 'select' ? <select value={form[field.key] || field.options?.[0] || ''} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50">{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input type={field.type === 'number' ? 'number' : 'text'} value={form[field.key] || ''} placeholder={field.placeholder || (field.type === 'list' ? 'Valeurs séparées par des virgules' : '')} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50" />}
          </label>)}
        </div>
        {localError ? <div className="mx-6 mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{localError}</div> : null}
        <footer className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700">Annuler</button>
          <button disabled={busy} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/15 disabled:opacity-60">{busy ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />} Enregistrer</button>
        </footer>
      </form>
    </div>
  )
}
