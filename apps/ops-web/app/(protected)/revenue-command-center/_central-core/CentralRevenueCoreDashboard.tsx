"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Command,
  DatabaseZap,
  FileText,
  Gauge,
  Handshake,
  LayoutGrid,
  LineChart,
  ListChecks,
  MapPinned,
  Megaphone,
  Menu,
  MessageCircle,
  PhoneCall,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Workflow,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  useLiveActivities,
  useLiveAppointments,
  useLiveProspects,
  useLiveTasks,
  type RCCAppointment,
  type RCCProspect,
  type RCCTask,
} from "@/lib/revenue-command-center/live-sync";

import styles from "./CentralRevenueCoreDashboard.module.css";

function cn(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

function money(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const absolute = Math.abs(safeValue);

  if (absolute >= 1_000_000) {
    return `${new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 2,
    }).format(safeValue / 1_000_000)} M Dh`;
  }

  if (absolute >= 1_000) {
    return `${new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(safeValue / 1_000)} k Dh`;
  }

  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(safeValue)} Dh`;
}

function pct(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value || 0)))} %`;
}

function isToday(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
}

function isOpenTask(task: RCCTask) {
  return !["done", "completed", "cancelled", "canceled"].includes(
    String(task.status || "").toLowerCase(),
  );
}

function isOverdueTask(task: RCCTask) {
  if (!isOpenTask(task) || !task.dueDate) return false;
  const dueAt = new Date(task.dueDate).getTime();
  return Number.isFinite(dueAt) && dueAt < Date.now();
}

function prospectStageValue(prospect: RCCProspect) {
  return Number(prospect.valueMad || 0);
}

function stageLabel(stage: string) {
  const labels: Record<string, string> = {
    new_lead: "Prospection",
    discovery: "Découverte",
    qualification: "Qualification",
    decision_map: "Cartographie décisionnelle",
    appointment_ready: "Prêt pour rendez-vous",
    proposal: "Proposition",
    negotiation: "Négociation",
    contracting: "Contractualisation",
    closed_won: "Gagné",
    won: "Gagné",
    closed_lost: "Perdu",
    lost: "Perdu",
    recovery: "Récupération",
  };
  return labels[stage] || stage.replaceAll("_", " ") || "Non attribué";
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    scheduled: "Planifié",
    open: "Ouvert",
    pending: "En attente",
    confirmed: "Confirmé",
    completed: "Terminé",
    done: "Terminé",
    cancelled: "Annulé",
    canceled: "Annulé",
    no_show: "Absent",
  };
  return labels[String(status || "").toLowerCase()] || status || "À traiter";
}

function initials(value: string) {
  return String(value || "AC")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeDate(value?: string | null) {
  if (!value) return "Date non disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date non disponible";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

type ModuleCard = {
  id: string;
  title: string;
  icon: LucideIcon;
  subtitle: string;
  href: string;
};

const moduleCards: ModuleCard[] = [
  {
    id: "prospects",
    title: "Prospects et comptes",
    icon: Users,
    subtitle: "Qualification, ownership, potentiel et mouvement du pipeline.",
    href: "/revenue-command-center/prospects",
  },
  {
    id: "appointments",
    title: "Rendez-vous",
    icon: CalendarDays,
    subtitle: "Préparation, conduite, conversion et suivi des rencontres.",
    href: "/revenue-command-center/appointments",
  },
  {
    id: "daily-tasks",
    title: "Exécution quotidienne",
    icon: ListChecks,
    subtitle: "Priorités, responsabilités, délais, blocages et preuves.",
    href: "/revenue-command-center/daily-tasks",
  },
  {
    id: "partnerships",
    title: "Partenariats stratégiques",
    icon: Handshake,
    subtitle: "Développement B2B, activation et performance partenaires.",
    href: "/revenue-command-center/partnerships",
  },
  {
    id: "campaigns",
    title: "Campagnes et séquences",
    icon: Megaphone,
    subtitle: "Activation commerciale, canaux, attribution et rendement.",
    href: "/revenue-command-center/campaigns",
  },
  {
    id: "follow-ups",
    title: "Relances et récupération",
    icon: MessageCircle,
    subtitle: "Retards, silence commercial et pression de conversion.",
    href: "/revenue-command-center/follow-ups",
  },
  {
    id: "sdr",
    title: "SDR Command",
    icon: PhoneCall,
    subtitle: "Cadence outbound, qualification et discipline de contact.",
    href: "/revenue-command-center/sdr",
  },
  {
    id: "b2c-workflow",
    title: "Parcours commercial B2C",
    icon: Workflow,
    subtitle: "Demande famille, conseil, devis, onboarding et rétention.",
    href: "/revenue-command-center/b2c-workflow",
  },
  {
    id: "decision-maps",
    title: "Cartographies décisionnelles",
    icon: MapPinned,
    subtitle: "Décideurs, influence, objections et trajectoire de closing.",
    href: "/revenue-command-center/prospects/decision-map",
  },
  {
    id: "executive-briefing",
    title: "Briefing exécutif",
    icon: BriefcaseBusiness,
    subtitle: "Risques, prévisions, décisions et interventions de direction.",
    href: "/revenue-command-center/executive-briefing",
  },
];

function Sidebar({
  mobileOpen,
  onClose,
  prospectCount,
  taskCount,
  appointmentCount,
  alertCount,
}: {
  mobileOpen: boolean;
  onClose: () => void;
  prospectCount: number;
  taskCount: number;
  appointmentCount: number;
  alertCount: number;
}) {
  const navGroups: Array<{ label: string; items: NavItem[] }> = [
    {
      label: "Pilotage exécutif",
      items: [
        {
          href: "/revenue-command-center",
          label: "Poste de commandement",
          icon: Gauge,
        },
        {
          href: "/revenue-command-center/executive-briefing",
          label: "Briefing de direction",
          icon: Building2,
          badge: alertCount,
        },
        {
          href: "/revenue-command-center/control-tower",
          label: "Tour de contrôle",
          icon: ShieldCheck,
        },
      ],
    },
    {
      label: "Exécution commerciale",
      items: [
        {
          href: "/revenue-command-center/prospects/directory",
          label: "Prospects et comptes",
          icon: Users,
          badge: prospectCount,
        },
        {
          href: "/revenue-command-center/daily-tasks",
          label: "Tâches et actions",
          icon: CheckCircle2,
          badge: taskCount,
        },
        {
          href: "/revenue-command-center/appointments",
          label: "Rendez-vous",
          icon: CalendarDays,
          badge: appointmentCount,
        },
        {
          href: "/revenue-command-center/follow-ups",
          label: "Relances et récupération",
          icon: MessageCircle,
        },
      ],
    },
    {
      label: "Croissance et intelligence",
      items: [
        {
          href: "/revenue-command-center/partnerships",
          label: "Partenariats",
          icon: Handshake,
        },
        {
          href: "/revenue-command-center/campaigns",
          label: "Campagnes",
          icon: Megaphone,
        },
        {
          href: "/revenue-command-center/revenue-analytics",
          label: "Analytics revenu",
          icon: BarChart3,
        },
        {
          href: "/revenue-command-center/activity-timeline",
          label: "Chronologie d’activité",
          icon: Activity,
        },
        {
          href: "/revenue-command-center/documents",
          label: "Documents commerciaux",
          icon: FileText,
        },
      ],
    },
    {
      label: "Stratégie et orchestration",
      items: [
        {
          href: "/revenue-command-center/strategy-room",
          label: "Strategy Room",
          icon: Sparkles,
        },
        {
          href: "/revenue-command-center/system-activation",
          label: "Activation système",
          icon: Zap,
        },
      ],
    },
  ];

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fermer la navigation"
          className={styles.mobileBackdrop}
          onClick={onClose}
        />
      )}
      <aside
        aria-label="Navigation Revenue Command Center"
        className={cn(styles.sidebar, mobileOpen && styles.sidebarOpen)}
      >
        <div className={styles.brand}>
          <div className={styles.brandMark} aria-hidden="true">
            <span className={styles.brandTriangle} />
          </div>
          <div>
            <div className={styles.brandName}>ANGELCARE</div>
            <div className={styles.brandProduct}>Revenue Command OS</div>
          </div>
        </div>

        <nav className={styles.navWrap}>
          {navGroups.map((group, groupIndex) => (
            <div className={styles.navGroup} key={group.label}>
              <div className={styles.navLabel}>{group.label}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      styles.navItem,
                      groupIndex === 0 && item.href === "/revenue-command-center" &&
                        styles.navActive,
                    )}
                  >
                    <Icon className={styles.navIcon} />
                    <span className={styles.navText}>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className={styles.navBadge}>{item.badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarFooterTop}>
            <span className={styles.liveDot} />
            Connexion opérationnelle
          </div>
          <p>
            Prospects, tâches, rendez-vous et activités synchronisés avec les
            tables canoniques du Revenue Command Center.
          </p>
        </div>
      </aside>
    </>
  );
}

export default function CentralRevenueCoreDashboard() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showAllModules, setShowAllModules] = useState(false);

  const {
    prospects,
    loading: prospectsLoading,
    error: prospectsError,
    refresh: refreshProspects,
    lastSync: prospectLastSync,
  } = useLiveProspects();
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    refresh: refreshTasks,
    byEntityId: tasksByProspect,
  } = useLiveTasks();
  const {
    appointments,
    loading: appointmentsLoading,
    error: appointmentsError,
    refresh: refreshAppointments,
    byEntityId: appointmentsByProspect,
  } = useLiveAppointments();
  const {
    activities,
    loading: activitiesLoading,
    error: activitiesError,
    refresh: refreshActivities,
  } = useLiveActivities();

  const loading =
    prospectsLoading || tasksLoading || appointmentsLoading || activitiesLoading;
  const error =
    prospectsError || tasksError || appointmentsError || activitiesError;

  const metrics = useMemo(() => {
    const totalPipeline = prospects.reduce(
      (sum, prospect) => sum + prospectStageValue(prospect),
      0,
    );
    const won = prospects
      .filter((prospect) =>
        ["closed_won", "won"].includes(String(prospect.stage)),
      )
      .reduce((sum, prospect) => sum + prospectStageValue(prospect), 0);
    const forecast = prospects.reduce(
      (sum, prospect) =>
        sum +
        prospectStageValue(prospect) *
          (Math.max(10, Number(prospect.score || 0)) / 100),
      0,
    );
    const meetingsToday = appointments.filter((appointment) =>
      isToday(appointment.appointmentAt),
    ).length;
    const openTasks = tasks.filter(isOpenTask).length;
    const overdueTasks = tasks.filter(isOverdueTask).length;
    const highPriority = prospects.filter((prospect) =>
      ["critical", "high"].includes(String(prospect.priority).toLowerCase()),
    ).length;
    const proposalValue = prospects
      .filter((prospect) => String(prospect.stage) === "proposal")
      .reduce((sum, prospect) => sum + prospectStageValue(prospect), 0);
    const negotiationValue = prospects
      .filter((prospect) => String(prospect.stage) === "negotiation")
      .reduce((sum, prospect) => sum + prospectStageValue(prospect), 0);
    const conversionRate = totalPipeline > 0 ? (won / totalPipeline) * 100 : 0;

    return {
      totalPipeline,
      won,
      forecast,
      meetingsToday,
      openTasks,
      overdueTasks,
      highPriority,
      proposalValue,
      negotiationValue,
      conversionRate,
    };
  }, [appointments, prospects, tasks]);

  const stageBars = useMemo(() => {
    const stages = [
      "new_lead",
      "qualification",
      "proposal",
      "negotiation",
      "closed_won",
    ];
    const rows = stages.map((stage) => {
      const matching = prospects.filter(
        (prospect) => String(prospect.stage) === stage,
      );
      return {
        stage,
        label: stageLabel(stage),
        count: matching.length,
        value: matching.reduce(
          (sum, prospect) => sum + prospectStageValue(prospect),
          0,
        ),
      };
    });
    const max = Math.max(...rows.map((row) => row.value), 1);
    return rows.map((row) => ({
      ...row,
      width: row.value === 0 ? 0 : Math.max(7, Math.round((row.value / max) * 100)),
    }));
  }, [prospects]);

  const topProspects = useMemo(() => {
    return [...prospects]
      .sort(
        (a, b) =>
          Number(b.valueMad || 0) + Number(b.score || 0) * 1000 -
          (Number(a.valueMad || 0) + Number(a.score || 0) * 1000),
      )
      .slice(0, 6);
  }, [prospects]);

  const alerts = useMemo(() => {
    const overdue = tasks
      .filter(isOverdueTask)
      .slice(0, 4)
      .map((task) => ({
        title: task.title,
        detail: task.entityName || task.owner || "Action commerciale",
        href: "/revenue-command-center/daily-tasks",
        kind: "Échéance dépassée",
      }));

    const priorityProspects = prospects
      .filter((prospect) =>
        ["critical", "high"].includes(
          String(prospect.priority).toLowerCase(),
        ),
      )
      .slice(0, 4)
      .map((prospect) => ({
        title: prospect.name,
        detail: `${prospect.city} · ${money(prospect.valueMad)}`,
        href: `/revenue-command-center/prospects/${prospect.id}`,
        kind: "Compte prioritaire",
      }));

    return [...overdue, ...priorityProspects].slice(0, 6);
  }, [prospects, tasks]);

  const todaysSchedule = useMemo(() => {
    return appointments
      .filter((appointment) => isToday(appointment.appointmentAt))
      .sort(
        (a, b) =>
          new Date(a.appointmentAt).getTime() -
          new Date(b.appointmentAt).getTime(),
      )
      .slice(0, 7);
  }, [appointments]);

  const recentActivities = useMemo(
    () =>
      [...activities]
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        )
        .slice(0, 7),
    [activities],
  );

  const moduleCounts = useMemo(() => {
    const synced = (id: string) => {
      if (id === "prospects") return prospects.length;
      if (id === "appointments") return appointments.length;
      if (id === "daily-tasks") return tasks.length;
      if (id === "follow-ups") {
        return tasks.filter(
          (task) =>
            isOpenTask(task) &&
            String(task.taskType || "").toLowerCase().includes("follow"),
        ).length;
      }
      if (id === "executive-briefing") return alerts.length;
      if (id === "decision-maps") {
        return prospects.filter(
          (prospect) =>
            String(prospect.contactName || "").trim() &&
            prospect.contactName !== "N/A",
        ).length;
      }
      if (id === "partnerships") {
        return prospects.filter((prospect) =>
          String(
            prospect.raw?.type || prospect.raw?.data?.type || "",
          ).includes("partner"),
        ).length;
      }
      if (id === "campaigns") {
        return prospects.filter((prospect) =>
          String(
            prospect.raw?.source || prospect.raw?.data?.source || "",
          )
            .toLowerCase()
            .includes("campaign"),
        ).length;
      }
      if (id === "sdr") {
        return tasks.filter((task) =>
          ["open", "pending"].includes(String(task.status).toLowerCase()),
        ).length;
      }
      if (id === "b2c-workflow") {
        return prospects.filter((prospect) =>
          String(
            prospect.raw?.type || prospect.raw?.data?.type || "",
          ).includes("family"),
        ).length;
      }
      return 0;
    };

    const value = (id: string) => {
      if (
        [
          "prospects",
          "sdr",
          "partnerships",
          "campaigns",
          "follow-ups",
          "b2c-workflow",
          "decision-maps",
          "executive-briefing",
        ].includes(id)
      ) {
        return metrics.totalPipeline;
      }
      if (id === "appointments") {
        return appointments.reduce(
          (sum, appointment) =>
            sum + Number(appointment.raw?.entity_value_mad || 0),
          0,
        );
      }
      if (id === "daily-tasks") {
        return tasks.reduce(
          (sum, task) => sum + Number(task.raw?.entity_value_mad || 0),
          0,
        );
      }
      return 0;
    };

    return { synced, value };
  }, [alerts.length, appointments, metrics.totalPipeline, prospects, tasks]);

  const operationalCoverage = useMemo(() => {
    const safePercent = (value: number, total: number) =>
      total > 0 ? Math.round((value / total) * 100) : 0;
    const prospectsWithContacts = prospects.filter(
      (prospect) =>
        Boolean(prospect.email || prospect.phone) ||
        (prospect.contactName && prospect.contactName !== "N/A"),
    ).length;
    const prospectsWithTasks = prospects.filter((prospect) =>
      tasksByProspect.has(prospect.id),
    ).length;
    const prospectsWithAppointments = prospects.filter((prospect) =>
      appointmentsByProspect.has(prospect.id),
    ).length;

    return [
      {
        label: "Dossiers avec contact exploitable",
        value: safePercent(prospectsWithContacts, prospects.length),
      },
      {
        label: "Dossiers reliés à une action",
        value: safePercent(prospectsWithTasks, prospects.length),
      },
      {
        label: "Dossiers reliés à un rendez-vous",
        value: safePercent(prospectsWithAppointments, prospects.length),
      },
      {
        label: "Actions actuellement ouvertes",
        value: safePercent(metrics.openTasks, Math.max(tasks.length, 1)),
      },
    ];
  }, [
    appointmentsByProspect,
    metrics.openTasks,
    prospects,
    tasks.length,
    tasksByProspect,
  ]);

  async function refreshAll() {
    await Promise.all([
      refreshProspects(),
      refreshTasks(),
      refreshAppointments(),
      refreshActivities(),
    ]);
  }

  const lastSyncText = prospectLastSync
    ? prospectLastSync.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : loading
      ? "Synchronisation"
      : "Temps réel";

  const visibleModules = showAllModules ? moduleCards : moduleCards.slice(0, 5);

  return (
    <main data-rcc-main-dashboard="premium-v1" className={styles.page}>
      {loading && <div className={styles.loadingBar} aria-hidden="true" />}

      <div className={styles.shell}>
        <Sidebar
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          prospectCount={prospects.length}
          taskCount={tasks.length}
          appointmentCount={appointments.length}
          alertCount={alerts.length}
        />

        <div className={styles.workspace}>
          <header className={styles.topbar}>
            <div className={styles.topbarLeft}>
              <button
                type="button"
                aria-label="Ouvrir la navigation"
                className={styles.menuButton}
                onClick={() => setMobileNavOpen(true)}
              >
                <Menu size={18} />
              </button>

              <div className={styles.topbarContext}>
                <span className={styles.contextIcon}>
                  <Command />
                </span>
                <div>
                  <div className={styles.topbarEyebrow}>
                    Espace sécurisé ANGELCARE
                  </div>
                  <div className={styles.topbarTitle}>
                    Revenue Command Center · Vue exécutive
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.topbarRight}>
              <div className={styles.liveState} title={`Dernière synchronisation : ${lastSyncText}`}>
                <span className={styles.liveDot} />
                <span>Données actives · {lastSyncText}</span>
              </div>
              <button
                type="button"
                className={cn(styles.topAction, styles.desktopOnly)}
                onClick={() => void refreshAll()}
                disabled={loading}
              >
                <RefreshCcw size={15} />
                <span>{loading ? "Actualisation…" : "Actualiser"}</span>
              </button>
              <Link
                href="/revenue-command-center/notifications"
                aria-label="Ouvrir les notifications"
                className={cn(styles.topAction, styles.iconOnly)}
              >
                <Bell size={16} />
              </Link>
            </div>
          </header>

          <div className={styles.content}>
            <section className={styles.hero}>
              <div className={styles.heroCopy}>
                <div className={styles.eyebrow}>
                  <span className={styles.eyebrowMark} />
                  ANGELCARE Revenue Command OS
                </div>
                <h1>Le poste de commandement du revenu ANGELCARE.</h1>
                <p className={styles.heroLead}>
                  Une lecture exécutive, commerciale et opérationnelle de la
                  croissance : valeur en mouvement, décisions à prendre,
                  engagements du jour, risques de conversion et actions reliées
                  aux données canoniques existantes.
                </p>

                <div className={styles.heroActions}>
                  <Link
                    href="/revenue-command-center/daily-tasks"
                    className={styles.primaryButton}
                  >
                    <Zap size={16} />
                    Orchestrer une action
                  </Link>
                  <Link
                    href="/revenue-command-center/executive-briefing"
                    className={styles.secondaryButton}
                  >
                    <BriefcaseBusiness size={16} />
                    Ouvrir le briefing exécutif
                  </Link>
                </div>

                <div className={styles.heroTrust}>
                  <span>
                    <ShieldCheck /> Permissions et gouvernance préservées
                  </span>
                  <span>
                    <DatabaseZap /> Sources canoniques en temps réel
                  </span>
                  <span>
                    <CheckCircle2 /> Actions et routes existantes intactes
                  </span>
                </div>
              </div>

              <aside className={styles.heroPosture}>
                <div className={styles.postureHead}>
                  <div>
                    <span>Posture opérationnelle</span>
                    <strong>Situation commerciale actuelle</strong>
                  </div>
                  <div className={styles.shieldIcon}>
                    <ShieldCheck size={18} />
                  </div>
                </div>

                <div className={styles.postureGrid}>
                  <PostureMetric
                    label="Pipeline supervisé"
                    value={money(metrics.totalPipeline)}
                    detail={`${prospects.length} dossiers actifs`}
                  />
                  <PostureMetric
                    label="Actions ouvertes"
                    value={String(metrics.openTasks)}
                    detail={`${metrics.overdueTasks} hors délai`}
                  />
                  <PostureMetric
                    label="Rendez-vous aujourd’hui"
                    value={String(metrics.meetingsToday)}
                    detail={`${appointments.length} au total`}
                  />
                  <PostureMetric
                    label="Priorités élevées"
                    value={String(metrics.highPriority)}
                    detail="Comptes nécessitant vigilance"
                  />
                </div>
              </aside>
            </section>

            {error && (
              <div className={styles.alertBanner} role="alert">
                <AlertTriangle />
                <div>
                  <strong>Vérification de synchronisation requise.</strong>{" "}
                  Les données déjà affichées restent visibles. Détail reçu : {error}
                </div>
              </div>
            )}

            <section className={styles.kpiGrid} aria-label="Indicateurs clés">
              <Kpi
                icon={<CircleDollarSign />}
                label="Valeur pipeline"
                value={money(metrics.totalPipeline)}
                detail="Valeur totale des dossiers visibles"
              />
              <Kpi
                icon={<LineChart />}
                label="Prévision pondérée"
                value={money(metrics.forecast)}
                detail="Pondération selon le score existant"
              />
              <Kpi
                icon={<TrendingUp />}
                label="Revenu gagné"
                value={money(metrics.won)}
                detail={`${pct(metrics.conversionRate)} de la valeur totale`}
              />
              <Kpi
                icon={<FileText />}
                label="Valeur en proposition"
                value={money(metrics.proposalValue)}
                detail="Dossiers actuellement au stade proposition"
              />
              <Kpi
                icon={<Handshake />}
                label="Valeur en négociation"
                value={money(metrics.negotiationValue)}
                detail="Dossiers actuellement en négociation"
              />
            </section>

            <section className={styles.commandStrip} aria-label="Décisions prioritaires">
              <div className={styles.commandIntro}>
                <span className={styles.commandIcon}>
                  <Command size={19} />
                </span>
                <div>
                  <span>Décisions prioritaires</span>
                  <strong>Ce qui exige l’attention maintenant</strong>
                </div>
              </div>

              <Link
                href="/revenue-command-center/daily-tasks"
                className={cn(styles.commandSignal, styles.signalRed)}
              >
                <AlertTriangle />
                <div>
                  <span>Actions hors délai</span>
                  <strong>{metrics.overdueTasks}</strong>
                </div>
              </Link>
              <Link
                href="/revenue-command-center/prospects/directory"
                className={cn(styles.commandSignal, styles.signalAmber)}
              >
                <Target />
                <div>
                  <span>Comptes prioritaires</span>
                  <strong>{metrics.highPriority}</strong>
                </div>
              </Link>
              <Link
                href="/revenue-command-center/appointments"
                className={cn(styles.commandSignal, styles.signalBlue)}
              >
                <CalendarClock />
                <div>
                  <span>Rendez-vous du jour</span>
                  <strong>{metrics.meetingsToday}</strong>
                </div>
              </Link>
            </section>

            <div className={styles.mainGrid}>
              <div className={styles.column}>
                <section className={styles.panel}>
                  <SectionHeader
                    icon={<BarChart3 />}
                    title="Mouvement du pipeline"
                    subtitle="Valeur réelle par étape commerciale"
                    href="/revenue-command-center/revenue-analytics"
                    action="Voir les analytics"
                  />
                  <div className={styles.pipelineBody}>
                    <div className={styles.pipelineTotal}>
                      <div>
                        <span>Valeur totale supervisée</span>
                        <strong>{money(metrics.totalPipeline)}</strong>
                      </div>
                      <small>{prospects.length} dossiers visibles</small>
                    </div>
                    <div className={styles.stageList}>
                      {stageBars.map((row) => (
                        <div className={styles.stageRow} key={row.stage}>
                          <span className={styles.stageLabel}>
                            {row.label} · {row.count}
                          </span>
                          <span className={styles.stageTrack}>
                            <span
                              className={styles.stageBar}
                              style={{ width: `${row.width}%` }}
                            />
                          </span>
                          <span className={styles.stageValue}>
                            {money(row.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <div className={styles.twoColumns}>
                  <section className={styles.panel}>
                    <SectionHeader
                      icon={<Target />}
                      title="Opportunités prioritaires"
                      subtitle="Valeur, score et étape de progression"
                      href="/revenue-command-center/prospects/directory"
                      action="Tous les dossiers"
                    />
                    <div className={styles.priorityList}>
                      {topProspects.map((prospect) => (
                        <Link
                          href={`/revenue-command-center/prospects/${prospect.id}`}
                          className={styles.priorityItem}
                          key={prospect.id}
                        >
                          <div className={styles.priorityHead}>
                            <span className={styles.entityAvatar}>
                              {initials(prospect.name)}
                            </span>
                            <div className={styles.priorityText}>
                              <div className={styles.priorityName}>
                                {prospect.name}
                              </div>
                              <div className={styles.priorityMeta}>
                                {prospect.city} · Responsable : {prospect.owner}
                              </div>
                            </div>
                            <span className={styles.score}>
                              {pct(prospect.score)}
                            </span>
                          </div>
                          <div className={styles.priorityFoot}>
                            <span className={styles.stagePill}>
                              {stageLabel(prospect.stage)}
                            </span>
                            <span className={styles.priorityValue}>
                              {money(prospect.valueMad)}
                            </span>
                          </div>
                        </Link>
                      ))}
                      {!topProspects.length && (
                        <EmptyState
                          title="Aucune opportunité visible"
                          text="Les dossiers synchronisés apparaîtront ici dès qu’ils seront disponibles."
                        />
                      )}
                    </div>
                  </section>

                  <section className={styles.panel}>
                    <SectionHeader
                      icon={<CalendarDays />}
                      title="Agenda commercial du jour"
                      subtitle="Rendez-vous triés par heure"
                      href="/revenue-command-center/appointments"
                      action="Ouvrir l’agenda"
                    />
                    <div className={styles.agendaList}>
                      {todaysSchedule.map((appointment: RCCAppointment) => (
                        <Link
                          href={`/revenue-command-center/appointments/${appointment.id}`}
                          className={styles.agendaItem}
                          key={appointment.id}
                        >
                          <span className={styles.agendaTime}>
                            <Clock3 /> {formatTime(appointment.appointmentAt)}
                          </span>
                          <span>
                            <span className={styles.agendaTitle}>
                              {appointment.title}
                            </span>
                            <span className={styles.agendaMeta}>
                              {appointment.entityName || appointment.owner}
                              {appointment.location
                                ? ` · ${appointment.location}`
                                : ""}
                            </span>
                          </span>
                          <span className={styles.statusPill}>
                            {statusLabel(appointment.status)}
                          </span>
                        </Link>
                      ))}
                      {!todaysSchedule.length && (
                        <EmptyState
                          title="Aucun rendez-vous aujourd’hui"
                          text="L’agenda du jour est libre. Consultez la file complète pour préparer les prochaines rencontres."
                        />
                      )}
                    </div>
                  </section>
                </div>
              </div>

              <aside className={styles.column}>
                <section className={styles.priorityPanel}>
                  <SectionHeader
                    icon={<AlertTriangle />}
                    title="Centre d’intervention"
                    subtitle="Retards et comptes nécessitant une vigilance"
                    href="/revenue-command-center/executive-briefing"
                    action="Voir tout"
                  />
                  <div className={styles.priorityList}>
                    {alerts.map((alert, index) => (
                      <Link
                        href={alert.href}
                        className={styles.priorityItem}
                        key={`${alert.href}-${alert.title}-${index}`}
                      >
                        <div className={styles.priorityHead}>
                          <span className={styles.entityAvatar}>
                            <AlertTriangle size={15} />
                          </span>
                          <div className={styles.priorityText}>
                            <div className={styles.priorityName}>{alert.title}</div>
                            <div className={styles.priorityMeta}>
                              {alert.kind} · {alert.detail}
                            </div>
                          </div>
                          <ChevronRight size={16} />
                        </div>
                      </Link>
                    ))}
                    {!alerts.length && (
                      <EmptyState
                        title="Aucune alerte critique"
                        text="Aucun retard ou compte prioritaire n’est remonté par les données actuelles."
                      />
                    )}
                  </div>
                </section>

                <section className={styles.panel}>
                  <SectionHeader
                    icon={<Activity />}
                    title="Activité récente"
                    subtitle="Derniers événements du système de revenu"
                    href="/revenue-command-center/activity-timeline"
                    action="Chronologie"
                  />
                  <div className={styles.activityList}>
                    {recentActivities.map((activity) => (
                      <Link
                        href="/revenue-command-center/activity-timeline"
                        className={styles.activityItem}
                        key={activity.id}
                      >
                        <div className={styles.activityRow}>
                          <span className={styles.activityDot} />
                          <div>
                            <div className={styles.activityTitle}>
                              {activity.title}
                            </div>
                            <div className={styles.activityMeta}>
                              {activity.actor || "Système ANGELCARE"} · {" "}
                              {formatRelativeDate(activity.createdAt)}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {!recentActivities.length && (
                      <EmptyState
                        title="Aucune activité récente"
                        text="Les événements commerciaux synchronisés seront présentés ici."
                      />
                    )}
                  </div>
                </section>

                <section className={styles.panel}>
                  <SectionHeader
                    icon={<ShieldCheck />}
                    title="Couverture opérationnelle"
                    subtitle="Complétude des connexions entre dossiers et actions"
                  />
                  <div className={styles.healthList}>
                    {operationalCoverage.map((item) => (
                      <div className={styles.healthItem} key={item.label}>
                        <div className={styles.healthRow}>
                          <span className={styles.healthLabel}>{item.label}</span>
                          <span className={styles.healthValue}>{item.value} %</span>
                        </div>
                        <div className={styles.healthTrack}>
                          <div
                            className={styles.healthFill}
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </aside>
            </div>

            <section className={cn(styles.panel, styles.moduleSection)}>
              <SectionHeader
                icon={<LayoutGrid />}
                title="Ecosystème Revenue Command"
                subtitle="Accès direct aux espaces opérationnels existants"
                customAction={
                  <button
                    type="button"
                    className={styles.sectionButton}
                    onClick={() => setShowAllModules((current) => !current)}
                    aria-expanded={showAllModules}
                  >
                    {showAllModules ? <X size={13} /> : <LayoutGrid size={13} />}
                    {showAllModules
                      ? "Réduire les modules"
                      : "Afficher tous les modules"}
                  </button>
                }
              />

              <div className={styles.moduleGrid}>
                {visibleModules.map((module) => {
                  const Icon = module.icon;
                  const linkedValue = moduleCounts.value(module.id);
                  return (
                    <Link
                      href={module.href}
                      className={styles.moduleCard}
                      key={module.id}
                    >
                      <div className={styles.moduleHead}>
                        <span className={styles.moduleIcon}>
                          <Icon />
                        </span>
                        <ArrowRight className={styles.moduleArrow} />
                      </div>
                      <h3>{module.title}</h3>
                      <p>{module.subtitle}</p>
                      <div className={styles.moduleMeta}>
                        <span>
                          <strong>{moduleCounts.synced(module.id)}</strong>{" "}
                          éléments
                        </span>
                        <span>
                          {linkedValue > 0 ? money(linkedValue) : "Données actives"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function Kpi({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className={styles.kpiCard}>
      <span className={styles.kpiIcon}>{icon}</span>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiValue}>{value}</div>
      <div className={styles.kpiDetail}>{detail}</div>
    </article>
  );
}

function PostureMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className={styles.postureMetric}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
  href,
  action,
  customAction,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  href?: string;
  action?: string;
  customAction?: ReactNode;
}) {
  return (
    <div className={styles.sectionHead}>
      <div className={styles.sectionTitleRow}>
        <span className={styles.sectionIcon}>{icon}</span>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      {customAction}
      {!customAction && href && action && (
        <Link href={href} className={styles.sectionLink}>
          {action} <ArrowRight size={13} />
        </Link>
      )}
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className={styles.empty}>
      <strong>{title}</strong>
      {text}
    </div>
  );
}
