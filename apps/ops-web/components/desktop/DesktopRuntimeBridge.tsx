"use client"

import { useEffect } from "react"
import LegacyDesktopRuntimeBridge from "./DesktopRuntimeBridgePreMegaZip6"

function dispatch(name: string, detail: unknown) {
  window.dispatchEvent(new CustomEvent(name, { detail }))
}

function CorporateStationRuntimeBridge() {
  useEffect(() => {
    const desktop = window.angelcareDesktop

    if (!desktop) {
      return
    }

    const unsubscribe: Array<() => void> = []

    void desktop.station
      .getStatus()
      .then((value) => {
        dispatch("angelcare:station-status", value)
      })
      .catch(() => null)

    void desktop.corporateTabs
      .getStatus()
      .then((value) => {
        dispatch("angelcare:corporate-tabs", value)
      })
      .catch(() => null)

    unsubscribe.push(
      desktop.station.onStatus((value) => {
        dispatch("angelcare:station-status", value)
      }),
    )

    unsubscribe.push(
      desktop.corporateTabs.onStatus((value) => {
        dispatch("angelcare:corporate-tabs", value)
      }),
    )

    return () => {
      unsubscribe.forEach((removeListener) => {
        removeListener()
      })
    }
  }, [])

  return null
}

export default function DesktopRuntimeBridge() {
  return (
    <>
      <LegacyDesktopRuntimeBridge />
      <CorporateStationRuntimeBridge />
    </>
  )
}
