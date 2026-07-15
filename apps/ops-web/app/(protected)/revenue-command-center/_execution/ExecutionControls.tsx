
'use client'

export function SnoozeButtons({onSnooze}:{onSnooze:(h:number)=>void}){
  return (
    <div style={{display:'flex',gap:6}}>
      <button onClick={()=>onSnooze(2)}>+2h</button>
      <button onClick={()=>onSnooze(24)}>+1d</button>
      <button onClick={()=>onSnooze(72)}>+3d</button>
    </div>
  )
}

export function OutcomeSelector({onSelect}:{onSelect:(o:string)=>void}){
  const opts=['success','no_answer','rejected','converted']
  return (
    <select onChange={e=>onSelect(e.target.value)}>
      <option value="">Outcome</option>
      {opts.map(o=><option key={o}>{o}</option>)}
    </select>
  )
}

export function EscalateButton({onEscalate}:{onEscalate:()=>void}){
  return <button style={{background:'#dc2626',color:'#fff'}} onClick={onEscalate}>Escalate</button>
}
