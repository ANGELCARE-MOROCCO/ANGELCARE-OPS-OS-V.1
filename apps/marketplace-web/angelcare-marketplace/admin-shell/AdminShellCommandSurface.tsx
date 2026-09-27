'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  Boxes,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  ClipboardCheck,
  ExternalLink,
  LayoutGrid,
  MessageSquareText,
  School,
  Search,
  Settings2,
  ShoppingBag,
  UserPlus,
  X,
} from 'lucide-react'
import { GlobalCommandPalette } from '../enterprise-command/components/GlobalCommandPalette'
import type { AdminShellIndicator, AdminShellNotification, AdminShellSnapshot, AdminShellWorkspace } from './types'
import styles from './admin-shell-pro-max.module.css'

const SPEED_KEY = 'angelcare.marketplace.admin-signal-speed.v1'
const SIGNALS_KEY = 'angelcare.marketplace.admin-signal-selection.v1'

type FeedSpeed = 'calm' | 'normal' | 'fast'

const speedLabel: Record<FeedSpeed, string> = { calm: '1×', normal: '2×', fast: '3×' }

function familyFor(workspace: AdminShellWorkspace): string {
  const key = `${workspace.domain} ${workspace.href}`.toLowerCase()
  if (key.includes('/sanila') || workspace.domain === 'sanila') return 'SANILA'
  if (/executive|command|business-pulse|approvals|action-center|brief/.test(key)) return 'Commandement & décision'
  if (/orders|booking|journey|conversion|fulfillment|subscriptions/.test(key)) return 'Commerce & exécution'
  if (/customer|famil|public-inquir|crm|support/.test(key)) return 'Clients & relation'
  if (/catalog|category|collection|commerce-studio|commerce-factory|experience|frontend|public-experience|boutique|web-presence|discovery/.test(key)) return 'Catalogue & expérience'
  if (/supply|provider|vendor|supplier|partner-os/.test(key)) return 'Supply & partenaires'
  if (/academy|vertical|development/.test(key)) return 'Academy & B2B'
  if (/finance|payment|wallet|invoice|receipt|revenue|monetization/.test(key)) return 'Finance & monétisation'
  if (/trust|quality|security|governance|configuration|readiness|launch|activation/.test(key)) return 'Trust & gouvernance'
  if (/analytics|intelligence|performance|localization|ai/.test(key)) return 'Analytics & intelligence'
  return 'Autres autorités'
}

function notificationIcon(kind: AdminShellNotification['kind']) {
  if (kind === 'order') return ShoppingBag
  if (kind === 'customer') return UserPlus
  if (kind === 'sanila') return School
  if (kind === 'approval') return ClipboardCheck
  if (kind === 'blocker') return AlertTriangle
  return MessageSquareText
}

function indicatorTone(indicator: AdminShellIndicator) {
  return indicator.tone === 'critical' ? styles.signalCritical
    : indicator.tone === 'attention' ? styles.signalAttention
      : indicator.tone === 'positive' ? styles.signalPositive
        : styles.signalNeutral
}

export function AdminShellCommandSurface({
  snapshot,
  workspaces,
  territoryId,
  permissionCount,
}: {
  snapshot: AdminShellSnapshot
  workspaces: AdminShellWorkspace[]
  territoryId: string | null
  permissionCount: number
}) {
  const allKeys = useMemo(() => snapshot.indicators.map((item) => item.key), [snapshot.indicators])
  const [speed, setSpeed] = useState<FeedSpeed>('calm')
  const [selectedKeys, setSelectedKeys] = useState<string[]>(allKeys)
  const [signalMenuOpen, setSignalMenuOpen] = useState(false)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [workspaceQuery, setWorkspaceQuery] = useState('')

  useEffect(() => {
    try {
      const storedSpeed = window.localStorage.getItem(SPEED_KEY)
      if (storedSpeed === 'calm' || storedSpeed === 'normal' || storedSpeed === 'fast') setSpeed(storedSpeed)
      const raw = JSON.parse(window.localStorage.getItem(SIGNALS_KEY) || '[]')
      if (Array.isArray(raw)) {
        const valid = raw.filter((key): key is string => typeof key === 'string' && allKeys.includes(key))
        if (valid.length) setSelectedKeys(valid)
      }
    } catch {
      // Preferences are optional; the static server snapshot remains usable.
    }
  }, [allKeys])

  function chooseSpeed(value: FeedSpeed) {
    setSpeed(value)
    try { window.localStorage.setItem(SPEED_KEY, value) } catch {}
  }

  function toggleSignal(key: string) {
    setSelectedKeys((current) => {
      const next = current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
      const safe = next.length ? next : allKeys
      try { window.localStorage.setItem(SIGNALS_KEY, JSON.stringify(safe)) } catch {}
      return safe
    })
  }

  const indicators = snapshot.indicators.filter((item) => selectedKeys.includes(item.key))
  const duplicatedIndicators = [...indicators, ...indicators]
  const filteredWorkspaces = useMemo(() => {
    const needle = workspaceQuery.trim().toLowerCase()
    return workspaces.filter((workspace) => !needle || `${workspace.label} ${workspace.domain} ${workspace.href}`.toLowerCase().includes(needle))
  }, [workspaces, workspaceQuery])
  const groupedWorkspaces = useMemo(() => {
    const groups = new Map<string, AdminShellWorkspace[]>()
    for (const workspace of filteredWorkspaces) {
      const family = familyFor(workspace)
      groups.set(family, [...(groups.get(family) || []), workspace])
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, 'fr'))
  }, [filteredWorkspaces])

  const snapshotTime = new Date(snapshot.generatedAt)
  const snapshotLabel = Number.isNaN(snapshotTime.getTime())
    ? 'Snapshot chargé'
    : `Snapshot ${snapshotTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`

  return (
    <div className={styles.commandSurface}>
      <div className={styles.commandRow}>
        <div className={styles.commandBrand}>
          <span className={styles.commandPulse}><CircleGauge size={15} /></span>
          <div>
            <strong>ANGELCARE BUILD 360</strong>
            <small>Commandement global · {snapshotLabel}</small>
          </div>
        </div>

        <div className={styles.commandTools}>
          <GlobalCommandPalette triggerClassName={styles.shellSearchTrigger} />

          <button
            type="button"
            className={styles.iconCommand}
            onClick={() => { setWorkspaceOpen(true); setNotificationsOpen(false) }}
            aria-label="Ouvrir tous les workspaces"
            title="Tous les workspaces"
          >
            <LayoutGrid size={17} />
          </button>

          <div className={styles.notificationAnchor}>
            <button
              type="button"
              className={styles.iconCommand}
              data-active={notificationsOpen}
              onClick={() => { setNotificationsOpen((value) => !value); setSignalMenuOpen(false) }}
              aria-label={`${snapshot.notificationCount} notifications`}
              title="Notifications et alertes"
            >
              <Bell size={17} />
              {snapshot.notificationCount > 0 ? <span className={styles.notificationBadge}>{snapshot.notificationCount > 99 ? '99+' : snapshot.notificationCount}</span> : null}
            </button>
            {notificationsOpen ? (
              <div className={styles.notificationMenu}>
                <header>
                  <div><span>Centre d’attention</span><strong>{snapshot.notificationCount} signaux</strong></div>
                  <button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Fermer"><X size={15} /></button>
                </header>
                <div className={styles.notificationList}>
                  {snapshot.notifications.map((notification) => {
                    const Icon = notificationIcon(notification.kind)
                    return (
                      <a
                        key={notification.id}
                        href={notification.href}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.notificationItem}
                        data-severity={notification.severity}
                        onClick={() => setNotificationsOpen(false)}
                      >
                        <span className={styles.notificationIcon}><Icon size={15} /></span>
                        <span><strong>{notification.title}</strong><small>{notification.detail}</small></span>
                        <ExternalLink size={13} />
                      </a>
                    )
                  })}
                  {!snapshot.notifications.length ? <div className={styles.notificationEmpty}><CheckCircle2 size={18} />Aucune alerte dans ce snapshot.</div> : null}
                </div>
                <footer>Figé jusqu’au prochain chargement ou rafraîchissement de page.</footer>
              </div>
            ) : null}
          </div>

          <span className={styles.microMeta}>{territoryId || 'Global'}</span>
          <span className={styles.microMeta}>{permissionCount} permissions</span>
        </div>
      </div>

      <div className={styles.signalDeck} data-speed={speed}>
        <div className={styles.signalRail}>
          <div className={styles.signalViewport}>
            <div className={styles.signalTrack}>
              {duplicatedIndicators.map((indicator, index) => (
                <a
                  key={`${indicator.key}-${index}`}
                  href={indicator.href}
                  className={`${styles.signalCard} ${indicatorTone(indicator)}`}
                  aria-hidden={index >= indicators.length ? true : undefined}
                  tabIndex={index >= indicators.length ? -1 : undefined}
                >
                  <span className={styles.signalDot} />
                  <span className={styles.signalCopy}><small>{indicator.label}</small><strong>{indicator.value}</strong><em>{indicator.hint}</em></span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.signalControls}>
          <div className={styles.speedControl} aria-label="Vitesse du flux visuel">
            {(['calm', 'normal', 'fast'] as FeedSpeed[]).map((value) => (
              <button key={value} type="button" data-active={speed === value} onClick={() => chooseSpeed(value)}>{speedLabel[value]}</button>
            ))}
          </div>
          <div className={styles.signalSettingsAnchor}>
            <button
              type="button"
              className={styles.signalSettingsButton}
              data-active={signalMenuOpen}
              onClick={() => { setSignalMenuOpen((value) => !value); setNotificationsOpen(false) }}
              aria-label="Choisir les indicateurs"
              title="Choisir les indicateurs"
            >
              <Settings2 size={15} />
            </button>
            {signalMenuOpen ? (
              <div className={styles.signalMenu}>
                <header><span>Indicateurs visibles</span><button type="button" onClick={() => setSelectedKeys(allKeys)}>Tout</button></header>
                {snapshot.indicators.map((indicator) => (
                  <label key={indicator.key}>
                    <input type="checkbox" checked={selectedKeys.includes(indicator.key)} onChange={() => toggleSignal(indicator.key)} />
                    <span><strong>{indicator.label}</strong><small>{indicator.category === 'commercial' ? 'Commercial' : 'Contrôle'}</small></span>
                  </label>
                ))}
                <footer>Aucune requête automatique. Les valeurs restent celles du snapshot.</footer>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {workspaceOpen ? (
        <div className={styles.drawerBackdrop} onMouseDown={(event) => { if (event.currentTarget === event.target) setWorkspaceOpen(false) }}>
          <aside className={styles.workspaceDrawer} aria-label="Tous les workspaces Marketplace">
            <header className={styles.drawerHeader}>
              <div><span>Marketplace Admin</span><h2>Tous les workspaces</h2><p>{workspaces.length} routes enregistrées · ouverture en nouvel onglet</p></div>
              <button type="button" onClick={() => setWorkspaceOpen(false)} aria-label="Fermer"><X size={18} /></button>
            </header>
            <div className={styles.drawerSearch}><Search size={15} /><input value={workspaceQuery} onChange={(event) => setWorkspaceQuery(event.target.value)} placeholder="Workspace, domaine, route…" autoFocus /></div>
            <div className={styles.drawerBody}>
              {groupedWorkspaces.map(([family, items]) => (
                <section key={family} className={styles.workspaceGroup}>
                  <header><div><Boxes size={15} /><strong>{family}</strong></div><span>{items.length}</span></header>
                  <div className={styles.workspaceGrid}>
                    {items.map((workspace) => workspace.dynamic ? (
                      <div key={workspace.href} className={styles.workspaceItem} data-contextual="true" title="Ce workspace nécessite un objet parent">
                        <span><strong>{workspace.label}</strong><small>{workspace.domain} · dossier contextuel</small></span>
                      </div>
                    ) : (
                      <a key={workspace.href} className={styles.workspaceItem} href={workspace.href} target="_blank" rel="noreferrer">
                        <span><strong>{workspace.label}</strong><small>{workspace.domain}</small></span>
                        <ExternalLink size={13} />
                      </a>
                    ))}
                  </div>
                </section>
              ))}
              {!groupedWorkspaces.length ? <div className={styles.drawerEmpty}>Aucun workspace ne correspond.</div> : null}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  )
}
