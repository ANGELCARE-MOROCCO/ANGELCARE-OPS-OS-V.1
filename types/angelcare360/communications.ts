import type { Angelcare360UUID } from './database'

export interface Angelcare360MessageRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  message_code: string
  subject: string
  body: string
  status: string
}

export interface Angelcare360NotificationRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  notification_code: string
  title: string
  body: string
  status: string
}

export interface Angelcare360AnnouncementRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  announcement_code: string
  title: string
  body: string
  status: string
}

export interface Angelcare360ReclamationRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  reclamation_code: string
  subject: string
  description: string
  status: string
}

