"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AtSign,
  Bell,
  Heart,
  MessageCircle,
  Quote,
  RefreshCw,
  Repeat2,
  UserPlus,
} from "lucide-react";

import { type AppBskyNotificationListNotifications } from "@atproto/api";

import { Avatar } from "~/components/avatar";
import { SkeletonNotifRow } from "~/components/skeleton";
import { useAuth } from "~/lib/auth-context";

type Notif = AppBskyNotificationListNotifications.Notification;

function reasonLabel(reason: string): string {
  switch (reason) {
    case "like": return "liked your post";
    case "repost": return "reposted your post";
    case "follow": return "followed you";
    case "mention": return "mentioned you";
    case "reply": return "replied to your post";
    case "quote": return "quoted your post";
    default: return reason;
  }
}

function ReasonIcon({ reason }: { reason: string }) {
  const shared = "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full";

  switch (reason) {
    case "like":
      return (
        <div className={`${shared} bg-[var(--color-notif-like-bg)]`}>
          <Heart size={18} className="text-[var(--color-notif-like)]" />
        </div>
      );
    case "repost":
      return (
        <div className={`${shared} bg-[var(--color-notif-repost-bg)]`}>
          <Repeat2 size={18} className="text-[var(--color-notif-repost)]" />
        </div>
      );
    case "follow":
      return (
        <div className={`${shared} bg-[var(--color-notif-follow-bg)]`}>
          <UserPlus size={18} className="text-[var(--color-notif-follow)]" />
        </div>
      );
    case "mention":
      return (
        <div className={`${shared} bg-[var(--color-notif-mention-bg)]`}>
          <AtSign size={18} className="text-[var(--color-notif-mention)]" />
        </div>
      );
    case "reply":
      return (
        <div className={`${shared} bg-[var(--color-notif-reply-bg)]`}>
          <MessageCircle size={18} className="text-[var(--color-notif-reply)]" />
        </div>
      );
    case "quote":
      return (
        <div className={`${shared} bg-[var(--color-notif-quote-bg)]`}>
          <Quote size={18} className="text-[var(--color-notif-quote)]" />
        </div>
      );
    default:
      return (
        <div className={`${shared} bg-[var(--color-bg-tertiary)]`}>
          <Bell size={18} className="text-[var(--color-text-muted)]" />
        </div>
      );
  }
}

function timeAgo(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
  return `${Math.floor(secs / 86400)}d`;
}

function NotifRow({ notif }: { notif: Notif }) {
  const { author, reason, isRead, indexedAt } = notif;
  return (
    <div
      className={`flex gap-3 border-b border-[var(--color-border-primary)] px-4 py-3 ${
        isRead ? "" : "border-l-2 border-l-[var(--color-accent)] bg-[var(--color-accent-muted)]"
      }`}
    >
      <ReasonIcon reason={reason} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <Avatar src={author.avatar} alt={author.handle} size="xs" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[var(--color-text-primary)]">
              <span className="font-semibold">
                {author.displayName ?? author.handle}
              </span>{" "}
              <span className="text-[var(--color-text-secondary)]">{reasonLabel(reason)}</span>
            </p>
          </div>
          <span className="flex-shrink-0 text-xs text-[var(--color-text-muted)]">
            {timeAgo(indexedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { agent } = useAuth();

  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await agent.listNotifications({ limit: 50 });
      setNotifs(data.notifications);
      // Mark as read in the background
      void agent.updateSeenNotifications();
    } catch {
      setError("Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, [agent]);

  useEffect(() => {
    void load();
  }, [load]);

  const unread = notifs.filter((n) => !n.isRead).length;

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-shrink-0 items-center justify-between border-b border-[var(--color-border-primary)] px-4 py-3">
        <h1 className="text-lg font-bold text-[var(--color-text-primary)]">
          Notifications
          {unread > 0 && (
            <span className="ml-2 rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 text-xs font-normal text-white">
              {unread}
            </span>
          )}
        </h1>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-[var(--color-accent-text)] hover:opacity-80 disabled:opacity-40"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div>
            <SkeletonNotifRow />
            <SkeletonNotifRow />
            <SkeletonNotifRow />
            <SkeletonNotifRow />
            <SkeletonNotifRow />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="mb-3 text-sm text-[var(--color-text-tertiary)]">{error}</p>
            <button
              onClick={() => void load()}
              className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm text-white transition hover:bg-[var(--color-accent-hover)]"
            >
              Try again
            </button>
          </div>
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <Bell size={32} className="mb-3 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-muted)]">
              No notifications yet
            </p>
          </div>
        ) : (
          notifs.map((n) => <NotifRow key={n.uri} notif={n} />)
        )}
      </div>
    </div>
  );
}
