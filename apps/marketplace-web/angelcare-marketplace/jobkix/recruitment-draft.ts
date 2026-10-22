import { JobkixFault } from './contracts';
import { object,integer,text } from './validation';
export const RECRUITMENT_ACTIONS=['interview.propose','interview.reschedule','interview.cancel','interview.complete','offer.create','offer.save','offer.send','offer.withdraw'] as const;
export type RecruitmentAction=typeof RECRUITMENT_ACTIONS[number];
export interface RecruitmentIntent {action:RecruitmentAction;payload:Record<string,unknown>;version:number;key:string}
export function recruitmentIntent(value:unknown):RecruitmentIntent|null{
 if(value===undefined||value===null)return null;const row=object(value),action=RECRUITMENT_ACTIONS.find(action=>action===row.action);if(!action)throw new JobkixFault('INVALID_INPUT');
 return {action,payload:object(row.payload),version:integer(row.version,'version',0,1000000),key:text(row.key,'key',16,180)};
}
