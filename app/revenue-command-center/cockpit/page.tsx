'use client'

import { useEffect, useState } from 'react'

export default function CockpitPage() {

  const [data, setData] = useState({
    revenueToday: 0,
    pipeline: 0,
    conversion: 0,
    tasksDue: 0
  })

  useEffect(() => {
    setData({
      revenueToday: 18450,
      pipeline: 132000,
      conversion: 41,
      tasksDue: 23
    })
  }, [])

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        <Card title="Revenue Today" value={`$${data.revenueToday}`} color="#22c55e" />
        <Card title="Pipeline Value" value={`$${data.pipeline}`} color="#3b82f6" />
        <Card title="Conversion Rate" value={`${data.conversion}%`} color="#f59e0b" />
        <Card title="Tasks Due" value={data.tasksDue} color="#ef4444" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          <Panel title="Pipeline Intelligence">
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
              Pipeline Graph (connect later)
            </div>
          </Panel>

          <Panel title="Execution Pressure">
            {[...Array(6)].map((_, i) => (
              <Task key={i} text={`Urgent task ${i+1}`} />
            ))}
          </Panel>

          <Panel title="Deals At Risk">
            {[...Array(3)].map((_, i) => (
              <Risk key={i} text={`Deal ${i+1} needs action`} />
            ))}
          </Panel>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          <Panel title="Agent Performance">
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between' }}>
                <span>Agent {i+1}</span>
                <strong>{Math.floor(Math.random()*100)}%</strong>
              </div>
            ))}
          </Panel>

          <Panel title="Quick Actions">
            <button style={btn}>+ New Prospect</button>
            <button style={btn}>+ New Task</button>
            <button style={btn}>+ New Appointment</button>
          </Panel>

          <Panel title="Live Activity">
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ opacity: 0.7 }}>
                Activity event {i+1}
              </div>
            ))}
          </Panel>

        </div>

      </div>

    </div>
  )
}

function Card({title,value,color}) {
  return (
    <div style={{
      background:'#0f172a',
      color:'#fff',
      padding:20,
      borderRadius:16,
      border:`1px solid ${color}`,
      boxShadow:`0 0 20px ${color}33`
    }}>
      <div style={{opacity:.7}}>{title}</div>
      <div style={{fontSize:28,fontWeight:'bold'}}>{value}</div>
    </div>
  )
}

function Panel({title, children}) {
  return (
    <div style={{
      background:'#fff',
      padding:16,
      borderRadius:16,
      boxShadow:'0 10px 30px rgba(0,0,0,.05)'
    }}>
      <h3 style={{marginBottom:10}}>{title}</h3>
      {children}
    </div>
  )
}

function Task({text}) {
  return (
    <div style={{
      padding:10,
      border:'1px solid #eee',
      borderRadius:10,
      marginBottom:8
    }}>
      {text}
    </div>
  )
}

function Risk({text}) {
  return (
    <div style={{
      padding:10,
      border:'1px solid #ef4444',
      borderRadius:10,
      marginBottom:8,
      color:'#ef4444'
    }}>
      {text}
    </div>
  )
}

const btn = {
  padding:10,
  borderRadius:10,
  border:'none',
  background:'#0f172a',
  color:'#fff',
  cursor:'pointer'
}
