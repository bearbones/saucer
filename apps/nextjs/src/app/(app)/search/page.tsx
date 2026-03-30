"use client";

import { useEffect, useRef, useState } from "react";

import { type AppBskyActorDefs, type AppBskyFeedDefs } from "@atproto/api";
import { Search } from "lucide-react";

import { Avatar } from "~/components/avatar";
import { PostCard } from "~/components/post-card";
import { useAuth } from "~/lib/auth-context";

type Tab = "people" | "posts";

function ActorRow({ actor }: { actor: AppBskyActorDefs.ProfileView }) {
  return (
    <a
      href={`https://bsky.app/profile/${actor.handle}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 border-b border-[var(--color-border-primary)] px-4 py-3 hover:bg-[var(--color-bg-tertiary)]"
    >
      <Avatar src={actor.avatar} alt={actor.handle} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-[var(--color-text-primary)]">
          {actor.displayName ?? actor.handle}
        </p>
        <p className="truncate text-sm text-[var(--color-text-tertiary)]">
          @{actor.handle}
        </p>
        {actor.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-text-muted)]">
            {actor.description}
          </p>
        )}
      </div>
    </a>
  );
}

export default function SearchPage() {
  const { agent } = useAuth();

  const [tab, setTab] = useState<Tab>("people");
  const [query, setQuery] = useState("");
  const [actors, setActors] = useState<AppBskyActorDefs.ProfileView[]>([]);
  const [posts, setPosts] = useState<AppBskyFeedDefs.PostView[]>([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setActors([]);
      setPosts([]);
      return;
    }
    clearTimeout(timer.current);
    setSearching(true);
    timer.current = setTimeout(async () => {
      try {
        if (tab === "people") {
          const { data } = await agent.searchActors({ q, limit: 25 });
          setActors(data.actors);
        } else {
          const { data } = await agent.app.bsky.feed.searchPosts({ q, limit: 25 });
          setPosts(data.posts);
        }
      } catch {
        // swallow — user will see empty results
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer.current);
  }, [query, tab, agent]);

  const hasResults = tab === "people" ? actors.length > 0 : posts.length > 0;
  const isEmpty = query.trim() !== "" && !searching && !hasResults;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-[var(--color-border-primary)] px-4 pb-0 pt-3">
        <h1 className="mb-3 text-lg font-bold text-[var(--color-text-primary)]">
          Search
        </h1>

        {/* Search bar */}
        <div className="relative mb-3">
          <span className="pointer-events-none absolute left-3 top-2.5 text-[var(--color-text-muted)]">
            <Search size={16} />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Bluesky…"
            className="w-full rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-bg-tertiary)] py-2.5 pl-9 pr-4 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:ring-2 focus:ring-[var(--color-accent)] focus:outline-none"
          />
          {searching && (
            <span className="absolute right-3 top-2.5">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-text-muted)] border-t-transparent" />
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex">
          {(["people", "posts"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 border-b-2 pb-2 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? "border-[var(--color-accent)] text-[var(--color-text-primary)]"
                  : "border-transparent text-[var(--color-text-tertiary)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {query.trim() === "" ? (
          <div className="flex flex-col items-center py-16">
            <Search
              size={32}
              className="mb-3 text-[var(--color-text-muted)]"
            />
            <p className="text-sm text-[var(--color-text-muted)]">
              Search for people or posts on Bluesky
            </p>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center py-16">
            <Search
              size={32}
              className="mb-3 text-[var(--color-text-muted)]"
            />
            <p className="text-sm text-[var(--color-text-muted)]">
              No results for &ldquo;{query}&rdquo;
            </p>
          </div>
        ) : tab === "people" ? (
          actors.map((actor) => <ActorRow key={actor.did} actor={actor} />)
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.uri}
              item={{ post, reply: undefined, reason: undefined }}
            />
          ))
        )}
      </div>
    </div>
  );
}
