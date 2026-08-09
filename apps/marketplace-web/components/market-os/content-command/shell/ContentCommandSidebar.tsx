"use client"

import Link from "next/link"
import * as React from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Grip,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Star,
  X,
} from "lucide-react"
import AngelCareLogo from "@/components/brand/AngelCareLogo"
import {
  CONTENT_COMMAND_ROOT,
  contentCommandNavigationGroups,
  contentCommandRoutes,
  getContentCommandRoutesForGroup,
  resolveContentCommandContextRoute,
  resolveContentCommandRoute,
  routeIsActive,
  type ContentCommandNavigationGroup,
  type ContentCommandRoute,
} from "../content-command-navigation"
import type {
  ContentCommandRecentRoute,
  ContentCommandSidebarMode,
} from "./content-command-shell-types"
import styles from "./content-command-shell.module.css"

type ContentCommandSidebarProps = {
  pathname: string
  sidebarMode: ContentCommandSidebarMode
  mobileOpen: boolean
  expandedGroups: ContentCommandNavigationGroup[]
  favorites: string[]
  recentRoutes: ContentCommandRecentRoute[]
  onSidebarModeChange: (mode: ContentCommandSidebarMode) => void
  onMobileOpenChange: (open: boolean) => void
  onGroupToggle: (group: ContentCommandNavigationGroup) => void
  onFavoriteToggle: (routeKey: string) => void
}

function NavItem({
  route,
  pathname,
  compact,
  favorite,
  onFavoriteToggle,
  onNavigate,
  contextualParentHref,
}: {
  route: ContentCommandRoute
  pathname: string
  compact: boolean
  favorite: boolean
  onFavoriteToggle: (routeKey: string) => void
  onNavigate?: () => void
  contextualParentHref?: string
}) {
  const active = routeIsActive(pathname, route) || route.href === contextualParentHref
  const Icon = route.icon

  return (
    <div
      className={`${styles.navItemRow} ${active ? styles.navItemRowActive : ""} ${
        route.legacy ? styles.navItemLegacy : ""
      }`}
      data-route-key={route.key}
    >
      <Link
        href={route.href}
        className={styles.navItem}
        aria-current={active ? "page" : undefined}
        aria-label={compact ? `${route.label}. ${route.description}` : undefined}
        title={compact ? `${route.label} — ${route.description}` : undefined}
        onClick={onNavigate}
      >
        <span className={styles.navItemIcon} aria-hidden="true">
          <Icon />
        </span>
        <span className={styles.navItemCopy}>
          <strong>{route.label}</strong>
          <small>{route.description}</small>
        </span>
        {route.legacy ? <span className={styles.controlledBadge}>Contrôlé</span> : null}
      </Link>
      {!compact ? (
        <button
          type="button"
          className={`${styles.favoriteButton} ${favorite ? styles.favoriteButtonActive : ""}`}
          onClick={() => onFavoriteToggle(route.key)}
          aria-label={favorite ? `Retirer ${route.label} des favoris` : `Ajouter ${route.label} aux favoris`}
          aria-pressed={favorite}
          title={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Star aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}

function QuickRouteLink({
  route,
  pathname,
  compact,
  onNavigate,
}: {
  route: ContentCommandRoute
  pathname: string
  compact: boolean
  onNavigate?: () => void
}) {
  const Icon = route.icon
  const active = routeIsActive(pathname, route)
  return (
    <Link
      href={route.href}
      className={`${styles.quickRoute} ${active ? styles.quickRouteActive : ""}`}
      title={compact ? route.label : undefined}
      aria-label={compact ? route.label : undefined}
      onClick={onNavigate}
    >
      <Icon aria-hidden="true" />
      <span>{route.shortLabel || route.label}</span>
    </Link>
  )
}

export default function ContentCommandSidebar({
  pathname,
  sidebarMode,
  mobileOpen,
  expandedGroups,
  favorites,
  recentRoutes,
  onSidebarModeChange,
  onMobileOpenChange,
  onGroupToggle,
  onFavoriteToggle,
}: ContentCommandSidebarProps) {
  const compact = sidebarMode === "compact"
  const mobileDrawerRef = React.useRef<HTMLElement>(null)
  const contextRoute = resolveContentCommandContextRoute(pathname)
  const contextualParentRoute = contextRoute
    ? contentCommandRoutes.find((route) => route.href === contextRoute.route.parentHref)
    : undefined
  const activeRoute = resolveContentCommandRoute(pathname) || contextualParentRoute
  const activeGroup = activeRoute?.group
  const favoriteRoutes = favorites
    .map((key) => contentCommandRoutes.find((route) => route.key === key))
    .filter((route): route is ContentCommandRoute => Boolean(route))
  const recentResolvedRoutes = recentRoutes
    .map((recent) => contentCommandRoutes.find((route) => route.href === recent.href))
    .filter((route): route is ContentCommandRoute => Boolean(route))

  React.useEffect(() => {
    if (!mobileOpen) return
    const previousOverflow = document.body.style.overflow
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.style.overflow = "hidden"

    const drawer = mobileDrawerRef.current
    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",")
    const focusable = drawer ? Array.from(drawer.querySelectorAll<HTMLElement>(focusableSelector)) : []
    focusable[0]?.focus()

    const handleDrawerKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onMobileOpenChange(false)
        return
      }
      if (event.key !== "Tab" || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener("keydown", handleDrawerKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleDrawerKey)
      previouslyFocused?.focus()
    }
  }, [mobileOpen, onMobileOpenChange])

  function renderSidebarContent(mobile: boolean) {
    const effectiveCompact = mobile ? false : compact
    return (
      <>
        <header className={styles.sidebarBrand}>
          <Link
            href="/market-os/marketing-home"
            className={styles.brandLink}
            aria-label="Retour à Market OS"
            onClick={mobile ? () => onMobileOpenChange(false) : undefined}
          >
            <span className={styles.brandLogoFrame}>
              <AngelCareLogo size={effectiveCompact ? "sm" : "md"} />
            </span>
            <span className={styles.brandCopy}>
              <small>SANILA MARKET OS</small>
              <strong>Content Command</strong>
              <span>Headquarters</span>
            </span>
          </Link>
          {mobile ? (
            <button
              type="button"
              className={styles.sidebarIconButton}
              onClick={() => onMobileOpenChange(false)}
              aria-label="Fermer le menu"
            >
              <X aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              className={styles.sidebarIconButton}
              onClick={() => onSidebarModeChange(compact ? "expanded" : "compact")}
              aria-label={compact ? "Déployer le menu" : "Réduire le menu"}
              title={compact ? "Déployer le menu" : "Réduire le menu"}
            >
              {compact ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
            </button>
          )}
        </header>

        <div className={styles.sidebarMandate} title={effectiveCompact ? "Mandat actif · Content Operations 360" : undefined}>
          <span className={styles.mandatePulse} aria-hidden="true" />
          <span className={styles.mandateCopy}>
            <small>Mandat actif</small>
            <strong>Content Operations 360</strong>
          </span>
          <ShieldCheck aria-hidden="true" />
        </div>

        <nav className={styles.sidebarNavigation} aria-label="Navigation Content Command Headquarters">
          {favoriteRoutes.length > 0 ? (
            <section className={styles.quickSection} aria-labelledby="cc-favorites-title">
              <div className={styles.quickSectionTitle} id="cc-favorites-title">
                <Star aria-hidden="true" />
                <span>Favoris</span>
              </div>
              <div className={styles.quickRoutes}>
                {favoriteRoutes.map((route) => (
                  <QuickRouteLink
                    key={route.key}
                    route={route}
                    pathname={pathname}
                    compact={effectiveCompact}
                    onNavigate={mobile ? () => onMobileOpenChange(false) : undefined}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {!effectiveCompact && recentResolvedRoutes.length > 0 ? (
            <section className={styles.quickSection} aria-labelledby="cc-recent-title">
              <div className={styles.quickSectionTitle} id="cc-recent-title">
                <Clock3 aria-hidden="true" />
                <span>Récents</span>
              </div>
              <div className={styles.quickRoutes}>
                {recentResolvedRoutes.slice(0, 3).map((route) => (
                  <QuickRouteLink
                    key={route.key}
                    route={route}
                    pathname={pathname}
                    compact={false}
                    onNavigate={mobile ? () => onMobileOpenChange(false) : undefined}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <div className={styles.navigationGroups}>
            {contentCommandNavigationGroups.map((group) => {
              const routes = getContentCommandRoutesForGroup(group.key)
              const GroupIcon = group.icon
              const expanded =
                effectiveCompact || expandedGroups.includes(group.key) || activeGroup === group.key
              return (
                <section
                  key={group.key}
                  className={`${styles.navigationGroup} ${
                    activeGroup === group.key ? styles.navigationGroupActive : ""
                  }`}
                >
                  <button
                    type="button"
                    className={styles.groupButton}
                    onClick={() => {
                      if (effectiveCompact && !mobile) {
                        onSidebarModeChange("expanded")
                        return
                      }
                      onGroupToggle(group.key)
                    }}
                    aria-expanded={expanded}
                    aria-controls={`cc-nav-group-${group.key}`}
                    title={effectiveCompact ? `${group.label} — ${group.description}` : undefined}
                  >
                    <span className={styles.groupIcon} aria-hidden="true">
                      <GroupIcon />
                    </span>
                    <span className={styles.groupCopy}>
                      <strong>{group.label}</strong>
                      <small>{group.description}</small>
                    </span>
                    <ChevronDown className={styles.groupChevron} aria-hidden="true" />
                  </button>

                  <div
                    id={`cc-nav-group-${group.key}`}
                    className={`${styles.groupItems} ${expanded ? styles.groupItemsExpanded : ""}`}
                  >
                    {routes.map((route) => (
                      <NavItem
                        key={route.key}
                        route={route}
                        pathname={pathname}
                        compact={effectiveCompact}
                        favorite={favorites.includes(route.key)}
                        onFavoriteToggle={onFavoriteToggle}
                        onNavigate={mobile ? () => onMobileOpenChange(false) : undefined}
                        contextualParentHref={contextRoute?.route.parentHref}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </nav>

        <footer className={styles.sidebarFooter}>
          <Link
            href={CONTENT_COMMAND_ROOT}
            className={styles.footerStatus}
            title={effectiveCompact ? "Environnement protégé · Shell souverain actif" : undefined}
            onClick={mobile ? () => onMobileOpenChange(false) : undefined}
          >
            <span className={styles.statusDot} aria-hidden="true" />
            <span className={styles.footerStatusCopy}>
              <small>Environnement protégé</small>
              <strong>Shell souverain actif</strong>
            </span>
            <ExternalLink aria-hidden="true" />
          </Link>
          {!mobile ? (
            <button
              type="button"
              className={styles.focusButton}
              onClick={() => onSidebarModeChange("focus-hidden")}
              title="Masquer le menu et maximiser le canvas"
            >
              <Grip aria-hidden="true" />
              <span>Mode canvas</span>
              <ChevronLeft aria-hidden="true" />
            </button>
          ) : null}
        </footer>
      </>
    )
  }

  return (
    <>
      <aside className={styles.sidebar} data-sidebar-mode={sidebarMode}>
        {renderSidebarContent(false)}
      </aside>

      <button
        type="button"
        className={styles.mobileMenuTrigger}
        onClick={() => onMobileOpenChange(true)}
        aria-label="Ouvrir le menu Content Command"
        aria-expanded={mobileOpen}
      >
        <Menu aria-hidden="true" />
      </button>

      {mobileOpen ? (
        <div className={styles.mobileDrawerBackdrop} role="presentation" onMouseDown={() => onMobileOpenChange(false)}>
          <aside
            ref={mobileDrawerRef}
            className={styles.mobileDrawer}
            role="dialog"
            aria-modal="true"
            aria-label="Menu Content Command Headquarters"
            onMouseDown={(event) => event.stopPropagation()}
          >
            {renderSidebarContent(true)}
          </aside>
        </div>
      ) : null}

      {sidebarMode === "focus-hidden" ? (
        <button
          type="button"
          className={styles.focusRestoreRail}
          onClick={() => onSidebarModeChange("expanded")}
          aria-label="Restaurer le menu Content Command"
          title="Restaurer le menu"
        >
          <ChevronRight aria-hidden="true" />
          <span>Menu</span>
        </button>
      ) : null}
    </>
  )
}
