import { JobkixFault } from './contracts';
import { object,uuid } from './validation';
/** One private binding; no caller-selected actor, table, projection or organization override. */
export function poolMembershipQuery(params:URLSearchParams){
 for(const key of params.keys())if(!['organization','pool','candidate'].includes(key)||params.getAll(key).length!==1)throw new JobkixFault('INVALID_INPUT');
 return {organization:uuid(params.get('organization')),pool:uuid(params.get('pool')),candidate:uuid(params.get('candidate'))};
}
export function poolMembershipResult(value:unknown):{present:boolean}{
 const result=object(value);
 if(Object.keys(result).length!==1||typeof result.present!=='boolean')throw new JobkixFault('DEPENDENCY_UNAVAILABLE');
 return {present:result.present};
}
