import type { AcCapitalOsAuditEvent, AcCapitalOsRiskLevel } from './types';

function createAuditId() {
  return `ac-capital-os-audit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createAcCapitalOsAuditEvent(input: {
  action: string;
  objectType: string;
  objectId?: string;
  actorId?: string;
  severity?: AcCapitalOsRiskLevel;
  message: string;
}): AcCapitalOsAuditEvent {
  return {
    id: createAuditId(),
    module: 'AC CAPITAL OS',
    action: input.action,
    objectType: input.objectType,
    objectId: input.objectId,
    actorId: input.actorId,
    severity: input.severity ?? 'medium',
    message: input.message,
    createdAt: new Date().toISOString(),
  };
}

export const AC_CAPITAL_OS_AUDIT_ACTIONS = {
  openModule: 'ac_capital_os.open_module',
  viewFoundation: 'ac_capital_os.view_foundation',
  changeSetting: 'ac_capital_os.change_setting',
  injectDoctrine: 'ac_capital_os.inject_doctrine',
  approveCase: 'ac_capital_os.approve_case',
  executeExternalCommunication: 'ac_capital_os.execute_external_communication',
} as const;
