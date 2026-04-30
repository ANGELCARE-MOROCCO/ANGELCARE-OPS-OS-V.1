import type { Candidate, DecisionBrief, ExecutiveKpi, IncidentCase, MissionNeed, TalentDNA, TrainingCohort } from "./types";

export const executiveKpis: ExecutiveKpi[] = [
  { label:"Global readiness", value:"86%", delta:"+7 pts", status:"low", interpretation:"Talent pool can absorb current premium demand.", action:"Protect Elite caregivers from over-allocation." },
  { label:"Mission quality floor", value:"4.72/5", delta:"+0.18", status:"low", interpretation:"Client sentiment supports premium positioning.", action:"Scale feedback playbook to new cities." },
  { label:"Certification backlog", value:"38", delta:"-12", status:"watch", interpretation:"Academy velocity improving but still constrains expansion.", action:"Open weekend validation slots." },
  { label:"Critical staffing gaps", value:"5 cities", delta:"+2", status:"high", interpretation:"Special-needs demand is outrunning certified supply.", action:"Launch focused recruitment sprint." },
  { label:"Compliance exposure", value:"9 docs", delta:"-21", status:"watch", interpretation:"Expiring documents must be closed before deployment.", action:"Block assignment after 72h if unresolved." },
  { label:"Attrition risk", value:"11%", delta:"-3 pts", status:"watch", interpretation:"Risk concentrated in overloaded senior caregivers.", action:"Rebalance missions and incentives." },
];

export const decisionBriefs: DecisionBrief[] = [
  { title:"Special-needs capacity gap", signal:"Demand +31% vs certified supply +9%", diagnosis:"Pipeline underweighted in autism/school shadowing modules.", decision:"Create accelerated Level 2 certification cohort.", owner:"Academy Director", deadline:"10 days", impact:"Unlock 22 premium missions/month" },
  { title:"Rabat elite overuse", signal:"Top 12 caregivers carry 44% of premium missions", diagnosis:"Risk of fatigue and service inconsistency.", decision:"Activate controlled rotation and backup pool.", owner:"Ops Manager", deadline:"72h", impact:"Reduce burnout risk by 18%" },
  { title:"Document control leak", signal:"9 expiring files attached to deployable profiles", diagnosis:"Compliance gate not strict enough before allocation.", decision:"Enable hard block by document status.", owner:"HR Governance", deadline:"48h", impact:"Protect global audit readiness" },
];

export const talents: TalentDNA[] = [
  { id:"T-001", fullName:"Sara El Amrani", region:"Morocco", city:"Rabat", role:"Elite Caregiver", status:"Elite", languages:["Arabic","French"], serviceEligibility:["Postpartum","BabyCare","EmergencyBackup"], skills:{newbornCare:96,postpartumSupport:92,specialNeeds:64,schoolShadowing:58,hygieneProtocol:98,emergencyResponse:88,clientCommunication:94,emotionalRegulation:91}, reliabilityScore:95, behaviorScore:93, emotionalIntelligence:94, punctualityScore:97, clientRating:4.9, missionCount:148, incidents90d:0, certificates:["AC-POST-L3","AC-BABY-L3"], readinessScore:94, risk:"low", supervisor:"Nadia", lastReview:"2026-04-18", nextAction:"Protect from overbooking; mentor new cohort" },
  { id:"T-002", fullName:"Mina Haddad", region:"UAE", city:"Dubai", role:"Special Needs Shadow", status:"Ready", languages:["Arabic","English","French"], serviceEligibility:["SpecialNeeds","HybridSchoolHome"], skills:{newbornCare:70,postpartumSupport:66,specialNeeds:93,schoolShadowing:95,hygieneProtocol:89,emergencyResponse:82,clientCommunication:88,emotionalRegulation:90}, reliabilityScore:88, behaviorScore:91, emotionalIntelligence:92, punctualityScore:86, clientRating:4.7, missionCount:73, incidents90d:1, certificates:["AC-SN-L2","AC-SCHOOL-L2"], readinessScore:88, risk:"watch", supervisor:"Layla", lastReview:"2026-04-20", nextAction:"Supervisor check-in before critical missions" },
  { id:"T-003", fullName:"Imane Berrada", region:"France", city:"Paris", role:"Caregiver", status:"Restricted", languages:["French","Arabic"], serviceEligibility:["BabyCare"], skills:{newbornCare:78,postpartumSupport:61,specialNeeds:42,schoolShadowing:46,hygieneProtocol:80,emergencyResponse:62,clientCommunication:71,emotionalRegulation:65}, reliabilityScore:67, behaviorScore:70, emotionalIntelligence:66, punctualityScore:68, clientRating:4.1, missionCount:29, incidents90d:2, certificates:["AC-BABY-L1"], readinessScore:66, risk:"high", supervisor:"Camille", lastReview:"2026-04-12", nextAction:"Block premium missions; retraining required" },
];

export const candidates: Candidate[] = [
  { id:"C-101", name:"Yasmine B.", source:"Referral", stage:"Field simulation", city:"Casablanca", serviceFit:["Postpartum","BabyCare"], screeningScore:91, cultureFit:88, documentScore:84, academyDecision:"fast-track", redFlags:[], nextStep:"Trainer final validation" },
  { id:"C-102", name:"Nour A.", source:"LinkedIn", stage:"Interview 2", city:"Rabat", serviceFit:["SpecialNeeds"], screeningScore:78, cultureFit:82, documentScore:70, academyDecision:"admit", redFlags:["Needs document completion"], nextStep:"Academy cohort AC-SN-12" },
  { id:"C-103", name:"Dina K.", source:"Agency", stage:"Screening", city:"Dubai", serviceFit:["HybridSchoolHome"], screeningScore:63, cultureFit:55, documentScore:45, academyDecision:"hold", redFlags:["Weak protocol discipline", "Incomplete references"], nextStep:"Reference verification" },
];

export const cohorts: TrainingCohort[] = [
  { id:"ACAD-POST-08", name:"Postpartum Elite Readiness", serviceLine:"Postpartum", trainer:"Nadia", startDate:"2026-05-04", readiness:82, attendance:94, simulationScore:86, certificationRate:76, fieldValidation:69, blockers:["2 trainees below communication threshold"] },
  { id:"ACAD-SN-12", name:"Special Needs + School Shadowing", serviceLine:"SpecialNeeds", trainer:"Layla", startDate:"2026-05-06", readiness:71, attendance:89, simulationScore:74, certificationRate:54, fieldValidation:61, blockers:["Need more live scenario validation", "Emergency response weak"] },
];

export const missions: MissionNeed[] = [
  { id:"M-9001", client:"Premium Family R.", city:"Rabat", serviceLine:"Postpartum", urgency:"urgent", emotionalSensitivity:86, requiredSkills:{newbornCare:88, postpartumSupport:90, emotionalRegulation:85}, schedule:"Mon-Fri 09:00-17:00", language:"French", notes:"Mother requires high reassurance, newborn care + recovery support." },
  { id:"M-9002", client:"School Partner D.", city:"Dubai", serviceLine:"HybridSchoolHome", urgency:"critical", emotionalSensitivity:91, requiredSkills:{specialNeeds:88, schoolShadowing:92, clientCommunication:85}, schedule:"School hours + home handover", language:"English", notes:"Autism support; strict parent communication expectations." },
];

export const incidents: IncidentCase[] = [
  { id:"INC-441", title:"Late handover escalation", severity:"watch", region:"Morocco/Rabat", caregiver:"Imane Berrada", client:"Family B.", rootCause:"Weak route planning and no backup alert.", correctiveAction:"Retraining + supervisor approval before new mission.", owner:"City Supervisor", status:"Corrective action open", dueDate:"2026-05-03" },
  { id:"INC-442", title:"Premium client dissatisfaction", severity:"high", region:"France/Paris", caregiver:"Pool team", client:"Family P.", rootCause:"Mismatch between emotional sensitivity and assigned profile.", correctiveAction:"Update matching weights + elite replacement.", owner:"Ops Director", status:"Root cause review", dueDate:"2026-05-01" },
];
