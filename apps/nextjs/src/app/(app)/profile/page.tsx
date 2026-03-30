"use client";

import { useCallback, useEffect, useState } from "react";

import {
  type AppBskyActorDefs,
  type AppBskyFeedDefs,
} from "@atproto/api";

import { Avatar } from "~/components/avatar";
import { PostCard } from "~/components/post-card";
import { SkeletonProfile } from "~/components/skeleton";
import { useAuth } from "~/lib/auth-context";

function fmtCount(n?: number): string {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function ProfilePage() {
  const { session, agent } = useAuth();

  const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
  const [feed, setFeed] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, feedRes] = await Promise.all([
        agent.getProfile({ actor: session.did }),
        agent.getAuthorFeed({ actor: session.did, limit: 20 }),
      ]);
      setProfile(profileRes.data);
      setFeed(feedRes.data.feed);
    } catch {
      setError("Could not load profile.");
    } finally {
      setLoading(false);
    }
  }, [agent, session.did]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <SkeletonProfile />
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
        ) : profile ? (
          <>
            {/* Banner */}
            <div className="relative">
              {profile.banner ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.banner}
                  alt=""
                  className="h-28 w-full object-cover"
                />
              ) : (
                <div className="h-28 w-full bg-[var(--color-accent-muted)]" />
              )}

              {/* Avatar overlapping banner */}
              <div className="absolute -bottom-10 left-4">
                <div className="rounded-full border-4 border-[var(--color-bg-primary)]">
                  <Avatar
                    src={profile.avatar}
                    alt={profile.handle}
                    size="2xl"
                  />
                </div>
              </div>
            </div>

            {/* Profile info */}
            <div className="px-4 pb-4 pt-12">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                {profile.displayName ?? profile.handle}
              </h2>
              <p className="text-sm text-[var(--color-text-tertiary)]">@{profile.handle}</p>

              {profile.description && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--color-text-secondary)]">
                  {profile.description}
                </p>
              )}

              {/* Stats */}
              <div className="mt-3 flex gap-5 text-sm">
                <span>
                  <span className="font-bold text-[var(--color-text-primary)]">
                    {fmtCount(profile.postsCount)}
                  </span>{" "}
                  <span className="text-[var(--color-text-tertiary)]">posts</span>
                </span>
                <span>
                  <span className="font-bold text-[var(--color-text-primary)]">
                    {fmtCount(profile.followersCount)}
                  </span>{" "}
                  <span className="text-[var(--color-text-tertiary)]">followers</span>
                </span>
                <span>
                  <span className="font-bold text-[var(--color-text-primary)]">
                    {fmtCount(profile.followsCount)}
                  </span>{" "}
                  <span className="text-[var(--color-text-tertiary)]">following</span>
                </span>
              </div>
            </div>

            {/* Divider + Posts label */}
            <div className="border-b border-[var(--color-border-primary)] px-4 py-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Posts
              </p>
            </div>

            {/* Posts */}
            {feed.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--color-text-muted)]">
                No posts yet
              </p>
            ) : (
              feed.map((item) => (
                <PostCard
                  key={`${item.post.uri}-${item.reason?.$type ?? "post"}`}
                  item={item}
                />
              ))
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
