"use client"

import { useEffect, type ReactNode } from "react"

const CSS = `
[data-partnerships-white-guard],
[data-partnerships-white-guard] *,
[data-partnerships-white-guard] *::before,
[data-partnerships-white-guard] *::after {
  color: #ffffff !important;
  caret-color: #ffffff !important;
  text-decoration-color: #ffffff !important;
}
[data-partnerships-white-guard] [class*="text-black"],
[data-partnerships-white-guard] [class*="text-slate-"],
[data-partnerships-white-guard] [class*="text-gray-"],
[data-partnerships-white-guard] [class*="text-zinc-"],
[data-partnerships-white-guard] [class*="text-neutral-"],
[data-partnerships-white-guard] [class*="text-stone-"],
[data-partnerships-white-guard] [class*="text-white/"],
[data-partnerships-white-guard] button,
[data-partnerships-white-guard] button *,
[data-partnerships-white-guard] a,
[data-partnerships-white-guard] a *,
[data-partnerships-white-guard] label,
[data-partnerships-white-guard] label *,
[data-partnerships-white-guard] input,
[data-partnerships-white-guard] textarea,
[data-partnerships-white-guard] select,
[data-partnerships-white-guard] option {
  color: #ffffff !important;
}
[data-partnerships-white-guard] input,
[data-partnerships-white-guard] textarea,
[data-partnerships-white-guard] select {
  background-color: rgba(7, 13, 28, 0.98) !important;
  border-color: rgba(255, 255, 255, 0.22) !important;
}
[data-partnerships-white-guard] input::placeholder,
[data-partnerships-white-guard] textarea::placeholder {
  color: #ffffff !important;
  opacity: 1 !important;
}
[data-partnerships-white-guard] button:disabled,
[data-partnerships-white-guard] [disabled],
[data-partnerships-white-guard] [aria-disabled="true"] {
  color: #ffffff !important;
  opacity: 1 !important;
  filter: none !important;
}
[data-partnerships-white-guard] svg text,
[data-partnerships-white-guard] svg tspan {
  fill: #ffffff !important;
  color: #ffffff !important;
  opacity: 1 !important;
}
body [role="dialog"],
body [role="dialog"] *,
body .fixed.inset-0,
body .fixed.inset-0 * {
  color: #ffffff !important;
}
`

export default function PartnershipsWhiteTextGuard({ children }: { children: ReactNode }) {
  useEffect(() => {
    const id = "angelcare-partnerships-white-text-guard"
    document.getElementById(id)?.remove()
    const style = document.createElement("style")
    style.id = id
    style.textContent = CSS
    document.head.appendChild(style)
    return () => document.getElementById(id)?.remove()
  }, [])
  return <div data-partnerships-white-guard="true" className="min-h-screen w-full bg-[#070d1c] text-white">{children}</div>
}
