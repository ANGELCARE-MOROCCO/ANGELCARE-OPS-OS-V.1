export type ExtensionAccessMode = 'READ_ONLY' | 'SUGGEST_ONLY' | 'USER_CONFIRMATION' | 'MANAGER_APPROVAL' | 'SAFE_AUTOMATION' | 'BLOCKED'
export type BrowserExtensionActor = { id: string; email?: string | null; full_name?: string | null; name?: string | null; role?: string | null; role_key?: string | null; permissions?: string[] | null }
export type AccessTokenClaims = { typ: 'angelcare_browser_access'; sub: string; deviceId: string; accessVersion: number; iat: number; exp: number; jti: string }
export type ExtensionAuthContext = { user: BrowserExtensionActor; device: Record<string, any>; claims: AccessTokenClaims }
