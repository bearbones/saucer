"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, MessageSquare, Plus } from "lucide-react";

import { Avatar } from "~/components/avatar";
import { GroupSettingsModal } from "~/components/group-settings-modal";
import { useAuth } from "~/lib/auth-context";
import { subscribeToGroups, type Group } from "~/lib/groups";

export default function GroupsPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    return subscribeToGroups(session.did, setGroups);
  }, [session.did]);

  const sorted = groups.slice().sort((a, b) => {
    const aTime =
      a.lastMessageAt?.toMillis() ?? a.createdAt?.toMillis() ?? 0;
    const bTime =
      b.lastMessageAt?.toMillis() ?? b.createdAt?.toMillis() ?? 0;
    return bTime - aTime;
  });

  return (
    <>
      <div className="relative flex h-full flex-col">
        {/* Group list */}
        <div className="flex-1 overflow-y-auto">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--color-text-muted)]">
              <MessageSquare size={48} className="mb-3" />
              <p className="text-sm">No groups yet.</p>
              <p className="text-sm">
                Tap{" "}
                <span className="font-semibold text-[var(--color-accent)]">+</span> to
                create one.
              </p>
            </div>
          ) : (
            sorted.map((group) => (
              <GroupRow
                key={group.id}
                group={group}
                onClick={() => router.push(`/groups/${group.id}`)}
              />
            ))
          )}
        </div>

        {/* Floating action button */}
        <button
          onClick={() => setShowCreate(true)}
          aria-label="Create group"
          className="absolute bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-[var(--shadow-elevated)] transition hover:bg-[var(--color-accent-hover)] active:scale-95"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Create group modal */}
      {showCreate && (
        <GroupSettingsModal
          mode="create"
          onClose={() => setShowCreate(false)}
        />
      )}
    </>
  );
}

function GroupRow({
  group,
  onClick,
}: {
  group: Group;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-[var(--color-border-primary)] px-4 py-3 text-left transition hover:bg-[var(--color-bg-hover)] active:bg-[var(--color-bg-active)]"
    >
      {/* Avatar */}
      <Avatar src={group.avatarUrl} alt={group.name} size="lg" fallbackType="group" />

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-[var(--color-text-primary)]">{group.name}</p>
        {group.lastMessage && (
          <p className="truncate text-sm text-[var(--color-text-muted)]">
            {group.lastMessage}
          </p>
        )}
      </div>

      <ChevronRight size={16} className="flex-shrink-0 text-[var(--color-text-muted)]" />
    </button>
  );
}
