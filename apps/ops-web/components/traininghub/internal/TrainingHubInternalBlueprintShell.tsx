'use client'

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { TrainingHubProductionBindingPanel } from './TrainingHubProductionBindingPanel'

type ModuleKey =
  | 'command-center' | 'partners' | 'partner-dossier' | 'commercial' | 'offres' | 'orders' | 'billing' | 'credits'
  | 'catalogue' | 'categories' | 'sessions' | 'participants' | 'trainers' | 'attendance'
  | 'certificates' | 'documents' | 'refresh' | 'quality' | 'reports'
  | 'requests' | 'notifications' | 'users' | 'access' | 'settings' | 'audit' | 'readiness'

type ModuleConfig = {
  key: ModuleKey
  group: string
  href: string
  icon: string
  label: string
  title: string
  subtitle: string
  primary: string
  secondary: string
  kpis: string[]
  tabs: string[]
  lifecycle: string[]
  fields: string[]
  statuses: string[]
  crud: string[]
  modals: string[]
  risks: string[]
}

type Overview = {
  counts: Record<string, number>
  generated_at?: string
}

const GROUPS = ['Pilotage', 'Partenaires', 'Revenus', 'Delivery', 'Preuves', 'Relation partenaire', 'Administration']

const commonStatuses = ['Actif', 'À traiter', 'En cours', 'Validé', 'Bloqué', 'Archivé']

const MODULES: ModuleConfig[] = [
  {
    key: 'command-center',
    group: 'Pilotage',
    href: '/traininghub',
    icon: '⌘',
    label: 'Command Center',
    title: 'TrainingHub Command Center',
    subtitle: 'Cockpit exécutif pour piloter partenaires, revenus, sessions, certificats, demandes et risques opérationnels.',
    primary: 'Créer action prioritaire',
    secondary: 'Lire portefeuille',
    kpis: ['Partenaires actifs', 'Offres ouvertes', 'Commandes confirmées', 'Factures à suivre', 'Sessions à venir', 'Certificats en attente', 'Crédits disponibles', 'Demandes ouvertes'],
    tabs: ['Vue globale', 'Aujourd’hui', 'Partenaires', 'Revenus', 'Delivery', 'Certifications', 'Alertes'],
    lifecycle: ['Partenaire', 'Offre', 'Commande', 'Facture', 'Crédits', 'Session', 'Présence', 'Certificat', 'Refresh'],
    fields: ['Ville', 'Owner', 'Étape', 'Priorité', 'Prochaine action', 'Risque'],
    statuses: commonStatuses,
    crud: ['Créer action', 'Assigner owner', 'Créer offre', 'Planifier session', 'Valider présence', 'Émettre certificats'],
    modals: ['Action Detail', 'Assign Owner', 'Quick Task', 'Plan Session', 'Issue Certificates'],
    risks: ['Factures ouvertes', 'Présences non validées', 'Certificats non émis', 'Demandes partenaires ouvertes'],
  },
  {
    key: 'partners',
    group: 'Partenaires',
    href: '/traininghub/partners',
    icon: '◉',
    label: 'Partenaires',
    title: 'Portefeuille partenaires',
    subtitle: 'Liste maître des crèches, écoles et établissements partenaires avec suivi commercial, opérationnel et qualité.',
    primary: 'Créer partenaire',
    secondary: 'Importer portefeuille',
    kpis: ['Partenaires actifs', 'Villes couvertes', 'Maturity moyenne', 'Demandes ouvertes', 'Factures à suivre', 'Refresh opportunités'],
    tabs: ['Tous', 'Actifs', 'Prospects', 'À risque', 'Avec demandes', 'À renouveler', 'Archivés'],
    lifecycle: ['Prospect', 'Diagnostic', 'Offre', 'Accord', 'Activation', 'Delivery', 'Preuves', 'Renouvellement'],
    fields: ['Nom partenaire', 'Ville', 'Type', 'Owner', 'Score', 'Prochaine action'],
    statuses: ['Actif', 'Prospect', 'Onboarding', 'En pause', 'Archivé'],
    crud: ['Créer partenaire', 'Éditer identité', 'Désactiver', 'Archiver', 'Ouvrir mega dossier', 'Créer accès portail'],
    modals: ['New Partner Wizard', 'Edit Partner Identity', 'Status Change Guard', 'Assign Owner', 'Partner Import'],
    risks: ['Sans owner', 'Sans offre', 'Facture ouverte', 'Refresh non planifié'],
  },
  {
    key: 'partner-dossier',
    group: 'Partenaires',
    href: '/traininghub/partners',
    icon: '▦',
    label: 'Dossier partenaire',
    title: 'Partner Mega Dossier',
    subtitle: 'Vue 360 d’un partenaire: identité, accès, commercial, facturation, crédits, sessions, certificats, demandes et journal.',
    primary: 'Action dossier',
    secondary: 'Créer demande',
    kpis: ['Score partenaire', 'Sessions', 'Participants', 'Certificats', 'Factures ouvertes', 'Demandes'],
    tabs: ['Vue 360', 'Identité', 'Contacts & accès', 'Commercial', 'Offres', 'Commandes', 'Facturation', 'Crédits', 'Formations', 'Sessions', 'Participants', 'Certificats', 'Documents', 'Demandes', 'Refresh', 'Notes internes', 'Journal'],
    lifecycle: ['Dossier', 'Offre', 'Commande', 'Facture', 'Crédits', 'Session', 'Présence', 'Certificat', 'Refresh'],
    fields: ['Contact direction', 'Account owner', 'Statut compte', 'Dernière action', 'Prochain jalon'],
    statuses: ['Actif', 'Attention', 'À renouveler', 'Bloqué'],
    crud: ['Créer contact', 'Créer accès portail', 'Reset password', 'Créer offre', 'Convertir commande', 'Émettre facture', 'Planifier session', 'Valider présence', 'Émettre certificats'],
    modals: ['Contact Modal', 'Portal User Modal', 'Offer Builder', 'Invoice Modal', 'Session Planner', 'Attendance Validation', 'Certificate Batch', 'Internal Note'],
    risks: ['Accès partenaire inactif', 'Facture ouverte', 'Session non planifiée', 'Certificats non publiés'],
  },
  {
    key: 'commercial',
    group: 'Revenus',
    href: '/traininghub/commercial',
    icon: '◆',
    label: 'Commercial',
    title: 'Pipeline commercial',
    subtitle: 'Pilotage acquisition, offres, négociations, conversions, prévisions et relances partenaires.',
    primary: 'Créer opportunité',
    secondary: 'Créer offre',
    kpis: ['Opportunités', 'Offres envoyées', 'Accords validés', 'CA prévisionnel', 'Conversion', 'Relances'],
    tabs: ['Pipeline', 'Opportunités', 'Offres', 'Relances', 'Prévisions', 'Risques'],
    lifecycle: ['Prospect identifié', 'Contact établi', 'Diagnostic', 'Offre préparée', 'Offre envoyée', 'Négociation', 'Accord', 'Commande', 'Activation'],
    fields: ['Partenaire', 'Ville', 'Stage', 'Montant', 'Probabilité', 'Owner', 'Next action'],
    statuses: ['Prospect', 'En contact', 'Offre prête', 'Envoyée', 'Acceptée', 'Perdue'],
    crud: ['Créer opportunité', 'Éditer opportunité', 'Assigner owner', 'Créer offre', 'Envoyer offre', 'Marquer acceptée', 'Convertir commande'],
    modals: ['Opportunity Modal', 'Offer Builder', 'Proposal Preview', 'Convert to Order', 'Commercial Note', 'Follow-up Reminder'],
    risks: ['Offre expirée', 'Sans relance', 'Montant bloqué', 'Décision retardée'],
  },
  {
    key: 'offres',
    group: 'Revenus',
    href: '/traininghub/offres',
    icon: '▱',
    label: 'Offres',
    title: 'Offres & propositions',
    subtitle: 'Création, prévisualisation, envoi, acceptation et conversion des propositions partenaires.',
    primary: 'Créer offre',
    secondary: 'Prévisualiser',
    kpis: ['Brouillons', 'Prêtes', 'Envoyées', 'Acceptées', 'Converties', 'Expirées'],
    tabs: ['Toutes', 'Brouillons', 'Prêtes', 'Envoyées', 'Acceptées', 'Converties', 'Expirées'],
    lifecycle: ['Brouillon', 'Prête', 'Envoyée', 'Vue', 'Acceptée', 'Commande', 'Facture', 'Crédits'],
    fields: ['Partenaire', 'Formation', 'Participants', 'Heures', 'Format', 'Prix', 'Remise', 'Validité'],
    statuses: ['Brouillon', 'Prête à envoyer', 'Envoyée', 'Vue partenaire', 'Acceptée', 'Refusée', 'Convertie', 'Expirée'],
    crud: ['Créer offre', 'Éditer offre', 'Dupliquer', 'Envoyer', 'Accepter', 'Refuser', 'Convertir', 'Supprimer brouillon'],
    modals: ['Create Offer', 'Edit Offer', 'Partner Proposal Preview', 'Send Offer', 'Accept Offer', 'Reject Offer', 'Delete Draft Guard'],
    risks: ['Offre sans formation', 'Validité dépassée', 'Remise élevée', 'Sans prochaine action'],
  },
  {
    key: 'orders',
    group: 'Revenus',
    href: '/traininghub/orders',
    icon: '◈',
    label: 'Commandes',
    title: 'Commandes',
    subtitle: 'Formalisation des offres acceptées: commande, verrouillage, facture et génération des crédits.',
    primary: 'Créer commande',
    secondary: 'Générer facture',
    kpis: ['Commandes', 'Confirmées', 'À facturer', 'Crédits à générer', 'Annulées', 'Montant'],
    tabs: ['Toutes', 'Confirmées', 'À facturer', 'Avec crédits', 'Annulées'],
    lifecycle: ['Offre acceptée', 'Commande créée', 'Commande verrouillée', 'Facture émise', 'Crédits générés', 'Delivery planifié'],
    fields: ['Commande', 'Partenaire', 'Offre source', 'Montant', 'Statut', 'Crédits'],
    statuses: ['Brouillon', 'Confirmée', 'Verrouillée', 'Facturée', 'Crédits créés', 'Annulée'],
    crud: ['Créer depuis offre', 'Éditer avant verrouillage', 'Annuler', 'Verrouiller', 'Générer facture', 'Générer crédits'],
    modals: ['Order Detail', 'Generate Invoice', 'Generate Credits', 'Cancel Order', 'Commercial Validation'],
    risks: ['Commande non verrouillée', 'Facture non générée', 'Crédits manquants'],
  },
  {
    key: 'billing',
    group: 'Revenus',
    href: '/traininghub/billing',
    icon: '◌',
    label: 'Facturation',
    title: 'Factures & paiements',
    subtitle: 'Suivi factures, paiements, soldes partenaires et corrections commerciales.',
    primary: 'Créer facture',
    secondary: 'Marquer payé',
    kpis: ['Factures ouvertes', 'Payées', 'En retard', 'Paiements', 'Solde', 'Corrections'],
    tabs: ['Ouvertes', 'Payées', 'En retard', 'Paiements', 'Comptes', 'Corrections'],
    lifecycle: ['Brouillon', 'Émise', 'Envoyée', 'Partielle', 'Payée', 'Correction', 'Clôturée'],
    fields: ['Facture', 'Partenaire', 'Date', 'Montant', 'Solde', 'Statut', 'Preuve'],
    statuses: ['Brouillon', 'Émise', 'Envoyée', 'Partiellement payée', 'Payée', 'En retard', 'Annulée'],
    crud: ['Créer facture', 'Éditer brouillon', 'Envoyer', 'Marquer payé', 'Joindre preuve', 'Correction', 'Télécharger PDF'],
    modals: ['Invoice Detail', 'Payment Confirmation', 'Invoice Correction', 'Billing Account', 'Download / Print'],
    risks: ['En retard', 'Sans preuve paiement', 'Montant incohérent', 'Partenaire sans compte'],
  },
  {
    key: 'credits',
    group: 'Revenus',
    href: '/traininghub/credits',
    icon: '◇',
    label: 'Crédits formation',
    title: 'Crédits formation',
    subtitle: 'Contrôle des crédits achetés, disponibles, consommés, restaurés ou expirés par partenaire.',
    primary: 'Ajouter crédits',
    secondary: 'Historique',
    kpis: ['Disponibles', 'Consommés', 'Expirants', 'Restaurés', 'Partenaires', 'Valeur'],
    tabs: ['Disponibles', 'Consommés', 'Expirants', 'Ajustements', 'Historique'],
    lifecycle: ['Commande', 'Crédit créé', 'Crédit disponible', 'Session assignée', 'Consommé', 'Certifié', 'Refresh'],
    fields: ['Partenaire', 'Type crédit', 'Source', 'Quantité', 'Statut', 'Expiration'],
    statuses: ['Disponible', 'Réservé', 'Consommé', 'Restauré', 'Expiré'],
    crud: ['Ajouter crédits', 'Assigner session', 'Consommer', 'Restaurer', 'Expirer', 'Ajuster'],
    modals: ['Add Credit', 'Credit Consumption', 'Credit Adjustment', 'Credit History'],
    risks: ['Crédits expirants', 'Session sans crédits', 'Crédits consommés sans présence'],
  },
  {
    key: 'catalogue',
    group: 'Delivery',
    href: '/traininghub/catalogue',
    icon: '▤',
    label: 'Catalogue',
    title: 'Catalogue formations',
    subtitle: 'Gestion des catégories, formations, parcours, modules, prix, règles de certificat et règles refresh.',
    primary: 'Créer formation',
    secondary: 'Gérer catégories',
    kpis: ['Formations actives', 'Catégories', 'Parcours', 'Brouillons', 'Archivées', 'Prix configurés'],
    tabs: ['Formations', 'Catégories', 'Parcours', 'Modules', 'Tarifs', 'Éligibilité', 'Archives'],
    lifecycle: ['Brouillon', 'Revue', 'Publié', 'Offres', 'Sessions', 'Certificats', 'Refresh', 'Archive'],
    fields: ['Référence', 'Titre', 'Catégorie', 'Objectifs', 'Durée', 'Format', 'Prix', 'Limites', 'Règles certificat'],
    statuses: ['Brouillon', 'Publié', 'Désactivé', 'Archivé'],
    crud: ['Créer formation', 'Éditer', 'Désactiver', 'Supprimer avec guard', 'Archiver', 'Dupliquer', 'Publier', 'Dépublier'],
    modals: ['Course Detail Preview', 'Create / Edit Course', 'Disable Course', 'Delete Course Guard', 'Category Manager', 'Pricing Modal', 'Certificate Rules', 'Refresh Rules'],
    risks: ['Formation sans prix', 'Sans règle certificat', 'Catégorie vide', 'Archive impactant offres'],
  },
  {
    key: 'categories',
    group: 'Delivery',
    href: '/traininghub/categories',
    icon: '◫',
    label: 'Catégories',
    title: 'Catégories & parcours',
    subtitle: 'Organisation pédagogique des catégories, parcours, familles de modules et règles de visibilité.',
    primary: 'Créer catégorie',
    secondary: 'Réordonner',
    kpis: ['Catégories', 'Parcours', 'Formations liées', 'Actives', 'Archivées', 'Sans contenu'],
    tabs: ['Catégories', 'Parcours', 'Ordre', 'Visibilité', 'Archives'],
    lifecycle: ['Créer', 'Structurer', 'Lier formations', 'Publier', 'Mesurer', 'Archiver'],
    fields: ['Nom', 'Code', 'Description', 'Ordre', 'Visibilité', 'Formations liées'],
    statuses: ['Active', 'Masquée', 'Archivée'],
    crud: ['Créer', 'Éditer', 'Désactiver', 'Archiver', 'Supprimer avec guard', 'Réordonner'],
    modals: ['Category Modal', 'Pathway Modal', 'Visibility Modal', 'Delete Guard', 'Reorder Modal'],
    risks: ['Catégorie sans formation', 'Suppression impactante', 'Parcours non publié'],
  },
  {
    key: 'sessions',
    group: 'Delivery',
    href: '/traininghub/sessions',
    icon: '◷',
    label: 'Sessions',
    title: 'Sessions',
    subtitle: 'Planification et suivi de la delivery: calendrier, liste, formateurs, partenaires, participants et clôture.',
    primary: 'Planifier session',
    secondary: 'Vue calendrier',
    kpis: ['À planifier', 'Planifiées', 'Confirmées', 'Terminées', 'Présence à valider', 'Annulées'],
    tabs: ['Calendrier', 'Liste', 'Partenaire', 'Formateur', 'Board statut'],
    lifecycle: ['À planifier', 'Planifiée', 'Confirmée', 'Préparation', 'En cours', 'Terminée', 'Présence', 'Certificats', 'Clôturée'],
    fields: ['Session', 'Partenaire', 'Formation', 'Date', 'Lieu', 'Formateur', 'Participants', 'Statut'],
    statuses: ['À planifier', 'Planifiée', 'Confirmée', 'En préparation', 'En cours', 'Terminée', 'Présence à valider', 'Certificats à émettre', 'Clôturée', 'Annulée'],
    crud: ['Créer session', 'Éditer', 'Assigner formateur', 'Ajouter participants', 'Confirmer', 'Reporter', 'Annuler', 'Clôturer'],
    modals: ['Session Planner', 'Session Detail', 'Assign Trainer', 'Add Participants', 'Postpone Session', 'Cancel Session', 'Close Session'],
    risks: ['Sans formateur', 'Sans participants', 'Date dépassée', 'Présence non validée'],
  },
  {
    key: 'participants',
    group: 'Delivery',
    href: '/traininghub/participants',
    icon: '●',
    label: 'Participants',
    title: 'Participants',
    subtitle: 'Gestion des collaborateurs formés sous les établissements partenaires.',
    primary: 'Ajouter participant',
    secondary: 'Importer',
    kpis: ['Participants', 'Présents', 'Absents', 'Éligibles certificat', 'À corriger', 'Refresh'],
    tabs: ['Tous', 'Par session', 'Par partenaire', 'Éligibles', 'À corriger', 'Import'],
    lifecycle: ['Ajouté', 'Assigné session', 'Présence', 'Éligibilité', 'Certificat', 'Refresh'],
    fields: ['Nom', 'Partenaire', 'Rôle', 'Session', 'Présence', 'Certificat', 'Refresh'],
    statuses: ['Inscrit', 'Présent', 'Absent', 'Justifié', 'Éligible', 'Certifié', 'À corriger'],
    crud: ['Ajouter', 'Éditer', 'Importer', 'Retirer session', 'Transférer session', 'Désactiver'],
    modals: ['Participant Detail', 'Import Participants', 'Assign to Session', 'Edit Participant', 'Remove Participant'],
    risks: ['Doublon', 'Sans session', 'Présence manquante', 'Certificat bloqué'],
  },
  {
    key: 'trainers',
    group: 'Delivery',
    href: '/traininghub/trainers',
    icon: '▲',
    label: 'Formateurs',
    title: 'Formateurs',
    subtitle: 'Profils formateurs, compétences, disponibilités, sessions assignées et qualité delivery.',
    primary: 'Créer formateur',
    secondary: 'Disponibilités',
    kpis: ['Formateurs actifs', 'Sessions assignées', 'Disponibles', 'Saturés', 'Feedback', 'Documents'],
    tabs: ['Profils', 'Compétences', 'Disponibilités', 'Sessions', 'Qualité'],
    lifecycle: ['Profil', 'Compétences', 'Disponibilité', 'Assignation', 'Delivery', 'Feedback'],
    fields: ['Nom', 'Compétences', 'Ville', 'Disponibilité', 'Sessions', 'Qualité'],
    statuses: ['Actif', 'Disponible', 'Assigné', 'Suspendu'],
    crud: ['Créer', 'Éditer', 'Activer', 'Suspendre', 'Assigner session', 'Définir disponibilité', 'Joindre documents'],
    modals: ['Trainer Profile', 'Availability Modal', 'Assign Trainer', 'Trainer Quality Review'],
    risks: ['Session sans formateur', 'Disponibilité manquante', 'Feedback faible'],
  },
  {
    key: 'attendance',
    group: 'Delivery',
    href: '/traininghub/attendance',
    icon: '✓',
    label: 'Présences',
    title: 'Présences & validation',
    subtitle: 'Validation des présences, preuves, correction et verrouillage avant émission des certificats.',
    primary: 'Valider présence',
    secondary: 'Feuille session',
    kpis: ['Sessions à valider', 'Présents', 'Absents', 'Justifiés', 'Verrouillées', 'Corrections'],
    tabs: ['À valider', 'Par session', 'Corrections', 'Verrouillées', 'Éligibilité'],
    lifecycle: ['Session terminée', 'Présence saisie', 'Validation formateur', 'Validation admin', 'Verrouillage', 'Certificats prêts'],
    fields: ['Session', 'Participant', 'Statut', 'Preuve', 'Validé par', 'Date validation'],
    statuses: ['À valider', 'Présent', 'Absent', 'Justifié', 'Corrigé', 'Verrouillé'],
    crud: ['Marquer présent', 'Marquer absent', 'Justifier', 'Valider', 'Demander correction', 'Verrouiller', 'Déverrouiller avec raison'],
    modals: ['Attendance Sheet', 'Presence Correction', 'Admin Validation', 'Lock Confirmation'],
    risks: ['Présence non verrouillée', 'Correction ouverte', 'Certificat bloqué'],
  },
  {
    key: 'certificates',
    group: 'Preuves',
    href: '/traininghub/certificates',
    icon: '✦',
    label: 'Certificats',
    title: 'Certificats',
    subtitle: 'Émission, correction, publication et audit des certificats liés aux présences validées.',
    primary: 'Émettre certificats',
    secondary: 'Batch',
    kpis: ['À préparer', 'Éligibles', 'Émis', 'Publiés', 'À corriger', 'À renouveler'],
    tabs: ['À préparer', 'Éligibles', 'Émis', 'Publiés', 'Corrections', 'Expirations'],
    lifecycle: ['Présence validée', 'Éligible', 'Prévisualisation', 'Émis', 'Publié', 'Refresh'],
    fields: ['Numéro', 'Participant', 'Formation', 'Session', 'Date émission', 'Refresh date', 'Statut'],
    statuses: ['À préparer', 'Éligible', 'Émis', 'Envoyé', 'Corrigé', 'Annulé', 'Expiré', 'À renouveler'],
    crud: ['Générer', 'Éditer avant émission', 'Émettre', 'Réémettre corrigé', 'Annuler', 'Télécharger PDF', 'Publier portail'],
    modals: ['Certificate Preview', 'Generate Batch', 'Correction Modal', 'Cancel Certificate Guard', 'Download Modal'],
    risks: ['Présence manquante', 'Numérotation incohérente', 'Correction sans historique'],
  },
  {
    key: 'documents',
    group: 'Preuves',
    href: '/traininghub/documents',
    icon: '▣',
    label: 'Documents',
    title: 'Documents & kits',
    subtitle: 'Coffre documentaire: offres, commandes, factures, supports, feuilles présence, certificats, proof kits et rapports.',
    primary: 'Ajouter document',
    secondary: 'Publier portail',
    kpis: ['Documents', 'Publiés', 'Supports', 'Factures', 'Certificats', 'Corrections'],
    tabs: ['Tous', 'Commercial', 'Formation', 'Facturation', 'Certificats', 'Kits', 'Rapports'],
    lifecycle: ['Créer / générer', 'Revue', 'Publier partenaire', 'Téléchargé', 'Archiver'],
    fields: ['Titre', 'Type', 'Partenaire', 'Entité liée', 'Statut', 'Publié le'],
    statuses: ['Brouillon', 'Disponible', 'Publié', 'Masqué', 'Archivé'],
    crud: ['Upload', 'Générer', 'Publier', 'Masquer', 'Télécharger', 'Imprimer', 'Demander correction'],
    modals: ['Upload Document', 'Document Preview', 'Publish Modal', 'Unpublish Modal', 'Document Correction'],
    risks: ['Document non publié', 'Fichier manquant', 'Correction ouverte'],
  },
  {
    key: 'refresh',
    group: 'Preuves',
    href: '/traininghub/refresh',
    icon: '↻',
    label: 'Refresh',
    title: 'Refresh & renouvellements',
    subtitle: 'Moteur de continuité: refresh e-learning, renouvellements, certificats expirants et opportunités récurrentes.',
    primary: 'Créer recommandation',
    secondary: 'Offre renewal',
    kpis: ['Due refresh', 'Certificats expirants', 'Crédits refresh', 'Offres renewal', 'Sessions refresh', 'CA récurrent'],
    tabs: ['À recommander', 'Expirations', 'Crédits refresh', 'Offres renewal', 'Calendrier annuel'],
    lifecycle: ['Certificat émis', 'Période active', 'Refresh recommandé', 'Offre renewal', 'Session refresh', 'Renouvellement'],
    fields: ['Partenaire', 'Certificat', 'Date expiration', 'Module recommandé', 'Owner', 'Action'],
    statuses: ['À recommander', 'Planifié', 'Offre envoyée', 'Renouvelé', 'Expiré'],
    crud: ['Créer recommandation', 'Créer offre renewal', 'Planifier refresh', 'Notifier partenaire', 'Ajouter crédits refresh'],
    modals: ['Refresh Recommendation', 'Renewal Offer Builder', 'Refresh Planning', 'Notify Partner'],
    risks: ['Certificat expirant', 'Partner sans refresh', 'Renewal non relancé'],
  },
  {
    key: 'quality',
    group: 'Preuves',
    href: '/traininghub/quality',
    icon: '★',
    label: 'Qualité',
    title: 'Qualité partenaire',
    subtitle: 'Mesure maturité, couverture certificat, continuité refresh, preuves parent-trust et alertes qualité.',
    primary: 'Créer rapport qualité',
    secondary: 'Publier synthèse',
    kpis: ['Score moyen', 'Couverture équipe', 'Certificats actifs', 'Refresh continuité', 'Risques', 'Rapports'],
    tabs: ['Maturity', 'Couverture', 'Preuves', 'Risques', 'Recommandations', 'Rapports qualité'],
    lifecycle: ['Formation', 'Présence', 'Certificat', 'Preuve', 'Refresh', 'Rapport qualité'],
    fields: ['Partenaire', 'Score', 'Couverture', 'Preuves', 'Risques', 'Recommandation'],
    statuses: ['Excellent', 'Solide', 'À renforcer', 'À risque'],
    crud: ['Créer rapport', 'Ajouter recommandation', 'Planifier follow-up', 'Publier synthèse'],
    modals: ['Quality Report Preview', 'Recommendation Modal', 'Risk Modal', 'Publish Report'],
    risks: ['Score faible', 'Equipe non couverte', 'Refresh manquant'],
  },
  {
    key: 'reports',
    group: 'Preuves',
    href: '/traininghub/reports',
    icon: '▧',
    label: 'Rapports',
    title: 'Rapports',
    subtitle: 'Rapports exécutifs, partenaires, delivery, certificats, facturation, pipeline et refresh.',
    primary: 'Générer rapport',
    secondary: 'Preview A4',
    kpis: ['Rapports générés', 'Mensuels', 'Partenaires', 'Delivery', 'Certificats', 'Facturation'],
    tabs: ['Partner progress', 'Delivery', 'Certificats', 'Billing', 'Pipeline', 'Monthly management', 'Refresh'],
    lifecycle: ['Sélection données', 'Génération', 'Preview A4', 'Validation', 'Envoi', 'Version sauvegardée'],
    fields: ['Type rapport', 'Période', 'Partenaire', 'Généré par', 'Statut'],
    statuses: ['Brouillon', 'Prévisualisé', 'Validé', 'Envoyé', 'Archivé'],
    crud: ['Générer', 'Prévisualiser A4', 'Télécharger PDF', 'Envoyer partenaire', 'Sauvegarder version'],
    modals: ['Report Builder', 'A4 Preview', 'Send Report', 'Save Version'],
    risks: ['Rapport sans données', 'Version non validée', 'Envoi manquant'],
  },
  {
    key: 'requests',
    group: 'Relation partenaire',
    href: '/traininghub/requests',
    icon: '✉',
    label: 'Demandes partenaires',
    title: 'Demandes partenaires',
    subtitle: 'File interne des demandes créées depuis le portail partenaire.',
    primary: 'Créer demande',
    secondary: 'Assigner',
    kpis: ['Ouvertes', 'Assignées', 'En cours', 'En attente partenaire', 'Résolues', 'Réouvertes'],
    tabs: ['Ouvertes', 'Assignées', 'En cours', 'En attente', 'Résolues', 'Fermées'],
    lifecycle: ['Créée', 'Assignée', 'En cours', 'Réponse', 'Résolue', 'Fermée', 'Réouverte'],
    fields: ['Type', 'Partenaire', 'Titre', 'Priorité', 'Owner', 'Dernière mise à jour'],
    statuses: ['Ouverte', 'Assignée', 'En cours', 'En attente partenaire', 'Résolue', 'Fermée', 'Réouverte'],
    crud: ['Créer', 'Assigner owner', 'Répondre', 'Joindre document', 'Fermer', 'Réouvrir'],
    modals: ['Request Detail', 'Assign Owner', 'Reply to Partner', 'Attach Document', 'Close Request', 'Reopen Request'],
    risks: ['SLA dépassé', 'Sans owner', 'Réouverture fréquente'],
  },
  {
    key: 'notifications',
    group: 'Relation partenaire',
    href: '/traininghub/notifications',
    icon: '◔',
    label: 'Notifications',
    title: 'Notifications & relances',
    subtitle: 'Composer, planifier et suivre notifications partenaires et alertes internes.',
    primary: 'Créer notification',
    secondary: 'Planifier relance',
    kpis: ['À envoyer', 'Envoyées', 'Lues', 'Planifiées', 'Relances', 'Templates'],
    tabs: ['Toutes', 'Partenaires', 'Internes', 'Planifiées', 'Templates', 'Historique'],
    lifecycle: ['Composer', 'Planifier', 'Envoyer', 'Lu', 'Relance', 'Clôture'],
    fields: ['Type', 'Destinataire', 'Canal', 'Objet', 'Statut', 'Date'],
    statuses: ['Brouillon', 'Planifiée', 'Envoyée', 'Lue', 'Échouée'],
    crud: ['Créer notification', 'Envoyer email', 'Programmer relance', 'Marquer lu', 'Choisir template'],
    modals: ['Notification Composer', 'Reminder Scheduler', 'Template Picker'],
    risks: ['Relance non envoyée', 'Template manquant', 'Notification échouée'],
  },
  {
    key: 'users',
    group: 'Administration',
    href: '/traininghub/users',
    icon: '◍',
    label: 'Utilisateurs',
    title: 'Utilisateurs',
    subtitle: 'Gestion des comptes internes AngelCare et des accès portail partenaire.',
    primary: 'Créer utilisateur',
    secondary: 'Reset password',
    kpis: ['Internes', 'Partenaires', 'Actifs', 'Désactivés', 'À vérifier', 'Rôles'],
    tabs: ['Tous', 'Internes', 'Partenaires', 'Formateurs', 'Désactivés', 'Accès récents'],
    lifecycle: ['Créé', 'Rôle assigné', 'Actif', 'Usage', 'Désactivé', 'Réactivé'],
    fields: ['Nom', 'Email', 'Type', 'Organisation', 'Rôle', 'Statut'],
    statuses: ['Actif', 'Suspendu', 'Désactivé', 'À vérifier'],
    crud: ['Créer', 'Éditer', 'Désactiver', 'Réactiver', 'Reset password', 'Assigner organisation', 'Assigner rôle'],
    modals: ['Create User', 'Edit Access', 'Reset Password', 'Disable User', 'Role Assignment'],
    risks: ['Sans organisation', 'Rôle incohérent', 'Accès inactif'],
  },
  {
    key: 'access',
    group: 'Administration',
    href: '/traininghub/access',
    icon: '◬',
    label: 'Rôles & accès',
    title: 'Rôles & accès',
    subtitle: 'Rôles en langage métier: direction, commercial, coordinateur, formateur, facturation, support, partenaire.',
    primary: 'Créer rôle',
    secondary: 'Audit accès',
    kpis: ['Rôles', 'Permissions', 'Assignations', 'Internes', 'Partenaires', 'Alertes'],
    tabs: ['Rôles', 'Permissions', 'Assignations', 'Audit', 'Partenaires'],
    lifecycle: ['Rôle créé', 'Permissions', 'Assigné', 'Contrôlé', 'Révoqué'],
    fields: ['Rôle', 'Groupe permission', 'Utilisateur', 'Organisation', 'Statut'],
    statuses: ['Actif', 'En revue', 'À corriger'],
    crud: ['Créer rôle', 'Assigner permissions', 'Assigner utilisateur', 'Révoquer', 'Auditer'],
    modals: ['Role Detail', 'Create Role', 'Assign Permissions', 'Access Audit'],
    risks: ['Permission trop large', 'Utilisateur sans rôle', 'Rôle inutilisé'],
  },
  {
    key: 'settings',
    group: 'Administration',
    href: '/traininghub/settings',
    icon: '⚙',
    label: 'Paramètres',
    title: 'Paramètres TrainingHub',
    subtitle: 'Règles métier: pricing, numérotation, certificats, templates, refresh, qualité et portail partenaire.',
    primary: 'Modifier règle',
    secondary: 'Templates',
    kpis: ['Règles pricing', 'Numérotations', 'Templates', 'Refresh rules', 'Qualité', 'Notifications'],
    tabs: ['Général', 'Tarifs', 'Certificats', 'Factures', 'Refresh', 'Templates', 'Qualité'],
    lifecycle: ['Règle', 'Validation', 'Publication', 'Application', 'Audit'],
    fields: ['Règle', 'Portée', 'Valeur', 'Statut', 'Dernière modification'],
    statuses: ['Actif', 'Brouillon', 'À valider'],
    crud: ['Modifier règle', 'Créer template', 'Activer', 'Désactiver', 'Tester', 'Publier'],
    modals: ['Numbering Rules', 'Certificate Template', 'Notification Template', 'Pricing Rule', 'Refresh Rule', 'Quality Score Rule'],
    risks: ['Template manquant', 'Numérotation incohérente', 'Règle non publiée'],
  },
  {
    key: 'audit',
    group: 'Administration',
    href: '/traininghub/audit',
    icon: '◜',
    label: 'Journal & sécurité',
    title: 'Journal & sécurité',
    subtitle: 'Historique interne des actions sensibles sur partenaires, offres, factures, sessions, certificats et accès.',
    primary: 'Filtrer journal',
    secondary: 'Exporter',
    kpis: ['Actions', 'Accès', 'Changements', 'Danger actions', 'Corrections', 'Exports'],
    tabs: ['Timeline', 'Partenaires', 'Revenus', 'Delivery', 'Certificats', 'Accès', 'Danger'],
    lifecycle: ['Action', 'Acteur', 'Entité', 'Avant', 'Après', 'Trace'],
    fields: ['Acteur', 'Action', 'Entité', 'Date', 'Avant/après', 'Raison'],
    statuses: ['Info', 'Important', 'Danger', 'Correction'],
    crud: ['Filtrer', 'Voir détail', 'Exporter', 'Attacher justification'],
    modals: ['Audit Detail', 'Before / After', 'Export Modal'],
    risks: ['Action dangereuse', 'Modification sans raison', 'Accès suspect'],
  },
  {
    key: 'readiness',
    group: 'Administration',
    href: '/traininghub/readiness',
    icon: '◎',
    label: 'Production readiness',
    title: 'Production readiness',
    subtitle: 'Validation interne du passage production: chaînes métier, isolation partenaires, nettoyage tests et checklist finale.',
    primary: 'Lire état production',
    secondary: 'Verrouiller baseline',
    kpis: ['Chaîne partenaires', 'Chaîne commerciale', 'Chaîne facturation', 'Chaîne delivery', 'Chaîne certificats', 'Tests nettoyés'],
    tabs: ['État global', 'Chaîne data', 'Isolation partenaires', 'Tests', 'Checklist', 'Historique'],
    lifecycle: ['Préparation', 'Validation chaîne', 'Isolation', 'Nettoyage', 'Checklist', 'Go production'],
    fields: ['Checkpoint', 'Statut', 'Dernier contrôle', 'Responsable', 'Action'],
    statuses: ['Prêt', 'À vérifier', 'Bloqué', 'Nettoyé'],
    crud: ['Lire état', 'Lancer contrôle', 'Nettoyer tests', 'Valider checkpoint', 'Verrouiller baseline'],
    modals: ['Readiness Detail', 'Clean Test Data', 'Baseline Lock', 'Release Gate'],
    risks: ['Tests restants', 'Chaîne incomplète', 'Isolation non prouvée'],
  },
]

function moduleByKey(key: ModuleKey) {
  return MODULES.find((module) => module.key === key) || MODULES[0]
}

function countFor(module: ModuleConfig, overview: Overview | null, index: number) {
  const counts = overview?.counts || {}
  if (module.key === 'partners' || module.key === 'partner-dossier') return counts.partners || 0
  if (module.key === 'commercial' || module.key === 'offres') return counts.proposals || 0
  if (module.key === 'orders') return counts.orders || 0
  if (module.key === 'billing') return counts.invoices || 0
  if (module.key === 'credits') return counts.credits || 0
  if (module.key === 'sessions') return counts.sessions || 0
  if (module.key === 'participants') return counts.participants || 0
  if (module.key === 'certificates') return counts.certificates || 0
  if (module.key === 'documents') return counts.documents || 0
  if (module.key === 'requests') return counts.requests || 0
  if (module.key === 'notifications') return counts.notifications || 0
  if (module.key === 'users') return counts.users || 0
  return index === 0 ? Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0) : 0
}

export function TrainingHubInternalBlueprintShell({ moduleKey, entityId }: { moduleKey: ModuleKey; entityId?: string }) {
  const module = moduleByKey(moduleKey)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [activeTab, setActiveTab] = useState(module.tabs[0])
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('Toutes les villes')
  const [status, setStatus] = useState('Tous statuts')
  const [modal, setModal] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setActiveTab(module.tabs[0])
  }, [module.key, module.tabs])

  useEffect(() => {
    let cancelled = false
    fetch('/api/traininghub/internal/overview', { cache: 'no-store' })
      .then((response) => response.json())
      .then((payload) => {
        if (!cancelled && payload?.ok) setOverview(payload.data)
      })
      .catch(() => {
        if (!cancelled) setOverview(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const rows = useMemo(() => {
    const source = module.fields.map((field, index) => ({
      id: `${module.key}-${field}-${index}`,
      field,
      value: index === 0 ? module.label : index === 1 ? city : index === 2 ? activeTab : index === 3 ? status : module.statuses[index % module.statuses.length],
      status: module.statuses[index % module.statuses.length],
      owner: ['Direction', 'Commercial', 'Coordination', 'Delivery', 'Support'][index % 5],
      action: module.crud[index % module.crud.length],
    }))

    if (!query.trim()) return source
    return source.filter((row) => `${row.field} ${row.value} ${row.status} ${row.owner}`.toLowerCase().includes(query.trim().toLowerCase()))
  }, [activeTab, city, module, query, status])

  async function submitAction(action: string) {
    setBusy(true)
    setMessage(null)
    try {
      const response = await fetch('/api/traininghub/internal/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: module.key, action, entity_id: entityId || null }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        setMessage(payload?.message || payload?.error?.message || 'Action non finalisée.')
        return
      }
      setMessage(`Action enregistrée: ${action}`)
      setModal(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main style={pageStyle}>
      <aside style={sidebarStyle}>
        <div style={brandBlockStyle}>
          <div style={logoFrameStyle}>
            <img src="/logo.png" alt="AngelCare" style={logoStyle} />
          </div>
          <div>
            <strong style={brandTitleStyle}>TrainingHub</strong>
            <span style={brandSubtitleStyle}>Internal Admin OS</span>
          </div>
        </div>

        <nav style={sidebarNavStyle}>
          {GROUPS.map((group) => (
            <div key={group} style={navGroupStyle}>
              <div style={navGroupTitleStyle}>{group}</div>
              {MODULES.filter((item) => item.group === group).map((item) => (
                <Link key={item.key} href={item.href} style={item.key === module.key ? navItemActiveStyle : navItemStyle}>
                  <span style={navIconStyle}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <section style={mainStyle}>
        <header style={topbarStyle}>
          <div>
            <div style={breadcrumbStyle}>AngelCare TrainingHub • {module.group}</div>
            <h1 style={topbarTitleStyle}>{module.title}</h1>
          </div>
          <div style={topbarActionsStyle}>
            <button type="button" style={ghostButtonStyle} onClick={() => setModal(module.secondary)}>{module.secondary}</button>
            <button type="button" style={primaryButtonStyle} onClick={() => setModal(module.primary)}>{module.primary}</button>
          </div>
        </header>

        {message ? <div style={messageStyle}>{message}</div> : null}

        <section style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>BLUEPRINT MODULE • {module.label.toUpperCase()}</div>
            <h2 style={heroTitleStyle}>{module.subtitle}</h2>
            <p style={heroTextStyle}>Chaque action reste reliée au dossier partenaire, à la chaîne commerciale, à la delivery, aux preuves et au renouvellement.</p>
          </div>
          <div style={heroRightStyle}>
            <Metric label="État module" value="Premium" note="UX interne" />
            <Metric label="Source" value={countFor(module, overview, 0)} note="éléments détectés" />
            <Metric label="Route" value={module.href} note={entityId ? `Dossier ${entityId.slice(0, 8)}` : 'workspace'} />
          </div>
        </section>

        <section style={kpiGridStyle}>
          {module.kpis.map((kpi, index) => (
            <article key={kpi} style={kpiCardStyle}>
              <div style={kpiIconStyle}>{index + 1}</div>
              <strong>{kpi}</strong>
              <span>{index === 0 ? countFor(module, overview, index) : 0}</span>
              <small>{module.statuses[index % module.statuses.length]}</small>
            </article>
          ))}
        </section>

        <section style={commandBarStyle}>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher partenaire, statut, action, owner…" style={inputStyle} />
          <select value={city} onChange={(event) => setCity(event.target.value)} style={selectStyle}>
            {['Toutes les villes', 'Rabat', 'Casablanca', 'Kénitra', 'Tanger', 'Marrakech', 'Fès', 'Agadir'].map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} style={selectStyle}>
            {['Tous statuts', ...module.statuses].map((item) => <option key={item}>{item}</option>)}
          </select>
          <button type="button" style={ghostButtonStyle} onClick={() => setModal('Importer / Exporter')}>Import / Export</button>
        </section>

        <section style={lifecycleStyle}>
          {module.lifecycle.map((step, index) => (
            <div key={step} style={index < 3 ? lifecycleActiveStepStyle : lifecycleStepStyle}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </section>

        <TrainingHubProductionBindingPanel moduleKey={module.key} moduleTitle={module.title} entityId={entityId} />

        <section style={workspaceStyle}>
          <div style={tabsStyle}>
            {module.tabs.map((tab) => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)} style={activeTab === tab ? tabActiveStyle : tabStyle}>{tab}</button>
            ))}
          </div>

          <div style={workspaceGridStyle}>
            <div style={primaryPanelStyle}>
              <div style={panelHeaderStyle}>
                <div>
                  <div style={eyebrowStyle}>WORKSPACE</div>
                  <h3 style={panelTitleStyle}>{activeTab}</h3>
                </div>
                <button type="button" style={primaryButtonStyle} onClick={() => setModal(module.primary)}>{module.primary}</button>
              </div>

              <div style={tableStyle}>
                <div style={tableHeaderStyle}>
                  <span>Champ</span>
                  <span>Valeur</span>
                  <span>Statut</span>
                  <span>Owner</span>
                  <span>Action</span>
                </div>
                {rows.length ? rows.map((row) => (
                  <button key={row.id} type="button" style={tableRowStyle} onClick={() => setModal(`${row.field} • ${row.action}`)}>
                    <span>{row.field}</span>
                    <strong>{row.value}</strong>
                    <em>{row.status}</em>
                    <span>{row.owner}</span>
                    <b>{row.action}</b>
                  </button>
                )) : <div style={emptyStateStyle}>Aucun élément ne correspond aux filtres.</div>}
              </div>
            </div>

            <aside style={rightRailStyle}>
              <div style={rightCardStyle}>
                <div style={eyebrowStyle}>ACTIONS CRUD</div>
                {module.crud.map((action) => (
                  <button key={action} type="button" style={railActionStyle} onClick={() => setModal(action)}>{action}</button>
                ))}
              </div>

              <div style={rightCardStyle}>
                <div style={eyebrowStyle}>MODALS PRÉVUS</div>
                {module.modals.map((item) => (
                  <button key={item} type="button" style={railModalStyle} onClick={() => setModal(item)}>{item}</button>
                ))}
              </div>

              <div style={riskCardStyle}>
                <div style={eyebrowStyle}>RISQUES À SURVEILLER</div>
                {module.risks.map((item) => <p key={item} style={riskLineStyle}>{item}</p>)}
              </div>
            </aside>
          </div>
        </section>
      </section>

      {modal ? (
        <div style={modalOverlayStyle}>
          <section style={modalStyle}>
            <div style={modalHeaderStyle}>
              <div>
                <div style={eyebrowStyle}>ACTION TRAININGHUB</div>
                <h2 style={modalTitleStyle}>{modal}</h2>
                <p style={modalTextStyle}>Modal standard prévu pour ce module: création, édition, prévisualisation, validation, guard ou conversion selon le workflow.</p>
              </div>
              <button type="button" style={closeButtonStyle} onClick={() => setModal(null)}>×</button>
            </div>

            <div style={modalGridStyle}>
              <label style={fieldStyle}>
                <span>Module</span>
                <input value={module.title} readOnly style={inputStyle} />
              </label>
              <label style={fieldStyle}>
                <span>Action</span>
                <input value={modal} readOnly style={inputStyle} />
              </label>
              <label style={fieldStyle}>
                <span>Statut cible</span>
                <select style={selectStyle} defaultValue={module.statuses[0]}>
                  {module.statuses.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label style={fieldStyle}>
                <span>Impact dossier partenaire</span>
                <select style={selectStyle} defaultValue="Synchroniser dossier + portail">
                  <option>Synchroniser dossier + portail</option>
                  <option>Action interne uniquement</option>
                  <option>Préparer validation AngelCare</option>
                </select>
              </label>
              <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
                <span>Raison / note interne</span>
                <textarea style={textareaStyle} placeholder="Documenter la décision, le contexte, la validation ou l’impact avant sauvegarde." />
              </label>
            </div>

            <div style={modalFooterStyle}>
              <button type="button" style={ghostButtonStyle} onClick={() => setModal(null)}>Annuler</button>
              <button type="button" style={primaryButtonStyle} onClick={() => submitAction(modal)} disabled={busy}>{busy ? 'Enregistrement…' : 'Sauvegarder action'}</button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}

function Metric({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <div style={heroMetricStyle}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  )
}

const pageStyle: CSSProperties = { minHeight: '100vh', display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', background: 'radial-gradient(circle at 20% 0%, rgba(45,95,216,.10), transparent 34%), linear-gradient(180deg,#f7faff 0%,#edf4ff 100%)', color: '#0d1931' }
const sidebarStyle: CSSProperties = { position: 'sticky', top: 0, height: '100vh', overflow: 'auto', display: 'grid', alignContent: 'start', gap: 18, padding: 18, background: 'linear-gradient(180deg,#ffffff 0%,#f7faff 100%)', borderRight: '1px solid rgba(203,216,238,.9)', boxShadow: '18px 0 40px rgba(17,35,72,.04)' }
const brandBlockStyle: CSSProperties = { display: 'grid', gap: 12, padding: 16, borderRadius: 24, background: '#fff', border: '1px solid rgba(203,216,238,.9)', boxShadow: '0 12px 30px rgba(17,35,72,.06)' }
const logoFrameStyle: CSSProperties = { width: '100%', height: 76, display: 'grid', placeItems: 'center', borderRadius: 18, background: '#fff', border: '1px solid rgba(203,216,238,.9)' }
const logoStyle: CSSProperties = { maxWidth: '88%', maxHeight: '88%', objectFit: 'contain' }
const brandTitleStyle: CSSProperties = { display: 'block', fontSize: 22, fontWeight: 950, letterSpacing: '-.04em' }
const brandSubtitleStyle: CSSProperties = { display: 'block', color: '#61718c', fontWeight: 850, marginTop: 4 }
const sidebarNavStyle: CSSProperties = { display: 'grid', gap: 16 }
const navGroupStyle: CSSProperties = { display: 'grid', gap: 7 }
const navGroupTitleStyle: CSSProperties = { padding: '0 8px', color: '#315fd8', fontSize: 11, fontWeight: 950, letterSpacing: '.16em', textTransform: 'uppercase' }
const navItemStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, minHeight: 42, padding: '10px 12px', borderRadius: 16, color: '#41546f', textDecoration: 'none', fontWeight: 900, border: '1px solid transparent' }
const navItemActiveStyle: CSSProperties = { ...navItemStyle, color: '#fff', background: 'linear-gradient(135deg,#12306d,#315fd8)', boxShadow: '0 14px 30px rgba(49,95,216,.22)' }
const navIconStyle: CSSProperties = { width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 999, background: 'rgba(49,95,216,.08)' }
const mainStyle: CSSProperties = { minWidth: 0, display: 'grid', alignContent: 'start', gap: 18, padding: 24 }
const topbarStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: 20, borderRadius: 28, background: 'rgba(255,255,255,.88)', border: '1px solid rgba(203,216,238,.9)', boxShadow: '0 18px 44px rgba(17,35,72,.07)' }
const breadcrumbStyle: CSSProperties = { color: '#315fd8', fontSize: 12, fontWeight: 950, letterSpacing: '.12em', textTransform: 'uppercase' }
const topbarTitleStyle: CSSProperties = { margin: '6px 0 0', fontSize: 34, lineHeight: 1, letterSpacing: '-.05em' }
const topbarActionsStyle: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }
const primaryButtonStyle: CSSProperties = { border: 0, cursor: 'pointer', borderRadius: 16, padding: '13px 16px', color: '#fff', background: 'linear-gradient(135deg,#12306d,#315fd8)', boxShadow: '0 16px 30px rgba(49,95,216,.22)', fontWeight: 950 }
const ghostButtonStyle: CSSProperties = { cursor: 'pointer', borderRadius: 16, padding: '12px 15px', color: '#315fd8', background: '#fff', border: '1px solid rgba(188,205,242,.95)', fontWeight: 950 }
const messageStyle: CSSProperties = { padding: 14, borderRadius: 18, background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#047857', fontWeight: 900 }
const heroStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20, padding: 24, borderRadius: 32, background: 'linear-gradient(135deg,#ffffff 0%,#f7faff 60%,#eaf1ff 100%)', border: '1px solid rgba(203,216,238,.9)', boxShadow: '0 22px 60px rgba(17,35,72,.08)' }
const eyebrowStyle: CSSProperties = { color: '#315fd8', fontSize: 11, fontWeight: 950, letterSpacing: '.16em', textTransform: 'uppercase' }
const heroTitleStyle: CSSProperties = { margin: '8px 0 0', maxWidth: 980, fontSize: 44, lineHeight: 1, letterSpacing: '-.055em' }
const heroTextStyle: CSSProperties = { maxWidth: 880, color: '#61718c', fontWeight: 850, lineHeight: 1.62 }
const heroRightStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(1,minmax(0,1fr))', gap: 10 }
const heroMetricStyle: CSSProperties = { display: 'grid', gap: 5, padding: 15, borderRadius: 20, background: '#fff', border: '1px solid rgba(203,216,238,.9)' }
const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 12 }
const kpiCardStyle: CSSProperties = { display: 'grid', gap: 8, minHeight: 132, padding: 16, borderRadius: 22, background: '#fff', border: '1px solid rgba(203,216,238,.9)', boxShadow: '0 14px 30px rgba(17,35,72,.055)' }
const kpiIconStyle: CSSProperties = { width: 32, height: 32, display: 'grid', placeItems: 'center', borderRadius: 14, background: '#edf3ff', color: '#315fd8', fontWeight: 950 }
const commandBarStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(280px,1fr) 200px 200px auto', gap: 10, padding: 12, borderRadius: 24, background: '#fff', border: '1px solid rgba(203,216,238,.9)' }
const inputStyle: CSSProperties = { width: '100%', borderRadius: 15, border: '1px solid rgba(203,216,238,.95)', padding: '12px 13px', color: '#0d1931', background: '#fbfcff', fontWeight: 800 }
const selectStyle: CSSProperties = { ...inputStyle }
const lifecycleStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 8, padding: 10, borderRadius: 24, background: '#fff', border: '1px solid rgba(203,216,238,.9)' }
const lifecycleStepStyle: CSSProperties = { display: 'grid', gap: 4, minHeight: 64, placeItems: 'center', borderRadius: 16, background: '#fbfcff', border: '1px solid rgba(217,226,240,.95)', color: '#61718c', fontWeight: 900, textAlign: 'center' }
const lifecycleActiveStepStyle: CSSProperties = { ...lifecycleStepStyle, background: 'linear-gradient(180deg,#f0f5ff,#e5edff)', color: '#315fd8', border: '1px solid rgba(179,197,239,1)' }
const workspaceStyle: CSSProperties = { display: 'grid', gap: 14, padding: 18, borderRadius: 30, background: 'rgba(255,255,255,.94)', border: '1px solid rgba(203,216,238,.9)', boxShadow: '0 18px 44px rgba(17,35,72,.06)' }
const tabsStyle: CSSProperties = { display: 'flex', gap: 9, flexWrap: 'wrap' }
const tabStyle: CSSProperties = { border: '1px solid rgba(203,216,238,.95)', background: '#fff', borderRadius: 999, padding: '11px 14px', color: '#41546f', fontWeight: 950, cursor: 'pointer' }
const tabActiveStyle: CSSProperties = { ...tabStyle, background: 'linear-gradient(180deg,#f0f5ff,#e5edff)', color: '#315fd8', border: '1px solid rgba(179,197,239,1)' }
const workspaceGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 16, alignItems: 'start' }
const primaryPanelStyle: CSSProperties = { display: 'grid', gap: 14 }
const panelHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center' }
const panelTitleStyle: CSSProperties = { margin: '5px 0 0', fontSize: 26, letterSpacing: '-.04em' }
const tableStyle: CSSProperties = { display: 'grid', overflow: 'hidden', borderRadius: 22, border: '1px solid rgba(203,216,238,.95)', background: '#fff' }
const tableHeaderStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 1fr 1fr 1.2fr', gap: 12, padding: 14, background: '#f3f7ff', color: '#315fd8', fontSize: 12, fontWeight: 950, letterSpacing: '.08em', textTransform: 'uppercase' }
const tableRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 1fr 1fr 1.2fr', gap: 12, padding: 15, background: '#fff', border: 0, borderTop: '1px solid rgba(225,231,242,.95)', textAlign: 'left', cursor: 'pointer', color: '#253a58', fontWeight: 850 }
const emptyStateStyle: CSSProperties = { padding: 26, color: '#61718c', fontWeight: 850 }
const rightRailStyle: CSSProperties = { display: 'grid', gap: 12 }
const rightCardStyle: CSSProperties = { display: 'grid', gap: 8, padding: 14, borderRadius: 20, background: '#fff', border: '1px solid rgba(203,216,238,.95)' }
const railActionStyle: CSSProperties = { border: 0, background: '#edf3ff', color: '#315fd8', borderRadius: 13, padding: 10, fontWeight: 900, cursor: 'pointer', textAlign: 'left' }
const railModalStyle: CSSProperties = { border: '1px solid rgba(203,216,238,.95)', background: '#fff', color: '#41546f', borderRadius: 13, padding: 10, fontWeight: 850, cursor: 'pointer', textAlign: 'left' }
const riskCardStyle: CSSProperties = { ...rightCardStyle, background: '#fff8ed', border: '1px solid #fed7aa' }
const riskLineStyle: CSSProperties = { margin: 0, padding: '8px 0', color: '#9a4d12', fontWeight: 850, borderTop: '1px solid rgba(254,215,170,.65)' }
const modalOverlayStyle: CSSProperties = { position: 'fixed', inset: 0, zIndex: 80, display: 'grid', placeItems: 'center', background: 'rgba(8,18,36,.48)', padding: 24 }
const modalStyle: CSSProperties = { width: 'min(880px,100%)', display: 'grid', gap: 18, padding: 24, borderRadius: 30, background: '#fff', boxShadow: '0 40px 90px rgba(10,21,39,.24)' }
const modalHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'start' }
const modalTitleStyle: CSSProperties = { margin: '6px 0 0', fontSize: 30, letterSpacing: '-.04em' }
const modalTextStyle: CSSProperties = { margin: '8px 0 0', color: '#61718c', fontWeight: 850, lineHeight: 1.6 }
const closeButtonStyle: CSSProperties = { width: 48, height: 48, borderRadius: 18, border: '1px solid rgba(203,216,238,.95)', background: '#fff', color: '#0d1931', fontSize: 26, fontWeight: 950, cursor: 'pointer' }
const modalGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }
const fieldStyle: CSSProperties = { display: 'grid', gap: 7, color: '#253a58', fontWeight: 950 }
const textareaStyle: CSSProperties = { ...inputStyle, minHeight: 130, resize: 'vertical' }
const modalFooterStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 10 }
