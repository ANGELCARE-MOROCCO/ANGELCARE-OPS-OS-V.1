export type ScannerWorkspaceState = {
  mode?: 'quick' | 'deep' | 'strategic'
  scan?: any
  searching?: boolean
  searchQuery?: string
  searchResults?: any[]
  recentAccounts?: any[]
  totalAuthorized?: number
  progress?: { stage: string; completed: number; total: number; detail?: string }
}

type Helpers = { esc(value: unknown): string; money(value: unknown): string }

function percent(value: unknown) { return `${Math.round(Number(value || 0))}%` }
function safeHost(value: unknown) { try { return new URL(String(value || '')).hostname || 'source' } catch { return 'source' } }
function scanStatus(scan: any) {
  if (!scan) return 'Aucun scan actif'
  if (scan.status === 'partial') return 'Scan partiel — revue requise'
  if (scan.status === 'review_required') return 'Résultats prêts à valider'
  if (scan.status === 'failed') return 'Scan interrompu'
  return String(scan.status || 'en cours').replaceAll('_', ' ')
}

export function renderScannerWorkspace(input: {
  scanner: ScannerWorkspaceState
  activeAccount?: any | null
  analysis?: any
  context?: any
  canCreate: boolean
  canEnrich: boolean
  canPlan: boolean
  canOpportunity: boolean
  helpers: Helpers
}) {
  const { scanner, activeAccount, helpers: { esc, money } } = input
  const scan = scanner.scan
  const org = scan?.context?.organization || input.context?.organization || {}
  const topMatch = scan?.matches?.[0]
  const quality = scan?.quality || {}
  const progress = scanner.progress
  const results = scanner.searchResults || []
  const recent = scanner.recentAccounts || []
  return `<section class="scanner-command-center">
    <article class="scanner-launch-hero">
      <div><span class="scanner-kicker">ANGELCARE REVENUE INTELLIGENCE SCANNER 2.0</span><h2>${activeAccount ? esc(activeAccount.name) : 'Transformer le navigateur en moteur de revenus'}</h2><p>${activeAccount ? 'Compte actif synchronisé. Lancez un nouveau scan pour actualiser les preuves ou continuez l’exécution.' : 'Détectez l’organisation, recherchez les doublons, rassemblez les preuves, identifiez les décideurs et convertissez le résultat en Account 360 exploitable.'}</p></div>
      <div class="scanner-readiness"><strong>${scan ? percent(quality.overallResearchCompleteness) : 'READY'}</strong><span>${scan ? 'complétude recherche' : 'scanner gouverné'}</span></div>
    </article>

    <div class="scanner-entry-grid">
      <article class="scanner-panel scanner-modes">
        <header><div><span>01</span><strong>Scanner le contexte actif</strong></div><small>Public, autorisé, evidence-backed</small></header>
        <div class="scanner-mode-grid">
          <button data-action="scanner-quick" ${progress ? 'disabled' : ''}><strong>Scan instantané</strong><span>Identité, contacts, preuves visibles, doublons et prochaine action.</span><i>1–5 sec</i></button>
          <button data-action="scanner-deep" class="recommended" ${progress ? 'disabled' : ''}><strong>Deep Company Scan</strong><span>Recherche contrôlée des pages équipe, services, sites, contact, actualités et partenariats.</span><i>jusqu’à 8 pages</i></button>
          <button data-action="scanner-strategic" ${progress ? 'disabled' : ''}><strong>Mission stratégique</strong><span>Recherche étendue, opportunités, score, risques et plan d’entrée.</span><i>jusqu’à 12 pages</i></button>
        </div>
        <div class="scanner-safety"><strong>Ce que le scanner protège</strong><span>Même domaine public uniquement · robots.txt respecté · anti-SSRF · aucune messagerie envoyée · aucune donnée inventée.</span></div>
      </article>

      <article class="scanner-panel account-launcher">
        <header><div><span>02</span><strong>Ouvrir un compte ANGELCARE</strong></div><small>${scanner.totalAuthorized ?? '—'} comptes autorisés</small></header>
        <form id="scanner-account-search"><input id="scanner-search-query" value="${esc(scanner.searchQuery || '')}" placeholder="Nom, domaine, téléphone, email, ville…"><button type="submit">Rechercher</button></form>
        <div class="scanner-account-results">
          ${(results.length ? results : recent).slice(0, 12).map((row: any) => `<button ${row.bridgeRequired ? 'disabled title="Bridge canonique requis"' : `data-select-account="${esc(row.id)}"`}><span>${esc((row.name || '?').slice(0,2).toUpperCase())}</span><section><strong>${esc(row.name)}</strong><small>${esc([row.sector,row.city,row.status,row.bridgeRequired ? 'mapping requis' : 'dossier utilisable'].filter(Boolean).join(' · '))}</small></section><i>${row.bridgeRequired ? 'Bridge' : row.recentContext ? 'Récent' : 'Ouvrir'} →</i></button>`).join('') || '<p>Lancez une recherche pour accéder aux comptes existants sans dépendre du scan de page.</p>'}
        </div>
      </article>
    </div>

    ${progress ? `<article class="scanner-progress"><header><strong>Scan en cours</strong><span>${esc(progress.stage.replaceAll('_',' '))}</span></header><div><i style="width:${Math.min(100,Math.round((progress.completed/Math.max(1,progress.total))*100))}%"></i></div><p>${esc(progress.detail || 'Le scanner collecte et vérifie les sources autorisées…')}</p></article>` : ''}

    ${scan ? `<section class="scanner-results">
      <article class="scanner-identity-card">
        <div><span class="scanner-kicker">IDENTITÉ & RÉSOLUTION</span><h2>${esc(org.name || 'Organisation à confirmer')}</h2><p>${esc([org.legalName,org.sector,org.city].filter(Boolean).join(' · ') || 'Informations partielles')}</p><div class="scanner-evidence-chips"><span>${scan.pages?.filter((p:any)=>p.status==='fetched').length || 0} pages</span><span>${scan.facts?.length || 0} faits</span><span>${scan.contacts?.length || 0} contacts</span><span>${scan.signals?.length || 0} signaux</span></div></div>
        <div class="scanner-match ${topMatch?.confidence >= .82 ? 'exact' : topMatch ? 'possible' : 'new'}"><strong>${topMatch ? Math.round(topMatch.confidence*100)+'%' : 'NOUVEAU'}</strong><span>${topMatch?.confidence >= .82 ? 'compte existant' : topMatch ? 'doublon possible' : 'aucune correspondance forte'}</span></div>
      </article>

      <div class="scanner-quality-grid">
        ${[['Identité',quality.identityConfidence],['Preuves',quality.evidenceCompleteness],['Contacts',quality.contactCoverage],['Vertical',quality.verticalConfidence],['Opportunité',quality.opportunityConfidence],['Diversité sources',quality.sourceDiversity]].map(([label,value])=>`<article><span>${esc(label)}</span><strong>${percent(value)}</strong><div><i style="width:${Number(value||0)}%"></i></div></article>`).join('')}
      </div>

      ${topMatch ? `<article class="scanner-panel scanner-duplicate"><header><div><span>03</span><strong>${topMatch.confidence >= .82 ? 'Compte existant détecté' : 'Revue doublon obligatoire'}</strong></div><small>${Math.round(topMatch.confidence*100)}% confiance</small></header><h3>${esc(topMatch.prospect?.name || topMatch.prospect_snapshot?.name)}</h3><ul>${(topMatch.reasons || topMatch.match_reasons || []).map((r:string)=>`<li>${esc(r)}</li>`).join('')}</ul><button data-select-account="${esc(topMatch.prospect?.id || topMatch.prospect_id)}" class="b2b-primary">Ouvrir le dossier existant</button></article>` : ''}

      <div class="scanner-three-column">
        <article class="scanner-panel"><header><strong>Preuves détectées</strong><small>${scan.facts?.length || 0}</small></header><div class="scanner-fact-list">${(scan.facts || []).slice(0,18).map((f:any)=>`<div><span>${Math.round(Number(f.confidence||0)*100)}%</span><section><strong>${esc(f.fieldKey)}</strong><p>${esc(f.value)}</p><small>${esc(f.sourceTitle || safeHost(f.sourceUrl))}</small></section></div>`).join('') || '<p>Aucune preuve exploitable.</p>'}</div></article>
        <article class="scanner-panel"><header><strong>Décideurs & contacts</strong><small>${scan.contacts?.length || 0}</small></header><div class="scanner-contact-list">${(scan.contacts || []).slice(0,12).map((c:any)=>`<div><span>${esc((c.name || c.email || '?').slice(0,2).toUpperCase())}</span><section><strong>${esc(c.name || c.email || 'Contact public')}</strong><small>${esc(c.role || c.department || c.buyingRoleHypothesis || 'Rôle à confirmer')}</small></section></div>`).join('') || '<p>Aucun décideur public vérifiable. Le système proposera des missions de recherche.</p>'}</div></article>
        <article class="scanner-panel"><header><strong>Signaux commerciaux</strong><small>${scan.signals?.length || 0}</small></header><div class="scanner-signal-list">${(scan.signals || []).slice(0,12).map((s:any)=>`<div class="${esc(s.signalType)}"><strong>${esc(s.label)}</strong><p>${esc(s.commercialInterpretation)}</p><small>${esc(s.evidence)}</small></div>`).join('') || '<p>Aucun signal fort détecté dans les sources accessibles.</p>'}</div></article>
      </div>

      <article class="scanner-panel opportunity-lab"><header><div><span>04</span><strong>Opportunités ANGELCARE proposées</strong></div><small>${scan.ai?.used ? `AI gouvernée · ${esc(scan.ai.model)}` : 'Moteur déterministe evidence-backed'}</small></header><div class="scanner-opportunity-grid">${(scan.opportunityHypotheses || []).map((o:any,index:number)=>`<article class="${index===0?'priority':''}"><span>${Math.round(Number(o.confidence||0)*100)}% confiance</span><h3>${esc(o.title)}</h3><p>${esc(o.rationale)}</p><strong>${esc(o.potentialModel)}</strong><small>${money(o.estimatedAnnualValueMin)} – ${money(o.estimatedAnnualValueMax)} / an</small></article>`).join('') || '<p>Aucune opportunité suffisamment appuyée par les preuves.</p>'}</div></article>

      <article class="scanner-action-deck"><div><span class="scanner-kicker">PASSER DE LA RECHERCHE À L’EXÉCUTION</span><h3>${esc(scan.recommendedActions?.[0]?.label || 'Valider le résultat du scan')}</h3><p>${esc(scan.recommendedActions?.[0]?.reason || 'Choisissez l’action gouvernée adaptée à la résolution de l’organisation.')}</p></div><div class="scanner-action-buttons">
        ${!activeAccount && !topMatch && input.canCreate ? '<button data-action="create-prospect" class="b2b-primary">Créer le prospect avec preuves</button>' : ''}
        ${activeAccount && input.canEnrich ? '<button data-action="enrich">Appliquer l’enrichissement</button>' : ''}
        ${activeAccount && input.canPlan ? '<button data-action="build-plan">Générer le plan de compte</button>' : ''}
        ${activeAccount && input.canOpportunity ? '<button data-action="create-opportunity" class="b2b-primary">Créer l’opportunité prioritaire</button>' : ''}
        <button data-action="scanner-deep">Actualiser en Deep Scan</button>
      </div></article>

      ${scan.diagnostics?.length ? `<article class="scanner-diagnostics"><strong>Sources partielles ou indisponibles</strong>${scan.diagnostics.map((d:any)=>`<div><span>${esc(d.code)}</span><p>${esc(d.sourceUrl || d.message)}</p></div>`).join('')}</article>` : ''}
    </section>` : ''}
  </section>`
}
