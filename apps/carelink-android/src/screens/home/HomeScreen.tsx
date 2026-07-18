import React, {useMemo} from 'react'
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native'
import {CareLinkColors, CareLinkRadius, CareLinkSpace} from '../../design/tokens'
import {CareLinkType} from '../../design/typography'
import {AppSession} from '../../store/sessionStore'
import {useMobileSnapshotStore} from '../../store/mobileSnapshotStore'
import {BackendHealth} from '../../types/runtime'
import {Card} from '../../ui/Card'
import {Button} from '../../ui/Button'
import {MetricCard} from '../../ui/MetricCard'
import {StatusPill} from '../../ui/StatusPill'
import {EmptyState} from '../../ui/EmptyState'
import type {CareLinkMobileWorkspace} from '../../services/carelink/mobileService'
import {firstText, numberValue, statusTone, messageTitle, messageBody} from '../../utils/carelinkData'

const quickActions = [{key: 'missions', label: 'Missions'}, {key: 'messages', label: 'Messages'}, {key: 'schedule', label: 'Planning'}, {key: 'profile', label: 'Profil'}] as const

export function HomeScreen({session, backendHealth, workspace, workspaceState, workspaceError, onRefresh, onNavigate, onLogout}: {session: AppSession; backendHealth: BackendHealth; workspace: CareLinkMobileWorkspace | null; workspaceState: 'idle' | 'loading' | 'ready' | 'offline'; workspaceError: string | null; onRefresh: () => Promise<void>; onNavigate: (route: 'home' | 'missions' | 'schedule' | 'messages' | 'profile') => void; onLogout: () => void}) {
  const snapshot = useMobileSnapshotStore()
  const dateLabel = useMemo(() => new Intl.DateTimeFormat('fr-FR', {weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'}).format(new Date()), [])
  const agent = workspace?.agent || workspace?.profile || {}
  const displayName = firstText(agent as any, ['fullName', 'full_name', 'name', 'display_name'], session.agentName)
  const missionCount = numberValue(workspace?.stats?.todayMissions, numberValue(workspace?.todayMissions?.length, numberValue(workspace?.records?.length, snapshot.missions)))
  const messageCount = numberValue(workspace?.stats?.unreadMessages, snapshot.messages)
  const notificationCount = workspace?.notifications?.length ?? snapshot.notifications
  const alertCount = workspace?.alerts?.length ?? snapshot.alerts
  const readinessScore = workspace?.readiness?.score ?? null
  const activeMission = workspace?.activeMission || workspace?.nextMission || null
  const syncTone = backendHealth.state === 'online' ? 'emerald' : backendHealth.state === 'offline' ? 'rose' : 'amber'

  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <Card tone="inverse" style={styles.hero}>
        <Text style={[CareLinkType.heroKicker, styles.kicker]}>CENTRE DE COMMANDE TERRAIN</Text>
        <Text style={[CareLinkType.heroTitle, styles.title]}>Bonjour {displayName}</Text>
        <Text style={[CareLinkType.heroBody, styles.body]}>{dateLabel}</Text>
        <View style={styles.statusRow}>
          <StatusPill label={session.role || 'Agent CareLink'} tone="emerald" />
          <StatusPill label={workspaceState === 'ready' ? 'Workspace live' : workspaceState === 'offline' ? 'Mode dégradé' : 'Chargement'} tone={workspaceState === 'ready' ? 'emerald' : workspaceState === 'offline' ? 'amber' : 'blue'} />
          <StatusPill label={backendHealth.state === 'online' ? 'Serveur OK' : 'Serveur à vérifier'} tone={syncTone} />
        </View>
        <Text style={styles.healthCopy}>{backendHealth.label}</Text>
        {workspaceError ? <Text style={styles.errorCopy}>{workspaceError}</Text> : null}
        <Button label={workspaceState === 'loading' ? 'Synchronisation...' : 'Actualiser'} onPress={onRefresh} tone="slate" loading={workspaceState === 'loading'} />
      </Card>
      <View style={styles.metricsGrid}>
        <MetricCard label="MISSIONS" value={String(missionCount || 0)} detail="Affectations live" tone="emerald" />
        <MetricCard label="MESSAGES" value={String(messageCount || 0)} detail="CareLink + Connect" tone="amber" />
        <MetricCard label="NOTIFS" value={String(notificationCount || 0)} detail={`${String(alertCount || 0)} alerte(s)`} tone="blue" />
        <MetricCard label="READINESS" value={readinessScore !== null && readinessScore !== undefined ? `${readinessScore}` : '-'} detail="Score terrain" tone={readinessScore && readinessScore >= 80 ? 'emerald' : 'amber'} />
      </View>
      <Card style={styles.panel}>
        <Text style={CareLinkType.cardTitle}>Actions rapides</Text>
        <View style={styles.actionGrid}>{quickActions.map((action) => <Pressable key={action.key} onPress={() => onNavigate(action.key)} style={({pressed}) => [styles.actionCard, pressed && styles.pressed]}><Text style={styles.actionLabel}>{action.label}</Text></Pressable>)}</View>
      </Card>
      <Card style={styles.panel}>
        <Text style={CareLinkType.cardTitle}>Mission prioritaire</Text>
        {activeMission ? <View style={styles.moduleRow}><View style={styles.rowHeader}><Text style={styles.moduleMeta}>Mission actuelle</Text><StatusPill label={String((activeMission as any).status || 'live')} tone={statusTone((activeMission as any).status)} /></View><Text style={styles.moduleTitle}>{firstText(activeMission as any, ['title', 'code', 'familyName', 'service_name'], 'Mission active')}</Text><Text style={styles.moduleBody}>{firstText(activeMission as any, ['scheduledStart', 'dateLabel', 'address', 'zone', 'status'], 'Dossier synchronisé depuis OPS.')}</Text></View> : <EmptyState title="Aucune mission active" body="Les missions affectées par OPS apparaîtront ici dès la synchronisation." />}
      </Card>
      <Card style={styles.panel}>
        <Text style={CareLinkType.cardTitle}>Flux en direct</Text>
        <View style={styles.liveGrid}>{(workspace?.messages || []).slice(0, 3).map((item, index) => <View key={String((item as any).id || index)} style={styles.feedCard}><Text style={styles.feedMeta}>Message</Text><Text style={styles.feedTitle}>{messageTitle(item as any)}</Text><Text style={styles.feedItem}>{messageBody(item as any)}</Text></View>)}{!(workspace?.messages || []).length ? <EmptyState title="Aucun message" body="Les messages dispatch et Connect apparaîtront ici." /> : null}</View>
      </Card>
      <Card style={styles.panel}><Text style={CareLinkType.cardTitle}>Session mobile</Text><Text style={styles.moduleBody}>Identifiant: {session.identifier || '—'} · Statut: {session.accessStatus || 'actif'} · {snapshot.summary}</Text><Pressable onPress={onLogout} style={({pressed}) => [styles.logout, pressed && styles.pressed]}><Text style={styles.logoutLabel}>Se déconnecter</Text></Pressable></Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: {padding: CareLinkSpace.lg, gap: CareLinkSpace.lg, paddingBottom: 36}, hero: {borderColor: 'rgba(255,255,255,0.12)', gap: CareLinkSpace.sm}, kicker: {color: '#93c5fd'}, title: {marginTop: 2}, body: {marginTop: -2}, statusRow: {flexDirection: 'row', flexWrap: 'wrap', gap: CareLinkSpace.sm}, healthCopy: {color: '#dbeafe', fontSize: 13, lineHeight: 19, fontWeight: '700'}, errorCopy: {color: '#fecdd3', fontSize: 13, lineHeight: 19, fontWeight: '700'}, metricsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: CareLinkSpace.sm}, panel: {gap: CareLinkSpace.sm}, actionGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: CareLinkSpace.sm}, actionCard: {width: '48.4%', minHeight: 58, borderRadius: CareLinkRadius.lg, backgroundColor: CareLinkColors.surfaceMuted, borderWidth: 1, borderColor: CareLinkColors.border, alignItems: 'center', justifyContent: 'center'}, actionLabel: {color: CareLinkColors.textStrong, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1}, moduleRow: {borderRadius: CareLinkRadius.lg, borderWidth: 1, borderColor: CareLinkColors.border, backgroundColor: CareLinkColors.surfaceMuted, padding: CareLinkSpace.md, gap: 7}, rowHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: CareLinkSpace.sm}, moduleMeta: {color: CareLinkColors.blue, fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase'}, moduleTitle: {color: CareLinkColors.textStrong, fontSize: 15, fontWeight: '900'}, moduleBody: {color: CareLinkColors.textMuted, fontSize: 12, lineHeight: 18, fontWeight: '700'}, liveGrid: {gap: CareLinkSpace.sm}, feedCard: {borderRadius: CareLinkRadius.lg, borderWidth: 1, borderColor: CareLinkColors.border, backgroundColor: CareLinkColors.surfaceMuted, padding: CareLinkSpace.md, gap: 5}, feedMeta: {color: CareLinkColors.amber, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase'}, feedTitle: {color: CareLinkColors.textStrong, fontSize: 14, fontWeight: '900'}, feedItem: {color: CareLinkColors.textMuted, fontSize: 12, lineHeight: 18, fontWeight: '700'}, logout: {minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: CareLinkRadius.lg, backgroundColor: CareLinkColors.surfaceInverse}, logoutLabel: {color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase'}, pressed: {opacity: 0.9, transform: [{scale: 0.99}]},
})
