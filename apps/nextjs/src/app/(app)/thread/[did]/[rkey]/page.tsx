"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";

import { AppBskyFeedDefs } from "@atproto/api";

import { PostCard } from "~/components/post-card";
import { useAuth } from "~/lib/auth-context";

export default function ThreadPage() {
  const { agent } = useAuth();
  const params = useParams<{ did: string; rkey: string }>();
  const router = useRouter();

  // Explicitly decode the DID — Next.js 16 may not auto-decode dynamic segments.
  const postUri = `at://${decodeURIComponent(params.did)}/app.bsky.feed.post/${params.rkey}`;

  const [ancestors, setAncestors] = useState<AppBskyFeedDefs.PostView[]>([]);
  const [mainPost, setMainPost] = useState<AppBskyFeedDefs.PostView | null>(null);
  const [replies, setReplies] = useState<{ post: AppBskyFeedDefs.PostView; depth: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await agent.app.bsky.feed.getPostThread({
        uri: postUri,
        depth: 6,
        parentHeight: 8,
      });

      const thread = res.data.thread;

      if (!AppBskyFeedDefs.isThreadViewPost(thread)) {
        setError("This post could not be found.");
        return;
      }

      // Walk up the parent chain (oldest ancestor first)
      const ancestorPosts: AppBskyFeedDefs.PostView[] = [];
      let cur: typeof thread.parent = thread.parent;
      while (cur && AppBskyFeedDefs.isThreadViewPost(cur)) {
        ancestorPosts.unshift(cur.post);
        cur = cur.parent;
      }

      // Flatten replies depth-first, tracking nesting depth
      const replyPosts: { post: AppBskyFeedDefs.PostView; depth: number }[] = [];
      function collectReplies(
        items: typeof thread.replies,
        depth: number,
      ) {
        if (!items || depth > 6) return;
        for (const reply of items) {
          if (AppBskyFeedDefs.isThreadViewPost(reply)) {
            replyPosts.push({ post: reply.post, depth });
            if (reply.replies?.length) collectReplies(reply.replies, depth + 1);
          }
        }
      }
      collectReplies(thread.replies, 0);

      setAncestors(ancestorPosts);
      setMainPost(thread.post);
      setReplies(replyPosts);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Could not load this thread. (${msg})`);
    } finally {
      setLoading(false);
    }
  }, [agent, postUri]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-shrink-0 items-center gap-3 border-b border-gray-800 px-4 py-3">
        <button
          onClick={() => router.back()}
          className="flex-shrink-0 text-gray-400 hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">Post</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center px-4 py-16 text-center">
            <p className="mb-3 text-sm text-gray-500">{error}</p>
            <button
              onClick={() => void load()}
              className="rounded-xl bg-blue-500 px-4 py-2 text-sm text-white"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {ancestors.map((post, i) => (
              <PostCard
                key={post.uri}
                item={{ post } as AppBskyFeedDefs.FeedViewPost}
                hasReply={i < ancestors.length - 1 || !!mainPost}
                isReply={i > 0}
                replyTo={
                  i > 0
                    ? (ancestors[i - 1]!.author.displayName ??
                      `@${ancestors[i - 1]!.author.handle}`)
                    : undefined
                }
              />
            ))}

            {mainPost && (
              <PostCard
                item={{ post: mainPost } as AppBskyFeedDefs.FeedViewPost}
                primary
                disableNavigation
                hasReply={replies.length > 0}
                isReply={ancestors.length > 0}
                replyTo={
                  ancestors.length > 0
                    ? (ancestors[ancestors.length - 1]!.author.displayName ??
                      `@${ancestors[ancestors.length - 1]!.author.handle}`)
                    : undefined
                }
              />
            )}

            {replies.length > 0 && (
              <div className="border-t border-gray-800">
                <div className="flex items-center gap-2 px-4 py-3">
                  <MessageCircle size={14} className="text-gray-500" />
                  <span className="text-sm text-gray-500">
                    {replies.length} {replies.length === 1 ? "reply" : "replies"}
                  </span>
                </div>
                {replies.map(({ post, depth }) => (
                  <div
                    key={post.uri}
                    style={{ marginLeft: Math.min(depth, 3) * 16 }}
                  >
                    <PostCard
                      item={{ post } as AppBskyFeedDefs.FeedViewPost}
                    />
                  </div>
                ))}
              </div>
            )}

            {replies.length === 0 && mainPost && (
              <p className="py-10 text-center text-sm text-gray-600">
                No replies yet
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
