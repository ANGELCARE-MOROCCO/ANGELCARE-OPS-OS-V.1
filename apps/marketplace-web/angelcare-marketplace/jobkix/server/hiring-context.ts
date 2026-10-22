import 'server-only';
import type { Capability } from '../contracts';
import { JobkixFault } from '../contracts';
import { uuid } from '../validation';
import { rpc,studioRows,studioSelection,type DataRow } from './repository';
import { studioSelectionParams,type StudioSelectionResult } from '../studio-selection';
export async function hiringContext(userId:string,requested:string|null):Promise<{memberships:DataRow[];organizations:StudioSelectionResult;organization:DataRow|null}>{
 const requestedId=requested?uuid(requested,'organization'):null,organizations=await studioSelection(studioSelectionParams('organizations',undefined,undefined,requestedId?[requestedId]:[])),id=requestedId||organizations.items[0]?.id;
 const organization=id?(await studioRows('organizations',{id}))[0]||null:null;
 if(requestedId&&!organization)throw new JobkixFault('FORBIDDEN');
 const memberships=organization?(await studioRows('memberships',{user_id:userId,organization_id:String(organization.id)})).filter(row=>row.active===true&&(!row.expires_at||typeof row.expires_at==='string'&&Date.parse(row.expires_at)>Date.now())):[];
 if(organization&&!memberships.length)throw new JobkixFault('FORBIDDEN');
 return {memberships,organizations,organization};
}
/** This uses the canonical database permission function; UI visibility is not authorization. */
export async function hiringCapability(organizationId:string,capability:Capability,siteId:string|null=null,vacancyId:string|null=null):Promise<boolean>{const value=await rpc('jobkix_can_act',{p_org:uuid(organizationId),p_capability:capability,p_site:siteId,p_vacancy:vacancyId});if(typeof value!=='boolean')throw new JobkixFault('DEPENDENCY_UNAVAILABLE');return value;}
