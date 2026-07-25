"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Command,
  FileText,
  Gauge,
  Handshake,
  LayoutDashboard,
  LineChart,
  MapPinned,
  Megaphone,
  Menu,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  Workflow,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

type SidebarProps = {
  collapsed?: boolean;
  overlayOpen?: boolean;
  onToggleCollapsed?: () => void;
  onOpenOverlay?: () => void;
  onCloseOverlay?: () => void;
};

type NavEntry = {
  label: string;
  href: string;
  icon: LucideIcon;
  aliases?: string[];
};

type NavGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavEntry[];
};

const navGroups: NavGroup[] = [
  {
    id: "command",
    label: "Pilotage exécutif",
    icon: Gauge,
    items: [
      { label: "Poste de commandement", href: "/revenue-command-center", icon: LayoutDashboard },
      { label: "Briefing de direction", href: "/revenue-command-center/executive-briefing", icon: BriefcaseBusiness },
      { label: "Tour de contrôle", href: "/revenue-command-center/control-tower", icon: ShieldCheck },
      { label: "Mon travail", href: "/revenue-command-center/my-work", icon: Target },
      { label: "Poste quotidien", href: "/revenue-command-center/daily-desk", icon: Command },
    ],
  },
  {
    id: "execution",
    label: "Exécution commerciale",
    icon: CheckCircle2,
    items: [
      { label: "Prospects et comptes", href: "/revenue-command-center/prospects/directory", icon: UsersRound, aliases: ["/revenue-command-center/prospects"] },
      { label: "Tâches et actions", href: "/revenue-command-center/daily-tasks", icon: CheckCircle2, aliases: ["/revenue-command-center/tasks"] },
      { label: "Rendez-vous", href: "/revenue-command-center/appointments", icon: CalendarDays },
      { label: "Relances et récupération", href: "/revenue-command-center/follow-ups", icon: MessageCircle },
      { label: "Documents commerciaux", href: "/revenue-command-center/documents", icon: FileText },
      { label: "Parcours commercial B2C", href: "/revenue-command-center/b2c-workflow", icon: Workflow },
    ],
  },
  {
    id: "growth",
    label: "Croissance et marché",
    icon: LineChart,
    items: [
      { label: "Partenariats stratégiques", href: "/revenue-command-center/partnerships", icon: Handshake },
      { label: "Campagnes", href: "/revenue-command-center/campaigns", icon: Megaphone },
      { label: "Développement commercial", href: "/revenue-command-center/business-development", icon: BriefcaseBusiness },
      { label: "Exécution SDR", href: "/revenue-command-center/sdr-execution", icon: Target },
      { label: "Cartographie marché", href: "/revenue-command-center/market-mapping", icon: MapPinned },
      { label: "Croissance", href: "/revenue-command-center/growth", icon: LineChart },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence et contrôle",
    icon: BarChart3,
    items: [
      { label: "Analytics revenu", href: "/revenue-command-center/revenue-analytics", icon: BarChart3 },
      { label: "Chronologie d’activité", href: "/revenue-command-center/activity-timeline", icon: Activity },
      { label: "Scoring et prédiction", href: "/revenue-command-center/ai-scoring", icon: Sparkles },
      { label: "Performance équipe", href: "/revenue-command-center/team-performance", icon: UsersRound },
      { label: "Équilibrage de charge", href: "/revenue-command-center/workload-balancer", icon: Gauge },
      { label: "Alertes et notifications", href: "/revenue-command-center/notifications", icon: MessageCircle },
    ],
  },
  {
    id: "strategy",
    label: "Stratégie et orchestration",
    icon: Sparkles,
    items: [
      { label: "Strategy Room", href: "/revenue-command-center/strategy-room", icon: Sparkles },
      { label: "Automation", href: "/revenue-command-center/automation", icon: Zap },
      { label: "Activation système", href: "/revenue-command-center/system-activation", icon: ShieldCheck },
      { label: "Master Command", href: "/revenue-command-center/master-command", icon: Command },
      { label: "Elite Command", href: "/revenue-command-center/elite-command", icon: Target },
    ],
  },
];

function isActive(pathname: string, item: NavEntry) {
  const candidates = [item.href, ...(item.aliases || [])];
  return candidates.some((href) =>
    href === "/revenue-command-center"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`),
  );
}

export function RevenueCommandCenterSidebar({
  collapsed = false,
  overlayOpen = false,
  onToggleCollapsed,
  onOpenOverlay,
  onCloseOverlay,
}: SidebarProps) {
  const pathname = usePathname() || "/revenue-command-center";
  const compact = collapsed && !overlayOpen;
  const [query, setQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navGroups.map((group) => [group.id, true])),
  );

  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fr-FR");
    if (!normalized) return navGroups;
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          `${item.label} ${item.href}`.toLocaleLowerCase("fr-FR").includes(normalized),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [query]);

  function closeAfterNavigation() {
    onCloseOverlay?.();
  }

  return (
    <>
      <button
        type="button"
        aria-label="Ouvrir la navigation Revenue Command"
        className="rcc-sovereignty-mobile-trigger"
        onClick={onOpenOverlay}
      >
        <Menu aria-hidden="true" />
      </button>

      <button
        type="button"
        aria-label="Fermer la navigation Revenue Command"
        className="rcc-sovereignty-backdrop"
        data-open={overlayOpen ? "true" : "false"}
        onClick={onCloseOverlay}
      />

      <aside
        aria-label="Navigation Revenue Command Center"
        className="rcc-sovereignty-sidebar"
        data-collapsed={compact ? "true" : "false"}
        data-overlay-open={overlayOpen ? "true" : "false"}
      >
        <div className="rcc-sovereignty-brand">
          <Link
            href="/revenue-command-center"
            className="rcc-sovereignty-brand-link"
            onClick={closeAfterNavigation}
            aria-label="Revenir au poste de commandement"
          >
            <span className="rcc-sovereignty-logo" aria-hidden="true">
              <span className="rcc-sovereignty-triangle" />
            </span>
            <span className="rcc-sovereignty-brand-copy">
              <strong>ANGELCARE</strong>
              <small>Revenue Command OS</small>
            </span>
          </Link>

          <div className="rcc-sovereignty-brand-actions">
            <button
              type="button"
              className="rcc-sovereignty-icon-button rcc-sovereignty-desktop-control"
              aria-label={collapsed ? "Déployer la barre latérale" : "Réduire la barre latérale"}
              onClick={onToggleCollapsed}
            >
              {compact ? <PanelLeftOpen /> : <PanelLeftClose />}
            </button>
            <button
              type="button"
              className="rcc-sovereignty-icon-button rcc-sovereignty-overlay-close"
              aria-label="Fermer la navigation"
              onClick={onCloseOverlay}
            >
              <X />
            </button>
          </div>
        </div>

        {!compact && (
          <div className="rcc-sovereignty-search-wrap">
            <Search aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un espace…"
              aria-label="Rechercher dans les espaces Revenue Command"
            />
          </div>
        )}

        <nav className="rcc-sovereignty-nav">
          {filteredGroups.map((group) => {
            const GroupIcon = group.icon;
            const expanded = query ? true : expandedGroups[group.id] !== false;
            const groupContainsActive = group.items.some((item) => isActive(pathname, item));

            return (
              <section className="rcc-sovereignty-group" key={group.id} data-active={groupContainsActive ? "true" : "false"}>
                {!compact ? (
                  <button
                    type="button"
                    className="rcc-sovereignty-group-button"
                    onClick={() =>
                      setExpandedGroups((current) => ({
                        ...current,
                        [group.id]: !expanded,
                      }))
                    }
                    aria-expanded={expanded}
                  >
                    <span>
                      <GroupIcon aria-hidden="true" />
                      {group.label}
                    </span>
                    <ChevronDown aria-hidden="true" data-expanded={expanded ? "true" : "false"} />
                  </button>
                ) : (
                  <div className="rcc-sovereignty-group-marker" title={group.label}>
                    <GroupIcon aria-hidden="true" />
                  </div>
                )}

                {expanded && (
                  <div className="rcc-sovereignty-items">
                    {group.items.map((item) => {
                      const active = isActive(pathname, item);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeAfterNavigation}
                          className="rcc-sovereignty-nav-item"
                          data-active={active ? "true" : "false"}
                          aria-current={active ? "page" : undefined}
                          title={compact ? item.label : undefined}
                        >
                          <span className="rcc-sovereignty-nav-icon">
                            <Icon aria-hidden="true" />
                          </span>
                          {!compact && <span className="rcc-sovereignty-nav-label">{item.label}</span>}
                          {!compact && <ChevronRight className="rcc-sovereignty-nav-arrow" aria-hidden="true" />}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </nav>

        <div className="rcc-sovereignty-footer">
          <span className="rcc-sovereignty-status-dot" aria-hidden="true" />
          {!compact && (
            <span>
              <strong>Connexion opérationnelle</strong>
              <small>Routes, permissions et câblages existants préservés.</small>
            </span>
          )}
        </div>
      </aside>
    </>
  );
}
