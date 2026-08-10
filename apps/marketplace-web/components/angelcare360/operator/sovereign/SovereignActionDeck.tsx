'use client'

import type { SovereignWorkspaceSnapshot } from './SovereignTypes'
import Angelcare360OperatorActionDrawer, { type Angelcare360OperatorActionDescriptor } from '../Angelcare360OperatorActionDrawer'
import type { Angelcare360OperatorFormFieldConfig } from '../Angelcare360OperatorFormField'

export default function SovereignActionDeck({ snapshot }: { snapshot: SovereignWorkspaceSnapshot }) {
  const actions = actionsFor(snapshot)
  if (!actions.length) return null
  return (
    <Angelcare360OperatorActionDrawer
      title="Commandes souveraines"
      subtitle="Créer, configurer, faire évoluer, clôturer et auditer les objets réels du SaaS. Chaque commande utilise les APIs Operator publiées; les capacités absentes restent explicitement verrouillées."
      actions={actions}
      groups={groupsFor(snapshot.tower, actions)}
    />
  )
}

const options = (rows: Array<[string, string]>) => rows.map(([label, value]) => ({ label, value }))
const field = (
  name: string,
  label: string,
  kind: Angelcare360OperatorFormFieldConfig['kind'] = 'text',
  extra: Partial<Angelcare360OperatorFormFieldConfig> = {},
): Angelcare360OperatorFormFieldConfig => ({ name, label, kind, ...extra })

const CLIENT_STATUS = options([['Prospect','prospect'],['Pilote','pilot'],['Actif','active'],['Suspendu','suspended'],['Résilié','churned'],['Archivé','archived']])
const TENANT_STATUS = options([['Non créé','not_created'],['Provisionnement','provisioning'],['Actif','active'],['Suspendu','suspended'],['Archivé','archived']])
const SUBSCRIPTION_STATUS = options([['Essai','trial'],['Actif','active'],['En retard','past_due'],['Suspendu','suspended'],['Annulé','cancelled'],['Expiré','expired'],['Archivé','archived']])
const SUPPORT_STATUS = options([['Nouveau','new'],['Triage','triage'],['Assigné','assigned'],['Attente client','waiting_client'],['Attente interne','waiting_internal'],['Résolu','resolved'],['Clôturé','closed'],['Archivé','archived']])
const TASK_STATUS = options([['À faire','todo'],['En cours','in_progress'],['Bloqué','blocked'],['Terminé','done'],['Annulé','cancelled']])
const PRIORITY = options([['Basse','low'],['Normale','normal'],['Haute','high'],['Urgente','urgent']])
const CONTRACT_STATUS = options([['Brouillon','draft'],['Envoyé','sent'],['Signé','signed'],['Actif','active'],['Expiré','expired'],['Annulé','cancelled'],['Archivé','archived']])
const RENEWAL_STATUS = options([['À venir','upcoming'],['En discussion','in_discussion'],['Proposition envoyée','proposal_sent'],['Renouvelé','renewed'],['À risque','at_risk'],['Perdu','lost'],['Annulé','cancelled']])
const PLAN_STATUS = options([['Brouillon','draft'],['Actif','active'],['Retiré','retired'],['Archivé','archived']])

function actionsFor(snapshot: SovereignWorkspaceSnapshot): Angelcare360OperatorActionDescriptor[] {
  const byKind = (kind: string) => snapshot.entities.filter((entity) => entity.kind === kind).map((entity) => ({ value: entity.id, label: entity.title }))
  const clientOptions = Object.entries(snapshot.labels.clients).map(([value, label]) => ({ value, label }))
  const tenantOptions = Object.entries(snapshot.labels.tenants).map(([value, label]) => ({ value, label }))
  const subscriptionOptions = Object.entries(snapshot.labels.subscriptions).map(([value, label]) => ({ value, label }))
  const invoiceOptions = Object.entries(snapshot.labels.invoices).map(([value, label]) => ({ value, label }))
  const planOptions = byKind('plan')
  const packageOptions = byKind('package')
  const billingAccountOptions = byKind('billing-account')
  const paymentOptions = byKind('payment')
  const contractOptions = byKind('contract')
  const renewalOptions = byKind('renewal')
  const ticketOptions = byKind('ticket')
  const incidentOptions = byKind('incident')
  const onboardingOptions = byKind('onboarding')
  const requestOptions = byKind('service-request')
  const taskOptions = byKind('task')
  const dunningOptions = byKind('dunning')
  const featureOptions = byKind('feature')
  const limitOptions = byKind('limit')

  const clientFields = [
    field('clientCode','Code client','text',{required:true}), field('displayName','Nom affiché','text',{required:true}),
    field('clientType','Type client','select',{required:true,options:options([['École','school'],['Crèche','nursery'],['Groupe','group']])}),
    field('status','Statut','select',{required:true,options:CLIENT_STATUS}), field('lifecycleStage','Cycle de vie','text',{required:true}),
    field('legalName','Raison sociale'), field('city','Ville'), field('country','Pays'), field('primaryContactName','Contact principal'),
    field('primaryContactEmail','Email principal'), field('primaryContactPhone','Téléphone'), field('source','Origine'),
    field('healthStatus','Santé'), field('riskLevel','Risque'), field('notes','Notes de relation','textarea',{rows:5}),
  ]
  const subscriptionFields = [
    field('clientId','Client','select',{required:true,options:clientOptions}), field('tenantId','Tenant','select',{options:tenantOptions}),
    field('planId','Plan','select',{required:true,options:planOptions}), field('subscriptionCode','Code abonnement','text',{required:true}),
    field('status','Statut','select',{required:true,options:SUBSCRIPTION_STATUS}), field('startDate','Début','date',{required:true}),
    field('trialEndsAt','Fin essai','date'), field('currentPeriodStart','Début période','date'), field('currentPeriodEnd','Fin période','date'),
    field('billingCycle','Cycle de facturation','text',{required:true}), field('billingAmountMad','Montant récurrent Dh','number',{required:true}),
    field('discountAmountMad','Remise Dh','number'), field('cancellationReason','Motif annulation','textarea',{rows:3}),
    field('suspendedReason','Motif suspension','textarea',{rows:3}),
  ]
  const onboardingFields = [
    field('clientId','Client','select',{required:true,options:clientOptions}), field('tenantId','Tenant','select',{options:tenantOptions}),
    field('title','Mission','text',{required:true}), field('description','Description','textarea',{rows:4}), field('ownerId','Responsable'),
    field('status','Statut','select',{required:true,options:TASK_STATUS}), field('priority','Priorité','select',{required:true,options:PRIORITY}), field('dueDate','Échéance','date'),
  ]
  const requestFields = [
    field('clientId','Client','select',{required:true,options:clientOptions}), field('tenantId','Tenant','select',{options:tenantOptions}),
    field('requestType','Type de demande','text',{required:true}), field('title','Titre','text',{required:true}),
    field('description','Description et résultat attendu','textarea',{required:true,rows:5}), field('priority','Priorité','select',{required:true,options:PRIORITY}),
    field('status','Statut','select',{required:true,options:SUPPORT_STATUS}), field('assignedTo','Assigné à'), field('dueDate','Échéance','date'),
  ]
  const taskFields = [
    field('clientId','Client','select',{options:clientOptions}), field('tenantId','Tenant','select',{options:tenantOptions}),
    field('title','Action','text',{required:true}), field('description','Description','textarea',{rows:4}), field('ownerId','Responsable'),
    field('status','Statut','select',{required:true,options:TASK_STATUS}), field('priority','Priorité','select',{required:true,options:PRIORITY}), field('dueDate','Échéance','date'),
  ]

  if (snapshot.tower === 'growth') return [
    { id:'client-create', label:'Créer un compte client', endpoint:'/api/angelcare360/operator/clients', operation:'create', tone:'primary', description:'Créer l’identité commerciale, institutionnelle et relationnelle complète.', submitLabel:'Créer le dossier client', successMessage:'Dossier client créé.', fields:clientFields },
    { id:'client-update', label:'Configurer un client existant', endpoint:'/api/angelcare360/operator/clients', operation:'update', description:'Mettre à jour identité, cycle de vie, santé, risque et décideurs.', fields:[field('id','Client','select',{required:true,options:clientOptions}), ...clientFields] },
    { id:'client-archive', label:'Archiver un client', endpoint:'/api/angelcare360/operator/clients', operation:'archive', tone:'danger', description:'Sortir le compte du portefeuille actif sans perdre son historique.', confirmTitle:'Archivage gouverné', confirmMessage:'Le client, ses contrats et son historique resteront auditables. Confirmez le motif et les conséquences.', fields:[field('id','Client','select',{required:true,options:clientOptions}),field('reason','Motif et preuve','textarea',{required:true,rows:5})] },
    { id:'contract-create', label:'Créer un contrat', endpoint:'/api/angelcare360/operator/contracts', operation:'create', description:'Formaliser la relation contractuelle, la valeur et les échéances.', fields:[field('clientId','Client','select',{required:true,options:clientOptions}),field('subscriptionId','Abonnement','select',{options:subscriptionOptions}),field('contractCode','Référence contrat','text',{required:true}),field('status','Statut','select',{required:true,options:CONTRACT_STATUS}),field('startDate','Début','date',{required:true}),field('endDate','Fin','date'),field('renewalDate','Date renouvellement','date'),field('signedAt','Date signature','date'),field('documentUrl','Document contractuel'),field('notes','Clauses / notes','textarea',{rows:5})] },
    { id:'contract-status', label:'Faire évoluer un contrat', endpoint:'/api/angelcare360/operator/contracts', operation:'status', description:'Passer le contrat dans un nouvel état gouverné.', fields:[field('id','Contrat','select',{required:true,options:contractOptions}),field('status','Nouvel état','select',{required:true,options:CONTRACT_STATUS})] },
    { id:'renewal-create', label:'Lancer un renouvellement', endpoint:'/api/angelcare360/operator/renewals', operation:'create', tone:'primary', description:'Créer la mission de rétention, négociation et expansion.', fields:[field('clientId','Client','select',{required:true,options:clientOptions}),field('subscriptionId','Abonnement','select',{options:subscriptionOptions}),field('renewalDate','Date cible','date',{required:true}),field('status','Statut','select',{required:true,options:RENEWAL_STATUS}),field('probability','Probabilité documentée','number'),field('expectedAmountMad','Valeur attendue Dh','number'),field('ownerId','Responsable'),field('notes','Stratégie / objections / prochaine action','textarea',{rows:5})] },
    { id:'renewal-status', label:'Piloter un renouvellement', endpoint:'/api/angelcare360/operator/renewals', operation:'status', description:'Mettre à jour le résultat commercial de la mission.', fields:[field('id','Renouvellement','select',{required:true,options:renewalOptions}),field('status','Nouvel état','select',{required:true,options:RENEWAL_STATUS})] },
    { id:'relationship-note', label:'Tracer une note relationnelle', endpoint:'/api/angelcare360/operator/service', entity:'note', operation:'create', description:'Conserver une information commerciale ou exécutive dans le bon contexte.', fields:[field('clientId','Client','select',{required:true,options:clientOptions}),field('tenantId','Tenant','select',{options:tenantOptions}),field('noteType','Type de note','text',{required:true}),field('body','Contenu et preuve','textarea',{required:true,rows:6}),field('visibility','Visibilité','select',{required:true,options:options([['Interne','internal'],['Restreinte','restricted'],['Publique autorisée','public']])})] },
  ]

  if (snapshot.tower === 'tenants') return [
    { id:'tenant-create', label:'Provisionner un tenant', endpoint:'/api/angelcare360/operator/tenants', operation:'create', tone:'primary', description:'Créer et relier un environnement client gouverné.', fields:[field('clientId','Client','select',{required:true,options:clientOptions}),field('schoolId','Établissement lié'),field('tenantSlug','Slug tenant','text',{required:true}),field('environment','Environnement','select',{required:true,options:options([['Pilote','pilot'],['Production','production'],['Sandbox','sandbox']])}),field('status','Statut','select',{required:true,options:TENANT_STATUS}),field('provisioningStatus','État provisioning'),field('commandCenterUrl','URL Command Center'),field('goLiveDate','Go-live','date')] },
    { id:'tenant-link', label:'Relier un tenant existant', endpoint:'/api/angelcare360/operator/tenants', operation:'link', description:'Associer un environnement existant à un client et une école.', fields:[field('clientId','Client','select',{required:true,options:clientOptions}),field('schoolId','Établissement lié'),field('tenantSlug','Slug tenant','text',{required:true}),field('environment','Environnement','select',{required:true,options:options([['Pilote','pilot'],['Production','production'],['Sandbox','sandbox']])}),field('status','Statut','select',{required:true,options:TENANT_STATUS}),field('provisioningStatus','État provisioning'),field('commandCenterUrl','URL Command Center'),field('goLiveDate','Go-live','date')] },
    { id:'tenant-update', label:'Configurer un tenant', endpoint:'/api/angelcare360/operator/tenants', operation:'update', description:'Modifier son état, son provisioning et son accès.', fields:[field('id','Tenant','select',{required:true,options:tenantOptions}),field('status','Statut','select',{required:true,options:TENANT_STATUS}),field('provisioningStatus','Provisioning'),field('commandCenterUrl','URL Command Center')] },
    { id:'tenant-status', label:'Suspendre, restaurer ou activer', endpoint:'/api/angelcare360/operator/tenants', operation:'status', tone:'danger', description:'Exécuter une transition sensible sur l’environnement.', confirmTitle:'Chambre de décision tenant', confirmMessage:'Vérifiez utilisateurs, écoles, modules, facturation, contrat, communication et capacité de restauration.', fields:[field('id','Tenant','select',{required:true,options:tenantOptions}),field('status','Nouvel état','select',{required:true,options:TENANT_STATUS}),field('provisioningStatus','État provisioning'),field('commandCenterUrl','URL Command Center')] },
    { id:'plan-create', label:'Créer un plan commercial', endpoint:'/api/angelcare360/operator/plans', entity:'plan', operation:'create', description:'Définir prix, limites, modules, fonctionnalités et support.', fields:planFields() },
    { id:'plan-update', label:'Configurer un plan', endpoint:'/api/angelcare360/operator/plans', entity:'plan', operation:'update', description:'Modifier un plan existant et sa capacité.', fields:[field('id','Plan','select',{required:true,options:planOptions}),...planFields()] },
    { id:'plan-retire', label:'Retirer un plan', endpoint:'/api/angelcare360/operator/plans', entity:'plan', operation:'retire', tone:'danger', confirmTitle:'Retrait d’offre', confirmMessage:'Le plan quittera le catalogue. Vérifiez les abonnements existants et la stratégie de migration.', fields:[field('id','Plan','select',{required:true,options:planOptions})] },
    { id:'package-create', label:'Composer un package', endpoint:'/api/angelcare360/operator/packages', operation:'create', description:'Assembler modules et fonctionnalités dans une offre.', fields:packageFields() },
    { id:'package-update', label:'Configurer un package', endpoint:'/api/angelcare360/operator/packages', operation:'update', description:'Modifier la composition d’un package existant.', fields:[field('id','Package','select',{required:true,options:packageOptions}),...packageFields()] },
    { id:'subscription-create', label:'Créer un abonnement', endpoint:'/api/angelcare360/operator/subscriptions', operation:'create', tone:'primary', description:'Relier client, tenant, plan, facturation et période de service.', fields:subscriptionFields },
    { id:'subscription-update', label:'Configurer un abonnement', endpoint:'/api/angelcare360/operator/subscriptions', operation:'update', description:'Mettre à jour offre, période et valeur.', fields:[field('id','Abonnement','select',{required:true,options:subscriptionOptions}),...subscriptionFields] },
    { id:'subscription-status', label:'Changer l’état d’un abonnement', endpoint:'/api/angelcare360/operator/subscriptions', operation:'status', description:'Activer, suspendre ou archiver avec justification.', fields:[field('id','Abonnement','select',{required:true,options:subscriptionOptions}),field('status','Nouvel état','select',{required:true,options:SUBSCRIPTION_STATUS}),field('reason','Motif','textarea',{rows:4})] },
    { id:'subscription-cancel', label:'Annuler un abonnement', endpoint:'/api/angelcare360/operator/subscriptions', operation:'cancel', tone:'danger', confirmTitle:'Annulation commerciale et service', confirmMessage:'L’annulation peut affecter accès, revenu, contrat, facturation et obligations de sortie.', fields:[field('id','Abonnement','select',{required:true,options:subscriptionOptions}),field('reason','Motif et preuve','textarea',{required:true,rows:5})] },
    { id:'feature-update', label:'Gouverner un entitlement', endpoint:'/api/angelcare360/operator/features', entity:'flag', operation:'update', description:'Activer, désactiver, verrouiller ou planifier une capacité.', fields:[field('id','Feature','select',{required:true,options:featureOptions}),field('enabled','Activé','select',{required:true,options:options([['Oui','true'],['Non','false']])}),field('status','Statut','select',{required:true,options:options([['Activé','enabled'],['Désactivé','disabled'],['Verrouillé','locked'],['Planifié','scheduled'],['Configuration requise','requires_configuration']])}),field('lockedReason','Justification','textarea',{rows:4}),field('scheduledFor','Activation planifiée','date')] },
    { id:'limit-update', label:'Gouverner une limite', endpoint:'/api/angelcare360/operator/features', entity:'usage', operation:'update', description:'Piloter capacité, consommation et cycle.', fields:[field('id','Limite','select',{required:true,options:limitOptions}),field('allowedValue','Valeur autorisée','number'),field('currentValue','Valeur consommée','number'),field('status','Statut','select',{required:true,options:options([['Active','active'],['En pause','paused'],['Archivée','archived']])}),field('resetCycle','Cycle de remise à zéro')] },
  ]

  if (snapshot.tower === 'revenue') return [
    { id:'billing-create', label:'Créer un compte de facturation', endpoint:'/api/angelcare360/operator/billing', entity:'account', operation:'create', tone:'primary', description:'Créer l’identité fiscale et les conditions de paiement.', fields:billingFields(clientOptions) },
    { id:'billing-update', label:'Configurer un compte de facturation', endpoint:'/api/angelcare360/operator/billing', entity:'account', operation:'update', description:'Mettre à jour identité, contact, fiscalité et conditions.', fields:[field('id','Compte','select',{required:true,options:billingAccountOptions}),...billingFields(clientOptions)] },
    { id:'invoice-create', label:'Préparer une facture', endpoint:'/api/angelcare360/operator/billing', entity:'invoice', operation:'create', tone:'primary', description:'Créer la pièce financière liée au client et à l’abonnement.', fields:invoiceFields(clientOptions,subscriptionOptions,billingAccountOptions) },
    { id:'invoice-issue', label:'Émettre une facture', endpoint:'/api/angelcare360/operator/billing', entity:'invoice', operation:'issue', description:'Passer la facture de brouillon à émise.', fields:[field('id','Facture','select',{required:true,options:invoiceOptions})] },
    { id:'invoice-cancel', label:'Annuler une facture', endpoint:'/api/angelcare360/operator/billing', entity:'invoice', operation:'cancel', tone:'danger', confirmTitle:'Annulation financière', confirmMessage:'Vérifiez paiements, allocations, abonnement, audit et communication client.', fields:[field('id','Facture','select',{required:true,options:invoiceOptions}),field('reason','Motif et preuve','textarea',{required:true,rows:5})] },
    { id:'payment-record', label:'Enregistrer un paiement', endpoint:'/api/angelcare360/operator/billing', entity:'payment', operation:'record', tone:'primary', description:'Tracer référence, preuve, montant, méthode et allocation.', fields:[field('clientId','Client','select',{required:true,options:clientOptions}),field('invoiceId','Facture','select',{options:invoiceOptions}),field('paymentReference','Référence','text',{required:true}),field('paymentDate','Date','date',{required:true}),field('amountMad','Montant Dh','number',{required:true}),field('method','Méthode','select',{required:true,options:options([['Virement','bank_transfer'],['Espèces','cash'],['Chèque','cheque'],['Carte manuelle','card_manual'],['Autre','other']])}),field('status','Statut','select',{required:true,options:options([['En attente','pending'],['Confirmé','confirmed'],['Rejeté','rejected'],['Remboursé','refunded'],['Annulé','cancelled']])}),field('receivedBy','Reçu par'),field('notes','Preuve / notes','textarea',{rows:5})] },
    { id:'payment-confirm', label:'Confirmer un paiement', endpoint:'/api/angelcare360/operator/billing', entity:'payment', operation:'confirm', description:'Valider la preuve et ses effets financiers.', fields:[field('id','Paiement','select',{required:true,options:paymentOptions})] },
    { id:'payment-reject', label:'Rejeter un paiement', endpoint:'/api/angelcare360/operator/billing', entity:'payment', operation:'reject', tone:'danger', confirmTitle:'Rejet de preuve', confirmMessage:'Le paiement ne sera pas reconnu. Vérifiez l’impact sur la facture, le client et le gate de service.', fields:[field('id','Paiement','select',{required:true,options:paymentOptions}),field('reason','Motif du rejet','textarea',{required:true,rows:5})] },
    { id:'dunning-create', label:'Ouvrir un recouvrement', endpoint:'/api/angelcare360/operator/billing', entity:'dunning', operation:'create', description:'Créer une intervention avec échéance, owner et preuve.', fields:[field('clientId','Client','select',{required:true,options:clientOptions}),field('invoiceId','Facture','select',{options:invoiceOptions}),field('actionType','Type intervention','text',{required:true}),field('status','Statut','select',{required:true,options:options([['Planifiée','planned'],['En cours','in_progress'],['Terminée','completed'],['Bloquée','blocked'],['Annulée','cancelled']])}),field('dueDate','Échéance','date'),field('notes','Plan, engagement et preuve','textarea',{rows:5})] },
    { id:'dunning-complete', label:'Clôturer une action de recouvrement', endpoint:'/api/angelcare360/operator/billing', entity:'dunning', operation:'complete', description:'Marquer l’action exécutée tout en conservant la vérification du résultat financier.', fields:[field('id','Action de recouvrement','select',{required:true,options:dunningOptions})] },
    { id:'contract-status', label:'Faire évoluer un contrat', endpoint:'/api/angelcare360/operator/contracts', operation:'status', description:'Synchroniser l’état contractuel avec la chaîne de revenu.', fields:[field('id','Contrat','select',{required:true,options:contractOptions}),field('status','Nouvel état','select',{required:true,options:CONTRACT_STATUS})] },
    { id:'renewal-status', label:'Mettre à jour le renouvellement', endpoint:'/api/angelcare360/operator/renewals', operation:'status', description:'Piloter valeur retenue, perdue ou en négociation.', fields:[field('id','Renouvellement','select',{required:true,options:renewalOptions}),field('status','Nouvel état','select',{required:true,options:RENEWAL_STATUS})] },
  ]

  if (snapshot.tower === 'service') return [
    { id:'onboarding-create', label:'Créer une mission d’activation', endpoint:'/api/angelcare360/operator/onboarding', operation:'create', tone:'primary', description:'Lancer configuration, formation, données, validation ou go-live.', fields:onboardingFields },
    { id:'onboarding-update', label:'Piloter une mission d’activation', endpoint:'/api/angelcare360/operator/onboarding', operation:'update', description:'Modifier owner, état, priorité, échéance et preuve.', fields:[field('id','Mission','select',{required:true,options:onboardingOptions}),...onboardingFields] },
    { id:'onboarding-complete', label:'Valider une mission d’activation', endpoint:'/api/angelcare360/operator/onboarding', operation:'complete', description:'Clôturer l’action opérationnelle après vérification.', fields:[field('id','Mission','select',{required:true,options:onboardingOptions})] },
    { id:'ticket-create', label:'Créer un ticket support', endpoint:'/api/angelcare360/operator/support', operation:'create', tone:'primary', description:'Qualifier contexte, impact, priorité, owner et résultat attendu.', fields:[field('clientId','Client','select',{required:true,options:clientOptions}),field('tenantId','Tenant','select',{options:tenantOptions}),field('subject','Sujet','text',{required:true}),field('description','Description opérationnelle','textarea',{required:true,rows:6}),field('category','Catégorie','text',{required:true}),field('priority','Priorité','select',{required:true,options:PRIORITY}),field('status','Statut','select',{required:true,options:SUPPORT_STATUS}),field('assignedTo','Assigné à'),field('resolutionSummary','Résolution attendue','textarea',{rows:3})] },
    { id:'ticket-assign', label:'Assigner un ticket', endpoint:'/api/angelcare360/operator/support', operation:'assign', description:'Nommer le responsable de résolution.', fields:[field('id','Ticket','select',{required:true,options:ticketOptions}),field('assignedTo','Responsable','text',{required:true})] },
    { id:'ticket-status', label:'Faire évoluer un ticket', endpoint:'/api/angelcare360/operator/support', operation:'status', description:'Contrôler son cycle et tracer le motif.', fields:[field('id','Ticket','select',{required:true,options:ticketOptions}),field('status','Nouvel état','select',{required:true,options:SUPPORT_STATUS}),field('reason','Motif / dépendance','textarea',{rows:4})] },
    { id:'ticket-resolve', label:'Résoudre un ticket', endpoint:'/api/angelcare360/operator/support', operation:'resolve', description:'Décrire précisément la résolution et sa preuve.', fields:[field('id','Ticket','select',{required:true,options:ticketOptions}),field('resolutionSummary','Résolution et preuve','textarea',{required:true,rows:6})] },
    { id:'request-create', label:'Créer une demande de service', endpoint:'/api/angelcare360/operator/service', entity:'request', operation:'create', description:'Ouvrir une demande structurée hors incident.', fields:requestFields },
    { id:'request-update', label:'Configurer une demande de service', endpoint:'/api/angelcare360/operator/service', entity:'request', operation:'update', description:'Mettre à jour owner, état, priorité et échéance.', fields:[field('id','Demande','select',{required:true,options:requestOptions}),...requestFields] },
    { id:'request-complete', label:'Terminer une demande de service', endpoint:'/api/angelcare360/operator/service', entity:'request', operation:'complete', description:'Clôturer l’exécution en conservant l’audit.', fields:[field('id','Demande','select',{required:true,options:requestOptions})] },
    { id:'incident-create', label:'Ouvrir un Incident War Room', endpoint:'/api/angelcare360/operator/service', entity:'incident', operation:'create', tone:'danger', description:'Établir commandement, impact, sévérité et chronologie.', fields:[field('clientId','Client','select',{options:clientOptions}),field('tenantId','Tenant','select',{options:tenantOptions}),field('severity','Sévérité','select',{required:true,options:options([['Basse','low'],['Moyenne','medium'],['Élevée','high'],['Critique','critical']])}),field('status','Statut','select',{required:true,options:options([['Ouvert','open'],['Investigation','investigating'],['Stabilisé','mitigated'],['Résolu','resolved'],['Archivé','archived']])}),field('title','Titre','text',{required:true}),field('description','Situation, impact et première réponse','textarea',{required:true,rows:6}),field('startedAt','Début','date')] },
    { id:'incident-resolve', label:'Déclarer la résolution d’un incident', endpoint:'/api/angelcare360/operator/service', entity:'incident', operation:'resolve', tone:'danger', confirmTitle:'Clôture d’incident', confirmMessage:'Confirmez service restauré, clients informés, risques résiduels et actions post-incident.', fields:[field('id','Incident','select',{required:true,options:incidentOptions})] },
    { id:'task-create', label:'Créer une action service', endpoint:'/api/angelcare360/operator/service', entity:'task', operation:'create', description:'Créer une action assignée, datée et reliée au bon contexte.', fields:taskFields },
    { id:'task-update', label:'Configurer une action service', endpoint:'/api/angelcare360/operator/service', entity:'task', operation:'update', description:'Modifier owner, dépendances, état et échéance.', fields:[field('id','Action','select',{required:true,options:taskOptions}),...taskFields] },
    { id:'task-complete', label:'Terminer une action service', endpoint:'/api/angelcare360/operator/service', entity:'task', operation:'complete', description:'Marquer l’action exécutée; le résultat métier reste vérifiable séparément.', fields:[field('id','Action','select',{required:true,options:taskOptions})] },
    { id:'service-note', label:'Ajouter une note de service', endpoint:'/api/angelcare360/operator/service', entity:'note', operation:'create', description:'Tracer une observation, une instruction ou une preuve.', fields:[field('clientId','Client','select',{options:clientOptions}),field('tenantId','Tenant','select',{options:tenantOptions}),field('noteType','Type','text',{required:true}),field('body','Contenu','textarea',{required:true,rows:6}),field('visibility','Visibilité','select',{required:true,options:options([['Interne','internal'],['Restreinte','restricted'],['Publique autorisée','public']])})] },
  ]

  if (snapshot.tower === 'platform') return [
    { id:'feature-update', label:'Gouverner un feature flag', endpoint:'/api/angelcare360/operator/features', entity:'flag', operation:'update', tone:'primary', description:'Contrôler capacité, verrou, état et activation planifiée.', fields:[field('id','Feature','select',{required:true,options:featureOptions}),field('enabled','Activé','select',{required:true,options:options([['Oui','true'],['Non','false']])}),field('status','Statut','select',{required:true,options:options([['Activé','enabled'],['Désactivé','disabled'],['Verrouillé','locked'],['Planifié','scheduled'],['Configuration requise','requires_configuration']])}),field('lockedReason','Justification','textarea',{rows:5}),field('scheduledFor','Activation planifiée','date')] },
    { id:'limit-update', label:'Gouverner une limite', endpoint:'/api/angelcare360/operator/features', entity:'usage', operation:'update', description:'Contrôler consommation, capacité et cycle.', fields:[field('id','Limite','select',{required:true,options:limitOptions}),field('allowedValue','Autorisé','number'),field('currentValue','Consommé','number'),field('status','Statut','select',{required:true,options:options([['Active','active'],['En pause','paused'],['Archivée','archived']])}),field('resetCycle','Cycle')] },
    locked('role-simulator','Simuler une autorité','Le backend signé ne publie pas encore de moteur de rôles/autorités avec dry-run. La surface reste explicitement non exécutable.'),
    locked('policy-impact','Prévisualiser une politique','La persistance et la simulation de politiques ne sont pas encore exposées par une API Operator sûre.'),
    locked('automation-dry-run','Dry-run d’automatisation','Le moteur auditable d’automatisation n’existe pas encore dans le backend signé.'),
    locked('release-control','Planifier une release tenant','Aucun moteur de release multi-tenant ni rollback applicatif n’est publié dans le contrat actuel.'),
  ]

  return [
    locked('executive-decision','Enregistrer une décision exécutive','La persistance des décisions, conditions et approbations n’est pas présente dans le backend signé.'),
    locked('scenario-lab','Ouvrir le laboratoire stratégique','Le moteur de scénarios région, capacité, pricing et attrition n’est pas encore publié.'),
    locked('global-expansion','Créer une mission d’expansion mondiale','La couche multi-pays, multi-entités et devises nécessite une extension backend/SQL dédiée et sécurisée.'),
  ]
}

function planFields(): Angelcare360OperatorFormFieldConfig[] {
  return [
    field('planCode','Code plan','text',{required:true}),field('name','Nom du plan','text',{required:true}),field('description','Positionnement','textarea',{rows:4}),
    field('monthlyPriceMad','Prix mensuel Dh','number',{required:true}),field('annualPriceMad','Prix annuel Dh','number',{required:true}),field('billingCycle','Cycle','text',{required:true}),
    field('maxStudents','Étudiants maximum','number'),field('maxStaff','Personnel maximum','number'),field('maxUsers','Utilisateurs maximum','number'),field('maxSites','Sites maximum','number'),
    field('includedModules','Modules inclus (séparés par virgules)','textarea',{rows:3}),field('includedFeatures','Fonctionnalités incluses (séparées par virgules)','textarea',{rows:3}),field('supportLevel','Niveau support'),
    field('status','Statut','select',{required:true,options:PLAN_STATUS}),
  ]
}
function packageFields(): Angelcare360OperatorFormFieldConfig[] {
  return [field('packageCode','Code package','text',{required:true}),field('name','Nom','text',{required:true}),field('description','Description','textarea',{rows:4}),field('moduleKeys','Modules (séparés par virgules)','textarea',{rows:3}),field('featureKeys','Fonctionnalités (séparées par virgules)','textarea',{rows:3}),field('status','Statut','select',{required:true,options:PLAN_STATUS})]
}
function billingFields(clientOptions: Array<{value:string;label:string}>): Angelcare360OperatorFormFieldConfig[] {
  return [field('clientId','Client','select',{required:true,options:clientOptions}),field('billingName','Nom de facturation','text',{required:true}),field('billingEmail','Email','text',{required:true}),field('billingPhone','Téléphone'),field('billingAddress','Adresse','textarea',{rows:3}),field('taxIdentifier','Identifiant fiscal'),field('paymentTermsDays','Délai de paiement (jours)','number'),field('status','Statut','select',{required:true,options:options([['Actif','active'],['Inactif','inactive'],['Archivé','archived']])})]
}
function invoiceFields(clientOptions:Array<{value:string;label:string}>, subscriptionOptions:Array<{value:string;label:string}>, billingOptions:Array<{value:string;label:string}>): Angelcare360OperatorFormFieldConfig[] {
  return [field('clientId','Client','select',{required:true,options:clientOptions}),field('subscriptionId','Abonnement','select',{options:subscriptionOptions}),field('billingAccountId','Compte de facturation','select',{options:billingOptions}),field('invoiceNumber','Numéro','text',{required:true}),field('issueDate','Émission','date',{required:true}),field('dueDate','Échéance','date',{required:true}),field('periodStart','Début période','date'),field('periodEnd','Fin période','date'),field('subtotalMad','Sous-total Dh','number',{required:true}),field('discountMad','Remise Dh','number'),field('totalMad','Total Dh','number',{required:true}),field('amountPaidMad','Déjà payé Dh','number'),field('balanceDueMad','Solde Dh','number'),field('status','Statut','select',{required:true,options:options([['Brouillon','draft'],['Émise','issued'],['Partiellement payée','partially_paid'],['Payée','paid'],['En retard','overdue'],['Annulée','cancelled'],['Archivée','archived']])}),field('notes','Notes','textarea',{rows:4})]
}
function locked(id:string,label:string,reason:string):Angelcare360OperatorActionDescriptor {
  return { id, label, endpoint:'/api/angelcare360/operator/settings', operation:'unavailable', lockedReason:reason, description:reason, fields:[] }
}

function groupsFor(tower: SovereignWorkspaceSnapshot['tower'], actions: Angelcare360OperatorActionDescriptor[]) {
  const labels: Record<SovereignWorkspaceSnapshot['tower'], string[]> = {
    direction:['Stratégie & gouvernance','Expansion & scénarios'], growth:['Portefeuille & relation','Contrats & rétention'], tenants:['Flotte & abonnement','Produit & capacité'], revenue:['Facturation & cash','Recouvrement & contrat'], service:['Activation & assistance','Incidents & exécution'], platform:['Produit & limites','Autorité & automatisation'],
  }
  const ids = actions.map((action) => action.id)
  const split = Math.ceil(ids.length / 2)
  return [
    { title:labels[tower][0], description:'Commandes principales du domaine souverain.', actionIds:ids.slice(0,split) },
    { title:labels[tower][1], description:'Contrôles complémentaires, sensibles ou verrouillés.', actionIds:ids.slice(split) },
  ]
}
