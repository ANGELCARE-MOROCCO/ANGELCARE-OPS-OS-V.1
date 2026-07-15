export type EmailOSRole =
  | "ceo"
  | "operations"
  | "support"
  | "finance"
  | "hr"
  | "admin"

export function getEmailOSRoleFromRequest(request: Request): EmailOSRole {
  const headerRole = request.headers.get("x-email-os-role")
  if (isEmailOSRole(headerRole)) return headerRole

  return "operations"
}

export function isEmailOSRole(value: unknown): value is EmailOSRole {
  return ["ceo", "operations", "support", "finance", "hr", "admin"].includes(String(value))
}

export function canExecuteEmailOSAction(role: EmailOSRole, action: string) {
  if (role === "ceo" || role === "admin") return true

  if (action.includes("delete") || action.includes("approval.rejected")) {
    return role === "operations"
  }

  if (action.includes("send") || action.includes("queue") || action.includes("thread")) {
    return ["operations", "support"].includes(role)
  }

  if (action.includes("finance")) return role === "finance"
  if (action.includes("hr")) return role === "hr"

  return true
}
