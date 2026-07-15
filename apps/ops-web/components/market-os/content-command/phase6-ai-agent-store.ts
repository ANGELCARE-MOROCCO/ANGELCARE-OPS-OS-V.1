import type { AiContentRequest, AiContentResult } from './phase6-ai-automation-types';

export const aiContentRequestStore: AiContentRequest[] = [];

export const aiContentResultStore: AiContentResult[] = [];

export function createAiContentRequest(request: AiContentRequest): AiContentRequest[] {
  return [...aiContentRequestStore, request];
}

export function createAiContentResult(result: AiContentResult): AiContentResult[] {
  return [...aiContentResultStore, result];
}