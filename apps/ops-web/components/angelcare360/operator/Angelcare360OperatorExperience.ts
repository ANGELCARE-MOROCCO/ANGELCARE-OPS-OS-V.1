export type Angelcare360OperatorDistrict =
  | 'command'
  | 'portfolio'
  | 'infrastructure'
  | 'commercial'
  | 'finance'
  | 'activation'
  | 'support'
  | 'incident'
  | 'retention'
  | 'health'
  | 'governance'

export type Angelcare360OperatorExperienceProfile = {
  key: string
  district: Angelcare360OperatorDistrict
  districtLabel: string
  routeLabel: string
  mission: string
  decision: string
  evidence: string
  accent: string
  accentDeep: string
  accentSoft: string
  accentGlow: string
  signature: string
  quickLinks: Array<{ label: string; href: string }>
}

type ProfileDefinition = Omit<Angelcare360OperatorExperienceProfile, 'accent' | 'accentDeep' | 'accentSoft' | 'accentGlow'>

const base = '/angelcare-360-operator'

const palette: Record<Angelcare360OperatorDistrict, Pick<Angelcare360OperatorExperienceProfile, 'accent' | 'accentDeep' | 'accentSoft' | 'accentGlow'>> = {
  command: { accent: '#b4232a', accentDeep: '#7f1d1d', accentSoft: '#fff1f2', accentGlow: 'rgba(180,35,42,.18)' },
  portfolio: { accent: '#2563eb', accentDeep: '#1e3a8a', accentSoft: '#eff6ff', accentGlow: 'rgba(37,99,235,.20)' },
  infrastructure: { accent: '#0284c7', accentDeep: '#075985', accentSoft: '#ecfeff', accentGlow: 'rgba(14,165,233,.20)' },
  commercial: { accent: '#6d28d9', accentDeep: '#4c1d95', accentSoft: '#f5f3ff', accentGlow: 'rgba(109,40,217,.18)' },
  finance: { accent: '#047857', accentDeep: '#064e3b', accentSoft: '#ecfdf5', accentGlow: 'rgba(5,150,105,.18)' },
  activation: { accent: '#0ea5e9', accentDeep: '#075985', accentSoft: '#f0f9ff', accentGlow: 'rgba(14,165,233,.20)' },
  support: { accent: '#0891b2', accentDeep: '#164e63', accentSoft: '#ecfeff', accentGlow: 'rgba(8,145,178,.20)' },
  incident: { accent: '#dc2626', accentDeep: '#7f1d1d', accentSoft: '#fef2f2', accentGlow: 'rgba(220,38,38,.20)' },
  retention: { accent: '#b7791f', accentDeep: '#78350f', accentSoft: '#fffbeb', accentGlow: 'rgba(217,119,6,.18)' },
  health: { accent: '#16a34a', accentDeep: '#14532d', accentSoft: '#f0fdf4', accentGlow: 'rgba(22,163,74,.18)' },
  governance: { accent: '#334155', accentDeep: '#0f172a', accentSoft: '#f8fafc', accentGlow: 'rgba(51,65,85,.18)' },
}

const exactProfiles: Record<string, Angelcare360OperatorExperienceProfile> = Object.fromEntries([
  entry('', define('executive-command', 'command', 'Commandement exécutif', 'Vue réseau SaaS', 'Orchestrer le portefeuille AngelCare 360 depuis une seule situation opérationnelle.', 'Choisir les interventions qui protègent revenu, activation et qualité de service.', 'Décisions, signaux et événements récents traçables.', 'constellation', links('clients', 'billing', 'service-operations'))),
  entry('/clients', define('customer-portfolio', 'portfolio', 'Portefeuille client', 'Paysage relationnel', 'Identifier immédiatement les comptes à développer, activer, sécuriser ou récupérer.', 'Prioriser les comptes selon santé, valeur et prochain engagement.', 'Cycle, abonnement, encours et activité sont reliés au compte.', 'landscape', links('customer-health', 'renewals', 'tenants'))),
  entry('/tenants', define('tenant-fleet', 'infrastructure', 'Infrastructure client', 'Flotte de tenants', 'Contrôler les environnements clients comme une flotte opérationnelle.', 'Activer, restreindre ou stabiliser le tenant exact.', 'Provisionnement, environnement, URL, accès et activité vérifiables.', 'topology', links('implementation', 'usage-limits', 'incidents'))),
  entry('/client-access', define('access-observatory', 'infrastructure', 'Accès client', 'Observatoire de disponibilité', 'Vérifier que chaque client dispose du bon point d’entrée et du bon état d’accès.', 'Rétablir ou restreindre un accès avec portée comprise.', 'URL, tenant, statut de mise en service et dernier accès.', 'gateway', links('tenants', 'support', 'audit'))),
  entry('/plans', define('plan-architecture', 'commercial', 'Architecture d’offre', 'Plans commerciaux', 'Structurer la proposition de valeur, le prix et les capacités de chaque offre.', 'Publier uniquement un plan cohérent avec le service livrable.', 'Prix, cycle, plafonds, modules et niveau de support.', 'blueprint', links('packages', 'subscriptions', 'features'))),
  entry('/packages', define('package-composer', 'commercial', 'Architecture d’offre', 'Compositeur de packages', 'Assembler modules et fonctionnalités en bundles vendables et lisibles.', 'Choisir la composition qui sert le segment sans créer de dette de service.', 'Modules, fonctionnalités, statut et usages commerciaux.', 'composer', links('plans', 'modules', 'features'))),
  entry('/subscriptions', define('subscription-field', 'commercial', 'Revenu récurrent', 'Champ des abonnements', 'Gouverner le cycle contractuel et financier de chaque souscription.', 'Maintenir, migrer, suspendre ou annuler avec impact explicite.', 'Plan, tenant, périodes, montant, remise et historique d’état.', 'ribbon', links('plans', 'renewals', 'billing'))),
  entry('/modules', define('module-topology', 'commercial', 'Capacités produit', 'Topologie des modules', 'Lire les modules comme une architecture de service et non comme une simple liste.', 'Déterminer quelle capacité peut être activée sans dépendance manquante.', 'État, dépendances, portée client et configuration requise.', 'topology', links('features', 'packages', 'tenants'))),
  entry('/features', define('feature-control', 'commercial', 'Capacités produit', 'Contrôle des fonctionnalités', 'Gouverner les activations, verrous et exceptions de capacité par tenant.', 'Autoriser la fonctionnalité uniquement avec justification et portée exactes.', 'Source, module, tenant, état, date et opérateur.', 'switchboard', links('modules', 'usage-limits', 'audit'))),
  entry('/usage-limits', define('capacity-thresholds', 'commercial', 'Capacités produit', 'Seuils et consommation', 'Confronter la consommation réelle aux limites contractuelles sans surprise client.', 'Étendre, maintenir ou restreindre le seuil approprié.', 'Valeur autorisée, valeur courante, unité et cycle de remise à zéro.', 'gauge', links('features', 'subscriptions', 'tenants'))),
  entry('/billing', define('financial-command', 'finance', 'Contrôle financier SaaS', 'Commandement de facturation', 'Transformer facturation, encaissement et recouvrement en une chaîne contrôlée.', 'Sécuriser le prochain mouvement financier sans perdre la relation client.', 'Montants, échéances, allocations, pièces et audit disponibles.', 'waterfall', links('billing/invoices', 'billing/payments', 'billing/dunning'))),
  entry('/billing/accounts', define('billing-identities', 'finance', 'Contrôle financier SaaS', 'Comptes de facturation', 'Maintenir une identité financière correcte pour chaque client AngelCare.', 'Valider les coordonnées et conditions avant émission.', 'Identité, fiscalité, contact, délai et statut.', 'ledger', links('billing/invoices', 'clients', 'audit'))),
  entry('/billing/invoices', define('invoice-observatory', 'finance', 'Contrôle financier SaaS', 'Observatoire des factures', 'Émettre et suivre chaque document financier jusqu’à son solde réel.', 'Émettre, corriger, annuler ou engager le recouvrement.', 'Document, période, échéance, total, paiement et solde.', 'document', links('billing/payments', 'billing/balances', 'billing/dunning'))),
  entry('/billing/payments', define('payment-validation', 'finance', 'Contrôle financier SaaS', 'Bureau de validation paiement', 'Transformer chaque paiement déclaré en encaissement prouvé et correctement alloué.', 'Confirmer, rejeter ou rapprocher sur la base de la preuve.', 'Référence, date, méthode, montant, facture et décision opérateur.', 'reconciliation', links('billing/invoices', 'billing/balances', 'audit'))),
  entry('/billing/balances', define('exposure-matrix', 'finance', 'Contrôle financier SaaS', 'Matrice d’exposition', 'Visualiser les soldes qui menacent revenu, relation ou accès tenant.', 'Choisir le bon niveau d’intervention financière.', 'Encours, ancienneté, statut client et exposition consolidée.', 'matrix', links('billing/dunning', 'clients', 'subscriptions'))),
  entry('/billing/dunning', define('recovery-command', 'finance', 'Contrôle financier SaaS', 'Commandement de recouvrement', 'Conduire les relances internes avec discipline relationnelle et preuve.', 'Passer au prochain niveau d’intervention ou clôturer la relance.', 'Facture, montant, échéance, propriétaire, engagement et résultat.', 'stages', links('billing/balances', 'billing/invoices', 'clients'))),
  entry('/onboarding', define('onboarding-runway', 'activation', 'Activation client', 'Runway onboarding', 'Coordonner responsabilités AngelCare et client jusqu’à la préparation du lancement.', 'Lever le prochain blocage de préparation.', 'Jalon, propriétaire, échéance, dépendance et preuve.', 'runway', links('implementation', 'tenants', 'tasks'))),
  entry('/implementation', define('deployment-war-room', 'activation', 'Activation client', 'Salle de déploiement', 'Piloter la configuration réelle du produit, des accès et des données.', 'Valider la prochaine étape technique ou opérationnelle du go-live.', 'Tâches, dépendances, demandes, anomalies et validation.', 'sequencer', links('onboarding', 'tenants', 'service-requests'))),
  entry('/support', define('support-radar', 'support', 'Assistance client', 'Radar de résolution', 'Trier et résoudre les tickets selon impact, priorité et pression client.', 'Assigner la réponse qui réduit le plus vite l’impact réel.', 'Demandeur, tenant, gravité, propriétaire, chronologie et résolution.', 'radar', links('service-requests', 'incidents', 'customer-health'))),
  entry('/service-requests', define('fulfilment-queue', 'support', 'Assistance client', 'File de fulfilment', 'Traiter les demandes de configuration et de service comme des missions structurées.', 'Accepter, planifier, exécuter ou clôturer avec résultat explicite.', 'Type, client, propriétaire, délai, statut et résultat.', 'queue', links('support', 'implementation', 'tasks'))),
  entry('/incidents', define('incident-room', 'incident', 'Commandement incident', 'Salle d’incident', 'Concentrer l’équipe sur l’impact, le confinement, la récupération et la preuve.', 'Déterminer la prochaine action de stabilisation et son autorité.', 'Sévérité, durée, clients affectés, interventions et clôture.', 'pulse', links('support', 'tenants', 'audit'))),
  entry('/service-operations', define('service-mission-control', 'support', 'Exécution interne', 'Mission control service', 'Unifier incidents, demandes, tâches et signaux de service sans perdre leur nature.', 'Prioriser le travail qui bloque client, revenu ou qualité.', 'Contexte, propriétaire, échéance, statut et événement source.', 'lanes', links('support', 'incidents', 'tasks'))),
  entry('/tasks', define('operator-commitments', 'support', 'Exécution interne', 'Engagements opérateur', 'Transformer le travail interne en engagements datés, attribués et vérifiables.', 'Exécuter d’abord la tâche au plus fort impact client ou revenu.', 'Mission, propriétaire, priorité, échéance, blocage et clôture.', 'mission-board', links('service-operations', 'onboarding', 'implementation'))),
  entry('/notes', define('confidential-intelligence', 'support', 'Exécution interne', 'Intelligence confidentielle', 'Conserver les informations internes nécessaires à une décision future.', 'Enregistrer uniquement une note utile, contextualisée et correctement restreinte.', 'Auteur, visibilité, entité, date et contenu.', 'notebook', links('clients', 'service-operations', 'audit'))),
  entry('/contracts', define('contract-library', 'retention', 'Continuité commerciale', 'Bibliothèque contractuelle', 'Maintenir la vérité juridique et commerciale de chaque relation client.', 'Faire avancer signature, amendement, activation ou clôture.', 'Document, statut, dates, valeur, parties et historique.', 'document-vault', links('renewals', 'subscriptions', 'clients'))),
  entry('/renewals', define('retention-horizon', 'retention', 'Continuité commerciale', 'Horizon des renouvellements', 'Anticiper chaque échéance avant qu’elle ne devienne une urgence commerciale.', 'Renouveler, développer, renégocier ou engager une intervention de risque.', 'Valeur, probabilité, santé, échéance, propriétaire et prochaine étape.', 'horizon', links('contracts', 'customer-health', 'subscriptions'))),
  entry('/customer-health', define('health-observatory', 'health', 'Intelligence relationnelle', 'Observatoire santé client', 'Expliquer les signaux qui renforcent ou fragilisent la relation AngelCare.', 'Intervenir sur le facteur réellement responsable du risque.', 'Facteurs, événements, score et évolution sont transparents.', 'spectrum', links('clients', 'renewals', 'support'))),
  entry('/audit', define('forensic-explorer', 'governance', 'Gouvernance plateforme', 'Explorateur forensic', 'Reconstruire qui a changé quoi, quand, sur quelle entité et avec quel impact.', 'Accepter une décision uniquement lorsque sa preuve est suffisante.', 'Acteur, action, avant/après, portée, sévérité et horodatage.', 'forensic', links('operator-roles', 'settings', 'service-operations'))),
  entry('/operator-roles', define('authority-architecture', 'governance', 'Gouvernance plateforme', 'Architecture d’autorité', 'Rendre compréhensible la portée réelle de chaque rôle opérateur.', 'Accorder le minimum d’autorité nécessaire à la mission.', 'Rôle, permissions, portée, risque et capacité de mutation.', 'permissions', links('audit', 'settings', 'clients'))),
  entry('/settings', define('governance-console', 'governance', 'Gouvernance plateforme', 'Console de règles', 'Gouverner les politiques qui déterminent le comportement du service AngelCare 360.', 'Modifier une règle seulement après compréhension de son impact réseau.', 'Valeur actuelle, portée, dépendances, verrous et audit.', 'console', links('operator-roles', 'audit', 'features'))),
] as Array<[string, Angelcare360OperatorExperienceProfile]>)

const dossierProfile = hydrate(define(
  'customer-dossier', 'portfolio', 'Relation client', 'Dossier client 360°',
  'Piloter la relation complète sans perdre le contexte commercial, financier ou opérationnel.',
  'Décider de la prochaine intervention et de son propriétaire.',
  'Chronologie, documents, statuts et impacts reliés au dossier.',
  'orbit', links('clients', 'subscriptions', 'support'),
))

const printProfile = hydrate(define(
  'financial-document', 'finance', 'Document financier', 'Édition probante',
  'Présenter une pièce financière claire, stable et immédiatement vérifiable.',
  'Imprimer ou archiver uniquement la version correspondant à la donnée source.',
  'Numéro, client, dates, montants, statut et référence source.',
  'document', links('billing/invoices', 'billing/payments', 'clients'),
))

export function resolveOperatorExperience(pathname: string): Angelcare360OperatorExperienceProfile {
  if (pathname.includes('/print') || pathname.includes('statement-print') || pathname.includes('receipt-print')) return printProfile
  if (pathname.startsWith(`${base}/clients/`)) return dossierProfile
  return exactProfiles[pathname] || exactProfiles[base]
}

function define(
  key: string,
  district: Angelcare360OperatorDistrict,
  districtLabel: string,
  routeLabel: string,
  mission: string,
  decision: string,
  evidence: string,
  signature: string,
  quickLinks: Array<{ label: string; href: string }>,
): ProfileDefinition {
  return { key, district, districtLabel, routeLabel, mission, decision, evidence, signature, quickLinks }
}

function hydrate(definition: ProfileDefinition): Angelcare360OperatorExperienceProfile {
  return { ...definition, ...palette[definition.district] }
}

function entry(suffix: string, definition: ProfileDefinition): [string, Angelcare360OperatorExperienceProfile] {
  return [`${base}${suffix}`, hydrate(definition)]
}

function links(...suffixes: string[]) {
  return suffixes.map((suffix) => ({
    label: labelFor(suffix),
    href: `${base}/${suffix}`.replace(/\/$/, ''),
  }))
}

function labelFor(suffix: string) {
  const labels: Record<string, string> = {
    clients: 'Clients', tenants: 'Tenants', billing: 'Facturation', 'billing/invoices': 'Factures', 'billing/payments': 'Paiements', 'billing/dunning': 'Relances',
    'customer-health': 'Santé clients', renewals: 'Renouvellements', subscriptions: 'Abonnements', support: 'Support', incidents: 'Incidents', implementation: 'Implémentation', onboarding: 'Onboarding', tasks: 'Tâches',
    plans: 'Plans', packages: 'Packages', modules: 'Modules', features: 'Fonctionnalités', 'usage-limits': 'Limites d’usage', audit: 'Audit', settings: 'Paramètres', 'operator-roles': 'Rôles opérateur',
    'service-operations': 'Opérations service', 'service-requests': 'Demandes service', contracts: 'Contrats', 'billing/balances': 'Soldes',
  }
  return labels[suffix] || suffix
}
