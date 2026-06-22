'use client';

import React, { useMemo } from 'react';
import {
  phase17ActivityEvents,
  phase17CommentThreads,
  phase17Notifications,
  phase17PresenceUsers,
  phase17ReviewSessions,
} from './phase17-collaboration-data';
import {
  getActivePresenceUsers,
  getBlockedReviewSessions,
  getReviewSessionHealthLabel,
  getUnreadNotifications,
} from './phase17-collaboration-helpers';
import { phase17RealtimeProviderReadiness } from './phase17-realtime-readiness';

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase17CollaborationWorkspace(): React.ReactElement {
  const activeUsers = useMemo(() => getActivePresenceUsers(phase17PresenceUsers), []);
  const unreadNotifications = useMemo(() => getUnreadNotifications(phase17Notifications), []);
  const blockedReviews = useMemo(() => getBlockedReviewSessions(phase17ReviewSessions), []);

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-9500">
          Content Command Center
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Phase 17 Realtime Collaboration
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Collaboration-ready layer for live presence, review sessions, comment threads,
          activity streams, notifications, and future realtime providers.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Active Users</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{activeUsers.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Unread Notifications</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{unreadNotifications.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Blocked Reviews</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{blockedReviews.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">Live Presence</h3>
            <div className="mt-5 space-y-3">
              {phase17PresenceUsers.map((user) => (
                <article key={user.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{user.name}</p>
                      <p className="mt-1 text-xs text-slate-9500">
                        {user.role} · {user.currentArea} · {user.lastSeen}
                      </p>
                    </div>
                    <Badge>{user.status}</Badge>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">Notification Center</h3>
            <div className="mt-5 space-y-3">
              {phase17Notifications.map((notification) => (
                <article key={notification.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{notification.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{notification.priority}</Badge>
                      <Badge>{notification.read ? 'Read' : 'Unread'}</Badge>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">Collaborative Review Sessions</h3>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {phase17ReviewSessions.map((session) => (
                <article key={session.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{session.title}</p>
                      <p className="mt-1 text-xs text-slate-9500">
                        {session.assetTitle} · Reviewer: {session.reviewer}
                      </p>
                    </div>
                    <Badge>{session.status}</Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge>{session.openComments} comments</Badge>
                    <Badge>{session.dueLabel}</Badge>
                    <Badge>{getReviewSessionHealthLabel(session)}</Badge>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-950">Comment Threads</h3>
              <div className="mt-5 space-y-3">
                {phase17CommentThreads.map((thread) => (
                  <article key={thread.id} className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-sm font-bold text-slate-950">{thread.targetTitle}</p>
                    <p className="mt-2 text-sm text-slate-600">{thread.message}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge>{thread.author}</Badge>
                      <Badge>{thread.status}</Badge>
                      <Badge>{thread.repliesCount} replies</Badge>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-950">Activity Stream</h3>
              <div className="mt-5 space-y-3">
                {phase17ActivityEvents.map((event) => (
                  <article key={event.id} className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-sm font-bold text-slate-950">
                      {event.actor} {event.verb.replaceAll('_', ' ')}
                    </p>
                    <p className="mt-1 text-xs text-slate-9500">
                      {event.targetTitle} · {event.targetType} · {event.createdAt}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950">Realtime Provider Readiness</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {phase17RealtimeProviderReadiness.map((provider) => (
            <article key={provider.id} className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-950">{provider.provider}</p>
                  <p className="mt-2 text-sm text-slate-600">{provider.notes}</p>
                </div>
                <Badge>{provider.ready ? 'Ready' : 'Future'}</Badge>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase17CollaborationWorkspace;