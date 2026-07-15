export type FinalRealtimeChannel =
  | 'ambassador.live.activity'
  | 'ambassador.alerts'
  | 'ambassador.missions'
  | 'ambassador.proofs'
  | 'ambassador.revenue'
  | 'ambassador.ai.actions'
  | 'ambassador.infrastructure';

export const finalAmbassadorRealtimeChannels: FinalRealtimeChannel[] = [
  'ambassador.live.activity',
  'ambassador.alerts',
  'ambassador.missions',
  'ambassador.proofs',
  'ambassador.revenue',
  'ambassador.ai.actions',
  'ambassador.infrastructure'
];

export function canSubscribeToFinalChannel(role: string, channel: FinalRealtimeChannel): boolean {
  if (role === 'ceo' || role === 'operations_director') return true;
  if (channel === 'ambassador.infrastructure') return role === 'operations_director';
  if (channel === 'ambassador.ai.actions') return ['ceo', 'operations_director', 'marketing_director', 'ambassador_director'].includes(role);
  if (channel === 'ambassador.revenue') return ['ceo', 'finance_operations', 'marketing_director'].includes(role);
  return true;
}
