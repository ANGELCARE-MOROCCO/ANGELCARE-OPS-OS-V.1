"use client"

import { Clock3, Laptop2, RefreshCw, ShieldCheck, WifiOff } from "lucide-react"
import { useWhatsAppGovernance } from "@/components/whatsapp-os/useWhatsAppGovernance"

export default function WhatsAppGovernanceStatusPanel() {
  const governance = useWhatsAppGovernance()
  return (
    <section className="mb-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-[linear-gradient(135deg,#f8fbff,#ecfdf5)] px-5 py-4">
        <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white"><ShieldCheck className="h-5 w-5" /></div><div><p className="text-sm font-black text-slate-950">Gouvernance centralisée Mega ZIP 3</p><p className="mt-1 text-xs font-semibold text-slate-500">Appareil, affectation, bail d’autorisation et commandes distantes</p></div></div>
        <button onClick={() => void governance.refresh()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700"><RefreshCw className={`h-4 w-4 ${governance.busy === "refresh" ? "animate-spin" : ""}`} />Actualiser</button>
      </div>
      <div className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
        {[
          [Laptop2, "Appareil", governance.status?.deviceName || "Non enregistré"],
          [ShieldCheck, "Approbation", governance.status?.approvalStatus || "—"],
          [Clock3, "Bail", governance.status?.leaseExpiresAt ? new Date(governance.status.leaseExpiresAt).toLocaleString("fr-FR") : "Aucun"],
          [governance.status?.online === false ? WifiOff : ShieldCheck, "Connexion", governance.status?.online === false ? "Hors ligne" : "Synchronisée"],
          [ShieldCheck, "Commandes", String(governance.status?.pendingCommands || 0)],
        ].map(([Icon, label, value]) => <div key={String(label)} className="bg-white p-4"><Icon className="h-4 w-4 text-emerald-600" /><p className="mt-3 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">{String(label)}</p><p className="mt-1 truncate text-xs font-black text-slate-900">{String(value)}</p></div>)}
      </div>
    </section>
  )
}
