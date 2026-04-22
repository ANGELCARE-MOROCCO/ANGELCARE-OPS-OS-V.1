'use client'

import { useMemo, useState } from 'react'

type Family = { id: number; family_name?: string | null; parent_name?: string | null; city?: string | null; zone?: string | null }
type Caregiver = { id: number; full_name?: string | null; city?: string | null; current_status?: string | null; status?: string | null; skill_tags?: string[] | null }
type PlannerRow = { missionCode: string; serviceCode: string; serviceType: string; missionDate: string; durationHours: number; startTime: string; endTime: string; caregiverId: string }

const SERVICES = [
  { label: "Garde et accompagnement d'enfants à domicile", code: "#H.S", badge: "Home Standard", icon: "🏠" },
  { label: "Garde et accompagnement d'enfant spécial à domicile", code: "#S.K", badge: "Special Kids", icon: "🧩" },
  { label: "Garde et accompagnement d'enfant spécial hybride", code: "#S.H", badge: "Special Hybrid", icon: "🔄" },
  { label: "Animation anniversaire", code: "#A.B", badge: "Birthday", icon: "🎂" },
  { label: "Garde et accompagnement bébé post accouchement", code: "#P.P", badge: "Post Partum", icon: "👶" },
  { label: "Excursion", code: "#E.X", badge: "Excursion", icon: "🚌" },
  { label: "Garde et accompagnement d'enfant spécial à l'école", code: "#S.S", badge: "School Special", icon: "🏫" },
  { label: "Animation et accompagnement ludique avancé à domicile", code: "#S.L", badge: "Smart Leisure", icon: "🎲" },
  { label: "Animation fêtes", code: "#K.P", badge: "Party", icon: "🎉" },
  { label: "AngelCare Academy", code: "#A.A", badge: "Academy", icon: "🎓" },
] as const
const DURATION_OPTIONS = [3, 5, 6, 8, 10, 12, 24]
const toMinutes = (t:string)=> !t||!t.includes(':') ? null : (Number(t.split(':')[0])*60 + Number(t.split(':')[1]))
const fromMinutes = (m:number)=> { const n=((m%(24*60))+24*60)%(24*60); return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}` }
const computeEndTime = (s:string,h:number)=> { const m=toMinutes(s); return m===null ? '' : fromMinutes(m+h*60) }
const serviceCardStyle = (selected:boolean): React.CSSProperties => ({ border:selected?'2px solid #0f172a':'1px solid #dbe3ee', background:selected?'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)':'#ffffff', borderRadius:18, padding:16, cursor:'pointer', boxShadow:selected?'0 12px 28px rgba(15, 23, 42, 0.10)':'0 8px 18px rgba(15, 23, 42, 0.04)' })

export default function ContractPlannerClient({ families, caregivers, contractTypeOptions, statusOptions, initialServiceType, initialFamilyId, initialPreferredCaregiverId, initialRows }: { families: Family[]; caregivers: Caregiver[]; contractTypeOptions: string[]; statusOptions: string[]; initialServiceType?: string; initialFamilyId?: string; initialPreferredCaregiverId?: string; initialRows?: PlannerRow[] }) {
  const [serviceType, setServiceType] = useState<string>(initialServiceType || SERVICES[0].label)
  const [familyId, setFamilyId] = useState<string>(initialFamilyId || '')
  const [preferredCaregiverId, setPreferredCaregiverId] = useState<string>(initialPreferredCaregiverId || '')
  const [daysCount, setDaysCount] = useState<number>(Math.max(1, initialRows?.length || 1))
  const [rows, setRows] = useState<PlannerRow[]>(initialRows || [])
  const selectedService = useMemo(() => SERVICES.find((item) => item.label === serviceType) || SERVICES[0], [serviceType])
  const familyRecord = useMemo(() => families.find((family) => String(family.id) === familyId), [families, familyId])
  const filteredCaregivers = useMemo(() => { const code = selectedService.code.replace('#',''); return caregivers.filter((c) => { const tags=Array.isArray(c.skill_tags)?c.skill_tags:[]; return tags.length===0 || tags.some((tag)=>String(tag).replace('#','').toUpperCase()===code.toUpperCase()) }) }, [caregivers, selectedService])
  function generateRows() { const safeDays=Math.max(1,Math.min(31,Number(daysCount||1))); const newRows:PlannerRow[]=[]; for(let i=0;i<safeDays;i++){ const existing=rows[i]; const number=String(i+1).padStart(2,'0'); newRows.push({ missionCode:`${selectedService.code}-${number}`, serviceCode:selectedService.code, serviceType:selectedService.label, missionDate:existing?.missionDate||'', durationHours:existing?.durationHours||3, startTime:existing?.startTime||'', endTime:existing?.endTime||'', caregiverId:existing?.caregiverId||'' }) } setRows(newRows) }
  function updateRow(index:number, patch:Partial<PlannerRow>) { setRows(prev=>prev.map((row,rowIndex)=>{ if(rowIndex!==index) return row; const next={...row,...patch}; if('startTime' in patch || 'durationHours' in patch) next.endTime=computeEndTime(next.startTime, Number(next.durationHours)); return next })) }
  function regenerateCodesForService(nextServiceLabel:string) { const service=SERVICES.find((item)=>item.label===nextServiceLabel)||SERVICES[0]; setRows(prev=>prev.map((row,index)=>({ ...row, missionCode:`${service.code}-${String(index+1).padStart(2,'0')}`, serviceCode:service.code, serviceType:service.label }))) }
  const totalHours = rows.reduce((sum,row)=>sum+Number(row.durationHours||0),0)
  return <>
    <section style={panelStyle}><div style={sectionHeaderStyle}><div><div style={sectionEyebrowStyle}>01 • Pilotage contrat</div><h2 style={panelTitleStyle}>Bloc contrat premium</h2></div><div style={headerWidgetStyle}><div style={headerWidgetLabelStyle}>Service sélectionné</div><div style={headerWidgetValueStyle}>{selectedService.code}</div></div></div>
      <div style={grid3Style}>
        <Field label="Référence contrat" name="contract_reference" placeholder="Ex: CTR-2026-001" />
        <SelectField label="Type contrat" name="contract_type" defaultValue="one_shot" options={contractTypeOptions} />
        <Field label="Libellé package" name="package_label" placeholder="Ex: Package 12 sessions" />
        <SelectField label="Famille liée au contrat" name="family_id" value={familyId} onChange={setFamilyId} options={families.map((f)=>({ value:String(f.id), label:`#${f.id} • ${f.family_name || f.parent_name || 'Famille sans nom'}${f.city ? ` • ${f.city}` : ''}` }))} />
        <input type="hidden" name="service_type" value={serviceType} />
        <Field label="Total sessions" name="total_sessions" type="number" defaultValue="1" />
        <Field label="Sessions utilisées" name="sessions_used" type="number" defaultValue="0" />
        <Field label="Date début" name="start_date" type="date" />
        <Field label="Date fin" name="end_date" type="date" />
        <SelectField label="Caregiver préférée du contrat" name="preferred_caregiver_id" value={preferredCaregiverId} onChange={setPreferredCaregiverId} options={filteredCaregivers.map((c)=>({ value:String(c.id), label:`#${c.id} • ${c.full_name || 'Caregiver'}${c.city ? ` • ${c.city}` : ''}` }))} />
        <Field label="Jours préférés" name="preferred_days" placeholder="Ex: Lundi, Mercredi, Vendredi" />
        <Field label="Heure préférée" name="preferred_time" placeholder="Ex: 09:00" />
        <SelectField label="Statut contrat" name="status" defaultValue="active" options={statusOptions} />
      </div>
      <div style={{ marginTop: 16 }}><TextAreaField label="Notes lieu / logistique" name="location_notes" placeholder="Adresse exacte, contraintes accès, étage, repères..." /></div>
      <div style={{ marginTop: 16 }}><TextAreaField label="Notes internes" name="notes" placeholder="Infos internes ops, remarques, engagements client..." /></div>
    </section>
    <section style={panelStyle}><div style={sectionHeaderStyle}><div><div style={sectionEyebrowStyle}>02 • Sélection service</div><h2 style={panelTitleStyle}>Catalogue de services contractuels</h2></div><div style={badgePillStyle}>{selectedService.icon} {selectedService.badge}</div></div>
      <div style={serviceGridStyle}>{SERVICES.map((service)=>{ const selected=service.label===serviceType; return <button key={service.code} type="button" onClick={()=>{ setServiceType(service.label); regenerateCodesForService(service.label) }} style={serviceCardStyle(selected)}><div style={serviceTopStyle}><span style={serviceIconStyle}>{service.icon}</span><span style={serviceCodeStyle(selected)}>{service.code}</span></div><div style={serviceLabelStyle}>{service.label}</div><div style={serviceBadgeStyle}>{service.badge}</div></button> })}</div>
    </section>
    <section style={panelStyle}><div style={sectionHeaderStyle}><div><div style={sectionEyebrowStyle}>03 • Générateur missions</div><h2 style={panelTitleStyle}>Planification multi-jours</h2></div><div style={headerStatsWrapStyle}><div style={smallStatCardStyle}><div style={smallStatLabelStyle}>Lignes</div><div style={smallStatValueStyle}>{rows.length}</div></div><div style={smallStatCardStyle}><div style={smallStatLabelStyle}>Heures totales</div><div style={smallStatValueStyle}>{totalHours}h</div></div></div></div>
      <div style={plannerControlsStyle}><label style={fieldWrapStyle}><span style={fieldLabelStyle}>Nombre de jours / lignes missions</span><input type="number" min={1} max={31} value={daysCount} onChange={(e)=>setDaysCount(Number(e.target.value || 1))} style={inputStyle} /></label><button type="button" onClick={generateRows} style={generateButtonStyle}>Générer / régénérer les lignes</button></div>
      {familyRecord ? <div style={infoBannerStyle}>Famille liée: <strong>{familyRecord.family_name || familyRecord.parent_name || `Famille #${familyRecord.id}`}</strong>{familyRecord.city ? ` • ${familyRecord.city}` : ''}</div> : <div style={warningBannerStyle}>Sélectionne d’abord une famille pour lier correctement les missions au contrat.</div>}
      <input type="hidden" name="row_count" value={rows.length} />
      {rows.length===0 ? <div style={emptyStyle}>Aucun jour généré. Choisis un nombre de jours puis clique sur “Générer / régénérer les lignes”.</div> : <div style={{ display:'grid', gap:14, marginTop:16 }}>{rows.map((row,index)=><div key={`${row.missionCode}-${index}`} style={rowCardStyle}><div style={rowHeaderStyle}><div style={rowHeaderLeftStyle}><div style={rowIndexStyle}>Jour {index+1}</div><div style={missionCodeTagStyle}>{row.missionCode}</div><div style={serviceMiniBadgeStyle}>{row.serviceCode}</div></div><div style={rowHeaderRightStyle}><div style={rowServiceTitleStyle}>{row.serviceType}</div><div style={rowHintStyle}>Code mission auto-généré • non éditable</div></div></div><input type="hidden" name={`row_mission_code_${index}`} value={row.missionCode} /><input type="hidden" name={`row_service_code_${index}`} value={row.serviceCode} /><input type="hidden" name={`row_service_type_${index}`} value={row.serviceType} /><div style={rowGridStyle}><Field label={`Date mission`} name={`row_date_${index}`} type="date" value={row.missionDate} onChange={(value)=>updateRow(index,{ missionDate:value })} /><SelectField label={`Durée`} name={`row_duration_${index}`} value={String(row.durationHours)} onChange={(value)=>updateRow(index,{ durationHours:Number(value) })} options={DURATION_OPTIONS.map((item)=>({ value:String(item), label:`${item} heures` }))} /><Field label={`Heure début`} name={`row_start_${index}`} type="time" value={row.startTime} onChange={(value)=>updateRow(index,{ startTime:value })} /><Field label={`Heure fin`} name={`row_end_${index}`} type="time" value={row.endTime} readOnly /><SelectField label={`Caregiver mission`} name={`row_caregiver_id_${index}`} value={row.caregiverId} onChange={(value)=>updateRow(index,{ caregiverId:value })} options={filteredCaregivers.map((c)=>({ value:String(c.id), label:`#${c.id} • ${c.full_name || 'Caregiver'}${c.city ? ` • ${c.city}` : ''}` }))} /><div style={summaryCardStyle}><div style={summaryLabelStyle}>Résumé ligne</div><div style={summaryValueStyle}>{row.durationHours} heures</div><div style={summaryMetaStyle}>{row.startTime ? `Début ${row.startTime}` : 'Début non défini'}{row.endTime ? ` • Fin ${row.endTime}` : ''}</div></div></div></div>)}</div>}
    </section>
  </>
}

function Field({ label, name, value, onChange, defaultValue = '', type = 'text', placeholder, readOnly = false }: { label: string; name: string; value?: string; onChange?: (value: string) => void; defaultValue?: string; type?: string; placeholder?: string; readOnly?: boolean }) { return <label style={fieldWrapStyle}><span style={fieldLabelStyle}>{label}</span><input name={name} type={type} value={value} defaultValue={value === undefined ? defaultValue : undefined} onChange={onChange ? (e)=>onChange(e.target.value) : undefined} placeholder={placeholder} readOnly={readOnly} style={readOnly ? readOnlyInputStyle : inputStyle} /></label> }
function SelectField({ label, name, value, onChange, defaultValue, options }: { label: string; name: string; value?: string; onChange?: (value: string) => void; defaultValue?: string; options: string[] | { value: string; label: string }[] }) { const normalizedOptions = typeof options[0] === 'string' ? (options as string[]).map((item)=>({ value:item, label:item })) : (options as { value:string; label:string }[]); return <label style={fieldWrapStyle}><span style={fieldLabelStyle}>{label}</span><select name={name} value={value} defaultValue={value === undefined ? defaultValue : undefined} onChange={onChange ? (e)=>onChange(e.target.value) : undefined} style={inputStyle}><option value="">Choisir</option>{normalizedOptions.map((option)=><option key={`${name}-${option.value}`} value={option.value}>{option.label}</option>)}</select></label> }
function TextAreaField({ label, name, placeholder }: { label: string; name: string; placeholder?: string }) { return <label style={fieldWrapStyle}><span style={fieldLabelStyle}>{label}</span><textarea name={name} placeholder={placeholder} style={textAreaStyle} /></label> }

const panelStyle: React.CSSProperties = { background:'rgba(255,255,255,0.96)', borderRadius:24, padding:24, border:'1px solid #dbe3ee', boxShadow:'0 16px 40px rgba(15, 23, 42, 0.06)' }
const sectionHeaderStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, flexWrap:'wrap', marginBottom:16 }
const sectionEyebrowStyle: React.CSSProperties = { color:'#64748b', fontSize:12, fontWeight:800, marginBottom:8, letterSpacing:0.5 }
const panelTitleStyle: React.CSSProperties = { margin:0, color:'#0f172a', fontSize:24, fontWeight:800 }
const headerWidgetStyle: React.CSSProperties = { minWidth:160, borderRadius:18, background:'linear-gradient(135deg, #0f172a 0%, #334155 100%)', padding:16, color:'white' }
const headerWidgetLabelStyle: React.CSSProperties = { fontSize:12, opacity:0.75, marginBottom:8, fontWeight:700 }
const headerWidgetValueStyle: React.CSSProperties = { fontSize:28, fontWeight:800 }
const badgePillStyle: React.CSSProperties = { display:'inline-flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:999, background:'#eef2ff', color:'#3730a3', fontWeight:800, border:'1px solid #c7d2fe' }
const grid3Style: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }
const serviceGridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', gap:14 }
const serviceTopStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }
const serviceIconStyle: React.CSSProperties = { fontSize:22 }
const serviceCodeStyle = (selected:boolean): React.CSSProperties => ({ display:'inline-flex', alignItems:'center', padding:'6px 10px', borderRadius:999, background:selected?'#0f172a':'#f1f5f9', color:selected?'white':'#0f172a', fontSize:12, fontWeight:800 })
const serviceLabelStyle: React.CSSProperties = { color:'#0f172a', fontSize:14, fontWeight:700, lineHeight:1.5, marginBottom:10, textAlign:'left' }
const serviceBadgeStyle: React.CSSProperties = { display:'inline-flex', alignItems:'center', padding:'5px 8px', borderRadius:999, background:'#f8fafc', border:'1px solid #e2e8f0', color:'#475569', fontSize:11, fontWeight:700 }
const plannerControlsStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr auto', gap:16, alignItems:'end' }
const generateButtonStyle: React.CSSProperties = { background:'#0f172a', color:'#fff', border:'none', borderRadius:14, padding:'14px 18px', fontWeight:800, cursor:'pointer', height:50 }
const infoBannerStyle: React.CSSProperties = { marginTop:16, borderRadius:14, padding:14, background:'#ecfeff', border:'1px solid #a5f3fc', color:'#155e75', fontWeight:700 }
const warningBannerStyle: React.CSSProperties = { marginTop:16, borderRadius:14, padding:14, background:'#fff7ed', border:'1px solid #fdba74', color:'#9a3412', fontWeight:700 }
const emptyStyle: React.CSSProperties = { marginTop:16, padding:18, borderRadius:14, border:'1px dashed #cbd5e1', background:'#ffffff', color:'#64748b' }
const rowCardStyle: React.CSSProperties = { borderRadius:22, border:'1px solid #dbe3ee', background:'#ffffff', padding:18, boxShadow:'0 12px 26px rgba(15, 23, 42, 0.05)' }
const rowHeaderStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, flexWrap:'wrap', marginBottom:16, paddingBottom:14, borderBottom:'1px solid #e2e8f0' }
const rowHeaderLeftStyle: React.CSSProperties = { display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }
const rowHeaderRightStyle: React.CSSProperties = { textAlign:'right' }
const rowIndexStyle: React.CSSProperties = { color:'#64748b', fontSize:13, fontWeight:700 }
const missionCodeTagStyle: React.CSSProperties = { display:'inline-flex', alignItems:'center', padding:'8px 12px', borderRadius:999, background:'#0f172a', color:'#fff', fontSize:13, fontWeight:800, letterSpacing:0.3 }
const serviceMiniBadgeStyle: React.CSSProperties = { display:'inline-flex', alignItems:'center', padding:'7px 10px', borderRadius:999, background:'#eef2ff', color:'#4338ca', fontSize:12, fontWeight:800, border:'1px solid #c7d2fe' }
const rowServiceTitleStyle: React.CSSProperties = { color:'#0f172a', fontSize:16, fontWeight:800 }
const rowHintStyle: React.CSSProperties = { color:'#64748b', fontSize:12, marginTop:4 }
const rowGridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1.2fr 1fr', gap:14 }
const summaryCardStyle: React.CSSProperties = { borderRadius:16, background:'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)', border:'1px solid #dbe3ee', padding:14 }
const summaryLabelStyle: React.CSSProperties = { color:'#64748b', fontSize:12, fontWeight:700, marginBottom:8 }
const summaryValueStyle: React.CSSProperties = { color:'#0f172a', fontSize:24, fontWeight:800, marginBottom:6 }
const summaryMetaStyle: React.CSSProperties = { color:'#475569', fontSize:13, lineHeight:1.5 }
const fieldWrapStyle: React.CSSProperties = { display:'grid', gap:8 }
const fieldLabelStyle: React.CSSProperties = { color:'#475569', fontSize:13, fontWeight:700 }
const inputStyle: React.CSSProperties = { width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid #cbd5e1', fontSize:14, boxSizing:'border-box', background:'white', color:'#0f172a' }
const readOnlyInputStyle: React.CSSProperties = { ...inputStyle, background:'#f8fafc', color:'#334155', fontWeight:700 }
const textAreaStyle: React.CSSProperties = { ...inputStyle, minHeight:110, resize:'vertical' }
const headerStatsWrapStyle: React.CSSProperties = { display:'flex', gap:10, flexWrap:'wrap' }
const smallStatCardStyle: React.CSSProperties = { borderRadius:16, padding:12, background:'#ffffff', border:'1px solid #dbe3ee', minWidth:110 }
const smallStatLabelStyle: React.CSSProperties = { color:'#64748b', fontSize:12, fontWeight:700, marginBottom:6 }
const smallStatValueStyle: React.CSSProperties = { color:'#0f172a', fontSize:24, fontWeight:800 }