
import type { EmailOSPermission, EmailOSRole } from "./types"

export const emailOSRolePermissions: Record<EmailOSRole, EmailOSPermission[]> = {
  ceo: ["email.read", "email.compose", "email.send", "email.approve", "email.configure", "email.audit", "email.automation", "email.assign", "email.archive", "email.queue", "email.sync"],
  operations_director: ["email.read", "email.compose", "email.send", "email.approve", "email.configure", "email.audit", "email.automation", "email.assign", "email.archive", "email.queue", "email.sync"],
  support_lead: ["email.read", "email.compose", "email.send", "email.assign", "email.archive", "email.queue"],
  support_agent: ["email.read", "email.compose", "email.archive"],
  hr_manager: ["email.read", "email.compose", "email.send", "email.approve", "email.assign", "email.archive"],
  legal: ["email.read", "email.compose", "email.approve", "email.audit"],
  viewer: ["email.read"]
}

export function hasEmailOSPermission(role: EmailOSRole, permission: EmailOSPermission) {
  return emailOSRolePermissions[role]?.includes(permission) ?? false
}

export function resolveEmailOSRoleFromRequest(request: Request): EmailOSRole {
  const header = request.headers.get("x-email-os-role")
  if (header && header in emailOSRolePermissions) return header as EmailOSRole
  return "ceo"
}

export function assertEmailOSPermission(request: Request, permission: EmailOSPermission) {
  const role = resolveEmailOSRoleFromRequest(request)
  if (!hasEmailOSPermission(role, permission)) {
    throw new Error(`Email-OS permission denied: ${permission}`)
  }
  return role
}
