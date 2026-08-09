import type {
  Phase17ActivityEvent,
  Phase17CommentThread,
  Phase17Notification,
  Phase17PresenceUser,
  Phase17ReviewSession,
} from './phase17-collaboration-types';

export const phase17PresenceUsers: Phase17PresenceUser[] = [
  {
    id: 'presence-1',
    name: 'Content Lead',
    role: 'Content Owner',
    status: 'editing',
    currentArea: 'Content Library',
    lastSeen: 'Now',
  },
  {
    id: 'presence-2',
    name: 'Brand Reviewer',
    role: 'Reviewer',
    status: 'reviewing',
    currentArea: 'Approvals',
    lastSeen: 'Now',
  },
  {
    id: 'presence-3',
    name: 'Marketing Ops',
    role: 'Publisher',
    status: 'online',
    currentArea: 'Editorial Calendar',
    lastSeen: '5 min ago',
  },
];

export const phase17ActivityEvents: Phase17ActivityEvent[] = [
  {
    id: 'activity-1',
    actor: 'Content Lead',
    verb: 'edited',
    targetTitle: 'Core service brochure',
    targetType: 'asset',
    createdAt: 'Recent',
  },
  {
    id: 'activity-2',
    actor: 'Brand Reviewer',
    verb: 'requested_revision',
    targetTitle: 'Trust campaign social pack',
    targetType: 'social_post',
    createdAt: 'Recent',
  },
  {
    id: 'activity-3',
    actor: 'Marketing Ops',
    verb: 'scheduled',
    targetTitle: 'LinkedIn trust post',
    targetType: 'social_post',
    createdAt: 'Recent',
  },
];

export const phase17ReviewSessions: Phase17ReviewSession[] = [
  {
    id: 'review-1',
    title: 'Brochure final review',
    assetTitle: 'Core service brochure',
    reviewer: 'Brand Reviewer',
    status: 'in_review',
    openComments: 2,
    dueLabel: 'Today',
  },
  {
    id: 'review-2',
    title: 'Social pack validation',
    assetTitle: 'Trust campaign social pack',
    reviewer: 'Marketing Lead',
    status: 'revision_requested',
    openComments: 5,
    dueLabel: 'Overdue',
  },
  {
    id: 'review-3',
    title: 'Product sheet approval',
    assetTitle: 'Family support package',
    reviewer: 'Content Lead',
    status: 'open',
    openComments: 0,
    dueLabel: 'Tomorrow',
  },
];

export const phase17CommentThreads: Phase17CommentThread[] = [
  {
    id: 'thread-1',
    targetTitle: 'Core service brochure',
    author: 'Brand Reviewer',
    message: 'CTA should be clearer before final publishing.',
    status: 'open',
    repliesCount: 3,
  },
  {
    id: 'thread-2',
    targetTitle: 'Family support package',
    author: 'Marketing Ops',
    message: 'Please confirm the final service positioning.',
    status: 'resolved',
    repliesCount: 2,
  },
];

export const phase17Notifications: Phase17Notification[] = [
  {
    id: 'notification-1',
    title: 'Revision requested',
    message: 'Trust campaign social pack needs edits before scheduling.',
    priority: 'urgent',
    read: false,
  },
  {
    id: 'notification-2',
    title: 'Review assigned',
    message: 'A new product sheet approval is waiting.',
    priority: 'high',
    read: false,
  },
  {
    id: 'notification-3',
    title: 'Comment resolved',
    message: 'One brochure comment thread was marked resolved.',
    priority: 'medium',
    read: true,
  },
];