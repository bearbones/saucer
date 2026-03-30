"use client";

import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Repeat2 } from "lucide-react";

import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyFeedDefs,
  AppBskyFeedPost,
} from "@atproto/api";

import { Avatar } from "~/components/avatar";
import { useAuth } from "~/lib/auth-context";
import { useLike, useRepost } from "~/lib/hooks/use-post-actions";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
  return `${Math.floor(secs / 86400)}d`;
}

function fullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtCount(n?: number): string {
  if (!n) return "0";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/** Build the /thread/[did]/[rkey] href for any AT-URI post. */
function threadHref(postUri: string): string {
  const parts = postUri.split("/");
  const did = parts[2] ?? "";
  const rkey = parts[4] ?? "";
  return `/thread/${encodeURIComponent(did)}/${rkey}`;
}

// ── Embed sub-components ──────────────────────────────────────────────────────

function ImageEmbed({ embed }: { embed: AppBskyEmbedImages.View }) {
  const { images } = embed;
  if (images.length === 1) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={images[0]!.thumb}
        alt={images[0]!.alt ?? ""}
        className="mt-2 max-h-64 w-full rounded-xl object-cover"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }
  return (
    <div
      className="mt-2 flex flex-wrap gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      {images.slice(0, 4).map((img, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={img.thumb}
          alt={img.alt ?? ""}
          className="h-32 flex-1 rounded-xl object-cover"
          style={{ minWidth: "calc(50% - 2px)", maxWidth: "calc(50% - 2px)" }}
        />
      ))}
    </div>
  );
}

function ExternalEmbed({ embed }: { embed: AppBskyEmbedExternal.View }) {
  const { external } = embed;
  const domain = (() => {
    try {
      return new URL(external.uri).hostname;
    } catch {
      return external.uri;
    }
  })();

  return (
    <a
      href={external.uri}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="mt-2 flex overflow-hidden rounded-xl border border-[var(--color-border-primary)] transition hover:border-[var(--color-border-secondary)]"
    >
      {external.thumb && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={external.thumb}
          alt=""
          className="h-20 w-20 flex-shrink-0 object-cover"
        />
      )}
      <div className="min-w-0 flex-1 p-3">
        <p className="truncate text-xs text-[var(--color-text-tertiary)]">{domain}</p>
        <p className="mt-0.5 line-clamp-2 text-sm font-medium text-[var(--color-text-primary)]">
          {external.title}
        </p>
        {external.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-text-tertiary)]">
            {external.description}
          </p>
        )}
      </div>
    </a>
  );
}

function QuoteEmbed({ embed }: { embed: AppBskyEmbedRecord.View }) {
  const rec = embed.record;
  if (!AppBskyEmbedRecord.isViewRecord(rec)) return null;

  const author = rec.author;
  const text = AppBskyFeedPost.isRecord(rec.value)
    ? rec.value.text
    : "View post";

  return (
    <div
      className="mt-2 rounded-xl border border-[var(--color-border-primary)] p-3"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-1 flex items-center gap-2">
        <Avatar src={author.avatar} alt={author.handle} size="xs" className="h-4 w-4" />
        <span className="text-xs font-semibold text-[var(--color-text-primary)]">
          {author.displayName ?? author.handle}
        </span>
        <span className="text-xs text-[var(--color-text-tertiary)]">@{author.handle}</span>
      </div>
      <p className="line-clamp-3 text-sm text-[var(--color-text-secondary)]">{text}</p>
    </div>
  );
}

function PostEmbed({ post }: { post: AppBskyFeedDefs.PostView }) {
  const embed = post.embed;
  if (!embed) return null;

  if (AppBskyEmbedImages.isView(embed)) return <ImageEmbed embed={embed} />;
  if (AppBskyEmbedExternal.isView(embed))
    return <ExternalEmbed embed={embed} />;
  if (AppBskyEmbedRecord.isView(embed)) return <QuoteEmbed embed={embed} />;

  return null;
}

// ── Action Row ────────────────────────────────────────────────────────────────

function PostActionRow({ post }: { post: AppBskyFeedDefs.PostView }) {
  const { agent } = useAuth();
  const { liked, likeCount, toggleLike } = useLike(agent, post);
  const { reposted, repostCount, toggleRepost } = useRepost(agent, post);
  const router = useRouter();

  return (
    <div className="mt-3 flex justify-between text-sm text-[var(--color-text-tertiary)]">
      {/* Reply */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          router.push(threadHref(post.uri));
        }}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--color-accent-muted)] hover:text-[var(--color-accent-text)] active:scale-[0.97]"
      >
        <MessageCircle size={18} />
        <span>{fmtCount(post.replyCount)}</span>
      </button>

      {/* Repost */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          void toggleRepost();
        }}
        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors active:scale-[0.97] ${
          reposted
            ? "text-[var(--color-repost)]"
            : "hover:bg-[var(--color-repost-bg)] hover:text-[var(--color-repost)]"
        }`}
      >
        <Repeat2 size={20} />
        <span>{fmtCount(repostCount)}</span>
      </button>

      {/* Like */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          void toggleLike();
        }}
        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors active:scale-[0.97] ${
          liked ? "text-[var(--color-like)]" : "hover:bg-[var(--color-like-bg)] hover:text-[var(--color-like)]"
        }`}
      >
        <Heart size={18} fill={liked ? "currentColor" : "none"} />
        <span>{fmtCount(likeCount)}</span>
      </button>
    </div>
  );
}

// ── Main PostCard ─────────────────────────────────────────────────────────────

interface PostCardProps {
  item: AppBskyFeedDefs.FeedViewPost;
  /** Show as the highlighted/primary post in a thread view */
  primary?: boolean;
  /** Show a thread line below the avatar (connecting to next post) */
  hasReply?: boolean;
  /** Hide the action row (for inline parent display) */
  hideActions?: boolean;
  /** Don't navigate on click */
  disableNavigation?: boolean;
}

export function PostCard({
  item,
  primary = false,
  hasReply = false,
  hideActions = false,
  disableNavigation = false,
}: PostCardProps) {
  const { post, reason } = item;
  const author = post.author;
  const record = post.record as AppBskyFeedPost.Record;
  const isRepost = AppBskyFeedDefs.isReasonRepost(reason);
  const router = useRouter();

  const handleClick = () => {
    if (disableNavigation) return;
    router.push(threadHref(post.uri));
  };

  return (
    <article
      className={`px-4 pt-3 ${hasReply ? "pb-0" : "border-b border-[var(--color-border-primary)] pb-3"} ${
        primary
          ? "border-l-2 border-l-[var(--color-accent)] bg-[var(--color-bg-secondary)]"
          : disableNavigation
            ? ""
            : "cursor-pointer transition-colors hover:bg-[var(--color-bg-hover)] active:bg-[var(--color-bg-active)]"
      }`}
      onClick={handleClick}
    >
      {/* Repost banner */}
      {isRepost && AppBskyFeedDefs.isReasonRepost(reason) && (
        <p className="mb-1.5 flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)]">
          <Repeat2 size={12} />
          <span>
            Reposted by {reason.by.displayName ?? reason.by.handle}
          </span>
        </p>
      )}

      <div className="flex gap-3">
        {/* Avatar column with optional thread line */}
        <div className="flex flex-col items-center">
          <Avatar
            src={author.avatar}
            alt={author.handle}
            size={primary ? "lg" : "md"}
          />
          {/* Thread line */}
          {hasReply && <div className="mt-1 w-0.5 flex-1 bg-[var(--color-border-secondary)]" />}
        </div>

        <div className="min-w-0 flex-1">
          {/* Author + timestamp */}
          <div className="flex items-baseline gap-1.5">
            <span
              className={`truncate font-semibold text-[var(--color-text-primary)] ${
                primary ? "text-base" : "text-sm"
              }`}
            >
              {author.displayName ?? author.handle}
            </span>
            <span className="flex-shrink-0 text-xs text-[var(--color-text-tertiary)]">
              @{author.handle}
            </span>
            {!primary && (
              <span className="flex-shrink-0 text-xs text-[var(--color-text-muted)]">
                · {timeAgo(post.indexedAt)}
              </span>
            )}
          </div>

          {/* Post text */}
          {record.text && (
            <p
              className={`mt-1 whitespace-pre-wrap break-words text-[var(--color-text-secondary)] ${
                primary ? "text-base" : "text-sm"
              }`}
            >
              {record.text}
            </p>
          )}

          {/* Embedded media */}
          <PostEmbed post={post} />

          {/* Full timestamp for primary post */}
          {primary && (
            <p className="mt-3 text-xs text-[var(--color-text-tertiary)]">
              {fullDate(post.indexedAt)}
            </p>
          )}

          {/* Action row */}
          {!hideActions && <PostActionRow post={post} />}
        </div>
      </div>
    </article>
  );
}
