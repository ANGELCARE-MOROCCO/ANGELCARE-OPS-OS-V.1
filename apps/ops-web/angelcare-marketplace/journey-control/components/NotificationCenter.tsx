'use client'
import { useState } from 'react'
import { BellRing, Check, Mail, MessageCircleMore } from 'lucide-react'
import type { JourneyNotification } from '../types'
import styles from '../journey.module.css'

const channelIcon = (channel: JourneyNotification['channel']) => channel === 'email' ? Mail : channel === 'whatsapp' ? MessageCircleMore : BellRing
export function NotificationCenter({ notifications }: { notifications: JourneyNotification[] }) {
  const [acknowledged, setAcknowledged] = useState<string[]>([])
  async function acknowledge(id: string) {
    const response = await fetch(`/api/angelcare-marketplace/journeys/notifications/${id}/acknowledge`, { method: 'POST' })
    if (response.ok) setAcknowledged((current) => [...current, id])
  }
  const visible = notifications.filter((notification) => !acknowledged.includes(notification.id))
  return <section className={styles.notificationPanel} aria-labelledby="notifications-title">
    <div className={styles.sectionHeading}><div><span>COMMUNICATION COMMAND</span><h2 id="notifications-title">Messages utiles</h2></div><strong>{visible.length}</strong></div>
    {visible.length ? <div className={styles.notificationList}>{visible.map((notification) => { const Icon = channelIcon(notification.channel); return <article className={styles.notificationCard} key={notification.id}>
      <Icon size={18}/><div><h3>{notification.title}</h3><p>{notification.message}</p><span>{notification.channel} · {new Date(notification.scheduled_at).toLocaleString('fr')}</span></div>
      <button className={styles.iconButton} type="button" onClick={() => void acknowledge(notification.id)} aria-label="Marquer comme lu"><Check size={16}/></button>
    </article> })}</div> : <div className={styles.emptyState}>Aucun nouveau message.</div>}
  </section>
}
