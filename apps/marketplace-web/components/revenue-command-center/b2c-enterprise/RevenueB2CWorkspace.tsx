"use client"

import Link from "next/link"
import {
  Activity, AlertCircle, AlertTriangle, ArrowRight, BadgeCheck, BarChart3, BriefcaseBusiness,
  CalendarDays, CheckCircle2, ChevronRight, CircleDollarSign, ClipboardCheck, Clock3,
  FileCheck2, Filter, HeartHandshake, Home, LayoutDashboard, MapPin, MessageCircle,
  Plus, RefreshCw, Search, ShieldCheck, Sparkles, Star, Target, TrendingUp,
  UserRound, UserRoundCheck, UsersRound, X, Zap,
} from "lucide-react"
import {
  ChangeEvent, FormEvent, KeyboardEvent, MouseEvent, ReactNode, useEffect, useMemo, useRef, useState,
} from "react"

import styles from "./RevenueB2CWorkspace.module.css"
import { B2C_NAVIGATION, B2C_ROUTE_CONTRACTS } from "./route-contracts"
import type { B2CActionKind, B2CCaseRecord, B2CExperienceKey, B2CPortfolio } from "./types"
import { b2cMutation, useB2CPortfolio } from "./useB2CPortfolio"

type Props = { experience:B2CExperienceKey; contextId?:string|null }
type FieldConfig = {
  key:string
  label:string
  type?:"text"|"number"|"date"|"email"|"tel"|"textarea"|"select"
  options?:Array<[string,string]>
  required?:boolean
  placeholder?:string
}
type ActionConfig = {
  title:string
  description:string
  endpoint:string
  method?:string
  fields?:FieldConfig[]
  viewer?:keyof B2CPortfolio
  danger?:boolean
}

const field = (key:string,label:string,type:FieldConfig["type"]="text",required=false,options?:Array<[string,string]>):FieldConfig=>({key,label,type,required,options})
const action = (title:string,description:string,endpoint:string,fields:FieldConfig[]=[],method="POST",danger=false):ActionConfig=>({title,description,endpoint,fields,method,danger})

const ACTION_CONFIG:Record<B2CActionKind,ActionConfig> = {
  "create-family":action("Créer un dossier famille","Établir le minimum nécessaire, l’owner, le besoin et la prochaine étape sans créer de doublon.","/api/revenue-command-center/b2c-enterprise/cases",[
    field("parentName","Parent / responsable","text",true),field("familyName","Nom du dossier"),field("phone","Téléphone","tel",true),
    field("email","Email","email"),field("city","Ville","text",true),field("serviceInterest","Service recherché","select",true,[["home_childcare","Garde à domicile"],["recurring_care","Garde récurrente"],["event_childcare","Événement"],["transport","Transport"],["education_support","Accompagnement éducatif"]]),
    field("urgency","Urgence","select",true,[["critical","Critique"],["high","Haute"],["medium","Moyenne"],["low","Faible"]]),
    field("estimatedValueMad","Valeur estimée (Dh)","number"),field("desiredStartDate","Date souhaitée","date"),field("owner","Responsable"),field("nextAction","Prochaine action","textarea"),
  ]),
  "edit-family":action("Mettre à jour le dossier","Actualiser le contexte sans altérer l’historique.","/api/revenue-command-center/b2c-enterprise/cases",[
    field("parentName","Parent / responsable"),field("familyName","Nom dossier"),field("city","Ville"),field("serviceInterest","Service"),field("owner","Responsable"),field("estimatedValueMad","Valeur estimée (Dh)","number"),field("nextAction","Prochaine action","textarea"),
  ],"PATCH"),
  "transition-case":action("Faire progresser le dossier","Appliquer une transition de cycle contrôlée et auditable.","/api/revenue-command-center/b2c-enterprise/transition",[
    field("toStage","Nouvelle étape","select",true,[["intake","Intake"],["qualified","Qualifié"],["consultation","Consultation"],["recommendation","Recommandation"],["quoted","Devis"],["matching","Matching"],["confirmed","Confirmé"],["onboarding","Onboarding"],["activation_pending","Activation pending"],["active","Actif"],["retention","Rétention"],["recovery","Recovery"],["completed","Terminé"],["cancelled","Annulé"],["lost","Perdu"]]),
    field("reason","Motif","textarea",true),
  ]),
  "add-guardian":action("Ajouter un responsable","Enregistrer un parent ou gardien avec son rôle et ses autorisations.","/api/revenue-command-center/b2c-enterprise/guardians",[
    field("fullName","Nom complet","text",true),field("relationship","Lien avec le bénéficiaire","text",true),field("phone","Téléphone","tel"),field("email","Email","email"),
    field("isPrimary","Responsable principal","select",true,[["true","Oui"],["false","Non"]]),field("decisionAuthority","Autorité décisionnelle","select",true,[["full","Complète"],["shared","Partagée"],["limited","Limitée"]]),
  ]),
  "add-beneficiary":action("Ajouter un bénéficiaire","Enregistrer uniquement les informations nécessaires au service et à la sécurité.","/api/revenue-command-center/b2c-enterprise/beneficiaries",[
    field("displayName","Prénom / identifiant","text",true),field("birthDate","Date de naissance","date"),field("ageGroup","Tranche d’âge","select",true,[["infant","Bébé"],["toddler","Petite enfance"],["child","Enfant"],["preteen","Pré-adolescent"]]),
    field("languagePreferences","Langues"),field("careNotes","Instructions de prise en charge","textarea"),field("safetyNotes","Considérations de sécurité","textarea"),
  ]),
  "add-emergency-contact":action("Ajouter un contact d’urgence","Enregistrer un contact activable en situation légitime.","/api/revenue-command-center/b2c-enterprise/emergency-contacts",[
    field("fullName","Nom complet","text",true),field("relationship","Lien","text",true),field("phone","Téléphone","tel",true),field("priorityOrder","Ordre d’appel","number"),
  ]),
  "add-family-instruction":action("Ajouter une instruction famille","Structurer une instruction opérationnelle avec sensibilité et date d’effet.","/api/revenue-command-center/b2c-enterprise/instructions",[
    field("category","Catégorie","select",true,[["routine","Routine"],["access","Accès domicile"],["communication","Communication"],["safety","Sécurité"],["preferences","Préférences"],["other","Autre"]]),
    field("instruction","Instruction","textarea",true),field("sensitivity","Sensibilité","select",true,[["standard","Standard"],["restricted","Restreinte"],["critical","Critique"]]),
  ]),
  "add-service-requirement":action("Définir le besoin de service","Formaliser planning, localisation, profil, contraintes et budget.","/api/revenue-command-center/b2c-enterprise/requirements",[
    field("serviceType","Type de service","text",true),field("scheduleSummary","Planning","textarea",true),field("startDate","Date de début","date"),field("endDate","Date de fin","date"),
    field("frequency","Fréquence"),field("location","Lieu","text",true),field("languagePreferences","Langues"),field("caregiverProfile","Profil recherché","textarea"),
    field("transportConstraints","Contraintes transport","textarea"),field("familyPriorities","Priorités famille","textarea"),field("dealBreakers","Critères éliminatoires","textarea"),
    field("budgetMinMad","Budget minimum (Dh)","number"),field("budgetMaxMad","Budget maximum (Dh)","number"),
  ]),
  "update-service-requirement":action("Actualiser le besoin","Mettre à jour le besoin actif sans effacer le snapshot antérieur.","/api/revenue-command-center/b2c-enterprise/requirements",[
    field("requirementId","ID besoin","text",true),field("scheduleSummary","Planning","textarea"),field("location","Lieu"),field("familyPriorities","Priorités","textarea"),field("status","Statut"),
  ],"PATCH"),
  "create-needs-assessment":action("Créer l’évaluation besoins","Évaluer clarté, faisabilité, zone, planning, budget et risques.","/api/revenue-command-center/b2c-enterprise/needs-assessments",[
    field("requirementClarity","Clarté /100","number",true),field("serviceFeasibility","Faisabilité /100","number",true),field("locationFeasibility","Zone /100","number",true),
    field("scheduleFeasibility","Planning /100","number",true),field("budgetAlignment","Budget /100","number",true),field("riskLevel","Niveau de risque","select",true,[["low","Faible"],["medium","Moyen"],["high","Élevé"],["critical","Critique"]]),
    field("assessmentSummary","Conclusion","textarea",true),
  ]),
  "complete-needs-assessment":action("Finaliser l’évaluation","Valider la décision de qualification et la prochaine étape.","/api/revenue-command-center/b2c-enterprise/needs-assessments",[
    field("assessmentId","ID évaluation","text",true),field("decision","Décision","select",true,[["qualified","Qualifié"],["clarification_required","Clarification requise"],["not_feasible","Non faisable"]]),
    field("reason","Motif","textarea",true),
  ],"PATCH"),
  "schedule-consultation":action("Planifier une consultation","Créer un rendez-vous B2C dans le système d’engagement canonique.","/api/revenue-command-center/b2c-enterprise/consultations",[
    field("appointmentAt","Date et heure","text",true),field("channel","Canal","select",true,[["phone","Téléphone"],["whatsapp","WhatsApp"],["video","Visio"],["in_person","Présentiel"]]),
    field("objective","Objectif","textarea",true),field("owner","Responsable"),
  ]),
  "record-consultation":action("Enregistrer la consultation","Capturer besoins confirmés, préoccupations, décision et suivi.","/api/revenue-command-center/b2c-enterprise/consultations",[
    field("consultationId","ID consultation","text",true),field("outcome","Résultat","select",true,[["recommendation_ready","Recommandation prête"],["follow_up","Suivi requis"],["not_ready","Pas prêt"],["lost","Perdu"]]),
    field("concerns","Préoccupations","textarea"),field("decisionReadiness","Readiness décision /100","number"),field("notes","Notes","textarea",true),field("followUpAt","Suivi prévu","text"),
  ],"PATCH"),
  "create-recommendation":action("Créer une recommandation","Proposer une solution explicable à partir du besoin enregistré.","/api/revenue-command-center/b2c-enterprise/recommendations",[
    field("serviceLine","Service recommandé","text",true),field("serviceFormat","Format","text",true),field("recommendedDuration","Durée recommandée"),field("scheduleFit","Compatibilité planning /100","number"),
    field("suitabilityExplanation","Justification","textarea",true),field("availabilityDependency","Dépendance disponibilité","textarea"),field("pricingImplication","Impact tarifaire","textarea"),field("risks","Risques","textarea"),
  ]),
  "approve-recommendation":action("Approuver la recommandation","Valider humainement la recommandation avant devis ou présentation.","/api/revenue-command-center/b2c-enterprise/recommendations",[
    field("recommendationId","ID recommandation","text",true),field("status","Décision","select",true,[["approved","Approuvée"],["rejected","Rejetée"],["revision_required","Révision requise"]]),field("decisionNotes","Notes décision","textarea",true),
  ],"PATCH"),
  "create-matching-cycle":action("Créer un cycle de matching","Ouvrir une recherche structurée depuis un besoin approuvé.","/api/revenue-command-center/b2c-enterprise/matching/cycles",[
    field("requirementId","ID besoin","text",true),field("targetStartDate","Date cible","date"),field("matchingOwner","Responsable matching"),field("selectionCriteria","Critères","textarea",true),
  ]),
  "add-match-candidate":action("Ajouter un candidat","Référencer un caregiver du système autoritatif sans dupliquer son identité.","/api/revenue-command-center/b2c-enterprise/matching/candidates",[
    field("matchingCycleId","ID cycle","text",true),field("caregiverReference","Référence caregiver","text",true),field("caregiverName","Nom affiché"),field("eligibilityReason","Raison d’éligibilité","textarea"),
    field("locationFitScore","Fit localisation /100","number"),field("scheduleFitScore","Fit planning /100","number"),field("languageFitScore","Fit langues /100","number"),field("experienceFitScore","Fit expérience /100","number"),field("overallFitScore","Fit global /100","number"),
  ]),
  "verify-availability":action("Vérifier la disponibilité","Enregistrer une vérification réelle et datée de disponibilité.","/api/revenue-command-center/b2c-enterprise/matching/candidates",[
    field("candidateId","ID candidat","text",true),field("availabilityStatus","Disponibilité","select",true,[["verified","Vérifiée"],["unavailable","Indisponible"],["partial","Partielle"]]),field("availabilityEvidence","Preuve / référence","textarea",true),
  ],"PATCH"),
  "reject-candidate":action("Rejeter le candidat","Documenter un rejet sans altérer le dossier caregiver autoritatif.","/api/revenue-command-center/b2c-enterprise/matching/candidates",[
    field("candidateId","ID candidat","text",true),field("rejectionReason","Motif","textarea",true),
  ],"PATCH",true),
  "present-match":action("Présenter un matching","Tracer la présentation d’un candidat à la famille.","/api/revenue-command-center/b2c-enterprise/matching/decision",[
    field("matchingCycleId","ID cycle","text",true),field("candidateId","ID candidat","text",true),field("presentationChannel","Canal"),field("presentationNotes","Notes","textarea"),
  ]),
  "accept-match":action("Accepter le matching","Confirmer le candidat sélectionné avec preuve de disponibilité.","/api/revenue-command-center/b2c-enterprise/matching/decision",[
    field("matchingCycleId","ID cycle","text",true),field("candidateId","ID candidat","text",true),field("familyDecisionEvidence","Preuve décision famille","textarea",true),field("proposedStartDate","Démarrage proposé","date"),
  ],"PATCH"),
  "reject-match":action("Refuser le matching","Enregistrer le refus et son motif pour la prochaine recherche.","/api/revenue-command-center/b2c-enterprise/matching/decision",[
    field("matchingCycleId","ID cycle","text",true),field("candidateId","ID candidat","text",true),field("rejectionReason","Motif famille","textarea",true),
  ],"PATCH"),
  "rematch":action("Relancer un matching","Clore le cycle précédent et ouvrir une nouvelle recherche contrôlée.","/api/revenue-command-center/b2c-enterprise/matching/decision",[
    field("matchingCycleId","ID cycle précédent","text",true),field("reason","Motif rematching","textarea",true),
  ],"PATCH"),
  "create-onboarding":action("Créer le plan onboarding","Établir les éléments requis avant activation et démarrage.","/api/revenue-command-center/b2c-enterprise/onboarding/plans",[
    field("targetStartDate","Date cible","date",true),field("owner","Responsable"),field("parentBriefingRequired","Briefing parent requis","select",true,[["true","Oui"],["false","Non"]]),field("notes","Notes","textarea"),
  ]),
  "add-onboarding-item":action("Ajouter un item onboarding","Créer un contrôle avec owner, échéance et preuve attendue.","/api/revenue-command-center/b2c-enterprise/onboarding/items",[
    field("onboardingPlanId","ID plan","text",true),field("title","Item","text",true),field("category","Catégorie"),field("owner","Responsable"),field("dueDate","Échéance","date"),field("evidenceRequired","Preuve requise","textarea"),
  ]),
  "complete-onboarding-item":action("Compléter l’item","Marquer un contrôle terminé avec preuve lorsque requise.","/api/revenue-command-center/b2c-enterprise/onboarding/items",[
    field("itemId","ID item","text",true),field("evidenceReference","Preuve","textarea"),field("completionNotes","Notes","textarea"),
  ],"PATCH"),
  "evaluate-activation":action("Évaluer les gates","Recalculer contrat, paiement, matching, onboarding, handoff et disponibilité.","/api/revenue-command-center/b2c-enterprise/activation/evaluate",[]),
  "approve-activation":action("Approuver l’activation","Autoriser l’activation uniquement si tous les gates obligatoires sont passés.","/api/revenue-command-center/b2c-enterprise/activation/authorize",[
    field("decision","Décision","select",true,[["approved","Approuver"],["rejected","Rejeter"]]),field("reason","Motif","textarea",true),
  ]),
  "create-operational-handoff":action("Créer le handoff opérationnel","Transférer le scope, les instructions, risques et contacts au module opérationnel.","/api/revenue-command-center/b2c-enterprise/handoff",[
    field("receivingModule","Module destinataire","text",true),field("receivingOwner","Responsable destinataire","text",true),field("serviceScope","Scope service","textarea",true),field("commitments","Engagements","textarea"),field("risks","Risques","textarea"),
  ]),
  "accept-operational-handoff":action("Accepter le handoff","Confirmer que les opérations ont reçu et compris le dossier.","/api/revenue-command-center/b2c-enterprise/handoff",[
    field("handoffId","ID handoff","text",true),field("acceptanceNotes","Notes d’acceptation","textarea",true),
  ],"PATCH"),
  "authorize-care-start":action("Autoriser le care start","Prendre la décision finale de démarrage après réévaluation des gates.","/api/revenue-command-center/b2c-enterprise/care-start",[
    field("authorizedStartDate","Date autorisée","date",true),field("authorizationReason","Motif","textarea",true),
  ]),
  "record-care-start":action("Enregistrer le démarrage","Tracer le démarrage réel, l’heure, le caregiver et la preuve.","/api/revenue-command-center/b2c-enterprise/care-start",[
    field("actualStartAt","Démarrage réel","text",true),field("caregiverReference","Référence caregiver","text",true),field("startEvidence","Preuve démarrage","textarea",true),field("notes","Notes","textarea"),
  ],"PATCH"),
  "record-satisfaction":action("Créer un check satisfaction","Mesurer confiance, qualité, fit caregiver et correction requise.","/api/revenue-command-center/b2c-enterprise/satisfaction",[
    field("score","Score /100","number",true),field("serviceQuality","Qualité service /100","number"),field("caregiverFit","Fit caregiver /100","number"),field("responsiveness","Réactivité /100","number"),field("trustScore","Confiance /100","number"),field("feedback","Feedback","textarea"),field("followUpAt","Suivi","text"),
  ]),
  "record-feedback":action("Enregistrer un feedback","Ajouter un feedback relationnel au check existant.","/api/revenue-command-center/b2c-enterprise/satisfaction",[
    field("satisfactionId","ID check","text",true),field("feedback","Feedback","textarea",true),field("requiredCorrection","Correction requise","textarea"),
  ],"PATCH"),
  "create-complaint":action("Enregistrer une plainte","Créer un dossier de plainte relié au système qualité sans dupliquer l’incident autoritatif.","/api/revenue-command-center/b2c-enterprise/complaints",[
    field("category","Catégorie","text",true),field("severity","Sévérité","select",true,[["low","Faible"],["medium","Moyenne"],["high","Élevée"],["critical","Critique"]]),field("description","Description","textarea",true),field("immediateContainment","Containment immédiat","textarea"),field("qualityReference","Référence Qualité / Incident"),
  ]),
  "contain-complaint":action("Confirmer le containment","Tracer les mesures immédiates et la responsabilité.","/api/revenue-command-center/b2c-enterprise/complaints",[
    field("complaintId","ID plainte","text",true),field("containmentAction","Action immédiate","textarea",true),field("owner","Responsable","text",true),
  ],"PATCH"),
  "close-complaint":action("Clore la plainte","Clore avec correction, communication et preuve de résolution.","/api/revenue-command-center/b2c-enterprise/complaints",[
    field("complaintId","ID plainte","text",true),field("resolution","Résolution","textarea",true),field("closureEvidence","Preuve","textarea",true),
  ],"PATCH"),
  "create-retention-risk":action("Déclarer un risque de rétention","Identifier la cause, la valeur menacée, l’owner et la deadline.","/api/revenue-command-center/b2c-enterprise/retention/risks",[
    field("category","Catégorie","select",true,[["satisfaction","Satisfaction"],["schedule","Planning"],["caregiver_fit","Fit caregiver"],["price","Prix"],["payment","Paiement"],["communication","Communication"],["service_end","Fin de service"],["competitor","Concurrent"]]),
    field("severity","Sévérité","select",true,[["medium","Moyenne"],["high","Élevée"],["critical","Critique"]]),field("valueAtRiskMad","Valeur menacée (Dh)","number"),field("reason","Raison","textarea",true),field("dueDate","Deadline","date"),
  ]),
  "launch-retention-plan":action("Lancer un plan rétention","Définir objectif, actions, offer boundary et revue.","/api/revenue-command-center/b2c-enterprise/retention/plans",[
    field("retentionRiskId","ID risque"),field("objective","Objectif","textarea",true),field("actions","Actions","textarea",true),field("owner","Responsable"),field("reviewDate","Date revue","date"),
  ]),
  "close-retention-plan":action("Clore le plan rétention","Enregistrer le résultat sans masquer une perte ou un échec.","/api/revenue-command-center/b2c-enterprise/retention/plans",[
    field("planId","ID plan","text",true),field("outcome","Résultat","select",true,[["retained","Retenu"],["extended","Prolongé"],["lost","Perdu"],["monitoring","Surveillance"]]),field("outcomeNotes","Notes","textarea",true),
  ],"PATCH"),
  "create-recovery-plan":action("Créer un plan recovery","Structurer containment, correction, communication et décision relationnelle.","/api/revenue-command-center/b2c-enterprise/recovery/plans",[
    field("triggerType","Déclencheur","text",true),field("rootCause","Cause racine","textarea",true),field("objective","Objectif","textarea",true),field("actions","Actions","textarea",true),field("owner","Responsable"),field("deadline","Deadline","date"),
  ]),
  "add-recovery-checkpoint":action("Ajouter un checkpoint","Planifier un contrôle mesurable du recovery.","/api/revenue-command-center/b2c-enterprise/recovery/checkpoints",[
    field("recoveryPlanId","ID plan","text",true),field("title","Checkpoint","text",true),field("dueDate","Échéance","date"),field("successCriteria","Critères de succès","textarea",true),
  ]),
  "complete-recovery-checkpoint":action("Compléter le checkpoint","Tracer résultat, preuve et prochaine décision.","/api/revenue-command-center/b2c-enterprise/recovery/checkpoints",[
    field("checkpointId","ID checkpoint","text",true),field("result","Résultat","textarea",true),field("evidenceReference","Preuve","textarea"),field("status","Statut","select",true,[["completed","Terminé"],["failed","Échoué"]]),
  ],"PATCH"),
  "create-extension":action("Préparer une extension","Définir durée, fréquence ou service additionnel à proposer avec consentement.","/api/revenue-command-center/b2c-enterprise/retention/plans",[
    field("extensionType","Type","select",true,[["duration","Durée"],["frequency","Fréquence"],["service_line","Service additionnel"],["beneficiary","Bénéficiaire additionnel"]]),field("businessReason","Raison","textarea",true),field("expectedValueMad","Valeur estimée (Dh)","number"),
  ]),
  "launch-renewal-quote":action("Lancer un devis renouvellement","Ouvrir le Proposal Studio canonique pour un renouvellement B2C.","/api/revenue-command-center/b2c-enterprise/renewal",[
    field("renewalReason","Motif renouvellement","textarea",true),field("desiredStartDate","Nouvelle date de début","date"),field("scopeChanges","Évolution scope","textarea"),
  ]),
  "launch-upsell-quote":action("Lancer un devis extension","Ouvrir un devis gouverné sans modifier le service actif.","/api/revenue-command-center/b2c-enterprise/renewal",[
    field("upsellReason","Besoin additionnel","textarea",true),field("serviceLine","Service additionnel","text",true),field("expectedValueMad","Valeur estimée (Dh)","number"),
  ]),
  "link-contract":action("Lier le contrat","Relier un contrat Phase 7 autoritatif au dossier famille.","/api/revenue-command-center/b2c-enterprise/cases",[
    field("contractId","ID contrat","text",true),
  ],"PATCH"),
  "link-payment":action("Lier une confirmation Finance","Référencer une confirmation de paiement autoritative, sans la créer.","/api/revenue-command-center/b2c-enterprise/cases",[
    field("paymentConfirmationId","ID confirmation Finance","text",true),
  ],"PATCH"),
  "record-cancellation":action("Enregistrer une annulation","Documenter initiateur, raison, impact et actions de fermeture.","/api/revenue-command-center/b2c-enterprise/closure",[
    field("initiatedBy","Initiée par","select",true,[["family","Famille"],["angelcare","ANGELCARE"],["mutual","Mutuelle"]]),field("reason","Raison","textarea",true),field("effectiveDate","Date d’effet","date"),field("customerCommunication","Communication client","textarea"),
  ],"POST",true),
  "close-case":action("Clore le dossier","Vérifier tâches, paiements, plaintes, handoff et communication avant clôture.","/api/revenue-command-center/b2c-enterprise/closure",[
    field("closureType","Type clôture","select",true,[["completed","Service terminé"],["cancelled","Annulé"],["lost","Perdu"],["archived","Archivé"]]),field("reason","Raison","textarea",true),field("closureEvidence","Preuve / référence","textarea"),
  ],"PATCH",true),
  "record-evidence":action("Ajouter une preuve","Lier une preuve avec classification et contrôle d’accès.","/api/revenue-command-center/b2c-enterprise/evidence",[
    field("evidenceType","Type de preuve","text",true),field("reference","Référence","textarea",true),field("sensitivity","Sensibilité","select",true,[["standard","Standard"],["restricted","Restreinte"],["critical","Critique"]]),
  ]),
  "timeline-viewer":{title:"Historique opérationnel",description:"Consulter la chronologie B2C sans la modifier.",endpoint:"",viewer:"statusHistory"},
  "audit-viewer":{title:"Audit dossier famille",description:"Consulter les événements et preuves du cycle.",endpoint:"",viewer:"evidence"},
}

const PRIMARY_ACTION:Record<B2CExperienceKey,B2CActionKind> = {
  "b2c-command":"create-family","family-dossier":"edit-family","family-care-start-dossier":"evaluate-activation",
  "family-consultation-dossier":"record-consultation","family-intake-dossier":"add-service-requirement",
  "family-matching-dossier":"create-matching-cycle","family-onboarding-dossier":"create-onboarding",
  "family-qualification-dossier":"create-needs-assessment","family-recovery-dossier":"create-recovery-plan",
  "active-families-command":"record-satisfaction","b2c-analytics-command":"timeline-viewer","care-start-command":"evaluate-activation",
  "consultation-command":"schedule-consultation","b2c-executive-command":"timeline-viewer","high-value-family-command":"edit-family",
  "intake-command":"create-family","matching-command":"create-matching-cycle","create-family-studio":"create-family",
  "onboarding-command":"create-onboarding","b2c-pipeline-command":"create-family","qualification-command":"create-needs-assessment",
  "recovery-command":"create-recovery-plan","retention-command":"create-retention-risk","b2c-risk-command":"create-retention-risk",
}

const moneyFormatter=new Intl.NumberFormat("fr-FR",{style:"currency",currency:"MAD",maximumFractionDigits:0})
const numberFormatter=new Intl.NumberFormat("fr-FR",{maximumFractionDigits:1})
const dateFormatter=new Intl.DateTimeFormat("fr-FR",{day:"2-digit",month:"short",year:"numeric"})
const money=(value:unknown)=>moneyFormatter.format(Number(value||0)).replace("MAD","Dh")
const number=(value:unknown)=>numberFormatter.format(Number(value||0))
const date=(value:unknown)=>{if(!value)return "Non planifiée";const parsed=new Date(String(value));return Number.isNaN(parsed.getTime())?"Non planifiée":dateFormatter.format(parsed)}
const label=(value:unknown)=>String(value||"non défini").replaceAll("_"," ")
const stageTone=(value:unknown)=>{
  const status=String(value||"")
  if(["active","completed","approved","accepted","verified","passed","qualified","retained"].includes(status))return styles.statusGreen
  if(["critical","blocked","lost","cancelled","rejected","broken","failed","at_risk"].includes(status))return styles.statusRed
  if(["pending","matching","onboarding","consultation","conditions_pending","recovery"].includes(status))return styles.statusAmber
  if(["lead","intake","quoted","scheduled","presented"].includes(status))return styles.statusBlue
  return styles.statusGrey
}

function Status({value}:{value:unknown}){return <span className={`${styles.status} ${stageTone(value)}`}>{label(value)}</span>}
function Kpi({labelText,value,meta}:{labelText:string;value:ReactNode;meta:string}){return <article className={styles.kpiCard}><span className={styles.kpiLabel}>{labelText}</span><strong className={styles.kpiValue}>{value}</strong><span className={styles.kpiMeta}>{meta}</span></article>}
function Panel({title,description,actionNode,children}:{title:string;description?:string;actionNode?:ReactNode;children:ReactNode}){return <section className={styles.panel}><header className={styles.panelHeader}><div><h2>{title}</h2>{description?<p>{description}</p>:null}</div>{actionNode}</header><div className={styles.panelBody}>{children}</div></section>}
function Empty({title,description}:{title:string;description:string}){return <div className={styles.empty}><div><div className={styles.emptyIcon}><Home size={25}/></div><h3>{title}</h3><p>{description}</p></div></div>}

function ActionModal({kind,portfolio,currentCase,onClose,onComplete}:{kind:B2CActionKind;portfolio:B2CPortfolio;currentCase:B2CCaseRecord|null;onClose:()=>void;onComplete:()=>Promise<void>}){
  const config=ACTION_CONFIG[kind]
  const dialogRef=useRef<HTMLDivElement>(null)
  const closeRef=useRef<HTMLButtonElement>(null)
  const [form,setForm]=useState<Record<string,string>>({})
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState<string|null>(null)
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null
    document.body.style.overflow="hidden"
    closeRef.current?.focus()
    return()=>{document.body.style.overflow="";previous?.focus()}
  },[])
  function onKeyDown(event:KeyboardEvent<HTMLDivElement>){
    if(event.key==="Escape"&&!busy){event.preventDefault();onClose()}
    if(event.key!=="Tab")return
    const focusable=dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]')
    if(!focusable?.length)return
    const first=focusable[0],last=focusable[focusable.length-1]
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  }
  const viewerRows=config.viewer?(portfolio[config.viewer] as Array<Record<string,any>>):null
  async function submit(event:FormEvent){
    event.preventDefault()
    if(!config.endpoint)return
    setBusy(true);setError(null)
    try{
      const payload:Record<string,unknown>={...form,caseId:currentCase?.id||null,b2cCaseId:currentCase?.id||null}
      for(const [key,value] of Object.entries(payload)){
        if(typeof value==="string"&&value!==""&&!Number.isNaN(Number(value))&&/Mad|Score|Value|Amount|Order|Clarity|Feasibility|Alignment|Priority$/i.test(key))payload[key]=Number(value)
        if(value==="true")payload[key]=true
        if(value==="false")payload[key]=false
      }
      await b2cMutation(config.endpoint,config.method||"POST",payload)
      await onComplete()
      onClose()
    }catch(reason){setError(reason instanceof Error?reason.message:String(reason))}
    finally{setBusy(false)}
  }
  return <div className={styles.modalBackdrop} onMouseDown={(event:MouseEvent<HTMLDivElement>)=>{if(event.target===event.currentTarget&&!busy)onClose()}}>
    <div ref={dialogRef} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="b2c-modal-title" onKeyDown={onKeyDown}>
      <header className={styles.modalHeader}><div><h2 id="b2c-modal-title">{config.title}</h2><p>{config.description}</p></div><button ref={closeRef} className={styles.iconButton} type="button" aria-label="Fermer" onClick={onClose}><X size={17}/></button></header>
      <form onSubmit={submit}>
        <div className={styles.modalBody}>
          {viewerRows?<div className={styles.timeline}>{viewerRows.length?viewerRows.slice(0,100).map((row,index)=><article className={styles.timelineItem} key={String(row.id||index)}><h4>{String(row.title||row.event_type||row.evidence_type||row.status||"Événement")}</h4><p>{String(row.reason||row.description||row.reference||row.metadata?.summary||"Événement enregistré")}</p><p>{date(row.created_at||row.occurred_at||row.updated_at)}</p></article>):<Empty title="Aucun historique" description="Les événements apparaîtront ici après les premières opérations."/>}</div>:<div className={styles.formGrid}>
            {(config.fields||[]).map(item=><div className={`${styles.field} ${item.type==="textarea"?styles.fieldWide:""}`} key={item.key}><label htmlFor={`b2c-${kind}-${item.key}`}>{item.label}{item.required?" *":""}</label>
              {item.type==="textarea"?<textarea id={`b2c-${kind}-${item.key}`} className={styles.fieldTextarea} required={item.required} placeholder={item.placeholder} value={form[item.key]||""} onChange={(event:ChangeEvent<HTMLTextAreaElement>)=>setForm(current=>({...current,[item.key]:event.target.value}))}/>
              :item.type==="select"?<select id={`b2c-${kind}-${item.key}`} className={styles.fieldSelect} required={item.required} value={form[item.key]||""} onChange={(event:ChangeEvent<HTMLSelectElement>)=>setForm(current=>({...current,[item.key]:event.target.value}))}><option value="">Sélectionner</option>{(item.options||[]).map(([value,text])=><option value={value} key={value}>{text}</option>)}</select>
              :<input id={`b2c-${kind}-${item.key}`} className={styles.fieldInput} type={item.type||"text"} required={item.required} placeholder={item.placeholder} value={form[item.key]||""} onChange={(event:ChangeEvent<HTMLInputElement>)=>setForm(current=>({...current,[item.key]:event.target.value}))}/>}
            </div>)}
          </div>}
          {error?<div className={styles.errorBox}>{error}</div>:null}
        </div>
        <footer className={styles.modalFooter}><button className={styles.secondaryButton} type="button" onClick={onClose} disabled={busy}>Fermer</button>{!viewerRows?<button className={config.danger?styles.dangerButton:styles.primaryButton} type="submit" disabled={busy}>{busy?"Traitement…":config.danger?"Confirmer l’action":"Enregistrer"}</button>:null}</footer>
      </form>
    </div>
  </div>
}

function PortfolioTable({cases,onOpen}:{cases:B2CCaseRecord[];onOpen:(action:B2CActionKind,row?:B2CCaseRecord)=>void}){
  const [query,setQuery]=useState("")
  const [stage,setStage]=useState("all")
  const filtered=useMemo(()=>cases.filter(row=>{
    const hay=[row.parent_name,row.family_name,row.city,row.service_interest,row.owner,row.phone,row.email].join(" ").toLowerCase()
    return (!query||hay.includes(query.toLowerCase()))&&(stage==="all"||String(row.stage)===stage)
  }),[cases,query,stage])
  return <section className={styles.panel}>
    <div className={styles.toolbar}><div className={styles.searchBox}><Search size={15}/><input aria-label="Rechercher une famille" placeholder="Famille, ville, service, owner…" value={query} onChange={event=>setQuery(event.target.value)}/></div><div className={styles.filters}><select className={styles.fieldSelect} value={stage} onChange={event=>setStage(event.target.value)}><option value="all">Toutes les étapes</option>{["lead","intake","qualified","consultation","quoted","matching","onboarding","activation_pending","active","retention","recovery"].map(value=><option key={value} value={value}>{label(value)}</option>)}</select></div></div>
    <div className={styles.tableWrap}>{filtered.length?<table className={styles.table}><thead><tr><th>Famille</th><th>Étape</th><th>Service</th><th>Ville</th><th>Owner</th><th>Valeur</th><th>Activation</th><th>Prochaine action</th></tr></thead><tbody>{filtered.map(row=><tr className={styles.tableRow} key={row.id} onClick={()=>onOpen("edit-family",row)}><td><Link className={styles.link} href={`/revenue-command-center/b2c-workflow/${row.id}`} onClick={event=>event.stopPropagation()}>{row.family_name||row.parent_name||"Famille"}</Link><div className={styles.entitySub}>{row.phone||row.email||row.family_reference||row.id}</div></td><td><Status value={row.stage}/></td><td>{label(row.service_interest)}</td><td>{row.city||"—"}</td><td>{row.owner||"—"}</td><td>{money(row.estimated_value_mad)}</td><td><Status value={row.activation_status}/></td><td>{row.next_action||"À définir"}</td></tr>)}</tbody></table>:<Empty title="Aucun dossier correspondant" description="Ajustez les filtres ou créez un nouveau dossier famille."/>}</div>
  </section>
}

function Lifecycle({cases}:{cases:B2CCaseRecord[]}){
  const columns=[["Intake",["lead","intake"]],["Qualification",["qualified","consultation","recommendation"]],["Offre",["quoted"]],["Matching",["matching","confirmed"]],["Activation",["onboarding","activation_pending","active"]]] as const
  return <div className={styles.pipeline}>{columns.map(([title,stages])=><section className={styles.stage} key={title}><header className={styles.stageHeader}><span>{title}</span><span>{cases.filter(row=>(stages as readonly string[]).includes(String(row.stage))).length}</span></header><div className={styles.stageBody}>{cases.filter(row=>(stages as readonly string[]).includes(String(row.stage))).slice(0,12).map(row=><article className={styles.caseCard} key={row.id}><div className={styles.caseCardTop}><h4><Link className={styles.link} href={`/revenue-command-center/b2c-workflow/${row.id}`}>{row.family_name||row.parent_name}</Link></h4><Status value={row.priority}/></div><p>{row.service_interest?label(row.service_interest):"Service à confirmer"} · {row.city||"Ville non affectée"}</p><div className={styles.caseMeta}><span className={styles.tag}>{money(row.estimated_value_mad)}</span><span className={styles.tag}>{row.owner||"Sans owner"}</span></div></article>)}</div></section>)}</div>
}

function Command({portfolio,onOpen}:{portfolio:B2CPortfolio;onOpen:(action:B2CActionKind,row?:B2CCaseRecord)=>void}){
  const s=portfolio.summary
  const priority=portfolio.cases.filter(row=>["critical","high"].includes(String(row.urgency||row.priority))||["blocked","conditions_pending"].includes(String(row.activation_status))).slice(0,8)
  return <div className={styles.content}>
    <div className={styles.kpiGrid}><Kpi labelText="Dossiers actifs" value={number(s.total)} meta="Portefeuille B2C gouverné"/><Kpi labelText="Nouveaux leads" value={number(s.newLeads)} meta="Première réponse à sécuriser"/><Kpi labelText="Matching ouverts" value={number(s.matching)} meta="Disponibilité et décision"/><Kpi labelText="Activation bloquée" value={number(s.activationBlocked)} meta="Gates obligatoires"/><Kpi labelText="Familles actives" value={number(s.activeFamilies)} meta="Relation en service"/><Kpi labelText="Pipeline" value={money(s.pipelineMad)} meta="Valeur commerciale estimée"/></div>
    <div className={styles.gridTwo}>
      <Panel title="Priorités de direction" description="Dossiers à forte urgence, blocage ou valeur relationnelle."><div className={styles.queue}>{priority.length?priority.map(row=><article className={styles.queueItem} key={row.id}><div className={styles.queueIcon}><AlertTriangle size={16}/></div><div><div className={styles.queueTitle}>{row.family_name||row.parent_name}</div><div className={styles.queueMeta}>{row.next_action||"Intervention requise"} · {row.owner||"Sans owner"}</div></div><div><div className={styles.queueValue}>{money(row.estimated_value_mad)}</div><Status value={row.activation_status||row.stage}/></div></article>):<Empty title="Aucune priorité critique" description="Les dossiers urgents ou bloqués apparaîtront ici."/>}</div></Panel>
      <Panel title="Confiance opérationnelle" description="Le Revenue Command ne remplace ni CareLink, ni Finance, ni Qualité."><div className={styles.checklist}>
        {[
          ["Contrat & paiement","Phase 7 reste autoritative pour signature et paiement."],
          ["Caregiver & disponibilité","Le matching référence les caregivers autoritatifs sans les dupliquer."],
          ["Qualité & incidents","Les plaintes peuvent référencer le système Qualité existant."],
          ["Données sensibles","Les enfants et instructions restent minimisés et permissionnés."],
        ].map(([title,text])=><div className={styles.checkItem} key={title}><div className={styles.checkIcon}><ShieldCheck size={14}/></div><div className={styles.checkText}><strong>{title}</strong>{text}</div></div>)}
      </div></Panel>
    </div>
    <Panel title="Pipeline familles" description="Progression commerciale, matching et activation restent séparés mais reliés."><Lifecycle cases={portfolio.cases}/></Panel>
    <PortfolioTable cases={portfolio.cases} onOpen={onOpen}/>
  </div>
}

function Dossier({portfolio,current,onOpen,focus}:{portfolio:B2CPortfolio;current:B2CCaseRecord;onOpen:(action:B2CActionKind,row?:B2CCaseRecord)=>void;focus:string}){
  const related=(rows:Array<Record<string,any>>)=>rows.filter(row=>String(row.b2c_case_id||row.entity_id||"")===current.id)
  const guardians=related(portfolio.guardians),beneficiaries=related(portfolio.beneficiaries),requirements=related(portfolio.requirements)
  const consultations=related(portfolio.consultations),matches=related(portfolio.matchingCandidates),onboarding=related(portfolio.onboardingItems)
  const gates=related(portfolio.activationGates),complaints=related(portfolio.complaints),risks=related(portfolio.retentionRisks),history=related(portfolio.statusHistory)
  const actionButtons:Record<string,B2CActionKind[]>={
    intake:["add-guardian","add-beneficiary","add-service-requirement","add-emergency-contact","add-family-instruction"],
    qualification:["create-needs-assessment","complete-needs-assessment","create-recommendation"],
    consultation:["schedule-consultation","record-consultation","create-recommendation"],
    matching:["create-matching-cycle","add-match-candidate","verify-availability","present-match","accept-match","rematch"],
    onboarding:["create-onboarding","add-onboarding-item","evaluate-activation","create-operational-handoff"],
    "care-start":["evaluate-activation","approve-activation","authorize-care-start","record-care-start"],
    recovery:["create-recovery-plan","add-recovery-checkpoint","record-satisfaction","create-complaint"],
    general:["edit-family","transition-case","record-evidence","timeline-viewer"],
  }
  const actions=actionButtons[focus]||actionButtons.general
  return <div className={styles.content}>
    <div className={styles.dossierHeader}>
      <section className={styles.identityCard}><span className={styles.eyebrow}><Home size={14}/> FAMILY 360</span><h2>{current.family_name||current.parent_name||"Famille"}</h2><div className={styles.identityMeta}><Status value={current.stage}/><Status value={current.activation_status}/><span className={styles.tag}>{current.city||"Ville non affectée"}</span><span className={styles.tag}>{label(current.service_interest)}</span></div><p className={styles.heroMission}>{current.next_action||"Prochaine action à définir"}</p></section>
      <div className={styles.metricMini}><span>Valeur estimée</span><strong>{money(current.estimated_value_mad)}</strong></div>
      <div className={styles.metricMini}><span>Satisfaction</span><strong>{number(current.satisfaction_score)}/100</strong></div>
      <div className={styles.metricMini}><span>Démarrage</span><strong>{date(current.desired_start_date)}</strong></div>
      <div className={styles.metricMini}><span>Dernière activité</span><strong>{date(current.last_activity_at||current.updated_at)}</strong></div>
    </div>
    <div className={styles.gridTwo}>
      <Panel title="Actions du cycle" description={`Espace ${focus} — actions permissions, preuves et transitions contrôlées.`}><div className={styles.gridThree}>{actions.map(kind=><button key={kind} className={styles.secondaryButton} type="button" onClick={()=>onOpen(kind,current)}>{ACTION_CONFIG[kind].title}<ArrowRight size={14}/></button>)}</div></Panel>
      <Panel title="État de confiance" description="Une activation réelle exige des gates et sources autoritatives."><div className={styles.checklist}>
        <div className={styles.checkItem}><div className={styles.checkIcon}><FileCheck2 size={14}/></div><div className={styles.checkText}><strong>Contrat</strong>{current.contract_id?"Contrat relié":"Contrat non relié"}</div></div>
        <div className={styles.checkItem}><div className={styles.checkIcon}><UserRoundCheck size={14}/></div><div className={styles.checkText}><strong>Matching</strong>{label(current.matching_status)}</div></div>
        <div className={styles.checkItem}><div className={styles.checkIcon}><ClipboardCheck size={14}/></div><div className={styles.checkText}><strong>Onboarding</strong>{label(current.onboarding_status)}</div></div>
        <div className={styles.checkItem}><div className={styles.checkIcon}><ShieldCheck size={14}/></div><div className={styles.checkText}><strong>Activation</strong>{label(current.activation_status)}</div></div>
      </div></Panel>
    </div>
    <div className={styles.gridEqual}>
      <Panel title="Famille & bénéficiaires" description="Données minimisées et limitées au service légitime."><div className={styles.queue}>
        {[...guardians,...beneficiaries].length?[...guardians,...beneficiaries].map((row,index)=><article className={styles.queueItem} key={String(row.id||index)}><div className={styles.queueIcon}><UserRound size={16}/></div><div><div className={styles.queueTitle}>{row.full_name||row.display_name||"Personne"}</div><div className={styles.queueMeta}>{row.relationship||row.age_group||row.decision_authority||"Contexte famille"}</div></div><Status value={row.status||"active"}/></article>):<Empty title="Aucune personne liée" description="Ajoutez uniquement les responsables et bénéficiaires nécessaires."/>}
      </div></Panel>
      <Panel title="Besoin & consultation" description="Le besoin actif reste distingué des snapshots et recommandations."><div className={styles.queue}>
        {[...requirements,...consultations].length?[...requirements,...consultations].slice(0,10).map((row,index)=><article className={styles.queueItem} key={String(row.id||index)}><div className={styles.queueIcon}><BriefcaseBusiness size={16}/></div><div><div className={styles.queueTitle}>{row.service_type||row.objective||row.outcome||"Besoin famille"}</div><div className={styles.queueMeta}>{row.schedule_summary||row.notes||row.location||"Détail non renseigné"}</div></div><Status value={row.status||row.outcome||"active"}/></article>):<Empty title="Besoin non structuré" description="Créez un besoin puis une évaluation ou consultation."/>}
      </div></Panel>
    </div>
    {focus==="matching"?<Panel title="Candidats matching" description="Scores explicables, disponibilité séparée et décision humaine."><div className={styles.matchGrid}>{matches.length?matches.map((row,index)=><article className={styles.matchCard} key={String(row.id||index)}><div className={styles.matchAvatar}><UserRoundCheck size={20}/></div><h3>{row.caregiver_name_snapshot||row.caregiver_reference||"Caregiver"}</h3><p>{row.eligibility_reason||"Éligibilité à vérifier"}</p><div className={styles.scoreBar}><div className={styles.scoreFill} style={{width:`${Math.max(0,Math.min(100,Number(row.overall_fit_score||0)))}%`}}/></div><div className={styles.scoreLine}><span>Fit global</span><strong>{number(row.overall_fit_score)}/100</strong></div><div className={styles.caseMeta}><Status value={row.availability_status}/><Status value={row.eligibility_status}/></div></article>):<Empty title="Aucun candidat" description="Ajoutez des références caregiver après vérification dans le système autoritatif."/>}</div></Panel>:null}
    {["onboarding","care-start"].includes(focus)?<Panel title="Readiness & activation gates" description="Aucun démarrage sur simple statut manuel."><div className={styles.gateBoard}>{[...onboarding,...gates].length?[...onboarding,...gates].slice(0,16).map((row,index)=><article className={styles.gate} key={String(row.id||index)}><div className={styles.gateTop}><h4>{row.title||row.gate_key||"Contrôle"}</h4><Status value={row.status||row.result||"pending"}/></div><p>{row.evidence_required||row.reason||row.description||"Évidence et owner à confirmer"}</p></article>):<Empty title="Aucun contrôle" description="Créez le plan onboarding et évaluez les gates d’activation."/>}</div></Panel>:null}
    {focus==="recovery"?<Panel title="Risques, plaintes & recovery" description="La relation est protégée par containment, correction et preuve."><div className={styles.riskGrid}>{[...complaints,...risks].length?[...complaints,...risks].map((row,index)=><article className={styles.riskCard} key={String(row.id||index)}><h3>{row.category||row.title||"Risque famille"}</h3><p>{row.description||row.reason||"Description non renseignée"}</p><div className={styles.caseMeta}><Status value={row.severity||row.status}/><span className={styles.tag}>{money(row.value_at_risk_mad)}</span></div></article>):<Empty title="Aucun risque ouvert" description="Les plaintes et risques de rétention apparaîtront ici."/>}</div></Panel>:null}
    <Panel title="Chronologie dossier" description="Transitions, décisions et preuves doivent rester auditables."><div className={styles.timeline}>{history.length?history.slice(0,20).map((row,index)=><article className={styles.timelineItem} key={String(row.id||index)}><h4>{row.event_type||"Événement B2C"}</h4><p>{row.reason||row.title||"Événement enregistré"}</p><p>{date(row.created_at)}</p></article>):<Empty title="Historique vide" description="Les opérations futures seront enregistrées dans la chronologie."/>}</div></Panel>
  </div>
}

function Studio({portfolio,current,onOpen,mode}:{portfolio:B2CPortfolio;current:B2CCaseRecord|null;onOpen:(action:B2CActionKind,row?:B2CCaseRecord)=>void;mode:"create"|"intake"|"qualification"|"consultation"|"matching"|"onboarding"|"care-start"|"recovery"}){
  const configs={
    create:{title:"Création sécurisée",description:"Identité minimale, contactabilité, besoin et owner.",actions:["create-family"] as B2CActionKind[],sections:["Identité & contact","Besoin initial","Responsabilité","Prochaine étape"]},
    intake:{title:"Intake famille",description:"Responsables, bénéficiaires, instructions et besoin actif.",actions:["add-guardian","add-beneficiary","add-service-requirement","add-emergency-contact","add-family-instruction"] as B2CActionKind[],sections:["Responsables","Bénéficiaires","Besoin","Consignes"]},
    qualification:{title:"Évaluation de faisabilité",description:"Clarté, zone, planning, budget, risque et recommandation.",actions:["create-needs-assessment","complete-needs-assessment","create-recommendation","approve-recommendation"] as B2CActionKind[],sections:["Besoin","Faisabilité","Risque","Décision"]},
    consultation:{title:"Consultation & décision",description:"Objectifs, préoccupations, recommandation et suivi.",actions:["schedule-consultation","record-consultation","create-recommendation","approve-recommendation"] as B2CActionKind[],sections:["Préparation","Consultation","Préoccupations","Recommandation"]},
    matching:{title:"Matching humainement gouverné",description:"Candidats autoritatifs, disponibilité, fit et décision famille.",actions:["create-matching-cycle","add-match-candidate","verify-availability","present-match","accept-match","reject-match","rematch"] as B2CActionKind[],sections:["Critères","Candidats","Disponibilité","Décision"]},
    onboarding:{title:"Onboarding & handoff",description:"Documents, consignes, briefing, gates et transfert opérationnel.",actions:["create-onboarding","add-onboarding-item","complete-onboarding-item","evaluate-activation","create-operational-handoff","accept-operational-handoff"] as B2CActionKind[],sections:["Plan","Documents","Briefing","Handoff"]},
    "care-start":{title:"Autorité care start",description:"Réévaluer toutes les conditions avant démarrage réel.",actions:["evaluate-activation","approve-activation","authorize-care-start","record-care-start"] as B2CActionKind[],sections:["Contrat","Paiement","Matching","Activation"]},
    recovery:{title:"Recovery & confiance",description:"Containment, cause racine, correction, satisfaction et décision.",actions:["create-complaint","contain-complaint","create-recovery-plan","add-recovery-checkpoint","record-satisfaction","close-complaint"] as B2CActionKind[],sections:["Containment","Investigation","Correction","Relation"]},
  }[mode]
  const [section,setSection]=useState(configs.sections[0])
  return <div className={styles.content}><div className={styles.studio}>
    <aside className={styles.studioRail}>{configs.sections.map(item=><button className={`${styles.railButton} ${section===item?styles.railButtonActive:""}`} type="button" key={item} onClick={()=>setSection(item)}><ChevronRight size={13}/>{item}</button>)}</aside>
    <main className={styles.studioMain}><div className={styles.sectionTitle}><div><h2>{configs.title}</h2><p>{configs.description}</p></div><Status value={current?.stage||"draft"}/></div>
      {mode==="create"?<div className={styles.empty}><div><div className={styles.emptyIcon}><Plus size={24}/></div><h3>Créer le dossier initial</h3><p>Le système vérifiera les doublons de téléphone, email et identité avant insertion.</p><button className={styles.primaryButton} type="button" onClick={()=>onOpen("create-family")}><Plus size={15}/>Créer maintenant</button></div></div>
      :current?<Dossier portfolio={portfolio} current={current} onOpen={onOpen} focus={mode}/>
      :<Empty title="Sélectionnez un dossier" description="Ouvrez un dossier famille pour travailler dans ce studio."/>}
    </main>
    <aside className={styles.studioAside}><h3>Commandes autorisées</h3><div className={styles.queue}>{configs.actions.map(kind=><button className={styles.secondaryButton} type="button" key={kind} onClick={()=>onOpen(kind,current||undefined)}>{ACTION_CONFIG[kind].title}</button>)}</div><div className={styles.checklist}>
      <div className={styles.checkItem}><div className={styles.checkIcon}><ShieldCheck size={14}/></div><div className={styles.checkText}><strong>Vérité opérationnelle</strong>Aucun succès n’est affiché avant confirmation API.</div></div>
      <div className={styles.checkItem}><div className={styles.checkIcon}><BadgeCheck size={14}/></div><div className={styles.checkText}><strong>Source canonique</strong>Contrats, paiements, caregivers et incidents restent dans leurs systèmes.</div></div>
    </div></aside>
  </div></div>
}

function QueueCommand({portfolio,onOpen,kind}:{portfolio:B2CPortfolio;onOpen:(action:B2CActionKind,row?:B2CCaseRecord)=>void;kind:"intake"|"qualification"|"consultation"|"matching"|"onboarding"|"care-start"|"retention"|"recovery"|"risk"|"active"|"high-value"}){
  const filtered=portfolio.cases.filter(row=>{
    if(kind==="intake")return ["lead","intake"].includes(String(row.stage))
    if(kind==="qualification")return ["intake","qualified","consultation"].includes(String(row.stage))
    if(kind==="consultation")return ["qualified","consultation","recommendation"].includes(String(row.stage))
    if(kind==="matching")return ["quoted","matching","confirmed"].includes(String(row.stage))
    if(kind==="onboarding")return ["confirmed","onboarding","activation_pending"].includes(String(row.stage))
    if(kind==="care-start")return ["onboarding","activation_pending"].includes(String(row.stage))
    if(kind==="retention")return ["active","retention"].includes(String(row.stage))||String(row.retention_status)==="at_risk"
    if(kind==="recovery")return String(row.stage)==="recovery"||String(row.retention_status)==="recovery"
    if(kind==="risk")return String(row.risk_status)!=="clear"||["blocked","conditions_pending"].includes(String(row.activation_status))
    if(kind==="active")return String(row.stage)==="active"
    if(kind==="high-value")return Number(row.estimated_value_mad||0)>=15000
    return true
  })
  const actionMap:Record<typeof kind,B2CActionKind>={
    intake:"add-service-requirement",qualification:"create-needs-assessment",consultation:"schedule-consultation",
    matching:"create-matching-cycle",onboarding:"create-onboarding","care-start":"evaluate-activation",
    retention:"create-retention-risk",recovery:"create-recovery-plan",risk:"create-retention-risk",active:"record-satisfaction","high-value":"edit-family",
  }
  return <div className={styles.content}>
    <div className={styles.kpiGrid}><Kpi labelText="Dossiers concernés" value={number(filtered.length)} meta={`Vue ${kind}`}/><Kpi labelText="Valeur" value={money(filtered.reduce((sum,row)=>sum+Number(row.estimated_value_mad||0),0))} meta="Valeur estimée"/><Kpi labelText="Urgence haute" value={number(filtered.filter(row=>["critical","high"].includes(String(row.urgency))).length)} meta="Intervention prioritaire"/><Kpi labelText="Sans owner" value={number(filtered.filter(row=>!row.owner).length)} meta="Affectation requise"/><Kpi labelText="Gates bloqués" value={number(filtered.filter(row=>String(row.activation_status)==="blocked").length)} meta="Activation impossible"/><Kpi labelText="Satisfaction moyenne" value={`${number(portfolio.summary.averageSatisfaction)}/100`} meta="Données enregistrées"/></div>
    <Panel title={`Commandement ${kind}`} description="Chaque ligne conserve son contexte commercial, opérationnel et relationnel."><div className={styles.queue}>{filtered.length?filtered.map(row=><article className={styles.queueItem} key={row.id}><div className={styles.queueIcon}>{kind==="risk"?<AlertTriangle size={16}/>:kind==="matching"?<UserRoundCheck size={16}/>:kind==="care-start"?<Zap size={16}/>:<Home size={16}/>}</div><div><div className={styles.queueTitle}><Link className={styles.link} href={`/revenue-command-center/b2c-workflow/${row.id}`}>{row.family_name||row.parent_name}</Link></div><div className={styles.queueMeta}>{row.next_action||label(row.stage)} · {row.owner||"Sans owner"} · {row.city||"Ville non affectée"}</div></div><div><div className={styles.queueValue}>{money(row.estimated_value_mad)}</div><button className={styles.ghostButton} type="button" onClick={()=>onOpen(actionMap[kind],row)}>Agir <ArrowRight size={13}/></button></div></article>):<Empty title="Aucun dossier dans cette vue" description="Les dossiers apparaîtront ici lorsqu’ils atteindront cette étape."/>}</div></Panel>
    <PortfolioTable cases={filtered} onOpen={onOpen}/>
  </div>
}

function Analytics({portfolio,executive=false}:{portfolio:B2CPortfolio;executive?:boolean}){
  const s=portfolio.summary
  const steps=[["Leads",s.newLeads],["Qualifiés",s.qualified],["Consultation",portfolio.cases.filter(row=>String(row.consultation_status)==="completed").length],["Devis",s.quoted],["Matching",s.matching],["Activation",portfolio.cases.filter(row=>String(row.activation_status)==="approved").length],["Actifs",s.activeFamilies]] as const
  return <div className={styles.content}>
    <div className={styles.kpiGrid}><Kpi labelText="Pipeline B2C" value={money(s.pipelineMad)} meta="Valeur estimée"/><Kpi labelText="Familles actives" value={number(s.activeFamilies)} meta="Relation en service"/><Kpi labelText="Activation bloquée" value={number(s.activationBlocked)} meta="Valeur non activable"/><Kpi labelText="Risque rétention" value={number(s.retentionRisk)} meta="Plan requis"/><Kpi labelText="High value" value={number(s.highValue)} meta="≥ 15 000 Dh"/><Kpi labelText="Satisfaction" value={`${number(s.averageSatisfaction)}/100`} meta="Checks enregistrés"/></div>
    <div className={styles.analyticsGrid}>
      <Panel title={executive?"Conversion exécutive B2C":"Funnel commercial et opérationnel"} description="Les étapes reflètent des dossiers enregistrés, pas une projection décorative."><div className={styles.funnel}>{steps.map(([name,value],index)=><div className={styles.funnelStep} key={name} style={{minHeight:`${90+index*19}px`}}><strong>{number(value)}</strong><span>{name}</span></div>)}</div></Panel>
      <Panel title="Indicateurs d’intervention" description="Priorités nécessitant une action humaine."><div className={styles.checklist}>
        <div className={styles.checkItem}><div className={styles.checkIcon}><Clock3 size={14}/></div><div className={styles.checkText}><strong>Intake pending</strong>{number(s.intakePending)} dossiers incomplets</div></div>
        <div className={styles.checkItem}><div className={styles.checkIcon}><CalendarDays size={14}/></div><div className={styles.checkText}><strong>Consultations</strong>{number(s.consultationPending)} à planifier ou confirmer</div></div>
        <div className={styles.checkItem}><div className={styles.checkIcon}><AlertCircle size={14}/></div><div className={styles.checkText}><strong>Recovery</strong>{number(s.recovery)} dossiers sous intervention</div></div>
        <div className={styles.checkItem}><div className={styles.checkIcon}><CircleDollarSign size={14}/></div><div className={styles.checkText}><strong>Contracté</strong>{money(s.contractedMad)} relié à un contrat</div></div>
      </div></Panel>
    </div>
    <PortfolioTable cases={portfolio.cases} onOpen={()=>undefined}/>
  </div>
}

export default function RevenueB2CWorkspace({experience,contextId}:Props){
  const contract=B2C_ROUTE_CONTRACTS[experience]
  const {data:portfolio,loading,error,refresh}=useB2CPortfolio(contextId)
  const [modal,setModal]=useState<B2CActionKind|null>(null)
  const [selected,setSelected]=useState<B2CCaseRecord|null>(null)
  const [toast,setToast]=useState<string|null>(null)
  const currentCase=useMemo(()=>portfolio?.cases.find(row=>row.id===contextId)||portfolio?.cases[0]||null,[portfolio,contextId])
  useEffect(()=>{if(experience==="create-family-studio"&&!loading&&!error)setModal("create-family")},[experience,loading,error])
  function openAction(kind:B2CActionKind,row?:B2CCaseRecord){setSelected(row||currentCase);setModal(kind)}
  async function complete(){await refresh();setToast("Opération B2C confirmée et dossier actualisé.");window.setTimeout(()=>setToast(null),3200)}
  if(loading)return <div className={styles.loading}><div><div className={styles.spinner}/><strong>Chargement du Revenue B2C Control Plane…</strong></div></div>
  if(error||!portfolio)return <div className={styles.shell}><div className={styles.errorBox}><strong>Le portefeuille B2C ne peut pas être chargé.</strong><br/>{error||"Réponse vide"}<br/><button className={styles.secondaryButton} type="button" onClick={()=>void refresh()}><RefreshCw size={14}/>Réessayer</button></div></div>
  const primary=PRIMARY_ACTION[experience]
  const render=()=>{
    if(experience==="b2c-command")return <Command portfolio={portfolio} onOpen={openAction}/>
    if(experience==="b2c-pipeline-command")return <div className={styles.content}><Panel title="Pipeline B2C gouverné" description="Aucune transition implicite par glisser-déposer."><Lifecycle cases={portfolio.cases}/></Panel><PortfolioTable cases={portfolio.cases} onOpen={openAction}/></div>
    if(experience==="b2c-analytics-command")return <Analytics portfolio={portfolio}/>
    if(experience==="b2c-executive-command")return <Analytics portfolio={portfolio} executive/>
    if(experience==="create-family-studio")return <Studio portfolio={portfolio} current={null} onOpen={openAction} mode="create"/>
    if(experience==="family-dossier"&&currentCase)return <Dossier portfolio={portfolio} current={currentCase} onOpen={openAction} focus="general"/>
    if(experience==="family-intake-dossier"&&currentCase)return <Studio portfolio={portfolio} current={currentCase} onOpen={openAction} mode="intake"/>
    if(experience==="family-qualification-dossier"&&currentCase)return <Studio portfolio={portfolio} current={currentCase} onOpen={openAction} mode="qualification"/>
    if(experience==="family-consultation-dossier"&&currentCase)return <Studio portfolio={portfolio} current={currentCase} onOpen={openAction} mode="consultation"/>
    if(experience==="family-matching-dossier"&&currentCase)return <Studio portfolio={portfolio} current={currentCase} onOpen={openAction} mode="matching"/>
    if(experience==="family-onboarding-dossier"&&currentCase)return <Studio portfolio={portfolio} current={currentCase} onOpen={openAction} mode="onboarding"/>
    if(experience==="family-care-start-dossier"&&currentCase)return <Studio portfolio={portfolio} current={currentCase} onOpen={openAction} mode="care-start"/>
    if(experience==="family-recovery-dossier"&&currentCase)return <Studio portfolio={portfolio} current={currentCase} onOpen={openAction} mode="recovery"/>
    const queues:Partial<Record<B2CExperienceKey,Parameters<typeof QueueCommand>[0]["kind"]>>={
      "intake-command":"intake","qualification-command":"qualification","consultation-command":"consultation",
      "matching-command":"matching","onboarding-command":"onboarding","care-start-command":"care-start",
      "retention-command":"retention","recovery-command":"recovery","b2c-risk-command":"risk",
      "active-families-command":"active","high-value-family-command":"high-value",
    }
    const kind=queues[experience]
    if(kind)return <QueueCommand portfolio={portfolio} onOpen={openAction} kind={kind}/>
    return <Command portfolio={portfolio} onOpen={openAction}/>
  }
  return <main className={styles.shell}>
    <section className={styles.hero}>
      <div className={styles.heroTop}><div><span className={styles.eyebrow}><Sparkles size={14}/>{contract.eyebrow}</span><h1 className={styles.heroTitle}>{contract.title}</h1><p className={styles.heroMission}>{contract.mission}</p></div><div className={styles.heroActions}><button className={styles.secondaryButton} type="button" onClick={()=>void refresh()}><RefreshCw size={14}/>Actualiser</button><button className={styles.primaryButton} type="button" onClick={()=>openAction(primary,currentCase||undefined)}>{contract.primaryAction}<ArrowRight size={14}/></button></div></div>
      <div className={styles.trustBar}><span className={styles.trustItem}><ShieldCheck size={13}/>Données famille minimisées</span><span className={styles.trustItem}><BadgeCheck size={13}/>Contrat et paiement autoritatifs</span><span className={styles.trustItem}><UserRoundCheck size={13}/>Matching humainement validé</span><span className={styles.trustItem}><Activity size={13}/>Audit des transitions</span></div>
    </section>
    <nav className={styles.nav} aria-label="Navigation B2C">{B2C_NAVIGATION.map(([name,href])=><Link className={`${styles.navLink} ${href.endsWith(experience.replace("-command",""))?styles.navLinkActive:""}`} href={href} key={href}>{name}</Link>)}</nav>
    {render()}
    {modal?<ActionModal kind={modal} portfolio={portfolio} currentCase={selected||currentCase} onClose={()=>setModal(null)} onComplete={complete}/>:null}
    {toast?<div className={styles.toast} role="status">{toast}</div>:null}
  </main>
}
