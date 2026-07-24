"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Handshake,
  MapPinned,
  Megaphone,
  MessageCircle,
  ShieldCheck,
  Target,
  UsersRound,
} from "lucide-react";

const navGroups = [
  {
    label: "Pilotage",
    items: [
      {
        label: "Poste de commandement",
        href: "/revenue-command-center",
        icon: Target,
      },
      {
        label: "Briefing exécutif",
        href: "/revenue-command-center/executive-briefing",
        icon: ShieldCheck,
      },
    ],
  },
  {
    label: "Exécution commerciale",
    items: [
      {
        label: "Prospects et comptes",
        href: "/revenue-command-center/prospects/directory",
        icon: UsersRound,
      },
      {
        label: "Partenariats",
        href: "/revenue-command-center/partnerships",
        icon: Handshake,
      },
      {
        label: "Tâches et actions",
        href: "/revenue-command-center/daily-tasks",
        icon: CheckCircle2,
      },
      {
        label: "Rendez-vous",
        href: "/revenue-command-center/appointments",
        icon: CalendarDays,
      },
      {
        label: "Campagnes",
        href: "/revenue-command-center/campaigns",
        icon: Megaphone,
      },
      {
        label: "Relances",
        href: "/revenue-command-center/follow-ups",
        icon: MessageCircle,
      },
    ],
  },
  {
    label: "Intelligence",
    items: [
      {
        label: "Cartographie marché",
        href: "/revenue-command-center/market-mapping",
        icon: MapPinned,
      },
      {
        label: "Analytics revenu",
        href: "/revenue-command-center/revenue-analytics",
        icon: BarChart3,
      },
      {
        label: "Chronologie d’activité",
        href: "/revenue-command-center/activity-timeline",
        icon: Activity,
      },
    ],
  },
];

export function RevenueCommandCenterSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-[999] hidden h-screen w-[260px] flex-col overflow-hidden border-r border-white/10 bg-[radial-gradient(circle_at_10%_0%,rgba(67,144,215,.24),transparent_30%),linear-gradient(180deg,#0a2342_0%,#07172d_60%,#061326_100%)] text-white shadow-[18px_0_55px_rgba(19,47,76,.10)] xl:flex">
      <div className="flex min-h-28 items-center gap-3 border-b border-white/10 px-5">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/[0.08] shadow-inner">
          <span className="h-0 w-0 border-b-[20px] border-l-[12px] border-r-[12px] border-b-[#e2384f] border-l-transparent border-r-transparent drop-shadow-[0_7px_12px_rgba(226,56,79,.32)]" />
        </div>
        <div>
          <div className="text-[17px] font-black tracking-[0.16em] text-white">
            ANGELCARE
          </div>
          <div className="mt-1.5 text-[9px] font-black uppercase tracking-[0.13em] text-white/60">
            Revenue Command OS
          </div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        {navGroups.map((group, groupIndex) => (
          <div key={group.label} className={groupIndex ? "mt-6" : ""}>
            <div className="px-3 pb-2 text-[9px] font-black uppercase tracking-[0.18em] text-white/38">
              {group.label}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/revenue-command-center" &&
                    pathname?.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2.5 text-xs font-extrabold transition ${
                      active
                        ? "border-[#7bbeef]/20 bg-[linear-gradient(90deg,rgba(45,122,193,.48),rgba(38,93,151,.22))] text-white shadow-[inset_3px_0_0_#6fb5ef]"
                        : "border-transparent text-white/70 hover:border-white/[0.08] hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="m-3 rounded-2xl border border-emerald-300/15 bg-emerald-800/15 p-4">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.13em] text-white">
          <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgba(110,231,183,.10)]" />
          Connexion active
        </div>
        <p className="mt-2 text-[10px] font-semibold leading-4 text-white/58">
          Navigation reliée aux espaces existants, sans modification des règles
          métier ni des permissions.
        </p>
      </div>
    </aside>
  );
}
