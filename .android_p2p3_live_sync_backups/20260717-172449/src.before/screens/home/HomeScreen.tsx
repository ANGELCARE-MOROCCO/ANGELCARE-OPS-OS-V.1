import React, {useMemo} from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'
import {CareLinkColors, CareLinkRadius, CareLinkSpace} from '../../design/tokens'
import {CareLinkType} from '../../design/typography'
import {AppSession} from '../../store/sessionStore'
import {useMobileSnapshotStore} from '../../store/mobileSnapshotStore'
import {BackendHealth} from '../../types/runtime'
import {Card} from '../../ui/Card'
import {Button} from '../../ui/Button'
import {MetricCard} from '../../ui/MetricCard'
import {StatusPill} from '../../ui/StatusPill'
import type {CareLinkMobileWorkspace} from '../../services/carelink/mobileService'

const quickActions = [
  {key: 'missions', label: 'Missions', tone: 'blue'},
  {key: 'messages', label: 'Messages', tone: 'amber'},
  {key: 'schedule', label: 'Planning', tone: 'emerald'},
  {key: 'profile', label: 'Profil', tone: 'slate'},
] as const

export function HomeScreen({
  session,
  backendHealth,
  workspace,
  workspaceState,
  workspaceError,
  onRefresh,
  onNavigate,
  onLogout,
}: {
  session: AppSession
  backendHealth: BackendHealth
  workspace: CareLinkMobileWorkspace | null
  workspaceState: 'idle' | 'loading' | 'ready' | 'offline'
  workspaceError: string | null
  onRefresh: () => Promise<void>
  onNavigate: (route: 'home' | 'missions' | 'schedule' | 'messages' | 'profile') => void
  onLogout: () => void
}) {
  const snapshot = useMobileSnapshotStore()

  const dateLabel = useMemo(() => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date())
  }, [])

  const missionCount = workspace?.stats?.todayMissions ?? snapshot.missions
  const messageCount = workspace?.stats?.unreadMessages ?? snapshot.messages
  const notificationCount = workspace?.notifications?.length ?? snapshot.notifications
  const alertCount = workspace?.alerts?.length ?? snapshot.alerts
  const readinessScore = workspace?.readiness?.score ?? null
  const readinessState = workspace?.readiness?.status || (workspaceState === 'offline' ? 'offline' : 'live')
  const syncTone = backendHealth.state === 'online' ? 'emerald' : backendHealth.state === 'offline' ? 'rose' : 'amber'
  const syncLabel = backendHealth.state === 'online' ? 'Sync live' : backendHealth.state === 'offline' ? 'Sync suspendue' : 'Sync vérifiée'
  const activeMission = workspace?.activeMission || workspace?.nextMission || null
  const upcomingPayment = workspace?.payments?.upcomingPayment ?? null

  if (workspaceState === 'loading' && !workspace) {
    return (
      <View style={styles.page}>
        <Card tone="inverse" style={styles.hero}>
          <Text style={[CareLinkType.heroKicker, styles.kicker]}>CENTRE DE COMMANDE TERRAIN</Text>
          <Text style={[CareLinkType.heroTitle, styles.title]}>Bonjour {session.agentName}</Text>
          <Text style={[CareLinkType.heroBody, styles.body]}>{dateLabel}</Text>
          <Text style={styles.healthCopy}>Chargement du cockpit CareLink...</Text>
        </Card>
      </View>
    )
  }

  return (
    <View style={styles.page}>
      <Card tone="inverse" style={styles.hero}>
        <Text style={[CareLinkType.heroKicker, styles.kicker]}>CENTRE DE COMMANDE TERRAIN</Text>
        <Text style={[CareLinkType.heroTitle, styles.title]}>Bonjour {session.agentName}</Text>
        <Text style={[CareLinkType.heroBody, styles.body]}>{dateLabel}</Text>

        <View style={styles.statusRow}>
          <StatusPill label={session.role} tone="emerald" />
          <StatusPill label={readinessState === 'ready' ? 'Prêt terrain' : readinessState === 'offline' ? 'Mode dégradé' : 'Préparation'} tone={readinessState === 'ready' ? 'emerald' : readinessState === 'offline' ? 'amber' : 'slate'} />
          <StatusPill label={syncLabel} tone={syncTone} />
        </View>

        <Text style={styles.healthCopy}>{backendHealth.label}</Text>
        {workspaceError ? <Text style={styles.errorCopy}>{workspaceError}</Text> : null}
        <View style={styles.heroActions}>
          <Button label={workspaceState === 'loading' ? 'Synchronisation...' : 'Actualiser'} onPress={onRefresh} tone="slate" loading={workspaceState === 'loading'} />
        </View>
      </Card>

      <View style={styles.metricsGrid}>
        <MetricCard label="MESSAGES" value={String(messageCount || 0)} detail="CareLink + Connect" tone="amber" />
        <MetricCard label="NOTIFS" value={String(notificationCount || 0)} detail={`${String(alertCount || 0)} alertes critiques`} tone="blue" />
        <MetricCard label="MISSIONS" value={String(missionCount || 0)} detail="Affectations du jour" tone="emerald" />
        <MetricCard label="SYNC" value={backendHealth.state === 'online' ? 'OK' : '-'} detail={snapshot.summary} tone="slate" />
      </View>

      <Card style={styles.panel}>
        <Text style={CareLinkType.cardTitle}>Actions rapides</Text>
        <View style={styles.actionGrid}>
          {quickActions.map((action) => (
            <Pressable key={action.key} onPress={() => onNavigate(action.key)} style={({pressed}) => [styles.actionCard, pressed && styles.pressed]}>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card style={styles.panel}>
        <Text style={CareLinkType.cardTitle}>Mission et état</Text>
        <View style={styles.moduleList}>
          <ModuleRow
            title={activeMission ? String(activeMission.code || activeMission.title || 'Mission active') : 'Aucune mission active'}
            body={activeMission ? String(activeMission.status || activeMission.lifecycle_stage || 'En suivi') : 'Les prochaines affectations s’affichent ici dès leur arrivée du backend.'}
            meta={activeMission ? 'Mission actuelle' : 'File du jour'}
          />
          <ModuleRow
            title={workspace?.readiness?.nextAction || 'Prêt pour exécution terrain'}
            body={`Score readiness ${readinessScore !== null ? `${readinessScore}%` : '-'} · ${String(workspace?.readiness?.warnings?.length || 0)} avertissement(s) · ${String(workspace?.readiness?.blockers?.length || 0)} blocage(s)`}
            meta="Readiness"
          />
          <ModuleRow
            title={upcomingPayment !== null ? `${upcomingPayment} MAD` : 'Paiement non calculé'}
            body="Honoraires, validation et paiements prochains synchronisés depuis OPS."
            meta="Paiements"
          />
          <ModuleRow
            title={workspace?.support?.[0]?.title ? String(workspace.support[0].title) : 'Support opérationnel'}
            body={workspace?.support?.[0]?.body ? String(workspace.support[0].body) : 'Les canaux support et les escalades sont branchés au backend.'}
            meta="Support"
          />
        </View>

        <Pressable onPress={onLogout} style={({pressed}) => [styles.logout, pressed && styles.pressed]}>
          <Text style={styles.logoutLabel}>Se déconnecter</Text>
        </Pressable>
      </Card>

      <Card style={styles.panel}>
        <Text style={CareLinkType.cardTitle}>Flux en direct</Text>
        <View style={styles.liveGrid}>
          <FeedCard
            title="Messages récents"
            meta={`${String(messageCount || 0)} non lus`}
            items={(workspace?.messages || []).slice(0, 2).map((item) => `${String(item.title || 'Message')} · ${String(item.body || '')}`)}
            empty="Aucun message persistant."
            tone="amber"
          />
          <FeedCard
            title="Notifications"
            meta={`${String(notificationCount || 0)} reçues`}
            items={(workspace?.notifications || []).slice(0, 2).map((item) => `${String(item.title || 'Notification')} · ${String(item.body || '')}`)}
            empty="Aucune notification."
            tone="blue"
          />
          <FeedCard
            title="Alertes"
            meta={`${String(alertCount || 0)} ouvertes`}
            items={(workspace?.alerts || []).slice(0, 2).map((item) => `${String(item.title || 'Alerte')} · ${String(item.body || '')}`)}
            empty="Aucune alerte ouverte."
            tone="rose"
          />
        </View>
      </Card>
    </View>
  )
}

function ModuleRow({title, body, meta}: {title: string; body: string; meta: string}) {
  return (
    <View style={styles.moduleRow}>
      <View style={styles.moduleHeader}>
        <Text style={styles.moduleMeta}>{meta}</Text>
      </View>
      <Text style={styles.moduleTitle}>{title}</Text>
      <Text style={styles.moduleBody}>{body}</Text>
    </View>
  )
}

function FeedCard({
  title,
  meta,
  items,
  empty,
  tone,
}: {
  title: string
  meta: string
  items: string[]
  empty: string
  tone: 'amber' | 'blue' | 'rose'
}) {
  const accent = tone === 'amber' ? CareLinkColors.amber : tone === 'rose' ? CareLinkColors.rose : CareLinkColors.blue

  return (
    <View style={styles.feedCard}>
      <Text style={[styles.feedMeta, {color: accent}]}>{meta}</Text>
      <Text style={styles.feedTitle}>{title}</Text>
      <View style={styles.feedList}>
        {items.length ? items.map((item, index) => <Text key={`${title}-${index}`} style={styles.feedItem}>{item}</Text>) : <Text style={styles.feedEmpty}>{empty}</Text>}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: CareLinkSpace.lg,
    gap: CareLinkSpace.lg,
  },
  hero: {
    borderColor: 'rgba(255,255,255,0.12)',
    gap: CareLinkSpace.sm,
  },
  heroActions: {
    marginTop: CareLinkSpace.xs,
  },
  kicker: {
    color: '#93c5fd',
  },
  title: {
    marginTop: 2,
  },
  body: {
    marginTop: -2,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CareLinkSpace.sm,
  },
  healthCopy: {
    color: '#dbeafe',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  errorCopy: {
    color: '#fecdd3',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CareLinkSpace.sm,
  },
  panel: {
    gap: CareLinkSpace.sm,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CareLinkSpace.sm,
  },
  actionCard: {
    width: '48.4%',
    minHeight: 74,
    borderRadius: CareLinkRadius.lg,
    padding: CareLinkSpace.md,
    backgroundColor: CareLinkColors.backgroundSoft,
    borderWidth: 1,
    borderColor: '#d7e4ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: CareLinkColors.textStrong,
    fontSize: 13,
    fontWeight: '900',
  },
  moduleList: {
    gap: CareLinkSpace.sm,
    marginTop: CareLinkSpace.xs,
  },
  liveGrid: {
    gap: CareLinkSpace.sm,
    marginTop: CareLinkSpace.xs,
  },
  feedCard: {
    borderRadius: CareLinkRadius.lg,
    borderWidth: 1,
    borderColor: CareLinkColors.border,
    backgroundColor: CareLinkColors.surfaceMuted,
    padding: CareLinkSpace.md,
    gap: 6,
  },
  feedMeta: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  feedTitle: {
    color: CareLinkColors.textStrong,
    fontSize: 14,
    fontWeight: '900',
  },
  feedList: {
    gap: 6,
  },
  feedItem: {
    color: CareLinkColors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  feedEmpty: {
    color: CareLinkColors.textSoft,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  moduleRow: {
    borderRadius: CareLinkRadius.lg,
    backgroundColor: CareLinkColors.surfaceMuted,
    borderWidth: 1,
    borderColor: CareLinkColors.border,
    padding: CareLinkSpace.md,
    gap: 4,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moduleMeta: {
    color: CareLinkColors.blue,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  moduleTitle: {
    color: CareLinkColors.textStrong,
    fontSize: 14,
    fontWeight: '900',
  },
  moduleBody: {
    color: CareLinkColors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  logout: {
    marginTop: CareLinkSpace.sm,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CareLinkRadius.lg,
    backgroundColor: CareLinkColors.surfaceInverse,
  },
  logoutLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.92,
    transform: [{scale: 0.99}],
  },
})
