import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createHrRecord } from '../_lib/actions'
import { HR_TABLES, getHRDashboardData } from '@/lib/hr-production/repository'
import { HRAction, HRCard, HRSection, HRStatusPill, HRTable } from '../_components/HRProductionUI'

export default async function Page() {
  const data = await getHRDashboardData()
  return <AppShell title="Recruitment Command" subtitle="Hiring pipeline, candidate stages, interviews and conversion." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Recruitment'}]} actions={<><PageAction href="/hr/recruitment/candidates" variant="light">Candidates</PageAction><PageAction href="/hr/openings" variant="light">Openings</PageAction></>}>
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4"><HRCard title="Open roles" value={data.openings.filter((x:any)=>String(x.status||'open')==='open').length} /><HRCard title="Candidates" value={data.candidates.length} /><HRCard title="Interviews" value={data.candidates.filter((x:any)=>x.interview_date).length} /><HRCard title="Hired" value={data.candidates.filter((x:any)=>String(x.decision||'')==='hired').length} /></div>
      <HRSection title="Create candidate" subtitle="Adds candidate into the real recruitment pipeline.">
        <form action={createHrRecord} className="grid gap-3 md:grid-cols-4">
          <input type="hidden" name="_table" value={HR_TABLES.candidates} /><input type="hidden" name="_redirect" value="/hr/recruitment" />
          <input name="full_name" required placeholder="Candidate full name" className="rounded-2xl border p-3" />
          <input name="phone" placeholder="Phone" className="rounded-2xl border p-3" />
          <input name="city" placeholder="City" className="rounded-2xl border p-3" />
          <input name="desired_position" placeholder="Desired position" className="rounded-2xl border p-3" />
          <select name="source" className="rounded-2xl border p-3"><option value="manual">Manual</option><option value="whatsapp">WhatsApp</option><option value="facebook">Facebook</option><option value="referral">Referral</option><option value="website">Website</option></select>
          <select name="pipeline_stage" className="rounded-2xl border p-3"><option value="new">New</option><option value="screening">Screening</option><option value="interview">Interview</option><option value="offer">Offer</option><option value="hired">Hired</option></select>
          <input name="score" type="number" placeholder="Score" className="rounded-2xl border p-3" />
          <button className="rounded-2xl bg-slate-950 p-3 font-black text-white">Create candidate</button>
        </form>
      </HRSection>
      <HRSection title="Candidate pipeline" subtitle="Clickable rows now open `/hr/recruitment/candidates/[id]`." action={<div className="flex gap-2"><HRAction href="/hr/recruitment/interviews">Interviews</HRAction><HRAction href="/hr/recruitment/sources">Sources</HRAction></div>}>
        <HRTable headers={['Candidate','Source','Stage','Score','Open']} rows={data.candidates.map((x:any)=>[
          <div className="font-black text-slate-950">{x.full_name}</div>,
          `${x.source || 'manual'} • ${x.city || 'Morocco'}`,
          <HRStatusPill value={x.pipeline_stage || x.stage || 'new'} />,
          String(x.score || 0),
          <Link className="font-black text-slate-950 underline" href={`/hr/recruitment/candidates/${x.id}`}>Open candidate</Link>
        ])} />
      </HRSection>
    </div>
  </AppShell>
}
