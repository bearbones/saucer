"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Hash, Home } from "lucide-react";

import { type AppBskyFeedDefs as FeedDefsNS } from "@atproto/api";

import { DrawerMenu } from "~/components/drawer-menu";
import { SkeletonFeedRow } from "~/components/skeleton";
import { useAuth } from "~/lib/auth-context";
import { encodeFeedUri } from "~/lib/feed-uri";

type GeneratorView = FeedDefsNS.GeneratorView;

export default function FeedsPage() {
  const { agent } = useAuth();

  const [pinned, setPinned] = useState<GeneratorView[]>([]);
  const [saved, setSaved] = useState<GeneratorView[]>([]);
  // null = still loading, true/false = done
  const [feedsLoaded, setFeedsLoaded] = useState(false);
  const [feedsError, setFeedsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFeedsLoaded(false);
    setFeedsError(null);

    void (async () => {
      try {
        // Use the high-level getPreferences() which normalises both v1 and v2
        // formats into a unified savedFeeds: SavedFeed[] array.
        const prefs = await agent.getPreferences();

        // savedFeeds is already normalised: [{ id, type, value, pinned }]
        // type === 'feed' means it's a feed generator; value is the AT-URI.
        const feedItems = prefs.savedFeeds.filter(
          (f) => f.type === "feed" && f.value.includes("app.bsky.feed.generator"),
        );

        if (feedItems.length === 0) {
          if (!cancelled) setFeedsLoaded(true);
          return;
        }

        const allUris = feedItems.map((f) => f.value);
        const { data: gensData } =
          await agent.app.bsky.feed.getFeedGenerators({ feeds: allUris });
        const genMap = new Map(gensData.feeds.map((g) => [g.uri, g]));

        if (cancelled) return;

        const pinnedFeeds: GeneratorView[] = [];
        const savedFeeds: GeneratorView[] = [];

        for (const item of feedItems) {
          const gen = genMap.get(item.value);
          if (!gen) continue;
          if (item.pinned) pinnedFeeds.push(gen);
          else savedFeeds.push(gen);
        }

        setPinned(pinnedFeeds);
        setSaved(savedFeeds);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          setFeedsError(msg);
        }
      } finally {
        if (!cancelled) setFeedsLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [agent]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex flex-shrink-0 items-center gap-3 border-b border-[var(--color-border-primary)] px-4 py-3">
        <DrawerMenu />
        <h1 className="text-lg font-bold">Feeds</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Following — always shown immediately, no API needed */}
        <Link
          href="/feeds/following"
          className="flex items-center gap-4 border-b border-[var(--color-border-primary)] px-4 py-5 transition hover:bg-[var(--color-bg-hover)] active:bg-[var(--color-bg-active)]"
        >
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-blue-600">
            <Home size={28} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-[var(--color-text-primary)]">Following</p>
            <p className="text-sm text-[var(--color-text-muted)]">
              Posts from people you follow
            </p>
          </div>
          <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
        </Link>

        {/* Custom feeds — loaded asynchronously */}
        {!feedsLoaded ? (
          <div>
            <SkeletonFeedRow />
            <SkeletonFeedRow />
            <SkeletonFeedRow />
          </div>
        ) : feedsError ? (
          <p className="px-4 py-4 text-xs text-[var(--color-text-muted)]">
            Could not load custom feeds: {feedsError}
          </p>
        ) : (
          <>
            {pinned.length > 0 && (
              <div>
                <p className="px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Favourites
                </p>
                {pinned.map((gen) => (
                  <FeedRow key={gen.uri} gen={gen} />
                ))}
              </div>
            )}

            {saved.length > 0 && (
              <div>
                <p className="px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  All Feeds
                </p>
                {saved.map((gen) => (
                  <FeedRow key={gen.uri} gen={gen} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Feed row ──────────────────────────────────────────────────────────────────

function FeedRow({ gen }: { gen: GeneratorView }) {
  return (
    <Link
      href={`/feeds/${encodeFeedUri(gen.uri)}`}
      className="flex items-center gap-3 border-b border-[var(--color-border-primary)] px-4 py-3 transition hover:bg-[var(--color-bg-hover)] active:bg-[var(--color-bg-active)]"
    >
      {gen.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={gen.avatar}
          alt={gen.displayName}
          className="h-10 w-10 flex-shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-muted)]">
          <Hash size={18} className="text-[var(--color-accent-text)]" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
          {gen.displayName}
        </p>
        <p className="truncate text-xs text-[var(--color-text-muted)]">
          by @{gen.creator.handle}
        </p>
      </div>
      <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
    </Link>
  );
}
