import type { B2CExperienceKey } from "./types"

export type B2CRouteContract = {
  key: B2CExperienceKey
  eyebrow: string
  title: string
  mission: string
  primaryAction: string
  archetype: "command" | "dossier" | "studio" | "queue" | "portfolio" | "intelligence" | "governance" | "activation"
  accent: "blue" | "green" | "amber" | "red" | "violet" | "navy"
}

export const B2C_ROUTE_CONTRACTS: Record<B2CExperienceKey, B2CRouteContract> = {
  "b2c-command": { key:"b2c-command", eyebrow:"B2C REVENUE COMMAND", title:"Commandement familles & conversion B2C", mission:"Piloter chaque famille de l’intake à la mise en service, la satisfaction, la rétention et la récupération sans perdre confiance, contexte ni valeur.", primaryAction:"Créer un dossier famille", archetype:"command", accent:"navy" },
  "family-dossier": { key:"family-dossier", eyebrow:"FAMILY 360 DOSSIER", title:"Dossier famille 360°", mission:"Réunir besoins, responsables, bénéficiaires, communications, devis, matching, contrat, activation, qualité et prochaine action dans un dossier sensible et gouverné.", primaryAction:"Mettre à jour le dossier", archetype:"dossier", accent:"blue" },
  "family-care-start-dossier": { key:"family-care-start-dossier", eyebrow:"CARE START AUTHORITY", title:"Autorité de démarrage de prise en charge", mission:"Vérifier contrat, paiement, matching, consignes, disponibilité et handoff avant d’autoriser un démarrage réel.", primaryAction:"Évaluer les gates", archetype:"activation", accent:"green" },
  "family-consultation-dossier": { key:"family-consultation-dossier", eyebrow:"FAMILY CONSULTATION ROOM", title:"Consultation famille & recommandation", mission:"Structurer objectifs, préoccupations, contraintes, décisions et recommandation de service à partir de données confirmées.", primaryAction:"Enregistrer la consultation", archetype:"studio", accent:"violet" },
  "family-intake-dossier": { key:"family-intake-dossier", eyebrow:"CONTROLLED FAMILY INTAKE", title:"Intake famille contrôlé", mission:"Capturer identité, contactabilité, enfants, urgence, besoin, dates et instructions sans exposition excessive de données sensibles.", primaryAction:"Compléter l’intake", archetype:"studio", accent:"blue" },
  "family-matching-dossier": { key:"family-matching-dossier", eyebrow:"MATCHING DECISION ROOM", title:"Matching caregiver-famille", mission:"Comparer candidats éligibles, disponibilité, localisation, langues, expérience et contraintes avant présentation et décision.", primaryAction:"Créer un cycle de matching", archetype:"studio", accent:"green" },
  "family-onboarding-dossier": { key:"family-onboarding-dossier", eyebrow:"FAMILY ONBOARDING", title:"Onboarding & préparation opérationnelle", mission:"Contrôler documents, contacts d’urgence, instructions, handoff, briefing parent, assignment et readiness avant activation.", primaryAction:"Créer le plan onboarding", archetype:"activation", accent:"blue" },
  "family-qualification-dossier": { key:"family-qualification-dossier", eyebrow:"FAMILY QUALIFICATION", title:"Qualification besoins & faisabilité", mission:"Décider si le besoin est clair, réalisable, dans la zone, dans les délais et compatible avec les capacités ANGELCARE.", primaryAction:"Finaliser l’évaluation", archetype:"governance", accent:"violet" },
  "family-recovery-dossier": { key:"family-recovery-dossier", eyebrow:"FAMILY RECOVERY ROOM", title:"Récupération relation famille", mission:"Traiter plainte, baisse de satisfaction, interruption, pression prix ou risque de départ avec responsabilités et deadlines.", primaryAction:"Créer un plan de récupération", archetype:"governance", accent:"red" },
  "active-families-command": { key:"active-families-command", eyebrow:"ACTIVE FAMILY PORTFOLIO", title:"Portefeuille familles actives", mission:"Surveiller service actif, satisfaction, prochaine échéance, risques, demandes de changement et potentiel de prolongation.", primaryAction:"Ouvrir un check satisfaction", archetype:"portfolio", accent:"green" },
  "b2c-analytics-command": { key:"b2c-analytics-command", eyebrow:"B2C EXECUTIVE INTELLIGENCE", title:"Performance conversion, activation & rétention", mission:"Mesurer leads, consultations, devis, matchings, activation, durée, satisfaction, revenu et risques avec sources explicites.", primaryAction:"Analyser les pertes", archetype:"intelligence", accent:"navy" },
  "care-start-command": { key:"care-start-command", eyebrow:"CARE START CONTROL", title:"Commandement démarrages de prise en charge", mission:"Prioriser dossiers prêts, gates bloquants, handoffs en attente et démarrages à sécuriser aujourd’hui.", primaryAction:"Évaluer un démarrage", archetype:"activation", accent:"green" },
  "consultation-command": { key:"consultation-command", eyebrow:"CONSULTATION DESK", title:"Consultations familles & décisions", mission:"Organiser consultations, confirmations, préparation, objections, recommandations et suivis commerciaux.", primaryAction:"Planifier une consultation", archetype:"queue", accent:"violet" },
  "b2c-executive-command": { key:"b2c-executive-command", eyebrow:"B2C EXECUTIVE COMMAND", title:"Posture exécutive B2C", mission:"Exposer valeur, conversion, capacité de matching, activation, satisfaction, revenu menacé et interventions requises.", primaryAction:"Ouvrir le portefeuille critique", archetype:"intelligence", accent:"navy" },
  "high-value-family-command": { key:"high-value-family-command", eyebrow:"HIGH VALUE FAMILIES", title:"Familles à forte valeur & haute exigence", mission:"Piloter les dossiers à valeur, complexité ou sensibilité élevées avec gouvernance, qualité et intervention senior.", primaryAction:"Ouvrir un dossier prioritaire", archetype:"portfolio", accent:"amber" },
  "intake-command": { key:"intake-command", eyebrow:"FAMILY INTAKE COMMAND", title:"Nouveaux leads familles & première réponse", mission:"Dédupliquer, affecter, prioriser et compléter les nouveaux dossiers avant perte de contact ou mauvaise qualification.", primaryAction:"Créer un intake", archetype:"queue", accent:"blue" },
  "matching-command": { key:"matching-command", eyebrow:"MATCHING OPERATIONS", title:"Matching, disponibilité & décision famille", mission:"Contrôler cycles ouverts, candidats, disponibilité, présentation, acceptation, refus et rematching.", primaryAction:"Lancer un matching", archetype:"portfolio", accent:"green" },
  "create-family-studio": { key:"create-family-studio", eyebrow:"FAMILY CREATION STUDIO", title:"Créer un dossier famille sécurisé", mission:"Établir identité minimale, contactabilité, besoin, urgence, localisation, owner et prochaine étape sans doublon.", primaryAction:"Enregistrer la famille", archetype:"studio", accent:"blue" },
  "onboarding-command": { key:"onboarding-command", eyebrow:"ONBOARDING CONTROL", title:"Onboarding, documents & readiness", mission:"Identifier les plans incomplets, documents manquants, instructions sensibles, handoffs et gates bloquants.", primaryAction:"Créer un onboarding", archetype:"activation", accent:"blue" },
  "b2c-pipeline-command": { key:"b2c-pipeline-command", eyebrow:"B2C LIFECYCLE", title:"Pipeline familles de l’intake à l’activation", mission:"Visualiser et faire progresser les dossiers selon des transitions contrôlées, sans confondre vente, matching et opérations.", primaryAction:"Créer un dossier", archetype:"portfolio", accent:"navy" },
  "qualification-command": { key:"qualification-command", eyebrow:"QUALIFICATION CONTROL", title:"Qualification, faisabilité & recommandation", mission:"Comparer besoins, zone, planning, budget, urgence, risques et readiness avant consultation ou devis.", primaryAction:"Qualifier un dossier", archetype:"queue", accent:"violet" },
  "recovery-command": { key:"recovery-command", eyebrow:"B2C RECOVERY", title:"Récupération, plaintes & protection relationnelle", mission:"Traiter échecs d’activation, plaintes, service interrompu, insatisfaction et risque de perte avec preuve et ownership.", primaryAction:"Créer un plan recovery", archetype:"governance", accent:"red" },
  "retention-command": { key:"retention-command", eyebrow:"RETENTION & GROWTH", title:"Rétention, extension & croissance famille", mission:"Détecter risques de départ, prolongations, besoins additionnels et renouvellements sans pression commerciale inappropriée.", primaryAction:"Créer un plan rétention", archetype:"intelligence", accent:"green" },
  "b2c-risk-command": { key:"b2c-risk-command", eyebrow:"FAMILY RISK COMMAND", title:"Risques commerciaux, opérationnels & confiance", mission:"Exposer dossiers sensibles, activation bloquée, plainte ouverte, matching fragile, paiement manquant et actions de protection.", primaryAction:"Déclarer un risque", archetype:"governance", accent:"red" },
}

export const B2C_NAVIGATION = [
  ["Commandement", "/revenue-command-center/b2c-workflow"],
  ["Pipeline", "/revenue-command-center/b2c-workflow/pipeline"],
  ["Intake", "/revenue-command-center/b2c-workflow/intake"],
  ["Qualification", "/revenue-command-center/b2c-workflow/qualification"],
  ["Consultations", "/revenue-command-center/b2c-workflow/consultation"],
  ["Devis", "/revenue-command-center/b2c-workflow/quote"],
  ["Matching", "/revenue-command-center/b2c-workflow/matching"],
  ["Onboarding", "/revenue-command-center/b2c-workflow/onboarding"],
  ["Care Start", "/revenue-command-center/b2c-workflow/care-start"],
  ["Actifs", "/revenue-command-center/b2c-workflow/active-clients"],
  ["Rétention", "/revenue-command-center/b2c-workflow/retention"],
  ["Recovery", "/revenue-command-center/b2c-workflow/recovery"],
  ["Risques", "/revenue-command-center/b2c-workflow/risk"],
  ["Analytics", "/revenue-command-center/b2c-workflow/analytics"],
] as const
