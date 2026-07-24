"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  DatabaseZap,
  FileText,
  Handshake,
  LayoutDashboard,
  Mail,
  MapPinned,
  MessageCircle,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";

type CanonicalWorkspaceProps = {
  workspace?: string;
  recordId?: string;
  mode?: string;
  pageKey?: string;
  title?: string;
  subtitle?: string;
};

type WorkspaceMeta = {
  title: string;
  subtitle: string;
  purpose: string;
  icon: ReactNode;
  href: string;
  accent: string;
};

const workspaceLabels: Record<string, WorkspaceMeta> = {
  campaigns: {
    title: "Commandement des campagnes",
    subtitle: "Pilotage des activations, séquences et performances commerciales.",
    purpose: "Organiser les campagnes et rejoindre les espaces d’exécution déjà connectés.",
    icon: <Mail />,
    href: "/revenue-command-center/campaigns",
    accent: "from-blue-600 to-cyan-500",
  },
  campaignBoard: {
    title: "Board des campagnes",
    subtitle: "Lecture structurée de la progression et des responsabilités.",
    purpose: "Accéder aux campagnes, aux actions et aux résultats associés.",
    icon: <LayoutDashboard />,
    href: "/revenue-command-center/campaigns/board",
    accent: "from-blue-700 to-indigo-500",
  },
  campaignNew: {
    title: "Nouvelle campagne",
    subtitle: "Point d’entrée sécurisé vers la création et l’orchestration commerciale.",
    purpose: "Préparer une activation tout en conservant les contrôles existants.",
    icon: <Zap />,
    href: "/revenue-command-center/campaigns/new",
    accent: "from-indigo-600 to-blue-500",
  },
  campaignDetail: {
    title: "Dossier campagne",
    subtitle: "Contexte, exécution et documents reliés à la campagne sélectionnée.",
    purpose: "Consulter les espaces opérationnels associés à ce dossier.",
    icon: <FileText />,
    href: "/revenue-command-center/campaigns",
    accent: "from-blue-600 to-sky-500",
  },
  campaignAssets: {
    title: "Ressources de campagne",
    subtitle: "Documents, supports et éléments de préparation commerciale.",
    purpose: "Rejoindre les documents et le centre d’exécution de la campagne.",
    icon: <FileText />,
    href: "/revenue-command-center/documents",
    accent: "from-sky-600 to-cyan-500",
  },
  campaignExecution: {
    title: "Exécution de campagne",
    subtitle: "Actions, responsabilités, échéances et suivi de progression.",
    purpose: "Passer de la campagne aux actions assignées dans les espaces existants.",
    icon: <CheckCircle2 />,
    href: "/revenue-command-center/daily-tasks",
    accent: "from-emerald-600 to-teal-500",
  },
  campaignPerformance: {
    title: "Performance de campagne",
    subtitle: "Accès aux résultats, mouvements et analyses disponibles.",
    purpose: "Examiner la performance sans créer de métriques non sourcées.",
    icon: <BarChart3 />,
    href: "/revenue-command-center/revenue-analytics",
    accent: "from-cyan-600 to-blue-500",
  },
  automation: {
    title: "Centre d’automatisation",
    subtitle: "Supervision des règles, activations et contrôles d’exécution.",
    purpose: "Accéder aux espaces d’activation tout en respectant les validations existantes.",
    icon: <Zap />,
    href: "/revenue-command-center/automation",
    accent: "from-violet-600 to-indigo-500",
  },
  businessDevelopment: {
    title: "Business Development",
    subtitle: "Prospection, opportunités, actions et développement de comptes.",
    purpose: "Coordonner les espaces commerciaux reliés au développement des revenus.",
    icon: <BriefcaseBusiness />,
    href: "/revenue-command-center/business-development",
    accent: "from-blue-700 to-cyan-500",
  },
  growth: {
    title: "Commandement de la croissance",
    subtitle: "Expansion, signaux de marché et accélération commerciale.",
    purpose: "Relier les opportunités de croissance aux dossiers et actions existants.",
    icon: <Target />,
    href: "/revenue-command-center/growth",
    accent: "from-emerald-600 to-cyan-500",
  },
  management: {
    title: "Management du revenu",
    subtitle: "Responsabilités, charge, discipline opérationnelle et interventions.",
    purpose: "Rejoindre les espaces de pilotage d’équipe et d’exécution quotidienne.",
    icon: <Users />,
    href: "/revenue-command-center/management",
    accent: "from-slate-700 to-blue-600",
  },
  myWork: {
    title: "Mon espace d’exécution",
    subtitle: "Travail assigné, priorités ouvertes et prochaine action.",
    purpose: "Accéder directement aux tâches et engagements associés à l’utilisateur.",
    icon: <CheckCircle2 />,
    href: "/revenue-command-center/my-work",
    accent: "from-blue-600 to-indigo-500",
  },
  notifications: {
    title: "Centre de notifications",
    subtitle: "Alertes, escalades et informations nécessitant une attention.",
    purpose: "Traiter les notifications sans modifier les règles d’émission existantes.",
    icon: <Bell />,
    href: "/revenue-command-center/notifications",
    accent: "from-rose-600 to-orange-500",
  },
  b2c: {
    title: "Parcours commercial B2C",
    subtitle: "Demandes familles, qualification, consultation et conversion.",
    purpose: "Rejoindre les étapes opérationnelles déjà disponibles dans le parcours B2C.",
    icon: <Workflow />,
    href: "/revenue-command-center/b2c-workflow",
    accent: "from-cyan-600 to-blue-500",
  },
  predictive: {
    title: "Intelligence prédictive",
    subtitle: "Scoring, signaux de préparation et aide à la décision.",
    purpose: "Consulter les contrôles prédictifs existants avec une lecture clairement contextualisée.",
    icon: <Radar />,
    href: "/revenue-command-center/predictive",
    accent: "from-violet-600 to-blue-500",
  },
  executive: {
    title: "Briefing exécutif",
    subtitle: "Risques, mouvements, décisions et interventions de direction.",
    purpose: "Rejoindre le briefing et les espaces de pilotage exécutif existants.",
    icon: <ShieldCheck />,
    href: "/revenue-command-center/executive-briefing",
    accent: "from-slate-800 to-blue-700",
  },
  sdr: {
    title: "Exécution SDR",
    subtitle: "Relances, rappels, récupération et discipline de contact.",
    purpose: "Coordonner le travail SDR avec les dossiers et tâches existants.",
    icon: <MessageCircle />,
    href: "/revenue-command-center/sdr-execution",
    accent: "from-blue-600 to-cyan-500",
  },
  prospects: {
    title: "Contrôle des prospects",
    subtitle: "Qualification, valeur, décision et progression des comptes.",
    purpose: "Accéder au répertoire et aux dossiers prospects de production.",
    icon: <MapPinned />,
    href: "/revenue-command-center/prospects/directory",
    accent: "from-blue-700 to-sky-500",
  },
};

function getWorkspaceMeta(
  workspace?: string,
  mode?: string,
  title?: string,
  subtitle?: string,
) {
  const key = workspace || mode || "command";
  const fallbackTitle = key
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
  const meta = workspaceLabels[key] || {
    title: title || fallbackTitle || "Espace Revenue Command",
    subtitle:
      subtitle ||
      "Accès sécurisé aux opérations et dossiers du Revenue Command Center.",
    purpose:
      "Naviguer vers les espaces opérationnels reliés sans altérer les règles existantes.",
    icon: <DatabaseZap />,
    href: "/revenue-command-center",
    accent: "from-blue-700 to-cyan-500",
  };

  return {
    ...meta,
    title: title || meta.title,
    subtitle: subtitle || meta.subtitle,
    key,
  };
}

const quickLinks = [
  {
    href: "/revenue-command-center/prospects/directory",
    label: "Prospects et comptes",
    detail: "Répertoire, qualification et dossiers commerciaux.",
    icon: <MapPinned />,
  },
  {
    href: "/revenue-command-center/daily-tasks",
    label: "Tâches et engagements",
    detail: "Responsabilités, échéances, blocages et actions.",
    icon: <CheckCircle2 />,
  },
  {
    href: "/revenue-command-center/appointments",
    label: "Rendez-vous",
    detail: "Agenda, préparation, conduite et suivi.",
    icon: <CalendarDays />,
  },
  {
    href: "/revenue-command-center/partnerships",
    label: "Partenariats stratégiques",
    detail: "Pipeline B2B, activation et performance.",
    icon: <Handshake />,
  },
  {
    href: "/revenue-command-center/revenue-analytics",
    label: "Analytics revenu",
    detail: "Lecture des indicateurs issus des données disponibles.",
    icon: <BarChart3 />,
  },
  {
    href: "/revenue-command-center/activity-timeline",
    label: "Chronologie d’activité",
    detail: "Événements, actions et mouvements enregistrés.",
    icon: <Activity />,
  },
];

export default function CanonicalRevenueWorkspace({
  workspace,
  recordId,
  mode,
  title,
  subtitle,
}: CanonicalWorkspaceProps) {
  const meta = getWorkspaceMeta(workspace, mode, title, subtitle);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_80%_-10%,rgba(65,151,221,.12),transparent_32%),linear-gradient(180deg,#f8fbfe_0%,#eef4f9_100%)] p-4 text-[#102a43] md:p-6 xl:p-8">
      <section className="mx-auto w-full max-w-[1600px]">
        <header className="relative overflow-hidden rounded-[28px] border border-[#173b62]/10 bg-[linear-gradient(135deg,#0a2445_0%,#103c68_62%,#0d2b4d_100%)] p-7 text-white shadow-[0_28px_80px_rgba(14,48,82,.17)] md:p-9">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/10 shadow-[0_0_0_34px_rgba(255,255,255,.025),0_0_0_72px_rgba(255,255,255,.015)]" />
          <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <div className="mb-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-[#acd8fa]">
                <span className="h-0 w-0 border-b-[9px] border-l-[5px] border-r-[5px] border-b-[#eb4458] border-l-transparent border-r-transparent" />
                ANGELCARE Revenue Command OS
              </div>
              <div className="flex items-start gap-4">
                <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${meta.accent} text-white shadow-lg [&_svg]:h-6 [&_svg]:w-6`}>
                  {meta.icon}
                </span>
                <div>
                  <h1 className="text-3xl font-black tracking-[-.035em] text-white md:text-5xl">
                    {meta.title}
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-white/72 md:text-base">
                    {meta.subtitle}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/revenue-command-center"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white px-4 text-xs font-black text-[#0a2445] shadow-lg transition hover:-translate-y-0.5"
              >
                <LayoutDashboard className="h-4 w-4" /> Poste de commandement
              </Link>
              <Link
                href={meta.href}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/18 bg-white/10 px-4 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-white/15"
              >
                Accéder à l’espace <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </header>

        <section className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ContextCard
            label="Espace actif"
            value={meta.title}
            detail="Contexte de navigation conservé"
            icon={<Sparkles />}
          />
          <ContextCard
            label="Dossier sélectionné"
            value={recordId || "Vue module"}
            detail={recordId ? "Identifiant de route préservé" : "Aucun dossier imposé"}
            icon={<FileText />}
          />
          <ContextCard
            label="Intégrité"
            value="Câblage protégé"
            detail="Routes, permissions et actions inchangées"
            icon={<ShieldCheck />}
          />
          <ContextCard
            label="Données"
            value="Sans simulation"
            detail="Aucune métrique décorative ou inventée"
            icon={<DatabaseZap />}
          />
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
          <article className="overflow-hidden rounded-[24px] border border-[#dce7f1] bg-white shadow-[0_16px_48px_rgba(23,58,91,.065)]">
            <div className="border-b border-[#e6eef5] bg-gradient-to-b from-white to-[#fbfdff] px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#dbe8f2] bg-[#f1f7fb] text-[#175fa7]">
                  <Target className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-black text-[#0b2345]">
                    Mission de cet espace
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-[#72879a]">
                    Lecture opérationnelle claire, sans exposer de terminologie technique.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="max-w-4xl text-sm font-semibold leading-7 text-[#506980]">
                {meta.purpose} Cette page conserve l’adresse, le contexte et les
                destinations existantes. Elle ne fabrique aucune donnée et ne
                contourne aucun contrôle du Revenue Command Center.
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {quickLinks.slice(0, 4).map((item) => (
                  <ActionLink key={item.href} {...item} />
                ))}
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#cfe0ed] bg-[#f3f8fc] p-4 text-sm font-semibold leading-6 text-[#45637d]">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#176f55]" />
                <p>
                  Les actions de création, modification, approbation et exécution
                  restent exclusivement disponibles dans les écrans déjà reliés
                  à leurs services et permissions d’origine.
                </p>
              </div>
            </div>
          </article>

          <aside className="overflow-hidden rounded-[24px] border border-[#dce7f1] bg-white shadow-[0_16px_48px_rgba(23,58,91,.065)]">
            <div className="border-b border-[#e6eef5] bg-gradient-to-b from-white to-[#fbfdff] px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#dbe8f2] bg-[#f1f7fb] text-[#175fa7]">
                  <Radar className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-black text-[#0b2345]">
                    Navigation opérationnelle
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-[#72879a]">
                    Rejoindre rapidement les espaces de travail connectés.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-2 p-4">
              {quickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-2xl border border-transparent p-3 transition hover:border-[#d8e6f1] hover:bg-[#f6faff]"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#dbe7f1] bg-[#f0f6fb] text-[#1768aa] [&_svg]:h-4 [&_svg]:w-4">
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-black text-[#102a43]">
                      {item.label}
                    </span>
                    <span className="mt-1 block text-[10px] font-semibold leading-4 text-[#71869a]">
                      {item.detail}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#90a3b4] transition group-hover:translate-x-0.5 group-hover:text-[#1768aa]" />
                </Link>
              ))}
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}

function ContextCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <article className="min-w-0 rounded-[18px] border border-[#dce7f1] bg-white p-5 shadow-[0_14px_42px_rgba(23,58,91,.055)]">
      <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#dbe8f2] bg-[#f2f7fb] text-[#1768aa] [&_svg]:h-4 [&_svg]:w-4">
        {icon}
      </span>
      <div className="mt-4 text-[9px] font-black uppercase tracking-[.14em] text-[#768a9d]">
        {label}
      </div>
      <div className="mt-1 truncate text-base font-black text-[#0b2345]">
        {value}
      </div>
      <div className="mt-1 truncate text-[10px] font-semibold text-[#71869a]">
        {detail}
      </div>
    </article>
  );
}

function ActionLink({
  href,
  label,
  detail,
  icon,
}: {
  href: string;
  label: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-[#dce7f1] bg-[#fbfdff] p-5 transition hover:-translate-y-0.5 hover:border-[#bed5e7] hover:bg-white hover:shadow-[0_15px_34px_rgba(23,58,91,.08)]"
    >
      <div className="mb-4 text-[#1768aa] [&_svg]:h-6 [&_svg]:w-6">
        {icon}
      </div>
      <div className="flex items-center gap-2 font-black text-[#102a43]">
        <span className="flex-1">{label}</span>
        <ArrowRight className="h-4 w-4 text-[#8da1b2] transition group-hover:translate-x-0.5" />
      </div>
      <div className="mt-2 text-xs font-semibold leading-5 text-[#71869a]">
        {detail}
      </div>
    </Link>
  );
}
