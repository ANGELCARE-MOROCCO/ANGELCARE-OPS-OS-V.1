export type Bulk8View =
  | 'command' | 'commands' | 'skills' | 'schedules' | 'missions' | 'runs'
  | 'learning' | 'doctrine' | 'settings' | 'autopilot' | 'compiler' | 'queue'
  | 'decisions' | 'integrations' | 'repository' | 'recovery'

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

export const authorityLabels: Record<string,string> = {
  observe: 'Observation seulement', advise: 'Conseil gouverné', prepare: 'Préparation interne',
  orchestrate_internal: 'Orchestration interne', human_governed: 'Gouvernance humaine',
  advisory: 'Conseil uniquement', internal_autopilot: 'Autopilot interne borné',
}

export const statusLabels: Record<string,string> = {
  draft:'Brouillon', active:'Actif', paused:'Suspendu', retired:'Retiré', approved:'Approuvé',
  awaiting_decision:'Décision requise', awaiting_approval:'Autorité requise', queued:'En file', claimed:'Réservé',
  running:'En exécution', executing:'En exécution', retry_scheduled:'Reprise planifiée', completed:'Terminé',
  needs_review:'Revue humaine', failed:'Échec', blocked:'Bloqué', cancelled:'Annulé', dead_letter:'Quarantaine',
  proposed:'Proposé', effective:'Effectif', superseded:'Supplanté', expired:'Expiré', materialized:'Matérialisé',
  linked:'Lié', connected:'Connecté', partial:'Partiel', unavailable:'Indisponible', provisional:'Provisoire',
  accepted:'Accepté', accepted_with_limitations:'Accepté avec limites', rejected:'Rejeté', under_review:'En revue',
}

export function toneFor(value:string):Tone {
  if(['active','approved','completed','effective','materialized','linked','connected','accepted'].includes(value)) return 'success'
  if(['failed','blocked','cancelled','dead_letter','unavailable','rejected'].includes(value)) return 'danger'
  if(['awaiting_decision','awaiting_approval','retry_scheduled','partial','needs_review','provisional','under_review','accepted_with_limitations'].includes(value)) return 'warning'
  if(['running','executing','queued','claimed'].includes(value)) return 'info'
  return 'neutral'
}

export function dateTime(value:unknown){
  if(!value) return 'Non enregistré'
  const d=new Date(String(value)); return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('fr-FR')
}

export function shortId(value:unknown){ const text=String(value||''); return text ? text.slice(0,10) : '—' }
export function text(value:unknown,fallback='Non exposé'){ return value===null||value===undefined||value===''?fallback:String(value) }
export function list(value:unknown):string[]{ return Array.isArray(value)?value.map(String):[] }
export function object(value:unknown):Record<string,unknown>{ return value && typeof value==='object' && !Array.isArray(value) ? value as Record<string,unknown> : {} }
