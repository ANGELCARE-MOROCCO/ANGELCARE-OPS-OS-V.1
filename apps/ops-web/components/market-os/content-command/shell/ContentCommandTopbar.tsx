"use client"

import Link from "next/link"
import * as React from "react"
import type { LucideIcon } from "lucide-react"
import {
  Bell,
  ChevronDown,
  CircleHelp,
  Command,
  FilePenLine,
  Focus,
  LayoutDashboard,
  Menu,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  X,
} from "lucide-react"
import {
  CONTENT_COMMAND_ROOT,
  getContentCommandNavigationGroup,
  resolveContentCommandContextRoute,
  resolveContentCommandRoute,
} from "../content-command-navigation"
import type {
  ContentCommandDensity,
  ContentCommandExperienceMode,
  ContentCommandSidebarMode,
} from "./content-command-shell-types"
import styles from "./content-command-shell.module.css"

type ContentCommandTopbarProps = {
  pathname: string
  mode: ContentCommandExperienceMode
  density: ContentCommandDensity
  sidebarMode: ContentCommandSidebarMode
  onModeChange: (mode: ContentCommandExperienceMode) => void
  onDensityToggle: () => void
  onPaletteOpen: () => void
  onMobileMenuOpen: () => void
  onSidebarRestore: () => void
}

const MODE_OPTIONS: Array<{
  value: ContentCommandExperienceMode
  label: string
  description: string
  icon: LucideIcon
}> = [
  {
    value: "executive",
    label: "Exécutif",
    description: "Décisions, risques et position globale",
    icon: LayoutDashboard,
  },
  {
    value: "production",
    label: "Production",
    description: "Travail, délais, assets et blocages",
    icon: SlidersHorizontal,
  },
  {
    value: "focus",
    label: "Focus",
    description: "Réduction du bruit et travail actif",
    icon: Focus,
  },
  {
    value: "audit",
    label: "Audit",
    description: "Provenance, historique et preuves",
    icon: ShieldCheck,
  },
]

function Breadcrumbs({ pathname }: { pathname: string }) {
  const route = resolveContentCommandRoute(pathname)
  const context = resolveContentCommandContextRoute(pathname)
  const group = route ? getContentCommandNavigationGroup(route.group) : undefined

  const crumbs: Array<{ label: string; href?: string }> = [
    { label: "Content Command", href: pathname === CONTENT_COMMAND_ROOT ? undefined : CONTENT_COMMAND_ROOT },
  ]

  if (context) {
    crumbs.push({ label: context.route.parentLabel, href: context.route.parentHref })
    crumbs.push({ label: context.route.label })
  } else if (route) {
    if (group && route.href !== CONTENT_COMMAND_ROOT) crumbs.push({ label: group.label })
    if (route.href !== CONTENT_COMMAND_ROOT) crumbs.push({ label: route.label })
  }

  return (
    <nav className={styles.breadcrumbs} aria-label="Fil d’Ariane">
      {crumbs.map((crumb, index) => (
        <React.Fragment key={`${crumb.label}-${index}`}>
          {index > 0 ? <span className={styles.breadcrumbSeparator}>/</span> : null}
          {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}
        </React.Fragment>
      ))}
    </nav>
  )
}

export default function ContentCommandTopbar({
  pathname,
  mode,
  density,
  sidebarMode,
  onModeChange,
  onDensityToggle,
  onPaletteOpen,
  onMobileMenuOpen,
  onSidebarRestore,
}: ContentCommandTopbarProps) {
  const [modeMenuOpen, setModeMenuOpen] = React.useState(false)
  const [createMenuOpen, setCreateMenuOpen] = React.useState(false)
  const [notificationOpen, setNotificationOpen] = React.useState(false)
  const [userOpen, setUserOpen] = React.useState(false)
  const [helpOpen, setHelpOpen] = React.useState(false)
  const activeRoute = resolveContentCommandRoute(pathname)
  const contextRoute = resolveContentCommandContextRoute(pathname)
  const activeMode = MODE_OPTIONS.find((option) => option.value === mode) || MODE_OPTIONS[0]
  const ActiveModeIcon = activeMode.icon
  const ActiveRouteIcon = contextRoute?.route.icon || activeRoute?.icon || LayoutDashboard
  const workspaceTitle = contextRoute?.route.label || activeRoute?.label || "Content Command"
  const workspaceDescription = contextRoute?.route.parentLabel || activeRoute?.description || "Headquarters opérationnel AngelCare"

  React.useEffect(() => {
    const closeMenus = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setModeMenuOpen(false)
      setCreateMenuOpen(false)
      setNotificationOpen(false)
      setUserOpen(false)
      setHelpOpen(false)
    }
    window.addEventListener("keydown", closeMenus)
    return () => window.removeEventListener("keydown", closeMenus)
  }, [])

  function closeOtherMenus(menu: "mode" | "create" | "notification" | "user" | "help") {
    if (menu !== "mode") setModeMenuOpen(false)
    if (menu !== "create") setCreateMenuOpen(false)
    if (menu !== "notification") setNotificationOpen(false)
    if (menu !== "user") setUserOpen(false)
    if (menu !== "help") setHelpOpen(false)
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.topbarIdentity}>
        <button
          type="button"
          className={styles.topbarMobileMenu}
          onClick={onMobileMenuOpen}
          aria-label="Ouvrir le menu"
        >
          <Menu aria-hidden="true" />
        </button>
        {sidebarMode === "focus-hidden" ? (
          <button
            type="button"
            className={styles.topbarRestoreMenu}
            onClick={onSidebarRestore}
            aria-label="Restaurer le menu"
          >
            <Menu aria-hidden="true" />
          </button>
        ) : null}
        <span className={styles.workspaceIcon} aria-hidden="true">
          <ActiveRouteIcon />
        </span>
        <div className={styles.workspaceIdentityCopy}>
          <Breadcrumbs pathname={pathname} />
          <div className={styles.workspaceTitleLine}>
            <strong>{workspaceTitle}</strong>
            <span>{workspaceDescription}</span>
          </div>
        </div>
      </div>

      <div className={styles.topbarActions}>
        <button type="button" className={styles.searchTrigger} onClick={onPaletteOpen}>
          <Search aria-hidden="true" />
          <span>Rechercher ou commander</span>
          <kbd>⌘ K</kbd>
        </button>

        <div className={styles.popoverAnchor}>
          <button
            type="button"
            className={styles.iconAction}
            onClick={() => {
              closeOtherMenus("mode")
              setModeMenuOpen((open) => !open)
            }}
            aria-expanded={modeMenuOpen}
            aria-label={`Mode d’expérience actif : ${activeMode.label}`}
            title={`Mode ${activeMode.label}`}
          >
            <ActiveModeIcon aria-hidden="true" />
            <span className={styles.actionLabel}>{activeMode.label}</span>
            <ChevronDown aria-hidden="true" />
          </button>
          {modeMenuOpen ? (
            <div className={styles.popoverPanel} role="menu" aria-label="Modes d’expérience">
              <div className={styles.popoverHeader}>
                <span>Perspective opérationnelle</span>
                <button type="button" onClick={() => setModeMenuOpen(false)} aria-label="Fermer">
                  <X aria-hidden="true" />
                </button>
              </div>
              {MODE_OPTIONS.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.menuOption} ${mode === option.value ? styles.menuOptionActive : ""}`}
                    onClick={() => {
                      onModeChange(option.value)
                      setModeMenuOpen(false)
                    }}
                    role="menuitemradio"
                    aria-checked={mode === option.value}
                  >
                    <span className={styles.menuOptionIcon}>
                      <Icon aria-hidden="true" />
                    </span>
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </span>
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className={styles.iconAction}
          onClick={onDensityToggle}
          aria-label={`Passer en vue ${density === "comfortable" ? "compacte" : "confortable"}`}
          title={density === "comfortable" ? "Vue compacte" : "Vue confortable"}
        >
          <SlidersHorizontal aria-hidden="true" />
          <span className={styles.actionLabel}>{density === "comfortable" ? "Confort" : "Compact"}</span>
        </button>

        <div className={styles.popoverAnchor}>
          <button
            type="button"
            className={styles.primaryAction}
            onClick={() => {
              closeOtherMenus("create")
              setCreateMenuOpen((open) => !open)
            }}
            aria-expanded={createMenuOpen}
          >
            <Sparkles aria-hidden="true" />
            <span>Créer</span>
            <ChevronDown aria-hidden="true" />
          </button>
          {createMenuOpen ? (
            <div className={`${styles.popoverPanel} ${styles.createPopover}`} role="menu" aria-label="Actions de création">
              <div className={styles.popoverHeader}>
                <span>Lancer un travail gouverné</span>
                <button type="button" onClick={() => setCreateMenuOpen(false)} aria-label="Fermer">
                  <X aria-hidden="true" />
                </button>
              </div>
              <Link href={`${CONTENT_COMMAND_ROOT}/create`} className={styles.createOption} onClick={() => setCreateMenuOpen(false)}>
                <FilePenLine aria-hidden="true" />
                <span><strong>Création rapide</strong><small>Initialiser un dossier standard</small></span>
              </Link>
              <Link href={`${CONTENT_COMMAND_ROOT}/studio`} className={styles.createOption} onClick={() => setCreateMenuOpen(false)}>
                <Sparkles aria-hidden="true" />
                <span><strong>Studios de création</strong><small>Digital, Print & Terrain ou Corporate</small></span>
              </Link>
              <Link href={`${CONTENT_COMMAND_ROOT}/briefs`} className={styles.createOption} onClick={() => setCreateMenuOpen(false)}>
                <Command aria-hidden="true" />
                <span><strong>Briefing Suite</strong><small>Structurer une demande avant production</small></span>
              </Link>
            </div>
          ) : null}
        </div>

        <div className={styles.popoverAnchor}>
          <button
            type="button"
            className={styles.iconOnlyAction}
            onClick={() => {
              closeOtherMenus("notification")
              setNotificationOpen((open) => !open)
            }}
            aria-label="Notifications"
            aria-expanded={notificationOpen}
          >
            <Bell aria-hidden="true" />
          </button>
          {notificationOpen ? (
            <div className={`${styles.popoverPanel} ${styles.notificationPopover}`}>
              <div className={styles.popoverHeader}>
                <span>Notifications</span>
                <button type="button" onClick={() => setNotificationOpen(false)} aria-label="Fermer">
                  <X aria-hidden="true" />
                </button>
              </div>
              <div className={styles.emptyPopoverState}>
                <Bell aria-hidden="true" />
                <strong>Aucune notification chargée</strong>
                <p>Le shell n’invente aucun signal. Les événements réels apparaîtront ici dès qu’ils sont disponibles.</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className={styles.popoverAnchor}>
          <button
            type="button"
            className={styles.iconOnlyAction}
            onClick={() => {
              closeOtherMenus("help")
              setHelpOpen((open) => !open)
            }}
            aria-label="Aide contextuelle"
            aria-expanded={helpOpen}
          >
            <CircleHelp aria-hidden="true" />
          </button>
          {helpOpen ? (
            <div className={`${styles.popoverPanel} ${styles.helpPopover}`}>
              <div className={styles.popoverHeader}>
                <span>Doctrine du workspace</span>
                <button type="button" onClick={() => setHelpOpen(false)} aria-label="Fermer">
                  <X aria-hidden="true" />
                </button>
              </div>
              <div className={styles.helpContent}>
                <strong>{workspaceTitle}</strong>
                <p>{workspaceDescription}</p>
                <dl>
                  <div><dt>Recherche</dt><dd>⌘ K / Ctrl K</dd></div>
                  <div><dt>Navigation</dt><dd>Sidebar rétractable</dd></div>
                  <div><dt>Autorité</dt><dd>Contrôlée par la plateforme</dd></div>
                </dl>
              </div>
            </div>
          ) : null}
        </div>

        <div className={styles.popoverAnchor}>
          <button
            type="button"
            className={styles.userAction}
            onClick={() => {
              closeOtherMenus("user")
              setUserOpen((open) => !open)
            }}
            aria-expanded={userOpen}
          >
            <span className={styles.userAvatar}><UserRound aria-hidden="true" /></span>
            <span className={styles.userCopy}>
              <strong>Session AngelCare</strong>
              <small>Utilisateur authentifié</small>
            </span>
            <ChevronDown aria-hidden="true" />
          </button>
          {userOpen ? (
            <div className={`${styles.popoverPanel} ${styles.userPopover}`}>
              <div className={styles.popoverHeader}>
                <span>Identité & autorité</span>
                <button type="button" onClick={() => setUserOpen(false)} aria-label="Fermer">
                  <X aria-hidden="true" />
                </button>
              </div>
              <div className={styles.userSummary}>
                <span className={styles.userSummaryAvatar}><UserRound aria-hidden="true" /></span>
                <div>
                  <strong>Session protégée</strong>
                  <small>Les nom, rôle et permissions sont résolus par la plateforme d’authentification.</small>
                </div>
              </div>
              <div className={styles.userAuthorityNotice}>
                <ShieldCheck aria-hidden="true" />
                <span><strong>Autorité gouvernée</strong><small>Aucune identité ni permission n’est fabriquée dans le shell.</small></span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
