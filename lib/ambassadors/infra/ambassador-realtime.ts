export type AmbassadorRealtimeChannel =
  | 'ambassador.live.activity'
  | 'ambassador.alerts'
  | 'ambassador.missions'
  | 'ambassador.proofs'
  | 'ambassador.revenue'
  | 'ambassador.ai.actions';

export const ambassadorRealtimeChannels: AmbassadorRealtimeChannel[] = [
  'ambassador.live.activity',
  'ambassador.alerts',
  'ambassador.missions',
  'ambassador.proofs',
  'ambassador.revenue',
  'ambassador.ai.actions'
];

export function canSubscribeToChannel(role: string, channel: AmbassadorRealtimeChannel): boolean {
  if (role === 'ceo' || role === 'operations_director') return true;
  if (channel === 'ambassador.ai.actions') return role === 'marketing_director' || role === 'ambassador_director';
  if (channel === 'ambassador.revenue') return role === 'finance_operations' || role === 'marketing_director';
  return true;
}
