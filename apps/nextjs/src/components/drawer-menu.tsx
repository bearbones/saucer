"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, Settings as SettingsIcon, User } from "lucide-react";

import { Avatar } from "~/components/avatar";
import { useAuth } from "~/lib/auth-context";

export function DrawerMenu() {
  const { session, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  // Trigger slide-in after mount
  useEffect(() => {
    if (open) {
      // Delay one frame so the initial off-screen state renders first
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
    } else {
      setVisible(false);
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  // Lock body scroll when open (position:fixed works reliably on iOS Safari)
  useEffect(() => {
    if (open) {
      document.body.style.position = "fixed";
      document.body.style.inset = "0";
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.position = "";
      document.body.style.inset = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.position = "";
      document.body.style.inset = "";
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Trigger — user avatar */}
      <button
        onClick={() => setOpen(true)}
        className="flex-shrink-0"
        aria-label="Open menu"
      >
        <Avatar src={session.avatar} alt={session.handle} size="sm" />
      </button>

      {/* Overlay + Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div
            className={`relative z-10 flex h-full w-[280px] flex-col bg-[var(--color-bg-secondary)] shadow-xl transition-transform duration-300 ${visible ? "translate-x-0" : "-translate-x-full"}`}
          >
            {/* User info */}
            <div className="border-b border-[var(--color-border-primary)] p-5">
              <div className="mb-3">
                <Avatar
                  src={session.avatar}
                  alt={session.handle}
                  size="xl"
                />
              </div>
              <p className="truncate text-base font-bold text-[var(--color-text-primary)]">
                {session.displayName ?? session.handle}
              </p>
              <p className="truncate text-sm text-[var(--color-text-secondary)]">
                @{session.handle}
              </p>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col py-2">
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-5 py-3 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
              >
                <User size={18} />
                Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-5 py-3 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
              >
                <SettingsIcon size={18} />
                Settings
              </Link>
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Sign out */}
            <div className="border-t border-[var(--color-border-primary)] p-4">
              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-400 transition hover:bg-red-950"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
