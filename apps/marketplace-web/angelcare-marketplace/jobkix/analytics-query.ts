import { JobkixFault } from './contracts';
function date(value:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new JobkixFault('INVALID_INPUT');const parsed=new Date(value+'T00:00:00.000Z');if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==value)throw new JobkixFault('INVALID_INPUT');return parsed;}
export function analyticsWindow(search:Record<string,string|string[]|undefined>,now=new Date()){
 if(Array.isArray(search.from)||Array.isArray(search.until))throw new JobkixFault('INVALID_INPUT');
 const until=date(search.until||new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+1)).toISOString().slice(0,10)),from=date(search.from||new Date(until.getTime()-30*86400000).toISOString().slice(0,10));
 if(until.getTime()<=from.getTime()||until.getTime()-from.getTime()>366*86400000)throw new JobkixFault('INVALID_INPUT');return {from:from.toISOString(),until:until.toISOString()};
}
