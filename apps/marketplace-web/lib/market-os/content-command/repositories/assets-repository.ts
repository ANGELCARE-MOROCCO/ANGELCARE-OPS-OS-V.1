import { createContentCommandSupabaseServerClient } from '../db/supabase-server';
import type { CreateAssetInput } from '../validation/assets';

export async function listContentCommandAssets() {
  const supabase = createContentCommandSupabaseServerClient();

  const { data, error } = await supabase
    .from('market_content_assets')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getContentCommandAsset(id: string) {
  const supabase = createContentCommandSupabaseServerClient();

  const { data, error } = await supabase
    .from('market_content_assets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createContentCommandAsset(input: CreateAssetInput) {
  const supabase = createContentCommandSupabaseServerClient();

  const { data, error } = await supabase
    .from('market_content_assets')
    .insert({
      title: input.title,
      status: input.status ?? 'draft',
      channel: input.channel ?? null,
      scheduled_date: input.scheduledDate ?? null,
      due_date: input.dueDate ?? null,
      campaign_id: input.campaignId ?? null,
      metadata: input.metadata ?? {},
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateContentCommandAsset(id: string, input: Partial<CreateAssetInput>) {
  const supabase = createContentCommandSupabaseServerClient();

  const { data, error } = await supabase
    .from('market_content_assets')
    .update({
      title: input.title,
      status: input.status,
      channel: input.channel,
      scheduled_date: input.scheduledDate,
      due_date: input.dueDate,
      campaign_id: input.campaignId,
      metadata: input.metadata,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data;
}