
'use client'
import { useState } from 'react'

export default function ProspectExecutionBar({onTask,onFollowup,onLog}:{onTask:(t:string)=>void,onFollowup:(t:string)=>void,onLog:(t:string)=>void}){
  const [input,setInput]=useState('')
  return (
    <div style={{display:'grid',gap:8}}>
      <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Quick action..." />
      <div style={{display:'flex',gap:6}}>
        <button onClick={()=>onTask(input)}>+ Task</button>
        <button onClick={()=>onFollowup(input)}>+ Follow-up</button>
        <button onClick={()=>onLog(input)}>Log</button>
      </div>
    </div>
  )
}
