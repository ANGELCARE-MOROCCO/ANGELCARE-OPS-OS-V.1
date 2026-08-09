import { ArrowRight, Boxes, Layers3, PackageCheck, Sparkles, Store, TrendingUp } from 'lucide-react'
import { Action, Band, Empty, Hero, Metric, Seal, State, Surface } from '../CommercialUI'
import { commercialData } from '../load'

const ladder = [
  { name: 'Essential', promise: 'Couverture claire, routines et sécurité.', tone: 'from-slate-700 to-slate-500' },
  { name: 'Balanced', promise: 'Expérience enrichie et reporting structuré.', tone: 'from-blue-600 to-cyan-400' },
  { name: 'Premium', promise: 'Activités, options et accompagnement renforcés.', tone: 'from-violet-600 to-fuchsia-400' },
  { name: 'Signature', promise: 'Expérience AngelCare distinctive et complète.', tone: 'from-emerald-600 to-teal-400' },
]

export async function CommercialCommandWorkspace() {
  const d = await commercialData()
  return <div className="space-y-6">
    <Hero eyebrow="ANGELCARE · Package & Economics Studio" title="Transformez un plan technique en produit commercial désirable et maîtrisé." description="Composez les niveaux de service, options, coûts, prix, marge et promesse sans dissocier l’expérience client de sa faisabilité opérationnelle." actions={<><Action href="/carelink-ops/service-design/offers/new" tone="emerald">Créer une offre</Action><Action href="/carelink-ops/service-design/bundles/new" tone="slate">Composer un bundle</Action></>} signal={<Seal>Calcul déterministe · décision humaine</Seal>}/>
    <Band items={[{label:'Plans approuvés',value:String(d.metrics.approvedTechnicalPlans),status:d.metrics.approvedTechnicalPlans?'ok':'attention'},{label:'Route IA',value:'openrouter/free',status:d.provider.configured?'ok':'attention'},{label:'Marges bloquées',value:String(d.metrics.marginBlocked),status:d.metrics.marginBlocked?'blocked':'ok'},{label:'CARELINK',value:'Aucune écriture',status:'ok'}]}/>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Metric label="Plans approuvés" value={d.metrics.approvedTechnicalPlans} detail="Sources techniques autorisées."/><Metric label="Offres à décider" value={d.metrics.offersAwaitingApproval} detail="Décisions formelles en attente." tone="amber"/><Metric label="Références publiées" value={d.metrics.sellablesPublished} detail="Versions live dans les vitrines." tone="emerald"/><Metric label="Prix incomplets" value={d.metrics.pricingIncomplete} detail="Coûts ou règles manquants." tone="rose"/></section>

    <Surface title="Service Package Ladder" subtitle="Une architecture de gamme qui explique la valeur ajoutée à chaque niveau, sans inventer de prix.">
      <div className="grid gap-4 lg:grid-cols-4">{ladder.map((item,index)=><article key={item.name} className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,.05)]"><div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${item.tone}`}/><span className="text-[9px] font-black uppercase tracking-[.18em] text-slate-400">Niveau {index+1}</span><h3 className="mt-3 text-xl font-black tracking-[-.04em] text-slate-950">{item.name}</h3><p className="mt-2 min-h-12 text-xs font-semibold leading-5 text-slate-500">{item.promise}</p><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-[9px] font-black uppercase text-slate-400">Configurer</span><ArrowRight size={15} className="text-blue-600"/></div></article>)}</div>
    </Surface>

    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]">
      <Surface title="Commercial Production Runway" subtitle="Demandes, scénarios et décisions réelles issus du moteur commercial.">
        {d.requests.length?<div className="space-y-3">{d.requests.slice(0,8).map(x=><a key={x.id} href={`/carelink-ops/service-design/offers/requests/${x.id}`} className="group grid gap-4 rounded-[24px] border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/30 md:grid-cols-[1fr_auto]"><div><div className="flex flex-wrap items-center gap-2"><span className="text-[9px] font-black uppercase tracking-[.17em] text-blue-600">{x.code}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase text-slate-500">{x.universe.toUpperCase()}</span></div><h3 className="mt-2 text-base font-black text-slate-950">{x.title}</h3><p className="mt-1 text-xs font-semibold text-slate-500">{x.customerSegment} · {x.commercialObjective} · {x.scenarioCount} scénario(x)</p></div><div className="flex items-center gap-3"><State value={x.status}/><ArrowRight size={15} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600"/></div></a>)}</div>:<Empty title="Aucune demande commerciale" detail="Démarrez depuis une catégorie ou un plan approuvé. Le studio ne remplit jamais l’écran avec des offres fictives." action={<Action href="/carelink-ops/service-design/offers/new">Créer la première demande</Action>}/>} 
      </Surface>
      <div className="space-y-6">
        <Surface title="Economics Control" subtitle="Comprendre immédiatement ce qui forme la valeur.">
          <div className="space-y-3">
            <div className="rounded-[22px] bg-slate-950 p-5 text-white"><TrendingUp size={18} className="text-emerald-300"/><p className="mt-3 text-sm font-black">Prix et marge calculés par le serveur</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-300">OpenRouter ne fixe ni prix, ni coûts, ni réduction.</p></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2"><div className="rounded-[22px] border border-blue-200 bg-blue-50 p-4"><Store size={17} className="text-blue-700"/><p className="mt-3 text-2xl font-black text-blue-950">{d.metrics.b2cSellables}</p><p className="text-[9px] font-black uppercase text-blue-700">B2C publiés</p></div><div className="rounded-[22px] border border-violet-200 bg-violet-50 p-4"><Boxes size={17} className="text-violet-700"/><p className="mt-3 text-2xl font-black text-violet-950">{d.metrics.b2bSellables}</p><p className="text-[9px] font-black uppercase text-violet-700">B2B publiés</p></div></div>
            <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-4"><PackageCheck size={17} className="text-emerald-700"/><p className="mt-3 text-sm font-black text-emerald-950">Doctrine de publication</p><p className="mt-1 text-xs font-semibold leading-5 text-emerald-700">Le plan autorise le contenu; l’économie autorise la vente; CARELINK demeure l’autorité d’exécution.</p></div>
            {d.provider.lastFailure?<div className="rounded-[22px] border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800">Dernier échec fournisseur: {d.provider.lastFailure}</div>:null}
          </div>
        </Surface>
      </div>
    </section>
  </div>
}
