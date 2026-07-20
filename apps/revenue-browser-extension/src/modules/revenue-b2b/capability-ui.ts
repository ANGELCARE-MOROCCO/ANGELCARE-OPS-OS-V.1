import type { WorkspaceDomain } from './workspace-types.js'

export type CapabilityUiDefinition = {
  id: string
  key: string
  label: string
  summary: string
  domain: WorkspaceDomain
  view: string
  action?: string
}

export const OPERATIONAL_CAPABILITY_UI: CapabilityUiDefinition[] = [
  { id:'B2B-001',key:'extension.b2b.browser_context_understanding',label:'Context browser',summary:'Comprendre la page et son intention commerciale.',domain:'account',view:'recognition',action:'analyze' },
  { id:'B2B-002',key:'extension.b2b.organization_identity_resolution',label:'Identité organisation',summary:'Résoudre le compte, les branches et les doublons.',domain:'account',view:'recognition',action:'analyze' },
  { id:'B2B-003',key:'extension.b2b.prospect_capture',label:'Capture prospect',summary:'Créer un dossier B2B gouverné depuis le navigateur.',domain:'account',view:'recognition',action:'create-prospect' },
  { id:'B2B-004',key:'extension.b2b.account_enrichment',label:'Enrichissement',summary:'Enrichir le compte avec preuves et confiance.',domain:'account',view:'recognition',action:'enrich' },
  { id:'B2B-005',key:'extension.b2b.vertical_specific_intelligence',label:'Intelligence verticale',summary:'Analyser le potentiel selon le secteur.',domain:'intelligence',view:'plan' },
  { id:'B2B-006',key:'extension.b2b.account_scoring',label:'Scoring compte',summary:'Expliquer valeur, maturité, risques et expansion.',domain:'intelligence',view:'plan' },
  { id:'B2B-007',key:'extension.b2b.account_plan_builder',label:'Plan de compte',summary:'Construire une stratégie de pénétration complète.',domain:'intelligence',view:'plan',action:'build-plan' },
  { id:'B2B-008',key:'extension.b2b.contact_capture_management',label:'Contacts',summary:'Capturer et classifier les interlocuteurs.',domain:'account',view:'committee',action:'create-contact' },
  { id:'B2B-009',key:'extension.b2b.decision_maker_research',label:'Comité de décision',summary:'Identifier acheteur, sponsor, finance et bloqueurs.',domain:'account',view:'committee' },
  { id:'B2B-010',key:'extension.b2b.opportunity_creation',label:'Opportunité',summary:'Créer et piloter une opportunité réelle.',domain:'execute',view:'opportunity',action:'create-opportunity' },
  { id:'B2B-011',key:'extension.b2b.intelligent_pipeline_management',label:'Pipeline',summary:'Gouverner étapes, risques et prochaines actions.',domain:'execute',view:'pipeline' },
  { id:'B2B-012',key:'extension.b2b.outreach_strategy_builder',label:'Outreach',summary:'Préparer une approche personnalisée au contexte.',domain:'execute',view:'outreach',action:'prepare-outreach' },
  { id:'B2B-013',key:'extension.b2b.gmail_assisted_operations',label:'Gmail assisté',summary:'Relier un fil Gmail au dossier et préparer la réponse.',domain:'execute',view:'communications',action:'analyze' },
  { id:'B2B-014',key:'extension.b2b.whatsapp_assisted_operations',label:'WhatsApp assisté',summary:'Transformer une conversation sélectionnée en action.',domain:'execute',view:'communications',action:'analyze' },
  { id:'B2B-015',key:'extension.b2b.call_preparation',label:'Call Command',summary:'Préparer l’appel et enregistrer son résultat.',domain:'execute',view:'calls',action:'prepare-call' },
  { id:'B2B-016',key:'extension.b2b.field_visit_mode',label:'Visites terrain',summary:'Planifier, prouver et convertir une visite.',domain:'execute',view:'field_visits',action:'create-visit' },
  { id:'B2B-017',key:'extension.b2b.meeting_preparation',label:'Préparation réunion',summary:'Produire un brief de décision spécifique.',domain:'execute',view:'meetings',action:'prepare-meeting' },
  { id:'B2B-018',key:'extension.b2b.live_meeting_assistance',label:'Assistant réunion',summary:'Suivre les informations manquantes et engagements.',domain:'execute',view:'meetings',action:'assist-meeting' },
  { id:'B2B-019',key:'extension.b2b.post_meeting_conversion',label:'Conversion post-réunion',summary:'Appliquer besoins, décisions et suivis au pipeline.',domain:'execute',view:'meetings',action:'summarize-meeting' },
  { id:'B2B-020',key:'extension.b2b.proposal_studio',label:'Proposal Studio',summary:'Configurer, versionner et approuver la proposition.',domain:'deal',view:'proposal',action:'create-proposal' },
  { id:'B2B-021',key:'extension.b2b.pricing_model_selection',label:'Modèle tarifaire',summary:'Sélectionner le modèle commercial adapté.',domain:'deal',view:'pricing',action:'recommend-pricing' },
  { id:'B2B-022',key:'extension.b2b.pricing_margin_protection',label:'Marge & guardrails',summary:'Calculer coûts, marge et autorisations.',domain:'deal',view:'pricing',action:'calculate-pricing' },
  { id:'B2B-023',key:'extension.b2b.negotiation_deal_room',label:'Deal Room',summary:'Tracer demandes, impacts et contre-offres.',domain:'deal',view:'negotiation',action:'open-negotiation' },
  { id:'B2B-024',key:'extension.b2b.objection_intelligence',label:'Objections',summary:'Classifier et résoudre sans remise émotionnelle.',domain:'deal',view:'negotiation',action:'record-objection' },
  { id:'B2B-025',key:'extension.b2b.closing_room',label:'Closing Room',summary:'Contrôler la réalité de la clôture.',domain:'deal',view:'closing',action:'evaluate-closing' },
  { id:'B2B-026',key:'extension.b2b.contract_payment_gates',label:'Gates contrat/paiement',summary:'Bloquer le won tant que les preuves manquent.',domain:'deal',view:'closing',action:'check-closing-gates' },
  { id:'B2B-027',key:'extension.b2b.payment_promise_control',label:'Promesses de paiement',summary:'Tracer échéance, preuve et vérification finance.',domain:'deal',view:'payments',action:'create-payment-promise' },
  { id:'B2B-028',key:'extension.b2b.revenue_rescue',label:'Revenue Rescue',summary:'Récupérer proposition, contrat ou paiement bloqué.',domain:'deal',view:'rescue',action:'create-rescue' },
  { id:'B2B-029',key:'extension.b2b.executive_intervention',label:'Intervention exécutive',summary:'Préparer un brief dirigeant sans improvisation.',domain:'deal',view:'rescue',action:'prepare-executive-intervention' },
  { id:'B2B-030',key:'extension.b2b.operational_handoff',label:'Operational Handoff',summary:'Transférer le closing réel aux opérations avec validations et blockers.',domain:'execute',view:'handoff',action:'generate-handoff' },
  { id:'B2B-031',key:'extension.b2b.partner_activation',label:'Partner Activation',summary:'Piloter onboarding, readiness, lancement, premier service et hypercare.',domain:'execute',view:'activation',action:'create-onboarding' },
  { id:'B2B-032',key:'extension.b2b.partner_performance',label:'Partner Performance',summary:'Mesurer performance, santé, incidents, CAP et revues partenaires.',domain:'intelligence',view:'performance',action:'load-performance' },
  { id:'B2B-033',key:'extension.b2b.upsell_cross_sell',label:'Growth & Expansion',summary:'Détecter upsell, cross-sell, branches et expansion multi-site gouvernée.',domain:'deal',view:'growth',action:'detect-upsell' },
  { id:'B2B-034',key:'extension.b2b.renewal_management',label:'Renewal Command',summary:'Orchestrer 180/120/90/60/30 jours, churn et rescue renouvellement.',domain:'deal',view:'renewal',action:'calculate-renewal' },
  { id:'B2B-035',key:'extension.b2b.tender_rfp_intelligence',label:'Tender Command',summary:'Gérer eligibility, bid/no-bid, conformité, soumission et résultat.',domain:'deal',view:'tender',action:'create-tender' },
  { id:'B2B-036',key:'extension.b2b.campaign_association',label:'Attribution campagne',summary:'Relier le revenu à sa source marketing.',domain:'more',view:'timeline',action:'attribute-campaign' },
  { id:'B2B-037',key:'extension.b2b.referral_source_management',label:'Source referral',summary:'Préserver attribution et source Ambassadors.',domain:'more',view:'timeline',action:'record-referral' },
  { id:'B2B-038',key:'extension.b2b.daily_revenue_command',label:'Revenue Command',summary:'Piloter priorités, retards et closing window.',domain:'execute',view:'today',action:'load-today' },
  { id:'B2B-039',key:'extension.b2b.manager_control',label:'Manager Control',summary:'Prioriser, corriger, réassigner, prévoir et intervenir avec autorité.',domain:'account',view:'management_command',action:'review-pipeline' },
  { id:'B2B-040',key:'extension.b2b.staff_execution_quality',label:'Execution Quality',summary:'Expliquer les patterns d’exécution et créer des missions de coaching.',domain:'execute',view:'execution_quality',action:'assess-execution' },
  { id:'B2B-041',key:'extension.b2b.b2b_reporting',label:'Executive Reporting',summary:'Générer des rapports commerciaux réels, versionnés et evidence-backed.',domain:'more',view:'executive_reports',action:'generate-daily-report' },
  { id:'B2B-043',key:'extension.b2b.command_palette',label:'Command Palette',summary:'Accéder uniquement aux capacités assignées via Cmd/Ctrl + K.',domain:'more',view:'capabilities' },
  { id:'B2B-042',key:'extension.b2b.evidence_audit',label:'Preuves & audit',summary:'Tracer chaque fait, action et décision.',domain:'more',view:'evidence' },
  { id:'B2B-044',key:'extension.b2b.controlled_automation',label:'Controlled Automation',summary:'Exécuter uniquement des automations internes sûres, approuvées et auditables.',domain:'more',view:'automation_center',action:'create-automation' },
  { id:'B2B-045',key:'extension.b2b.dynamic_user_loading',label:'Chargement dynamique',summary:'Charger uniquement les capacités assignées.',domain:'more',view:'capabilities' },
]

export const DOMAIN_LABELS: Record<WorkspaceDomain, { label: string; short: string; description: string }> = {
  account: { label: 'Compte', short: 'Compte', description: 'Identité, contacts, comité et stratégie de compte' },
  execute: { label: 'Exécuter', short: 'Exécuter', description: 'Actions, communications, appels, réunions et suivis' },
  deal: { label: 'Deal', short: 'Deal', description: 'Proposition, pricing, négociation, closing et paiement' },
  intelligence: { label: 'Intelligence', short: 'Intel', description: 'Scoring, signaux, risques et recommandations' },
  more: { label: 'Plus', short: 'Plus', description: 'Timeline, preuves, attribution et capacités' },
}
