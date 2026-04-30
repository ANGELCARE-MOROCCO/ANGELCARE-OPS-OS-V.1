import { HrOsShell } from "@/components/hr-os/HrOsShell";
import { ActionButton, MetricCard, WorkCard, RiskBadge } from "@/components/hr-os/EliteCards";
import { decisionBriefs, executiveKpis, talents } from "@/lib/hr-os/mockData";

export default function HrOsCommandCenter() {
  const critical = talents.filter(t => t.risk !== "low");
  return <HrOsShell title="Executive People Command Center" subtitle="A board-grade control tower connecting workforce readiness, academy velocity, compliance exposure, mission capacity, quality risk, and expansion decisions.">
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{executiveKpis.map(k => <MetricCard key={k.label} {...k} />)}</section>
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <WorkCard title="CEO Decision Briefs" eyebrow="Strategic signals">
        <div className="space-y-4">{decisionBriefs.map((b) => <div key={b.title} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3"><h3 className="font-semibold">{b.title}</h3><RiskBadge risk={b.deadline}/></div>
          <p className="mt-2 text-sm text-slate-300"><b className="text-sky-300">Signal:</b> {b.signal}</p>
          <p className="mt-2 text-sm text-slate-300"><b className="text-amber-300">Diagnosis:</b> {b.diagnosis}</p>
          <p className="mt-2 text-sm text-slate-100"><b className="text-emerald-300">Decision:</b> {b.decision}</p>
          <div className="mt-3 flex flex-wrap gap-2"><ActionButton>Assign to {b.owner}</ActionButton><ActionButton>Open action room</ActionButton><ActionButton>Export brief</ActionButton></div>
        </div>)}</div>
      </WorkCard>
      <WorkCard title="Global Risk Heatmap" eyebrow="Regions × standards">
        <div className="grid grid-cols-4 gap-2 text-xs">{["Morocco","France","UAE","Spain"].map(r => ["Readiness","Quality","Compliance","Capacity"].map(m => <div key={r+m} className="rounded-xl border border-white/10 bg-slate-950/70 p-3"><p className="text-slate-400">{r}</p><p className="font-medium">{m}</p><p className="mt-2 text-lg font-semibold">{Math.floor(72+Math.random()*24)}%</p></div>))}</div>
      </WorkCard>
    </section>
    <section className="mt-6 grid gap-6 lg:grid-cols-3">
      <WorkCard title="Today’s Control Actions" eyebrow="Operator cockpit"><ul className="space-y-3 text-sm text-slate-300"><li>Approve/reject mission blockers before assignment.</li><li>Force academy validation for high-risk profiles.</li><li>Launch recruitment sprint from staffing-gap signal.</li><li>Escalate compliance exposure to country manager.</li></ul></WorkCard>
      <WorkCard title="Profiles Requiring Intervention" eyebrow="People risk">{critical.map(t => <div key={t.id} className="mb-3 rounded-xl bg-slate-950/70 p-3 text-sm"><div className="flex justify-between"><b>{t.fullName}</b><RiskBadge risk={t.risk}/></div><p className="mt-1 text-slate-300">{t.nextAction}</p></div>)}</WorkCard>
      <WorkCard title="Operating Cadence" eyebrow="Management rhythm"><div className="space-y-3 text-sm text-slate-300"><p>Daily: readiness blockers + urgent replacements.</p><p>Weekly: academy conversion + region quality.</p><p>Monthly: board HR impact report.</p><p>Quarterly: global standard calibration.</p></div></WorkCard>
    </section>
  </HrOsShell>;
}
