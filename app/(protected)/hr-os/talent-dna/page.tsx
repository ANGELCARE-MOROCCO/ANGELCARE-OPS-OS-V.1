import { HrOsShell } from "@/components/hr-os/HrOsShell";
import { ActionButton, WorkCard, RiskBadge } from "@/components/hr-os/EliteCards";
import { talents } from "@/lib/hr-os/mockData";
const skillLabels:any = { newbornCare:"Newborn", postpartumSupport:"Postpartum", specialNeeds:"Special needs", schoolShadowing:"School", hygieneProtocol:"Hygiene", emergencyResponse:"Emergency", clientCommunication:"Client comms", emotionalRegulation:"Emotional" };
export default function TalentDnaPage(){return <HrOsShell title="Talent DNA Profiles" subtitle="Deep profile layer for every caregiver, trainer, supervisor, and candidate: skills, behavior, mission history, risk, certification, and next-best action.">
  <div className="grid gap-5">{talents.map(t => <WorkCard key={t.id} title={t.fullName} eyebrow={`${t.region} · ${t.city} · ${t.role}`} footer={<div className="flex flex-wrap gap-2"><ActionButton>Open 360 file</ActionButton><ActionButton>Assign review</ActionButton><ActionButton>Trigger retraining</ActionButton><ActionButton>Generate employee file</ActionButton></div>}>
    <div className="grid gap-4 lg:grid-cols-[.75fr_1.25fr_.7fr]">
      <div className="rounded-2xl bg-slate-950/70 p-4"><div className="flex justify-between"><p className="text-4xl font-semibold">{t.readinessScore}</p><RiskBadge risk={t.risk}/></div><p className="mt-2 text-sm text-slate-300">Readiness score</p><p className="mt-4 text-sm text-slate-200">Next action: {t.nextAction}</p></div>
      <div className="grid gap-2 sm:grid-cols-2">{Object.entries(t.skills).map(([k,v]) => <div key={k} className="rounded-xl border border-white/10 bg-slate-950/50 p-3"><div className="flex justify-between text-xs"><span>{skillLabels[k]}</span><b>{v as number}%</b></div><div className="mt-2 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-white/70" style={{width:`${v}%`}} /></div></div>)}</div>
      <div className="space-y-2 text-sm text-slate-300"><p><b className="text-white">Languages:</b> {t.languages.join(", ")}</p><p><b className="text-white">Eligibility:</b> {t.serviceEligibility.join(", ")}</p><p><b className="text-white">Certificates:</b> {t.certificates.join(", ")}</p><p><b className="text-white">Missions:</b> {t.missionCount}</p><p><b className="text-white">Rating:</b> {t.clientRating}/5</p></div>
    </div>
  </WorkCard>)}</div>
</HrOsShell>}
