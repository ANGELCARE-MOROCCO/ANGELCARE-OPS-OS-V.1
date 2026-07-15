import type { CreateContentCommandAssetInput } from '../repositories/content-command-repository-template';

export function validateCreateContentAsset(input: CreateContentCommandAssetInput): string | null {
  if (!input.title || input.title.trim().length < 3) return 'Title must be at least 3 characters.';
  if (input.status && input.status.length > 50) return 'Status is too long.';
  return null;
}

export function validateUuidLike(id: string): string | null {
  if (!id || id.length < 8) return 'Invalid id.';
  return null;
}