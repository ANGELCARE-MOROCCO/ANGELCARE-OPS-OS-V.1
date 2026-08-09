import { createContentCommandSupabaseServerClient } from '../db/supabase-server';

export async function emitContentCommandRealtimeEvent(input: {
  eventName: string;
  entityTable: string;
  entityId?: string;
  payload?: Record<string, unknown>;
}) {
  const supabase = createContentCommandSupabaseServerClient();

  const { error } = await supabase.from('market_content_realtime_events').insert({
    event_name: input.eventName,
    entity_table: input.entityTable,
    entity_id: input.entityId ?? null,
    payload: input.payload ?? {},
  });

  if (error) throw new Error(error.message);
}