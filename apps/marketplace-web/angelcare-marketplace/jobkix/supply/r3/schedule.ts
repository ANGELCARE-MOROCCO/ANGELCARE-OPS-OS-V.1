/** Bounded timezone-aware scheduling: deterministic next due time, no browser dependency. */
export type Cadence='interval'|'hourly'|'daily'|'weekly'|'monthly'|'cron';
export type ScheduleSpec={cadence:Cadence;timezone:string;intervalMinutes:number;localTime:string;weekdays:number[];monthDay:number;cron:string;missedPolicy:'skip'|'once';retryLimit:number;enabled:boolean};
const ints=(value:unknown,fallback:number,min:number,max:number)=>Number.isInteger(Number(value))?Math.max(min,Math.min(max,Number(value))):fallback;
const error=(message:string):never=>{throw Error(message)};
export function scheduleSpec(raw:unknown):ScheduleSpec{
 const o=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw as Record<string,unknown>:{};
 const cadence=['interval','hourly','daily','weekly','monthly','cron'].find(x=>x===o.cadence) as Cadence|undefined;
 if(!cadence)error('Choose an execution cadence');
 const timezone=typeof o.timezone==='string'?o.timezone.trim():'';
 try{new Intl.DateTimeFormat('en-US',{timeZone:timezone}).format(new Date());}catch{error('Invalid IANA timezone')}
 const localTime=typeof o.localTime==='string'?o.localTime:'09:00';if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(localTime))error('Local time must be HH:MM');
 const weekdays=Array.isArray(o.weekdays)?[...new Set(o.weekdays.map(Number))].filter(n=>Number.isInteger(n)&&n>=0&&n<=6).sort():[1];
 const cron=typeof o.cron==='string'?o.cron.trim():'';if(cadence==='cron')parseCron(cron);
 return {cadence:cadence!,timezone,intervalMinutes:ints(o.intervalMinutes,60,15,10080),localTime,weekdays,monthDay:ints(o.monthDay,1,1,31),cron,missedPolicy:o.missedPolicy==='skip'?'skip':'once',retryLimit:ints(o.retryLimit,2,0,5),enabled:o.enabled===true};
}
function values(part:string,min:number,max:number):Set<number>{
 const output=new Set<number>();if(part.length>90||!part)error('Invalid cron field');
 for(const token of part.split(',')){
  const m=/^(\*|\d{1,2}(?:-\d{1,2})?)(?:\/(\d{1,2}))?$/.exec(token);if(!m)throw Error('Unsupported cron token: '+token);
  const step=m[2]?Number(m[2]):1;if(step<1||step>max)error('Invalid cron step');
  const [start,end]=m[1]==='*'?[min,max]:m[1].includes('-')?m[1].split('-').map(Number):[Number(m[1]),Number(m[1])];
  if(start<min||end>max||start>end)error('Cron value outside range');
  for(let i=start;i<=end;i+=step)output.add(i);
 }
 return output;
}
export function parseCron(cron:string){const parts=cron.split(/\s+/);if(parts.length!==5)error('Cron requires five fields: minute hour day month weekday');return {minute:values(parts[0],0,59),hour:values(parts[1],0,23),day:values(parts[2],1,31),month:values(parts[3],1,12),weekday:values(parts[4],0,6),dayWildcard:parts[2]==='*',weekdayWildcard:parts[4]==='*'};}
function localParts(utc:Date,fmt:Intl.DateTimeFormat){const entries=fmt.formatToParts(utc);const vals:Record<string,number>={};for(const x of entries)if(['year','month','day','hour','minute','weekday'].includes(x.type)){
  vals[x.type]=x.type==='weekday'?['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(x.value):Number(x.value);
 }return vals;}
/** Finds the next valid local wall-clock occurrence (DST gaps skip; repeated wall times execute once per UTC occurrence). */
export function nextDue(raw:unknown,after:Date):Date{
 const cfg=scheduleSpec(raw);if(cfg.cadence==='interval'||cfg.cadence==='hourly')return new Date(after.getTime()+(cfg.cadence==='hourly'?60:cfg.intervalMinutes)*60000);
 const fmt=new Intl.DateTimeFormat('en-US',{timeZone:cfg.timezone,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',weekday:'short'});
 const [hour,minute]=cfg.localTime.split(':').map(Number),expr=cfg.cadence==='cron'?parseCron(cfg.cron):null;
 const start=Math.floor(after.getTime()/60000)*60000+60000;
 for(let offset=0;offset<366*1440;offset++){
  const moment=new Date(start+offset*60000),p=localParts(moment,fmt);
  if(cfg.cadence==='cron'){
   if(!expr!.minute.has(p.minute)||!expr!.hour.has(p.hour)||!expr!.month.has(p.month))continue;
   const dayOK=expr!.day.has(p.day),weekOK=expr!.weekday.has(p.weekday);
   if(expr!.dayWildcard?!weekOK:expr!.weekdayWildcard?!dayOK:!(dayOK||weekOK))continue;
  }else{
   if(p.hour!==hour||p.minute!==minute)continue;
   if(cfg.cadence==='weekly'&&!cfg.weekdays.includes(p.weekday))continue;
   if(cfg.cadence==='monthly'&&p.day!==cfg.monthDay)continue;
  }
  return moment;
 }
 return error('Schedule has no occurrence within the next 366 days');
}
export function previewSchedule(raw:unknown,from=new Date(),count=5):string[]{const result:string[]=[];let d=from;for(let i=0;i<Math.max(1,Math.min(10,count));i++){d=nextDue(raw,d);result.push(d.toISOString())}return result;}
