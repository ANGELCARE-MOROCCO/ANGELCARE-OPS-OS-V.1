import Link from "next/link"
import { Activity, BarChart3, CheckSquare, FileText, Mail, Server, ShieldCheck } from "lucide-react"

const links = [
  { href: "/email-os", label: "Workspace", text: "Main Email-OS execution workspace", icon: Mail },
  { href: "/email-os/server-control", label: "Server control", text: "Windows Menara bridge operations center", icon: Server },
  { href: "/email-os/admin", label: "Admin analytics", text: "Executive operational KPIs", icon: BarChart3 },
  { href: "/email-os/deployment-readiness", label: "Deployment readiness", text: "Exports, provider status, backups", icon: ShieldCheck },
  { href: "/email-os/production-checklist", label: "Production checklist", text: "Pre-deployment operational checklist", icon: CheckSquare },
  { href: "/api/email-os/diagnostics", label: "Diagnostics API", text: "Environment and DB diagnostics", icon: Activity },
  { href: "/api/email-os/backup-manifest", label: "Backup manifest", text: "Export and table manifest", icon: FileText }
]

export default function EmailOSNavigationHub() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-black text-slate-950">Email-OS Control Hub</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Clean production Email-OS navigation. No legacy V12/V13/V15 routes.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {links.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white hover:shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-4 text-base font-black text-slate-950">{item.label}</div>
              <p className="mt-2 text-sm leading-6 text-slate-500">{item.text}</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
