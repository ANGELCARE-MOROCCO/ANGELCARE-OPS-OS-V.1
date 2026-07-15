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
  | 'mission.assign'
  | 'proof.review'
  | 'payout.approve'
  | 'reward.manage'
  | 'ai.approve'
  | 'market.read'
  | 'infrastructure.admin';

export const ambassadorPermissionMatrix: Record<AmbassadorRole, AmbassadorAction[]> = {
  ceo: ['profile.read', 'profile.write', 'mission.assign', 'proof.review', 'payout.approve', 'reward.manage', 'ai.approve', 'market.read', 'infrastructure.admin'],
  operations_director: ['profile.read', 'profile.write', 'mission.assign', 'proof.review', 'reward.manage', 'ai.approve', 'market.read', 'infrastructure.admin'],
  marketing_director: ['profile.read', 'profile.write', 'mission.assign', 'proof.review', 'reward.manage', 'market.read'],
  ambassador_director: ['profile.read', 'profile.write', 'mission.assign', 'proof.review', 'reward.manage', 'market.read'],
  finance_operations: ['profile.read', 'payout.approve', 'reward.manage'],
  compliance_manager: ['profile.read', 'proof.review', 'ai.approve'],
  content_reviewer: ['profile.read', 'proof.review'],
  regional_manager: ['profile.read', 'mission.assign', 'market.read'],
  ambassador: ['profile.read']
};

export function canPerformAmbassadorAction(role: AmbassadorRole, action: AmbassadorAction): boolean {
  return ambassadorPermissionMatrix[role]?.includes(action) ?? false;
}

export function assertAmbassadorPermission(role: AmbassadorRole, action: AmbassadorAction): void {
  if (!canPerformAmbassadorAction(role, action)) {
    throw new Error(`Permission denied for ${role}: ${action}`);
  }
}
