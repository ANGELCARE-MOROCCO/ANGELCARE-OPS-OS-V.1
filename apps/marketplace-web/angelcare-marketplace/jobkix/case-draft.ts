import { JobkixFault } from './contracts';
import { object,integer,text } from './validation';
export const CASE_ACTIONS=['case.create','case.reply','case.appeal','privacy.request','verification.submit'] as const;
export type CaseDraftAction=typeof CASE_ACTIONS[number];
export function caseIntent(value:unknown){if(value===undefined||value===null)return null;const row=object(value),action=CASE_ACTIONS.find(action=>action===row.action);if(!action)throw new JobkixFault('INVALID_INPUT');return {action,payload:object(row.payload),version:integer(row.version,'version',0,1000000),key:text(row.key,'key',16,180)};}
