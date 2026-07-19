"use client";

import {
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  Filter,
  Mail,
  MapPinned,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  Upload,
  UserPlus,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import type { AmbassadorWorkspaceSnapshot } from "@/lib/market-os/ambassadors/types";

type AnyRecord = Record<string, any>;

type DirectoryProps = {
  snapshot: AmbassadorWorkspaceSnapshot;
  kpis: Record<string, number>;
  loading: boolean;
  refreshing: boolean;
  error?: string | null;
  success?: string | null;
  diagnostics?: AnyRecord[];
  query: string;
  statusFilter: string;
  regionFilter: string;
  territoryFilter: string;
  sortKey: string;
  regions: string[];
  territories: AnyRecord[];
  filteredAmbassadors: AnyRecord[];
  onQueryChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onRegionFilterChange: (value: string) => void;
  onTerritoryFilterChange: (value: string) => void;
  onSortKeyChange: (value: string) => void;
  onRefresh: () => void;
  onAddAmbassador: () => void;
  onAssignTerritory: (ambassador?: AnyRecord | null) => void;
  onCreateMission: (ambassador?: AnyRecord | null) => void;
  onExport: () => void;
  onOpenProfile: (ambassador: AnyRecord) => void;
  onEditAmbassador: (ambassador: AnyRecord) => void;
  onArchiveAmbassador: (ambassador: AnyRecord) => void;
};

const statusOptions = ["all", "active", "onboarding", "inactive", "suspended", "at_risk"];
const levelOptions = ["Tous", "Platine", "Or", "Argent", "Bronze"];

function cn(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

function numberValue(value: unknown, fallback = 0) {
  const numeric = Number(value ?? fallback);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function formatNumber(value: unknown) {
  return new Intl.NumberFormat("fr-MA").format(numberValue(value));
}

function formatMoney(value: unknown, currency = "MAD") {
  const amount = numberValue(value);
  return `${new Intl.NumberFormat("fr-MA").format(amount)} ${currency || "MAD"}`;
}

function initials(name?: string | null) {
  return String(name || "A")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function normalizePhone(phone?: string | null) {
  return String(phone || "").replace(/[^0-9+]/g, "");
}

function dateLabel(value?: string | null) {
  if (!value) return "Non renseigné";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function ambassadorLevel(item: AnyRecord) {
  const score = numberValue(item.performance_score ?? item.quality_score ?? item.score_quality ?? 0);
  const existing = item.level || item.tier || item.rank;
  if (existing) return String(existing);
  if (score >= 90) return "Platine";
  if (score >= 80) return "Or";
  if (score >= 60) return "Argent";
  return "Bronze";
}

function scoreTone(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 55) return "bg-amber-500";
  return "bg-rose-500";
}

function statusTone(status?: string | null) {
  const value = String(status || "").toLowerCase();
  if (["active", "approved", "validated", "paid"].includes(value)) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (["onboarding", "pending", "tracking", "assigned"].includes(value)) return "border-violet-200 bg-violet-50 text-violet-700";
  if (["inactive", "at_risk", "suspended", "blocked"].includes(value)) return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function StatusBadge({ status }: { status?: string | null }) {
  const label = String(status || "actif").replaceAll("_", " ");
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black capitalize", statusTone(status))}>{label}</span>;
}

function ActionButton({
  children,
  icon: Icon,
  variant = "secondary",
  onClick,
  disabled,
  title,
}: {
  children: ReactNode;
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-blue-700 text-white shadow-lg shadow-blue-100 hover:bg-blue-800",
        variant === "secondary" && "border border-slate-200 bg-white text-slate-950 hover:border-blue-300 hover:bg-blue-50",
        variant === "ghost" && "text-slate-950 hover:bg-slate-100",
        variant === "danger" && "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
      )}
    >
      {Icon ? <Icon size={17} /> : null}
      {children}
    </button>
  );
}

function MetricCard({ label, value, helper, icon: Icon, tone }: { label: string; value: string; helper: string; icon: LucideIcon; tone: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-600">{label}</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
          <p className="mt-2 text-xs font-bold text-emerald-600">{helper}</p>
        </div>
        <div className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl", tone)}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      >
        {children}
      </select>
    </label>
  );
}

function IconLink({ href, icon: Icon, title, disabled }: { href: string; icon: LucideIcon; title: string; disabled?: boolean }) {
  if (disabled) {
    return (
      <span title={`${title} indisponible`} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
        <Icon size={16} />
      </span>
    );
  }
  return (
    <a href={href} title={title} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-950 transition hover:border-blue-300 hover:bg-blue-50">
      <Icon size={16} />
    </a>
  );
}

function SectionCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-black text-slate-950">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function AmbassadorDirectoryRoute({
  snapshot,
  kpis,
  loading,
  refreshing,
  error,
  success,
  diagnostics = [],
  query,
  statusFilter,
  regionFilter,
  territoryFilter,
  sortKey,
  regions,
  territories,
  filteredAmbassadors,
  onQueryChange,
  onStatusFilterChange,
  onRegionFilterChange,
  onTerritoryFilterChange,
  onSortKeyChange,
  onRefresh,
  onAddAmbassador,
  onAssignTerritory,
  onCreateMission,
  onExport,
  onOpenProfile,
  onEditAmbassador,
  onArchiveAmbassador,
}: DirectoryProps) {
  const [directoryMissionModalOpen, setDirectoryMissionModalOpen] = useState(false);
  const [directoryMissionAmbassador, setDirectoryMissionAmbassador] = useState<AnyRecord | null>(null);
  void onCreateMission;
  const [activationModalOpen, setActivationModalOpen] = useState(false);
  const [territoryModalOpen, setTerritoryModalOpen] = useState(false);
  const [territoryModalAmbassador, setTerritoryModalAmbassador] = useState<AnyRecord | null>(null);
  void onAddAmbassador;
  void onAssignTerritory;

  const activeAmbassadors = (snapshot.ambassadors || []).filter((item: AnyRecord) => item.status !== "archived");
  const selected = filteredAmbassadors[0] || activeAmbassadors[0] || null;
  function openDirectoryMissionStudio(ambassador?: AnyRecord | null) {
    setDirectoryMissionAmbassador(ambassador || selected || null);
    setDirectoryMissionModalOpen(true);
  }
  function openTerritoryAssignmentModal(ambassador?: AnyRecord | null) {
    setTerritoryModalAmbassador(ambassador || selected || null);
    setTerritoryModalOpen(true);
  }
  const topPerformers = [...activeAmbassadors]
    .sort((a: AnyRecord, b: AnyRecord) => numberValue(b.performance_score) - numberValue(a.performance_score))
    .slice(0, 5);
  const risky = activeAmbassadors
    .filter((item: AnyRecord) => numberValue(item.performance_score ?? item.quality_score) < 65 || ["inactive", "at_risk", "suspended"].includes(String(item.status || "")))
    .slice(0, 4);
  const pendingValidations = [
    ["Justificatifs d'identité", activeAmbassadors.filter((item: AnyRecord) => !item.identity_verified_at && !item.kyc_verified_at).length],
    ["Contrats", activeAmbassadors.filter((item: AnyRecord) => !item.contract_signed_at && !item.contract_status).length],
    ["RIB", activeAmbassadors.filter((item: AnyRecord) => !item.rib_verified_at && !item.bank_account_verified_at).length],
    ["Formations", (snapshot.training || []).filter((item: AnyRecord) => ["pending", "assigned"].includes(String(item.status || ""))).length],
  ];
  const coaching = risky.slice(0, 3);

  const metrics = [
    { label: "Ambassadeurs actifs", value: formatNumber(kpis.activeAmbassadors ?? activeAmbassadors.filter((item: AnyRecord) => item.status === "active").length), helper: "↗ 12% vs période", icon: Users, tone: "bg-emerald-50 text-emerald-700" },
    { label: "En onboarding", value: formatNumber(kpis.onboardingAmbassadors ?? activeAmbassadors.filter((item: AnyRecord) => String(item.lifecycle_stage || item.status) === "onboarding").length), helper: "↗ 10% vs période", icon: UserPlus, tone: "bg-violet-50 text-violet-700" },
    { label: "Inactifs à relancer", value: formatNumber(risky.length), helper: "↘ action requise", icon: AlertTriangle, tone: "bg-rose-50 text-rose-700" },
    { label: "Top performers", value: formatNumber(topPerformers.length), helper: "↗ réseau moteur", icon: Star, tone: "bg-amber-50 text-amber-700" },
    { label: "Territoires couverts", value: `${formatNumber(kpis.territoryCoverage ?? 0)}%`, helper: "↗ couverture locale", icon: MapPinned, tone: "bg-cyan-50 text-cyan-700" },
    { label: "Documents à renouveler", value: formatNumber(pendingValidations.reduce((sum, item) => sum + Number(item[1] || 0), 0)), helper: "contrôle conformité", icon: ShieldCheck, tone: "bg-orange-50 text-orange-700" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-6 text-slate-950 lg:px-8">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            <Users size={16} />
            Ambassador
          </div>
          <h1 className="mt-3 text-[34px] font-black tracking-tight text-slate-950">Ambassadeurs</h1>
          <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
            Gérez votre réseau d'ambassadeurs, suivez leurs performances et développez votre impact terrain avec une vue opérationnelle claire.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton variant="primary" icon={Plus} onClick={() => setActivationModalOpen(true)}>Ajouter ambassadeur</ActionButton>
          <ActionButton icon={Upload} disabled title="Import CSV à connecter au workflow d'import sécurisé">Importer</ActionButton>
          <ActionButton icon={MapPinned} onClick={() => openTerritoryAssignmentModal(selected)}>Affecter territoire</ActionButton>
          <ActionButton icon={Plus} onClick={() => openDirectoryMissionStudio(selected)}>Créer mission</ActionButton>
          <ActionButton icon={Download} onClick={onExport}>Exporter</ActionButton>
          <ActionButton icon={refreshing ? RefreshCw : RefreshCw} onClick={onRefresh} disabled={refreshing}>{refreshing ? "Synchronisation" : "Rafraîchir"}</ActionButton>
        </div>
      </header>

      {error ? <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div> : null}
      {success ? <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{success}</div> : null}
      {diagnostics.length ? <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">Diagnostic: {String(diagnostics[0]?.reason || diagnostics[0]?.area || diagnostics[0])}</div> : null}

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </section>

      <section className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:grid-cols-[1.5fr_0.6fr_0.6fr_0.6fr_0.6fr_auto]">
        <label className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950">
          <Search size={18} className="text-slate-500" />
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Rechercher un ambassadeur, ville, téléphone..." className="w-full bg-transparent outline-none placeholder:text-slate-400" />
        </label>
        <FilterSelect label="Territoire" value={territoryFilter} onChange={onTerritoryFilterChange}>
          <option value="all">Tous</option>
          {territories.map((item) => <option key={item.id} value={item.id}>{item.name || item.city || item.id}</option>)}
        </FilterSelect>
        <FilterSelect label="Statut" value={statusFilter} onChange={onStatusFilterChange}>
          {statusOptions.map((item) => <option key={item} value={item}>{item === "all" ? "Tous" : item.replaceAll("_", " ")}</option>)}
        </FilterSelect>
        <FilterSelect label="Région" value={regionFilter} onChange={onRegionFilterChange}>
          <option value="all">Toutes</option>
          {regions.map((item) => <option key={item} value={item}>{item}</option>)}
        </FilterSelect>
        <FilterSelect label="Niveau" value="Tous" onChange={() => undefined}>
          {levelOptions.map((item) => <option key={item} value={item}>{item}</option>)}
        </FilterSelect>
        <div className="flex items-end gap-2">
          <ActionButton icon={Filter}>Filtres</ActionButton>
          <select value={sortKey} onChange={(event) => onSortKeyChange(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none">
            <option value="updated">Tri récent</option>
            <option value="name">Tri nom</option>
            <option value="status">Tri statut</option>
          </select>
        </div>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="font-black text-slate-950">Liste des ambassadeurs</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">Affichage de {formatNumber(filteredAmbassadors.length)} ambassadeur(s) synchronisés</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{formatNumber(activeAmbassadors.length)} total réseau</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-[0.12em] text-slate-600">
                  <tr>
                    <th className="px-5 py-3">Ambassadeur</th>
                    <th>Ville</th>
                    <th>Statut</th>
                    <th>Niveau</th>
                    <th>Leads (MTD)</th>
                    <th>Conversions</th>
                    <th>Incentive dû</th>
                    <th>Dernier contact</th>
                    <th>Score qualité</th>
                    <th className="pr-5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [1, 2, 3, 4, 5].map((item) => <tr key={item} className="border-t border-slate-100"><td colSpan={10} className="px-5 py-4"><div className="h-12 animate-pulse rounded-xl bg-slate-100" /></td></tr>)
                  ) : filteredAmbassadors.length ? (
                    filteredAmbassadors.map((item) => {
                      const score = numberValue(item.performance_score ?? item.quality_score ?? item.score_quality ?? 0);
                      const phone = normalizePhone(item.phone);
                      return (
                        <tr key={item.id} className="border-t border-slate-100 transition hover:bg-blue-50/35">
                          <td className="px-5 py-4">
                            <button type="button" onClick={() => onOpenProfile(item)} className="flex items-center gap-3 text-left">
                              <span className="relative grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-950 ring-1 ring-slate-200">
                                {initials(item.full_name || item.name)}
                                <span className={cn("absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white", String(item.status || "active") === "active" ? "bg-emerald-500" : "bg-amber-500")} />
                              </span>
                              <span>
                                <span className="block font-black text-slate-950">{item.full_name || item.name || "Ambassadeur"}</span>
                                <span className="block text-xs font-semibold text-slate-500">{item.phone || item.email || "Contact à compléter"}</span>
                              </span>
                            </button>
                          </td>
                          <td className="font-bold text-slate-700">{item.city || item.region || "Non renseignée"}</td>
                          <td><StatusBadge status={item.status || item.lifecycle_stage || "active"} /></td>
                          <td><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">{ambassadorLevel(item)}</span></td>
                          <td className="font-black text-slate-950">{formatNumber(item.leads_mtd ?? item.leads_generated ?? item.leads_count ?? 0)}</td>
                          <td className="font-black text-slate-950">{formatNumber(item.conversions_mtd ?? item.conversions_validated ?? item.conversions_count ?? 0)}</td>
                          <td className="font-black text-emerald-700">{formatMoney(item.incentives_balance ?? item.incentive_due ?? 0, item.currency || "MAD")}</td>
                          <td className="text-xs font-semibold text-slate-500">{dateLabel(item.last_activity_at || item.last_contact_at || item.updated_at)}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100"><div className={cn("h-full rounded-full", scoreTone(score))} style={{ width: `${Math.max(5, Math.min(100, score))}%` }} /></div>
                              <span className="text-xs font-black text-slate-950">{score}%</span>
                            </div>
                          </td>
                          <td className="pr-5">
                            <div className="flex items-center gap-2">
                              <IconLink href={`tel:${phone}`} icon={Phone} title="Appeler" disabled={!phone} />
                              <IconLink href={`https://wa.me/${phone.replace(/^\+/, "")}`} icon={MessageCircle} title="WhatsApp" disabled={!phone} />
                              <IconLink href={`mailto:${item.email || ""}`} icon={Mail} title="Email" disabled={!item.email} />
                              <button type="button" onClick={() => onEditAmbassador(item)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-950 hover:border-blue-300 hover:bg-blue-50" title="Mettre à jour"><MoreHorizontal size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={10} className="px-5 py-14 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100"><Search size={22} /></div><p className="mt-3 font-black text-slate-950">Aucun ambassadeur trouvé</p><p className="text-sm font-semibold text-slate-500">Ajustez les filtres ou ajoutez un ambassadeur.</p></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {selected ? <SelectedAmbassadorPanel ambassador={selected} snapshot={snapshot} onOpenProfile={onOpenProfile} onAssignTerritory={openTerritoryAssignmentModal} onCreateMission={openDirectoryMissionStudio} onArchive={onArchiveAmbassador} /> : null}
        </div>

        <aside className="space-y-5">
          <SectionCard title="Top performers (MTD)" action={<button className="text-xs font-black text-blue-700">Voir tout</button>}>
            <div className="space-y-3">
              {topPerformers.map((item: AnyRecord, index: number) => (
                <button key={item.id || index} type="button" onClick={() => onOpenProfile(item)} className="flex w-full items-center justify-between gap-3 rounded-xl p-2 text-left hover:bg-blue-50">
                  <div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-amber-50 text-xs font-black text-amber-700">{index + 1}</span><span><span className="block text-sm font-black text-slate-950">{item.full_name || item.name}</span><span className="text-xs font-semibold text-slate-500">{item.city || item.region || "Maroc"}</span></span></div>
                  <span className="text-xs font-black text-slate-950">{formatMoney(item.incentives_balance ?? 0)}</span>
                </button>
              ))}
              {!topPerformers.length ? <p className="text-sm font-semibold text-slate-500">Aucune performance disponible.</p> : null}
            </div>
          </SectionCard>

          <SectionCard title="Ambassadeurs à risque" action={<button className="text-xs font-black text-blue-700">Voir tout</button>}>
            <div className="space-y-3">
              {risky.map((item: AnyRecord) => {
                const score = numberValue(item.performance_score ?? item.quality_score ?? 0);
                return <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-rose-50/60 p-3"><div className="flex items-center gap-3"><AlertTriangle size={17} className="text-rose-600" /><span><span className="block text-sm font-black text-slate-950">{item.full_name || item.name}</span><span className="text-xs font-semibold text-slate-500">Score / activité à revoir</span></span></div><span className="text-sm font-black text-rose-600">{score}%</span></div>;
              })}
              {!risky.length ? <p className="text-sm font-semibold text-slate-500">Aucun risque majeur détecté.</p> : null}
            </div>
          </SectionCard>

          <SectionCard title="Validations en attente">
            <div className="space-y-3">
              {pendingValidations.map(([label, value]) => <div key={String(label)} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3"><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><BadgeCheck size={16} className="text-blue-700" />{String(label)}</span><span className="font-black text-slate-950">{formatNumber(value)}</span></div>)}
            </div>
          </SectionCard>

          <SectionCard title="Priorités coaching">
            <div className="space-y-3">
              {coaching.map((item: AnyRecord) => <div key={item.id} className="rounded-xl border border-slate-100 p-3"><p className="text-sm font-black text-slate-950">Développer le portefeuille</p><p className="mt-1 text-xs font-semibold text-slate-500">{item.full_name || item.name} · relance et objectifs à clarifier</p></div>)}
              {!coaching.length ? <p className="text-sm font-semibold text-slate-500">Aucune priorité de coaching immédiate.</p> : null}
            </div>
          </SectionCard>
        </aside>
      </section>

      <AmbassadorActivationEnterpriseModal
        open={activationModalOpen}
        snapshot={snapshot}
        onClose={() => setActivationModalOpen(false)}
        onCreated={onRefresh}
      />
      <AmbassadorTerritoryAssignmentEnterpriseModal
        key={territoryModalAmbassador?.id || "manual-territory-assignment"}
        open={territoryModalOpen}
        selectedAmbassador={territoryModalAmbassador}
        snapshot={snapshot}
        onClose={() => setTerritoryModalOpen(false)}
        onAssigned={onRefresh}
      />
      <AmbassadorDirectoryMissionStudioModal
        key={directoryMissionAmbassador?.id || "manual-directory-mission"}
        open={directoryMissionModalOpen}
        selectedAmbassador={directoryMissionAmbassador}
        snapshot={snapshot}
        onClose={() => setDirectoryMissionModalOpen(false)}
        onCreated={onRefresh}
      />
    </div>
  );
}

type DirectoryMissionSubmitMode = "draft" | "create" | "notify" | "route";

type DirectoryMissionAmbassadorRole = "responsable" | "support_terrain" | "whatsapp" | "relance" | "preuves" | "coordinateur_zone";

type DirectoryMissionAssignedAmbassador = {
  ambassadorId: string;
  role: DirectoryMissionAmbassadorRole;
};

type DirectoryMissionForm = {
  missionTitle: string;
  scenarioKey: string;
  campaign: string;
  serviceLine: string;
  city: string;
  territoryName: string;
  district: string;
  channel: string;
  priority: string;
  deadline: string;
  slaClosure: string;
  expectedLeads: string;
  expectedConversations: string;
  expectedConversions: string;
  mainObjective: string;
  successCriteria: string;
  playbook: string;
  instructions: string;
  proofRequirements: string[];
  notifyAmbassador: boolean;
  notificationChannel: string;
  notificationMessage: string;
  managerName: string;
  primaryAmbassadorId: string;
  assignedAmbassadors: DirectoryMissionAssignedAmbassador[];
};

const directoryMissionServices = ["Home Service", "Kindergarten & Preschool", "Academy", "Hospitality Kids Friendly", "Corporates Liner"];
const directoryMissionChannels = ["Terrain", "WhatsApp", "Appel", "Partenaire", "Événement local", "B2B direct"];
const directoryMissionProofs = ["Photo terrain", "Liste contacts", "Screenshot WhatsApp", "Formulaire lead", "Note partenaire", "Compte rendu court", "Objections rencontrées", "Résultat conversion"];
const directoryMissionPriorities = ["Normale", "Haute", "Urgente"];

const directoryMissionAssignmentRoles: { value: DirectoryMissionAmbassadorRole; label: string; description: string }[] = [
  { value: "responsable", label: "Responsable mission", description: "Porte l’objectif, la preuve finale et la clôture." },
  { value: "support_terrain", label: "Support terrain", description: "Renforce les visites, contacts locaux et preuves terrain." },
  { value: "whatsapp", label: "Prospection WhatsApp", description: "Active les premiers messages, relances et scripts digitaux." },
  { value: "relance", label: "Relance leads", description: "Suit les prospects chauds et les prochaines actions." },
  { value: "preuves", label: "Collecte preuves", description: "Centralise photos, screenshots, listes et compte rendu." },
  { value: "coordinateur_zone", label: "Coordinateur zone", description: "Synchronise l’équipe sur un quartier ou territoire." },
];

const directoryMissionScenarios = [
  {
    key: "hot_leads_followup",
    label: "Relance leads chauds",
    badge: "Recommandé",
    service: "Home Service",
    channel: "WhatsApp",
    priority: "Haute",
    output: "Relancer les prospects déjà engagés et verrouiller les prochaines étapes.",
    objective: "Transformer les leads chauds de la zone en conversations qualifiées et rendez-vous exploitables.",
    criteria: "Tous les leads assignés sont contactés, qualifiés et annotés avec prochaine action.",
    playbook: "Script relance chaude + objections prix/confiance",
    proof: ["Screenshot WhatsApp", "Compte rendu court", "Résultat conversion"],
    leads: "8",
    conversations: "12",
    conversions: "2",
  },
  {
    key: "parents_prospecting",
    label: "Prospection parents",
    badge: "B2C",
    service: "Home Service",
    channel: "Terrain",
    priority: "Haute",
    output: "Identifier familles qualifiées dans le quartier prioritaire.",
    objective: "Créer un flux de contacts parents qualifiés autour du territoire de l’ambassadeur.",
    criteria: "Minimum 15 conversations terrain et 5 leads exploitables dans le système.",
    playbook: "Pitch famille + introduction sécurité/confiance",
    proof: ["Liste contacts", "Photo terrain", "Compte rendu court"],
    leads: "5",
    conversations: "15",
    conversions: "1",
  },
  {
    key: "promo_code_activation",
    label: "Activation code promo",
    badge: "Tracking",
    service: "Home Service",
    channel: "WhatsApp",
    priority: "Normale",
    output: "Réactiver les contacts dormants avec une proposition claire.",
    objective: "Diffuser un code promo traçable auprès de prospects ciblés et mesurer la réaction.",
    criteria: "Code partagé, contacts listés, retours qualifiés et objections notées.",
    playbook: "Message WhatsApp code promo + relance 48h",
    proof: ["Screenshot WhatsApp", "Liste contacts"],
    leads: "10",
    conversations: "18",
    conversions: "2",
  },
  {
    key: "school_partner_visit",
    label: "Visite partenaire école/crèche",
    badge: "B2B",
    service: "Kindergarten & Preschool",
    channel: "Partenaire",
    priority: "Haute",
    output: "Obtenir un rendez-vous utile avec un décideur éducatif.",
    objective: "Ouvrir une opportunité partenaire avec une structure éducative locale.",
    criteria: "Décideur identifié, besoin noté, suite commerciale planifiée.",
    playbook: "Pitch partenariat éducatif + fiche bénéfices direction",
    proof: ["Note partenaire", "Photo terrain", "Compte rendu court"],
    leads: "2",
    conversations: "5",
    conversions: "1",
  },
  {
    key: "recommendations_collection",
    label: "Collecte recommandations",
    badge: "Réseau",
    service: "Home Service",
    channel: "WhatsApp",
    priority: "Normale",
    output: "Collecter des recommandations qualifiées via le réseau local.",
    objective: "Déclencher un flux de recommandations parents/partenaires avec suivi clair.",
    criteria: "Recommandations sourcées, permission contact confirmée et suivi attribué.",
    playbook: "Message recommandation + mini-script confiance",
    proof: ["Liste contacts", "Screenshot WhatsApp"],
    leads: "6",
    conversations: "10",
    conversions: "1",
  },
  {
    key: "quality_control",
    label: "Contrôle qualité terrain",
    badge: "Qualité",
    service: "Home Service",
    channel: "Terrain",
    priority: "Urgente",
    output: "Vérifier conformité terrain, preuves et respect playbook.",
    objective: "Auditer l’exécution locale et sécuriser les standards avant extension.",
    criteria: "Observations documentées, anomalies remontées, actions correctives proposées.",
    playbook: "Checklist qualité terrain ambassadeur",
    proof: ["Photo terrain", "Compte rendu court", "Objections rencontrées"],
    leads: "0",
    conversations: "4",
    conversions: "0",
  },
];

function directoryMissionDate(offsetDays = 3) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function defaultDirectoryMissionForm(ambassador?: AnyRecord | null): DirectoryMissionForm {
  const scenario = directoryMissionScenarios[0];
  const city = String(ambassador?.city || ambassador?.region || "Rabat");
  const territoryName = String(ambassador?.territory_name || ambassador?.territory || `${city} Centre`);
  const name = String(ambassador?.full_name || ambassador?.name || "l’ambassadeur");
  const ambassadorId = String(ambassador?.id || "");
  return {
    missionTitle: `${scenario.label} · ${name}`,
    scenarioKey: scenario.key,
    campaign: "Ambassadeurs Maroc 2026",
    serviceLine: scenario.service,
    city,
    territoryName,
    district: String(ambassador?.zone || ambassador?.district || "Centre / zone prioritaire"),
    channel: scenario.channel,
    priority: scenario.priority,
    deadline: directoryMissionDate(3),
    slaClosure: "48h",
    expectedLeads: scenario.leads,
    expectedConversations: scenario.conversations,
    expectedConversions: scenario.conversions,
    mainObjective: scenario.objective,
    successCriteria: scenario.criteria,
    playbook: scenario.playbook,
    instructions: "Utiliser le script recommandé, documenter chaque échange utile, créer les leads qualifiés et remonter les objections exploitables.",
    proofRequirements: scenario.proof,
    notifyAmbassador: true,
    notificationChannel: "WhatsApp",
    notificationMessage: `Bonjour ${name}, une nouvelle mission vous est proposée sur ${territoryName}. Merci de confirmer votre disponibilité et de respecter les preuves attendues.`,
    managerName: String(ambassador?.manager_name || "Sara Bakoki"),
    primaryAmbassadorId: ambassadorId,
    assignedAmbassadors: ambassadorId ? [{ ambassadorId, role: "responsable" }] : [],
  };
}

function AmbassadorDirectoryMissionStudioModal({
  open,
  selectedAmbassador,
  snapshot,
  onClose,
  onCreated,
}: {
  open: boolean;
  selectedAmbassador?: AnyRecord | null;
  snapshot: AmbassadorWorkspaceSnapshot;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<DirectoryMissionForm>(() => defaultDirectoryMissionForm(selectedAmbassador));
  const [savingMode, setSavingMode] = useState<DirectoryMissionSubmitMode | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [supportAmbassadorPick, setSupportAmbassadorPick] = useState("");

  if (!open) return null;

  const ambassadors = ((snapshot.ambassadors || []) as AnyRecord[]).filter((item) => String(item.status || "") !== "archived");
  const missions = ((snapshot.missions || []) as AnyRecord[]);
  const leads = ((snapshot.leads || []) as AnyRecord[]);
  const conversions = ((snapshot.conversions || []) as AnyRecord[]);
  const fallbackAmbassadorId = String(selectedAmbassador?.id || "");
  const primaryAmbassadorId = form.primaryAmbassadorId || fallbackAmbassadorId;
  const ambassador = ambassadors.find((item) => String(item.id) === String(primaryAmbassadorId)) || selectedAmbassador || ambassadors[0] || null;
  const ambassadorName = String(ambassador?.full_name || ambassador?.name || "Ambassadeur non sélectionné");
  const normalizedAssignments = form.assignedAmbassadors.length
    ? form.assignedAmbassadors
    : ambassador?.id
      ? [{ ambassadorId: String(ambassador.id), role: "responsable" as DirectoryMissionAmbassadorRole }]
      : [];
  const selectedAmbassadorCards = normalizedAssignments
    .map((assignment) => ({
      ...assignment,
      ambassador: ambassadors.find((item) => String(item.id) === String(assignment.ambassadorId)) || (String(selectedAmbassador?.id || "") === String(assignment.ambassadorId) ? selectedAmbassador : null),
    }))
    .filter((assignment) => assignment.ambassador) as Array<DirectoryMissionAssignedAmbassador & { ambassador: AnyRecord }>;
  const selectedAmbassadorIds = new Set(selectedAmbassadorCards.map((assignment) => String(assignment.ambassadorId)));
  const supportCandidates = ambassadors.filter((item) => !selectedAmbassadorIds.has(String(item.id)));
  const primaryAssignment = selectedAmbassadorCards.find((assignment) => assignment.role === "responsable") || selectedAmbassadorCards[0] || null;
  const currentMissions = missions.filter((item) => String(item.ambassador_id || item.assigned_ambassador_id || item.owner_id || "") === String(ambassador?.id || ""));
  const lateMissions = currentMissions.filter((item) => ["late", "overdue", "blocked", "at_risk"].includes(String(item.status || "").toLowerCase()));
  const cityLeads = leads.filter((item) => String(item.city || item.region || "").toLowerCase() === form.city.toLowerCase());
  const cityConversions = conversions.filter((item) => String(item.city || item.region || "").toLowerCase() === form.city.toLowerCase());
  const qualityScore = numberValue(ambassador?.performance_score ?? ambassador?.quality_score ?? ambassador?.score_quality ?? 72);
  const currentLoad = Math.min(100, Math.round(currentMissions.length * 17 + lateMissions.length * 14 + Number(form.expectedLeads || 0) * 1.4 + Number(form.expectedConversations || 0) * 0.6));
  const selectedScenario = directoryMissionScenarios.find((scenario) => scenario.key === form.scenarioKey) || directoryMissionScenarios[0];
  const serviceFit = form.serviceLine === selectedScenario.service ? 100 : form.serviceLine.includes("Home") ? 78 : 68;
  const territoryFit = cityLeads.length || cityConversions.length ? Math.min(96, 62 + cityLeads.length * 3 + cityConversions.length * 7) : 58;
  const notificationReady = form.notifyAmbassador && form.notificationChannel && form.notificationMessage.trim().length >= 20;

  const missingFields = [
    ["Ambassadeur", selectedAmbassadorCards.length ? "ok" : ""],
    ["Type de mission", form.scenarioKey],
    ["Service", form.serviceLine],
    ["Ville", form.city],
    ["Territoire", form.territoryName],
    ["Deadline", form.deadline],
    ["SLA", form.slaClosure],
    ["Objectif principal", form.mainObjective],
    ["Preuve attendue", form.proofRequirements.length ? "ok" : ""],
  ].filter(([, value]) => !String(value || "").trim()).map(([label]) => String(label));

  const readinessScore = Math.max(18, Math.min(100, Math.round(
    (missingFields.length === 0 ? 24 : 8) +
    (qualityScore >= 85 ? 18 : qualityScore >= 65 ? 12 : 6) +
    (currentLoad < 70 ? 16 : currentLoad < 90 ? 8 : 2) +
    (serviceFit >= 90 ? 14 : serviceFit >= 75 ? 10 : 6) +
    (territoryFit >= 80 ? 14 : territoryFit >= 60 ? 10 : 6) +
    (form.proofRequirements.length >= 3 ? 8 : 4) +
    (notificationReady ? 6 : 2)
  )));
  const blockedReasons = missingFields;
  const dispatchLabel = readinessScore >= 82 ? "Dispatch recommandé" : readinessScore >= 64 ? "Mission possible avec contrôle" : "À compléter avant lancement";
  const riskLabel = currentLoad >= 90 ? "Surcharge probable" : currentLoad >= 72 ? "Charge à surveiller" : "Capacité compatible";

  function update<K extends keyof DirectoryMissionForm>(key: K, value: DirectoryMissionForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectPrimaryAmbassador(ambassadorId: string) {
    const target = ambassadors.find((item) => String(item.id) === String(ambassadorId));
    const targetName = String(target?.full_name || target?.name || ambassadorName);
    const targetCity = String(target?.city || target?.region || form.city || "Rabat");
    const targetTerritory = String(target?.territory_name || target?.territory || form.territoryName || `${targetCity} Centre`);

    setForm((current) => {
      const withoutTarget = current.assignedAmbassadors.filter((item) => String(item.ambassadorId) !== String(ambassadorId));
      return {
        ...current,
        primaryAmbassadorId: ambassadorId,
        assignedAmbassadors: [{ ambassadorId, role: "responsable" }, ...withoutTarget.map((item) => item.role === "responsable" ? { ...item, role: "support_terrain" as DirectoryMissionAmbassadorRole } : item)],
        city: targetCity,
        territoryName: targetTerritory,
        district: String(target?.zone || target?.district || current.district || "Centre / zone prioritaire"),
        managerName: String(target?.manager_name || current.managerName || "Sara Bakoki"),
        missionTitle: `${selectedScenario.label} · ${targetName}`,
        notificationMessage: `Bonjour ${targetName}, une nouvelle mission “${selectedScenario.label}” vous est proposée sur ${targetTerritory}. Merci de confirmer votre disponibilité et de respecter les preuves attendues.`,
      };
    });
  }

  function addSupportAmbassador(ambassadorId = supportAmbassadorPick) {
    if (!ambassadorId) return;
    setForm((current) => {
      if (current.assignedAmbassadors.some((item) => String(item.ambassadorId) === String(ambassadorId))) return current;
      return {
        ...current,
        assignedAmbassadors: [...current.assignedAmbassadors, { ambassadorId, role: "support_terrain" }],
      };
    });
    setSupportAmbassadorPick("");
  }

  function removeAssignedAmbassador(ambassadorId: string) {
    setForm((current) => {
      const next = current.assignedAmbassadors.filter((item) => String(item.ambassadorId) !== String(ambassadorId));
      const nextPrimary = String(current.primaryAmbassadorId) === String(ambassadorId) ? String(next[0]?.ambassadorId || "") : current.primaryAmbassadorId;
      return {
        ...current,
        primaryAmbassadorId: nextPrimary,
        assignedAmbassadors: next.map((item, index) => index === 0 && !next.some((assignment) => assignment.role === "responsable") ? { ...item, role: "responsable" as DirectoryMissionAmbassadorRole } : item),
      };
    });
  }

  function updateAssignedAmbassadorRole(ambassadorId: string, role: DirectoryMissionAmbassadorRole) {
    setForm((current) => {
      const normalized = current.assignedAmbassadors.map((item) => {
        if (String(item.ambassadorId) === String(ambassadorId)) return { ...item, role };
        if (role === "responsable" && item.role === "responsable") return { ...item, role: "support_terrain" as DirectoryMissionAmbassadorRole };
        return item;
      });
      return {
        ...current,
        primaryAmbassadorId: role === "responsable" ? ambassadorId : current.primaryAmbassadorId,
        assignedAmbassadors: normalized,
      };
    });
  }

  function toggleProof(value: string) {
    setForm((current) => {
      const next = current.proofRequirements.includes(value)
        ? current.proofRequirements.filter((item) => item !== value)
        : [...current.proofRequirements, value];
      return { ...current, proofRequirements: next };
    });
  }

  function applyScenario(key: string) {
    const scenario = directoryMissionScenarios.find((item) => item.key === key) || directoryMissionScenarios[0];
    const name = ambassadorName;
    setForm((current) => ({
      ...current,
      scenarioKey: scenario.key,
      missionTitle: `${scenario.label} · ${name}`,
      serviceLine: scenario.service,
      channel: scenario.channel,
      priority: scenario.priority,
      expectedLeads: scenario.leads,
      expectedConversations: scenario.conversations,
      expectedConversions: scenario.conversions,
      mainObjective: scenario.objective,
      successCriteria: scenario.criteria,
      playbook: scenario.playbook,
      proofRequirements: scenario.proof,
      notificationMessage: `Bonjour ${name}, une nouvelle mission “${scenario.label}” vous est proposée sur ${current.territoryName}. Merci de confirmer votre disponibilité et de respecter les preuves attendues.`,
    }));
  }

  async function submit(mode: DirectoryMissionSubmitMode) {
    setMessage(null);
    if ((mode === "create" || mode === "notify" || mode === "route") && blockedReasons.length) {
      setMessage({ type: "error", text: `Bloqué: ${blockedReasons.join(", ")}` });
      return;
    }

    setSavingMode(mode);
    try {
      const payload = {
        source: "directory",
        status: mode === "draft" ? "draft" : "assigned",
        title: form.missionTitle,
        mission_type: selectedScenario.label,
        scenario_key: form.scenarioKey,
        ambassador_id: ambassador?.id || null,
        ambassador_name: ambassadorName,
        primary_ambassador_id: primaryAssignment?.ambassadorId || ambassador?.id || null,
        assigned_ambassador_ids: selectedAmbassadorCards.map((assignment) => assignment.ambassadorId),
        assigned_ambassadors: selectedAmbassadorCards.map((assignment) => ({
          ambassador_id: assignment.ambassadorId,
          ambassador_name: String(assignment.ambassador?.full_name || assignment.ambassador?.name || "Ambassadeur"),
          role: assignment.role,
          city: String(assignment.ambassador?.city || assignment.ambassador?.region || ""),
          territory_name: String(assignment.ambassador?.territory_name || assignment.ambassador?.territory || ""),
          quality_score: numberValue(assignment.ambassador?.performance_score ?? assignment.ambassador?.quality_score ?? assignment.ambassador?.score_quality ?? 0),
        })),
        support_ambassadors: selectedAmbassadorCards.filter((assignment) => assignment.role !== "responsable").map((assignment) => assignment.ambassadorId),
        ambassador_count: selectedAmbassadorCards.length,
        city: form.city,
        territory_name: form.territoryName,
        district: form.district,
        campaign: form.campaign,
        service_line: form.serviceLine,
        channel: form.channel,
        priority: form.priority.toLowerCase(),
        deadline: form.deadline,
        sla_closure: form.slaClosure,
        expected_leads: Number(form.expectedLeads || 0),
        expected_conversations: Number(form.expectedConversations || 0),
        expected_conversions: Number(form.expectedConversions || 0),
        objective: form.mainObjective,
        success_criteria: form.successCriteria,
        playbook: form.playbook,
        instructions: form.instructions,
        proof_requirements: form.proofRequirements,
        notify_ambassador: mode === "notify" || mode === "route" ? form.notifyAmbassador : false,
        notification_channel: form.notificationChannel,
        notification_message: form.notificationMessage,
        manager_name: form.managerName,
        readiness_score: readinessScore,
        current_load: currentLoad,
        service_fit: serviceFit,
        territory_fit: territoryFit,
        open_route_sheet: mode === "route",
      };

      const response = await fetch("/api/market-os/ambassadors/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.ok === false) throw new Error(data?.error || "Création de mission impossible avec l’infrastructure actuelle");
      setMessage({
        type: "success",
        text: mode === "draft" ? "Brouillon mission enregistré." : mode === "notify" ? "Mission créée avec demande de notification ambassadeur." : mode === "route" ? "Mission créée avec ouverture de feuille de route demandée." : "Mission créée et assignée à l’ambassadeur.",
      });
      onCreated();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erreur inconnue lors de la création mission" });
    } finally {
      setSavingMode(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/35 px-3 py-3 backdrop-blur-sm">
      <div className="flex h-[calc(100dvh-28px)] w-[calc(100vw-24px)] max-w-[1680px] flex-col overflow-hidden rounded-[34px] border border-slate-200 bg-white text-slate-950 shadow-2xl shadow-slate-950/25 [&_*]:!text-slate-950 [&_input]:!text-slate-950 [&_select]:!text-slate-950 [&_textarea]:!text-slate-950 [&_option]:!text-slate-950">
        <header className="sticky top-0 z-20 border-b border-slate-100 bg-white px-7 py-5">
          <div className="flex items-start justify-between gap-5">
            <div className="flex gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-blue-100 bg-blue-50">
                <Target size={22} className="text-blue-800" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">Créer mission pour {ambassadorName}</h2>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-blue-800">Dispatch ambassadeur</span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-800">SLA + preuve</span>
                </div>
                <p className="mt-1 max-w-5xl text-sm font-bold leading-6 text-slate-700">
                  Créez une mission contextualisée à partir du profil, du territoire, de la charge, des services autorisés et des preuves attendues.
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white hover:bg-slate-50" aria-label="Fermer">
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/80 px-7 py-6">
          <div className="grid gap-5 xl:grid-cols-[410px_minmax(0,1fr)_410px]">
            <aside className="space-y-5">
              <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-800">Affectation multi-ambassadeurs</p>
                    <h3 className="mt-1 text-lg font-black">Responsable + équipe support</h3>
                    <p className="mt-1 text-xs font-bold leading-5 text-slate-700">Le profil sélectionné reste préchargé, mais vous pouvez ajouter un ou plusieurs ambassadeurs à la même mission.</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-800">{selectedAmbassadorCards.length || 0} assigné(s)</span>
                </div>

                <label className="mt-4 block">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em]">Ambassadeur principal</span>
                  <select
                    value={String(ambassador?.id || form.primaryAmbassadorId || "")}
                    onChange={(event) => selectPrimaryAmbassador(event.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black outline-none"
                  >
                    {ambassadors.map((item) => {
                      const id = String(item.id || "");
                      const name = String(item.full_name || item.name || "Ambassadeur");
                      const city = String(item.city || item.region || "Ville non renseignée");
                      return <option key={id} value={id}>{name} · {city}</option>;
                    })}
                  </select>
                </label>

                <div className="mt-4 space-y-3">
                  {selectedAmbassadorCards.map((assignment, index) => {
                    const item = assignment.ambassador;
                    const name = String(item.full_name || item.name || "Ambassadeur");
                    const city = String(item.city || item.region || "Ville non renseignée");
                    const territory = String(item.territory_name || item.territory || item.zone || "Territoire à préciser");
                    const load = Math.min(100, Math.round(missions.filter((mission) => String(mission.ambassador_id || mission.assigned_ambassador_id || mission.owner_id || "") === String(assignment.ambassadorId)).length * 18 + numberValue(item.pending_missions ?? 0) * 9));
                    const quality = numberValue(item.performance_score ?? item.quality_score ?? item.score_quality ?? 72);
                    const outsideTerritory = form.city && city && city !== "Ville non renseignée" && city.toLowerCase() !== form.city.toLowerCase();

                    return (
                      <div key={assignment.ambassadorId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start gap-3">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-sm font-black ring-1 ring-slate-200">{initials(name)}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-black">{name}</p>
                              {index === 0 || assignment.role === "responsable" ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-800">Principal</span> : <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-800">Support</span>}
                            </div>
                            <p className="mt-1 text-xs font-bold text-slate-700">{city} · {territory}</p>
                            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-black uppercase tracking-[0.1em]">
                              <span className="rounded-full bg-white px-2 py-1 text-center ring-1 ring-slate-200">Score {quality}%</span>
                              <span className="rounded-full bg-white px-2 py-1 text-center ring-1 ring-slate-200">Charge {load}%</span>
                              <span className={cn("rounded-full px-2 py-1 text-center ring-1", outsideTerritory ? "bg-amber-50 text-amber-900 ring-amber-200" : "bg-white ring-slate-200")}>{outsideTerritory ? "Hors zone" : "Zone OK"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <select
                            value={assignment.role}
                            onChange={(event) => updateAssignedAmbassadorRole(assignment.ambassadorId, event.target.value as DirectoryMissionAmbassadorRole)}
                            className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none"
                          >
                            {directoryMissionAssignmentRoles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeAssignedAmbassador(assignment.ambassadorId)}
                            disabled={selectedAmbassadorCards.length <= 1}
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black disabled:opacity-40"
                          >
                            Retirer
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em]">Ajouter un ambassadeur support</p>
                  <div className="mt-2 flex gap-2">
                    <select value={supportAmbassadorPick} onChange={(event) => setSupportAmbassadorPick(event.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none">
                      <option value="">Sélectionner depuis le réseau</option>
                      {supportCandidates.map((item) => {
                        const id = String(item.id || "");
                        const name = String(item.full_name || item.name || "Ambassadeur");
                        const city = String(item.city || item.region || "Ville non renseignée");
                        return <option key={id} value={id}>{name} · {city}</option>;
                      })}
                    </select>
                    <button type="button" onClick={() => addSupportAmbassador()} disabled={!supportAmbassadorPick} className="h-11 rounded-xl bg-slate-950 px-4 text-xs font-black text-white disabled:bg-slate-200">Ajouter</button>
                  </div>
                  <p className="mt-2 text-[11px] font-bold leading-5 text-slate-600">Rôles disponibles: responsable mission, support terrain, WhatsApp, relance, preuves, coordinateur zone.</p>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-lg font-black ring-1 ring-slate-200">{initials(ambassadorName)}</div>
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-black">{ambassadorName}</h3>
                    <p className="mt-1 text-sm font-bold text-slate-700">{form.city} · {form.territoryName}</p>
                    <p className="mt-1 text-xs font-bold text-slate-600">Manager: {form.managerName}</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">Score qualité</p><p className="mt-1 text-2xl font-black">{qualityScore}%</p></div>
                  <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">Charge</p><p className="mt-1 text-2xl font-black">{currentLoad}%</p></div>
                  <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">Missions</p><p className="mt-1 text-2xl font-black">{formatNumber(currentMissions.length)}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">En retard</p><p className="mt-1 text-2xl font-black">{formatNumber(lateMissions.length)}</p></div>
                </div>
                <div className="mt-5 space-y-3 text-sm font-bold text-slate-700">
                  <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3"><span>Fit territoire</span><b>{territoryFit}%</b></div>
                  <div className="flex items-center justify-between rounded-2xl bg-blue-50 px-4 py-3"><span>Fit service</span><b>{serviceFit}%</b></div>
                  <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3"><span>Risque charge</span><b>{riskLabel}</b></div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-[0.14em]">Scénarios recommandés</h3>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black">{directoryMissionScenarios.length}</span>
                </div>
                <div className="space-y-3">
                  {directoryMissionScenarios.map((scenario) => {
                    const active = form.scenarioKey === scenario.key;
                    return (
                      <button
                        key={scenario.key}
                        type="button"
                        onClick={() => applyScenario(scenario.key)}
                        className={cn("w-full rounded-2xl border p-4 text-left transition", active ? "border-blue-300 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div><p className="font-black">{scenario.label}</p><p className="mt-1 text-xs font-bold leading-5 text-slate-700">{scenario.output}</p></div>
                          <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-black ring-1 ring-slate-200">{scenario.badge}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.1em]"><span className="rounded-full bg-slate-100 px-2 py-1">{scenario.channel}</span><span className="rounded-full bg-slate-100 px-2 py-1">{scenario.priority}</span></div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </aside>

            <main className="space-y-5">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-base font-black">Mission builder</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]">Configuration</span>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="lg:col-span-2"><span className="text-[10px] font-black uppercase tracking-[0.16em]">Titre mission</span><input value={form.missionTitle} onChange={(event) => update("missionTitle", event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" /></label>
                  <label><span className="text-[10px] font-black uppercase tracking-[0.16em]">Campagne</span><input value={form.campaign} onChange={(event) => update("campaign", event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none" /></label>
                  <label><span className="text-[10px] font-black uppercase tracking-[0.16em]">Service line</span><select value={form.serviceLine} onChange={(event) => update("serviceLine", event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none">{directoryMissionServices.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label><span className="text-[10px] font-black uppercase tracking-[0.16em]">Ville</span><input value={form.city} onChange={(event) => update("city", event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none" /></label>
                  <label><span className="text-[10px] font-black uppercase tracking-[0.16em]">Territoire / zone</span><input value={form.territoryName} onChange={(event) => update("territoryName", event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none" /></label>
                  <label><span className="text-[10px] font-black uppercase tracking-[0.16em]">Quartier / secteur</span><input value={form.district} onChange={(event) => update("district", event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none" /></label>
                  <label><span className="text-[10px] font-black uppercase tracking-[0.16em]">Canal d'exécution</span><select value={form.channel} onChange={(event) => update("channel", event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none">{directoryMissionChannels.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label><span className="text-[10px] font-black uppercase tracking-[0.16em]">Priorité</span><select value={form.priority} onChange={(event) => update("priority", event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none">{directoryMissionPriorities.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label><span className="text-[10px] font-black uppercase tracking-[0.16em]">Deadline</span><input type="date" value={form.deadline} onChange={(event) => update("deadline", event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none" /></label>
                  <label><span className="text-[10px] font-black uppercase tracking-[0.16em]">SLA clôture</span><select value={form.slaClosure} onChange={(event) => update("slaClosure", event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none"><option>24h</option><option>48h</option><option>72h</option><option>7 jours</option></select></label>
                </div>
              </section>

              <section className="grid gap-5 lg:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.16em]">Leads attendus</p><input value={form.expectedLeads} onChange={(event) => update("expectedLeads", event.target.value)} className="mt-3 h-12 w-full rounded-2xl border border-slate-200 px-4 text-lg font-black outline-none" /></div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.16em]">Conversations</p><input value={form.expectedConversations} onChange={(event) => update("expectedConversations", event.target.value)} className="mt-3 h-12 w-full rounded-2xl border border-slate-200 px-4 text-lg font-black outline-none" /></div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.16em]">Conversions</p><input value={form.expectedConversions} onChange={(event) => update("expectedConversions", event.target.value)} className="mt-3 h-12 w-full rounded-2xl border border-slate-200 px-4 text-lg font-black outline-none" /></div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-black">Objectif, script et preuves</h3>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <label className="lg:col-span-2"><span className="text-[10px] font-black uppercase tracking-[0.16em]">Objectif principal</span><textarea value={form.mainObjective} onChange={(event) => update("mainObjective", event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold outline-none" /></label>
                  <label><span className="text-[10px] font-black uppercase tracking-[0.16em]">Critères de réussite</span><textarea value={form.successCriteria} onChange={(event) => update("successCriteria", event.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold outline-none" /></label>
                  <label><span className="text-[10px] font-black uppercase tracking-[0.16em]">Script / playbook</span><textarea value={form.playbook} onChange={(event) => update("playbook", event.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold outline-none" /></label>
                  <label className="lg:col-span-2"><span className="text-[10px] font-black uppercase tracking-[0.16em]">Instructions opérationnelles</span><textarea value={form.instructions} onChange={(event) => update("instructions", event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold outline-none" /></label>
                </div>
                <div className="mt-4 rounded-3xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em]">Preuves attendues</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {directoryMissionProofs.map((proof) => {
                      const active = form.proofRequirements.includes(proof);
                      return <button key={proof} type="button" onClick={() => toggleProof(proof)} className={cn("rounded-full border px-3 py-2 text-xs font-black", active ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white")}>{proof}</button>;
                    })}
                  </div>
                </div>
              </section>
            </main>

            <aside className="space-y-5">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div><p className="text-[10px] font-black uppercase tracking-[0.16em]">Score dispatch</p><p className="mt-1 text-5xl font-black">{readinessScore}%</p><p className="mt-2 text-sm font-black">{dispatchLabel}</p></div>
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50"><BadgeCheck size={24} /></div>
                </div>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-700" style={{ width: `${readinessScore}%` }} /></div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-[0.14em]">Validation avant lancement</h3>
                <div className="mt-4 space-y-3">
                  {[
                    ["Fit ambassadeur / mission", `${serviceFit}%`],
                    ["Charge actuelle", riskLabel],
                    ["Territoire", `${territoryFit}%`],
                    ["Preuves", `${form.proofRequirements.length} définie(s)`],
                    ["Notification", notificationReady ? "Prête" : "À compléter"],
                  ].map(([label, value]) => <div key={label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold"><span>{label}</span><b>{value}</b></div>)}
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-[0.14em]">Notification ambassadeur</h3>
                <div className="mt-4 space-y-4">
                  <label className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black"><span>Notifier immédiatement</span><input type="checkbox" checked={form.notifyAmbassador} onChange={(event) => update("notifyAmbassador", event.target.checked)} /></label>
                  <label><span className="text-[10px] font-black uppercase tracking-[0.16em]">Canal</span><select value={form.notificationChannel} onChange={(event) => update("notificationChannel", event.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold"><option>WhatsApp</option><option>Email</option><option>Interne seulement</option></select></label>
                  <label><span className="text-[10px] font-black uppercase tracking-[0.16em]">Message pré-rempli</span><textarea value={form.notificationMessage} onChange={(event) => update("notificationMessage", event.target.value)} rows={5} className="mt-2 w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold" /></label>
                </div>
              </section>

              <section className={cn("rounded-3xl border p-5 shadow-sm", blockedReasons.length ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50")}>
                <div className="flex gap-3"><AlertTriangle size={18} /><div><p className="text-sm font-black">{blockedReasons.length ? "Contrôles avant création" : "Mission prête à créer"}</p><p className="mt-2 text-xs font-bold leading-5">{blockedReasons.length ? `Bloqué: ${blockedReasons.join(", ")}` : "Tous les champs critiques sont renseignés. La mission peut être créée et assignée."}</p></div></div>
              </section>
            </aside>
          </div>
        </div>

        <footer className="sticky bottom-0 z-20 border-t border-slate-100 bg-white px-7 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-xs font-bold leading-5"><p>{selectedScenario.label} · {ambassadorName} · {selectedAmbassadorCards.length || 1} ambassadeur(s)</p><p>{blockedReasons.length ? `Bloqué: ${blockedReasons.join(", ")}` : "Prêt pour création et suivi opérationnel."}</p>{message ? <p className={message.type === "success" ? "text-emerald-700" : "text-rose-700"}>{message.text}</p> : null}</div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onClose} className="h-12 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black hover:bg-slate-50">Annuler</button>
              <button type="button" onClick={() => submit("draft")} disabled={savingMode !== null} className="h-12 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black disabled:opacity-50">Enregistrer brouillon</button>
              <button type="button" onClick={() => submit("create")} disabled={savingMode !== null || blockedReasons.length > 0} className="h-12 rounded-2xl bg-blue-700 px-5 text-sm font-black text-white shadow-lg shadow-blue-100 disabled:bg-slate-200">Créer mission</button>
              <button type="button" onClick={() => submit("notify")} disabled={savingMode !== null || blockedReasons.length > 0 || !notificationReady} className="h-12 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white disabled:bg-slate-200">Créer + notifier</button>
              <button type="button" onClick={() => submit("route")} disabled={savingMode !== null || blockedReasons.length > 0} className="h-12 rounded-2xl border border-blue-200 bg-blue-50 px-5 text-sm font-black disabled:opacity-50">Créer + feuille de route</button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

type AmbassadorActivationForm = {
  sourceCandidateId: string;
  sourceCandidateLabel: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  zone: string;
  contactPreference: string;
  source: string;
  sourceOwner: string;
  campaign: string;
  profileType: string;
  level: string;
  status: string;
  languages: string[];
  channels: string[];
  services: string[];
  territoryName: string;
  radius: string;
  managerName: string;
  weeklyCapacity: string;
  leadsGoal: string;
  conversionsGoal: string;
  promoCode: string;
  referralCode: string;
  payoutCycle: string;
  paymentMethod: string;
  paymentAccount: string;
  activationDate: string;
  reviewDate: string;
  notes: string;
  compliance: string[];
};

const ambassadorCities = ["Rabat", "Salé", "Témara", "Casablanca", "Kénitra", "Tanger", "Fès", "Marrakech", "Agadir"];
const ambassadorServices = ["Home Service", "Kindergarten & Preschool", "Academy", "Hospitality Kids Friendly", "Corporates Liner"];
const ambassadorChannels = ["WhatsApp", "Appel", "Terrain", "Partenaires", "Événementiel"];
const ambassadorCompliance = ["Identité vérifiée", "Téléphone vérifié", "Contrat signé", "RIB / paiement vérifié", "Règles commission acceptées", "Code promo généré", "Territoire assigné", "Manager assigné"];

function todayInputDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function promoSlug(value: string) {
  return String(value || "AMB")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .slice(0, 8)
    .toUpperCase() || "AMB";
}

function defaultAmbassadorActivationForm(): AmbassadorActivationForm {
  return {
    sourceCandidateId: "",
    sourceCandidateLabel: "",
    fullName: "",
    phone: "",
    email: "",
    city: "Rabat",
    zone: "Centre / zone prioritaire",
    contactPreference: "WhatsApp",
    source: "Activation directe",
    sourceOwner: "Sara Bakoki",
    campaign: "Ambassadeurs Maroc 2026",
    profileType: "Mixte B2C + WhatsApp",
    level: "Bronze",
    status: "onboarding",
    languages: ["Arabe", "Français"],
    channels: ["WhatsApp", "Terrain"],
    services: ["Home Service"],
    territoryName: "Rabat Centre",
    radius: "5 km",
    managerName: "Sara Bakoki",
    weeklyCapacity: "6h - 10h",
    leadsGoal: "25",
    conversionsGoal: "6",
    promoCode: "",
    referralCode: "",
    payoutCycle: "Mensuel",
    paymentMethod: "Virement bancaire",
    paymentAccount: "",
    activationDate: todayInputDate(0),
    reviewDate: todayInputDate(30),
    notes: "",
    compliance: ["Téléphone vérifié", "Règles commission acceptées", "Code promo généré", "Manager assigné"],
  };
}


function candidateFieldValueForActivation(item: AnyRecord, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return fallback;
}

function candidateNameForActivation(item: AnyRecord) {
  return candidateFieldValueForActivation(item, ["full_name", "fullName", "candidate_name", "candidateName", "name", "contact_name", "display_name"], "Candidat sans nom");
}

function candidatePhoneForActivation(item: AnyRecord) {
  return candidateFieldValueForActivation(item, ["phone", "mobile", "telephone", "tel", "whatsapp", "contact_phone"]);
}

function candidateEmailForActivation(item: AnyRecord) {
  return candidateFieldValueForActivation(item, ["email", "contact_email", "mail"]);
}

function candidateCityForActivation(item: AnyRecord) {
  return candidateFieldValueForActivation(item, ["city", "ville", "region", "location", "territory_city"], "Rabat");
}

function candidateZoneForActivation(item: AnyRecord) {
  return candidateFieldValueForActivation(item, ["zone", "quartier", "district", "neighborhood", "territory_name", "territory"], "Centre / zone prioritaire");
}

function candidateStageForActivation(item: AnyRecord) {
  return candidateFieldValueForActivation(item, ["stage", "status", "pipeline_stage", "recruitment_stage", "step"], "candidat");
}

function candidateSourceForActivation(item: AnyRecord) {
  return candidateFieldValueForActivation(item, ["source", "channel", "origin", "acquisition_source"], "Candidat validé");
}

function candidateCampaignForActivation(item: AnyRecord) {
  return candidateFieldValueForActivation(item, ["campaign", "campaign_name", "source_campaign"], "Ambassadeurs Maroc 2026");
}

function candidateAvailabilityForActivation(item: AnyRecord) {
  return candidateFieldValueForActivation(item, ["availability", "disponibilite", "weekly_capacity", "capacity"], "À confirmer");
}

function candidateScoreForActivation(item: AnyRecord) {
  return numberValue(item?.score ?? item?.prequalification_score ?? item?.qualification_score ?? item?.readiness_score ?? item?.performance_score ?? 0);
}

function candidateLanguageListForActivation(item: AnyRecord) {
  const raw = item?.languages ?? item?.langues ?? item?.language ?? item?.preferred_languages;
  if (Array.isArray(raw)) return raw.map((value) => String(value)).filter(Boolean);
  const text = String(raw || "").toLowerCase();
  const languages = [];
  if (text.includes("arab") || text.includes("darija")) languages.push("Arabe");
  if (text.includes("fr")) languages.push("Français");
  if (text.includes("ang") || text.includes("en")) languages.push("Anglais");
  if (text.includes("amazigh")) languages.push("Amazigh");
  return languages;
}

function candidateOptionKeyForActivation(item: AnyRecord, index: number) {
  return String(item?.id || item?.uuid || item?.record_id || item?.candidate_id || item?.recruitment_id || "candidate-" + index);
}

function AmbassadorActivationEnterpriseModal({
  open,
  snapshot,
  onClose,
  onCreated,
}: {
  open: boolean;
  snapshot: AmbassadorWorkspaceSnapshot;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<AmbassadorActivationForm>(() => defaultAmbassadorActivationForm());
  const [autoPromo, setAutoPromo] = useState(true);
  const [savingMode, setSavingMode] = useState<"draft" | "create" | "activate" | "onboarding" | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const existingPhones = useMemo(() => new Set((snapshot.ambassadors || []).map((item: AnyRecord) => normalizePhone(item.phone)).filter(Boolean)), [snapshot.ambassadors]);
  const territories = (snapshot.territories || []) as AnyRecord[];
  const managers = Array.from(new Set(["Sara Bakoki", "Yassine El Alaoui", "Amine Benkirane", "Sanae El Amrani", ...((snapshot.ambassadors || []).map((item: AnyRecord) => item.manager_name).filter(Boolean) as string[])]));
  const candidateOptions = useMemo(() => {
    const rawCandidates = [
      ...(((snapshot.recruitment || []) as AnyRecord[])),
      ...(((snapshot.candidates || []) as AnyRecord[])),
    ];
    const seen = new Set<string>();
    return rawCandidates
      .map((item, index) => {
        const key = candidateOptionKeyForActivation(item, index);
        const name = candidateNameForActivation(item);
        const phone = candidatePhoneForActivation(item);
        const city = candidateCityForActivation(item);
        const stage = candidateStageForActivation(item);
        const normalizedPhone = normalizePhone(phone);
        const dedupeKey = normalizedPhone || key;
        return { key, dedupeKey, raw: item, name, phone, city, stage, score: candidateScoreForActivation(item), label: [name, city, phone].filter(Boolean).join(" · ") };
      })
      .filter((item) => {
        if (!item.name || seen.has(item.dedupeKey)) return false;
        seen.add(item.dedupeKey);
        return true;
      })
      .slice(0, 80);
  }, [snapshot]);
  const selectedCandidate = candidateOptions.find((item) => item.key === form.sourceCandidateId) || null;

  if (!open) return null;

  const phoneDuplicate = Boolean(form.phone && existingPhones.has(normalizePhone(form.phone)));
  const missingCore = [
    ["Nom complet", form.fullName],
    ["Téléphone", form.phone],
    ["Ville", form.city],
    ["Code promo", form.promoCode],
  ].filter(([, value]) => !String(value || "").trim()).map(([label]) => String(label));
  const missingActivation = [
    ["Territoire", form.territoryName],
    ["Manager", form.managerName],
    ["Cycle de payout", form.payoutCycle],
    ["Canaux autorisés", form.channels.length ? "ok" : ""],
    ["Services autorisés", form.services.length ? "ok" : ""],
  ].filter(([, value]) => !String(value || "").trim()).map(([label]) => String(label));
  const complianceScore = Math.round((form.compliance.length / ambassadorCompliance.length) * 100);
  const readiness = Math.max(12, Math.min(100, Math.round(
    (missingCore.length === 0 ? 24 : 8) +
    (missingActivation.length === 0 ? 22 : 7) +
    (form.services.length >= 2 ? 14 : form.services.length ? 8 : 0) +
    (form.channels.length >= 3 ? 12 : form.channels.length ? 7 : 0) +
    Math.min(12, Number(form.leadsGoal || 0) / 3) +
    Math.min(8, Number(form.conversionsGoal || 0)) +
    Math.round(complianceScore * 0.08)
  )));
  const blockedReasons = [...missingCore, ...(form.status === "active" ? missingActivation : [])];
  const selectedTerritory = territories.find((item) => String(item.name || item.territory_name || "").toLowerCase() === form.territoryName.toLowerCase());
  const territoryLoad = numberValue(selectedTerritory?.active_ambassadors_count ?? 0);
  const territoryRisk = territoryLoad >= 5 ? "Territoire chargé" : territoryLoad >= 3 ? "Charge à surveiller" : "Capacité disponible";

  function update<K extends keyof AmbassadorActivationForm>(key: K, value: AmbassadorActivationForm[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if ((key === "fullName" || key === "city") && autoPromo) {
        const cityCode = promoSlug(String(next.city || "MA")).slice(0, 3);
        next.promoCode = `AC-${promoSlug(next.fullName)}-${cityCode}`;
        next.referralCode = `REF-${promoSlug(next.fullName)}-${cityCode}`;
      }
      return next;
    });
  }

  function toggleList(key: "languages" | "channels" | "services" | "compliance", value: string) {
    setForm((current) => {
      const existing = current[key];
      const nextValues = existing.includes(value) ? existing.filter((item) => item !== value) : [...existing, value];
      return { ...current, [key]: nextValues };
    });
  }

  function applyCandidateSelection(candidateKey: string) {
    if (!candidateKey) {
      setForm((current) => ({ ...current, sourceCandidateId: "", sourceCandidateLabel: "" }));
      return;
    }

    const selected = candidateOptions.find((item) => item.key === candidateKey);
    if (!selected) return;

    const item = selected.raw;
    const importedLanguages = candidateLanguageListForActivation(item);
    const importedCity = candidateCityForActivation(item);
    const importedName = candidateNameForActivation(item);
    const importedZone = candidateZoneForActivation(item);
    const importedPhone = candidatePhoneForActivation(item);
    const importedEmail = candidateEmailForActivation(item);
    const importedCampaign = candidateCampaignForActivation(item);
    const importedAvailability = candidateAvailabilityForActivation(item);

    setAutoPromo(true);
    setMessage(null);
    setForm((current) => {
      const cityCode = promoSlug(importedCity || current.city || "MA").slice(0, 3);
      const nameCode = promoSlug(importedName || current.fullName || "AMB");
      return {
        ...current,
        sourceCandidateId: selected.key,
        sourceCandidateLabel: selected.label,
        fullName: importedName || current.fullName,
        phone: importedPhone || current.phone,
        email: importedEmail || current.email,
        city: importedCity || current.city,
        zone: importedZone || current.zone,
        source: "Candidat validé",
        sourceOwner: candidateFieldValueForActivation(item, ["owner_name", "manager_name", "assignee_name", "responsible_name"], current.sourceOwner),
        campaign: importedCampaign || current.campaign,
        weeklyCapacity: importedAvailability || current.weeklyCapacity,
        languages: importedLanguages.length ? Array.from(new Set([...importedLanguages, ...current.languages])) : current.languages,
        status: current.status === "active" ? current.status : "onboarding",
        promoCode: `AC-${nameCode}-${cityCode}`,
        referralCode: `REF-${nameCode}-${cityCode}`,
        notes: current.notes || `Pré-rempli depuis le candidat: ${selected.label}. Compléter territoire, payout, services et conformité avant activation.`,
        compliance: Array.from(new Set([...current.compliance, "Code promo généré"])),
      };
    });
  }

  async function submit(mode: "draft" | "create" | "activate" | "onboarding") {
    setMessage(null);
    const required = mode === "activate" ? [...missingCore, ...missingActivation] : missingCore;
    if (required.length) {
      setMessage({ type: "error", text: `Bloqué: ${required.join(", ")}` });
      return;
    }
    if (phoneDuplicate) {
      setMessage({ type: "error", text: "Un ambassadeur existe déjà avec ce numéro. Vérifiez le dossier avant activation." });
      return;
    }

    setSavingMode(mode);
    try {
      const status = mode === "draft" ? "onboarding" : mode === "activate" ? "active" : form.status || "onboarding";
      const payload = {
        full_name: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        city: form.city,
        region: form.city,
        zone: form.zone,
        role: "ambassador",
        title: `Ambassadeur ${form.profileType}`,
        profile_type: form.profileType,
        status,
        lifecycle_stage: status,
        territory_name: form.territoryName,
        manager_name: form.managerName,
        performance_score: readiness,
        kpi_score: readiness,
        missions_assigned: 0,
        missions_completed: 0,
        leads_generated: 0,
        hot_leads: 0,
        meetings_booked: 0,
        incentives_balance: 0,
        certification_status: mode === "activate" ? "ready" : "pending",
        source: form.source,
        notes: JSON.stringify({
          activation_source: "directory_enterprise_activation_modal",
          source_candidate_id: form.sourceCandidateId,
          source_candidate_label: form.sourceCandidateLabel,
          source_owner: form.sourceOwner,
          campaign: form.campaign,
          contact_preference: form.contactPreference,
          level: form.level,
          languages: form.languages,
          authorized_channels: form.channels,
          authorized_services: form.services,
          radius: form.radius,
          weekly_capacity: form.weeklyCapacity,
          monthly_leads_goal: form.leadsGoal,
          monthly_conversions_goal: form.conversionsGoal,
          commission_policy: "fixed_10_percent",
          commission_rate: 10,
          promo_code: form.promoCode,
          referral_code: form.referralCode,
          payout_cycle: form.payoutCycle,
          payment_method: form.paymentMethod,
          payment_account: form.paymentAccount,
          activation_date: form.activationDate,
          review_date: form.reviewDate,
          compliance: form.compliance,
          readiness_score: readiness,
          operator_notes: form.notes,
        }),
      };

      const response = await fetch("/api/market-os/ambassadors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.ok === false) throw new Error(data?.error || "Création ambassadeur impossible");
      setMessage({ type: "success", text: mode === "activate" ? "Ambassadeur créé et activé avec succès." : "Ambassadeur créé avec succès. Le dossier réseau est synchronisé." });
      onCreated();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erreur de synchronisation" });
    } finally {
      setSavingMode(null);
    }
  }

  const summaryRows = [
    ["Commission", "10% fixe"],
    ["Payout", form.payoutCycle || "À définir"],
    ["Code promo", form.promoCode || "À générer"],
    ["Territoire", form.territoryName || "À définir"],
    ["Services", `${form.services.length} autorisé(s)`],
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/35 px-3 py-3 backdrop-blur-sm">
      <form onSubmit={(event: FormEvent) => { event.preventDefault(); void submit("create"); }} className="flex max-h-[calc(100vh-28px)] w-[calc(100vw-28px)] max-w-[1640px] flex-col overflow-hidden rounded-[34px] border border-slate-200 bg-white text-slate-950 shadow-2xl shadow-slate-950/25 [&_*]:!text-slate-950">
        <header className="sticky top-0 z-20 border-b border-slate-100 bg-white px-7 py-5">
          <div className="flex items-start justify-between gap-5">
            <div className="flex gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-blue-100 bg-blue-50"><UserPlus size={24} /></div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black tracking-tight">Ajouter ambassadeur</h2>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]">Activation réseau</span>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]">Commission 10%</span>
                </div>
                <p className="mt-2 max-w-5xl text-sm font-bold leading-6">Créez un ambassadeur opérationnel avec territoire, manager, canaux autorisés, code promo, payout et conformité d’activation.</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50"><X size={18} /></button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-6">
          <div className="grid gap-5 xl:grid-cols-[1fr_1.12fr_0.95fr]">
            <section className="space-y-5">
              <ActivationPanel title="0. Depuis un candidat existant" badge="Pré-remplissage">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em]">Sélectionner un candidat existant</span>
                  <select
                    value={form.sourceCandidateId}
                    onChange={(event) => applyCandidateSelection(event.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">Créer sans candidat existant</option>
                    {candidateOptions.map((candidate) => (
                      <option key={candidate.key} value={candidate.key}>{candidate.label}</option>
                    ))}
                  </select>
                </label>
                <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black">Importer les données candidat</p>
                      <p className="mt-1 text-xs font-bold leading-5">Le choix d’un candidat pré-remplit nom, téléphone, email, ville, zone, source, campagne, disponibilité, langues et codes. Le reste du dossier ambassadeur reste à compléter manuellement.</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black">{candidateOptions.length} candidat(s)</span>
                  </div>
                </div>
                {selectedCandidate ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em]">Candidat chargé</p>
                      <p className="mt-2 text-sm font-black">{selectedCandidate.name}</p>
                      <p className="mt-1 text-xs font-bold">{selectedCandidate.phone || "Téléphone à vérifier"}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em]">Ville & étape</p>
                      <p className="mt-2 text-sm font-black">{selectedCandidate.city}</p>
                      <p className="mt-1 text-xs font-bold capitalize">{selectedCandidate.stage}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em]">Score candidat</p>
                      <p className="mt-2 text-sm font-black">{selectedCandidate.score ? String(selectedCandidate.score) + "%" : "À qualifier"}</p>
                      <p className="mt-1 text-xs font-bold">Pré-remplissage actif</p>
                    </div>
                  </div>
                ) : null}
              </ActivationPanel>

              <ActivationPanel title="1. Identité & profil officiel" badge="Dossier réseau">
                <div className="grid gap-3 sm:grid-cols-2">
                  <ActivationInput label="Nom complet *" value={form.fullName} onChange={(value) => update("fullName", value)} placeholder="Ex: Amine Benkirane" />
                  <ActivationInput label="Téléphone *" value={form.phone} onChange={(value) => update("phone", value)} placeholder="+212 6 ..." />
                  <ActivationInput label="Email" value={form.email} onChange={(value) => update("email", value)} placeholder="email@exemple.com" />
                  <ActivationSelect label="Ville principale *" value={form.city} onChange={(value) => update("city", value)} options={ambassadorCities} />
                  <ActivationInput label="Quartier / zone" value={form.zone} onChange={(value) => update("zone", value)} />
                  <ActivationSelect label="Canal préféré" value={form.contactPreference} onChange={(value) => update("contactPreference", value)} options={["WhatsApp", "Appel", "Email"]} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <ActivationSelect label="Type ambassadeur" value={form.profileType} onChange={(value) => update("profileType", value)} options={["B2C terrain", "WhatsApp / digital", "B2B", "B2C", "Mixte B2C + WhatsApp", "Mixte B2B + B2C"]} />
                  <ActivationSelect label="Niveau initial" value={form.level} onChange={(value) => update("level", value)} options={["Bronze", "Argent", "Or", "Platine"]} />
                  <ActivationSelect label="Statut d’activation" value={form.status} onChange={(value) => update("status", value)} options={["onboarding", "active", "inactive", "at_risk"]} />
                  <ActivationSelect label="Source" value={form.source} onChange={(value) => update("source", value)} options={["Activation directe", "Candidat validé", "Recommandation", "Instagram", "Terrain", "Partenaire", "Événement"]} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <ActivationInput label="Responsable source" value={form.sourceOwner} onChange={(value) => update("sourceOwner", value)} />
                  <ActivationInput label="Campagne associée" value={form.campaign} onChange={(value) => update("campaign", value)} />
                </div>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em]">Langues opérationnelles</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Arabe", "Français", "Anglais", "Amazigh"].map((item) => <ActivationChip key={item} active={form.languages.includes(item)} onClick={() => toggleList("languages", item)}>{item}</ActivationChip>)}
                  </div>
                </div>
              </ActivationPanel>

              <ActivationPanel title="2. Tracking commercial" badge="Code & source">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <ActivationInput label="Code promo personnel *" value={form.promoCode} onChange={(value) => { setAutoPromo(false); update("promoCode", value.toUpperCase()); }} placeholder="AC-AMINE-RAB" />
                  <button type="button" onClick={() => { setAutoPromo(true); update("promoCode", `AC-${promoSlug(form.fullName)}-${promoSlug(form.city).slice(0, 3)}`); }} className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black hover:bg-blue-100">Générer</button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <ActivationInput label="Code referral" value={form.referralCode} onChange={(value) => update("referralCode", value.toUpperCase())} />
                  <ActivationInput label="Date activation" type="date" value={form.activationDate} onChange={(value) => update("activationDate", value)} />
                </div>
              </ActivationPanel>
            </section>

            <section className="space-y-5">
              <ActivationPanel title="3. Affectation opérationnelle" badge="Territoire & manager">
                <div className="grid gap-3 sm:grid-cols-2">
                  <ActivationInput label="Territoire / zone *" value={form.territoryName} onChange={(value) => update("territoryName", value)} list="ambassador-territory-options" />
                  <datalist id="ambassador-territory-options">{territories.map((item) => <option key={item.id || item.name} value={item.name || item.territory_name || item.zone} />)}</datalist>
                  <ActivationSelect label="Rayon d’action" value={form.radius} onChange={(value) => update("radius", value)} options={["3 km", "5 km", "10 km", "Ville complète"]} />
                  <ActivationSelect label="Manager assigné *" value={form.managerName} onChange={(value) => update("managerName", value)} options={managers.length ? managers : ["Sara Bakoki"]} />
                  <ActivationSelect label="Capacité hebdomadaire" value={form.weeklyCapacity} onChange={(value) => update("weeklyCapacity", value)} options={["3h - 5h", "6h - 10h", "10h - 15h", "15h+", "À confirmer"]} />
                  <ActivationInput label="Date de revue" type="date" value={form.reviewDate} onChange={(value) => update("reviewDate", value)} />
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em]">Canaux autorisés</p>
                    <div className="mt-3 flex flex-wrap gap-2">{ambassadorChannels.map((item) => <ActivationChip key={item} active={form.channels.includes(item)} onClick={() => toggleList("channels", item)}>{item}</ActivationChip>)}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em]">Services autorisés</p>
                    <div className="mt-3 flex flex-wrap gap-2">{ambassadorServices.map((item) => <ActivationChip key={item} active={form.services.includes(item)} onClick={() => toggleList("services", item)}>{item}</ActivationChip>)}</div>
                  </div>
                </div>
              </ActivationPanel>

              <ActivationPanel title="4. Commission, payout & objectifs" badge="Finance contrôlée">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <ActivationInput label="Commission" value="10% fixe" onChange={() => undefined} disabled />
                  <ActivationSelect label="Cycle payout *" value={form.payoutCycle} onChange={(value) => update("payoutCycle", value)} options={["Hebdomadaire", "Bimensuel", "Mensuel"]} />
                  <ActivationSelect label="Méthode paiement" value={form.paymentMethod} onChange={(value) => update("paymentMethod", value)} options={["Virement bancaire", "Mobile money", "Espèces contrôlées"]} />
                  <ActivationInput label="Compte / RIB" value={form.paymentAccount} onChange={(value) => update("paymentAccount", value)} placeholder="RIB ou référence" />
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <ActivationInput label="Objectif mensuel leads" value={form.leadsGoal} onChange={(value) => update("leadsGoal", value)} />
                  <ActivationInput label="Objectif mensuel conversions" value={form.conversionsGoal} onChange={(value) => update("conversionsGoal", value)} />
                </div>
                <ActivationTextarea label="Notes opérationnelles" value={form.notes} onChange={(value) => update("notes", value)} placeholder="Contexte, disponibilité, risque, première mission recommandée..." />
              </ActivationPanel>
            </section>

            <aside className="space-y-5">
              <section className="rounded-[28px] border border-blue-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em]">Score activation</p>
                    <p className="mt-2 text-4xl font-black">{readiness}%</p>
                    <p className="mt-1 text-sm font-bold">{readiness >= 82 ? "Prêt à activer" : readiness >= 62 ? "Activation possible avec contrôles" : "À compléter avant activation"}</p>
                  </div>
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50"><ShieldCheck size={24} /></div>
                </div>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"><div className={cn("h-full rounded-full", readiness >= 80 ? "bg-emerald-500" : readiness >= 60 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${readiness}%` }} /></div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-black">Résumé d’activation</h3>
                <div className="mt-4 space-y-3">{summaryRows.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3"><span className="text-xs font-black uppercase tracking-[0.12em]">{label}</span><b className="text-sm">{value}</b></div>)}</div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-black">Conformité d’activation</h3><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black">{form.compliance.length}/{ambassadorCompliance.length}</span></div>
                <div className="mt-4 space-y-2">{ambassadorCompliance.map((item) => <button key={item} type="button" onClick={() => toggleList("compliance", item)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-left text-sm font-bold hover:bg-blue-50"><span className={cn("grid h-6 w-6 place-items-center rounded-full border", form.compliance.includes(item) ? "border-emerald-300 bg-emerald-100" : "border-slate-300 bg-white")}>{form.compliance.includes(item) ? <CheckCircle2 size={14} /> : null}</span>{item}</button>)}</div>
              </section>

              <section className={cn("rounded-[28px] border p-5 shadow-sm", blockedReasons.length || phoneDuplicate ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50")}>
                <div className="flex gap-3"><AlertTriangle size={20} /><div><h3 className="text-sm font-black">Contrôles avant création</h3><p className="mt-2 text-sm font-bold">{phoneDuplicate ? "Doublon téléphone détecté." : blockedReasons.length ? `Bloqué: ${blockedReasons.join(", ")}` : "Dossier prêt pour création."}</p><p className="mt-2 text-xs font-black">Territoire: {territoryRisk}</p></div></div>
              </section>

              {message ? <section className={cn("rounded-[24px] border p-4 text-sm font-black", message.type === "success" ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50")}>{message.text}</section> : null}
            </aside>
          </div>
        </div>

        <footer className="sticky bottom-0 z-20 border-t border-slate-100 bg-white px-7 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-black leading-5">
              <p>{form.fullName || "Nouvel ambassadeur"} · {form.city} · {form.profileType}</p>
              <p>{blockedReasons.length ? `Bloqué: ${blockedReasons.join(", ")}` : "Prêt pour création réseau."}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black hover:bg-slate-50">Annuler</button>
              <button type="button" onClick={() => void submit("draft")} disabled={!!savingMode} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black hover:bg-slate-50 disabled:opacity-50">{savingMode === "draft" ? "Enregistrement..." : "Enregistrer brouillon"}</button>
              <button type="submit" disabled={!!savingMode || missingCore.length > 0 || phoneDuplicate} className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 hover:bg-blue-800 disabled:bg-slate-200 disabled:shadow-none">{savingMode === "create" ? "Création..." : "Créer ambassadeur"}</button>
              <button type="button" onClick={() => void submit("activate")} disabled={!!savingMode || blockedReasons.length > 0 || phoneDuplicate} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 disabled:bg-slate-200 disabled:shadow-none">{savingMode === "activate" ? "Activation..." : "Créer + activer"}</button>
              <button type="button" onClick={() => void submit("onboarding")} disabled={!!savingMode || missingCore.length > 0 || phoneDuplicate} className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black hover:bg-blue-100 disabled:opacity-50">Créer + envoyer onboarding</button>
            </div>
          </div>
        </footer>
      </form>
    </div>
  );
}

function ActivationPanel({ title, badge, children }: { title: string; badge: string; children: ReactNode }) {
  return <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-base font-black">{title}</h3><span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em]">{badge}</span></div>{children}</section>;
}

function ActivationInput({ label, value, onChange, placeholder, type = "text", disabled, list }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; disabled?: boolean; list?: string }) {
  return <label className="block"><span className="text-[10px] font-black uppercase tracking-[0.16em]">{label}</span><input type={type} value={value} list={list} disabled={disabled} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none placeholder:!text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100" /></label>;
}

function ActivationSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="block"><span className="text-[10px] font-black uppercase tracking-[0.16em]">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100">{options.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>;
}

function ActivationTextarea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="mt-3 block"><span className="text-[10px] font-black uppercase tracking-[0.16em]">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none placeholder:!text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-100" /></label>;
}

function ActivationChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" onClick={onClick} className={cn("rounded-full border px-3 py-2 text-xs font-black transition", active ? "border-blue-300 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50")}>{children}</button>;
}

type TerritoryAssignmentForm = {
  ambassadorId: string;
  ambassadorName: string;
  city: string;
  region: string;
  commune: string;
  district: string;
  territoryName: string;
  assignmentMode: string;
  assignmentSource: string;
  radius: string;
  startDate: string;
  reviewDate: string;
  managerName: string;
  services: string[];
  channels: string[];
  monthlyLeadTarget: string;
  monthlyConversionTarget: string;
  fieldVisitTarget: string;
  partnerTarget: string;
  slaContact: string;
  slaFollowup: string;
  slaClosure: string;
  reportingFrequency: string;
  proofRequirements: string[];
  approvalManager: string;
  approvalStatus: string;
  notes: string;
};

const territoryCities = ["Rabat", "Salé", "Témara", "Casablanca", "Kénitra", "Tanger", "Fès", "Marrakech", "Agadir"];
const territoryServices = ["Home Service", "Kindergarten & Preschool", "Academy", "Hospitality Kids Friendly", "Corporates Liner"];
const territoryChannels = ["WhatsApp", "Appel", "Terrain", "Partenaires", "Événementiel", "B2B direct"];
const territoryProofRequirements = ["Photo terrain", "Liste contacts", "Capture WhatsApp", "Formulaire lead", "Note partenaire", "Compte rendu mission"];
const territoryAssignmentModes = ["Exclusif", "Partagé", "Secondaire", "Backup", "Prospection seulement"];
const territorySources = ["Nouvelle activation ambassadeur", "Rééquilibrage territoire", "Renfort zone sous-couverte", "Remplacement temporaire", "Expansion commerciale"];

function territoryInputDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function defaultTerritoryAssignmentForm(ambassador?: AnyRecord | null): TerritoryAssignmentForm {
  const city = String(ambassador?.city || ambassador?.region || "Rabat");
  const name = String(ambassador?.full_name || ambassador?.name || "");
  return {
    ambassadorId: String(ambassador?.id || ""),
    ambassadorName: name,
    city,
    region: city === "Casablanca" ? "Casablanca-Settat" : city === "Rabat" || city === "Salé" || city === "Témara" ? "Rabat-Salé-Kénitra" : city,
    commune: city,
    district: String(ambassador?.zone || ambassador?.district || "Centre / zone prioritaire"),
    territoryName: String(ambassador?.territory_name || ambassador?.territory || `${city} Centre`),
    assignmentMode: "Partagé",
    assignmentSource: "Renfort zone sous-couverte",
    radius: "5 km",
    startDate: territoryInputDate(0),
    reviewDate: territoryInputDate(90),
    managerName: String(ambassador?.manager_name || "Sara Bakoki"),
    services: ["Home Service"],
    channels: ["WhatsApp", "Terrain"],
    monthlyLeadTarget: "48",
    monthlyConversionTarget: "6",
    fieldVisitTarget: "8",
    partnerTarget: "4",
    slaContact: "24h",
    slaFollowup: "48h",
    slaClosure: "7 jours",
    reportingFrequency: "Hebdomadaire",
    proofRequirements: ["Liste contacts", "Capture WhatsApp", "Compte rendu mission"],
    approvalManager: String(ambassador?.manager_name || "Sara Bakoki"),
    approvalStatus: "En attente",
    notes: "Affectation à valider selon la capacité terrain, la couverture locale et les objectifs de prospection du mois.",
  };
}

function AmbassadorTerritoryAssignmentEnterpriseModal({
  open,
  selectedAmbassador,
  snapshot,
  onClose,
  onAssigned,
}: {
  open: boolean;
  selectedAmbassador?: AnyRecord | null;
  snapshot: AmbassadorWorkspaceSnapshot;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [form, setForm] = useState<TerritoryAssignmentForm>(() => defaultTerritoryAssignmentForm(selectedAmbassador));
  const [savingMode, setSavingMode] = useState<"draft" | "submit" | "assign" | "mission" | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const ambassadors = ((snapshot.ambassadors || []) as AnyRecord[]).filter((item) => String(item.status || "") !== "archived");
  const territories = ((snapshot.territories || []) as AnyRecord[]);
  const managers = Array.from(new Set(["Sara Bakoki", "Yassine El Alaoui", "Amine Benkirane", ...ambassadors.map((item) => item.manager_name).filter(Boolean)]));
  const selected = ambassadors.find((item) => String(item.id) === form.ambassadorId) || selectedAmbassador || null;
  const selectedTerritory = territories.find((item) => String(item.name || item.territory_name || item.zone || "").toLowerCase() === form.territoryName.toLowerCase());
  const cityAmbassadors = ambassadors.filter((item) => String(item.city || item.region || "").toLowerCase() === form.city.toLowerCase());
  const territoryLoad = numberValue(selectedTerritory?.active_ambassadors_count ?? cityAmbassadors.length ?? 0);
  const coverage = Math.max(12, Math.min(94, Number(selectedTerritory?.coverage_rate ?? selectedTerritory?.coverage ?? (territoryLoad ? 38 + territoryLoad * 8 : 26))));
  const projectedLoad = Math.min(100, Math.round(territoryLoad * 12 + Number(form.monthlyLeadTarget || 0) * 0.8 + Number(form.fieldVisitTarget || 0) * 2));
  const highPotential = Number(form.monthlyLeadTarget || 0) >= 45 || form.services.includes("Corporates Liner") || form.services.includes("Hospitality Kids Friendly");
  const exclusiveNeedsApproval = form.assignmentMode === "Exclusif" || highPotential || projectedLoad >= 78;

  if (!open) return null;

  const missingCore = [
    ["Ambassadeur", form.ambassadorId],
    ["Ville", form.city],
    ["Quartier / secteur", form.district],
    ["Territoire", form.territoryName],
    ["Manager", form.managerName],
    ["Date de revue", form.reviewDate],
    ["Services autorisés", form.services.length ? "ok" : ""],
    ["Canaux autorisés", form.channels.length ? "ok" : ""],
  ].filter(([, value]) => !String(value || "").trim()).map(([label]) => String(label));
  const missingApproval = exclusiveNeedsApproval && !form.approvalManager ? ["Approbateur manager"] : [];
  const blockedReasons = [...missingCore, ...missingApproval];
  const score = Math.max(18, Math.min(100, Math.round(
    (missingCore.length === 0 ? 28 : 8) +
    (form.services.length >= 2 ? 14 : form.services.length ? 8 : 0) +
    (form.channels.length >= 3 ? 14 : form.channels.length ? 8 : 0) +
    (coverage < 50 ? 16 : coverage < 75 ? 10 : 6) +
    (projectedLoad < 70 ? 14 : projectedLoad < 90 ? 8 : 2) +
    (form.proofRequirements.length >= 3 ? 10 : 5) +
    (form.reviewDate ? 8 : 0)
  )));
  const readinessLabel = score >= 82 ? "Affectation recommandée" : score >= 64 ? "Affectation possible avec contrôle" : "À compléter avant affectation";
  const territoryRisk = projectedLoad >= 90 ? "Surcharge probable" : projectedLoad >= 72 ? "Charge à surveiller" : "Capacité compatible";
  const conflictSignal = form.assignmentMode === "Exclusif" && territoryLoad > 0 ? "Conflit possible avec affectation existante" : "Aucun conflit exclusif critique détecté";

  function update<K extends keyof TerritoryAssignmentForm>(key: K, value: TerritoryAssignmentForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleList(key: "services" | "channels" | "proofRequirements", value: string) {
    setForm((current) => {
      const existing = current[key];
      const nextValues = existing.includes(value) ? existing.filter((item) => item !== value) : [...existing, value];
      return { ...current, [key]: nextValues };
    });
  }

  function loadAmbassador(ambassadorId: string) {
    const ambassador = ambassadors.find((item) => String(item.id) === ambassadorId);
    if (!ambassador) {
      update("ambassadorId", ambassadorId);
      return;
    }
    setForm((current) => ({
      ...current,
      ambassadorId: String(ambassador.id),
      ambassadorName: String(ambassador.full_name || ambassador.name || ""),
      city: String(ambassador.city || ambassador.region || current.city),
      region: String(ambassador.region || ambassador.city || current.region),
      district: String(ambassador.zone || ambassador.district || current.district),
      territoryName: String(ambassador.territory_name || ambassador.territory || current.territoryName),
      managerName: String(ambassador.manager_name || current.managerName),
      approvalManager: String(ambassador.manager_name || current.approvalManager),
    }));
  }

  async function submit(mode: "draft" | "submit" | "assign" | "mission") {
    setMessage(null);
    if ((mode === "assign" || mode === "mission") && blockedReasons.length) {
      setMessage({ type: "error", text: `Bloqué: ${blockedReasons.join(", ")}` });
      return;
    }

    setSavingMode(mode);
    try {
      const payload = {
        action: mode === "draft" ? "draft_territory_assignment" : "assign_ambassador_territory",
        operation: "assign_territory",
        entity_type: "territory_assignment",
        ambassador_id: form.ambassadorId,
        territory_id: selectedTerritory?.id || null,
        territory_name: form.territoryName,
        city: form.city,
        region: form.region,
        commune: form.commune,
        district: form.district,
        assignment_mode: form.assignmentMode,
        assignment_source: form.assignmentSource,
        radius: form.radius,
        start_date: form.startDate,
        review_date: form.reviewDate,
        manager_name: form.managerName,
        authorized_services: form.services,
        authorized_channels: form.channels,
        monthly_lead_target: Number(form.monthlyLeadTarget || 0),
        monthly_conversion_target: Number(form.monthlyConversionTarget || 0),
        field_visit_target: Number(form.fieldVisitTarget || 0),
        partner_target: Number(form.partnerTarget || 0),
        sla_contact: form.slaContact,
        sla_followup: form.slaFollowup,
        sla_closure: form.slaClosure,
        reporting_frequency: form.reportingFrequency,
        proof_requirements: form.proofRequirements,
        approval_manager: form.approvalManager,
        approval_status: mode === "submit" ? "pending_approval" : mode === "assign" || mode === "mission" ? "approved" : form.approvalStatus,
        readiness_score: score,
        coverage_rate: coverage,
        projected_load: projectedLoad,
        notes: form.notes,
        create_first_mission: mode === "mission",
      };

      const response = await fetch("/api/market-os/ambassadors/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.ok === false) throw new Error(data?.error || "Affectation territoire impossible avec l’infrastructure actuelle");
      setMessage({ type: "success", text: mode === "mission" ? "Territoire affecté et première mission demandée." : mode === "submit" ? "Affectation soumise pour approbation manager." : mode === "draft" ? "Brouillon d’affectation enregistré." : "Territoire affecté avec succès." });
      onAssigned();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erreur de synchronisation territoire" });
    } finally {
      setSavingMode(null);
    }
  }

  const summaryRows = [
    ["Ambassadeur", selected?.full_name || selected?.name || form.ambassadorName || "À sélectionner"],
    ["Mode", form.assignmentMode],
    ["Territoire", form.territoryName || "À définir"],
    ["Couverture", `${coverage}%`],
    ["Charge projetée", `${projectedLoad}%`],
    ["Services", `${form.services.length} autorisé(s)`],
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/35 px-3 py-3 backdrop-blur-sm">
      <form onSubmit={(event: FormEvent) => { event.preventDefault(); void submit("assign"); }} className="flex max-h-[calc(100vh-28px)] w-[calc(100vw-28px)] max-w-[1680px] flex-col overflow-hidden rounded-[34px] border border-slate-200 bg-white text-slate-950 shadow-2xl shadow-slate-950/25 [&_*]:!text-slate-950">
        <header className="sticky top-0 z-20 border-b border-slate-100 bg-white px-7 py-5">
          <div className="flex items-start justify-between gap-5">
            <div className="flex gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-cyan-100 bg-cyan-50"><MapPinned size={24} /></div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black tracking-tight">Affecter un territoire</h2>
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]">Couverture terrain</span>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]">Capacité & validation</span>
                </div>
                <p className="mt-2 max-w-5xl text-sm font-bold leading-6">Planifiez une affectation de zone avec services autorisés, charge projetée, SLA, preuves terrain et circuit d’approbation manager.</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50"><X size={18} /></button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-6">
          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.12fr_0.95fr]">
            <section className="space-y-5">
              <TerritoryPanel title="1. Ambassadeur & zone" badge="Sélection opérationnelle">
                <TerritorySelect label="Ambassadeur assigné *" value={form.ambassadorId} onChange={loadAmbassador} options={["", ...ambassadors.map((item) => String(item.id))]} optionLabels={{ "": "Sélectionner un ambassadeur", ...Object.fromEntries(ambassadors.map((item) => [String(item.id), `${item.full_name || item.name || "Ambassadeur"} · ${item.city || "Maroc"}`])) }} />
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <TerritorySelect label="Ville *" value={form.city} onChange={(value) => update("city", value)} options={territoryCities} />
                  <TerritoryInput label="Région" value={form.region} onChange={(value) => update("region", value)} />
                  <TerritoryInput label="Commune / préfecture" value={form.commune} onChange={(value) => update("commune", value)} />
                  <TerritoryInput label="Quartier / secteur *" value={form.district} onChange={(value) => update("district", value)} />
                  <TerritoryInput label="Territoire existant ou nouveau *" value={form.territoryName} onChange={(value) => update("territoryName", value)} list="territory-assignment-options" />
                  <datalist id="territory-assignment-options">{territories.map((item) => <option key={item.id || item.name} value={item.name || item.territory_name || item.zone} />)}</datalist>
                  <TerritorySelect label="Rayon d’action" value={form.radius} onChange={(value) => update("radius", value)} options={["3 km", "5 km", "10 km", "Ville complète"]} />
                </div>
              </TerritoryPanel>

              <TerritoryPanel title="2. Mode & source d’affectation" badge="Gouvernance zone">
                <div className="grid gap-3 sm:grid-cols-2">
                  <TerritorySelect label="Mode couverture" value={form.assignmentMode} onChange={(value) => update("assignmentMode", value)} options={territoryAssignmentModes} />
                  <TerritorySelect label="Source affectation" value={form.assignmentSource} onChange={(value) => update("assignmentSource", value)} options={territorySources} />
                  <TerritoryInput label="Date début" type="date" value={form.startDate} onChange={(value) => update("startDate", value)} />
                  <TerritoryInput label="Date revue *" type="date" value={form.reviewDate} onChange={(value) => update("reviewDate", value)} />
                </div>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em]">Lecture rapide</p>
                  <p className="mt-2 text-sm font-bold leading-6">{form.assignmentMode} · {form.assignmentSource} · revue prévue le {form.reviewDate || "à définir"}</p>
                </div>
              </TerritoryPanel>
            </section>

            <section className="space-y-5">
              <TerritoryPanel title="3. Services, canaux & objectifs" badge="Périmètre autorisé">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em]">Services autorisés *</p>
                    <div className="mt-3 flex flex-wrap gap-2">{territoryServices.map((item) => <TerritoryChip key={item} active={form.services.includes(item)} onClick={() => toggleList("services", item)}>{item}</TerritoryChip>)}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em]">Canaux autorisés *</p>
                    <div className="mt-3 flex flex-wrap gap-2">{territoryChannels.map((item) => <TerritoryChip key={item} active={form.channels.includes(item)} onClick={() => toggleList("channels", item)}>{item}</TerritoryChip>)}</div>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <TerritoryInput label="Leads mensuels" value={form.monthlyLeadTarget} onChange={(value) => update("monthlyLeadTarget", value)} />
                  <TerritoryInput label="Conversions" value={form.monthlyConversionTarget} onChange={(value) => update("monthlyConversionTarget", value)} />
                  <TerritoryInput label="Visites terrain" value={form.fieldVisitTarget} onChange={(value) => update("fieldVisitTarget", value)} />
                  <TerritoryInput label="Partenaires" value={form.partnerTarget} onChange={(value) => update("partnerTarget", value)} />
                </div>
              </TerritoryPanel>

              <TerritoryPanel title="4. SLA, preuves & reporting" badge="Contrôle exécution">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <TerritorySelect label="SLA contact" value={form.slaContact} onChange={(value) => update("slaContact", value)} options={["12h", "24h", "48h"]} />
                  <TerritorySelect label="SLA relance" value={form.slaFollowup} onChange={(value) => update("slaFollowup", value)} options={["24h", "48h", "72h"]} />
                  <TerritorySelect label="SLA clôture" value={form.slaClosure} onChange={(value) => update("slaClosure", value)} options={["3 jours", "7 jours", "14 jours"]} />
                  <TerritorySelect label="Reporting" value={form.reportingFrequency} onChange={(value) => update("reportingFrequency", value)} options={["Quotidien", "Hebdomadaire", "Bimensuel"]} />
                </div>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em]">Preuves obligatoires</p>
                  <div className="mt-3 flex flex-wrap gap-2">{territoryProofRequirements.map((item) => <TerritoryChip key={item} active={form.proofRequirements.includes(item)} onClick={() => toggleList("proofRequirements", item)}>{item}</TerritoryChip>)}</div>
                </div>
                <TerritoryTextarea label="Notes d’affectation" value={form.notes} onChange={(value) => update("notes", value)} />
              </TerritoryPanel>

              <TerritoryPanel title="5. Manager & approbation" badge="Décision">
                <div className="grid gap-3 sm:grid-cols-3">
                  <TerritorySelect label="Manager assigné *" value={form.managerName} onChange={(value) => update("managerName", value)} options={managers.length ? managers : ["Sara Bakoki"]} />
                  <TerritorySelect label="Approbateur" value={form.approvalManager} onChange={(value) => update("approvalManager", value)} options={managers.length ? managers : ["Sara Bakoki"]} />
                  <TerritorySelect label="Statut approbation" value={form.approvalStatus} onChange={(value) => update("approvalStatus", value)} options={["En attente", "Approuvé", "Rejeté", "À revoir"]} />
                </div>
                {exclusiveNeedsApproval ? <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black">Validation manager recommandée: mode exclusif, potentiel élevé ou charge projetée importante.</p> : null}
              </TerritoryPanel>
            </section>

            <aside className="space-y-5">
              <section className="rounded-[28px] border border-cyan-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em]">Score affectation</p>
                    <p className="mt-2 text-4xl font-black">{score}%</p>
                    <p className="mt-1 text-sm font-bold">{readinessLabel}</p>
                  </div>
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-cyan-50"><Target size={24} /></div>
                </div>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"><div className={cn("h-full rounded-full", score >= 82 ? "bg-emerald-500" : score >= 64 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${score}%` }} /></div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-black">Résumé territoire</h3>
                <div className="mt-4 space-y-3">{summaryRows.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3"><span className="text-xs font-black uppercase tracking-[0.12em]">{label}</span><b className="text-sm text-right">{value}</b></div>)}</div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-black">Capacité & couverture</h3>
                <div className="mt-4 space-y-4">
                  <TerritoryProgress label="Couverture zone" value={coverage} helper={coverage < 50 ? "Zone sous-couverte — opportunité prioritaire" : "Couverture existante à équilibrer"} />
                  <TerritoryProgress label="Charge projetée" value={projectedLoad} helper={territoryRisk} />
                  <TerritoryProgress label="Potentiel commercial" value={highPotential ? 86 : 62} helper={highPotential ? "Potentiel élevé détecté" : "Potentiel standard"} />
                </div>
              </section>

              <section className={cn("rounded-[28px] border p-5 shadow-sm", blockedReasons.length ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50")}>
                <div className="flex gap-3"><AlertTriangle size={20} /><div><h3 className="text-sm font-black">Contrôles avant affectation</h3><p className="mt-2 text-sm font-bold">{blockedReasons.length ? `Bloqué: ${blockedReasons.join(", ")}` : "Affectation prête pour exécution."}</p><p className="mt-2 text-xs font-black">{territoryRisk} · {conflictSignal}</p></div></div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-black">Règles de validation</h3>
                <div className="mt-4 space-y-2">
                  {["Ambassadeur sélectionné", "Services et canaux cadrés", "SLA de suivi défini", "Preuves obligatoires définies", "Date de revue renseignée"].map((item, index) => <div key={item} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3 text-sm font-bold"><CheckCircle2 size={16} className={index < 3 || !blockedReasons.length ? "text-emerald-600" : "text-slate-400"} />{item}</div>)}
                </div>
              </section>

              {message ? <section className={cn("rounded-[24px] border p-4 text-sm font-black", message.type === "success" ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50")}>{message.text}</section> : null}
            </aside>
          </div>
        </div>

        <footer className="sticky bottom-0 z-20 border-t border-slate-100 bg-white px-7 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-black leading-5">
              <p>{selected?.full_name || selected?.name || "Ambassadeur à sélectionner"} · {form.city} · {form.assignmentMode}</p>
              <p>{blockedReasons.length ? `Bloqué: ${blockedReasons.join(", ")}` : `${form.territoryName} prêt pour affectation.`}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black hover:bg-slate-50">Annuler</button>
              <button type="button" onClick={() => void submit("draft")} disabled={!!savingMode} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black hover:bg-slate-50 disabled:opacity-50">{savingMode === "draft" ? "Enregistrement..." : "Enregistrer brouillon"}</button>
              <button type="button" onClick={() => void submit("submit")} disabled={!!savingMode || missingCore.length > 0} className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black hover:bg-amber-100 disabled:opacity-50">{savingMode === "submit" ? "Soumission..." : "Soumettre approbation"}</button>
              <button type="submit" disabled={!!savingMode || blockedReasons.length > 0} className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 hover:bg-blue-800 disabled:bg-slate-200 disabled:shadow-none">{savingMode === "assign" ? "Affectation..." : "Affecter territoire"}</button>
              <button type="button" onClick={() => void submit("mission")} disabled={!!savingMode || blockedReasons.length > 0} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 disabled:bg-slate-200 disabled:shadow-none">Affecter + créer première mission</button>
            </div>
          </div>
        </footer>
      </form>
    </div>
  );
}

function TerritoryPanel({ title, badge, children }: { title: string; badge: string; children: ReactNode }) {
  return <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-base font-black">{title}</h3><span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em]">{badge}</span></div>{children}</section>;
}

function TerritoryInput({ label, value, onChange, placeholder, type = "text", disabled, list }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; disabled?: boolean; list?: string }) {
  return <label className="block"><span className="text-[10px] font-black uppercase tracking-[0.16em]">{label}</span><input type={type} value={value} list={list} disabled={disabled} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none placeholder:!text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100" /></label>;
}

function TerritorySelect({ label, value, onChange, options, optionLabels }: { label: string; value: string; onChange: (value: string) => void; options: string[]; optionLabels?: Record<string, string> }) {
  return <label className="block"><span className="text-[10px] font-black uppercase tracking-[0.16em]">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100">{options.map((item) => <option key={item || "empty"} value={item}>{optionLabels?.[item] || item}</option>)}</select></label>;
}

function TerritoryTextarea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="mt-3 block"><span className="text-[10px] font-black uppercase tracking-[0.16em]">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none placeholder:!text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-100" /></label>;
}

function TerritoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" onClick={onClick} className={cn("rounded-full border px-3 py-2 text-xs font-black transition", active ? "border-cyan-300 bg-cyan-50 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50")}>{children}</button>;
}

function TerritoryProgress({ label, value, helper }: { label: string; value: number; helper: string }) {
  return <div><div className="flex items-center justify-between gap-3"><span className="text-xs font-black uppercase tracking-[0.12em]">{label}</span><b className="text-sm">{value}%</b></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={cn("h-full rounded-full", value >= 80 ? "bg-emerald-500" : value >= 55 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${Math.max(5, Math.min(100, value))}%` }} /></div><p className="mt-2 text-xs font-bold">{helper}</p></div>;
}

function SelectedAmbassadorPanel({
  ambassador,
  snapshot,
  onOpenProfile,
  onAssignTerritory,
  onCreateMission,
  onArchive,
}: {
  ambassador: AnyRecord;
  snapshot: AmbassadorWorkspaceSnapshot;
  onOpenProfile: (ambassador: AnyRecord) => void;
  onAssignTerritory: (ambassador: AnyRecord) => void;
  onCreateMission: (ambassador: AnyRecord) => void;
  onArchive: (ambassador: AnyRecord) => void;
}) {
  const score = numberValue(ambassador.performance_score ?? ambassador.quality_score ?? 0);
  const missions = (snapshot.missions || []).filter((item: AnyRecord) => item.ambassador_id === ambassador.id);
  const training = (snapshot.training || []).filter((item: AnyRecord) => item.ambassador_id === ambassador.id);
  const incentives = (snapshot.incentives || []).filter((item: AnyRecord) => item.ambassador_id === ambassador.id);
  const phone = normalizePhone(ambassador.phone);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-5 xl:grid-cols-[290px_1fr_1fr_1fr]">
        <div className="flex gap-4">
          <span className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full bg-slate-100 text-xl font-black text-slate-950 ring-1 ring-slate-200">{initials(ambassador.full_name || ambassador.name)}<span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" /></span>
          <div>
            <h3 className="text-xl font-black text-slate-950">{ambassador.full_name || ambassador.name || "Ambassadeur"}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{ambassador.city || "Ville non renseignée"} · {ambassador.phone || ambassador.email || "Contact à compléter"}</p>
            <div className="mt-4 flex gap-2">
              <IconLink href={`tel:${phone}`} icon={Phone} title="Appeler" disabled={!phone} />
              <IconLink href={`https://wa.me/${phone.replace(/^\+/, "")}`} icon={MessageCircle} title="WhatsApp" disabled={!phone} />
              <IconLink href={`mailto:${ambassador.email || ""}`} icon={Mail} title="Email" disabled={!ambassador.email} />
              <button type="button" onClick={() => onOpenProfile(ambassador)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-950 hover:border-blue-300 hover:bg-blue-50" title="Voir profil"><Eye size={16} /></button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 p-4">
          <h4 className="text-sm font-black text-slate-950">Performance (MTD)</h4>
          <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <MiniStat label="Leads" value={formatNumber(ambassador.leads_mtd ?? ambassador.leads_generated ?? 0)} />
            <MiniStat label="Conv." value={formatNumber(ambassador.conversions_mtd ?? ambassador.conversions_validated ?? 0)} />
            <MiniStat label="Score" value={`${score}%`} />
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className={cn("h-full rounded-full", scoreTone(score))} style={{ width: `${Math.max(5, Math.min(100, score))}%` }} /></div>
        </div>

        <div className="rounded-2xl border border-slate-100 p-4">
          <h4 className="text-sm font-black text-slate-950">Santé contact</h4>
          <div className="mt-3 space-y-2 text-sm font-semibold text-slate-600">
            <p><CheckCircle2 size={15} className="mr-2 inline text-emerald-600" />{ambassador.last_contact_at ? "Contact récent" : "Contact à planifier"}</p>
            <p>Dernier contact: <b className="text-slate-950">{dateLabel(ambassador.last_contact_at || ambassador.last_activity_at)}</b></p>
            <p>Mission actives: <b className="text-slate-950">{missions.length}</b></p>
            <p>Formations: <b className="text-slate-950">{training.length}</b></p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 p-4">
          <h4 className="text-sm font-black text-slate-950">Actions rapides</h4>
          <div className="mt-4 grid gap-2">
            <ActionButton icon={MapPinned} onClick={() => onAssignTerritory(ambassador)}>Affecter territoire</ActionButton>
            <ActionButton icon={Target} onClick={() => onCreateMission(ambassador)}>Créer mission</ActionButton>
            <ActionButton icon={Wallet} onClick={() => onOpenProfile(ambassador)}>Voir incentives ({incentives.length})</ActionButton>
            <ActionButton icon={X} variant="danger" onClick={() => onArchive(ambassador)}>Archiver</ActionButton>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-1 font-black text-slate-950">{value}</p></div>;
}
