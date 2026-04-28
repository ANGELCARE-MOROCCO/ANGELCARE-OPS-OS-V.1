import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'

type Caregiver = Record<string, any>
function text(v: any, f = '—') { return v === null || v === undefined || v === '' ? f : String(v) }
function statusTone(status?: string) { const s = (status || '').toLowerCase(); if (['available','active'].includes(s)) return ['#dcfce7','#166534','#86efac']; if (s.includes('mission') || s.includes('busy')) return ['#dbeafe','#1d4ed8','#93c5fd']; if (s.includes('risk') || s.includes('blocked')) return ['#fee2e2','#991b1b','#fca5a5']; return ['#e2e8f0','#334155','#cbd5e1'] }

export default async function CaregiversPage({ searchParams }: { searchParams?: Promise<{ q?: string; city?: string; status?: string; skill?: string }> }) {
  const sp = await searchParams
  const q = (sp?.q || '').trim()
  const city = (sp?.city || '').trim()
  const status = (sp?.status || '').trim()
  const skill = (sp?.skill || '').trim()
  const supabase = await createClient()

  let query = supabase.from('caregivers').select('*').eq('is_archived', false).order('id', { ascending: false })
  if (city) query = query.eq('city', city)
  if (status) query = query.eq('current_status', status)
  if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,city.ilike.%${q}%,zone.ilike.%${q}%,skills_summary.ilike.%${q}%`)

  const [{ data, error }, { data: allRaw }, { data: missionsRaw }] = await Promise.all([
    query,
    supabase.from('caregivers').select('*').eq('is_archived', false),
    supabase.from('missions').select('*').limit(500),
  ])
  let caregivers = (data || []) as Caregiver[]
  if (skill) caregivers = caregivers.filter((c) => Array.isArray(c.skill_tags) && c.skill_tags.includes(skill))
  const all = (allRaw || []) as Caregiver[]
  const missions = missionsRaw || []
  const cities = Array.from(new Set(all.map((c) => c.city).filter(Boolean))) as string[]
  const skills = Array.from(new Set(all.flatMap((c) => Array.isArray(c.skill_tags) ? c.skill_tags : []).filter(Boolean))) as string[]
  const active = all.filter((c) => ['active','available'].includes((c.current_status || c.status || '').toLowerCase())).length
  const busy = all.filter((c) => ['busy','on_mission','mission'].includes((c.current_status || '').toLowerCase())).length
  const certified = all.filter((c) => c.academy_certified).length
  const special = all.filter((c) => c.special_needs_capable).length
  const highReliability = all.filter((c) => Number(c.reliability_score || 0) >= 80).length

  return (
    <AppShell title="Caregivers Workforce" subtitle="Gestion premium des intervenantes : disponibilité, compétences, fiabilité, matching mission et risque terrain." breadcrumbs={[{ label: 'Caregivers' }]} actions={<><PageAction href="/caregivers/workforce" variant="light">Workforce Command</PageAction><PageAction href="/caregivers/new">+ Nouvelle intervenante</PageAction></>}>
      <div style={pageStyle}>
        <section style={heroStyle}><div><div style={eyebrowStyle}>Workforce Operating Layer</div><h1 style={heroTitleStyle}>Intervenantes, disponibilité & performance</h1><p style={heroTextStyle}>Vue opérationnelle pour staffer, remplacer, surveiller la qualité et préparer la croissance terrain.</p></div><div style={heroPanelStyle}><strong>{all.length}</strong><span>profils actifs</span></div></section>
        <section style={kpiGridStyle}><Kpi label="Total" value={all.length} sub="profils actifs" /><Kpi label="Disponibles" value={active} sub="prêtes mission" /><Kpi label="Occupées" value={busy} sub="en mission" /><Kpi label="Certifiées" value={certified} sub="Academy" /><Kpi label="Besoins spécifiques" value={special} sub="capables" /><Kpi label="Fiabilité 80+" value={highReliability} sub="top performers" /></section>
        <form style={filterStyle}><input name="q" defaultValue={q} placeholder="Recherche nom, téléphone, ville, zone, compétence..." style={inputStyle} /><select name="city" defaultValue={city} style={inputStyle}><option value="">Toutes villes</option>{cities.map((c) => <option key={c} value={c}>{c}</option>)}</select><select name="status" defaultValue={status} style={inputStyle}><option value="">Tous statuts</option><option value="available">available</option><option value="active">active</option><option value="busy">busy</option><option value="on_mission">on_mission</option><option value="inactive">inactive</option></select><select name="skill" defaultValue={skill} style={inputStyle}><option value="">Toutes compétences</option>{skills.map((s) => <option key={s} value={s}>{s}</option>)}</select><button style={buttonStyle}>Filtrer</button><Link href="/caregivers" style={lightButtonStyle}>Reset</Link></form>
        {error ? <div style={errorStyle}>Erreur : {error.message}</div> : null}
        <section style={gridStyle}>{caregivers.map((c) => { const [bg,fg,bd] = statusTone(c.current_status || c.status); const missionCount = missions.filter((m: any) => Number(m.caregiver_id) === Number(c.id)).length; return <article key={c.id} style={cardStyle}><div style={cardTopStyle}><div><div style={idStyle}>Caregiver #{c.id}</div><h2 style={cardTitleStyle}>{text(c.full_name, 'Intervenante sans nom')}</h2><p style={mutedStyle}>{text(c.city)} • {text(c.zone)} • {text(c.phone)}</p></div><span style={{...badgeStyle, background:bg, color:fg, borderColor:bd}}>{text(c.current_status || c.status, 'available')}</span></div><div style={miniGridStyle}><Info label="Fiabilité" value={`${Number(c.reliability_score || 0)}/100`} /><Info label="Missions" value={missionCount} /><Info label="Academy" value={c.academy_certified ? 'Oui' : 'Non'} /><Info label="Special needs" value={c.special_needs_capable ? 'Oui' : 'Non'} /></div><div style={tagWrapStyle}>{(Array.isArray(c.skill_tags) ? c.skill_tags : []).slice(0,6).map((t:string)=><span key={t} style={tagStyle}>{t}</span>)}{(!Array.isArray(c.skill_tags) || c.skill_tags.length===0) ? <span style={tagStyle}>skills à compléter</span> : null}</div><div style={sectionMiniStyle}><strong>Résumé</strong><p>{text(c.skills_summary || c.notes, 'Résumé profil non renseigné')}</p></div><div style={footerActionsStyle}><Link href={`/caregivers/${c.id}`} style={darkButtonStyle}>Ouvrir profil</Link><Link href={`/operations/replacements?caregiver_id=${c.id}`} style={lightButtonStyle}>Matching</Link></div></article> })}</section>
      </div>
    </AppShell>
  )
}
function Kpi({ label, value, sub }: { label: string; value: any; sub: string }) { return <div style={kpiStyle}><span>{label}</span><strong>{value}</strong><small>{sub}</small></div> }
function Info({ label, value }: { label: string; value: any }) { return <div style={infoStyle}><span>{label}</span><strong>{text(value)}</strong></div> }
const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, padding: 30, borderRadius: 32, color: '#fff', background: 'radial-gradient(circle at top left,#059669,#020617 65%)', boxShadow: '0 30px 80px rgba(2,6,23,.28)' }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#bbf7d0', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 38, fontWeight: 950, color: '#fff' }
const heroTextStyle: React.CSSProperties = { margin: '8px 0 0', color: 'rgba(255,255,255,.86)', fontWeight: 750, maxWidth: 760 }
const heroPanelStyle: React.CSSProperties = { minWidth: 230, padding: 22, borderRadius: 26, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', display: 'grid', gap: 6 }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }
const kpiStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, display: 'grid', gap: 6, color: '#0f172a', boxShadow: '0 18px 38px rgba(15,23,42,.05)' }
const filterStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 170px 170px 180px auto auto', gap: 12, padding: 16, borderRadius: 24, background: '#fff', border: '1px solid #dbe3ee', alignItems: 'center' }
const inputStyle: React.CSSProperties = { padding: '12px 13px', borderRadius: 13, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }
const buttonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '13px 16px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const lightButtonStyle: React.CSSProperties = { borderRadius: 14, padding: '12px 14px', background: '#f8fafc', color: '#0f172a', border: '1px solid #dbe3ee', fontWeight: 900, textDecoration: 'none', display: 'inline-flex', justifyContent: 'center' }
const darkButtonStyle: React.CSSProperties = { ...buttonStyle, textDecoration: 'none', display: 'inline-flex', justifyContent: 'center' }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 18 }
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)', display: 'grid', gap: 16 }
const cardTopStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start' }
const idStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 900, marginBottom: 6 }
const cardTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 24, fontWeight: 950 }
const mutedStyle: React.CSSProperties = { margin: '6px 0 0', color: '#64748b', fontWeight: 750 }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 11px', borderRadius: 999, border: '1px solid', fontSize: 12, fontWeight: 950 }
const miniGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10 }
const infoStyle: React.CSSProperties = { display: 'grid', gap: 5, padding: 12, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }
const tagWrapStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }
const tagStyle: React.CSSProperties = { padding: '7px 10px', borderRadius: 999, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontWeight: 850, fontSize: 12 }
const sectionMiniStyle: React.CSSProperties = { padding: 14, borderRadius: 18, background: 'linear-gradient(180deg,#f8fafc,#ecfdf5)', border: '1px solid #dbe3ee', color: '#334155' }
const footerActionsStyle: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' }
const errorStyle: React.CSSProperties = { padding: 16, borderRadius: 18, background: '#fee2e2', color: '#991b1b', fontWeight: 900 }
