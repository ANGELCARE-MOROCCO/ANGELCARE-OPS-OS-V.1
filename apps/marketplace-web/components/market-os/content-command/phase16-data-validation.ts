import type { Phase16CreateRecordInput, Phase16MutationResult } from './phase16-data-types';

export function validatePhase16CreateInput(input: Phase16CreateRecordInput): Phase16MutationResult<Phase16CreateRecordInput> {
  if (!input.title || input.title.trim().length < 3) {
    return { ok: false, error: 'Title must be at least 3 characters.' };
  }

  if (!input.owner || input.owner.trim().length < 2) {
    return { ok: false, error: 'Owner is required.' };
  }

  return { ok: true, data: input };
}