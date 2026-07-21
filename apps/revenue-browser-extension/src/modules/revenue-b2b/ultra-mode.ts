export type UltraWorkspaceState = {
  launchpad?: any
  journey?: any
  quality?: any
  bridge?: any
  ai?: any
  scheduler?: any
  loading?: string | null
}

type Helpers = { esc(value: unknown): string; dt(value: unknown): string }

function stepClass(step: any) { return step.complete ? 'complete' : step.current ? 'current' : 'blocked' }

export function renderGuidedJourney(state: UltraWorkspaceState, helpers: Helpers) {
  const { esc } = helpers
  const data = state.journey
  if (!data) return `<section class="b2b-empty"><h2>Parcours revenu guidé</h2><p>Chargez les exigences réelles du compte pour voir l’étape active, les preuves manquantes, les blocages et la prochaine action.</p><button data-ultra-action="load-journey" class="b2b-primary">Charger le parcours</button></section>`
  const groups = Object.entries(data.journeys || {}) as Array<[string, any[]]>
  return `<section class="b2b-command ultra-journey"><article class="ultra-reality-hero"><div><span class="b2b-kicker">GUIDED REVENUE JOURNEY</span><h2>${esc(String(data.activeJourney || 'prospect').toUpperCase())}</h2><p>Étape active: ${esc(data.currentStep?.label || 'Parcours terminé')} · les étapes sont calculées depuis les données persistées, pas depuis des cartes statiques.</p></div><button data-ultra-action="load-journey">Actualiser</button></article>
  ${groups.map(([key, steps]) => `<article class="b2b-panel ultra-journey-group"><div class="b2b-panel-head"><strong>${esc(key)}</strong><span>${steps.filter((step) => step.complete).length}/${steps.length}</span></div><div class="ultra-step-track">${steps.map((step) => `<div class="${stepClass(step)}"><span>${step.index}</span><section><strong>${esc(step.label)}</strong><small>${step.complete ? 'Preuve/prérequis présent' : step.current ? 'Action requise maintenant' : 'Bloqué par une étape précédente'}</small></section></div>`).join('')}</div></article>`).join('')}
  <article class="b2b-panel"><div class="b2b-panel-head"><strong>Blocages réels</strong><span>${data.blockers?.length || 0}</span></div>${(data.blockers || []).map((row: any) => `<div class="ultra-blocker"><strong>${esc(row.label)}</strong><small>${esc(row.blocker || 'Prérequis manquant')}</small></div>`).join('') || '<p>Aucun blocage immédiat.</p>'}</article></section>`
}

export function renderDataQuality(state: UltraWorkspaceState, helpers: Helpers) {
  const { esc, dt } = helpers
  const data = state.quality
  if (!data) return `<section class="b2b-empty"><h2>Data Quality Command</h2><p>Détectez doublons, propriétaires ou territoires manquants, actions absentes, décideurs incomplets, contacts invalides, faux won, paiements non vérifiés et ruptures Partner 360.</p><button data-ultra-action="scan-quality" class="b2b-primary">Scanner la qualité</button></section>`
  return `<section class="b2b-command ultra-quality"><article class="ultra-reality-hero"><div><span class="b2b-kicker">DATA QUALITY COMMAND</span><h2>${data.summary?.total || 0} anomalies gouvernées</h2><p>${data.summary?.critical || 0} critiques · ${data.summary?.high || 0} hautes · détectées ${esc(dt(data.generatedAt))}</p></div><button data-ultra-action="scan-quality">Actualiser</button></article><div class="ultra-quality-list">${(data.issues || []).map((row: any) => `<article class="severity-${esc(row.severity)}"><header><span>${esc(row.severity)}</span><strong>${esc(row.category)}</strong></header><h3>${esc(row.title)}</h3><p>${esc(row.suggested_correction || row.suggestedCorrection || 'Correction manuelle requise.')}</p><small>${esc(row.status)} · owner ${esc(row.owner_id || 'à attribuer')}</small>${row.id ? `<button data-quality-resolve="${esc(row.id)}">Marquer résolu avec preuve</button>` : ''}</article>`).join('') || '<p>Aucune anomalie détectée dans le scope chargé.</p>'}</div></section>`
}

export function renderRealityCommand(state: UltraWorkspaceState, helpers: Helpers) {
  const { esc, dt } = helpers
  const bridge = state.bridge
  const ai = state.ai?.result || state.ai
  const scheduler = state.scheduler
  const control = scheduler?.control || null
  return `<section class="b2b-command ultra-reality-command"><article class="ultra-reality-hero"><div><span class="b2b-kicker">ULTRA REALITY COMMAND</span><h2>Données, preuves, IA et production</h2><p>Cette vue distingue l’assignation, la disponibilité réelle, les données manquantes et l’acceptation live.</p></div><div class="b2b-actions"><button data-ultra-action="load-bridge">État du bridge</button><button data-ultra-action="load-scheduler">Scheduler</button><button data-ultra-action="run-ai" class="b2b-primary">Raisonner avec preuves</button></div></article>
  ${bridge ? `<article class="b2b-panel"><div class="b2b-panel-head"><strong>Canonical Commercial Bridge</strong><span>${esc(dt(bridge.generatedAt))}</span></div><div class="b2b-grid"><article><span>Mappings</span><strong>${bridge.mappings?.active || 0}</strong></article><article><span>À revoir</span><strong>${bridge.mappings?.review || 0}</strong></article><article><span>Conflits</span><strong>${bridge.conflicts?.unresolved || 0}</strong></article><article><span>Dernier run</span><strong>${esc(bridge.latestRun?.status || 'non exécuté')}</strong></article></div>${(bridge.diagnostics || []).filter((row: any) => !row.ok).map((row: any) => `<div class="b2b-alert warning"><strong>${esc(row.table)}</strong><span>${esc(row.error)}</span></div>`).join('')}</article>` : '<article class="b2b-panel"><p>Chargez l’état du bridge pour vérifier les sources réelles, mappings et conflits.</p></article>'}
  ${scheduler ? `<article class="b2b-panel"><div class="b2b-panel-head"><strong>Production Automation Scheduler</strong><span>${control?.kill_switch ? 'KILL SWITCH' : control?.paused ? 'PAUSED' : 'RUNNING'}</span></div><div class="b2b-grid"><article><span>Queued</span><strong>${scheduler.queue?.queued || 0}</strong></article><article><span>Running</span><strong>${scheduler.queue?.running || 0}</strong></article><article><span>Failed</span><strong>${scheduler.queue?.failed || 0}</strong></article><article><span>Completed</span><strong>${scheduler.queue?.completed || 0}</strong></article></div><p>${esc(control?.reason || 'Aucune raison de contrôle enregistrée.')}</p><div class="b2b-actions"><button data-ultra-action="scheduler-pause">Pause</button><button data-ultra-action="scheduler-resume" class="b2b-primary">Reprendre</button><button data-ultra-action="scheduler-kill">Kill switch</button><button data-ultra-action="scheduler-clear-kill">Lever le kill switch</button><button data-ultra-action="scheduler-enqueue-quality">Planifier contrôle qualité</button></div><div class="b2b-alert warning"><strong>Human control</strong><span>Messages externes, remises, contrats, paiements, won et activation partenaire ne sont jamais automatisés.</span></div></article>` : `<article class="b2b-panel"><p>Chargez le scheduler pour voir les verrous, la file, les échecs, les exécutions et les contrôles de production.</p></article>`}
  ${ai ? `<article class="b2b-panel"><div class="b2b-panel-head"><strong>${ai.mode === 'governed_ai' ? 'IA gouvernée evidence-bound' : 'Moteur de règles explicable'}</strong><span>${esc(ai.model || ai.warning || 'fallback')}</span></div><p>${esc(ai.summary)}</p><div class="ultra-finding-list">${(ai.findings || []).map((row: any) => `<div><span>${esc(row.classification)}</span><strong>${esc(row.title)}</strong><p>${esc(row.rationale)}</p><small>${Math.round(Number(row.confidence || 0) * 100)}% · preuves ${esc((row.evidenceIds || []).join(', ') || 'manquantes')}</small></div>`).join('')}</div><div class="b2b-alert warning"><strong>Truth boundary</strong><span>Une conclusion IA n’est jamais une preuve vérifiée automatiquement.</span></div></article>` : ''}</section>`
}
