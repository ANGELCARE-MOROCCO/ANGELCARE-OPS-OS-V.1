import { JobkixFault } from './contracts';
import * as v from './validation';
export function decimal(value:unknown,field:string,min:number,max:number):number{if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max||Math.abs(value*100-Math.round(value*100))>1e-6)throw new JobkixFault('INVALID_INPUT',{[field]:'decimal'});return value;}
function bool(value:unknown,field:string):boolean{if(typeof value!=='boolean')throw new JobkixFault('INVALID_INPUT',{[field]:'boolean'});return value;}
export function vacancyCreateInput(p:Record<string,unknown>){return {
 organizationId:v.uuid(p.organizationId),siteId:p.siteId===null||p.siteId===undefined||p.siteId===''?null:v.uuid(p.siteId),title:v.text(p.title,'title',3,240),
 settingId:v.text(p.settingId,'settingId',2,100),occupationId:v.text(p.occupationId,'occupationId',2,100),originalLocale:v.locale(p.originalLocale),
 country:v.countryCode(p.country),region:v.text(p.region??'','region',0,180),city:v.text(p.city,'city',1,180),description:v.text(p.description??'','description',0,40000),
 workSchedule:v.choice(p.workSchedule,['full_time','part_time','flexible'],'workSchedule'),contractType:v.choice(p.contractType,['permanent','fixed_term','temporary','seasonal','internship','other'],'contractType'),workLocation:v.choice(p.workLocation,['on_site','remote','hybrid'],'workLocation'),liveIn:bool(p.liveIn??false,'liveIn'),
};}
export function vacancyContentInput(p:Record<string,unknown>){
 if(!Array.isArray(p.questions)||p.questions.length>30)throw new JobkixFault('INVALID_INPUT',{questions:'list'});
 const questions=p.questions.map(q=>{const row=v.object(q);return {id:v.uuid(row.id),label:v.text(row.label,'label',1,500),kind:v.choice(row.kind,['text','yes_no'],'kind'),required:bool(row.required,'required'),maxLength:v.integer(row.maxLength,'maxLength',1,10000)};});
 if(new Set(questions.map(question=>question.id)).size!==questions.length)throw new JobkixFault('INVALID_INPUT',{questions:'duplicate'});
 if(questions.some(question=>question.kind==='yes_no'&&question.maxLength<3))throw new JobkixFault('INVALID_INPUT',{questions:'yes_no_length'});
 const languages=v.strings(p.languages,'languages',50,6);if(languages.some(language=>!/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(language)))throw new JobkixFault('INVALID_INPUT',{languages:'language_code'});
 return {...vacancyCreateInput(p),duties:v.strings(p.duties,'duties',50,1000),requirements:v.strings(p.requirements,'requirements',50,1000),benefits:v.strings(p.benefits,'benefits',50,1000),languages,ageCohorts:v.strings(p.ageCohorts,'ageCohorts'),hoursPerWeek:p.hoursPerWeek===null?null:decimal(p.hoursPerWeek,'hoursPerWeek',0,168),compensation:v.compensation(p.compensation),overseasApplicants:v.choice(p.overseasApplicants,['yes','no','unknown'],'overseasApplicants'),sponsorship:v.choice(p.sponsorship,['yes','no','unknown'],'sponsorship'),relocation:v.choice(p.relocation,['yes','no','unknown'],'relocation'),requiredDocument:bool(p.requiredDocument,'requiredDocument'),questions};
}
export function vacancySaveInput(p:Record<string,unknown>){return {...vacancyContentInput(p),id:v.uuid(p.id)};}
export type VacancyCreateInput=ReturnType<typeof vacancyCreateInput>;
export type VacancySaveInput=ReturnType<typeof vacancySaveInput>;
