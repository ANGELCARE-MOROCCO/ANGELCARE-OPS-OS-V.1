export type ExtensionAccessMode = 'READ_ONLY' | 'SUGGEST_ONLY' | 'USER_CONFIRMATION' | 'MANAGER_APPROVAL' | 'SAFE_AUTOMATION' | 'BLOCKED'
export type BootstrapModule = { key: string; label: string; route: string; enabled: boolean; accessLevel?: string; submodules: string[]; capabilities: string[] }
export type BootstrapPayload = {
  ok: true
  user: { id: string; name: string; email: string | null; role: string | null }
  device: { id: string; installationId: string; status: string; extensionVersion: string | null; releaseChannel?: string; healthStatus?: string }
  accessVersion: number
  modules: BootstrapModule[]
  capabilities: string[]
  adapters: string[]
  autonomy: Array<{ actionPattern: string; mode: ExtensionAccessMode }>
  approvals: Array<{ commandPattern: string; approvalLevel: string; approverRole: string | null }>
  scopes: Record<string, unknown>
  production?: { channel?: Record<string, any> | null; release?: Record<string, any> | null; flags?: Array<Record<string, any>>; killSwitches?: Array<Record<string, any>>; compatibility?: Array<Record<string, any>>; serverTime?: string }
  features?: { b2bAccountIntelligence?: boolean; b2bPartnerLifecycle?: boolean; b2bManagementCommand?: boolean; productionHardening?: boolean; contractVersion?: string; commands?: string[] }
  issuedAt: string
}
export type StoredSession = { accessToken: string; refreshToken: string; apiBase: string; deviceId: string; expiresAt: string }
export type BrowserBusinessContext = { adapterId:string;pageType:string;url:string;origin?:string|null;title?:string|null;selectedText?:string|null;organization?:Record<string,any>;contacts?:Array<Record<string,any>>;evidence?:Array<Record<string,any>>;metadata?:Record<string,any> }
