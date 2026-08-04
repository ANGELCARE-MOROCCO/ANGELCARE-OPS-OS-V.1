"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Command,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import AngelCareLogo from "@/components/brand/AngelCareLogo";
import {
  HR_NAVIGATION_GROUPS,
  canSeeNavigationItem,
  isNavigationItemActive,
} from "@/lib/hr-shell/navigation";
import type { HRShellIdentity, HRShellSnapshot } from "@/lib/hr-shell/types";
import styles from "./HRSovereignShell.module.css";

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "AC";
}

export default function HRSovereignSidebar({
  collapsed,
  mobileOpen,
  onToggleCollapsed,
  onCloseMobile,
  identity,
  snapshot,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
  identity: HRShellIdentity;
  snapshot: HRShellSnapshot;
}) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const activeGroupKey = useMemo(() => HR_NAVIGATION_GROUPS.find((group) => group.items.some((item) => isNavigationItemActive(pathname, item)))?.key || "command", [pathname]);
  const [openGroups, setOpenGroups] = useState<string[]>([activeGroupKey]);

  useEffect(() => {
    setOpenGroups((current) => current.includes(activeGroupKey) ? current : [...current, activeGroupKey]);
  }, [activeGroupKey]);

  useEffect(() => {
    onCloseMobile();
  }, [pathname, onCloseMobile]);

  const visibleGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fr");
    return HR_NAVIGATION_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const visible = canSeeNavigationItem({ item, role: identity.role, permissions: identity.permissions, sovereign: identity.sovereign });
        if (!visible) return false;
        if (!normalizedQuery) return true;
        return `${item.label} ${item.description} ${group.label}`.toLocaleLowerCase("fr").includes(normalizedQuery);
      }),
    })).filter((group) => group.items.length);
  }, [identity.permissions, identity.role, identity.sovereign, query]);

  function toggleGroup(key: string) {
    setOpenGroups((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }

  return (
    <>
      <button className={`${styles.mobileBackdrop} ${mobileOpen ? styles.mobileBackdropVisible : ""}`} onClick={onCloseMobile} aria-label="Fermer la navigation RH" type="button" />
      <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""} ${mobileOpen ? styles.sidebarMobileOpen : ""}`} aria-label="Navigation du module Ressources Humaines">
        <header className={styles.brandZone}>
          <div className={styles.brandLogoWrap}>
            <AngelCareLogo size={collapsed ? "xs" : "sm"} priority />
          </div>
          {!collapsed ? <div className={styles.brandCopy}><strong>HR Command OS</strong><span>Ressources Humaines</span></div> : null}
          <button className={styles.mobileClose} onClick={onCloseMobile} aria-label="Fermer" type="button"><X size={18} /></button>
        </header>

        <section className={styles.commandIdentity}>
          <span className={styles.commandIcon}><Command size={17} /></span>
          {!collapsed ? <span><strong>Commandement RH</strong><small>{identity.roleLabel}</small></span> : null}
          <span className={styles.onlineDot} title="Shell RH opérationnel" />
        </section>

        {!collapsed ? (
          <label className={styles.searchBox}>
            <Search size={16} />
            <input value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder="Rechercher un espace RH…" aria-label="Rechercher dans la navigation RH" />
            {query ? <button onClick={() => setQuery("")} type="button" aria-label="Effacer la recherche"><X size={14} /></button> : null}
          </label>
        ) : (
          <button className={styles.collapsedSearch} onClick={onToggleCollapsed} title="Ouvrir la recherche" type="button"><Search size={18} /></button>
        )}

        <nav className={styles.navScroll}>
          {visibleGroups.map((group) => {
            const open =
              collapsed ||
              Boolean(query.trim()) ||
              openGroups.includes(group.key) ||
              group.key === activeGroupKey;
            const GroupIcon = group.icon;
            return (
              <section className={styles.navGroup} key={group.key}>
                <button className={`${styles.groupButton} ${group.key === activeGroupKey ? styles.groupButtonActive : ""}`} onClick={() => toggleGroup(group.key)} type="button" aria-expanded={open} data-tooltip={group.label}>
                  <GroupIcon size={18} />
                  {!collapsed ? <span><strong>{group.label}</strong><small>{group.description}</small></span> : null}
                  {!collapsed ? <ChevronDown className={open ? styles.chevronOpen : styles.chevron} size={15} /> : null}
                </button>
                {open ? (
                  <div className={styles.groupItems}>
                    {group.items.map((item) => {
                      const active = isNavigationItemActive(pathname, item);
                      const ItemIcon = item.icon;
                      return (
                        <Link className={`${styles.navItem} ${active ? styles.navItemActive : ""}`} href={item.href} key={item.key} data-tooltip={item.label} aria-current={active ? "page" : undefined}>
                          <span className={styles.navIcon}><ItemIcon size={17} /></span>
                          {!collapsed ? <span className={styles.navCopy}><strong>{item.label}</strong><small>{item.description}</small></span> : null}
                          {!collapsed && item.badge ? <span className={`${styles.navBadge} ${item.badge === "live" ? styles.navBadgeLive : item.badge === "new" ? styles.navBadgeNew : styles.navBadgeControl}`}>{item.badge === "live" ? "LIVE" : item.badge === "new" ? "NEW" : "CTRL"}</span> : null}
                          {!collapsed ? <ChevronRight className={styles.navArrow} size={14} /> : null}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            );
          })}
          {!visibleGroups.length ? <div className={styles.noResults}><Search size={20} /><strong>Aucun espace trouvé</strong><span>Modifiez votre recherche.</span></div> : null}
        </nav>

        <footer className={styles.sidebarFooter}>
          <div className={styles.userIdentity} data-tooltip={identity.fullName}>
            <span className={styles.avatar}>{initials(identity.fullName)}</span>
            {!collapsed ? <span><strong>{identity.fullName}</strong><small>{identity.department || identity.roleLabel}</small></span> : null}
            {!collapsed ? <ShieldCheck size={16} /> : null}
          </div>
          {!collapsed ? (
            <div className={styles.snapshotMini}>
              <Sparkles size={15} />
              <span><strong>Snapshot RH</strong><small>{snapshot.generatedLabel} · {snapshot.sourceHealth.available}/{snapshot.sourceHealth.total} facteurs</small></span>
            </div>
          ) : null}
          <button className={styles.collapseButton} onClick={onToggleCollapsed} type="button" aria-label={collapsed ? "Déployer la navigation RH" : "Réduire la navigation RH"} data-tooltip={collapsed ? "Déployer" : "Réduire"}>
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            {!collapsed ? <span>Réduire la navigation</span> : null}
            {!collapsed ? <ChevronLeft size={14} /> : null}
          </button>
        </footer>
      </aside>
    </>
  );
}
