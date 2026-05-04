export function canManage(role: string) {
  return role === "admin" || role === "manager"
}

export function canExecute(role: string) {
  return role === "admin" || role === "manager" || role === "operator"
}

export function canView(role: string) {
  return true
}
