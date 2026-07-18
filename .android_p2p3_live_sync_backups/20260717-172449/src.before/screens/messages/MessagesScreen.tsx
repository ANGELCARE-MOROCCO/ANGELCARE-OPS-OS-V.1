import React from 'react'
import {ScrollView, StyleSheet, Text, View} from 'react-native'
import {CareLinkColors, CareLinkRadius, CareLinkSpace} from '../../design/tokens'
import {CareLinkType} from '../../design/typography'
import type {CareLinkMobileWorkspace} from '../../services/carelink/mobileService'
import {Card} from '../../ui/Card'
import {EmptyState} from '../../ui/EmptyState'
import {StatusPill} from '../../ui/StatusPill'

export function MessagesScreen({workspace}: {workspace: CareLinkMobileWorkspace | null}) {
  const messages = workspace?.messages || []
  const notifications = workspace?.notifications || []
  const alerts = workspace?.alerts || []
  const unreadMessages = messages.filter((item: any) => Boolean(item.unread)).length
  const unreadNotifications = notifications.filter((item: any) => Boolean(item.unread)).length
  const criticalAlerts = alerts.filter((item: any) => String(item.tone || item.priority || '').toLowerCase() === 'red' || String(item.priority || '').toLowerCase() === 'critical').length

  return (
    <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
      <Card tone="inverse" style={styles.hero}>
        <Text style={[CareLinkType.heroKicker, styles.kicker]}>COMMUNICATION</Text>
        <Text style={[CareLinkType.heroTitle, styles.title]}>Messages CareLink</Text>
        <Text style={[CareLinkType.heroBody, styles.body]}>Centre unifié des messages, notifications et alertes synchronisées avec OPS.</Text>
        <View style={styles.row}>
          <StatusPill label={`${unreadMessages} messages`} tone="amber" />
          <StatusPill label={`${unreadNotifications} notifications`} tone="blue" />
          <StatusPill label={`${criticalAlerts} alertes`} tone="rose" />
        </View>
      </Card>

      <Card style={styles.panel}>
        <Text style={CareLinkType.cardTitle}>Messages récents</Text>
        <View style={styles.list}>
          {messages.length ? messages.slice(0, 4).map((item, index) => (
            <FeedRow key={String(item.id || index)} title={String(item.title || 'Message CareLink')} body={String(item.body || '')} unread={Boolean((item as any).unread)} tone="amber" />
          )) : <EmptyState title="Aucun message persistant" body="Les messages du dispatch apparaîtront ici dès qu’ils seront synchronisés." />}
        </View>
      </Card>

      <Card style={styles.panel}>
        <Text style={CareLinkType.cardTitle}>Notifications</Text>
        <View style={styles.list}>
          {notifications.length ? notifications.slice(0, 4).map((item, index) => (
            <FeedRow key={String(item.id || index)} title={String(item.title || 'Notification')} body={String(item.body || '')} unread={Boolean((item as any).unread)} tone="blue" />
          )) : <EmptyState title="Aucune notification" body="Les notifications CareLink ou Connect apparaîtront ici." />}
        </View>
      </Card>

      <Card style={styles.panel}>
        <Text style={CareLinkType.cardTitle}>Alertes</Text>
        <View style={styles.list}>
          {alerts.length ? alerts.slice(0, 4).map((item, index) => (
            <FeedRow key={String(item.id || index)} title={String(item.title || 'Alerte')} body={String(item.body || '')} unread={Boolean((item as any).unread)} tone="rose" />
          )) : <EmptyState title="Aucune alerte" body="Les alertes critiques et les escalades apparaîtront ici." />}
        </View>
      </Card>
    </ScrollView>
  )
}

function FeedRow({
  title,
  body,
  unread,
  tone,
}: {
  title: string
  body: string
  unread: boolean
  tone: 'amber' | 'blue' | 'rose'
}) {
  const accent = tone === 'amber' ? CareLinkColors.amber : tone === 'rose' ? CareLinkColors.rose : CareLinkColors.blue
  return (
    <View style={styles.item}>
      <View style={styles.itemTop}>
        <Text style={styles.itemTitle}>{title}</Text>
        <StatusPill label={unread ? 'non lu' : 'lu'} tone={tone === 'rose' ? 'rose' : tone === 'amber' ? 'amber' : 'blue'} />
      </View>
      <Text style={[styles.itemBody, {color: unread ? CareLinkColors.textStrong : CareLinkColors.textMuted}]}>{body}</Text>
      <View style={[styles.bar, {backgroundColor: accent}]} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    padding: CareLinkSpace.lg,
    gap: CareLinkSpace.lg,
  },
  hero: {
    borderColor: 'rgba(255,255,255,0.12)',
    gap: CareLinkSpace.sm,
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
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CareLinkSpace.sm,
  },
  panel: {
    gap: CareLinkSpace.sm,
  },
  list: {
    gap: CareLinkSpace.sm,
  },
  item: {
    borderRadius: CareLinkRadius.lg,
    borderWidth: 1,
    borderColor: CareLinkColors.border,
    backgroundColor: CareLinkColors.surfaceMuted,
    padding: CareLinkSpace.md,
    gap: 8,
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: CareLinkSpace.sm,
  },
  itemTitle: {
    flex: 1,
    color: CareLinkColors.textStrong,
    fontSize: 14,
    fontWeight: '900',
  },
  itemBody: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  bar: {
    height: 3,
    borderRadius: 999,
    opacity: 0.9,
  },
})
