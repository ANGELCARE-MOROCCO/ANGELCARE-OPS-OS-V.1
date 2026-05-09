
export type EmailOSRole =
  | "ceo"
  | "operations_director"
  | "support_lead"
  | "support_agent"
  | "hr_manager"
  | "legal"
  | "viewer"

export type EmailOSPermission =
  | "email.read"
  | "email.compose"
  | "email.send"
  | "email.approve"
  | "email.configure"
  | "email.audit"
  | "email.automation"
  | "email.assign"
  | "email.archive"

export const emailOSRolePermissions: Record<EmailOSRole, EmailOSPermission[]> = {
  ceo: ["email.read", "email.compose", "email.send", "email.approve", "email.configure", "email.audit", "email.automation", "email.assign", "email.archive"],
  operations_director: ["email.read", "email.compose", "email.send", "email.approve", "email.audit", "email.automation", "email.assign", "email.archive"],
  support_lead: ["email.read", "email.compose", "email.send", "email.assign", "email.archive"],
  support_agent: ["email.read", "email.compose", "email.archive"],
  hr_manager: ["email.read", "email.compose", "email.send", "email.approve", "email.assign"],
  legal: ["email.read", "email.compose", "email.approve", "email.audit"],
  viewer: ["email.read"]
}

export function hasEmailOSPermission(role: EmailOSRole, permission: EmailOSPermission) {
  return emailOSRolePermissions[role]?.includes(permission) ?? false
}
