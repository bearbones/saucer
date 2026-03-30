"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Rocket, Sparkles } from "lucide-react";

import { useTheme, type Theme } from "~/lib/theme";

const THEMES: {
  id: Theme;
  name: string;
  description: string;
  icon: React.ReactNode;
  preview: {
    bg: string;
    accent: string;
    border: string;
    text: string;
    mutedText: string;
  };
}[] = [
  {
    id: "default",
    name: "Default",
    description: "Clean dark theme with blue accents",
    icon: <Sparkles size={20} />,
    preview: {
      bg: "#000000",
      accent: "#3b82f6",
      border: "#1f2937",
      text: "#ffffff",
      mutedText: "#6b7280",
    },
  },
  {
    id: "space-aliens",
    name: "Space Aliens",
    description: "Retro sci-fi with alien green glow",
    icon: <Rocket size={20} />,
    preview: {
      bg: "#050a12",
      accent: "#22c55e",
      border: "#1a3a2a",
      text: "#d4f0d4",
      mutedText: "#5a8a5a",
    },
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-shrink-0 items-center gap-3 border-b border-[var(--color-border-primary)] px-4 py-3">
        <button
          onClick={() => router.back()}
          className="flex-shrink-0 text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* ── Appearance ──────────────────────────────────────────────── */}
        <section className="px-4 pt-6 pb-4">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Appearance
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {THEMES.map((t) => {
              const selected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`relative overflow-hidden rounded-2xl border-2 p-0 text-left transition ${
                    selected
                      ? "border-[var(--color-accent)] shadow-glow"
                      : "border-[var(--color-border-primary)] hover:border-[var(--color-border-secondary)]"
                  }`}
                >
                  {/* Theme preview card */}
                  <div
                    className="p-3"
                    style={{ backgroundColor: t.preview.bg }}
                  >
                    {/* Mini preview of the UI */}
                    <div className="mb-2 flex items-center gap-2">
                      <div
                        className="h-6 w-6 rounded-full"
                        style={{ backgroundColor: t.preview.accent }}
                      />
                      <div className="flex-1">
                        <div
                          className="mb-1 h-2 w-3/4 rounded-full"
                          style={{ backgroundColor: t.preview.text, opacity: 0.6 }}
                        />
                        <div
                          className="h-1.5 w-1/2 rounded-full"
                          style={{ backgroundColor: t.preview.mutedText, opacity: 0.5 }}
                        />
                      </div>
                    </div>
                    <div
                      className="mb-1.5 h-1.5 w-full rounded-full"
                      style={{ backgroundColor: t.preview.text, opacity: 0.3 }}
                    />
                    <div
                      className="mb-1.5 h-1.5 w-5/6 rounded-full"
                      style={{ backgroundColor: t.preview.text, opacity: 0.3 }}
                    />
                    <div
                      className="h-1.5 w-2/3 rounded-full"
                      style={{ backgroundColor: t.preview.text, opacity: 0.3 }}
                    />
                    {/* Mini nav bar */}
                    <div
                      className="mt-3 flex justify-around rounded-lg py-1.5"
                      style={{ borderTop: `1px solid ${t.preview.border}` }}
                    >
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: i === 0 ? t.preview.accent : t.preview.mutedText,
                            opacity: i === 0 ? 1 : 0.5,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Label area */}
                  <div className="flex items-center gap-2 border-t border-[var(--color-border-primary)] px-3 py-2.5">
                    <span className="text-[var(--color-text-secondary)]">
                      {t.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {t.name}
                      </p>
                    </div>
                    {selected && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)]">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── About ───────────────────────────────────────────────────── */}
        <section className="border-t border-[var(--color-border-primary)] px-4 pt-6 pb-8">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            About
          </h2>
          <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
            <p>
              <span className="text-[var(--color-text-primary)] font-medium">Saucer</span>{" "}
              <span className="text-[var(--color-text-muted)]">v1.0</span>
            </p>
            <p className="text-[var(--color-text-muted)]">
              A Bluesky client with group chats.
            </p>
            <p className="text-[var(--color-text-muted)]">
              Powered by AT Protocol
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
