import type { PlanningRequest } from '@/types/homeservice-planning'
export interface FeasibilityFinding {code:string;severity:'info'|'warning'|'blocking';title:string;detail:string;recovery:string}
export function runFeasibility(request:PlanningRequest, context:{minHours?:number;maxHours?:number;maxConsecutiveDays?:number;maxBeneficiariesPerAgent?:number;backupRequired?:boolean;supervisorRequired?:boolean;availableActivityCount?:number;requiredCompetencies?:string[];safetyBlockers?:string[]}){
 const findings:FeasibilityFinding[]=[]; const days=request.dates.length; const beneficiaries=request.beneficiaries.length
 if(!request.serviceVersionId)findings.push({code:'SERVICE_VERSION_REQUIRED',severity:'blocking',title:'Version de service manquante',detail:'La demande doit figer une version UMZ1 active.',recovery:'Sélectionner une version active.'})
 if(days===0)findings.push({code:'DATE_REQUIRED',severity:'blocking',title:'Aucune date',detail:'Au moins une date de mission est obligatoire.',recovery:'Ajouter une date.'})
 request.dates.filter(d=>d.status==='blocked').forEach(d=>findings.push({code:'TIME_ENVELOPE_BLOCKED',severity:'blocking',title:`Date bloquée · ${d.serviceDate}`,detail:d.messages.join(' '),recovery:'Corriger la fenêtre et recalculer.'}))
 if(context.maxConsecutiveDays&&days>context.maxConsecutiveDays)findings.push({code:'MAX_DAYS',severity:'blocking',title:'Durée programme hors capacité',detail:`${days} jours demandés pour un maximum de ${context.maxConsecutiveDays}.`,recovery:'Réduire ou demander une exception autorisée.'})
 if(context.maxBeneficiariesPerAgent&&beneficiaries>context.maxBeneficiariesPerAgent)findings.push({code:'RATIO',severity:'blocking',title:'Ratio bénéficiaires / intervenant dépassé',detail:`${beneficiaries} bénéficiaires pour une capacité de ${context.maxBeneficiariesPerAgent}.`,recovery:'Ajouter un intervenant requis.'})
 if((context.availableActivityCount||0)<3)findings.push({code:'ACTIVITY_COVERAGE',severity:'warning',title:'Bibliothèque d’activités faible',detail:'Moins de trois activités éligibles sont disponibles.',recovery:'Compléter les standards UMZ1.'})
 for(const blocker of context.safetyBlockers||[])findings.push({code:'SAFETY',severity:'blocking',title:'Blocage sécurité',detail:blocker,recovery:'Résoudre dans Sécurité & Sauvegarde.'})
 if(context.backupRequired)findings.push({code:'BACKUP_REQUIRED',severity:'warning',title:'Back-up requis',detail:'Le profil de mission exige une capacité de remplacement.',recovery:'Préserver l’exigence pour CARELINK UMZ4.'})
 if(context.supervisorRequired)findings.push({code:'SUPERVISOR_REQUIRED',severity:'warning',title:'Supervision requise',detail:'Une revue superviseur doit être planifiée.',recovery:'Ajouter les points de supervision.'})
 return {status:findings.some(f=>f.severity==='blocking')?'blocked':findings.some(f=>f.severity==='warning')?'conditional':'valid',findings}
}
