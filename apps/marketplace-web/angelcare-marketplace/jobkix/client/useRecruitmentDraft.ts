'use client';
import type { DataRow } from '../server/repository';
import { recruitmentIntent,type RecruitmentAction } from '../recruitment-draft';
import { useDurableDraft,type DraftProtocol } from './useDurableDraft';
const protocol:DraftProtocol<RecruitmentAction>={kind:'hiring',parse:recruitmentIntent};
export function useRecruitmentDraft(key:string,draft:DataRow|null,receipt:DataRow|null){return useDurableDraft(protocol,key,draft,receipt);}
