'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Angelcare360PortalRecord } from '@/types/angelcare360/role-portals'

type AttendanceState = Record<string,{attendanceStatus:string;minutesLate:string;note:string}>
function text(value:unknown){return value==null?'':String(value)}
function meta(row:Angelcare360PortalRecord,key:string){return text(row.meta?.[key])}
function key(){return `teacher:attendance.batch:${crypto.randomUUID()}`}

export default function TeacherAttendanceRegister({classes,students}:{classes:Angelcare360PortalRecord[];students:Angelcare360PortalRecord[]}){
  const router=useRouter()
  const [teacherAssignmentId,setTeacherAssignmentId]=useState(()=>meta(classes[0]||{id:'',title:''},'teacherAssignmentId'))
  const [sessionDate,setSessionDate]=useState(()=>new Date().toISOString().slice(0,10))
  const [state,setState]=useState<AttendanceState>({})
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState<string|null>(null)
  const [message,setMessage]=useState<string|null>(null)
  const selected=classes.find((row)=>meta(row,'teacherAssignmentId')===teacherAssignmentId)||classes[0]
  const scopedStudents=useMemo(()=>{
    if(!selected)return []
    const classId=meta(selected,'classId'),sectionId=meta(selected,'sectionId')
    return students.filter((row)=>meta(row,'classId')===classId&&(!sectionId||meta(row,'sectionId')===sectionId))
  },[selected,students])
  function current(studentId:string){return state[studentId]||{attendanceStatus:'present',minutesLate:'',note:''}}
  function update(studentId:string,patch:Partial<AttendanceState[string]>){setState((previous)=>({...previous,[studentId]:{...current(studentId),...patch}}))}
  async function submit(event:React.FormEvent){event.preventDefault();setBusy(true);setError(null);setMessage(null);try{
    if(!teacherAssignmentId)throw new Error('Choisissez une affectation pédagogique.')
    if(!scopedStudents.length)throw new Error('Aucun élève actif n’est rattaché à cette classe / section.')
    const records=scopedStudents.map((student)=>({studentId:meta(student,'studentId')||student.id,...current(meta(student,'studentId')||student.id),minutesLate:Number(current(meta(student,'studentId')||student.id).minutesLate||0)}))
    const response=await fetch('/api/angelcare360/portal-actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'teacher',action:'attendance.batch',teacherAssignmentId,sessionDate,records,idempotencyKey:key()})})
    const payload=await response.json().catch(()=>({})) as {ok?:boolean;error?:string}
    if(!response.ok||!payload.ok)throw new Error(payload.error||'Le registre de présence n’a pas pu être enregistré.')
    setMessage(`${records.length} présence(s) enregistrée(s) dans une opération gouvernée.`);router.refresh()
  }catch(cause){setError(cause instanceof Error?cause.message:'Action impossible.')}finally{setBusy(false)}}
  if(!classes.length)return null
  return <section style={box}>
    <div style={eyebrow}>Registre de présence</div><h2 style={heading}>Prendre la présence de la classe</h2>
    <form onSubmit={submit} style={{display:'grid',gap:12}}>
      <div style={toolbar}>
        <select value={teacherAssignmentId} onChange={(event)=>setTeacherAssignmentId(event.target.value)} style={input} required>
          {classes.map((row)=><option key={row.id} value={meta(row,'teacherAssignmentId')||row.id}>{row.title} · {row.subtitle||'Affectation'}</option>)}
        </select>
        <input value={sessionDate} onChange={(event)=>setSessionDate(event.target.value)} type="date" style={input} required/>
        <div style={counter}>{scopedStudents.length} élève(s)</div>
      </div>
      <div style={grid}>
        {scopedStudents.map((student)=>{const studentId=meta(student,'studentId')||student.id;const value=current(studentId);return <div key={studentId} style={rowStyle}>
          <div><strong>{student.title}</strong><div style={sub}>{student.subtitle||'Élève'}</div></div>
          <select value={value.attendanceStatus} onChange={(event)=>update(studentId,{attendanceStatus:event.target.value})} style={input}>
            <option value="present">Présent</option><option value="absent">Absent</option><option value="late">En retard</option><option value="excused">Excusé</option>
          </select>
          {value.attendanceStatus==='late'?<input type="number" min="0" max="1440" value={value.minutesLate} onChange={(event)=>update(studentId,{minutesLate:event.target.value})} placeholder="Minutes" style={input}/>:<span/>}
          <input value={value.note} onChange={(event)=>update(studentId,{note:event.target.value})} placeholder="Note facultative" style={input}/>
        </div>})}
      </div>
      <button disabled={busy||!scopedStudents.length} type="submit" style={button}>{busy?'Enregistrement du registre…':'Enregistrer le registre'}</button>
    </form>
    {error?<div style={errorStyle}>{error}</div>:null}{message?<div style={successStyle}>{message}</div>:null}
  </section>
}

const box:React.CSSProperties={padding:18,border:'1px solid #dce6f2',borderRadius:22,background:'#fff',boxShadow:'0 12px 34px rgba(31,56,87,.06)',margin:'16px 0'}
const eyebrow:React.CSSProperties={fontSize:10,fontWeight:950,textTransform:'uppercase',letterSpacing:'.12em',color:'#2d64b0'}
const heading:React.CSSProperties={fontSize:19,margin:'6px 0 14px',color:'#153052'}
const toolbar:React.CSSProperties={display:'grid',gridTemplateColumns:'minmax(240px,2fr) minmax(150px,1fr) auto',gap:10,alignItems:'center'}
const grid:React.CSSProperties={display:'grid',gap:7,maxHeight:520,overflow:'auto',paddingRight:4}
const rowStyle:React.CSSProperties={display:'grid',gridTemplateColumns:'minmax(180px,1.8fr) minmax(130px,1fr) 90px minmax(160px,1.4fr)',gap:8,alignItems:'center',padding:'9px 10px',border:'1px solid #e6edf5',borderRadius:14,background:'#fbfdff'}
const sub:React.CSSProperties={fontSize:10,color:'#70849c',marginTop:2}
const input:React.CSSProperties={border:'1px solid #d8e2ee',borderRadius:11,padding:'9px 10px',background:'#fff',color:'#18314f',fontSize:12,minWidth:0}
const counter:React.CSSProperties={fontSize:11,fontWeight:850,color:'#50677f',whiteSpace:'nowrap'}
const button:React.CSSProperties={justifySelf:'start',border:0,borderRadius:12,padding:'11px 16px',background:'#1f5fb8',color:'#fff',fontWeight:900,cursor:'pointer'}
const errorStyle:React.CSSProperties={marginTop:9,color:'#a8323e',fontSize:11,fontWeight:850}
const successStyle:React.CSSProperties={marginTop:9,color:'#087151',fontSize:11,fontWeight:850}
