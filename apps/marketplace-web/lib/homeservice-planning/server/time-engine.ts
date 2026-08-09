import type { PlanningDate, PlanBlock } from '@/types/homeservice-planning'
const hhmm=(value:string)=>{ const m=/^(\d{2}):(\d{2})$/.exec(value); if(!m) return null; const h=Number(m[1]), min=Number(m[2]); return h>=0&&h<24&&min>=0&&min<60?h*60+min:null }
export const toTime=(minutes:number)=>`${String(Math.floor((minutes%1440)/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`
export function calculateEnvelope(input:{id?:string;serviceDate:string;startTime:string;endTime:string;declaredMinutes?:number;handoverMinutes?:number;careRoutineMinutes?:number;reportMinutes?:number;travelMinutes?:number;allowCrossMidnight?:boolean}):PlanningDate{
 const start=hhmm(input.startTime), endRaw=hhmm(input.endTime), messages:string[]=[]
 if(start===null||endRaw===null) return {id:input.id||crypto.randomUUID(),serviceDate:input.serviceDate,startTime:input.startTime,endTime:input.endTime,declaredMinutes:input.declaredMinutes||0,grossMinutes:0,handoverMinutes:0,careRoutineMinutes:0,reportMinutes:0,travelMinutes:0,usableMinutes:0,status:'blocked',messages:['Heure invalide. Format HH:MM requis.']}
 let end=endRaw; if(end<=start&&input.allowCrossMidnight) end+=1440; if(end<=start) messages.push('La fin doit être postérieure au début.')
 const gross=Math.max(0,end-start), handover=Math.max(0,input.handoverMinutes??20), care=Math.max(0,input.careRoutineMinutes??0), report=Math.max(0,input.reportMinutes??15), travel=Math.max(0,input.travelMinutes??0), usable=Math.max(0,gross-handover-care-report-travel)
 if(input.declaredMinutes&&Math.abs(input.declaredMinutes-gross)>0) messages.push(`Durée déclarée ${input.declaredMinutes} min incompatible avec la fenêtre réelle ${gross} min.`)
 if(gross<60) messages.push('Fenêtre inférieure au minimum opérationnel de 60 minutes.')
 if(usable<30) messages.push('Temps exploitable insuffisant après obligations de service.')
 return {id:input.id||crypto.randomUUID(),serviceDate:input.serviceDate,startTime:input.startTime,endTime:input.endTime,declaredMinutes:input.declaredMinutes||gross,grossMinutes:gross,handoverMinutes:handover,careRoutineMinutes:care,reportMinutes:report,travelMinutes:travel,usableMinutes:usable,status:messages.length?'blocked':'valid',messages}
}
export function validateBlocks(blocks:PlanBlock[], startTime:string, endTime:string){
 const start=hhmm(startTime)??0, end=hhmm(endTime)??0, sorted=[...blocks].sort((a,b)=>(hhmm(a.startTime)??0)-(hhmm(b.startTime)??0)); const issues:string[]=[]
 let cursor=start
 for(const block of sorted){ const s=hhmm(block.startTime), e=hhmm(block.endTime); if(s===null||e===null||e<=s){issues.push(`${block.label}: plage horaire invalide.`); continue} if(s<cursor)issues.push(`${block.label}: chevauchement détecté.`); if(s>cursor)issues.push(`Temps non couvert de ${toTime(cursor)} à ${toTime(s)}.`); cursor=Math.max(cursor,e); if(block.durationMinutes!==e-s)issues.push(`${block.label}: durée enregistrée différente de la plage.`) }
 if(cursor<end)issues.push(`Temps non couvert de ${toTime(cursor)} à ${toTime(end)}.`); if(cursor>end)issues.push('Le programme dépasse la fin de mission.')
 return {valid:issues.length===0,issues}
}
