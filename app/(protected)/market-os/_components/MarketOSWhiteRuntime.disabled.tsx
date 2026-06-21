"use client"

import { useEffect } from "react"

function isDarkRgb(value: string) {
  const rgb = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (!rgb) return false

  const r = Number(rgb[1])
  const g = Number(rgb[2])
  const b = Number(rgb[3])

  return r < 45 && g < 55 && b < 75
}

function isDarkHex(value: string) {
  const normalized = value.trim().toLowerCase()
  return [
    "#000",
    "#000000",
    "#020617",
    "#030712",
    "#050816",
    "#06111f",
    "#07111f",
    "#0f172a",
    "#111827",
    "#18181b",
    "#1e293b",
  ].some((token) => normalized.includes(token))
}

function stabilizeMarketOS(root: HTMLElement) {
  root.style.background = "#ffffff"
  root.style.color = "#020617"
  root.style.colorScheme = "light"

  const elements = Array.from(
    root.querySelectorAll<HTMLElement>("main, section, article, aside, header, nav, div, form, table, ul, li")
  )

  for (const element of elements) {
    const style = element.getAttribute("style") || ""
    const computed = window.getComputedStyle(element)

    const hasInlineBackground =
      style.includes("background") ||
      style.includes("linear-gradient") ||
      style.includes("radial-gradient")

    const computedBg = computed.backgroundColor || ""
    const computedBackground = computed.background || ""

    const darkByComputed = isDarkRgb(computedBg) || isDarkRgb(computedBackground)
    const darkByInline =
      isDarkHex(style) ||
      style.includes("rgba(2,6,23") ||
      style.includes("rgba(2, 6, 23") ||
      style.includes("rgba(15,23,42") ||
      style.includes("rgba(15, 23, 42") ||
      style.includes("linear-gradient") ||
      style.includes("radial-gradient")

    if (hasInlineBackground && (darkByComputed || darkByInline)) {
      const isLargeHero =
        element.offsetHeight > 120 &&
        element.offsetWidth > 500

      element.style.background = isLargeHero
        ? "linear-gradient(135deg, #ffffff 0%, #f8fafc 54%, #eef6ff 100%)"
        : "#ffffff"

      element.style.backgroundColor = isLargeHero ? "transparent" : "#ffffff"
      element.style.borderColor = "#e2e8f0"
      element.style.color = "#020617"
      element.style.boxShadow = element.offsetHeight > 60
        ? "0 18px 46px rgba(15, 23, 42, 0.08)"
        : element.style.boxShadow
    }

    const className = element.className?.toString?.() || ""

    if (
      className.includes("bg-slate-9") ||
      className.includes("bg-gray-9") ||
      className.includes("bg-zinc-9") ||
      className.includes("bg-neutral-9") ||
      className.includes("bg-black") ||
      className.includes("bg-slate-800")
    ) {
      element.style.background = "#ffffff"
      element.style.backgroundColor = "#ffffff"
      element.style.borderColor = "#e2e8f0"
      element.style.color = "#020617"
    }

    if (
      className.includes("border-white") ||
      className.includes("border-slate-800") ||
      className.includes("border-slate-700")
    ) {
      element.style.borderColor = "#e2e8f0"
    }
  }

  const textElements = Array.from(
    root.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6, p, span, small, strong, b, label, td, th, a")
  )

  for (const element of textElements) {
    const computed = window.getComputedStyle(element)
    const color = computed.color || ""

    if (isDarkRgb(color)) {
      continue
    }

    const className = element.className?.toString?.() || ""
    const style = element.getAttribute("style") || ""

    if (
      className.includes("text-white") ||
      className.includes("text-slate-50") ||
      className.includes("text-slate-100") ||
      style.includes("#ffffff") ||
      style.includes("rgb(255, 255, 255)")
    ) {
      element.style.color = "#020617"
    }

    if (
      className.includes("text-slate-300") ||
      className.includes("text-slate-400") ||
      style.includes("#94a3b8") ||
      style.includes("#cbd5e1")
    ) {
      element.style.color = "#64748b"
    }
  }
}

export default function MarketOSWhiteRuntime() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-market-os-white-shell]")
    if (!root) return

    stabilizeMarketOS(root)

    const observer = new MutationObserver(() => {
      stabilizeMarketOS(root)
    })

    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    })

    return () => observer.disconnect()
  }, [])

  return null
}
