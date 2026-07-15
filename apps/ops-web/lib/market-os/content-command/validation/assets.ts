export interface CreateAssetInput {
  title: string;
  status?: string;
  channel?: string;
  scheduledDate?: string;
  dueDate?: string;
  campaignId?: string;
  metadata?: Record<string, unknown>;
}

export function validateCreateAssetInput(input: CreateAssetInput): string | null {
  if (!input.title || input.title.trim().length < 3) return 'Title must contain at least 3 characters.';
  if (input.status && input.status.length > 50) return 'Status is too long.';
  if (input.channel && input.channel.length > 50) return 'Channel is too long.';
  return null;
}

export function validateId(id: string): string | null {
  if (!id || id.length < 8) return 'Invalid id.';
  return null;
}