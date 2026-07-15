export function verifyEmailOSInternalToken(request: Request) {
  const token = request.headers.get("x-email-os-token")
  const expected = process.env.EMAIL_OS_INTERNAL_TOKEN

  if (!expected) return true
  return token === expected
}

export function requireEmailOSInternalToken(request: Request) {
  if (!verifyEmailOSInternalToken(request)) {
    throw new Error("Unauthorized Email-OS internal request")
  }
}
