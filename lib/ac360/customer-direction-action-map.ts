import type { DirectionTone, DirectionViewKey } from './customer-direction-cockpit-model'

export type DirectionActionModalType =
  | 'period_selector'
  | 'site_selector'
  | 'alert_center'
  | 'command_palette'
  | 'create_action'
  | 'launch_control'
  | 'risk_register'
  | 'report_center'
  | 'export_center'
  | 'report_builder'
  | 'detail_drawer'
  | 'decision_approval'
  | 'escalation_drawer'
  | 'mobile_quick_action'
  | 'success_proof'

export type DirectionActionOperation =
  | 'direction_context.period.update'
  | 'direction_context.scope.update'
  | 'direction_alert.center.open'
  | 'direction_command.palette.open'
  | 'direction_action.create'
  | 'control.launch'
  | 'risk.create'
  | 'report.queue'
  | 'export.queue'
  | 'decision.update'
  | 'escalation.open'

export type DirectionActionExecutionMode = 'local_context' | 'governed_api' | 'readonly_drawer'

export type DirectionActionField = {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'date' | 'toggle'
  required?: boolean
  placeholder?: string
  options?: string[]
  defaultValue?: string | boolean
  help?: string
}

export type DirectionActionStep = {
  title: string
  description: string
  tone: DirectionTone
  items: string[]
}

export type DirectionActionDefinition = {
  id: string
  label: string
  modalType: DirectionActionModalType
  operation: DirectionActionOperation
  executionMode: DirectionActionExecutionMode
  purpose: string
  module: string
  priority: 'low' | 'normal' | 'high' | 'critical'
  submitLabel: string
  successTitle: string
  successMessage: string
  proofLabel: string
  entitlementLabel: string
  fields: DirectionActionField[]
  steps: DirectionActionStep[]
  previewCards: Array<{ label: string; value: string; tone: DirectionTone }>
  recommendedNextActions: string[]
}

const commonSteps: DirectionActionStep[] = [
  {
    title: 'Droits & responsabilité',
    description: 'La plateforme vérifie le rôle utilisateur, le périmètre et le responsable attendu avant lancement.',
    tone: 'emerald',
    items: ['Rôle direction confirmé', 'Périmètre école/site identifié', 'Traçabilité utilisateur activée'],
  },
  {
    title: 'Plan, usage & restrictions',
    description: 'Les actions sensibles restent guidées selon le plan actif, les modules disponibles et les limites du compte.',
    tone: 'blue',
    items: ['Plan actif vérifié', 'Usage estimé avant exécution', 'Blocage lisible si restriction active'],
  },
  {
    title: 'Preuve & historique',
    description: 'Chaque opération vendable retourne une référence de preuve et alimente le journal de pilotage.',
    tone: 'amber',
    items: ['Preuve générée', 'Historique direction enrichi', 'Rafraîchissement du cockpit'],
  },
]

const localContextOperations = new Set<DirectionActionOperation>([
  'direction_context.period.update',
  'direction_context.scope.update',
])

function def(input: Omit<DirectionActionDefinition, 'steps' | 'executionMode'> & { steps?: DirectionActionStep[]; executionMode?: DirectionActionExecutionMode }): DirectionActionDefinition {
  return {
    ...input,
    executionMode: input.executionMode || (localContextOperations.has(input.operation) ? 'local_context' : 'governed_api'),
    steps: input.steps || commonSteps,
  }
}

export const directionActionCatalog: DirectionActionDefinition[] = [
  def({
    id: 'topbar.period.change',
    label: 'Changer période de pilotage',
    modalType: 'period_selector',
    operation: 'direction_context.period.update',
    purpose: 'Adapter tous les indicateurs, tableaux, alertes et rapports à une période de pilotage claire.',
    module: 'Contexte de pilotage',
    priority: 'normal',
    submitLabel: 'Appliquer la période',
    successTitle: 'Période appliquée',
    successMessage: 'Le cockpit est recalculé sur la période sélectionnée avec conservation des filtres de direction.',
    proofLabel: 'Trace de changement de période',
    entitlementLabel: 'Inclus dans le pilotage directionnel',
    fields: [
      { key: 'periodPreset', label: 'Période rapide', type: 'select', options: ['Aujourd’hui', 'Cette semaine', 'Ce mois', 'Trimestre en cours', 'Année scolaire'], defaultValue: 'Ce mois', required: true },
      { key: 'compareWith', label: 'Comparer avec', type: 'select', options: ['Mois précédent', 'Même période année précédente', 'Objectif annuel', 'Aucune comparaison'], defaultValue: 'Mois précédent' },
      { key: 'customStart', label: 'Date début personnalisée', type: 'date' },
      { key: 'customEnd', label: 'Date fin personnalisée', type: 'date' },
    ],
    previewCards: [
      { label: 'Impact', value: 'KPIs, graphes, exports', tone: 'blue' },
      { label: 'Comparaison', value: 'Activée si sélectionnée', tone: 'emerald' },
      { label: 'Preuve', value: 'Historique de filtre', tone: 'amber' },
    ],
    recommendedNextActions: ['Comparer les sites faibles', 'Exporter la vue recalculée', 'Créer une note directionnelle'],
  }),
  def({
    id: 'topbar.site.scope',
    label: 'Changer périmètre multi-sites',
    modalType: 'site_selector',
    operation: 'direction_context.scope.update',
    purpose: 'Définir le réseau, les villes, les crèches ou les groupes de sites à piloter dans le cockpit.',
    module: 'Périmètre réseau',
    priority: 'normal',
    submitLabel: 'Appliquer le périmètre',
    successTitle: 'Périmètre appliqué',
    successMessage: 'Le cockpit affiche maintenant le périmètre choisi avec une lecture consolidée et comparable.',
    proofLabel: 'Trace de périmètre',
    entitlementLabel: 'Inclus dans le pilotage multi-sites',
    fields: [
      { key: 'scopeMode', label: 'Mode de sélection', type: 'select', options: ['Tous les sites', 'Par ville', 'Sites spécifiques', 'Groupe sauvegardé'], defaultValue: 'Tous les sites', required: true },
      { key: 'city', label: 'Ville', type: 'select', options: ['Casablanca', 'Rabat', 'Tanger', 'Marrakech', 'Fès', 'Agadir', 'Kénitra', 'Témara'], defaultValue: 'Tous' },
      { key: 'compareSites', label: 'Activer comparaison entre sites', type: 'toggle', defaultValue: true },
      { key: 'saveView', label: 'Sauvegarder comme vue direction', type: 'toggle', defaultValue: false },
    ],
    previewCards: [
      { label: 'Sites', value: '14 crèches', tone: 'blue' },
      { label: 'Mode', value: 'Consolidé + comparatif', tone: 'emerald' },
      { label: 'Sortie', value: 'Vue direction sauvegardable', tone: 'violet' },
    ],
    recommendedNextActions: ['Voir performance par site', 'Lancer contrôle réseau', 'Planifier rapport multi-sites'],
  }),
  def({
    id: 'topbar.alerts.center',
    label: 'Ouvrir alertes critiques',
    modalType: 'alert_center',
    operation: 'direction_alert.center.open',
    purpose: 'Centraliser les alertes critiques et les transformer en actions, escalades ou décisions suivies.',
    module: 'Centre d’alertes',
    priority: 'high',
    submitLabel: 'Créer suivi des alertes',
    successTitle: 'Alertes prises en charge',
    successMessage: 'Les alertes sélectionnées sont converties en suivi directionnel avec preuve et responsable.',
    proofLabel: 'Journal des alertes traitées',
    entitlementLabel: 'Inclus dans le cockpit directionnel',
    fields: [
      { key: 'alertType', label: 'Type d’alerte', type: 'select', options: ['Toutes', 'Finance', 'ParentTrust', 'RH', 'Sécurité', 'Transport', 'Admissions'], defaultValue: 'Toutes' },
      { key: 'severity', label: 'Gravité minimale', type: 'select', options: ['Critique', 'Élevée', 'À surveiller', 'Information'], defaultValue: 'Élevée' },
      { key: 'owner', label: 'Responsable', type: 'select', options: ['Direction', 'Responsable finance', 'Responsable opérations', 'Responsable ParentTrust', 'Responsable qualité'], defaultValue: 'Direction' },
      { key: 'actionMode', label: 'Action', type: 'select', options: ['Assigner', 'Escalader', 'Marquer suivi', 'Créer décision'], defaultValue: 'Assigner' },
    ],
    previewCards: [
      { label: 'Alertes', value: '8 en attention', tone: 'rose' },
      { label: 'Traitement', value: 'Assignation + suivi', tone: 'amber' },
      { label: 'Preuve', value: 'Journal d’alerte', tone: 'blue' },
    ],
    recommendedNextActions: ['Escalader les alertes critiques', 'Créer actions groupées', 'Générer rapport des alertes'],
  }),
  def({
    id: 'topbar.quick.command',
    label: 'Action rapide direction',
    modalType: 'command_palette',
    operation: 'direction_command.palette.open',
    purpose: 'Lancer rapidement une action stratégique depuis une palette de commandes directionnelles.',
    module: 'Commandes Direction',
    priority: 'high',
    submitLabel: 'Lancer la commande',
    successTitle: 'Commande lancée',
    successMessage: 'La commande a été créée avec suivi, responsable et preuve de traitement.',
    proofLabel: 'Référence commande',
    entitlementLabel: 'Commandes disponibles selon le plan actif',
    fields: [
      { key: 'commandSearch', label: 'Rechercher une commande', type: 'text', placeholder: 'Ex : relance impayés, contrôle sécurité, rapport direction…' },
      { key: 'commandType', label: 'Commande suggérée', type: 'select', options: ['Créer action', 'Déclarer risque', 'Lancer contrôle', 'Générer rapport', 'Planifier export', 'Escalader incident'], defaultValue: 'Créer action' },
      { key: 'priority', label: 'Priorité', type: 'select', options: ['Normale', 'Haute', 'Critique'], defaultValue: 'Haute' },
    ],
    previewCards: [
      { label: 'Mode', value: 'Commande intelligente', tone: 'blue' },
      { label: 'Couverture', value: 'Finance, ops, parents, RH', tone: 'emerald' },
      { label: 'Sortie', value: 'Action ou workflow', tone: 'violet' },
    ],
    recommendedNextActions: ['Créer une action de suivi', 'Lancer un contrôle qualité', 'Planifier un rapport direction'],
  }),
  def({
    id: 'header.create.action',
    label: 'Créer une action direction',
    modalType: 'create_action',
    operation: 'direction_action.create',
    purpose: 'Créer une action directionnelle assignée, priorisée, datée et reliée à une preuve attendue.',
    module: 'Actions Direction',
    priority: 'normal',
    submitLabel: 'Créer et assigner',
    successTitle: 'Action créée',
    successMessage: 'L’action est créée, assignée et disponible dans le suivi de direction.',
    proofLabel: 'Référence action',
    entitlementLabel: 'Inclus selon droits de direction',
    fields: [
      { key: 'title', label: 'Titre de l’action', type: 'text', required: true, placeholder: 'Ex : Relancer les créances prioritaires' },
      { key: 'moduleConcerned', label: 'Module concerné', type: 'select', options: ['Cockpit Direction', 'Finance', 'Admissions', 'Opérations', 'ParentTrust', 'RH', 'Sécurité', 'Transport'], defaultValue: 'Cockpit Direction' },
      { key: 'owner', label: 'Responsable', type: 'select', options: ['Direction', 'Finance', 'Opérations', 'Admissions', 'ParentTrust', 'Qualité', 'RH'], defaultValue: 'Direction' },
      { key: 'deadline', label: 'Échéance', type: 'date' },
      { key: 'impact', label: 'Impact attendu', type: 'select', options: ['Finance', 'Parent', 'Opération', 'Sécurité', 'Croissance', 'Gouvernance'], defaultValue: 'Opération' },
      { key: 'notes', label: 'Notes directionnelles', type: 'textarea', placeholder: 'Contexte, décision, consignes, preuve attendue…' },
    ],
    previewCards: [
      { label: 'Suivi', value: 'Responsable + échéance', tone: 'blue' },
      { label: 'Preuve', value: 'Attendue à la clôture', tone: 'amber' },
      { label: 'Gouvernance', value: 'Historique direction', tone: 'emerald' },
    ],
    recommendedNextActions: ['Assigner au responsable', 'Ajouter une preuve attendue', 'Planifier un rappel'],
  }),
  def({
    id: 'header.launch.control',
    label: 'Lancer un contrôle',
    modalType: 'launch_control',
    operation: 'control.launch',
    purpose: 'Démarrer un contrôle directionnel sur un périmètre, avec grille, responsable, échéance et preuve attendue.',
    module: 'Contrôles Direction',
    priority: 'high',
    submitLabel: 'Lancer le contrôle',
    successTitle: 'Contrôle lancé',
    successMessage: 'Le contrôle est ouvert avec grille, responsable et suivi de preuve.',
    proofLabel: 'Référence contrôle',
    entitlementLabel: 'Contrôles selon modules actifs',
    fields: [
      { key: 'controlType', label: 'Type de contrôle', type: 'select', options: ['Finance', 'Présence', 'Qualité', 'Sécurité', 'ParentTrust', 'RH', 'Transport'], defaultValue: 'Qualité' },
      { key: 'scope', label: 'Périmètre', type: 'select', options: ['Réseau complet', 'Site sélectionné', 'Classe / groupe', 'Dossier spécifique'], defaultValue: 'Réseau complet' },
      { key: 'owner', label: 'Responsable contrôle', type: 'select', options: ['Direction', 'Responsable qualité', 'Responsable finance', 'Responsable opérations'], defaultValue: 'Responsable qualité' },
      { key: 'deadline', label: 'Échéance', type: 'date' },
      { key: 'checklist', label: 'Points à vérifier', type: 'textarea', placeholder: 'Liste des points, preuves attendues, anomalies à confirmer…' },
    ],
    previewCards: [
      { label: 'Grille', value: 'Contrôle structuré', tone: 'blue' },
      { label: 'SLA', value: 'Échéance suivie', tone: 'amber' },
      { label: 'Preuve', value: 'Rapport de contrôle', tone: 'emerald' },
    ],
    recommendedNextActions: ['Assigner vérificateur', 'Exporter la grille', 'Planifier revue direction'],
  }),
  def({
    id: 'risk.create',
    label: 'Déclarer un risque opérationnel',
    modalType: 'risk_register',
    operation: 'risk.create',
    purpose: 'Créer un risque suivi avec gravité, probabilité, impact, responsable et plan de mitigation.',
    module: 'Registre des risques',
    priority: 'high',
    submitLabel: 'Créer le risque',
    successTitle: 'Risque créé',
    successMessage: 'Le risque est ajouté au registre directionnel avec plan de suivi.',
    proofLabel: 'Référence risque',
    entitlementLabel: 'Registre des risques directionnel',
    fields: [
      { key: 'riskTitle', label: 'Titre du risque', type: 'text', required: true, placeholder: 'Ex : retards transport répétés' },
      { key: 'category', label: 'Catégorie', type: 'select', options: ['Finance', 'Parents', 'RH', 'Sécurité', 'Transport', 'Conformité', 'Admissions'], defaultValue: 'Opération' },
      { key: 'severity', label: 'Gravité', type: 'select', options: ['Faible', 'Modérée', 'Élevée', 'Critique'], defaultValue: 'Élevée' },
      { key: 'probability', label: 'Probabilité', type: 'select', options: ['Faible', 'Moyenne', 'Élevée'], defaultValue: 'Moyenne' },
      { key: 'owner', label: 'Responsable', type: 'select', options: ['Direction', 'Qualité', 'Opérations', 'Finance', 'ParentTrust'], defaultValue: 'Direction' },
      { key: 'mitigation', label: 'Plan de mitigation', type: 'textarea', placeholder: 'Actions préventives, correctives, échéance, preuve attendue…' },
    ],
    previewCards: [
      { label: 'Évaluation', value: 'Gravité + probabilité', tone: 'rose' },
      { label: 'Mitigation', value: 'Plan obligatoire', tone: 'amber' },
      { label: 'Suivi', value: 'Responsable nommé', tone: 'blue' },
    ],
    recommendedNextActions: ['Créer action de mitigation', 'Planifier contrôle', 'Informer responsable'],
  }),
  def({
    id: 'report.center',
    label: 'Ouvrir un rapport',
    modalType: 'report_center',
    operation: 'report.queue',
    purpose: 'Préparer un rapport directionnel avec modèle, période, périmètre, aperçu A4 et destinataires.',
    module: 'Rapports Direction',
    priority: 'normal',
    submitLabel: 'Préparer le rapport',
    successTitle: 'Rapport préparé',
    successMessage: 'Le rapport est ajouté au pipeline avec format, périmètre et preuve de génération.',
    proofLabel: 'Référence rapport',
    entitlementLabel: 'Rapports selon plan et add-ons actifs',
    fields: [
      { key: 'reportModel', label: 'Modèle', type: 'select', options: ['Tableau de bord exécutif', 'Rapport financier consolidé', 'Rapport qualité & sécurité', 'Rapport RH & social', 'Rapport opérations', 'Rapport admissions'], defaultValue: 'Tableau de bord exécutif' },
      { key: 'period', label: 'Période', type: 'select', options: ['Ce mois', 'Trimestre', 'Année scolaire', 'Personnalisée'], defaultValue: 'Ce mois' },
      { key: 'format', label: 'Format', type: 'select', options: ['PDF A4', 'XLSX', 'CSV', 'Board Pack'], defaultValue: 'PDF A4' },
      { key: 'recipients', label: 'Destinataires', type: 'text', placeholder: 'Direction, finance, conseil, partenaire…' },
      { key: 'includeProof', label: 'Inclure preuves & historique', type: 'toggle', defaultValue: true },
    ],
    previewCards: [
      { label: 'Aperçu', value: 'A4 prêt', tone: 'blue' },
      { label: 'Périmètre', value: 'Sites + période', tone: 'emerald' },
      { label: 'Sortie', value: 'PDF / Board pack', tone: 'violet' },
    ],
    recommendedNextActions: ['Prévisualiser A4', 'Planifier export', 'Envoyer au comité'],
  }),
  def({
    id: 'export.center',
    label: 'Planifier export directionnel',
    modalType: 'export_center',
    operation: 'export.queue',
    purpose: 'Exporter ou planifier une extraction propre de la vue, des preuves ou des packs directionnels.',
    module: 'Exports Direction',
    priority: 'normal',
    submitLabel: 'Planifier l’export',
    successTitle: 'Export planifié',
    successMessage: 'L’export est ajouté à la file avec périmètre, format et preuve.',
    proofLabel: 'Référence export',
    entitlementLabel: 'Exports selon droits et plan actif',
    fields: [
      { key: 'exportScope', label: 'Contenu à exporter', type: 'select', options: ['Vue actuelle', 'Toutes les sections', 'Preuves seulement', 'Données filtrées', 'Pack complet direction'], defaultValue: 'Vue actuelle' },
      { key: 'format', label: 'Format', type: 'select', options: ['PDF', 'XLSX', 'CSV', 'ZIP preuves'], defaultValue: 'PDF' },
      { key: 'frequency', label: 'Fréquence', type: 'select', options: ['Maintenant', 'Chaque jour', 'Chaque semaine', 'Chaque mois'], defaultValue: 'Maintenant' },
      { key: 'includeComments', label: 'Inclure commentaires direction', type: 'toggle', defaultValue: true },
    ],
    previewCards: [
      { label: 'Format', value: 'PDF / XLSX / CSV', tone: 'blue' },
      { label: 'Preuves', value: 'Option incluses', tone: 'amber' },
      { label: 'Planification', value: 'Possible', tone: 'emerald' },
    ],
    recommendedNextActions: ['Télécharger le fichier', 'Envoyer par email', 'Archiver la preuve'],
  }),
  def({
    id: 'report.builder',
    label: 'Construire un rapport directionnel',
    modalType: 'report_builder',
    operation: 'report.queue',
    purpose: 'Composer un rapport exécutif ou board pack à partir de sections pilotées et gouvernées.',
    module: 'Générateur de rapports',
    priority: 'normal',
    submitLabel: 'Générer le rapport',
    successTitle: 'Génération lancée',
    successMessage: 'Le rapport est généré avec sections, période, destinataires et preuve.',
    proofLabel: 'Référence génération',
    entitlementLabel: 'Générateur disponible selon plan actif',
    fields: [
      { key: 'template', label: 'Template', type: 'select', options: ['Tableau de bord exécutif', 'Finance consolidée', 'Qualité & sécurité', 'ParentTrust', 'Admissions', 'RH & social'], defaultValue: 'Tableau de bord exécutif' },
      { key: 'sections', label: 'Sections incluses', type: 'textarea', defaultValue: 'Synthèse, KPIs, risques, décisions, preuves, recommandations' },
      { key: 'period', label: 'Période', type: 'select', options: ['Ce mois', 'Trimestre', 'Année scolaire'], defaultValue: 'Ce mois' },
      { key: 'sendTo', label: 'Destinataires', type: 'text', placeholder: 'Direction, conseil, finance…' },
    ],
    previewCards: [
      { label: 'Template', value: 'A4 premium', tone: 'blue' },
      { label: 'Sections', value: 'Configurables', tone: 'violet' },
      { label: 'Trace', value: 'Gouvernée', tone: 'emerald' },
    ],
    recommendedNextActions: ['Prévisualiser', 'Planifier envoi', 'Créer pack conseil'],
  }),
  def({
    id: 'detail.drawer',
    label: 'Ouvrir le détail',
    modalType: 'detail_drawer',
    operation: 'direction_action.create',
    purpose: 'Afficher un détail exploitable avec filtres, tableau, analyse, recommandations et actions liées.',
    module: 'Détail opérationnel',
    priority: 'normal',
    submitLabel: 'Créer action depuis ce détail',
    successTitle: 'Action de détail créée',
    successMessage: 'Une action de suivi a été créée depuis ce détail avec contexte et preuve.',
    proofLabel: 'Référence détail',
    entitlementLabel: 'Détail inclus dans le module actif',
    fields: [
      { key: 'filter', label: 'Filtre', type: 'select', options: ['Tous', 'Critiques', 'À surveiller', 'En retard', 'Validés'], defaultValue: 'Tous' },
      { key: 'owner', label: 'Responsable du suivi', type: 'select', options: ['Direction', 'Module concerné', 'Responsable site'], defaultValue: 'Module concerné' },
      { key: 'note', label: 'Note de suivi', type: 'textarea', placeholder: 'Pourquoi ce détail nécessite une action ?' },
    ],
    previewCards: [
      { label: 'Vue', value: 'Table + analyse', tone: 'blue' },
      { label: 'Action', value: 'Suivi possible', tone: 'emerald' },
      { label: 'Export', value: 'Disponible', tone: 'violet' },
    ],
    recommendedNextActions: ['Filtrer les risques', 'Assigner suivi', 'Exporter le détail'],
  }),
  def({
    id: 'decision.approval',
    label: 'Traiter une décision',
    modalType: 'decision_approval',
    operation: 'decision.update',
    purpose: 'Approuver, refuser, demander preuve ou escalader une décision de direction.',
    module: 'Décisions Direction',
    priority: 'high',
    submitLabel: 'Enregistrer la décision',
    successTitle: 'Décision enregistrée',
    successMessage: 'La décision est enregistrée avec statut, commentaire et preuve.',
    proofLabel: 'Référence décision',
    entitlementLabel: 'Validation selon rôle Direction',
    fields: [
      { key: 'decision', label: 'Décision', type: 'select', options: ['Approuver', 'Refuser', 'Demander preuve', 'Reporter', 'Escalader'], defaultValue: 'Approuver' },
      { key: 'comment', label: 'Commentaire direction', type: 'textarea', placeholder: 'Justification, conditions, consignes…' },
      { key: 'owner', label: 'Responsable de suite', type: 'select', options: ['Direction', 'Finance', 'Opérations', 'RH', 'Qualité'], defaultValue: 'Direction' },
    ],
    previewCards: [
      { label: 'Statut', value: 'Décision tracée', tone: 'blue' },
      { label: 'Preuve', value: 'Commentaire requis', tone: 'amber' },
      { label: 'Suite', value: 'Action possible', tone: 'emerald' },
    ],
    recommendedNextActions: ['Notifier responsable', 'Créer tâche de suite', 'Ajouter preuve'],
  }),
  def({
    id: 'escalation.open',
    label: 'Ouvrir une escalade',
    modalType: 'escalation_drawer',
    operation: 'escalation.open',
    purpose: 'Escalader un sujet critique avec niveau, responsable, délai de réponse et suivi directionnel.',
    module: 'Escalades Direction',
    priority: 'critical',
    submitLabel: 'Ouvrir l’escalade',
    successTitle: 'Escalade ouverte',
    successMessage: 'L’escalade est ouverte avec SLA, responsable et preuve.',
    proofLabel: 'Référence escalade',
    entitlementLabel: 'Escalade gouvernée selon droits actifs',
    fields: [
      { key: 'issue', label: 'Sujet à escalader', type: 'text', required: true, placeholder: 'Ex : réclamation parent critique' },
      { key: 'level', label: 'Niveau', type: 'select', options: ['Direction', 'Direction + Responsable module', 'Comité', 'AngelCare Success'], defaultValue: 'Direction + Responsable module' },
      { key: 'sla', label: 'Délai attendu', type: 'select', options: ['2h', '4h', '24h', '48h'], defaultValue: '24h' },
      { key: 'owner', label: 'Responsable', type: 'select', options: ['Direction', 'Qualité', 'Finance', 'ParentTrust', 'Opérations'], defaultValue: 'Direction' },
      { key: 'context', label: 'Contexte', type: 'textarea' },
    ],
    previewCards: [
      { label: 'Niveau', value: 'Escalade formelle', tone: 'rose' },
      { label: 'SLA', value: 'Délai suivi', tone: 'amber' },
      { label: 'Preuve', value: 'Journal escalade', tone: 'blue' },
    ],
    recommendedNextActions: ['Notifier responsable', 'Planifier point direction', 'Créer plan d’action'],
  }),
  def({
    id: 'mobile.quick',
    label: 'Action mobile direction',
    modalType: 'mobile_quick_action',
    operation: 'direction_action.create',
    purpose: 'Exécuter rapidement une validation, relance, escalade ou synthèse depuis le dock mobile.',
    module: 'Dock mobile direction',
    priority: 'normal',
    submitLabel: 'Exécuter depuis mobile',
    successTitle: 'Action mobile enregistrée',
    successMessage: 'L’action mobile est enregistrée avec preuve et synchronisation du cockpit.',
    proofLabel: 'Référence mobile',
    entitlementLabel: 'Inclus pour la direction',
    fields: [
      { key: 'mobileAction', label: 'Action', type: 'select', options: ['Valider', 'Relancer', 'Escalader', 'Rapport'], defaultValue: 'Valider' },
      { key: 'target', label: 'Cible', type: 'text', placeholder: 'Dossier, parent, site, action…' },
      { key: 'comment', label: 'Commentaire rapide', type: 'textarea' },
    ],
    previewCards: [
      { label: 'Mode', value: 'Mobile rapide', tone: 'blue' },
      { label: 'Preuve', value: 'Toujours gardée', tone: 'emerald' },
      { label: 'Synchronisation', value: 'Cockpit à jour', tone: 'violet' },
    ],
    recommendedNextActions: ['Ouvrir l’action créée', 'Notifier responsable', 'Voir journal mobile'],
  }),
]

export const defaultDirectionActionDefinition = directionActionCatalog.find((item) => item.id === 'header.create.action') || directionActionCatalog[0]

export function resolveDirectionActionDefinition(input?: {
  buttonId?: string
  modalType?: string
  operation?: string
  title?: string
  module?: string
  payload?: Record<string, unknown>
}): DirectionActionDefinition {
  const payload = input?.payload || {}
  const haystack = [
    input?.buttonId,
    input?.modalType,
    input?.operation,
    input?.title,
    input?.module,
    payload.modalType,
    payload.buttonId,
    payload.field,
    payload.drawer,
    payload.action,
    payload.report,
    payload.control,
    payload.exportType,
    payload.reportType,
    payload.mobileDock ? 'mobileDock' : '',
  ].filter(Boolean).join(' ').toLowerCase()

  if (haystack.includes('period') || haystack.includes('période') || haystack.includes('date_range')) return directionActionCatalog.find((item) => item.id === 'topbar.period.change') || defaultDirectionActionDefinition
  if (haystack.includes('site_scope') || haystack.includes('multi-sites') || haystack.includes('périmètre') || haystack.includes('entités') || haystack.includes('entities')) return directionActionCatalog.find((item) => item.id === 'topbar.site.scope') || defaultDirectionActionDefinition
  if (haystack.includes('alert') || haystack.includes('alerte')) return directionActionCatalog.find((item) => item.id === 'topbar.alerts.center') || defaultDirectionActionDefinition
  if (haystack.includes('quick_action') || haystack.includes('action rapide') || haystack.includes('command palette')) return directionActionCatalog.find((item) => item.id === 'topbar.quick.command') || defaultDirectionActionDefinition
  if (haystack.includes('risk') || haystack.includes('risque')) return directionActionCatalog.find((item) => item.id === 'risk.create') || defaultDirectionActionDefinition
  if (haystack.includes('control') || haystack.includes('contrôle') || haystack.includes('direction_check')) return directionActionCatalog.find((item) => item.id === 'header.launch.control') || defaultDirectionActionDefinition
  if (haystack.includes('report_model') || haystack.includes('report_period') || haystack.includes('report_entities') || haystack.includes('générer') || haystack.includes('préparer') || haystack.includes('rapport')) {
    if (haystack.includes('générer') || haystack.includes('préparer') || haystack.includes('reporttype')) return directionActionCatalog.find((item) => item.id === 'report.builder') || defaultDirectionActionDefinition
    return directionActionCatalog.find((item) => item.id === 'report.center') || defaultDirectionActionDefinition
  }
  if (haystack.includes('export') || haystack.includes('télécharger') || haystack.includes('download') || haystack.includes('board_pack')) return directionActionCatalog.find((item) => item.id === 'export.center') || defaultDirectionActionDefinition
  if (haystack.includes('mobile') || haystack.includes('dock')) return directionActionCatalog.find((item) => item.id === 'mobile.quick') || defaultDirectionActionDefinition
  if (haystack.includes('decision') || haystack.includes('décision') || haystack.includes('approve') || haystack.includes('valider')) return directionActionCatalog.find((item) => item.id === 'decision.approval') || defaultDirectionActionDefinition
  if (haystack.includes('escalade') || haystack.includes('escalation')) return directionActionCatalog.find((item) => item.id === 'escalation.open') || defaultDirectionActionDefinition
  if (haystack.includes('voir') || haystack.includes('detail') || haystack.includes('détail') || haystack.includes('analyse')) return directionActionCatalog.find((item) => item.id === 'detail.drawer') || defaultDirectionActionDefinition
  return defaultDirectionActionDefinition
}

export function buildDirectionExecutionPayload(params: {
  definition: DirectionActionDefinition
  sourceView: DirectionViewKey
  title: string
  moduleKey: string
  basePayload?: Record<string, unknown>
  formState?: Record<string, unknown>
}) {
  return {
    operation: params.definition.operation,
    sourceView: params.sourceView,
    title: params.title || params.definition.label,
    moduleKey: params.moduleKey || params.definition.module,
    priority: params.definition.priority,
    payload: {
      ...(params.basePayload || {}),
      formState: params.formState || {},
      modalType: params.definition.modalType,
      executionMode: params.definition.executionMode,
      actionDefinitionId: params.definition.id,
      clientFacing: true,
      proofLabel: params.definition.proofLabel,
    },
    metadata: {
      ui: 'cockpit_direction_enterprise_action_map',
      visualContract: true,
      enterpriseModal: params.definition.modalType,
      executionMode: params.definition.executionMode,
      customerFacing: true,
    },
  }
}
