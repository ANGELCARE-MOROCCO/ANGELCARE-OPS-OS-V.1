import AppShell from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Field, Kpi, Panel, RowLink, Select, TextArea, WorkspaceHero } from '../_components/BDV3Primitives'

export default async function MarketMappingPage() {
  const supabase = await createClient()
  const { data: segments } = await supabase.from('bd_market_segments').select('*').order('potential_score', { ascending: false })
  async function createSegment(formData: FormData) {
    'use server'
    const supabase = await createClient()
    await supabase.from('bd_market_segments').insert([{ name: String(formData.get('name')||''), city: String(formData.get('city')||''), category: String(formData.get('category')||''), potential_score: Number(formData.get('potential_score')||50), competition_level: String(formData.get('competition_level')||'medium'), action_plan: String(formData.get('action_plan')||''), status: String(formData.get('status')||'monitoring') }])
    redirect('/revenue-command-center/market-mapping')
  }
  const avg = segments?.length ? Math.round((segments||[]).reduce((s:number,x:any)=>s+Number(x.potential_score||0),0)/segments.length) : 0
  return <AppShell title="Market Mapping" subtitle="City, segment and domination plan for corporate business development." breadcrumbs={[{ label: 'Business Development', href: '/revenue-command-center/business-development' }, { label: 'Market Mapping' }]}>
    <div style={{ display:'grid', gap:20 }}><WorkspaceHero title="Market Domination Map" subtitle="Segment the market by city, category, opportunity score, competition level and action plan." />
    <section style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:14 }}><Kpi title="Segments" value={String(segments?.length||0)} /><Kpi title="Avg potential" value={String(avg)} tone="#16a34a" /><Kpi title="High potential" value={String((segments||[]).filter((s:any)=>Number(s.potential_score)>=75).length)} tone="#7c3aed" /><Kpi title="Active plans" value={String((segments||[]).filter((s:any)=>s.status==='active').length)} tone="#2563eb" /></section>
    <section style={{ display:'grid', gridTemplateColumns:'1fr 420px', gap:18 }}><Panel title="Market segments" subtitle="Where to dominate next."><div style={{ display:'grid', gap:10 }}>{(segments||[]).map((s:any)=><RowLink key={s.id} href="/revenue-command-center/market-mapping"><strong>{s.name}</strong><span>{s.city || 'No city'} • {s.category || 'No category'} • score {s.potential_score}</span></RowLink>)}</div></Panel><Panel title="Create segment" subtitle="Add a target market or city cluster."><form action={createSegment} style={{ display:'grid', gap:12 }}><Field name="name" label="Segment name" required /><Field name="city" label="City" /><Field name="category" label="Category" /><Field name="potential_score" label="Potential score" type="number" /><Select name="competition_level" label="Competition" options={[{value:'low',label:'Low'},{value:'medium',label:'Medium'},{value:'high',label:'High'}]} /><Select name="status" label="Status" options={[{value:'monitoring',label:'Monitoring'},{value:'active',label:'Active plan'},{value:'paused',label:'Paused'}]} /><TextArea name="action_plan" label="Action plan" /><button style={{ border:'none', borderRadius:14, background:'#0f172a', color:'#fff', padding:14, fontWeight:950 }}>Create segment</button></form></Panel></section></div>
  </AppShell>
}
