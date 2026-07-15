import type { AmbassadorAction, AmbassadorRole } from './types';

export const ambassadorPermissionMatrix: Record<AmbassadorRole, AmbassadorAction[]> = {
  ceo: ['profile.read', 'profile.write', 'campaign.write', 'mission.assign', 'proof.review', 'payout.approve', 'reward.manage', 'ai.approve', 'ai.execute', 'market.read', 'infrastructure.admin', 'notification.dispatch'],
  operations_director: ['profile.read', 'profile.write', 'campaign.write', 'mission.assign', 'proof.review', 'reward.manage', 'ai.approve', 'ai.execute', 'market.read', 'infrastructure.admin', 'notification.dispatch'],
  marketing_director: ['profile.read', 'profile.write', 'campaign.write', 'mission.assign', 'proof.review', 'reward.manage', 'market.read', 'notification.dispatch'],
  ambassador_director: ['profile.read', 'profile.write', 'campaign.write', 'mission.assign', 'proof.review', 'reward.manage', 'market.read', 'notification.dispatch'],
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
    throw new Error(`Permission denied for role ${role}: ${action}`);
  }
}
