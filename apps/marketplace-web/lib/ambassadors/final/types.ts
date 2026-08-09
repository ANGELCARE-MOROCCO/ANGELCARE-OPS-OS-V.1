export type AmbassadorRole =
  | 'ceo'
  | 'operations_director'
  | 'marketing_director'
  | 'ambassador_director'
  | 'finance_operations'
  | 'compliance_manager'
  | 'content_reviewer'
  | 'regional_manager'
  | 'ambassador';

export type AmbassadorAction =
  | 'profile.read'
  | 'profile.write'
  | 'campaign.write'
  | 'mission.assign'
  | 'proof.review'
  | 'payout.approve'
  | 'reward.manage'
  | 'ai.approve'
  | 'ai.execute'
  | 'market.read'
  | 'infrastructure.admin'
  | 'notification.dispatch';

export type ActorContext = {
  actorId: string;
  role: AmbassadorRole;
  email?: string;
};

export type AmbassadorServiceResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};
