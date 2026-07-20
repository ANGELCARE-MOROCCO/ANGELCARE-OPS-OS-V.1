export type DesktopRuntimeInfo = {
  isDesktop: true
  productName: string
  version: string
  contractVersion: string
  releaseChannel: string
  platform: string
  capabilities?: {
    whatsappWebContentsView: boolean
    whatsappPersistentSession: boolean
    whatsappSessionControl: boolean
    whatsappAutomation: false
    whatsappDomAccess: false
  }
}

function runtimeFromUserAgent(): DesktopRuntimeInfo | null {
  if (typeof navigator === "undefined") return null
  const match = navigator.userAgent.match(/AngelCareDesktop\/([^\s]+)/i)
  if (!match) return null

  return {
    isDesktop: true,
    productName: "ANGELCARE Desktop",
    version: match[1] || "unknown",
    contractVersion: "2.0.0",
    releaseChannel: "stable",
    platform: navigator.platform || "unknown",
    capabilities: {
      whatsappWebContentsView: false,
      whatsappPersistentSession: false,
      whatsappSessionControl: false,
      whatsappAutomation: false,
      whatsappDomAccess: false,
    },
  }
}

export function getDesktopRuntime(): DesktopRuntimeInfo | null {
  if (typeof window === "undefined") return null
  const exposed = window.angelcareDesktop
  if (exposed?.isDesktop) {
    return {
      isDesktop: true,
      productName: exposed.productName,
      version: exposed.version,
      contractVersion: exposed.contractVersion,
      releaseChannel: exposed.releaseChannel,
      platform: exposed.platform,
      capabilities: exposed.capabilities,
    }
  }
  return runtimeFromUserAgent()
}

export function getWhatsAppDesktopApi(): AngelCareWhatsAppDesktopApi | null {
  if (typeof window === "undefined") return null
  return window.angelcareDesktop?.whatsapp || null
}

export function isAngelCareDesktop(): boolean {
  return Boolean(getDesktopRuntime())
}

export function hasEmbeddedWhatsAppRuntime(): boolean {
  return Boolean(getDesktopRuntime()?.capabilities?.whatsappWebContentsView && getWhatsAppDesktopApi())
}
