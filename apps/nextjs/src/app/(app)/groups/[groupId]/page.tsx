"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowUp, Heart, Repeat2, Settings } from "lucide-react";

import { Avatar } from "~/components/avatar";
import { GroupSettingsModal } from "~/components/group-settings-modal";
import { useAuth } from "~/lib/auth-context";
import {
  fetchGroup,
  isBskyPostContent,
  sendMessage,
  subscribeToMessages,
  type Group,
  type Message,
} from "~/lib/groups";

/** Format a Date as a short relative time string */
function timeSince(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
  return `${Math.floor(secs / 86400)}d`;
}

const AT_URI_RE = /^at:\/\/did:[a-z0-9:]+\/app\.bsky\.feed\.post\/[a-z0-9]+$/i;

/** Tiny inline Bluesky post embed fetched via the public AppView */
function BskyPostEmbed({ atUri }: { atUri: string }) {
  const [post, setPost] = useState<{
    text: string;
    handle: string;
    displayName?: string;
    avatar?: string;
    likeCount?: number;
    repostCount?: number;
  } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!AT_URI_RE.test(atUri)) {
      setError(true);
      return;
    }
    void (async () => {
      try {
        const res = await fetch(
          `https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(atUri)}&depth=0`,
        );
        if (!res.ok) throw new Error("fetch failed");
        const data = (await res.json()) as {
          thread: {
            post: {
              record: { text: string };
              author: {
                handle: string;
                displayName?: string;
                avatar?: string;
              };
              likeCount?: number;
              repostCount?: number;
            };
          };
        };
        const p = data.thread.post;
        setPost({
          text: p.record.text,
          handle: p.author.handle,
          displayName: p.author.displayName,
          avatar: p.author.avatar,
          likeCount: p.likeCount,
          repostCount: p.repostCount,
        });
      } catch {
        setError(true);
      }
    })();
  }, [atUri]);

  if (error) {
    return (
      <div className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border-secondary)] px-3 py-2 text-xs text-[var(--color-text-tertiary)]">
        <AlertTriangle size={14} />
        Post could not be loaded
      </div>
    );
  }
  if (!post) {
    return (
      <div className="rounded-xl border border-[var(--color-border-secondary)] px-3 py-2 text-xs text-[var(--color-text-tertiary)]">
        Loading post…
      </div>
    );
  }

  return (
    <a
      href={`https://bsky.app/profile/${post.handle}`}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 block rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)] p-3 text-left transition hover:border-[var(--color-text-muted)]"
    >
      <div className="mb-1.5 flex items-center gap-2">
        <Avatar src={post.avatar} alt={post.handle} size="xs" />
        <span className="text-xs font-semibold text-[var(--color-text-primary)]">
          {post.displayName ?? post.handle}
        </span>
        <span className="text-xs text-[var(--color-text-tertiary)]">@{post.handle}</span>
      </div>
      <p className="line-clamp-4 text-sm text-[var(--color-text-secondary)]">{post.text}</p>
      <div className="mt-2 flex gap-3 text-xs text-[var(--color-text-muted)]">
        <span className="flex items-center gap-1"><Heart size={12} /> {post.likeCount ?? 0}</span>
        <span className="flex items-center gap-1"><Repeat2 size={12} /> {post.repostCount ?? 0}</span>
      </div>
    </a>
  );
}

/** A single chat message bubble */
function MessageBubble({ msg, isOwn }: { msg: Message; isOwn: boolean }) {
  const timeStr = msg.createdAt ? timeSince(msg.createdAt.toDate()) : "";
  const isPost = isBskyPostContent(msg.text);

  let atUri: string | null = null;
  if (isPost) {
    if (msg.text.startsWith("at://")) {
      atUri = msg.text;
    } else {
      const m = /bsky\.app\/profile\/([^/]+)\/post\/([^/?#]+)/.exec(
        msg.text,
      );
      if (m) atUri = `at://${m[1]}/app.bsky.feed.post/${m[2]}`;
    }
  }

  return (
    <div
      className={`my-1 flex flex-col ${isOwn ? "items-end" : "items-start"}`}
    >
      {!isOwn && (
        <span className="mb-0.5 ml-1 truncate text-xs text-[var(--color-text-tertiary)]">
          {msg.sender.slice(0, 24)}…
        </span>
      )}

      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
          isOwn
            ? "bg-[var(--color-accent)] text-white"
            : "border border-[var(--color-border-secondary)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
        }`}
      >
        {isPost && atUri ? (
          <BskyPostEmbed atUri={atUri} />
        ) : (
          <span className="whitespace-pre-wrap break-words">{msg.text}</span>
        )}
      </div>

      {timeStr && (
        <span className="mx-1 mt-0.5 text-xs text-[var(--color-text-muted)]">{timeStr}</span>
      )}
    </div>
  );
}

export default function GroupChatPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { session } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load group metadata
  useEffect(() => {
    if (!groupId) return;
    void fetchGroup(groupId).then(setGroup);
  }, [groupId]);

  // Re-fetch group when settings modal closes (to pick up name/avatar changes)
  const handleSettingsClose = () => {
    setShowSettings(false);
    if (groupId) void fetchGroup(groupId).then(setGroup);
  };

  // Subscribe to messages
  useEffect(() => {
    if (!groupId) return;
    return subscribeToMessages(groupId, setMessages);
  }, [groupId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Auto-grow textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || sending || !session.did || !groupId) return;
    setInputText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setSending(true);
    try {
      await sendMessage(groupId, session.did, text);
    } catch (e) {
      console.error("Failed to send:", e);
      setInputText(text);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }, [inputText, sending, session.did, groupId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <>
      <div className="flex h-full flex-col">
        {/* ── Chat header ───────────────────────────────────────────────── */}
        <header className="flex flex-shrink-0 items-center gap-2 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3 py-2">
          {/* Back */}
          <button
            onClick={() => router.push("/groups")}
            aria-label="Back"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Tappable group identity → opens settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex flex-1 items-center gap-2 overflow-hidden rounded-xl px-2 py-1 transition hover:bg-[var(--color-bg-hover)] active:bg-[var(--color-bg-active)]"
          >
            <Avatar
              src={group?.avatarUrl}
              alt={group?.name ?? "Group"}
              size="sm"
              fallbackType="group"
            />
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-semibold leading-tight text-[var(--color-text-primary)]">
                {group?.name ?? "Loading…"}
              </p>
              {group && (
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {group.members.length} member
                  {group.members.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </button>

          {/* Gear icon */}
          <button
            onClick={() => setShowSettings(true)}
            aria-label="Group settings"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
          >
            <Settings size={18} />
          </button>
        </header>

        {/* ── Message list ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {messages.length === 0 && (
            <p className="py-10 text-center text-sm text-[var(--color-text-muted)]">
              No messages yet. Say something!
            </p>
          )}

          {messages.map((msg) => {
            if (msg.type === "system") {
              return (
                <div
                  key={msg.id}
                  className="my-2 text-center text-xs italic text-[var(--color-text-muted)]"
                >
                  {msg.text}
                </div>
              );
            }
            return (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isOwn={msg.sender === session.did}
              />
            );
          })}

          <div ref={bottomRef} />
        </div>

        {/* ── Input bar ─────────────────────────────────────────────────── */}
        <div className="flex flex-shrink-0 items-end gap-2 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] px-3 py-2">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Message…"
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] px-4 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:ring-2 focus:ring-[var(--color-accent)] focus:outline-none"
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={() => void handleSend()}
            disabled={!inputText.trim() || sending}
            aria-label="Send"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-white transition hover:bg-[var(--color-accent-hover)] disabled:opacity-40"
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>

      {/* Settings modal (renders on top of everything) */}
      {showSettings && group && (
        <GroupSettingsModal
          mode="edit"
          groupId={group.id}
          groupName={group.name}
          groupAvatar={group.avatarUrl}
          currentMemberDids={group.members}
          onClose={handleSettingsClose}
        />
      )}
    </>
  );
}
