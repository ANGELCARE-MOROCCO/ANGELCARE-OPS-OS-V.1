import { createContentCommandSupabaseServerClient } from '../db/supabase-server';

export async function queueContentCommandPublication(input: {
  assetId: string;
  channel: string;
  scheduledFor?: string;
  providerPayload?: Record<string, unknown>;
}) {
  const supabase = createContentCommandSupabaseServerClient();

  const { data, error } = await supabase
    .from('market_content_publications')
    .insert({
      asset_id: input.assetId,
      channel: input.channel,
      state: 'queued',
      scheduled_for: input.scheduledFor ?? null,
      provider_payload: input.providerPayload ?? {},
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data;
}