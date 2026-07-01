export type Ac360WorkspaceRecord = {
  id: string
  title: string
  owner: string
  status: string
  priority: 'faible' | 'moyenne' | 'haute' | 'critique'
  amount?: string
  due?: string
  signal: string
}

export type Ac360WorkspaceStage = {
  label: string
  count: number
  tone: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate' | 'violet'
}

export type Ac360WorkspaceTemplate = {
  moduleKey: string
  headline: string
  operationalQuestion: string
  primaryScreen: string
  savedViews: string[]
  filters: string[]
  stages: Ac360WorkspaceStage[]
  records: Ac360WorkspaceRecord[]
  timeline: string[]
  governance: string[]
  emptyState: string
  escalation: string
}

const baseWorkspace: Ac360WorkspaceTemplate = {
  moduleKey: 'default',
  headline: 'Espace de travail opérationnel prêt pour exécution client.',
  operationalQuestion: 'Que faut-il traiter maintenant, qui en est responsable, quel risque existe et quel droit facture/usage gouverne l’action ?',
  primaryScreen: 'Table opérationnelle gouvernée',
  savedViews: ['À traiter aujourd’hui', 'Risques ouverts', 'Actions automatiques', 'Historique audit'],
  filters: ['Campus', 'Classe', 'Responsable', 'Priorité', 'Statut', 'Plan / Add-on'],
  stages: [
    { label: 'Nouveau', count: 8, tone: 'blue' },
    { label: 'En cours', count: 14, tone: 'amber' },
    { label: 'À valider', count: 5, tone: 'violet' },
    { label: 'Clôturé', count: 32, tone: 'emerald' },
  ],
  records: [
    { id: 'REC-001', title: 'Action prioritaire client', owner: 'Direction', status: 'À traiter', priority: 'haute', due: 'Aujourd’hui', signal: 'Pré-contrôle guard requis' },
    { id: 'REC-002', title: 'Dossier avec donnée manquante', owner: 'Administration', status: 'En cours', priority: 'moyenne', due: '48h', signal: 'Audit et journal prêts' },
    { id: 'REC-003', title: 'Validation opérationnelle', owner: 'Responsable module', status: 'À valider', priority: 'haute', due: '24h', signal: 'Action gouvernée par droits' },
  ],
  timeline: ['Action créée', 'Pré-contrôle entitlement', 'Exécution autorisée', 'Usage enregistré', 'Audit disponible'],
  governance: ['Droits vérifiés avant action', 'Usage crédité après succès', 'Données préservées en lecture seule si add-on annulé'],
  emptyState: 'Aucune donnée critique. Le module reste prêt pour onboarding, import ou première action client.',
  escalation: 'Si le risque augmente, créer tâche, alerte ou recommandation Growth Menu.',
}

const workspaces: Record<string, Ac360WorkspaceTemplate> = {
  'command-center': {
    moduleKey: 'command-center',
    headline: 'Écran direction unifié : brief, risques, validations, santé école, facturation et prochaines actions.',
    operationalQuestion: 'Quelle décision doit prendre la direction aujourd’hui pour protéger opérations, parents, cash-flow et croissance ?',
    primaryScreen: 'Brief direction live',
    savedViews: ['Brief du jour', 'Risques critiques', 'Validations Direction', 'Croissance & revenus', 'Usage & restrictions'],
    filters: ['Campus', 'Période', 'Sévérité', 'Responsable', 'Module', 'Impact business'],
    stages: [
      { label: 'Urgent', count: 7, tone: 'rose' },
      { label: 'À décider', count: 11, tone: 'amber' },
      { label: 'Automatisable', count: 9, tone: 'blue' },
      { label: 'Sous contrôle', count: 28, tone: 'emerald' },
    ],
    records: [
      { id: 'DIR-001', title: 'Relancer les familles en retard de paiement', owner: 'Finance', status: 'À décider', priority: 'haute', amount: '31 500 MAD', due: 'Aujourd’hui', signal: 'Finance Power recommandé' },
      { id: 'DIR-002', title: 'Traiter les réclamations ParentTrust critiques', owner: 'Direction', status: 'Urgent', priority: 'critique', due: '24h', signal: 'Risque rétention' },
      { id: 'DIR-003', title: 'Valider corrections présence et clôture journée', owner: 'Administration', status: 'À valider', priority: 'moyenne', due: 'Fin de journée', signal: 'Audit présence actif' },
    ],
    timeline: ['Brief généré', 'Risques consolidés', 'Actions assignées', 'Décisions journalisées', 'Rapport direction prêt'],
    governance: ['Chaque décision sensible garde une preuve', 'Plan et restrictions visibles dans le brief', 'Actions recommandées liées aux add-ons et crédits'],
    emptyState: 'Aucune urgence direction. Le cockpit affiche les signaux de santé, croissance et usage pour pilotage préventif.',
    escalation: 'Escalader vers validation Direction si impact finance, sécurité ou réputation parent.',
  },
  'students-families': {
    moduleKey: 'students-families',
    headline: 'Dossier Élève 360 : famille, santé, documents, facturation, présence, classe, autorisations et historique.',
    operationalQuestion: 'Quel enfant ou quelle famille nécessite une action administrative, financière, sécurité ou parentale ?',
    primaryScreen: 'Cartes Élève 360 + table dense',
    savedViews: ['Dossiers incomplets', 'Parents sans accès', 'Alertes santé', 'Solde impayé', 'Documents manquants'],
    filters: ['Classe', 'Statut élève', 'Famille', 'Solde', 'Documents', 'Santé'],
    stages: [
      { label: 'Actifs', count: 184, tone: 'emerald' },
      { label: 'À compléter', count: 9, tone: 'amber' },
      { label: 'Santé', count: 3, tone: 'rose' },
      { label: 'Archive', count: 16, tone: 'slate' },
    ],
    records: [
      { id: 'ELV-184', title: 'Sara Benali · dossier médical incomplet', owner: 'Administration', status: 'À compléter', priority: 'haute', due: '48h', signal: 'Document santé requis' },
      { id: 'ELV-121', title: 'Adam El Fassi · parent portail non activé', owner: 'Relation parents', status: 'En cours', priority: 'moyenne', due: '72h', signal: 'Activation portail' },
      { id: 'ELV-077', title: 'Yasmine Alaoui · solde impayé', owner: 'Finance', status: 'À relancer', priority: 'haute', amount: '1 200 MAD', due: 'Aujourd’hui', signal: 'Relance créditée' },
    ],
    timeline: ['Inscription créée', 'Parent lié', 'Classe affectée', 'Documents contrôlés', 'Historique audit ouvert'],
    governance: ['Archive sans suppression', 'Accès parent gouverné', 'Capacité élèves vérifiée avant création'],
    emptyState: 'Aucun dossier incomplet. Les cartes 360 restent prêtes pour admissions, santé, documents et facturation.',
    escalation: 'Créer alerte si santé, pickup, impayé ou document critique reste non traité.',
  },
  classes: {
    moduleKey: 'classes',
    headline: 'Carte vivante des classes : capacité, affectations, couverture équipe, transferts et readiness pédagogique.',
    operationalQuestion: 'Quelle classe est proche de saturation, sous-couverte ou nécessite un transfert/renfort ?',
    primaryScreen: 'Carte capacité + couverture équipe',
    savedViews: ['Classes pleines', 'Assistantes manquantes', 'Transferts proposés', 'Rapport capacité'],
    filters: ['Niveau', 'Campus', 'Capacité', 'Éducatrice', 'Assistant', 'Statut'],
    stages: [
      { label: 'Disponibles', count: 8, tone: 'emerald' },
      { label: 'Proches limite', count: 2, tone: 'amber' },
      { label: 'Complètes', count: 1, tone: 'rose' },
      { label: 'À réconcilier', count: 3, tone: 'blue' },
    ],
    records: [
      { id: 'CLS-PSA', title: 'Petite Section A · assistante à affecter', owner: 'RH', status: 'À renforcer', priority: 'haute', due: 'Aujourd’hui', signal: 'Couverture staff insuffisante' },
      { id: 'CLS-MSB', title: 'Moyenne Section B · capacité 24/24', owner: 'Direction', status: 'Complet', priority: 'critique', due: 'Immédiat', signal: 'Extension capacité recommandée' },
      { id: 'CLS-GSA', title: 'Grande Section A · transfert possible', owner: 'Administration', status: 'Proposé', priority: 'moyenne', due: 'Cette semaine', signal: 'Transfert gouverné' },
    ],
    timeline: ['Classe ouverte', 'Capacité mesurée', 'Équipe affectée', 'Transfert contrôlé', 'Rapport généré'],
    governance: ['Création classe vérifiée par capacité', 'Transfert journalisé', 'Clôture classe en archive contrôlée'],
    emptyState: 'Aucune saturation. La carte classe surveille capacité, équipe et transferts.',
    escalation: 'Alerter Direction si classe pleine ou sous-couverte plus de 24h.',
  },
  attendance: {
    moduleKey: 'attendance',
    headline: 'Salle des opérations du jour : présence, absences, retards, sorties, corrections et journal daybook.',
    operationalQuestion: 'La journée est-elle correctement ouverte, suivie, corrigée et clôturée avec preuve ?',
    primaryScreen: 'Daybook live + board présence',
    savedViews: ['Aujourd’hui', 'Absents non justifiés', 'Sorties non clôturées', 'Corrections à valider'],
    filters: ['Classe', 'Session', 'Type événement', 'Statut correction', 'Heure', 'Responsable'],
    stages: [
      { label: 'Présents', count: 142, tone: 'emerald' },
      { label: 'Absents', count: 11, tone: 'amber' },
      { label: 'Retards', count: 6, tone: 'blue' },
      { label: 'À corriger', count: 6, tone: 'rose' },
    ],
    records: [
      { id: 'PRS-001', title: 'Session quotidienne ouverte', owner: 'Administration', status: 'Active', priority: 'moyenne', due: 'Aujourd’hui', signal: 'Daybook alimenté' },
      { id: 'PRS-002', title: 'Sortie non clôturée · Adam El Fassi', owner: 'Classe MS-B', status: 'À vérifier', priority: 'haute', due: 'Immédiat', signal: 'Risque pickup' },
      { id: 'PRS-003', title: 'Correction demandée · retard staff', owner: 'Direction', status: 'À valider', priority: 'moyenne', due: 'Fin journée', signal: 'Audit correction' },
    ],
    timeline: ['Session ouverte', 'Présences enregistrées', 'Anomalies détectées', 'Corrections validées', 'Session clôturée'],
    governance: ['Correction soumise à validation', 'Événement présence journalisé', 'Alertes parents consomment crédits si envoyées'],
    emptyState: 'Aucune anomalie présence. Le daybook reste prêt pour la prochaine session.',
    escalation: 'Escalader une absence ou sortie non clôturée vers Direction et parent si délai dépassé.',
  },
  finance: {
    moduleKey: 'finance',
    headline: 'Cockpit de trésorerie : factures, paiements, créances, promesses, ajustements et recouvrement.',
    operationalQuestion: 'Quelles familles doivent être relancées maintenant, quel montant est à risque et quelle action protège le cash-flow ?',
    primaryScreen: 'Board créances + table factures',
    savedViews: ['Impayés > 7 jours', 'Promesses ouvertes', 'Ajustements à valider', 'Relances WhatsApp'],
    filters: ['Famille', 'Classe', 'Montant', 'Âge créance', 'Statut', 'Promesse'],
    stages: [
      { label: 'À émettre', count: 21, tone: 'blue' },
      { label: 'À encaisser', count: 36, tone: 'amber' },
      { label: 'En retard', count: 18, tone: 'rose' },
      { label: 'Payé', count: 128, tone: 'emerald' },
    ],
    records: [
      { id: 'FAC-2026-041', title: 'Famille Benali · frais mensuels', owner: 'Finance', status: 'En retard', priority: 'haute', amount: '2 400 MAD', due: '7 jours', signal: 'Relance WhatsApp recommandée' },
      { id: 'FAC-2026-054', title: 'Famille El Fassi · promesse paiement', owner: 'Finance', status: 'Promesse', priority: 'moyenne', amount: '1 800 MAD', due: 'Demain', signal: 'Suivi promesse' },
      { id: 'ADJ-008', title: 'Ajustement remise fratrie', owner: 'Direction', status: 'À valider', priority: 'moyenne', amount: '300 MAD', due: '24h', signal: 'Validation gouvernée' },
    ],
    timeline: ['Facture émise', 'Relance envoyée', 'Promesse créée', 'Paiement affecté', 'Reçu généré'],
    governance: ['Relances consomment crédits', 'Ajustements soumis à permission', 'Finance Power recommandé selon risque'],
    emptyState: 'Aucun impayé critique. Le cockpit finance surveille créances, promesses et relances.',
    escalation: 'Escalader en collection workflow si facture > 14 jours sans promesse.',
  },
  communication: {
    moduleKey: 'communication',
    headline: 'Centre de communication parents : campagnes, modèles, segments, consentements, livraisons et notifications.',
    operationalQuestion: 'Quel message doit être envoyé, à qui, par quel canal, avec quel coût crédit et quelle preuve de livraison ?',
    primaryScreen: 'Composer gouverné + suivi livraison',
    savedViews: ['Campagnes planifiées', 'Messages échoués', 'Opt-out WhatsApp', 'Modèles paiement'],
    filters: ['Canal', 'Audience', 'Classe', 'Consentement', 'Livraison', 'Campagne'],
    stages: [
      { label: 'Brouillons', count: 4, tone: 'slate' },
      { label: 'Planifiées', count: 7, tone: 'blue' },
      { label: 'Envoyées', count: 143, tone: 'emerald' },
      { label: 'Échecs', count: 5, tone: 'rose' },
    ],
    records: [
      { id: 'CMP-014', title: 'Relance paiement mensuelle', owner: 'Finance', status: 'Planifiée', priority: 'haute', due: '17:00', signal: '429 crédits estimés' },
      { id: 'MSG-077', title: 'WhatsApp parent non livré', owner: 'Relation parents', status: 'Échec', priority: 'moyenne', due: 'Aujourd’hui', signal: 'Revoir consentement' },
      { id: 'TPL-009', title: 'Modèle absence à valider', owner: 'Direction', status: 'Brouillon', priority: 'faible', due: 'Cette semaine', signal: 'Variables prêtes' },
    ],
    timeline: ['Modèle rendu', 'Audience filtrée', 'Crédits estimés', 'Envoi déclenché', 'Livraison enregistrée'],
    governance: ['Consentement vérifié', 'Canal crédité selon usage', 'Historique livraison conservé'],
    emptyState: 'Aucune campagne active. Le centre reste prêt pour modèles et segments parents.',
    escalation: 'Créer alerte si taux échec livraison dépasse le seuil ou crédits insuffisants.',
  },
  documents: {
    moduleKey: 'documents',
    headline: 'Documents, rapports, stockage et exports avec versioning, revue, audit et limites de capacité.',
    operationalQuestion: 'Quels fichiers manquent, expirent, consomment du stockage ou nécessitent validation ?',
    primaryScreen: 'Registre documents + stockage intelligent',
    savedViews: ['Documents à revoir', 'Stockage lourd', 'Exports prêts', 'Rapports planifiés'],
    filters: ['Type', 'Étudiant', 'Staff', 'Taille', 'Revue', 'Expiration'],
    stages: [
      { label: 'Validés', count: 312, tone: 'emerald' },
      { label: 'À revoir', count: 14, tone: 'amber' },
      { label: 'Expirés', count: 3, tone: 'rose' },
      { label: 'Exports', count: 5, tone: 'blue' },
    ],
    records: [
      { id: 'DOC-112', title: 'Autorisation parentale sortie', owner: 'Administration', status: 'À revoir', priority: 'haute', due: '48h', signal: 'Version requise' },
      { id: 'RPT-021', title: 'Rapport mensuel direction', owner: 'Direction', status: 'En file', priority: 'moyenne', due: 'Demain', signal: 'Crédit rapport' },
      { id: 'EXP-006', title: 'Export comptable juin', owner: 'Finance', status: 'Prêt', priority: 'moyenne', due: 'Disponible', signal: 'Accès audit' },
    ],
    timeline: ['Document enregistré', 'Version créée', 'Revue demandée', 'Décision prise', 'Accès journalisé'],
    governance: ['Stockage mesuré', 'Archive sans suppression', 'Exports et rapports auditables'],
    emptyState: 'Aucune revue urgente. Le registre reste prêt pour uploads, rapports et exports.',
    escalation: 'Proposer pack stockage si limite dépassée ou uploads bloqués.',
  },
  workflows: {
    moduleKey: 'workflows',
    headline: 'Tâches, validations, tickets et workflows pour transformer l’école en organisation exécutable.',
    operationalQuestion: 'Quelle tâche bloque le travail, quelle validation est en retard et quel workflow doit être automatisé ?',
    primaryScreen: 'Boards opérationnels + validations',
    savedViews: ['Mes tâches', 'Validations Direction', 'Tickets ouverts', 'Récurrentes en retard'],
    filters: ['Module', 'Responsable', 'Priorité', 'Échéance', 'Statut', 'Validation'],
    stages: [
      { label: 'À faire', count: 23, tone: 'slate' },
      { label: 'En cours', count: 17, tone: 'blue' },
      { label: 'Bloqué', count: 4, tone: 'rose' },
      { label: 'Validé', count: 31, tone: 'emerald' },
    ],
    records: [
      { id: 'TSK-230', title: 'Préparer relances finance', owner: 'Finance', status: 'À faire', priority: 'haute', due: 'Aujourd’hui', signal: 'Automatisable' },
      { id: 'APR-044', title: 'Valider ajustement facture', owner: 'Direction', status: 'À valider', priority: 'haute', due: '24h', signal: 'Approval policy' },
      { id: 'TKT-019', title: 'Ticket maintenance classe MS-B', owner: 'Opérations', status: 'Bloqué', priority: 'moyenne', due: '48h', signal: 'Escalade possible' },
    ],
    timeline: ['Tâche créée', 'Responsable assigné', 'Commentaire ajouté', 'Validation demandée', 'Workflow clôturé'],
    governance: ['Validations journalisées', 'Récurrences générées', 'Événements workflow enregistrés'],
    emptyState: 'Aucun blocage opérationnel. Les boards restent prêts pour exécution multi-départements.',
    escalation: 'Escalader tâche bloquée ou validation critique à la Direction.',
  },
  admissions: {
    moduleKey: 'admissions',
    headline: 'CRM admissions : sources, leads, visites, suivis, offres, dossiers, conversion et revenu potentiel.',
    operationalQuestion: 'Quel prospect chaud doit être relancé maintenant et quelle valeur d’inscription est à protéger ?',
    primaryScreen: 'Pipeline admissions + calendrier visites',
    savedViews: ['Leads chauds', 'Visites cette semaine', 'Offres en attente', 'Doublons détectés'],
    filters: ['Source', 'Niveau souhaité', 'Étape', 'Responsable', 'Urgence', 'Valeur'],
    stages: [
      { label: 'Nouveau', count: 18, tone: 'blue' },
      { label: 'Visite', count: 4, tone: 'amber' },
      { label: 'Offre', count: 3, tone: 'violet' },
      { label: 'Converti', count: 9, tone: 'emerald' },
    ],
    records: [
      { id: 'LEAD-091', title: 'Parent Benali · Petite Section', owner: 'Admissions', status: 'Lead chaud', priority: 'haute', amount: '2 900 MAD/mois', due: 'Aujourd’hui', signal: 'Relance 48h' },
      { id: 'VIS-018', title: 'Visite famille El Fassi', owner: 'Admissions', status: 'Planifiée', priority: 'moyenne', due: 'Jeudi 10h', signal: 'Conversion probable' },
      { id: 'OFF-007', title: 'Offre inscription en attente', owner: 'Direction', status: 'À décider', priority: 'haute', amount: '3 500 MAD', due: '24h', signal: 'Valeur pipeline' },
    ],
    timeline: ['Lead capturé', 'Contact effectué', 'Visite planifiée', 'Offre générée', 'Conversion élève'],
    governance: ['Conversion passe par capacité élèves', 'Campagnes consomment crédits', 'Doublons scannés avant import'],
    emptyState: 'Aucun lead chaud. Le pipeline reste prêt pour imports, formulaires et visites.',
    escalation: 'Créer tâche automatique si lead chaud inactif plus de 48h.',
  },
  hr: {
    moduleKey: 'hr',
    headline: 'RH, contrats, shifts, congés, staffing et évaluations pour sécuriser la couverture équipe.',
    operationalQuestion: 'Quelle classe, équipe ou fonction est sous-couverte et quelle demande RH doit être validée ?',
    primaryScreen: 'Carte couverture staff + demandes RH',
    savedViews: ['Congés à valider', 'Contrats expirants', 'Classes sous-couvertes', 'Évaluations dues'],
    filters: ['Département', 'Rôle', 'Shift', 'Congé', 'Contrat', 'Statut'],
    stages: [
      { label: 'Staff actif', count: 36, tone: 'emerald' },
      { label: 'Congés', count: 3, tone: 'amber' },
      { label: 'Sous-couvert', count: 2, tone: 'rose' },
      { label: 'Évaluations', count: 5, tone: 'blue' },
    ],
    records: [
      { id: 'HR-014', title: 'Demande congé Fatima', owner: 'Direction', status: 'À décider', priority: 'moyenne', due: '24h', signal: 'Impact couverture' },
      { id: 'SHF-021', title: 'Assistante manquante Petite Section', owner: 'RH', status: 'À affecter', priority: 'haute', due: 'Aujourd’hui', signal: 'Staffing request' },
      { id: 'CNT-006', title: 'Contrat à renouveler', owner: 'Administration', status: 'Expirant', priority: 'moyenne', due: '15 jours', signal: 'Alerte conformité' },
    ],
    timeline: ['Contrat créé', 'Shift assigné', 'Congé demandé', 'Décision validée', 'Snapshot RH calculé'],
    governance: ['Congés validés selon policy', 'Staffing journalisé', 'Contrats préservés et auditables'],
    emptyState: 'Aucun risque RH critique. La couverture équipe reste sous surveillance.',
    escalation: 'Alerter Direction si classe sous-couverte le jour même.',
  },
  'health-safety': {
    moduleKey: 'health-safety',
    headline: 'Santé, sécurité, incidents, médicaments et autorisations pickup avec preuve et responsabilité.',
    operationalQuestion: 'Quel risque santé/sécurité nécessite action immédiate et preuve parent/staff ?',
    primaryScreen: 'Panneau sécurité + incidents',
    savedViews: ['Incidents critiques', 'Médication due', 'Pickup exception', 'Checks sécurité'],
    filters: ['Élève', 'Classe', 'Sévérité', 'Statut parent', 'Médication', 'Pickup'],
    stages: [
      { label: 'Sous contrôle', count: 21, tone: 'emerald' },
      { label: 'À reconnaître', count: 2, tone: 'amber' },
      { label: 'Critique', count: 1, tone: 'rose' },
      { label: 'Checks', count: 4, tone: 'blue' },
    ],
    records: [
      { id: 'INC-003', title: 'Incident mineur · parent à reconnaître', owner: 'Direction', status: 'Attente parent', priority: 'haute', due: 'Aujourd’hui', signal: 'Accusé requis' },
      { id: 'MED-009', title: 'Administration médicament 12h30', owner: 'Éducatrice', status: 'À enregistrer', priority: 'critique', due: '12h30', signal: 'Preuve obligatoire' },
      { id: 'PCK-011', title: 'Pickup exceptionnel à vérifier', owner: 'Accueil', status: 'À contrôler', priority: 'haute', due: 'Sortie', signal: 'Autorisation pickup' },
    ],
    timeline: ['Profil santé ouvert', 'Incident déclaré', 'Parent notifié', 'Accusé reçu', 'Résolution auditée'],
    governance: ['Incident non supprimé', 'Pickup autorisé contrôlé', 'Médication enregistrée avec preuve'],
    emptyState: 'Aucun incident critique. Le module reste prêt pour santé, pickup et checks.',
    escalation: 'Escalader incident critique non reconnu à Direction et parent.',
  },
  transport: {
    moduleKey: 'transport',
    headline: 'Transport : véhicules, chauffeurs, circuits, stops, élèves, runs, retards, sécurité et billing.',
    operationalQuestion: 'Quel circuit est en retard, quel élève est concerné et quelle preuve de pickup/drop-off existe ?',
    primaryScreen: 'Route board + timeline run',
    savedViews: ['Circuits actifs', 'Retards', 'Checks sécurité', 'Facturation transport'],
    filters: ['Circuit', 'Chauffeur', 'Véhicule', 'Élève', 'Statut run', 'Retard'],
    stages: [
      { label: 'Planifiés', count: 5, tone: 'blue' },
      { label: 'En route', count: 2, tone: 'amber' },
      { label: 'Retards', count: 1, tone: 'rose' },
      { label: 'Terminés', count: 8, tone: 'emerald' },
    ],
    records: [
      { id: 'RUN-022', title: 'Circuit Matin A · +7 min', owner: 'Transport', status: 'En route', priority: 'haute', due: 'Maintenant', signal: 'Alerte retard parent' },
      { id: 'VEH-003', title: 'Check sécurité véhicule VAN-01', owner: 'Chauffeur', status: 'À faire', priority: 'critique', due: 'Avant départ', signal: 'Blocage si échec' },
      { id: 'TRN-117', title: 'Sara Benali affectée circuit A', owner: 'Administration', status: 'Actif', priority: 'moyenne', due: 'Permanent', signal: 'Billing transport' },
    ],
    timeline: ['Run ouvert', 'Stop atteint', 'Élève monté', 'Retard signalé', 'Run clôturé'],
    governance: ['Événements route journalisés', 'Alertes parents créditées', 'Billing transport réconcilié'],
    emptyState: 'Aucun circuit actif. Le module reste prêt pour planification et runs.',
    escalation: 'Escalader retard ou incident route vers parents et Direction.',
  },
  parenttrust: {
    moduleKey: 'parenttrust',
    headline: 'ParentTrust : satisfaction, réclamations, rendez-vous, réputation, témoignages et risque rétention.',
    operationalQuestion: 'Quel parent risque de perdre confiance et quelle action doit restaurer la relation ?',
    primaryScreen: 'Trust board + réclamations',
    savedViews: ['Réclamations critiques', 'Rendez-vous à venir', 'Surveys faibles', 'Témoignages à collecter'],
    filters: ['Sévérité', 'Famille', 'Classe', 'Statut', 'Responsable', 'Canal'],
    stages: [
      { label: 'Satisfaits', count: 86, tone: 'emerald' },
      { label: 'À suivre', count: 9, tone: 'amber' },
      { label: 'Critiques', count: 1, tone: 'rose' },
      { label: 'Rendez-vous', count: 7, tone: 'blue' },
    ],
    records: [
      { id: 'CMP-004', title: 'Réclamation parent critique', owner: 'Direction', status: 'Critique', priority: 'critique', due: 'Aujourd’hui', signal: 'Risque rétention' },
      { id: 'APT-019', title: 'Rendez-vous parent à confirmer', owner: 'Relation parents', status: 'À confirmer', priority: 'moyenne', due: 'Demain', signal: 'Action relation' },
      { id: 'SUR-011', title: 'Réponse satisfaction faible', owner: 'ParentTrust', status: 'À rappeler', priority: 'haute', due: '24h', signal: 'Enquête mensuelle' },
    ],
    timeline: ['Signal reçu', 'Réclamation ouverte', 'Responsable assigné', 'Parent contacté', 'Résolution suivie'],
    governance: ['Réclamation auditée', 'Rendez-vous historisé', 'ParentTrust Advanced peut être requis'],
    emptyState: 'Aucune réclamation critique. Le radar ParentTrust surveille satisfaction et rétention.',
    escalation: 'Escalader réclamation critique non traitée en moins de 24h.',
  },
}

export function getAc360CustomerWorkspace(moduleKey: string): Ac360WorkspaceTemplate {
  const aliasKey = moduleKey === 'safety' ? 'health-safety' : moduleKey
  return workspaces[aliasKey] || {
    ...baseWorkspace,
    moduleKey,
  }
}
