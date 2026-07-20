import type { PartnerViewKey } from './partner-mode.js'
import type { PartnerWorkspaceHydration } from './workspace-types.js'

type FormField = {
  name: string
  label: string
  type?: 'text' | 'textarea' | 'number' | 'datetime-local' | 'select' | 'checkbox'
  value?: string | number | boolean | null
  placeholder?: string
  required?: boolean
  options?: Array<{ value: string; label: string }>
}

type PartnerActionContext = {
  workspace?: PartnerWorkspaceHydration
  account?: Record<string, any> | null
  opportunity?: Record<string, any> | null
  sourceUrl?: string | null
  openForm: (title: string, description: string, fields: FormField[], submitLabel?: string) => Promise<Record<string, any> | null>
  run: (commandKey: string, payload: Record<string, unknown>, success: string, options?: { sourceAdapter?: string | null; view?: PartnerViewKey }) => Promise<any>
}

const split = (value: unknown) => String(value || '').split(';').map((item) => item.trim()).filter(Boolean)
const json = (value: unknown, fallback: any = {}) => {
  const raw = String(value || '').trim()
  if (!raw) return fallback
  try { return JSON.parse(raw) } catch { return fallback }
}
const p = (ctx: PartnerActionContext) => ctx.workspace?.partner || null
const op = (ctx: PartnerActionContext) => ctx.opportunity || ctx.workspace?.opportunity || null
const handoff = (ctx: PartnerActionContext) => ctx.workspace?.operate?.activeHandoff || ctx.workspace?.operate?.handoffs?.[0] || null
const activation = (ctx: PartnerActionContext) => ctx.workspace?.operate?.activeActivation || ctx.workspace?.operate?.activationPlans?.[0] || null
const firstService = (ctx: PartnerActionContext) => ctx.workspace?.operate?.firstServices?.[0] || null
const activeIssue = (ctx: PartnerActionContext) => ctx.workspace?.operate?.activeIssue || ctx.workspace?.operate?.issues?.find((row: any) => row.status !== 'closed') || null
const activeCorrectiveAction = (ctx: PartnerActionContext) => ctx.workspace?.operate?.correctiveActions?.find((row: any) => row.status !== 'closed') || ctx.workspace?.operate?.correctiveActions?.[0] || null
const activeRenewal = (ctx: PartnerActionContext) => ctx.workspace?.growth?.activeRenewal || ctx.workspace?.growth?.renewals?.[0] || null
const activeTender = (ctx: PartnerActionContext) => ctx.workspace?.tenders?.tenders?.find((row: any) => !['awarded', 'lost'].includes(row.status)) || ctx.workspace?.tenders?.tenders?.[0] || null

export async function handlePartnerAction(kind: string, ctx: PartnerActionContext): Promise<boolean> {
  const partner = p(ctx)
  const opportunity = op(ctx)
  const account = ctx.account || ctx.workspace?.account || null
  const currentHandoff = handoff(ctx)

  if (kind === 'generate-handoff') {
    if (!opportunity?.id) throw new Error('OPPORTUNITY_REQUIRED_FOR_HANDOFF')
    const form = await ctx.openForm('Générer le handoff opérationnel', 'Le dossier sera construit depuis le closing, la proposition, le pricing, le contrat, le paiement et les engagements réellement enregistrés.', [
      { name: 'operationalOwnerId', label: 'Responsable opérationnel (ID utilisateur)' },
      { name: 'launchDate', label: 'Date de lancement cible', type: 'datetime-local' },
      { name: 'sitesText', label: 'Sites prévus (séparés par ;)', type: 'textarea' },
      { name: 'commitmentsText', label: 'Engagements supplémentaires confirmés (séparés par ;)', type: 'textarea' },
      { name: 'notes', label: 'Notes de passage', type: 'textarea' },
    ])
    if (!form) return true
    await ctx.run('b2b.handoff.generate', {
      opportunityId: opportunity.id,
      operationalOwnerId: form.operationalOwnerId || null,
      launchDate: form.launchDate || null,
      sites: split(form.sitesText).map((name) => ({ name })),
      commitments: split(form.commitmentsText).map((statement) => ({ statement, classification: 'commercial_commitment', impact: 'medium', resolved: true })),
      notes: form.notes,
    }, 'Handoff généré depuis les données réelles de closing.', { sourceAdapter: null, view: 'handoff' })
    return true
  }

  if (kind === 'validate-handoff') {
    if (!currentHandoff?.id) throw new Error('HANDOFF_REQUIRED')
    const form = await ctx.openForm('Valider le handoff', 'Les blockers, promesses, obligations et preuves seront recalculés avant toute acceptation.', [
      { name: 'decision', label: 'Décision', type: 'select', value: 'ready_for_acceptance', options: [
        { value: 'ready_for_acceptance', label: 'Prêt pour acceptation' },
        { value: 'accept_with_conditions', label: 'Acceptable avec conditions' },
        { value: 'request_correction', label: 'Correction requise' },
        { value: 'reject', label: 'Rejeter' },
      ] },
      { name: 'conditionsText', label: 'Conditions (séparées par ;)', type: 'textarea' },
      { name: 'notes', label: 'Notes de validation', type: 'textarea' },
    ])
    if (!form) return true
    await ctx.run('b2b.handoff.validate', { handoffId: currentHandoff.id, decision: form.decision, conditions: split(form.conditionsText), notes: form.notes }, 'Validation du handoff enregistrée.', { sourceAdapter: null, view: 'handoff' })
    return true
  }

  if (kind === 'request-handoff-correction') {
    if (!currentHandoff?.id) throw new Error('HANDOFF_REQUIRED')
    const form = await ctx.openForm('Demander une correction', 'Documentez les incohérences opérationnelles ou contractuelles à corriger.', [
      { name: 'reasonsText', label: 'Corrections requises (séparées par ;)', type: 'textarea', required: true },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ], 'Envoyer la correction')
    if (!form) return true
    await ctx.run('b2b.handoff.request_correction', { handoffId: currentHandoff.id, reasons: split(form.reasonsText), notes: form.notes }, 'Correction du handoff demandée.', { sourceAdapter: null, view: 'handoff' })
    return true
  }

  if (kind === 'accept-handoff') {
    if (!currentHandoff?.id) throw new Error('HANDOFF_REQUIRED')
    const form = await ctx.openForm('Accepter le handoff', 'Cette décision est réservée à une autorité APPROVE/ADMINISTER. Les blockers critiques doivent être résolus.', [
      { name: 'conditionsText', label: 'Conditions résiduelles approuvées (séparées par ;)', type: 'textarea' },
      { name: 'notes', label: 'Décision et preuve', type: 'textarea', required: true },
    ], 'Accepter')
    if (!form) return true
    await ctx.run('b2b.handoff.accept', { handoffId: currentHandoff.id, conditions: split(form.conditionsText), notes: form.notes }, 'Handoff accepté par les opérations.', { sourceAdapter: null, view: 'handoff' })
    return true
  }

  if (kind === 'activate-partner') {
    if (!currentHandoff?.id) throw new Error('HANDOFF_REQUIRED')
    const form = await ctx.openForm('Activer Partner 360', 'Créez le dossier partenaire canonique lié au prospect et à l’opportunité existants. Aucun second CRM ne sera créé.', [
      { name: 'legalName', label: 'Raison sociale', value: account?.name || '', required: true },
      { name: 'commercialName', label: 'Nom commercial', value: account?.name || '' },
      { name: 'contractReference', label: 'Référence contrat' },
      { name: 'contractStartAt', label: 'Début contrat', type: 'datetime-local' },
      { name: 'contractEndAt', label: 'Fin contrat', type: 'datetime-local' },
      { name: 'operationalOwnerId', label: 'Responsable opérationnel (ID)' },
      { name: 'paymentStatus', label: 'Statut paiement', type: 'select', value: 'verified', options: [
        { value: 'verified', label: 'Vérifié Finance' }, { value: 'pending', label: 'En attente' }, { value: 'not_required', label: 'Non requis' },
      ] },
    ], 'Activer Partner 360')
    if (!form) return true
    await ctx.run('b2b.partner.activate', { handoffId: currentHandoff.id, ...form }, 'Partner 360 activé et relié au dossier commercial existant.', { sourceAdapter: null, view: 'partner_overview' })
    return true
  }

  if (kind === 'partner-update') {
    if (!partner?.id) throw new Error('PARTNER_REQUIRED')
    const form = await ctx.openForm('Mettre à jour Partner 360', 'Mettez à jour les responsables et métadonnées sans dupliquer le partenaire.', [
      { name: 'commercialName', label: 'Nom commercial', value: partner.commercial_name || partner.legal_name },
      { name: 'salesOwnerId', label: 'Responsable commercial (ID)', value: partner.sales_owner_id || '' },
      { name: 'operationalOwnerId', label: 'Responsable opérationnel (ID)', value: partner.operational_owner_id || '' },
      { name: 'metadataJson', label: 'Métadonnées structurées (JSON)', type: 'textarea', value: JSON.stringify(partner.metadata || {}, null, 2) },
    ])
    if (!form) return true
    await ctx.run('b2b.partner.update', { partnerId: partner.id, commercialName: form.commercialName, salesOwnerId: form.salesOwnerId || null, operationalOwnerId: form.operationalOwnerId || null, metadata: json(form.metadataJson) }, 'Partner 360 mis à jour.', { sourceAdapter: null, view: 'partner_overview' })
    return true
  }

  if (kind === 'partner-site-create') {
    if (!partner?.id) throw new Error('PARTNER_REQUIRED')
    const form = await ctx.openForm('Ajouter un site partenaire', 'Ajoutez une branche ou un site opérationnel avec territoire, lancement et capacité.', [
      { name: 'name', label: 'Nom du site', required: true },
      { name: 'siteCode', label: 'Code site' },
      { name: 'siteType', label: 'Type', type: 'select', value: 'operating_site', options: [
        { value: 'headquarters', label: 'Siège' }, { value: 'branch', label: 'Branche' }, { value: 'operating_site', label: 'Site opérationnel' }, { value: 'event_site', label: 'Site événementiel' },
      ] },
      { name: 'city', label: 'Ville', value: partner.city || '' },
      { name: 'address', label: 'Adresse', type: 'textarea' },
      { name: 'territory', label: 'Territoire', value: partner.territory || partner.city || '' },
      { name: 'launchAt', label: 'Lancement prévu', type: 'datetime-local' },
      { name: 'capacityJson', label: 'Capacité (JSON)', type: 'textarea', placeholder: '{"children": 60}' },
    ])
    if (!form) return true
    await ctx.run('b2b.partner.site_create', { partnerId: partner.id, ...form, capacity: json(form.capacityJson) }, 'Site partenaire créé.', { sourceAdapter: null, view: 'partner_overview' })
    return true
  }

  if (kind === 'partner-service-configure') {
    if (!partner?.id) throw new Error('PARTNER_REQUIRED')
    const sites = ctx.workspace?.identity?.sites || []
    const form = await ctx.openForm('Configurer un service partenaire', 'Reliez le service à un site, à sa valeur commerciale et à son modèle de facturation.', [
      { name: 'siteId', label: 'Site', type: 'select', options: [{ value: '', label: 'Tous les sites / non affecté' }, ...sites.map((site: any) => ({ value: site.id, label: site.name }))] },
      { name: 'serviceLine', label: 'Ligne de service', value: 'ANGELCARE B2B Partnership', required: true },
      { name: 'program', label: 'Programme' },
      { name: 'volume', label: 'Volume', type: 'number', value: 0 },
      { name: 'frequency', label: 'Fréquence', value: 'monthly' },
      { name: 'commercialValue', label: 'Valeur commerciale (Dh)', type: 'number', value: 0 },
      { name: 'billingModel', label: 'Modèle de facturation', value: 'monthly_retainer' },
      { name: 'startAt', label: 'Début', type: 'datetime-local' },
      { name: 'configurationJson', label: 'Configuration opérationnelle (JSON)', type: 'textarea' },
    ])
    if (!form) return true
    await ctx.run('b2b.partner.service_configure', { partnerId: partner.id, ...form, siteId: form.siteId || null, configuration: json(form.configurationJson) }, 'Service partenaire configuré.', { sourceAdapter: null, view: 'partner_overview' })
    return true
  }

  if (kind === 'create-onboarding') {
    if (!partner?.id) throw new Error('PARTNER_REQUIRED')
    const form = await ctx.openForm('Créer le plan d’onboarding', 'Le système créera les tâches obligatoires de collecte, scope, contacts, sites, services, staffing, formation, matériels, transport, billing, communication et readiness.', [
      { name: 'targetLaunchAt', label: 'Lancement cible', type: 'datetime-local' },
      { name: 'ownerId', label: 'Responsable onboarding (ID)', value: partner.operational_owner_id || '' },
      { name: 'informationCollectionJson', label: 'Informations déjà disponibles (JSON)', type: 'textarea' },
      { name: 'operationalConfigurationJson', label: 'Configuration opérationnelle (JSON)', type: 'textarea' },
    ], 'Créer l’onboarding')
    if (!form) return true
    await ctx.run('b2b.onboarding.create', { partnerId: partner.id, handoffId: currentHandoff?.id || null, targetLaunchAt: form.targetLaunchAt || null, ownerId: form.ownerId || null, informationCollection: json(form.informationCollectionJson), operationalConfiguration: json(form.operationalConfigurationJson) }, 'Plan d’onboarding et tâches obligatoires créés.', { sourceAdapter: null, view: 'activation' })
    return true
  }

  if (kind === 'calculate-activation') {
    if (!partner?.id) throw new Error('PARTNER_REQUIRED')
    const gates = ['contract','payment','handoff','staffing','training','materials','site','communication','safety','quality','support','reporting']
    const form = await ctx.openForm('Calculer la readiness de lancement', 'Marquez uniquement les gates réellement prouvés. Toute gate non validée restera bloquante.', [
      { name: 'launchAt', label: 'Date de lancement', type: 'datetime-local', value: activation(ctx)?.launch_at || '' },
      ...gates.map((key) => ({ name: key, label: `${key.replaceAll('_', ' ')} validé`, type: 'checkbox' as const, value: ctx.workspace?.operate?.activationGates?.find((row: any) => row.gate_key === key)?.status === 'passed' })),
    ])
    if (!form) return true
    const gatePayload = Object.fromEntries(gates.map((key) => [key, form[key] ? 'passed' : 'pending']))
    await ctx.run('b2b.activation.readiness_calculate', { partnerId: partner.id, launchAt: form.launchAt || null, gates: gatePayload }, 'Readiness de lancement recalculée avec blockers explicites.', { sourceAdapter: null, view: 'activation' })
    return true
  }

  if (kind === 'approve-activation') {
    if (!partner?.id) throw new Error('PARTNER_REQUIRED')
    const form = await ctx.openForm('Approuver le lancement', 'Réservé aux profils APPROVE/ADMINISTER. Les douze gates obligatoires doivent être passés.', [
      { name: 'notes', label: 'Décision de lancement', type: 'textarea', required: true },
    ], 'Approuver le lancement')
    if (!form) return true
    await ctx.run('b2b.activation.approve', { partnerId: partner.id, notes: form.notes }, 'Lancement partenaire approuvé.', { sourceAdapter: null, view: 'activation' })
    return true
  }

  if (kind === 'prepare-first-service') {
    if (!partner?.id) throw new Error('PARTNER_REQUIRED')
    const sites = ctx.workspace?.identity?.sites || []
    const services = ctx.workspace?.identity?.services || []
    const form = await ctx.openForm('Préparer le premier service', 'Construisez un brief exécutable avec site, service, staff, instructions, matériels, transport, sécurité et escalade.', [
      { name: 'siteId', label: 'Site', type: 'select', options: [{ value: '', label: 'Non affecté' }, ...sites.map((row: any) => ({ value: row.id, label: row.name }))] },
      { name: 'serviceId', label: 'Service', type: 'select', options: [{ value: '', label: 'Non affecté' }, ...services.map((row: any) => ({ value: row.id, label: row.service_line }))] },
      { name: 'scheduledAt', label: 'Date et heure', type: 'datetime-local', required: true },
      { name: 'briefText', label: 'Brief', type: 'textarea', required: true },
      { name: 'staffText', label: 'Staff prévu (séparé par ;)', type: 'textarea' },
      { name: 'instructionsText', label: 'Instructions (séparées par ;)', type: 'textarea' },
      { name: 'materialsText', label: 'Matériels (séparés par ;)', type: 'textarea' },
      { name: 'safetyText', label: 'Contrôles sécurité', type: 'textarea' },
      { name: 'escalationText', label: 'Escalade', type: 'textarea' },
    ])
    if (!form) return true
    await ctx.run('b2b.first_service.prepare', { partnerId: partner.id, siteId: form.siteId || null, serviceId: form.serviceId || null, scheduledAt: form.scheduledAt, brief: { summary: form.briefText }, staff: split(form.staffText), instructions: split(form.instructionsText), materials: split(form.materialsText), safety: { controls: form.safetyText }, escalation: { route: form.escalationText } }, 'Premier service préparé.', { sourceAdapter: null, view: 'activation' })
    return true
  }

  if (kind === 'record-first-service') {
    const service = firstService(ctx)
    if (!service?.id) throw new Error('FIRST_SERVICE_REQUIRED')
    const form = await ctx.openForm('Enregistrer le résultat du premier service', 'Enregistrez le résultat réel, les retours, les écarts, les conséquences billing et la readiness de continuation.', [
      { name: 'outcome', label: 'Résultat', type: 'textarea', required: true },
      { name: 'partnerFeedback', label: 'Retour partenaire', type: 'textarea' },
      { name: 'staffFeedback', label: 'Retour staff', type: 'textarea' },
      { name: 'deviationsText', label: 'Écarts (séparés par ;)', type: 'textarea' },
      { name: 'correctiveActionsText', label: 'Actions correctives immédiates (séparées par ;)', type: 'textarea' },
      { name: 'billingConsequence', label: 'Conséquence facturation', type: 'textarea' },
      { name: 'partnerConfirmedBy', label: 'Confirmation partenaire par' },
      { name: 'continuedServiceReady', label: 'Service continu autorisé', type: 'checkbox' },
    ])
    if (!form) return true
    await ctx.run('b2b.first_service.outcome_record', { firstServiceId: service.id, outcome: form.outcome, partnerFeedback: { summary: form.partnerFeedback }, staffFeedback: { summary: form.staffFeedback }, deviations: split(form.deviationsText), correctiveActions: split(form.correctiveActionsText), billingConsequence: { summary: form.billingConsequence }, partnerConfirmedBy: form.partnerConfirmedBy, continuedServiceReady: form.continuedServiceReady }, 'Résultat du premier service enregistré.', { sourceAdapter: null, view: 'activation' })
    return true
  }

  if (kind === 'create-hypercare') {
    const service = firstService(ctx)
    if (!service?.id) throw new Error('FIRST_SERVICE_REQUIRED')
    await ctx.run('b2b.hypercare.create', { firstServiceId: service.id }, 'Checkpoints hypercare Jour 1, 3, 7, 14 et 30 créés.', { sourceAdapter: null, view: 'activation' })
    return true
  }

  if (kind === 'load-performance') {
    if (!partner?.id) throw new Error('PARTNER_REQUIRED')
    const form = await ctx.openForm('Enregistrer la performance partenaire', 'Utilisez uniquement les données réellement disponibles. Les champs non saisis seront marqués comme manquants.', [
      { name: 'periodStart', label: 'Début période', type: 'datetime-local', required: true },
      { name: 'periodEnd', label: 'Fin période', type: 'datetime-local', required: true },
      { name: 'contractedRevenue', label: 'CA contracté (Dh)', type: 'number' },
      { name: 'invoicedRevenue', label: 'CA facturé (Dh)', type: 'number' },
      { name: 'collectedRevenue', label: 'CA encaissé (Dh)', type: 'number' },
      { name: 'usage', label: 'Usage', type: 'number' },
      { name: 'volume', label: 'Volume', type: 'number' },
      { name: 'serviceSuccessRate', label: 'Taux de service réussi (%)', type: 'number' },
      { name: 'incidents', label: 'Incidents', type: 'number' },
      { name: 'complaints', label: 'Réclamations', type: 'number' },
      { name: 'satisfaction', label: 'Satisfaction /100', type: 'number' },
      { name: 'paymentDiscipline', label: 'Discipline paiement /100', type: 'number' },
    ])
    if (!form) return true
    await ctx.run('b2b.partner_performance.read', { partnerId: partner.id, ...form }, 'Snapshot de performance enregistré sans fabrication des données absentes.', { sourceAdapter: null, view: 'performance' })
    return true
  }

  if (kind === 'calculate-health') {
    if (!partner?.id) throw new Error('PARTNER_REQUIRED')
    await ctx.run('b2b.partner_health.calculate', { partnerId: partner.id }, 'Santé partenaire calculée avec dimensions et données manquantes explicites.', { sourceAdapter: null, view: 'performance' })
    return true
  }

  if (kind === 'create-issue') {
    if (!partner?.id) throw new Error('PARTNER_REQUIRED')
    const form = await ctx.openForm('Créer un issue partenaire', 'Documentez impact, gravité, propriétaire, deadline, evidence et communication partenaire.', [
      { name: 'category', label: 'Catégorie', type: 'select', value: 'operational_failure', options: [
        { value: 'operational_failure', label: 'Défaillance opérationnelle' }, { value: 'quality_concern', label: 'Qualité' }, { value: 'safety_incident', label: 'Sécurité' }, { value: 'staffing', label: 'Staffing' }, { value: 'billing_dispute', label: 'Litige facturation' }, { value: 'payment_delay', label: 'Retard paiement' }, { value: 'partner_complaint', label: 'Réclamation partenaire' }, { value: 'contract_misunderstanding', label: 'Contrat' }, { value: 'communication_failure', label: 'Communication' }, { value: 'executive_relationship_risk', label: 'Risque relation exécutive' },
      ] },
      { name: 'severity', label: 'Sévérité', type: 'select', value: 'medium', options: [{ value: 'low', label: 'Faible' }, { value: 'medium', label: 'Moyenne' }, { value: 'high', label: 'Haute' }, { value: 'critical', label: 'Critique' }] },
      { name: 'title', label: 'Titre', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'partnerImpact', label: 'Impact partenaire', type: 'textarea' },
      { name: 'revenueImpact', label: 'Revenu à risque (Dh)', type: 'number' },
      { name: 'dueAt', label: 'Échéance', type: 'datetime-local' },
    ])
    if (!form) return true
    await ctx.run('b2b.partner_issue.create', { partnerId: partner.id, ...form }, 'Issue partenaire créé et audité.', { sourceAdapter: null, view: 'issues' })
    return true
  }

  if (kind === 'escalate-issue') {
    const issue = activeIssue(ctx)
    if (!issue?.id) throw new Error('PARTNER_ISSUE_REQUIRED')
    const form = await ctx.openForm('Escalader l’issue', 'Réservé aux profils autorisés. Documentez la raison et la route d’escalade.', [
      { name: 'reason', label: 'Raison', type: 'textarea', required: true },
      { name: 'escalationLevel', label: 'Niveau', type: 'select', value: 'management', options: [{ value: 'management', label: 'Management' }, { value: 'executive', label: 'Direction' }, { value: 'safety', label: 'Sécurité' }, { value: 'finance', label: 'Finance' }] },
    ])
    if (!form) return true
    await ctx.run('b2b.partner_issue.escalate', { issueId: issue.id, ...form }, 'Issue partenaire escaladé.', { sourceAdapter: null, view: 'issues' })
    return true
  }

  if (kind === 'create-corrective-action') {
    const issue = activeIssue(ctx)
    if (!issue?.id) throw new Error('PARTNER_ISSUE_REQUIRED')
    const form = await ctx.openForm('Créer un plan d’action corrective', 'Structurez problème, cause racine, containment, correction, prévention, communication et deadline.', [
      { name: 'problem', label: 'Problème', type: 'textarea', value: issue.description || issue.title, required: true },
      { name: 'rootCause', label: 'Cause racine', type: 'textarea' },
      { name: 'containment', label: 'Containment immédiat', type: 'textarea', required: true },
      { name: 'correctiveAction', label: 'Action corrective', type: 'textarea', required: true },
      { name: 'preventiveAction', label: 'Action préventive', type: 'textarea' },
      { name: 'partnerCommunication', label: 'Communication partenaire', type: 'textarea' },
      { name: 'dueAt', label: 'Échéance', type: 'datetime-local', required: true },
    ])
    if (!form) return true
    await ctx.run('b2b.corrective_action.create', { issueId: issue.id, ...form }, 'Plan d’action corrective créé.', { sourceAdapter: null, view: 'issues' })
    return true
  }

  if (kind === 'close-corrective-action') {
    const action = activeCorrectiveAction(ctx)
    if (!action?.id) throw new Error('CORRECTIVE_ACTION_REQUIRED')
    const form = await ctx.openForm('Clôturer l’action corrective', 'La clôture exige preuve, validation et décision d’une autorité autorisée.', [
      { name: 'validationNotes', label: 'Validation', type: 'textarea', required: true },
      { name: 'evidenceUrl', label: 'Preuve / URL' },
      { name: 'closeIssue', label: 'Clôturer l’issue si toutes les actions sont terminées', type: 'checkbox', value: true },
    ], 'Clôturer')
    if (!form) return true
    await ctx.run('b2b.corrective_action.close', { correctiveActionId: action.id, validationNotes: form.validationNotes, evidence: { url: form.evidenceUrl }, closeIssue: form.closeIssue }, 'Action corrective clôturée avec validation.', { sourceAdapter: null, view: 'issues' })
    return true
  }

  if (kind === 'prepare-review' || kind === 'prepare-qbr') {
    if (!partner?.id) throw new Error('PARTNER_REQUIRED')
    const qbr = kind === 'prepare-qbr'
    const form = await ctx.openForm(qbr ? 'Préparer la Quarterly Business Review' : 'Préparer une revue partenaire', 'La revue consolidera performance, santé, issues, revenu, décisions, croissance et risque de renouvellement.', [
      { name: 'scheduledAt', label: 'Date de revue', type: 'datetime-local' },
      { name: 'attendeesText', label: 'Participants (séparés par ;)', type: 'textarea' },
      { name: 'decisionsText', label: 'Décisions attendues (séparées par ;)', type: 'textarea' },
      { name: 'notes', label: 'Notes de préparation', type: 'textarea' },
    ])
    if (!form) return true
    await ctx.run(qbr ? 'b2b.qbr.generate' : 'b2b.partner_review.prepare', { partnerId: partner.id, reviewType: qbr ? 'quarterly_business_review' : 'monthly_review', scheduledAt: form.scheduledAt || null, attendees: split(form.attendeesText), decisions: split(form.decisionsText), notes: form.notes }, qbr ? 'QBR générée depuis les données réelles du partenaire.' : 'Revue partenaire préparée.', { sourceAdapter: null, view: 'qbr' })
    return true
  }

  if (['detect-upsell', 'detect-cross-sell', 'detect-site-expansion'].includes(kind)) {
    if (!partner?.id) throw new Error('PARTNER_REQUIRED')
    const command = kind === 'detect-upsell' ? 'b2b.upsell.detect' : kind === 'detect-cross-sell' ? 'b2b.cross_sell.detect' : 'b2b.expansion.site_detect'
    await ctx.run(command, { partnerId: partner.id }, 'Signal de croissance analysé après contrôle de la santé partenaire.', { sourceAdapter: null, view: 'growth' })
    return true
  }

  if (kind === 'create-upsell') {
    if (!partner?.id) throw new Error('PARTNER_REQUIRED')
    const form = await ctx.openForm('Créer une opportunité de croissance', 'La création est bloquée si la santé, le paiement ou la capacité ne permettent pas une expansion responsable.', [
      { name: 'title', label: 'Titre', required: true },
      { name: 'opportunityType', label: 'Type', type: 'select', value: 'upsell', options: [{ value: 'upsell', label: 'Upsell' }, { value: 'cross_sell', label: 'Cross-sell' }, { value: 'site_expansion', label: 'Nouveau site' }, { value: 'multi_site', label: 'Multi-site' }, { value: 'seasonal', label: 'Saisonnier' }] },
      { name: 'estimatedValue', label: 'Valeur estimée (Dh)', type: 'number' },
      { name: 'rationale', label: 'Rationale fondée sur les données', type: 'textarea', required: true },
      { name: 'targetDate', label: 'Date cible', type: 'datetime-local' },
    ])
    if (!form) return true
    await ctx.run('b2b.upsell.create', { partnerId: partner.id, ...form }, 'Opportunité de croissance créée.', { sourceAdapter: null, view: 'growth' })
    return true
  }

  if (kind === 'create-expansion-plan') {
    if (!partner?.id) throw new Error('PARTNER_REQUIRED')
    const growthOpportunity = ctx.workspace?.growth?.activeOpportunity || ctx.workspace?.growth?.opportunities?.[0]
    const form = await ctx.openForm('Créer le plan d’expansion', 'Validez capacité, sites, phasage, revenus, risques et approvals avant déploiement.', [
      { name: 'title', label: 'Nom du plan', value: `Expansion — ${partner.commercial_name || partner.legal_name}`, required: true },
      { name: 'targetSitesText', label: 'Sites / branches cibles (séparés par ;)', type: 'textarea', required: true },
      { name: 'phasesText', label: 'Phases (séparées par ;)', type: 'textarea' },
      { name: 'expectedValue', label: 'Valeur attendue (Dh)', type: 'number' },
      { name: 'capacityAssessment', label: 'Évaluation de capacité', type: 'textarea', required: true },
      { name: 'risksText', label: 'Risques (séparés par ;)', type: 'textarea' },
    ])
    if (!form) return true
    await ctx.run('b2b.expansion.plan_create', { partnerId: partner.id, growthOpportunityId: growthOpportunity?.id || null, title: form.title, targetSites: split(form.targetSitesText), phases: split(form.phasesText), expectedValue: form.expectedValue, capacityAssessment: { summary: form.capacityAssessment }, risks: split(form.risksText) }, 'Plan d’expansion créé et soumis aux guardrails.', { sourceAdapter: null, view: 'growth' })
    return true
  }

  if (kind === 'calculate-renewal') {
    if (!partner?.id) throw new Error('PARTNER_REQUIRED')
    const form = await ctx.openForm('Calculer la readiness de renouvellement', 'Le système créera les jalons 180/120/90/60/30 jours et évaluera performance, santé, paiement et risques.', [
      { name: 'contractEndAt', label: 'Échéance du contrat', type: 'datetime-local', value: partner.contract_end_at || '', required: true },
      { name: 'strategy', label: 'Stratégie initiale', type: 'select', value: 'straight_renewal', options: [{ value: 'straight_renewal', label: 'Renouvellement simple' }, { value: 'price_adjustment', label: 'Ajustement prix' }, { value: 'expanded_scope', label: 'Portée élargie' }, { value: 'multi_year', label: 'Multi-années' }, { value: 'multi_site', label: 'Multi-site' }, { value: 'service_correction', label: 'Correction service' }, { value: 'executive_rescue', label: 'Executive rescue' }] },
    ])
    if (!form) return true
    await ctx.run('b2b.renewal.readiness_calculate', { partnerId: partner.id, contractEndAt: form.contractEndAt, strategy: form.strategy }, 'Readiness de renouvellement et jalons générés.', { sourceAdapter: null, view: 'renewal' })
    return true
  }

  if (kind === 'create-renewal-plan') {
    if (!partner?.id) throw new Error('PARTNER_REQUIRED')
    const form = await ctx.openForm('Créer la stratégie de renouvellement', 'Définissez la stratégie commerciale sans masquer les risques de santé, paiement ou engagement.', [
      { name: 'contractEndAt', label: 'Échéance contrat', type: 'datetime-local', value: activeRenewal(ctx)?.contract_end_at || partner.contract_end_at || '', required: true },
      { name: 'strategy', label: 'Stratégie', type: 'select', value: activeRenewal(ctx)?.strategy || 'straight_renewal', options: [{ value: 'straight_renewal', label: 'Simple' }, { value: 'price_adjustment', label: 'Ajustement prix' }, { value: 'expanded_scope', label: 'Expansion' }, { value: 'multi_year', label: 'Multi-années' }, { value: 'reduced_scope', label: 'Portée réduite' }, { value: 'short_extension', label: 'Extension courte' }, { value: 'executive_rescue', label: 'Executive rescue' }, { value: 'planned_non_renewal', label: 'Non-renouvellement planifié' }] },
      { name: 'commercialStrategy', label: 'Plan commercial', type: 'textarea', required: true },
    ])
    if (!form) return true
    await ctx.run('b2b.renewal.plan_create', { partnerId: partner.id, contractEndAt: form.contractEndAt, strategy: form.strategy, commercialStrategy: { summary: form.commercialStrategy } }, 'Stratégie de renouvellement enregistrée.', { sourceAdapter: null, view: 'renewal' })
    return true
  }

  if (kind === 'prepare-renewal-proposal') {
    if (!partner?.id) throw new Error('PARTNER_REQUIRED')
    const renewal = activeRenewal(ctx)
    const form = await ctx.openForm('Préparer la proposition de renouvellement', 'Réservé aux profils autorisés. La proposition reste liée à la performance, au contrat et à la stratégie approuvée.', [
      { name: 'contractEndAt', label: 'Échéance contrat', type: 'datetime-local', value: renewal?.contract_end_at || partner.contract_end_at || '', required: true },
      { name: 'proposalId', label: 'Référence / ID proposition' },
      { name: 'version', label: 'Version', value: '1' },
      { name: 'notes', label: 'Notes d’approbation', type: 'textarea', required: true },
    ])
    if (!form) return true
    await ctx.run('b2b.renewal.proposal_prepare', { partnerId: partner.id, contractEndAt: form.contractEndAt, proposalReference: { id: form.proposalId || null, version: form.version, notes: form.notes } }, 'Proposition de renouvellement préparée avec autorisation.', { sourceAdapter: null, view: 'renewal' })
    return true
  }

  if (kind === 'detect-churn') {
    if (!partner?.id) throw new Error('PARTNER_REQUIRED')
    await ctx.run('b2b.churn_risk.detect', { partnerId: partner.id, contractEndAt: activeRenewal(ctx)?.contract_end_at || partner.contract_end_at }, 'Risque de churn détecté avec signaux explicites.', { sourceAdapter: null, view: 'renewal' })
    return true
  }

  if (kind === 'create-partner-rescue') {
    if (!partner?.id) throw new Error('PARTNER_REQUIRED')
    const form = await ctx.openForm('Créer un Partner Rescue', 'Protégez le revenu à risque avec raison, intervention recommandée, engagements interdits, propriétaire et échéance.', [
      { name: 'rescueType', label: 'Type', type: 'select', value: 'renewal_rescue', options: [{ value: 'renewal_rescue', label: 'Renewal rescue' }, { value: 'health_rescue', label: 'Partner health rescue' }, { value: 'payment_rescue', label: 'Payment rescue' }, { value: 'executive_relationship', label: 'Executive relationship' }] },
      { name: 'reason', label: 'Raison', type: 'textarea', required: true },
      { name: 'revenueAtRisk', label: 'Revenu à risque (Dh)', type: 'number' },
      { name: 'recommendedIntervention', label: 'Intervention recommandée', type: 'textarea', required: true },
      { name: 'prohibitedCommitmentsText', label: 'Engagements interdits (séparés par ;)', type: 'textarea' },
      { name: 'dueAt', label: 'Échéance', type: 'datetime-local' },
    ])
    if (!form) return true
    await ctx.run('b2b.partner_rescue.create', { partnerId: partner.id, renewalId: activeRenewal(ctx)?.id || null, issueId: activeIssue(ctx)?.id || null, ...form, prohibitedCommitments: split(form.prohibitedCommitmentsText) }, 'Partner Rescue créé.', { sourceAdapter: null, view: 'renewal' })
    return true
  }

  if (kind === 'create-tender') {
    const form = await ctx.openForm('Créer un dossier Tender / RFP', 'Créez le dossier depuis le partenaire, le prospect ou l’opportunité actuelle, avec deadline, valeur et source.', [
      { name: 'title', label: 'Titre', required: true },
      { name: 'issuer', label: 'Émetteur', value: partner?.commercial_name || account?.name || '' },
      { name: 'reference', label: 'Référence' },
      { name: 'submissionDeadline', label: 'Date limite', type: 'datetime-local', required: true },
      { name: 'estimatedValue', label: 'Valeur estimée (Dh)', type: 'number' },
      { name: 'sourceUrl', label: 'Source', value: ctx.sourceUrl || '' },
    ])
    if (!form) return true
    await ctx.run('b2b.tender.create', { partnerId: partner?.id || null, prospectId: account?.id || null, opportunityId: opportunity?.id || null, ...form }, 'Dossier Tender créé.', { sourceAdapter: null, view: 'tender' })
    return true
  }

  if (kind === 'extract-tender-requirements') {
    const tender = activeTender(ctx)
    if (!tender?.id) throw new Error('TENDER_REQUIRED')
    const form = await ctx.openForm('Extraire les exigences Tender', 'Saisissez une exigence par ligne au format: catégorie | texte | obligatoire oui/non.', [
      { name: 'requirementsText', label: 'Exigences', type: 'textarea', required: true, placeholder: 'legal | Attestation fiscale récente | oui\noperational | Plan de staffing | oui' },
    ])
    if (!form) return true
    const requirements = String(form.requirementsText || '').split('\n').map((line, index) => {
      const [category, requirement, mandatory] = line.split('|').map((part) => part.trim())
      return { code: `REQ-${String(index + 1).padStart(3, '0')}`, category: category || 'general', text: requirement || category, mandatory: !['non', 'no', 'false'].includes((mandatory || 'oui').toLowerCase()) }
    }).filter((row) => row.text)
    await ctx.run('b2b.tender.requirements_extract', { tenderId: tender.id, requirements }, 'Exigences Tender structurées.', { sourceAdapter: null, view: 'tender' })
    return true
  }

  if (kind === 'tender-bid-decision') {
    const tender = activeTender(ctx)
    if (!tender?.id) throw new Error('TENDER_REQUIRED')
    const form = await ctx.openForm('Décision Bid / No-Bid', 'Réservé aux profils autorisés. Évaluez fit stratégique, faisabilité, marge, paiement, concurrence et readiness documentaire.', [
      { name: 'decision', label: 'Décision', type: 'select', value: 'bid', options: [{ value: 'bid', label: 'Bid' }, { value: 'no_bid', label: 'No-Bid' }] },
      { name: 'strategicFit', label: 'Fit stratégique /100', type: 'number', value: 70 },
      { name: 'deliveryFeasibility', label: 'Faisabilité /100', type: 'number', value: 70 },
      { name: 'expectedMargin', label: 'Marge attendue /100', type: 'number', value: 40 },
      { name: 'documentationReadiness', label: 'Readiness documentaire /100', type: 'number', value: 60 },
      { name: 'paymentRisk', label: 'Risque paiement', value: 'medium' },
      { name: 'rationale', label: 'Rationale', type: 'textarea', required: true },
    ])
    if (!form) return true
    await ctx.run('b2b.tender.bid_decision', { tenderId: tender.id, ...form }, `Décision ${form.decision} enregistrée.`, { sourceAdapter: null, view: 'tender' })
    return true
  }

  if (kind === 'update-tender-compliance') {
    const tender = activeTender(ctx)
    if (!tender?.id) throw new Error('TENDER_REQUIRED')
    const requirements = (ctx.workspace?.tenders?.requirements || []).filter((row: any) => row.tender_id === tender.id)
    const form = await ctx.openForm('Mettre à jour la matrice de conformité', 'Reliez la réponse et les documents à une exigence précise.', [
      { name: 'requirementId', label: 'Exigence', type: 'select', options: requirements.map((row: any) => ({ value: row.id, label: `${row.requirement_code} — ${row.requirement_text}` })), required: true },
      { name: 'complianceStatus', label: 'Statut', type: 'select', value: 'compliant', options: [{ value: 'compliant', label: 'Conforme' }, { value: 'partial', label: 'Partiel' }, { value: 'non_compliant', label: 'Non conforme' }, { value: 'not_applicable', label: 'Non applicable' }] },
      { name: 'response', label: 'Réponse', type: 'textarea', required: true },
      { name: 'documentReferencesText', label: 'Références documents (séparées par ;)', type: 'textarea' },
      { name: 'validated', label: 'Validation autorisée', type: 'checkbox' },
    ])
    if (!form) return true
    await ctx.run('b2b.tender.compliance_update', { tenderId: tender.id, requirementId: form.requirementId, complianceStatus: form.complianceStatus, response: form.response, documentReferences: split(form.documentReferencesText), validated: form.validated }, 'Matrice de conformité mise à jour.', { sourceAdapter: null, view: 'tender' })
    return true
  }

  if (kind === 'submit-tender') {
    const tender = activeTender(ctx)
    if (!tender?.id) throw new Error('TENDER_REQUIRED')
    const form = await ctx.openForm('Soumettre le Tender', 'Réservé aux profils autorisés. Le serveur bloquera la soumission tant que la conformité obligatoire n’est pas complète.', [
      { name: 'submissionReference', label: 'Référence de soumission', required: true },
      { name: 'submissionUrl', label: 'Preuve / URL' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ], 'Enregistrer la soumission')
    if (!form) return true
    await ctx.run('b2b.tender.submit', { tenderId: tender.id, submissionEvidence: { reference: form.submissionReference, url: form.submissionUrl, notes: form.notes } }, 'Soumission Tender enregistrée avec preuve.', { sourceAdapter: null, view: 'tender' })
    return true
  }

  if (kind === 'record-tender-outcome') {
    const tender = activeTender(ctx)
    if (!tender?.id) throw new Error('TENDER_REQUIRED')
    const form = await ctx.openForm('Enregistrer le résultat Tender', 'Un award déclenchera l’exigence d’un handoff opérationnel complet.', [
      { name: 'outcome', label: 'Résultat', type: 'select', value: 'awarded', options: [{ value: 'awarded', label: 'Attribué / Awarded' }, { value: 'lost', label: 'Perdu' }] },
      { name: 'notes', label: 'Décision / retour', type: 'textarea', required: true },
    ])
    if (!form) return true
    await ctx.run('b2b.tender.outcome_record', { tenderId: tender.id, outcome: form.outcome, notes: form.notes }, 'Résultat Tender enregistré.', { sourceAdapter: null, view: 'tender' })
    return true
  }

  return false
}
