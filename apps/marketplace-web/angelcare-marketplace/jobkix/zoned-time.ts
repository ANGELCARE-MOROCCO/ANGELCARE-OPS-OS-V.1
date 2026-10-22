import { JobkixFault } from './contracts';
import { instant,timezone } from './validation';
/** Explicit IANA wall-time conversion, following the existing DCE offset-probe approach.
 * A gap or repeated local minute requires another choice; never silently select a DST offset.
 */
export function wallTime(value:string,zone:string):string{
 const date=new Date(instant(value,'instant')),parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone(zone),year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);
 const part=(key:string)=>parts.find(item=>item.type===key)?.value||'';
 return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
}
export function wallTimeInstant(value:string,zone:string):string{
 timezone(zone);if(!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d$/.test(value))throw new JobkixFault('INVALID_INPUT',{time:'invalid_local_time'});
 const naive=Date.parse(value+':00.000Z');if(!Number.isFinite(naive)||new Date(naive).toISOString().slice(0,16)!==value)throw new JobkixFault('INVALID_INPUT',{time:'invalid_local_time'});
 const offsets=new Set<number>();for(let hours=-48;hours<=48;hours+=6){const probe=naive+hours*3600000;offsets.add(Date.parse(wallTime(new Date(probe).toISOString(),zone)+':00.000Z')-probe);}
 const candidates=[...offsets].map(offset=>new Date(naive-offset).toISOString()).filter(candidate=>wallTime(candidate,zone)===value);
 if(candidates.length!==1)throw new JobkixFault('INVALID_INPUT',{time:candidates.length?'ambiguous_local_time':'nonexistent_local_time'});
 return candidates[0];
}
