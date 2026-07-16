import React, {useEffect, useMemo, useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {AppShell} from '../ui/AppShell'
import {AuthNavigator} from './AuthNavigator'
import {CareLinkTabs, type CareLinkTabKey} from './CareLinkTabs'
import {healthCheck} from '../services/api/httpClient'
import {clearCareLinkSession, loginCareLinkMobile, restoreCareLinkSession, syncCareLinkWorkspace} from '../services/auth/authService'
import {setMobileSnapshot} from '../store/mobileSnapshotStore'
import {setSessionSnapshot, useSessionStore, type AppSession} from '../store/sessionStore'
import {HomeScreen} from '../screens/home/HomeScreen'
import {MissionsScreen} from '../screens/missions/MissionsScreen'
import {MessagesScreen} from '../screens/messages/MessagesScreen'
import {ProfileScreen} from '../screens/profile/ProfileScreen'
import {ScheduleScreen} from '../screens/schedule/ScheduleScreen'
import type {BackendHealth} from '../types/runtime'
import type {CareLinkMobileWorkspace} from '../services/carelink/mobileService'
import {LoadingState} from '../ui/LoadingState'

type WorkspaceState = 'idle' | 'loading' | 'ready' | 'offline'

function createDemoWorkspace(): CareLinkMobileWorkspace {
  const now = new Date().toISOString()
  return {
    source: 'demo',
    generatedAt: now,
    agent: {id: 'demo', fullName: 'Agent CareLink', status: 'active'},
    profile: {fullName: 'Agent CareLink'},
    stats: {
      todayMissions: 3,
      weekHours: 24,
      reliabilityScore: 98,
      performanceScore: 94,
      noShowCount: 0,
      cancellationCount: 0,
      completedCount: 12,
      pendingReports: 1,
      unreadMessages: 2,
      criticalAlerts: 1,
    },
    readiness: {
      score: 91,
      status: 'ready',
      blockers: [],
      warnings: ['1 note de suivi à valider'],
      nextAction: 'Confirmer la prochaine mission ou compléter le rapport en attente',
    },
    payments: {
      currency: 'MAD',
      earned: 1280,
      pendingValidation: 140,
      paid: 1140,
      bonuses: 60,
      transport: 80,
      allowances: 0,
      upcomingPayment: 740,
    },
    alerts: [{id: 'demo-alert', title: 'Suivi mission', body: 'Une alerte de démonstration est visible en mode aperçu.'}],
    notifications: [{id: 'demo-notif', title: 'Mission prête', body: 'Deux notifications de démonstration sont visibles.', unread: true}],
    messages: [{id: 'demo-message', title: 'Dispatch', body: 'Un message de démonstration est visible.'}],
    history: [],
    support: [],
    schedule: [],
    calendar: {},
    records: [],
    todayMissions: [],
    upcomingMissions: [],
    activeMission: null,
    nextMission: null,
  }
}

export function AppNavigator() {
  const session = useSessionStore()
  const [activeTab, setActiveTab] = useState<CareLinkTabKey>('home')
  const [busy, setBusy] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(true)
  const [workspace, setWorkspace] = useState<CareLinkMobileWorkspace | null>(null)
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>('idle')
  const [workspaceError, setWorkspaceError] = useState<string | null>(null)
  const [backendHealth, setBackendHealth] = useState<BackendHealth>({state: 'unknown', label: 'Vérification du backend OPS.'})

  async function refreshHealth() {
    const result = await healthCheck()
    setBackendHealth({
      state: result.ok ? 'online' : 'offline',
      label: result.ok ? `Backend joignable · ${result.status}` : `Backend indisponible · ${result.error || `HTTP ${result.status}`}`,
      statusCode: result.status,
      data: result.data || null,
    })
  }

  function applyDemoWorkspace() {
    const demoWorkspace = createDemoWorkspace()
    setWorkspace(demoWorkspace)
    setWorkspaceState('ready')
    setWorkspaceError(null)
    setMobileSnapshot({
      missions: demoWorkspace.stats?.todayMissions || 0,
      messages: demoWorkspace.stats?.unreadMessages || 0,
      notifications: demoWorkspace.notifications?.length || 0,
      alerts: demoWorkspace.alerts?.length || 0,
      syncState: 'online',
      summary: 'Mode aperçu chargé.',
    })
  }

  async function loadWorkspaceForSession(currentSession: AppSession | null, origin: 'bootstrap' | 'login' | 'manual') {
    const originLabel = origin === 'bootstrap' ? 'restauration' : origin === 'login' ? 'connexion' : 'rafraîchissement'

    if (!currentSession?.token && currentSession?.raw && typeof currentSession.raw === 'object' && (currentSession.raw as Record<string, unknown>).mode === 'demo') {
      applyDemoWorkspace()
      return {kind: 'ready' as const}
    }

    if (!currentSession?.token) {
      setWorkspace(null)
      setWorkspaceState('idle')
      setWorkspaceError(null)
      return {kind: 'idle' as const}
    }

    setWorkspaceState('loading')
    setWorkspaceError(null)

    const result = await syncCareLinkWorkspace()
    if (result.ok) {
      const payload = result.data
      if (payload) {
        setWorkspace(payload)
        setWorkspaceState('ready')
        setWorkspaceError(null)
        return {kind: 'ready' as const}
      }
      setWorkspace(null)
      setWorkspaceState('offline')
      setWorkspaceError(`La charge CareLink mobile est vide pendant la ${originLabel}.`)
      return {kind: 'offline' as const, error: `La charge CareLink mobile est vide pendant la ${originLabel}.`}
    }

    const errorMessage = result.error || `HTTP ${result.status}`
    const isAuthError = [401, 403, 423].includes(result.status)

    if (isAuthError) {
      await clearCareLinkSession()
      setWorkspace(null)
      setWorkspaceState('idle')
      setWorkspaceError(null)
      return {kind: 'invalid' as const, error: errorMessage}
    }

    setWorkspaceState('offline')
    setWorkspaceError(errorMessage)
    setMobileSnapshot({
      syncState: 'offline',
      summary: `Synchronisation indisponible pendant la ${originLabel} · ${errorMessage}`,
    })

    return {kind: 'offline' as const, error: errorMessage}
  }

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      setBootstrapping(true)
      await refreshHealth()
      const restored = await restoreCareLinkSession()
      if (cancelled) return

      if (restored) {
        setSessionSnapshot(restored.session)
        const outcome = await loadWorkspaceForSession(restored.session, 'bootstrap')
        if (cancelled) return
        if (outcome.kind === 'invalid') {
          setWorkspaceError(outcome.error)
        }
      }

      if (!cancelled) {
        setBootstrapping(false)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const shellTone = useMemo(() => (activeTab === 'home' ? 'light' : 'light'), [activeTab])

  async function handleLogin(identifier: string, password: string) {
    setBusy(true)
    try {
      const result = await loginCareLinkMobile({identifier, password})
      if (!result.ok) {
        throw new Error(result.error || `HTTP ${result.status}`)
      }

      setSessionSnapshot(result.session)
      const outcome = await loadWorkspaceForSession(result.session, 'login')
      if (outcome.kind === 'invalid') {
        throw new Error(outcome.error || 'Session CareLink invalide.')
      }

      setActiveTab('home')
    } finally {
      setBusy(false)
    }
  }

  async function enterDemoMode() {
    await clearCareLinkSession()
    setSessionSnapshot({
      identifier: 'demo@angelcarehub.com',
      agentName: 'Agent CareLink',
      role: 'Mode aperçu',
      accessStatus: 'active',
      raw: {mode: 'demo'},
    })
    applyDemoWorkspace()
    setActiveTab('home')
  }

  async function handleLogout() {
    await clearCareLinkSession()
    setWorkspace(null)
    setWorkspaceState('idle')
    setWorkspaceError(null)
    setActiveTab('home')
  }

  async function refreshWorkspace() {
    if (!session) return
    await loadWorkspaceForSession(session, 'manual')
  }

  if (bootstrapping) {
    return (
      <AppShell inverse>
        <View style={styles.bootstrap}>
          <LoadingState label="Restauration sécurisée de la session CareLink..." />
        </View>
      </AppShell>
    )
  }

  if (!session) {
    return (
      <AuthNavigator
        backendHealth={backendHealth}
        onLogin={handleLogin}
        onCheckHealth={refreshHealth}
        onEnterDemo={enterDemoMode}
        busy={busy}
      />
    )
  }

  return (
    <AppShell inverse={shellTone === 'dark'}>
      <View style={styles.root}>
        {activeTab === 'home' ? <HomeScreen session={session} backendHealth={backendHealth} workspace={workspace} workspaceState={workspaceState} workspaceError={workspaceError} onRefresh={refreshWorkspace} onNavigate={setActiveTab} onLogout={handleLogout} /> : null}
        {activeTab === 'missions' ? <MissionsScreen workspace={workspace} /> : null}
        {activeTab === 'schedule' ? <ScheduleScreen workspace={workspace} /> : null}
        {activeTab === 'messages' ? <MessagesScreen workspace={workspace} /> : null}
        {activeTab === 'profile' ? <ProfileScreen workspace={workspace} /> : null}
      </View>
      <CareLinkTabs active={activeTab} onChange={setActiveTab} />
    </AppShell>
  )
}

const styles = StyleSheet.create({
  bootstrap: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  root: {
    flex: 1,
  },
})
