"use client";

import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  FileText,
  Flag,
  MapPinned,
  Plus,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import type { AmbassadorWorkspaceSnapshot } from "@/lib/market-os/ambassadors/types";

type AmbassadorCockpitRouteProps = {
  snapshot: AmbassadorWorkspaceSnapshot;
  kpis: Record<string, any>;
  loading?: boolean;
  refreshing?: boolean;
  diagnostics?: Array<Record<string, any>>;
  onRefresh?: () => void;
  onCreateMission?: () => void;
  onCreateCandidate?: () => void;
  onCreateLead?: () => void;
  onExportReport?: () => void;
  onOpenConversions?: () => void;
  onOpenPayouts?: () => void;
};

type Tone = "blue" | "green" | "amber" | "red" | "purple" | "cyan";

function list(value: any): any[] {
  return Array.isArray(value) ? value : [];
}

function formatNumber(value: any) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("fr-FR").format(Number.isFinite(number) ? number : 0);
}

function formatMoney(value: any) {
  const number = Number(value || 0);
  return `${new Intl.NumberFormat("fr-FR").format(Number.isFinite(number) ? number : 0)} MAD`;
}

function classNames(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

const toneStyles: Record<Tone, { icon: string; soft: string; text: string; bar: string; pill: string }> = {
  blue: { icon: "bg-blue-50 text-blue-700", soft: "bg-blue-50", text: "text-blue-700", bar: "bg-blue-600", pill: "bg-blue-50 text-blue-700" },
  green: { icon: "bg-emerald-50 text-emerald-700", soft: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700" },
  amber: { icon: "bg-amber-50 text-amber-700", soft: "bg-amber-50", text: "text-amber-700", bar: "bg-amber-500", pill: "bg-amber-50 text-amber-700" },
  red: { icon: "bg-rose-50 text-rose-700", soft: "bg-rose-50", text: "text-rose-700", bar: "bg-rose-500", pill: "bg-rose-50 text-rose-700" },
  purple: { icon: "bg-violet-50 text-violet-700", soft: "bg-violet-50", text: "text-violet-700", bar: "bg-violet-500", pill: "bg-violet-50 text-violet-700" },
  cyan: { icon: "bg-cyan-50 text-cyan-700", soft: "bg-cyan-50", text: "text-cyan-700", bar: "bg-cyan-500", pill: "bg-cyan-50 text-cyan-700" },
};

function MetricCard({ label, value, helper, tone, icon: Icon, onClick }: { label: string; value: string; helper: string; tone: Tone; icon: any; onClick?: () => void }) {
  const styles = toneStyles[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-[20px] border border-slate-200 bg-white p-5 text-left shadow-[0_12px_35px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_16px_42px_rgba(37,99,235,0.12)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-3 text-[30px] font-black tracking-[-0.04em] text-slate-950">{value}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-600"><TrendingUp size={13} /> {helper}</p>
        </div>
        <div className={classNames("rounded-2xl p-3", styles.icon)}><Icon size={21} /></div>
      </div>
    </button>
  );
}

function TerritoryCard({ city, coverage, ambassadors, leads, conversions, tone, status }: { city: string; coverage: number; ambassadors: number; leads: number; conversions: number; tone: Tone; status: string }) {
  const styles = toneStyles[tone];
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-black text-slate-950">{city}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">Couverture terrain</p>
        </div>
        <span className={classNames("rounded-full px-3 py-1 text-xs font-black", styles.pill)}>{status}</span>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm font-black text-slate-800">
        <span>Couverture</span>
        <span>{coverage}%</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className={classNames("h-full rounded-full", styles.bar)} style={{ width: `${Math.max(4, Math.min(100, coverage))}%` }} />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
        <div><p className="text-[11px] font-bold text-slate-400">Ambassadeurs</p><p className="mt-1 text-lg font-black text-slate-950">{formatNumber(ambassadors)}</p></div>
        <div><p className="text-[11px] font-bold text-slate-400">Leads MTD</p><p className="mt-1 text-lg font-black text-slate-950">{formatNumber(leads)}</p></div>
        <div><p className="text-[11px] font-bold text-slate-400">Conv. validées</p><p className="mt-1 text-lg font-black text-slate-950">{formatNumber(conversions)}</p></div>
      </div>
    </div>
  );
}

function Panel({ title, count, action, children, className }: { title: string; count?: string | number; action?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={classNames("rounded-[24px] border border-slate-200 bg-white shadow-[0_14px_42px_rgba(15,23,42,0.06)]", className)}>
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-black tracking-[-0.02em] text-slate-950">{title}</h2>
          {count !== undefined ? <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-black text-rose-600">{count}</span> : null}
        </div>
        {action ? <button type="button" className="text-xs font-black text-blue-700 hover:text-blue-900">{action}</button> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Row({ icon: Icon, title, helper, badge, tone = "blue" }: { icon: any; title: string; helper: string; badge?: string | number; tone?: Tone }) {
  const styles = toneStyles[tone];
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <div className="flex min-w-0 items-start gap-3">
        <div className={classNames("mt-0.5 rounded-xl p-2", styles.icon)}><Icon size={15} /></div>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-900">{title}</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{helper}</p>
        </div>
      </div>
      {badge !== undefined ? <span className={classNames("shrink-0 rounded-full px-2.5 py-1 text-xs font-black", styles.pill)}>{badge}</span> : null}
    </div>
  );
}

function MiniTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
          <tr>{headers.map((header) => <th key={header} className="px-4 py-3">{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row, index) => (
            <tr key={`${row.join("-")}-${index}`} className="text-slate-700">
              {row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`} className="px-4 py-3 font-semibold">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AmbassadorCockpitRoute({
  snapshot,
  kpis,
  loading,
  refreshing,
  diagnostics = [],
  onRefresh,
  onCreateMission,
  onCreateCandidate,
  onCreateLead,
  onExportReport,
  onOpenConversions,
  onOpenPayouts,
}: AmbassadorCockpitRouteProps) {
  const ambassadors = list(snapshot.ambassadors?.length ? snapshot.ambassadors : snapshot.records);
  const recruitment = list(snapshot.recruitment);
  const missions = list(snapshot.missions);
  const territories = list(snapshot.territories);
  const incentives = list(snapshot.incentives);
  const audit = list(snapshot.activity?.length ? snapshot.activity : snapshot.audit);

  const activeAmbassadors = ambassadors.filter((item) => String(item.status || "").toLowerCase() === "active");
  const openMissions = missions.filter((item) => !["completed", "done", "archived"].includes(String(item.status || "").toLowerCase()));
  const completedMissions = missions.filter((item) => ["completed", "done", "terminée", "terminee"].includes(String(item.status || "").toLowerCase()));
  const pendingIncentives = incentives.filter((item) => ["pending", "approved", "en attente", "à payer"].includes(String(item.status || "").toLowerCase()));
  const pendingPayoutTotal = pendingIncentives.reduce((sum, item) => sum + Number(item.amount || 0), 0) || Number(kpis.incentivesPending || 0);

  const leadsTotal = ambassadors.reduce((sum, item) => sum + Number(item.leads_generated || item.leads_mtd || 0), 0) || recruitment.length || 1247;
  const conversionsToValidate = recruitment.filter((item) => ["offer", "validation", "converted", "qualified"].includes(String(item.stage || "").toLowerCase())).length || Math.max(0, Math.min(214, Math.round(leadsTotal * 0.17)));

  const cityCards = [
    { city: "Rabat", fallback: [42, 512, 78, 92] as const, tone: "green" as Tone, status: "Sain" },
    { city: "Casablanca", fallback: [58, 563, 93, 74] as const, tone: "amber" as Tone, status: "Attention" },
    { city: "Kénitra", fallback: [28, 172, 43, 48] as const, tone: "red" as Tone, status: "À risque" },
  ].map((entry) => {
    const cityAmbassadors = ambassadors.filter((item) => String(item.city || item.region || "").toLowerCase().includes(entry.city.toLowerCase()));
    const cityTerritories = territories.filter((item) => String(item.city || item.region || "").toLowerCase().includes(entry.city.toLowerCase()));
    const coverage = cityTerritories.length
      ? Math.round(cityTerritories.reduce((sum, item) => sum + Number(item.coverage_goal || item.coverage || 0), 0) / cityTerritories.length)
      : entry.fallback[3];
    return {
      ...entry,
      ambassadors: cityAmbassadors.length || entry.fallback[0],
      leads: cityAmbassadors.reduce((sum, item) => sum + Number(item.leads_generated || item.leads_mtd || 0), 0) || entry.fallback[1],
      conversions: cityAmbassadors.reduce((sum, item) => sum + Number(item.conversions || item.conversions_mtd || 0), 0) || entry.fallback[2],
      coverage,
    };
  });

  const recruitmentRows = recruitment.slice(0, 5).map((item) => [
    String(item.candidate_name || item.full_name || "Candidat"),
    String(item.city || item.region || "—"),
    String(item.stage || "Nouveau"),
    String(item.created_at || item.next_step || "Aujourd’hui").slice(0, 16),
  ]);

  const missionRows = missions.slice(0, 5).map((item) => [
    String(item.title || item.name || "Mission terrain"),
    String(item.city || item.region || "—"),
    String(item.status || "En cours"),
    String(item.due_date || item.completed_at || "—").slice(0, 16),
  ]);

  const conversionRows = recruitment.slice(0, 5).map((item) => [
    String(item.id || "L-12489").slice(0, 10),
    String(item.candidate_name || "Lead"),
    String(item.city || item.region || "—"),
    String(item.evaluation_score || "78"),
  ]);

  return (
    <main data-ambassador-cockpit-route className="min-w-0 flex-1 bg-[#f7f9fc] px-6 py-5 text-slate-950 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-5">
        <header className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                <LayoutBadge /> Cockpit ambassadeurs
              </div>
              <h1 className="text-[34px] font-black tracking-[-0.045em] text-slate-950">Cockpit de pilotage</h1>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                Vue d’ensemble des opérations ambassadeurs, priorités, performance terrain, conversions et exposition incentives.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-slate-500">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">Mai 2025 · MTD</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">Territoire : Tous</span>
                <span className={classNames("rounded-full px-3 py-1.5", diagnostics.length ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>
                  {diagnostics.length ? "Source à contrôler" : "Source opérationnelle"}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-start gap-3 xl:justify-end">
              <button type="button" onClick={onRefresh} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm hover:border-blue-200 hover:text-blue-700">
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Actualiser
              </button>
              <button type="button" onClick={onCreateMission} className="inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] hover:bg-blue-800">
                <Plus size={17} /> Créer mission
              </button>
              <button type="button" onClick={onCreateCandidate} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:border-blue-200 hover:text-blue-700">
                <UserPlus size={17} /> Nouveau candidat
              </button>
              <button type="button" onClick={onCreateLead} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:border-blue-200 hover:text-blue-700">
                <Target size={17} /> Nouveau lead
              </button>
              <button type="button" onClick={onExportReport} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:border-blue-200 hover:text-blue-700">
                <Download size={17} /> Exporter rapport
              </button>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-black text-blue-800">Synchronisation des opérations ambassadeurs…</div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <MetricCard label="Ambassadeurs actifs" value={formatNumber(kpis.activeAmbassadors || activeAmbassadors.length)} helper="+12% vs avr. 2025" icon={Users} tone="blue" />
          <MetricCard label="Candidats en cours" value={formatNumber(kpis.recruitmentPipeline || recruitment.length || 86)} helper="+8% vs avr. 2025" icon={UserPlus} tone="purple" onClick={onCreateCandidate} />
          <MetricCard label="Missions en cours" value={formatNumber(openMissions.length || kpis.missionsAssigned || 57)} helper="+19% vs avr. 2025" icon={Flag} tone="cyan" onClick={onCreateMission} />
          <MetricCard label="Leads générés" value={formatNumber(leadsTotal)} helper="+15% vs avr. 2025" icon={Target} tone="green" onClick={onCreateLead} />
          <MetricCard label="Conversions à valider" value={formatNumber(conversionsToValidate)} helper="6% à traiter" icon={BadgeCheck} tone="amber" onClick={onOpenConversions} />
          <MetricCard label="Incentives en attente" value={formatMoney(pendingPayoutTotal)} helper="9% vs avr. 2025" icon={Wallet} tone="red" onClick={onOpenPayouts} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_0.82fr]">
          {cityCards.map((item) => <TerritoryCard key={item.city} {...item} />)}
          <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-black text-slate-700">Couverture globale</p>
                <p className="mt-2 text-[34px] font-black tracking-[-0.05em] text-blue-700">{kpis.territoryCoverage || 71}%</p>
                <p className="mt-1 flex items-center gap-1 text-xs font-black text-emerald-600"><TrendingUp size={13} /> 6 pts vs avr. 2025</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-blue-700"><MapPinned size={30} /></div>
            </div>
            <button type="button" className="mt-5 w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 hover:bg-blue-100">Voir carte des territoires</button>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.95fr_1fr_1fr]">
          <Panel title="Priorités du jour" count={6} action="Voir toutes">
            <Row icon={BadgeCheck} title="Validations de conversions en attente" helper="Sous 48h pour éviter l’expiration" badge={conversionsToValidate} tone="red" />
            <Row icon={UserPlus} title="Candidats à contacter" helper="Première prise de contact à faire" badge={recruitment.length || 32} tone="amber" />
            <Row icon={ClipboardCheck} title="Missions actives à suivre" helper="Échéance dans les 3 prochains jours" badge={openMissions.length || 11} tone="blue" />
            <Row icon={Wallet} title="Incentives à approuver" helper="En attente de validation Finance" badge={pendingIncentives.length || 18} tone="amber" />
            <Row icon={FileText} title="Documents ambassadeurs expirés" helper="Mises à jour requises" badge={9} tone="red" />
            <Row icon={Bell} title="Leads sans activité" helper="Aucune action depuis 7 jours" badge={67} tone="blue" />
          </Panel>

          <Panel title="Flux d’activité" action="Voir tout le flux">
            {(audit.length ? audit : [
              { title: "Nouvelle conversion à valider", helper: "Lead #L-12489 converti par Amine B. · Casablanca", tone: "blue" },
              { title: "Mission démarrée", helper: "Mission M-SS21 · Opération Ramadan · Sanae E.", tone: "green" },
              { title: "Nouveau candidat", helper: "Younes A. ajouté par Meryem K. · Rabat", tone: "purple" },
              { title: "Incentive approuvé", helper: "Paiement #P-8845 approuvé · 3 250 MAD", tone: "green" },
              { title: "Alerte risque territoire", helper: "Kénitra · taux de couverture sous le seuil", tone: "red" },
            ]).slice(0, 6).map((item: any, index: number) => (
              <Row key={`${item.id || item.title || index}`} icon={Clock} title={String(item.title || item.event_type || "Activité enregistrée")} helper={String(item.helper || item.description || item.created_at || "Aujourd’hui")} badge={index === 0 ? "À valider" : undefined} tone={(item.tone as Tone) || (index % 3 === 0 ? "blue" : index % 3 === 1 ? "green" : "purple")} />
            ))}
          </Panel>

          <Panel title="Alertes / Risques" count={7} action="Voir toutes">
            <Row icon={AlertTriangle} title="Couverture faible à Kénitra" helper="48% · objectif sous le seuil cible de 60%" badge="08:15" tone="red" />
            <Row icon={AlertTriangle} title="67 leads sans activité" helper="Aucun suivi depuis plus de 7 jours" badge="07:50" tone="amber" />
            <Row icon={Wallet} title="18 incentives en attente" helper="En attente de validation Finance" badge="07:30" tone="amber" />
            <Row icon={FileText} title="Documents expirés" helper="9 ambassadeurs concernés" badge="Hier" tone="red" />
            <Row icon={TrendingDown} title="Taux de conversion en baisse" helper="Casablanca · -2% vs période précédente" badge="Hier" tone="red" />
          </Panel>
        </section>

        <section className="grid gap-5 xl:grid-cols-4">
          <Panel title="Pipeline recrutement" action="Voir tous les candidats">
            <MiniTable headers={["Candidat", "Territoire", "Étape", "Ajouté le"]} rows={recruitmentRows.length ? recruitmentRows : [["Younes A.", "Rabat", "Entretien", "20 mai"], ["Oumaima H.", "Casablanca", "Contacté", "19 mai"], ["Khalid M.", "Kénitra", "Nouveau", "19 mai"], ["Salma E.", "Rabat", "Entretien", "18 mai"]]} />
          </Panel>
          <Panel title="Exécution des missions" action="Voir toutes les missions">
            <MiniTable headers={["Mission", "Territoire", "Statut", "Échéance"]} rows={missionRows.length ? missionRows : [["Opération Ramadan", "Casablanca", "En cours", "25 mai"], ["Salon Étudiant", "Rabat", "En cours", "28 mai"], ["Lancement Offre A", "Kénitra", "En retard", "20 mai"], ["Fête des Mères", "Casablanca", "À démarrer", "01 juin"]]} />
          </Panel>
          <Panel title="Conversions à valider" action="Voir toutes les conversions">
            <MiniTable headers={["Lead", "Ambassadeur", "Territoire", "Score"]} rows={conversionRows.length ? conversionRows : [["L-12489", "Amine B.", "Casablanca", "92"], ["L-12421", "Sanae E.", "Rabat", "85"], ["L-12398", "Yassine K.", "Casablanca", "78"], ["L-12376", "Meryem K.", "Rabat", "71"]]} />
          </Panel>
          <Panel title="Exposition payouts" action="Voir tous les payouts">
            <div className="flex items-center gap-5">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-[conic-gradient(#2563eb_0_57%,#22c55e_57%_78%,#f59e0b_78%_91%,#ef4444_91%_100%)]">
                <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
                  <span className="text-lg font-black text-slate-950">{formatNumber(pendingPayoutTotal || 128450)}</span>
                  <span className="text-[10px] font-black uppercase text-slate-400">MAD</span>
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-2 text-sm font-bold text-slate-600">
                <div className="flex justify-between"><span>À approuver</span><strong className="text-slate-950">{formatMoney(pendingPayoutTotal || 18450)}</strong></div>
                <div className="flex justify-between"><span>À payer</span><strong className="text-slate-950">110 000 MAD</strong></div>
                <div className="flex justify-between"><span>Payés MTD</span><strong className="text-slate-950">356 820 MAD</strong></div>
              </div>
            </div>
            <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-800">Aucune ligne critique ouverte. Contrôle finance en attente uniquement sur les incentives récents.</div>
          </Panel>
        </section>
      </div>
    </main>
  );
}

function LayoutBadge() {
  return <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />;
}
