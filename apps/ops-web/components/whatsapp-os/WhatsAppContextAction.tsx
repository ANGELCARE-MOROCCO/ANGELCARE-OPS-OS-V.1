"use client"
import { MessageCircleMore } from "lucide-react"
import type { WhatsAppContextType } from "@/lib/whatsapp-desktop/context-types"
import { openWhatsAppBusinessContext } from "@/lib/whatsapp-desktop/context-client"
export default function WhatsAppContextAction({ contextType, entityId, purpose, sourceRoute, label = "Contacter sur WhatsApp", className = "" }: { contextType: WhatsAppContextType; entityId: string; purpose?: string; sourceRoute?: string; label?: string; className?: string }) { return <button type="button" onClick={() => openWhatsAppBusinessContext({ contextType, entityId, purpose, sourceRoute: sourceRoute || window.location.pathname + window.location.search })} className={`inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white shadow-sm transition hover:bg-emerald-700 ${className}`}><MessageCircleMore className="h-4 w-4" />{label}</button> }
