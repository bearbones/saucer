"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, Mail, Search } from "lucide-react";

import {
  clearSession,
  getSession,
  loginWithPassword,
  type WebSession,
} from "~/lib/auth";
import { AuthContext } from "~/lib/auth-context";
import { createAgent } from "~/lib/bsky-api";
import { ThemeProvider } from "~/lib/theme";

// ── Nav visibility context ────────────────────────────────────────────────────

export const NavVisibilityContext = createContext<(visible: boolean) => void>(
  () => {},
);

export function useSetNavVisible() {
  return useContext(NavVisibilityContext);
}

// ── Bottom navigation tab bar ─────────────────────────────────────────────────

const TABS = [
  { href: "/feeds", icon: Home },
  { href: "/search", icon: Search },
  { href: "/notifications", icon: Bell },
  { href: "/groups", icon: Mail },
] as const;

function BottomNav({ visible }: { visible: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      className={`pb-safe flex flex-shrink-0 border-t border-[var(--nav-border)] bg-[var(--nav-bg)] transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 items-center justify-center py-3 transition-colors ${
              active ? "nav-item-active" : ""
            }`}
            style={{
              color: active
                ? "var(--nav-icon-active)"
                : "var(--nav-icon-inactive)",
            }}
          >
            <Icon
              size={24}
              fill={active ? "currentColor" : "none"}
              stroke="currentColor"
            />
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
      <div className="flex h-screen items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
      </div>
    );
  }

  // ── Login form ────────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="login-bg flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg-primary)] px-6 py-12">
        <div className="animate-fade-in w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon-192.png"
              alt="Saucer"
              className="h-16 w-16 rounded-2xl"
            />
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Saucer
            </h1>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              Sign in with your Bluesky account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-[var(--color-text-secondary)]">
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
                className="w-full rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-bg-tertiary)] px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-[var(--color-text-secondary)]">
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
                className="w-full rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-bg-tertiary)] px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
              <p className="mt-1.5 text-xs text-[var(--color-text-tertiary)]">
                Create an app password at Settings &rarr; Privacy &rarr; App
                Passwords
              </p>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full rounded-xl bg-[var(--color-accent)] py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {loggingIn ? "Signing in\u2026" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Authenticated app shell ───────────────────────────────────────────────
  return (
    // agent is guaranteed non-null here because session is a WebSession
    <ThemeProvider>
      <AuthContext.Provider
        value={{ session, agent: agent!, logout: handleLogout }}
      >
        <NavVisibilityContext.Provider value={setNavVisible}>
          <div className="flex h-dvh flex-col bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
            {/* Page content */}
            <main className="min-h-0 flex-1 overflow-hidden">{children}</main>

            {/* Bottom tab bar */}
            <BottomNav visible={navVisible} />
          </div>
        </NavVisibilityContext.Provider>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}
