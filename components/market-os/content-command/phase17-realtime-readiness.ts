export interface Phase17RealtimeProviderReadiness {
  id: string;
  provider: string;
  ready: boolean;
  notes: string;
}

export const phase17RealtimeProviderReadiness: Phase17RealtimeProviderReadiness[] = [
  {
    id: 'provider-local',
    provider: 'Local UI State',
    ready: true,
    notes: 'Current collaboration UI is safe to run without external realtime dependencies.',
  },
  {
    id: 'provider-supabase-realtime',
    provider: 'Supabase Realtime',
    ready: false,
    notes: 'Can later map presence, notifications, comments, and activity streams to realtime channels.',
  },
  {
    id: 'provider-websocket',
    provider: 'WebSocket Gateway',
    ready: false,
    notes: 'Optional later layer for live team sessions and active editing signals.',
  },
];