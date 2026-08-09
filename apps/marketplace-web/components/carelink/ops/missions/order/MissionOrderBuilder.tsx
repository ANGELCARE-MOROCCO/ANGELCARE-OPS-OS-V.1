'use client'

import { useState } from 'react'

type Row = Record<string, string | number | boolean | null | undefined>

type Props = {
  missionId: number
  initialOrder: {
    parameters?: Row | null
    transport?: Row | null
    allowances?: Row | null
    routes?: Row[]
    parameterDays?: Row[]
    programLines?: Row[]
  }
}

const sections = ['Identity', 'Missionnaire', 'Client', 'Parameters', 'Routes', 'Session Days', 'Transport', 'Allowances', 'Program', 'Review']

export function MissionOrderBuilder({ missionId, initialOrder }: Props) {
  const [active, setActive] = useState('Identity')
  const [routes, setRoutes] = useState<Row[]>(initialOrder.routes || [])
  const [days, setDays] = useState<Row[]>(initialOrder.parameterDays || [])
  const [program, setProgram] = useState<Row[]>(initialOrder.programLines || [])
  const [transport, setTransport] = useState<Row>(initialOrder.transport || {})
  const [allowances, setAllowances] = useState<Row>(initialOrder.allowances || {})
  const [parameters, setParameters] = useState<Row>(initialOrder.parameters || {})
  const [status, setStatus] = useState('Ready')

  async function save() {
    setStatus('Saving…')
    const res = await fetch(`/api/missions/${missionId}/mission-order`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ routes, parameterDays: days, programLines: program, transport, allowances, parameters }),
    })
    const json = await res.json()
    setStatus(res.ok && json.ok ? 'Saved' : json.error || 'Save failed')
  }

  function exportPdf(kind = 'export-pdf') {
    window.open(`/api/missions/${missionId}/mission-order/${kind}`, '_blank', 'noopener,noreferrer')
  }

  return <div className="grid min-h-[720px] grid-cols-[240px_1fr_320px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
    <aside className="border-r border-slate-200 bg-slate-50 p-4"><div className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-blue-600">Mission Order</div>{sections.map((section) => <button key={section} onClick={() => setActive(section)} className={`mb-2 block w-full rounded-2xl px-4 py-3 text-left text-sm font-black ${active === section ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>{section}</button>)}</aside>
    <main className="overflow-auto p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-2xl font-black">Official Mission Order Builder</h2><p className="text-sm text-slate-500">Editable operational document using existing mission order tables.</p></div><button onClick={save} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">Save Order</button></div>{active === 'Routes' && <EditableRows title="Mission Circuit / Routes" rows={routes} setRows={setRoutes} template={{ operation_label: '', mission_date: '', outbound_departure: '', outbound_arrival: '', return_departure: '', return_arrival: '', notes: '' }} />}{active === 'Session Days' && <EditableRows title="Session Days / Sub-Mission Schedule" rows={days} setRows={setDays} template={{ session_date: '', session_time: '', module_theme: '', sub_mission_id: '', notes: '' }} />}{active === 'Program' && <EditableRows title="Program Lines" rows={program} setRows={setProgram} template={{ session_label: '', session_datetime_label: '', theme_module: '', ct_label: '', m1: '', m2: '', m3: '', short_break: '', meal_break: '', code_atelier: '', notes: '' }} />}{active === 'Transport' && <KeyValueEditor title="Transport" value={transport} setValue={setTransport} keys={['transport_by','train','airplane','taxi','private_driver','bus','taxi_info','train_info','ticket_to_order','ticket_to_reimburse','notes']} />}{active === 'Allowances' && <KeyValueEditor title="Allowances / Indemnités" value={allowances} setValue={setAllowances} keys={['direct_collection','monthly_collection','hourly_fee','per_mission','grade_fee','meal_allowance','lodging_reimbursed','lodging_not_reimbursed','manual_notes']} />}{active === 'Parameters' && <KeyValueEditor title="Service Parameters" value={parameters} setValue={setParameters} keys={['forfait','hourly_option','type_service','children_range','participant_profile','client_type','client_profile','dossier_number','designation','client_name','client_address','client_city','mission_reason']} />}{!['Routes','Session Days','Program','Transport','Allowances','Parameters'].includes(active) && <div className="rounded-3xl border border-dashed border-slate-200 p-12 text-center text-sm font-bold text-slate-400">{active} section is connected to the live mission dossier and becomes complete when its fields exist in the mission record.</div>}</main>
    <aside className="border-l border-slate-200 bg-slate-50 p-5"><h3 className="text-lg font-black">Review & Export</h3><div className="mt-4 space-y-3 text-sm"><Review label="Routes" value={routes.length} /><Review label="Session Days" value={days.length} /><Review label="Program Lines" value={program.length} /><Review label="Save Status" value={status} /></div><div className="mt-6 grid gap-2"><button onClick={() => exportPdf('export-pdf')} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Export Ordre de Mission PDF</button><button onClick={() => exportPdf('export-field-brief')} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black">Export Field Brief</button><button onClick={() => exportPdf('export-program')} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black">Export Program PDF</button></div></aside>
  </div>
}

function EditableRows({ title, rows, setRows, template }: { title: string; rows: Row[]; setRows: (rows: Row[]) => void; template: Row }) { const keys = Object.keys(template); return <section><div className="mb-4 flex justify-between"><h3 className="text-xl font-black">{title}</h3><button onClick={() => setRows([...rows, { ...template, sort_order: rows.length }])} className="rounded-2xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">+ Add Row</button></div><div className="space-y-4">{rows.map((row, index) => <div key={index} className="rounded-3xl border border-slate-200 p-4"><div className="mb-3 flex justify-between"><b>Row {index + 1}</b><div className="flex gap-2"><button onClick={() => setRows([...rows.slice(0,index+1), { ...row }, ...rows.slice(index+1)])} className="text-xs font-black text-blue-600">Duplicate</button><button onClick={() => setRows(rows.filter((_, i) => i !== index))} className="text-xs font-black text-rose-600">Delete</button></div></div><div className="grid gap-3 md:grid-cols-2">{keys.map((key) => <label key={key} className="text-xs font-black uppercase text-slate-400">{key.replace(/_/g,' ')}<input value={String(row[key] || '')} onChange={(e) => setRows(rows.map((r,i) => i === index ? { ...r, [key]: e.target.value } : r))} className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900" /></label>)}</div></div>)}{!rows.length && <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center text-sm font-bold text-slate-400">No rows yet. Add the first row manually.</div>}</div></section> }
function KeyValueEditor({ title, value, setValue, keys }: { title: string; value: Row; setValue: (value: Row) => void; keys: string[] }) { return <section><h3 className="mb-4 text-xl font-black">{title}</h3><div className="grid gap-3 md:grid-cols-2">{keys.map((key) => <label key={key} className="text-xs font-black uppercase text-slate-400">{key.replace(/_/g,' ')}<input value={String(value[key] || '')} onChange={(e) => setValue({ ...value, [key]: e.target.value })} className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900" /></label>)}</div></section> }
function Review({ label, value }: { label: string; value: string | number }) { return <div className="flex justify-between rounded-2xl bg-white p-3"><span className="text-slate-500">{label}</span><b>{value}</b></div> }
