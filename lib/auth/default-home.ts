export function getDefaultHome(
  role?: string,
  permissions: string[] = []
) {
  const normalizedRole = (role || "").toLowerCase()

  if (normalizedRole === "staff") {
    return "/staff"
  }

  if (
    normalizedRole === "ceo" ||
    normalizedRole === "admin" ||
    permissions.includes("*")
  ) {
    return "/command-center"
  }

  if (permissions.includes("staff.portal")) {
    return "/staff"
  }

  if (permissions.includes("hr.access")) {
    return "/hr/launch-center"
  }

  return "/staff"
}
