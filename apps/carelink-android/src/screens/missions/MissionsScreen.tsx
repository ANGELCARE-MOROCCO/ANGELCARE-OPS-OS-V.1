import React, {useMemo, useState} from 'react'
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native'
import {CareLinkColors, CareLinkRadius, CareLinkSpace} from '../../design/tokens'
import {CareLinkType} from '../../design/typography'
import type {CareLinkMobileWorkspace} from '../../services/carelink/mobileService'
import {fetchMission, fetchMissions, performMissionAction, type MissionActionKey} from '../../services/carelink/missionService'
import {enqueueOfflineItem} from '../../store/offlineQueueStore'
import {Card} from '../../ui/Card'
import {Button} from '../../ui/Button'
import {EmptyState} from '../../ui/EmptyState'
import {StatusPill} from '../../ui/StatusPill'
import {itemId, missionSubtitle, missionTitle, safeArray, statusTone, text} from '../../utils/carelinkData'

type Mission = Record<string, any>

const actionSet: Array<{key: MissionActionKey; label: string; tone: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate'}> = [
  {key: 'accept', label: 'Accepter', tone: 'emerald'},
  {key: 'start', label: 'Démarrer', tone: 'blue'},
  {key: 'en-route', label: 'En route', tone: 'blue'},
  {key: 'arrived', label: 'Arrivée', tone: 'emerald'},
  {key: 'delay', label: 'Retard', tone: 'amber'},
  {key: 'incident', label: 'Incident', tone: 'rose'},
]

export function MissionsScreen({workspace}: {workspace: CareLinkMobileWorkspace | null}) {
  const initialMissions = useMemo(() => {
    const collected = [workspace?.activeMission, workspace?.nextMission, ...(workspace?.todayMissions || []), ...(workspace?.upcomingMissions || []), ...(workspace?.records || [])].filter(Boolean)
    const seen = new Set<string>()
    return collected.filter((mission: any) => {
      const id = itemId(mission, missionTitle(mission))
      if (seen.has(id)) return false
      seen.add(id)
      return true
    }) as Mission[]
  }, [workspace])
  const [missions, setMissions] = useState<Mission[]>(initialMissions)
  const [selected, setSelected] = useState<Mission | null>(initialMissions[0] || null)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function refresh() {
    setBusy('refresh')
    const result = await fetchMissions()
    if (result.ok) {
      const rows = safeArray<Mission>(result.data)
      setMissions(rows)
      setSelected(rows[0] || null)
      setMessage(`Missions synchronisées · ${rows.length}`)
    } else {
      setMessage(result.error || 'Synchronisation missions indisponible')
    }
    setBusy(null)
  }

  async function openMission(mission: Mission) {
    const id = itemId(mission, '')
    setSelected(mission)
    if (!id) return
    setBusy(`mission-${id}`)
    const result = await fetchMission(id)
    if (result.ok && result.data) {
      const payload = (result.data as any)?.data || result.data
      setSelected({...mission, ...(payload as any)})
    }
    setBusy(null)
  }

  async function runAction(action: MissionActionKey) {
    if (!selected) return
    const id = itemId(selected, '')
    if (!id) {
      setMessage('Mission sans identifiant exploitable.')
      return
    }
    setBusy(action)
    const result = await performMissionAction(id, action, {note: `Action ${action} depuis Android`})
    if (result.ok) {
      setMessage(`Action ${action} synchronisée avec OPS.`)
      await openMission(selected)
    } else {
      enqueueOfflineItem({id: `mission-${id}-${action}-${Date.now()}`, label: `Mission ${action}`, endpoint: `/api/carelink/missions/${id}/${action}`, payload: {missionId: id, action}})
      setMessage(`${result.error || 'Action non synchronisée'} · placée en file hors-ligne.`)
    }
    setBusy(null)
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
      <Card tone="inverse" style={styles.hero}>
        <Text style={[CareLinkType.heroKicker, styles.kicker]}>FILE DE MISSIONS</Text>
        <Text style={[CareLinkType.heroTitle, styles.title]}>Missions terrain</Text>
        <Text style={[CareLinkType.heroBody, styles.body]}>Liste, détail et premières actions branchées aux routes OPS.</Text>
        <View style={styles.row}><StatusPill label={`${missions.length} mission(s)`} tone="emerald" /><StatusPill label={busy ? 'Sync...' : 'Live'} tone={busy ? 'amber' : 'blue'} /></View>
        <Button label={busy === 'refresh' ? 'Synchronisation...' : 'Actualiser missions'} onPress={refresh} loading={busy === 'refresh'} tone="slate" />
      </Card>
      {message ? <Card style={styles.notice}><Text style={styles.noticeText}>{message}</Text></Card> : null}
      <Card style={styles.panel}>
        <Text style={CareLinkType.cardTitle}>Missions synchronisées</Text>
        <View style={styles.list}>{missions.length ? missions.map((mission, index) => <Pressable key={itemId(mission, String(index))} onPress={() => openMission(mission)} style={({pressed}) => [styles.item, selected && itemId(selected) === itemId(mission) && styles.itemSelected, pressed && styles.pressed]}><View style={styles.itemTop}><Text style={styles.itemCode}>{text((mission as any).code, `Mission ${index + 1}`)}</Text><StatusPill label={text((mission as any).status, 'live')} tone={statusTone((mission as any).status)} /></View><Text style={styles.itemTitle}>{missionTitle(mission)}</Text><Text style={styles.itemBody}>{missionSubtitle(mission)}</Text></Pressable>) : <EmptyState title="Aucune mission synchronisée" body="Les missions apparaîtront dès qu’OPS renverra une affectation mobile." />}</View>
      </Card>
      <Card style={styles.panel}>
        <Text style={CareLinkType.cardTitle}>Dossier mission</Text>
        {selected ? <View style={styles.detail}><Text style={styles.detailTitle}>{missionTitle(selected)}</Text><Text style={styles.detailBody}>{missionSubtitle(selected)}</Text><View style={styles.detailGrid}><Mini label="Statut" value={text(selected.status, 'live')} /><Mini label="Zone" value={text(selected.zone || selected.city || selected.address, '—')} /><Mini label="Client" value={text(selected.client_name || selected.familyName || selected.family_name, '—')} /><Mini label="Service" value={text(selected.service_name || selected.service || selected.type, '—')} /></View><View style={styles.actions}>{actionSet.map((action) => <Button key={action.key} label={action.label} onPress={() => runAction(action.key)} tone={action.tone} loading={busy === action.key} />)}</View></View> : <EmptyState title="Sélectionnez une mission" body="Le détail et les actions terrain apparaîtront ici." />}
      </Card>
    </ScrollView>
  )
}

function Mini({label, value}: {label: string; value: string}) { return <View style={styles.mini}><Text style={styles.miniLabel}>{label}</Text><Text style={styles.miniValue}>{value}</Text></View> }

const styles = StyleSheet.create({wrap: {padding: CareLinkSpace.lg, gap: CareLinkSpace.lg}, hero: {borderColor: 'rgba(255,255,255,0.12)', gap: CareLinkSpace.sm}, kicker: {color: '#93c5fd'}, title: {marginTop: 2}, body: {marginTop: -2}, row: {flexDirection: 'row', flexWrap: 'wrap', gap: CareLinkSpace.sm}, panel: {gap: CareLinkSpace.sm}, notice: {backgroundColor: CareLinkColors.warningBg}, noticeText: {color: CareLinkColors.amber, fontSize: 13, fontWeight: '800'}, list: {gap: CareLinkSpace.sm}, item: {borderRadius: CareLinkRadius.lg, borderWidth: 1, borderColor: CareLinkColors.border, backgroundColor: CareLinkColors.surfaceMuted, padding: CareLinkSpace.md, gap: 6}, itemSelected: {borderColor: CareLinkColors.blue, backgroundColor: '#eef5ff'}, itemTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: CareLinkSpace.sm}, itemCode: {color: CareLinkColors.blue, fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase'}, itemTitle: {color: CareLinkColors.textStrong, fontSize: 14, fontWeight: '900'}, itemBody: {color: CareLinkColors.textMuted, fontSize: 12, lineHeight: 18, fontWeight: '700'}, detail: {gap: CareLinkSpace.md}, detailTitle: {color: CareLinkColors.textStrong, fontSize: 20, fontWeight: '900'}, detailBody: {color: CareLinkColors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '700'}, detailGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: CareLinkSpace.sm}, mini: {width: '48.4%', borderRadius: CareLinkRadius.lg, backgroundColor: CareLinkColors.surfaceMuted, borderWidth: 1, borderColor: CareLinkColors.border, padding: CareLinkSpace.md}, miniLabel: {color: CareLinkColors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase'}, miniValue: {marginTop: 4, color: CareLinkColors.textStrong, fontSize: 13, fontWeight: '900'}, actions: {gap: CareLinkSpace.sm}, pressed: {opacity: 0.92, transform: [{scale: 0.99}]}})
