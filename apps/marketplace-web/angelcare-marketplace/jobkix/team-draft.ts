import { JobkixFault } from './contracts';
import { object,integer,text } from './validation';
export const TEAM_ACTIONS=['team.invite','team.change','team.transfer','team.revoke'] as const;
export type TeamDraftAction=typeof TEAM_ACTIONS[number];
export function teamIntent(value:unknown){if(value===undefined||value===null)return null;const row=object(value),action=TEAM_ACTIONS.find(action=>action===row.action);if(!action)throw new JobkixFault('INVALID_INPUT');return {action,payload:object(row.payload),version:integer(row.version,'version',0,1000000),key:text(row.key,'key',16,180)};}
