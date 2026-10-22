import { JobkixFault } from './contracts';

export const PRIVATE_EXPORT_FORMAT='JOBKIX_PRIVATE_CAREER_EXPORT_V1';
export const PRIVATE_EXPORT_FILENAME='jobkix-private-career-data.json';
const collections=['files','applications','messages','interviews','offers','savedJobs','savedResources','savedSearches','blockedOrganizations','consents','reputationContributions','cases','caseMessages'] as const;
const record=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
const unavailable=()=>new JobkixFault('DEPENDENCY_UNAVAILABLE');

/** Check the existing SQL projection; never broaden its private data authority. */
export function privateExportData(value:unknown,subject:string):Record<string,unknown>{
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(subject)||!record(value)||value.format!==PRIVATE_EXPORT_FORMAT||typeof value.generatedAt!=='string'||!Number.isFinite(Date.parse(value.generatedAt))||!record(value.account))throw unavailable();
 if(value.profile!==null&&(!record(value.profile)||value.profile.user_id!==subject))throw unavailable();
 for(const key of collections)if(!Array.isArray(value[key])||!value[key].every(record))throw unavailable();
 if(!Array.isArray(value.applications)||value.applications.some(row=>!record(row)||row.candidate_user_id!==subject))throw unavailable();
 return value;
}

/** Preserve the exact successful response bytes; refuse HTML/error attachments. */
export async function privateExportBlob(response:Response,subject:string):Promise<Blob>{
 if(!response.ok||response.headers.get('X-Jobkix-Subject')!==subject||response.headers.get('Content-Type')?.split(';',1)[0].trim().toLowerCase()!=='application/json'||response.headers.get('Content-Disposition')!==`attachment; filename="${PRIVATE_EXPORT_FILENAME}"`||!/(?:^|[,\s])no-store(?:[,\s]|$)/i.test(response.headers.get('Cache-Control')||''))throw unavailable();
 const blob=await response.blob();let data:unknown;
 try{data=JSON.parse(await blob.text());}catch{throw unavailable();}
 privateExportData(data,subject);return blob;
}
