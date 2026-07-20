export type ExtensionAccessMode = 'READ_ONLY' | 'SUGGEST_ONLY' | 'USER_CONFIRMATION' | 'MANAGER_APPROVAL' | 'SAFE_AUTOMATION' | 'BLOCKED'
export type BootstrapModule = { key: string; label: string; route: string; enabled: boolean; accessLevel?: string; submodules: string[]; capabilities: string[] }
export type BootstrapPayload = {
  ok: true
  user: { id: string; name: string; email: string | null; role: string | null }
  device: { id: string; installationId: string; status: string; extensionVersion: string | null }
  accessVersion: number
  modules: BootstrapModule[]
  capabilities: string[]
  adapters: string[]
  autonomy: Array<{ actionPattern: string; mode: ExtensionAccessMode }>
  approvals: Array<{ commandPattern: string; approvalLevel: string; approverRole: string | null }>
  scopes: Record<string, unknown>
  features?: { b2bAccountIntelligence?: boolean; contractVersion?: string; commands?: string[] }
  issuedAt: string
}
export type StoredSession = { accessToken: string; refreshToken: string; apiBase: string; deviceId: string; expiresAt: string }
export type BrowserBusinessContext = { adapterId:string;pageType:string;url:string;origin?:string|null;title?:string|null;selectedText?:string|null;organization?:Record<string,any>;contacts?:Array<Record<string,any>>;evidence?:Array<Record<string,any>>;metadata?:Record<string,any> }
