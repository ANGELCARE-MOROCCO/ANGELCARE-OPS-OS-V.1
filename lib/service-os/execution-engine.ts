import { listServiceBlueprints } from './blueprint-engine'
export type MissionStatus='lead'|'qualified'|'configured'|'staffing'|'contract'|'live'|'quality_review'|'closed'|'escalated'
export type ServiceMission={id:string; serviceCode:string; client:string; city:string; status:MissionStatus; owner:string; risk:number; slaHoursLeft:number; revenueMad:number; nextAction:string; staffFit:number}
export const serviceMissions:ServiceMission[]=[
 {id:'M-HS-001',serviceCode:'#H.S',client:'Famille premium Rabat',city:'Rabat',status:'live',owner:'Ops Rabat',risk:18,slaHoursLeft:3,revenueMad:2600,nextAction:'collecter feedback parent',staffFit:94},
 {id:'M-SH-014',serviceCode:'#S.H',client:'Enfant besoin spécifique',city:'Casablanca',status:'staffing',owner:'Special Care Lead',risk:58,slaHoursLeft:5,revenueMad:4200,nextAction:'valider certification staff',staffFit:72},
 {id:'M-PP-008',serviceCode:'#P.P',client:'Maman post-partum',city:'Rabat',status:'contract',owner:'Admin Finance',risk:36,slaHoursLeft:7,revenueMad:6800,nextAction:'envoyer consentement nouveau-né',staffFit:88},
 {id:'M-EDU-022',serviceCode:'#S.L',client:'École partenaire',city:'Casablanca',status:'qualified',owner:'B2B Advisor',risk:22,slaHoursLeft:14,revenueMad:12000,nextAction:'configurer programme 4 semaines',staffFit:81},
]
export function getOperationalSnapshot(){ const missions=serviceMissions; return {active:missions.filter(m=>['live','staffing','contract','configured'].includes(m.status)).length,escalated:missions.filter(m=>m.risk>50).length,revenue:missions.reduce((s,m)=>s+m.revenueMad,0),avgStaffFit:Math.round(missions.reduce((s,m)=>s+m.staffFit,0)/missions.length),byStatus:missions.reduce((a:any,m)=>{a[m.status]=(a[m.status]||0)+1;return a},{})} }
export function buildWorkflowBoard(){ return listServiceBlueprints().map(bp=>({code:bp.serviceCode,name:bp.name,steps:bp.workflows,criticalPath:bp.workflows.filter(s=>s.required).length,totalSla:bp.workflows.reduce((s,w)=>s+w.slaHours,0)})) }
export function getEscalations(){return serviceMissions.filter(m=>m.risk>=35).map(m=>({...m,escalation:m.risk>50?'Manager immédiat + conformité':'Surveillance Ops'}))}
