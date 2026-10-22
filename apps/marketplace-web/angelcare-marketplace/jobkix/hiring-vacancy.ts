import type { Locale } from './contracts';
import { h } from './hiring-copy';
export const VACANCY_STATES=['draft','pending_review','published','paused','expired','filled','closed','archived','suspended'] as const;
export type VacancyState=typeof VACANCY_STATES[number];
export function vacancyState(record:Record<string,unknown>,now=Date.now()):VacancyState{
 const state=VACANCY_STATES.find(state=>state===record.state)||'draft';
 return state==='published'&&typeof record.expires_at==='string'&&Date.parse(record.expires_at)<=now?'expired':state;
}
export const vacancyStateLabel=(locale:Locale,state:VacancyState)=>h(locale,state);
export function vacancyActions(record:Record<string,unknown>,now=Date.now()):string[]{
 const state=vacancyState(record,now);return [
 ...(['draft','paused'].includes(state)?['vacancy.submit_review']:[]),
 ...(state==='pending_review'&&record.reviewed_version===record.version?['vacancy.publish']:[]),
 ...(state==='published'?['vacancy.pause']:[]),
 ...(['draft','pending_review','published','paused'].includes(state)?['vacancy.close']:[]),
 ...(['closed','expired','paused'].includes(state)?['vacancy.reopen']:[]),
 ...(['draft','closed','expired','filled','paused'].includes(state)?['vacancy.archive']:[]),
 ...(state!=='suspended'?['vacancy.duplicate']:[]),
 ];
}
