"use client"
import type { WhatsAppContextType } from "@/lib/whatsapp-desktop/context-types"
export interface WhatsAppContextLaunchInput { contextType: WhatsAppContextType; entityId: string; purpose?: string; sourceRoute?: string }
export function buildWhatsAppContextHref(input: WhatsAppContextLaunchInput) { const url = new URL("/whatsapp-os/web-session", window.location.origin); url.searchParams.set("contextType", input.contextType); url.searchParams.set("entityId", input.entityId); if (input.purpose) url.searchParams.set("purpose", input.purpose); if (input.sourceRoute) url.searchParams.set("sourceRoute", input.sourceRoute); return `${url.pathname}${url.search}` }
export function openWhatsAppBusinessContext(input: WhatsAppContextLaunchInput) { const href = buildWhatsAppContextHref(input); window.dispatchEvent(new CustomEvent("angelcare:open-whatsapp-context", { detail: { ...input, href } })); return href }
