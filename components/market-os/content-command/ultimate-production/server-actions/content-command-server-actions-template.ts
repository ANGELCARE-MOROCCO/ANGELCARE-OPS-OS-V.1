'use server';

import { validateCreateContentAsset, validateUuidLike } from '../validation/content-command-validation';
import { createSupabaseContentCommandRepository } from '../repositories/supabase-server-repository-template';
import { recordContentCommandAuditEvent } from '../audit/audit-runtime-template';
import type { CreateContentCommandAssetInput } from '../repositories/content-command-repository-template';

export async function createContentCommandAssetAction(input: CreateContentCommandAssetInput) {
  const validationError = validateCreateContentAsset(input);
  if (validationError) return { ok: false, error: validationError };

  const repository = createSupabaseContentCommandRepository();
  const result = await repository.createAsset(input);

  if (result.ok) {
    await recordContentCommandAuditEvent({
      entityTable: 'market_content_assets',
      entityId: result.data.id,
      action: 'create',
      payload: { title: input.title },
    });
  }

  return result;
}

export async function archiveContentCommandAssetAction(id: string) {
  const validationError = validateUuidLike(id);
  if (validationError) return { ok: false, error: validationError };

  const repository = createSupabaseContentCommandRepository();
  const result = await repository.archiveAsset(id);

  if (result.ok) {
    await recordContentCommandAuditEvent({
      entityTable: 'market_content_assets',
      entityId: id,
      action: 'archive',
    });
  }

  return result;
}