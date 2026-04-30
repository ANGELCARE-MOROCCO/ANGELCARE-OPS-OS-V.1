import Link from "next/link";
import { ReactNode } from "react";

const nav = [
  ["Command", "/hr-os"], ["Talent DNA", "/hr-os/talent-dna"], ["Recruitment", "/hr-os/recruitment"],
  ["Academy", "/hr-os/academy"], ["Readiness", "/hr-os/readiness"], ["Allocation", "/hr-os/allocation"],
  ["Performance", "/hr-os/performance"], ["Incidents", "/hr-os/incidents"], ["Compliance", "/hr-os/compliance"], ["Reports", "/hr-os/reports"]
];

export function HrOsShell({ title, subtitle, children, right }: { title:string; subtitle:string; children:ReactNode; right?:ReactNode }) {
  return <main className="min-h-screen bg-slate-950 text-white">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,.18),transparent_36%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,.12),transparent_34%)]" />
    <div className="relative mx-auto max-w-7xl px-6 py-6">
      <header className="mb-6 rounded-[2rem] border border-white/10 bg-white/[.06] p-5 shadow-2xl backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div><p className="text-xs uppercase tracking-[.35em] text-emerald-300">AngelCare Global People OS</p><h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">{title}</h1><p className="mt-2 max-w-3xl text-sm text-slate-300">{subtitle}</p></div>
          {right}<div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">Board-ready · Audit-ready · Mission-ready</div>
        </div>
        <nav className="mt-5 flex gap-2 overflow-x-auto pb-1">{nav.map(([label,href])=><Link key={href} href={href} className="whitespace-nowrap rounded-full border border-white/10 bg-slate-900/70 px-3 py-2 text-xs text-slate-200 hover:bg-white/10">{label}</Link>)}</nav>
      </header>
      {children}
    </div>
  </main>;
}
