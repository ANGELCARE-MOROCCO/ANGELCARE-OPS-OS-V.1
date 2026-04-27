import { PhoneCall, Users, Target, Activity, ShieldCheck, Headphones, ClipboardList } from 'lucide-react';

async function getDashboard() {
  try {
    const r = await fetch("http://localhost:3000/api/voice/dashboard", {
      cache: "no-store",
    })

    return await r.json()
  } catch {
    return {
      metrics: { callsToday: 0, missed: 0, openTasks: 0 },
      agents: [],
      recentCalls: [],
    }
  }
}

export default async function Page(){
  const data = await getDashboard();
  return <main className="shell">
    <section className="hero">
      <div>
        <div className="pill"><ShieldCheck size={16}/> AngelCare Ops OS Module</div>
        <h1>Voice Center V2</h1>
        <p>Centre d’appels léger, connecté Telnyx, pensé pour qualifier les familles, relancer les leads, tracer les conversations et piloter les agents avec discipline opérationnelle.</p>
      </div>
      <div className="heroCard">
        <Headphones size={34}/>
        <b>Mode Day One</b>
        <span>Asterisk + Telnyx + API + Dashboard</span>
      </div>
    </section>

    <section className="grid metrics">
      <Card icon={<PhoneCall/>} label="Appels aujourd’hui" value={data.metrics.callsToday}/>
      <Card icon={<Target/>} label="Appels manqués" value={data.metrics.missed}/>
      <Card icon={<ClipboardList/>} label="Relances ouvertes" value={data.metrics.openTasks}/>
      <Card icon={<Activity/>} label="Niveau système" value="V2 Ready"/>
    </section>

    <section className="twoCols">
      <div className="panel">
        <h2>Agents & Extensions</h2>
        <div className="list">{data.agents.map((a:any)=><div className="row" key={a.extension}><b>{a.extension}</b><span>{a.full_name}</span><em>{a.status}</em></div>)}</div>
      </div>
      <div className="panel">
        <h2>Recent Calls</h2>
        <div className="list">{data.recentCalls.length ? data.recentCalls.map((c:any)=><div className="row" key={c.id}><b>{c.direction}</b><span>{c.from_number || '—'} → {c.to_number || '—'}</span><em>{c.status}</em></div>) : <p className="empty">Aucun appel enregistré pour le moment.</p>}</div>
      </div>
    </section>

    <section className="panel roadmap">
      <h2>Workflow opérationnel AngelCare</h2>
      <div className="flow"><Step n="1" t="Lead entrant"/><Step n="2" t="Qualification"/><Step n="3" t="Appel / Script"/><Step n="4" t="Note + Relance"/><Step n="5" t="Conversion Ops OS"/></div>
    </section>
  </main>
}
function Card({icon,label,value}:any){ return <div className="card">{icon}<span>{label}</span><b>{value}</b></div> }
function Step({n,t}:any){ return <div className="step"><b>{n}</b><span>{t}</span></div> }