export {};

declare global {
  type AngelCareWhatsAppLayout = "split" | "focus" | "full" | "hidden";

  interface AngelCareWhatsAppDownload {
    readonly id: string;
    readonly filename: string;
    readonly state: string;
    readonly receivedBytes: number;
    readonly totalBytes: number;
    readonly savePath: string | null;
    readonly reason?: string | null;
    readonly at: string;
    readonly completedAt?: string;
  }

  interface AngelCareWhatsAppPermissionEvent {
    readonly permission: string;
    readonly allowed: boolean;
    readonly origin: string | null;
    readonly mediaTypes: readonly string[];
    readonly at: string;
  }

  interface AngelCareWhatsAppStatus {
    readonly available: boolean;
    readonly created: boolean;
    readonly visible: boolean;
    readonly requestedVisible: boolean;
    readonly phase: string;
    readonly message: string;
    readonly detail: string | null;
    readonly currentUrl: string | null;
    readonly title: string | null;
    readonly online: boolean | null;
    readonly rendererStatus: string;
    readonly authProfile: "unknown" | "local-profile-present" | "qr-likely-required" | string;
    readonly canGoBack: boolean;
    readonly canGoForward: boolean;
    readonly layoutMode: AngelCareWhatsAppLayout;
    readonly partition: string;
    readonly lastLoadStartedAt: string | null;
    readonly lastLoadedAt: string | null;
    readonly lastErrorAt: string | null;
    readonly lastCrashAt: string | null;
    readonly lastResponsiveAt: string | null;
    readonly storagePath: string | null;
    readonly downloads: readonly AngelCareWhatsAppDownload[];
    readonly permissions: readonly AngelCareWhatsAppPermissionEvent[];
    readonly timestamp: string;
  }

  interface AngelCareWhatsAppDesktopApi {
    getStatus(): Promise<AngelCareWhatsAppStatus>;
    show(): Promise<AngelCareWhatsAppStatus>;
    hide(): Promise<AngelCareWhatsAppStatus>;
    reload(): Promise<AngelCareWhatsAppStatus>;
    hardReload(): Promise<AngelCareWhatsAppStatus>;
    goBack(): Promise<AngelCareWhatsAppStatus>;
    goForward(): Promise<AngelCareWhatsAppStatus>;
    focus(): Promise<AngelCareWhatsAppStatus>;
    openExternal(): Promise<AngelCareWhatsAppStatus>;
    navigate(input: { phone?: string; text?: string }): Promise<AngelCareWhatsAppStatus>;
    restart(): Promise<AngelCareWhatsAppStatus>;
    clearCache(): Promise<AngelCareWhatsAppStatus>;
    clearSession(): Promise<{ cancelled: boolean; state: AngelCareWhatsAppStatus }>;
    openDownloads(): Promise<{ ok: boolean; folder: string }>;
    setLayout(layout: AngelCareWhatsAppLayout): Promise<AngelCareWhatsAppStatus>;
    setBounds(bounds: { x: number; y: number; width: number; height: number }): Promise<AngelCareWhatsAppStatus>;
    onStatus(listener: (status: AngelCareWhatsAppStatus) => void): () => void;
  }


  interface AngelCareWhatsAppGovernanceStatus {
    readonly available: boolean;
    readonly contractVersion: string;
    readonly phase: string;
    readonly message: string;
    readonly detail: string | null;
    readonly installationId: string;
    readonly deviceId: string | null;
    readonly deviceName: string;
    readonly approvalStatus: string;
    readonly selectedWorkspaceId: string | null;
    readonly selectedWorkspaceName: string | null;
    readonly authorized: boolean;
    readonly authorizationReason: string;
    readonly leaseId: string | null;
    readonly leaseExpiresAt: string | null;
    readonly graceExpiresAt: string | null;
    readonly offlineGraceActive: boolean;
    readonly policy: Record<string, unknown> | null;
    readonly assignment: Record<string, unknown> | null;
    readonly workspace: Record<string, unknown> | null;
    readonly lastRegisteredAt: string | null;
    readonly lastHeartbeatAt: string | null;
    readonly lastAuthorizationAt: string | null;
    readonly lastCommandAt: string | null;
    readonly lastErrorAt: string | null;
    readonly pendingCommands: number;
    readonly online: boolean | null;
    readonly desktopVersion: string;
    readonly platform: string;
    readonly architecture: string;
    readonly operatingSystemVersion: string;
    readonly timestamp: string;
  }

  interface AngelCareWhatsAppGovernanceApi {
    getStatus(): Promise<AngelCareWhatsAppGovernanceStatus>;
    register(): Promise<AngelCareWhatsAppGovernanceStatus>;
    heartbeat(): Promise<AngelCareWhatsAppGovernanceStatus>;
    refresh(): Promise<AngelCareWhatsAppGovernanceStatus>;
    selectWorkspace(workspaceId: string, workspaceName?: string): Promise<AngelCareWhatsAppGovernanceStatus>;
    onStatus(listener: (status: AngelCareWhatsAppGovernanceStatus) => void): () => void;
  }

  interface AngelCareDesktopRuntime {
    readonly isDesktop: true;
    readonly productName: string;
    readonly version: string;
    readonly contractVersion: string;
    readonly releaseChannel: string;
    readonly platform: string;
    readonly capabilities: {
      readonly whatsappWebContentsView: boolean;
      readonly whatsappPersistentSession: boolean;
      readonly whatsappSessionControl: boolean;
      readonly whatsappGovernance: boolean;
      readonly whatsappDeviceRegistration: boolean;
      readonly whatsappAuthorizationLeases: boolean;
      readonly whatsappRemoteCommands: boolean;
      readonly whatsappAutomation: false;
      readonly whatsappDomAccess: false;
    };
    readonly whatsapp: AngelCareWhatsAppDesktopApi;
    readonly governance: AngelCareWhatsAppGovernanceApi;
  }

  interface Window {
    readonly angelcareDesktop?: AngelCareDesktopRuntime;
  }

  interface WindowEventMap {
    "angelcare:desktop-ready": CustomEvent<AngelCareDesktopRuntime>;
    "angelcare:desktop-runtime": CustomEvent<AngelCareDesktopRuntime | null>;
    "angelcare:whatsapp-status": CustomEvent<AngelCareWhatsAppStatus>;
    "angelcare:whatsapp-governance": CustomEvent<AngelCareWhatsAppGovernanceStatus>;
  }
}
