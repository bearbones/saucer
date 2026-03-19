"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  clearSession,
  getSession,
  loginWithPassword,
  type WebSession,
} from "~/lib/auth";
import { AuthContext } from "~/lib/auth-context";
import { createAgent } from "~/lib/bsky-api";

// ── Nav visibility context ────────────────────────────────────────────────────

export const NavVisibilityContext = createContext<(visible: boolean) => void>(
  () => {},
);

export function useSetNavVisible() {
  return useContext(NavVisibilityContext);
}

// ── Bottom navigation tab bar ─────────────────────────────────────────────────

const iconClass = "h-6 w-6";

const TABS: { label: string; icon: React.ReactNode; href: string }[] = [
  {
    label: "Home",
    href: "/feeds",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        {/* UFO dome */}
        <path d="M9 10 C9 7, 15 7, 15 10" />
        {/* Saucer disc */}
        <ellipse cx="12" cy="11" rx="8" ry="2.5" />
        {/* Landing lights */}
        <circle cx="9" cy="11" r="0.5" fill="currentColor" stroke="none" />
        <circle cx="12" cy="11.8" r="0.5" fill="currentColor" stroke="none" />
        <circle cx="15" cy="11" r="0.5" fill="currentColor" stroke="none" />
        {/* Landing legs */}
        <line x1="7" y1="13" x2="5.5" y2="16" />
        <line x1="17" y1="13" x2="18.5" y2="16" />
      </svg>
    ),
  },
  {
    label: "Search",
    href: "/search",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        {/* Small UFO */}
        <path d="M9 5 C9 3.5, 15 3.5, 15 5" />
        <ellipse cx="12" cy="5.5" rx="5" ry="1.5" />
        {/* Tractor beam cone */}
        <line x1="8.5" y1="7" x2="6" y2="20" />
        <line x1="15.5" y1="7" x2="18" y2="20" />
        {/* Beam cross lines */}
        <line x1="7.5" y1="12" x2="16.5" y2="12" />
        <line x1="6.8" y1="16" x2="17.2" y2="16" />
      </svg>
    ),
  },
  {
    label: "Groups",
    href: "/groups",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        {/* Left alien head – balloon/teardrop shape with pointed chin */}
        <path d="M3.3 11 C3.3 8, 9.7 8, 9.7 11 C9.7 13.5, 8 15, 6.5 17 C5 15, 3.3 13.5, 3.3 11Z" />
        <ellipse cx="5.2" cy="10.8" rx="1" ry="1.3" fill="currentColor" stroke="none" />
        <ellipse cx="7.8" cy="10.8" rx="1" ry="1.3" fill="currentColor" stroke="none" />
        {/* Center alien head (in front) – larger, pointed chin */}
        <path d="M8 10 C8 6.5, 16 6.5, 16 10 C16 13, 14 15.5, 12 18 C10 15.5, 8 13, 8 10Z" />
        <ellipse cx="10.3" cy="9.8" rx="1.2" ry="1.5" fill="currentColor" stroke="none" />
        <ellipse cx="13.7" cy="9.8" rx="1.2" ry="1.5" fill="currentColor" stroke="none" />
        {/* Right alien head – balloon/teardrop shape with pointed chin */}
        <path d="M14.3 11 C14.3 8, 20.7 8, 20.7 11 C20.7 13.5, 19 15, 17.5 17 C16 15, 14.3 13.5, 14.3 11Z" />
        <ellipse cx="16.2" cy="10.8" rx="1" ry="1.3" fill="currentColor" stroke="none" />
        <ellipse cx="18.8" cy="10.8" rx="1" ry="1.3" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Alerts",
    href: "/notifications",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    label: "Me",
    href: "/profile",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        {/* Alien head – balloon/teardrop shape tapering to pointed chin */}
        <path d="M6.5 10 C6.5 5, 17.5 5, 17.5 10 C17.5 14, 14.5 17, 12 20 C9.5 17, 6.5 14, 6.5 10Z" />
        {/* Large wrap-around eyes */}
        <ellipse cx="9.5" cy="10" rx="1.8" ry="2.2" fill="currentColor" stroke="none" />
        <ellipse cx="14.5" cy="10" rx="1.8" ry="2.2" fill="currentColor" stroke="none" />
        {/* Small mouth */}
        <line x1="11" y1="14.5" x2="13" y2="14.5" />
      </svg>
    ),
  },
];

function BottomNav({ visible }: { visible: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      className={`pb-safe flex flex-shrink-0 border-t border-gray-800 bg-black transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
              active ? "text-blue-400" : "text-gray-600 hover:text-gray-400"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// ── App layout ────────────────────────────────────────────────────────────────

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<WebSession | null | "loading">(
    "loading",
  );
  const [navVisible, setNavVisible] = useState(true);
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    setSession(getSession());
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setError("");
    try {
      const s = await loginWithPassword(form.identifier, form.password);
      setSession(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
  };

  // Always call useMemo unconditionally (Rules of Hooks).
  // Returns null when not yet authenticated; only used in the provider branch.
  const agent = useMemo(
    () =>
      session && session !== "loading" ? createAgent(session) : null,
    [session],
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (session === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  // ── Login form ────────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 py-12">
        <div className="mb-8 flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt="Saucer"
            className="h-16 w-16 rounded-2xl"
          />
          <h1 className="text-2xl font-bold text-white">Saucer</h1>
          <p className="text-sm text-gray-500">Sign in with your Bluesky account</p>
        </div>

        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-400">
              Handle or Email
            </label>
            <input
              type="text"
              value={form.identifier}
              onChange={(e) =>
                setForm((f) => ({ ...f, identifier: e.target.value }))
              }
              placeholder="you.bsky.social"
              autoComplete="username"
              required
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">
              App Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              placeholder="xxxx-xxxx-xxxx-xxxx"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <p className="mt-1.5 text-xs text-gray-600">
              Create an app password at Settings → Privacy → App Passwords
            </p>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loggingIn}
            className="w-full rounded-xl bg-blue-500 py-3 font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50"
          >
            {loggingIn ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    );
  }

  // ── Authenticated app shell ───────────────────────────────────────────────
  return (
    // agent is guaranteed non-null here because session is a WebSession
    <AuthContext.Provider value={{ session, agent: agent!, logout: handleLogout }}>
      <NavVisibilityContext.Provider value={setNavVisible}>
        <div className="flex h-dvh flex-col bg-black text-white">
          {/* Page content */}
          <main className="min-h-0 flex-1 overflow-hidden">{children}</main>

          {/* Bottom tab bar */}
          <BottomNav visible={navVisible} />
        </div>
      </NavVisibilityContext.Provider>
    </AuthContext.Provider>
  );
}
