import { array, number, object, text, type Data, type DceRecord, type Tri } from './types'
export const PROFESSIONAL_CONTRACT = 'ANGELCARE_DCE_PROFESSIONAL_R4'
export const WORK_KINDS = ['task','comment','media_job','sla_policy','case_operation','retention_policy','disposal','saved_report','notification','capability','editorial_policy','editorial_notice'] as const
export type WorkKind = typeof WORK_KINDS[number]
export interface WorkItem { id:string; kind:WorkKind; record_id:string|null; title:string; status:string; data:Data; revision:number; created_by:string; updated_by:string; created_at:string; updated_at:string; tenant_id:string|null; territory_id:string|null }
export const RECIPES = [
 { key:'image', label:['Image renditions','Renditions image','نسخ الصور'] as Tri, sources:['image/'], tools:['ffmpeg'], output:'Images · focal crop · contained source · alternative text' },
 { key:'document', label:['Document preparation','Préparation documentaire','إعداد الوثائق'] as Tri, sources:['application/pdf'], tools:['pdftoppm','pdftotext','pdfinfo','pdfseparate','pdfunite'], output:'Selected pages · thumbnails · extracted text' },
 { key:'ocr', label:['Scanned document OCR','OCR des documents scannés','التعرف على الوثائق الممسوحة'] as Tri, sources:['application/pdf','image/'], tools:['tesseract','pdftoppm','pdfinfo','pdfunite'], output:'Searchable PDF · machine text for human review' },
 { key:'slides', label:['Presentation conversion','Conversion de présentation','تحويل العروض'] as Tri, sources:['application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.oasis.opendocument.presentation','application/vnd.ms-powerpoint'], tools:['libreoffice','pdftoppm','pdftotext','pdfinfo','pdfseparate','pdfunite'], output:'Static PDF and slide frames · editable DCE ordering and narration' },
 { key:'video', label:['Video preparation','Préparation vidéo','إعداد الفيديو'] as Tri, sources:['video/'], tools:['ffmpeg','ffprobe'], output:'Trimmed MP4 · poster · chapters · caption track' },
 { key:'audio', label:['Audio preparation','Préparation audio','إعداد الصوت'] as Tri, sources:['audio/'], tools:['ffmpeg','ffprobe'], output:'Trimmed normalized MP3 · waveform · reviewed cue data' },
 { key:'transcript', label:['Speech transcription','Transcription vocale','تفريغ الكلام'] as Tri, sources:['audio/','video/'], tools:['ffmpeg','whisper'], output:'Machine transcript · timed WebVTT · human correction' }
] as const
export function recipeInput(source:{mime:string}, input:Data):Data {
 const recipe=RECIPES.find(r=>r.key===input.recipe)
 if(!recipe||!recipe.sources.some(m=>m.endsWith('/')?source.mime.startsWith(m):source.mime===m))throw Error('Choose a processing task compatible with this source.')
 const start=number(input.start),end=number(input.end)
 if(start<0||end<0||end&&end<=start)throw Error('End time must follow start time.')
 const widths=(Array.isArray(input.widths)?input.widths:[480,960,1600]).map(Number)
 if(!widths.length||widths.length>6||widths.some(n=>!Number.isInteger(n)||n<64||n>4096))throw Error('Choose up to six image widths from 64 to 4096 pixels.')
 const pages=text(input.pages);if(pages&&!/^\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*$/.test(pages))throw Error('Use page numbers or ranges, such as 1-4,7.')
 if(pages.split(',').some(p=>{const[a,b]=p.split('-').map(Number);return pages&&(!a||a>1000||b&&b<a||b>1000)}))throw Error('Page range is invalid or exceeds the bounded production limit.')
 const language=text(input.language)||'fr';if(!['fr','en','ar','fra','eng','ara'].includes(language))throw Error('Choose French, English or Arabic.')
 const focalX=number(input.focalX,.5),focalY=number(input.focalY,.5)
 if(focalX<0||focalX>1||focalY<0||focalY>1)throw Error('Focal coordinates must be within the image.')
 const chapters=array(input.chapters);if(chapters.some(c=>number(c.seconds)<start||end&&number(c.seconds)>=end||!text(c.title)))throw Error('Each chapter needs a title and a timestamp inside the selected interval.')
 const cues=array(input.cues);if(cues.some(c=>number(c.start)<start||number(c.end)<=number(c.start)||end&&number(c.end)>end||!text(c.text)))throw Error('Caption cues need valid intervals and text.')
 return {recipe:recipe.key,version:1,start,end,widths:[...new Set(widths)],pages,language,focalX,focalY,crop:input.crop===true,normalize:input.normalize!==false,alt:text(input.alt).slice(0,1000),chapters,cues,model:'small',requiresReview:true}
}
export interface Calendar {timezone:string;weekdays:number[];startMinute:number;endMinute:number;holidays:string[]}
export const DEFAULT_CALENDAR:Calendar={timezone:'Africa/Casablanca',weekdays:[1,2,3,4,5],startMinute:480,endMinute:1140,holidays:[]}
export function calendarInput(d:Data):Calendar {
 const timezone=text(d.timezone)||DEFAULT_CALENDAR.timezone
 try{new Intl.DateTimeFormat('en',{timeZone:timezone}).format()}catch{throw Error('Choose a valid IANA time zone.')}
 const weekdays=(Array.isArray(d.weekdays)?d.weekdays:DEFAULT_CALENDAR.weekdays).map(Number),startMinute=number(d.startMinute,480),endMinute=number(d.endMinute,1140)
 if(!weekdays.length||weekdays.some(n=>!Number.isInteger(n)||n<0||n>6)||!Number.isInteger(startMinute)||!Number.isInteger(endMinute)||startMinute<0||endMinute>1440||startMinute>=endMinute)throw Error('Choose working days and a valid same-day service window.')
 const holidays=(Array.isArray(d.holidays)?d.holidays:[]).map(String);if(holidays.some(d=>!/^\d{4}-\d\d-\d\d$/.test(d)||!Number.isFinite(Date.parse(d))))throw Error('Use valid holiday dates.')
 return{timezone,weekdays:[...new Set(weekdays)],startMinute,endMinute,holidays}
}
const clockFormatters=new Map<string,Intl.DateTimeFormat>()
function clock(zone:string){if(!clockFormatters.has(zone)){if(clockFormatters.size>50)clockFormatters.clear();clockFormatters.set(zone,new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}))}return clockFormatters.get(zone)!}
function wall(ms:number,zone:string){const parts=clock(zone).formatToParts(new Date(ms)),v=(k:string)=>parts.find(p=>p.type===k)?.value||'';return v('year')+'-'+v('month')+'-'+v('day')+'T'+v('hour')+':'+v('minute')}
function wallBoundary(date:string,minute:number,zone:string,last=false){const raw=Date.parse(date+'T00:00:00Z')+minute*60000,target=new Date(raw).toISOString().slice(0,16),offsets=new Set<number>();for(const hours of[-36,-12,0,12,36]){const at=raw+hours*3600000;offsets.add(Date.parse(wall(at,zone)+'Z')-Math.floor(at/60000)*60000)}const candidates=[...offsets].map(o=>raw-o).filter(ms=>wall(ms,zone)===target).sort((a,b)=>a-b);if(candidates.length)return last?candidates.at(-1)!:candidates[0];for(let shift=1;shift<=180;shift++){const next=new Date(raw+shift*60000).toISOString().slice(0,16),matches=[...offsets].map(o=>raw+shift*60000-o).filter(ms=>wall(ms,zone)===next);if(matches.length)return Math.min(...matches)}throw Error('The service calendar cannot resolve this local boundary.')}
/** Integrates actual UTC working intervals, including holidays, DST and the union of pauses. */
export function businessMinutes(start:string,end:string,calendar:Calendar,pauses:Data[]=[]){const a=Date.parse(start),b=Date.parse(end);if(!Number.isFinite(a)||!Number.isFinite(b)||b<a||b-a>3660*86400000)throw Error('Service interval must be valid and within ten years.');const first=Date.parse(wall(a,calendar.timezone).slice(0,10)+'T00:00:00Z'),last=Date.parse(wall(b,calendar.timezone).slice(0,10)+'T00:00:00Z'),excluded:[number,number][]=[];for(const p of pauses){const x=Math.max(a,Date.parse(text(p.start))),y=Math.min(b,p.end?Date.parse(text(p.end)):b);if(Number.isFinite(x)&&Number.isFinite(y)&&y>x)excluded.push([x,y])}excluded.sort((x,y)=>x[0]-y[0]);const merged:[number,number][]=[];for(const p of excluded){const tail=merged.at(-1);if(tail&&p[0]<=tail[1])tail[1]=Math.max(tail[1],p[1]);else merged.push([...p])}let total=0;for(let day=first;day<=last;day+=86400000){const d=new Date(day),date=d.toISOString().slice(0,10);if(!calendar.weekdays.includes(d.getUTCDay())||calendar.holidays.includes(date))continue;const x=Math.max(a,wallBoundary(date,calendar.startMinute,calendar.timezone)),y=Math.min(b,wallBoundary(date,calendar.endMinute,calendar.timezone,true));if(y<=x)continue;let duration=y-x;for(const p of merged)duration-=Math.max(0,Math.min(y,p[1])-Math.max(x,p[0]));total+=Math.max(0,duration)/60000}return total}

export function slaState(r:DceRecord,operation:Data,policy:Data,now=new Date().toISOString()){
 const calendar=calendarInput(object(policy.calendar)),elapsed=businessMinutes(r.created_at,now,calendar,policy.pauseWaitingCustomer===false?[]:array(operation.pauses)),responded=text(operation.firstResponseAt),resolved=['resolved','closed'].includes(r.lifecycle),first=number(policy.responseMinutes,120),resolution=number(policy.resolutionMinutes,1440),limit=responded?resolution:first,spent=responded?elapsed:elapsed
 return{elapsedMinutes:Math.floor(spent),remainingMinutes:Math.ceil(limit-spent),target:responded?'resolution':'first_response',state:resolved?'resolved':r.lifecycle==='waiting_customer'&&policy.pauseWaitingCustomer!==false?'paused':spent>=limit?'overdue':spent>=limit*.8?'approaching':'within_target',calendar,firstResponseAt:responded||null}
}
export const EVENT_ACTIONS=['discover','start','checkpoint','complete','bookmark','share','download','print','submission','return','native_conversion','result_view','download_pdf','download_png','certificate_request','action_failed','completion_reported','output_prepare','output_ready','download_intent','recommendation_open','love','unlove','ad_request','ad_filled','ad_no_fill','ad_failed'] as const
export function cleanExperienceEvent(input:Data):Data {
 if(!EVENT_ACTIONS.includes(input.action as any)||!['production','preview','fixture'].includes(text(input.environment)))throw Error('Choose a declared event action and environment.')
 const out:Data={contractVersion:2,action:input.action,environment:input.environment}
 for(const key of ['family','topic','audience','source','locale','device','region','unitId','sessionId','outcome'])if(typeof input[key]==='string')out[key]=text(input[key]).slice(0,120)
 // Only server-issued pseudonyms enter strategic aggregation; never raw answers or contact details.
 if(!/^[a-f0-9]{64}$/.test(text(input.subjectKey)))throw Error('A server-issued pseudonymous subject key is required.')
 out.subjectKey=input.subjectKey;if(input.action==='native_conversion'&&!text(input.nativeReceiptId))throw Error('A verified native receipt is required for commercial conversion.')
 if(input.action==='native_conversion')out.nativeReceiptId=input.nativeReceiptId
 return out
}
export function workData(kind:WorkKind,data:Data):Data {
 if(kind==='task'){
  if(!['low','normal','high','urgent'].includes(text(data.priority)||'normal'))throw Error('Choose a supported priority.')
  if(data.dueAt&&!Number.isFinite(Date.parse(text(data.dueAt))))throw Error('Choose a valid deadline.')
  if(data.locale&&!['en','fr','ar'].includes(text(data.locale)))throw Error('Choose a supported locale.')
  return{...data,priority:text(data.priority)||'normal',dependencies:Array.isArray(data.dependencies)?data.dependencies:[]}
 }
 if(kind==='sla_policy'){const responseMinutes=number(data.responseMinutes,120),resolutionMinutes=number(data.resolutionMinutes,1440);if(!Number.isInteger(responseMinutes)||responseMinutes<1||!Number.isInteger(resolutionMinutes)||resolutionMinutes<responseMinutes||resolutionMinutes>525600)throw Error('Set coherent whole-minute response and resolution targets.');return{...data,calendar:calendarInput(object(data.calendar)) as unknown as Data,responseMinutes,resolutionMinutes}}
 if(kind==='retention_policy'){const days=number(data.days),graceDays=number(data.graceDays,7);if(!Number.isInteger(days)||days<1||days>3650||!Number.isInteger(graceDays)||graceDays<1||graceDays>90)throw Error('Retention is 1–3650 days, with a 1–90 day cancellation window.');if(!['case','run','contribution','attachment','event','production_output'].includes(text(data.target)))throw Error('Choose a DCE-owned retention class.');return{...data,days,graceDays}}
 if(kind==='comment'&&(!text(data.body)||text(data.body).length>8000))throw Error('Write a comment within 8000 characters.')
 return data
}
export const HUMAN_STATUS:Record<string,Tri>={assigned:['Assigned','Attribué','مسند'],waiting_customer:['Waiting for customer','En attente du client','بانتظار العميل'],resolved:['Resolved','Résolu','تم الحل'],closed:['Closed','Clos','مغلق'],active:['Active','Actif','فعال'],inactive:['Inactive','Inactif','غير فعال'],provider_accepted:['Accepted by mail provider','Accepté par le fournisseur mail','مقبول من مزود البريد'],delivery_unknown:['Delivery to investigate','Livraison à vérifier','تسليم يحتاج إلى التحقق'],sending:['Dispatch in progress','Envoi en cours','جار الإرسال'],queued:['Waiting for processing','En attente de traitement','بانتظار المعالجة'],running:['Processing','Traitement en cours','قيد المعالجة'],needs_review:['Ready for your review','À vérifier','جاهز للمراجعة'],ready:['Reviewed and ready','Vérifié et prêt','تمت المراجعة وجاهز'],failed:['Needs recovery','Reprise nécessaire','يحتاج إلى الاستعادة'],cancelled:['Cancelled','Annulé','ملغى'],cancel_requested:['Stopping safely','Arrêt sécurisé','إيقاف آمن'],open:['To do','À faire','للتنفيذ'],in_progress:['In progress','En cours','قيد الإنجاز'],review:['Awaiting review','En attente de revue','بانتظار المراجعة'],changes_requested:['Changes requested','Corrections demandées','تعديلات مطلوبة'],done:['Completed','Terminé','مكتمل'],scheduled:['Scheduled','Planifié','مجدول'],blocked:['Action required','Action requise','إجراء مطلوب'],disposed:['Disposed with evidence','Suppression tracée','تم الحذف مع التوثيق']}
