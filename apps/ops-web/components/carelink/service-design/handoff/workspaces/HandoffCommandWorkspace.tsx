import { ArrowRight, GitBranch, Network, ShieldCheck, Sparkles } from 'lucide-react'
import { Action, Empty, HandoffHero, Metric, SignalBand, State, StepRail, Surface } from '../HandoffUI'
import { handoffData } from '../load'

export async function HandoffCommandWorkspace() {
  const d = await handoffData()
  return <div className="space-y-6">
    <HandoffHero eyebrow="ANGELCARE · CARELINK Mission Bridge" title="Voyez exactement ce qui sera transmis avant d’engager l’exécution." description="Le bridge traduit un sellable approuvé en dossier parent, sous-missions datées, programme, checklists et rapports tout en conservant CARELINK comme autorité opérationnelle." seal="Préparer → Préflight → Décision humaine → Commit" actions={<><Action href="/carelink-ops/service-design/handoffs/new" tone="emerald">Préparer un handoff</Action><Action href="/carelink-ops/service-design/handoffs/reconciliation" tone="slate">Réconcilier</Action></>}/>
    <StepRail active={1}/>
    <SignalBand items={[{label:'Sellables éligibles',value:String(d.metrics.eligibleSellables),status:d.metrics.eligibleSellables?'ok':'attention'},{label:'Bloqués',value:String(d.metrics.blockedHandoffs),status:d.metrics.blockedHandoffs?'blocked':'ok'},{label:'CARELINK',value:d.carelink.available?'Connecté':'Indisponible',status:d.carelink.available?'ok':'blocked'},{label:'Autorité IA',value:'Advisory only',status:'ok'}]}/>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Metric label="Préparations" value={d.metrics.draftHandoffs} detail="Dossiers avant engagement CARELINK."/><Metric label="À approuver" value={d.metrics.awaitingApproval} detail="Préflight réussi, décision humaine requise." tone="amber"/><Metric label="Engagés" value={d.metrics.committed} detail="Parents et sous-missions créés." tone="emerald"/><Metric label="Échecs explicites" value={d.metrics.failed} detail="Aucun succès synthétique ni masqué." tone="rose"/></section>

    <Surface title="Mission Translation Architecture" subtitle="Le passage du produit de service vers la réalité opérationnelle reste visible et réversible avant commit.">
      <div className="grid gap-3 lg:grid-cols-5">{[
        {title:'Produit',detail:'Sellable et version',icon:Sparkles,tone:'bg-violet-100 text-violet-700'},
        {title:'Client',detail:'Configuration confirmée',icon:ShieldCheck,tone:'bg-blue-100 text-blue-700'},
        {title:'Mission parent',detail:'Dossier CARELINK',icon:Network,tone:'bg-cyan-100 text-cyan-700'},
        {title:'Sous-missions',detail:'Dates et horaires',icon:GitBranch,tone:'bg-amber-100 text-amber-700'},
        {title:'Exécution',detail:'Dispatch & terrain',icon:ArrowRight,tone:'bg-emerald-100 text-emerald-700'},
      ].map((step,index)=>{const Icon=step.icon;return <div key={step.title} className="relative rounded-[24px] border border-slate-200 bg-white p-4"><div className={`grid h-10 w-10 place-items-center rounded-[16px] ${step.tone}`}><Icon size={17}/></div><p className="mt-3 text-sm font-black text-slate-950">{step.title}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{step.detail}</p>{index<4?<ArrowRight size={15} className="absolute -right-2.5 top-1/2 z-10 hidden text-blue-500 lg:block"/>:null}</div>})}</div>
    </Surface>

    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]">
      <Surface title="Transmission Runway" subtitle="Chaque ligne conserve versions, dates, source commerciale et vérité CARELINK.">
        {d.requests.length?<div className="space-y-3">{d.requests.slice(0,10).map(x=><a key={x.id} href={`/carelink-ops/service-design/handoffs/${x.id}`} className="group grid gap-3 rounded-[24px] border border-slate-200 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/25 md:grid-cols-[1fr_auto_auto_auto]"><div><p className="text-[9px] font-black uppercase tracking-[.17em] text-blue-600">{x.code} · {x.universe.toUpperCase()}</p><p className="mt-1 font-black text-slate-950">{x.customerRef||'Client à confirmer'}</p><p className="mt-1 text-xs font-semibold text-slate-500">{x.missionCount} mission(s) · {Math.round(x.totalMinutes/60*10)/10} h · parent #{x.carelinkParentMissionId||'—'}</p></div><State value={x.preflightStatus}/><State value={x.status}/><ArrowRight size={16} className="self-center text-slate-300 transition group-hover:translate-x-1 group-hover:text-cyan-600"/></a>)}</div>:<Empty title="Aucun handoff en préparation" detail="Commencez depuis une référence publiée. Aucun dossier CARELINK n’est fabriqué pour remplir l’écran." action={<Action href="/carelink-ops/service-design/handoffs/new">Créer le premier handoff</Action>}/>} 
      </Surface>
      <Surface title="Authority Boundary" subtitle="Une séparation nette protège le produit et l’exécution.">
        <div className="space-y-3 text-xs font-semibold leading-5 text-slate-600"><div className="rounded-[22px] border border-blue-200 bg-blue-50 p-4"><b className="text-blue-950">Service Design OS</b><br/>Prépare, photographie, valide et transmet.</div><div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-4"><b className="text-emerald-950">CARELINK-OPS</b><br/>Assigne, dispatch, exécute, contrôle et paie.</div><div className="rounded-[22px] bg-slate-950 p-4 text-slate-300"><b className="text-white">OpenRouter Free</b><br/>Clarifie le brief; ne crée aucune mission et n’approuve rien.</div></div>
      </Surface>
    </section>
  </div>
}
