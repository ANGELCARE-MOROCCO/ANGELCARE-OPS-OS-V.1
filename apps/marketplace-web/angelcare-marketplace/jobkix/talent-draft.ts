import { JobkixFault } from './contracts';
import { object,integer,text } from './validation';
export const TALENT_ACTIONS=['pool.create','pool.add','pool.remove'] as const;
export type TalentDraftAction=typeof TALENT_ACTIONS[number];
export function talentIntent(value:unknown){if(value===undefined||value===null)return null;const row=object(value),action=TALENT_ACTIONS.find(action=>action===row.action);if(!action)throw new JobkixFault('INVALID_INPUT');return {action,payload:object(row.payload),version:integer(row.version,'version',0,1000000),key:text(row.key,'key',16,180)};}
