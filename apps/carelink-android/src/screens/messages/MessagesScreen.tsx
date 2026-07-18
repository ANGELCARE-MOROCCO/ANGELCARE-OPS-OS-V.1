import React, {useMemo, useState} from 'react'
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native'
import {CareLinkColors, CareLinkRadius, CareLinkSpace} from '../../design/tokens'
import {CareLinkType} from '../../design/typography'
import type {CareLinkMobileWorkspace} from '../../services/carelink/mobileService'
import {fetchMessages, markMessageRead} from '../../services/carelink/messageService'
import {acknowledgeAlert, acknowledgeNotification, fetchAlerts, fetchNotifications} from '../../services/carelink/notificationService'
import {fetchConnectCallLog, fetchConnectMessages, fetchConnectRooms} from '../../services/connect/connectService'
import {Card} from '../../ui/Card'
import {Button} from '../../ui/Button'
import {EmptyState} from '../../ui/EmptyState'
import {StatusPill} from '../../ui/StatusPill'
import {itemId, isUnread, messageBody, messageTitle, safeArray, statusTone} from '../../utils/carelinkData'

type FeedTab = 'messages' | 'notifications' | 'alerts' | 'connect'
type FeedItem = Record<string, any>

export function MessagesScreen({workspace}: {workspace: CareLinkMobileWorkspace | null}) {
  const [tab, setTab] = useState<FeedTab>('messages')
  const [messages, setMessages] = useState<FeedItem[]>(workspace?.messages || [])
  const [notifications, setNotifications] = useState<FeedItem[]>(workspace?.notifications || [])
  const [alerts, setAlerts] = useState<FeedItem[]>(workspace?.alerts || [])
  const [connectItems, setConnectItems] = useState<FeedItem[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const currentItems = tab === 'messages' ? messages : tab === 'notifications' ? notifications : tab === 'alerts' ? alerts : connectItems
  const unreadMessages = messages.filter(isUnread).length
  const unreadNotifications = notifications.filter(isUnread).length
  const criticalAlerts = alerts.filter((item) => statusTone(item.priority || item.tone || item.status) === 'rose').length

  const title = useMemo(() => ({messages: 'Messages CareLink', notifications: 'Notifications', alerts: 'Alertes OPS', connect: 'AngelCare Connect'}[tab]), [tab])

  async function refreshAll() {
    setBusy('refresh')
    const [messageResult, notifResult, alertResult, connectMessageResult, roomResult, callResult] = await Promise.all([fetchMessages(), fetchNotifications(), fetchAlerts(), fetchConnectMessages(), fetchConnectRooms(), fetchConnectCallLog()])
    if (messageResult.ok) setMessages(safeArray<FeedItem>(messageResult.data))
    if (notifResult.ok) setNotifications(safeArray<FeedItem>(notifResult.data))
    if (alertResult.ok) setAlerts(safeArray<FeedItem>(alertResult.data))
    const connectMerged = [...safeArray<FeedItem>(connectMessageResult.data), ...safeArray<FeedItem>(roomResult.data), ...safeArray<FeedItem>(callResult.data)]
    setConnectItems(connectMerged)
    setStatus([messageResult, notifResult, alertResult, connectMessageResult].some((r) => !r.ok) ? 'Une partie du flux est indisponible.' : 'Centre messages + notifications synchronisé.')
    setBusy(null)
  }

  async function acknowledge(item: FeedItem) {
    const id = itemId(item, '')
    if (!id) return
    setBusy(id)
    const result = tab === 'messages' ? await markMessageRead(id) : tab === 'notifications' ? await acknowledgeNotification(id) : tab === 'alerts' ? await acknowledgeAlert(id) : {ok: true, error: null}
    setStatus(result.ok ? 'Élément marqué comme traité.' : result.error || 'Action non synchronisée.')
    if (result.ok) await refreshAll()
    setBusy(null)
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
      <Card tone="inverse" style={styles.hero}>
        <Text style={[CareLinkType.heroKicker, styles.kicker]}>COMMUNICATION UNIFIÉE</Text>
        <Text style={[CareLinkType.heroTitle, styles.title]}>{title}</Text>
        <Text style={[CareLinkType.heroBody, styles.body]}>CareLink, alertes OPS et Connect intégrés sans exposition d’annuaire staff.</Text>
        <View style={styles.row}><StatusPill label={`${unreadMessages} messages`} tone="amber" /><StatusPill label={`${unreadNotifications} notifs`} tone="blue" /><StatusPill label={`${criticalAlerts} critiques`} tone="rose" /></View>
        <Button label={busy === 'refresh' ? 'Synchronisation...' : 'Actualiser centre'} onPress={refreshAll} loading={busy === 'refresh'} tone="slate" />
      </Card>
      {status ? <Card style={styles.notice}><Text style={styles.noticeText}>{status}</Text></Card> : null}
      <View style={styles.tabs}>{(['messages', 'notifications', 'alerts', 'connect'] as FeedTab[]).map((key) => <Pressable key={key} onPress={() => setTab(key)} style={[styles.tab, tab === key && styles.tabActive]}><Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{key === 'messages' ? 'Messages' : key === 'notifications' ? 'Notifs' : key === 'alerts' ? 'Alertes' : 'Connect'}</Text></Pressable>)}</View>
      <Card style={styles.panel}>
        <Text style={CareLinkType.cardTitle}>{title}</Text>
        <View style={styles.list}>{currentItems.length ? currentItems.map((item, index) => <View key={`${tab}-${itemId(item, String(index))}`} style={styles.item}><View style={styles.itemTop}><Text style={styles.itemTitle}>{messageTitle(item, tab === 'connect' ? 'Élément Connect' : 'Élément CareLink')}</Text><StatusPill label={isUnread(item) ? 'non lu' : 'traité'} tone={isUnread(item) ? 'amber' : 'slate'} /></View><Text style={[styles.itemBody, {color: isUnread(item) ? CareLinkColors.textStrong : CareLinkColors.textMuted}]}>{messageBody(item)}</Text><View style={styles.itemActions}><Button label={busy === itemId(item, '') ? '...' : 'Marquer traité'} onPress={() => acknowledge(item)} tone="blue" loading={busy === itemId(item, '')} /></View></View>) : <EmptyState title="Aucun élément" body="Le flux apparaîtra ici dès sa synchronisation avec OPS." />}</View>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({wrap: {padding: CareLinkSpace.lg, gap: CareLinkSpace.lg}, hero: {borderColor: 'rgba(255,255,255,0.12)', gap: CareLinkSpace.sm}, kicker: {color: '#93c5fd'}, title: {marginTop: 2}, body: {marginTop: -2}, row: {flexDirection: 'row', flexWrap: 'wrap', gap: CareLinkSpace.sm}, notice: {backgroundColor: CareLinkColors.backgroundSoft}, noticeText: {color: CareLinkColors.blue, fontSize: 13, fontWeight: '800'}, tabs: {flexDirection: 'row', gap: 8, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: CareLinkRadius.xl, borderWidth: 1, borderColor: CareLinkColors.border, padding: 8}, tab: {flex: 1, minHeight: 42, borderRadius: CareLinkRadius.lg, alignItems: 'center', justifyContent: 'center'}, tabActive: {backgroundColor: CareLinkColors.surfaceInverse}, tabText: {color: CareLinkColors.textMuted, fontSize: 11, fontWeight: '900', textTransform: 'uppercase'}, tabTextActive: {color: '#fff'}, panel: {gap: CareLinkSpace.sm}, list: {gap: CareLinkSpace.sm}, item: {borderRadius: CareLinkRadius.lg, borderWidth: 1, borderColor: CareLinkColors.border, backgroundColor: CareLinkColors.surfaceMuted, padding: CareLinkSpace.md, gap: 8}, itemTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: CareLinkSpace.sm}, itemTitle: {flex: 1, color: CareLinkColors.textStrong, fontSize: 14, fontWeight: '900'}, itemBody: {fontSize: 12, lineHeight: 18, fontWeight: '700'}, itemActions: {marginTop: 3}})
