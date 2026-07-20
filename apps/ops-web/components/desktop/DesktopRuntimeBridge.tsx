"use client"

import { useEffect } from "react"
import { getDesktopRuntime, getWhatsAppDesktopApi } from "@/lib/desktop-runtime"

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

    const api = getWhatsAppDesktopApi()
    if (!api) return

    let active = true
    void api.getStatus().then((status) => {
      if (active) window.dispatchEvent(new CustomEvent("angelcare:whatsapp-status", { detail: status }))
    }).catch(() => undefined)

    const unsubscribe = api.onStatus((status) => {
      window.dispatchEvent(new CustomEvent("angelcare:whatsapp-status", { detail: status }))
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return null
}
