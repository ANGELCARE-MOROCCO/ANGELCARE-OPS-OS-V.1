import type {
  Phase17Notification,
  Phase17PresenceUser,
  Phase17ReviewSession,
} from './phase17-collaboration-types';

export function getActivePresenceUsers(users: Phase17PresenceUser[]): Phase17PresenceUser[] {
  return users.filter((user) => user.status !== 'offline');
}

export function getUnreadNotifications(notifications: Phase17Notification[]): Phase17Notification[] {
  return notifications.filter((notification) => !notification.read);
}

export function getBlockedReviewSessions(sessions: Phase17ReviewSession[]): Phase17ReviewSession[] {
  return sessions.filter((session) => session.status === 'revision_requested' || session.dueLabel.toLowerCase() === 'overdue');
}

export function getReviewSessionHealthLabel(session: Phase17ReviewSession): string {
  if (session.status === 'approved') return 'Healthy';
  if (session.status === 'revision_requested') return 'Needs revision';
  if (session.dueLabel.toLowerCase() === 'overdue') return 'Overdue';
  if (session.openComments > 3) return 'Heavy discussion';
  return 'On track';
}