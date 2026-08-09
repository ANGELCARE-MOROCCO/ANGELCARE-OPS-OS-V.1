"use client"

import { useEffect } from "react"
import { getDesktopRuntime, getWhatsAppDesktopApi, getWhatsAppGovernanceApi } from "@/lib/desktop-runtime"

export default function DesktopRuntimeBridge() {
  useEffect(() => {
    const runtime = getDesktopRuntime()
    const root = document.documentElement

    if (runtime) {
      root.dataset.angelcareDesktop = "true"
      root.dataset.angelcareDesktopPlatform = runtime.platform
      root.dataset.angelcareDesktopVersion = runtime.version
      root.dataset.angelcareWhatsappRuntime = runtime.capabilities?.whatsappWebContentsView ? "available" : "unavailable"
    } else {
      delete root.dataset.angelcareDesktop
      delete root.dataset.angelcareDesktopPlatform
      delete root.dataset.angelcareDesktopVersion
      delete root.dataset.angelcareWhatsappRuntime
    }

    window.dispatchEvent(new CustomEvent("angelcare:desktop-runtime", { detail: runtime }))

    const openContext = (event: Event) => {
      const detail = (event as CustomEvent<{ href?: string }>).detail
      if (!detail?.href || !detail.href.startsWith("/whatsapp-os/web-session")) return
      window.location.assign(detail.href)
    }
    window.addEventListener("angelcare:open-whatsapp-context", openContext)

    const api = getWhatsAppDesktopApi()
    if (!api) return

    let active = true
    void api.getStatus().then((status) => {
      if (active) window.dispatchEvent(new CustomEvent("angelcare:whatsapp-status", { detail: status }))
    }).catch(() => undefined)

    const unsubscribe = api.onStatus((status) => {
      window.dispatchEvent(new CustomEvent("angelcare:whatsapp-status", { detail: status }))
    })

    const governance = getWhatsAppGovernanceApi()
    let unsubscribeGovernance: (() => void) | undefined
    if (governance) {
      root.dataset.angelcareWhatsappGovernance = "available"
      void governance.getStatus().then((status) => {
        if (active) window.dispatchEvent(new CustomEvent("angelcare:whatsapp-governance", { detail: status }))
      }).catch(() => undefined)
      unsubscribeGovernance = governance.onStatus((status) => {
        window.dispatchEvent(new CustomEvent("angelcare:whatsapp-governance", { detail: status }))
      })
    } else {
      delete root.dataset.angelcareWhatsappGovernance
    }

    return () => {
      active = false
      unsubscribe()
      unsubscribeGovernance?.()
      window.removeEventListener("angelcare:open-whatsapp-context", openContext)
    }
  }, [])

  return null
}
