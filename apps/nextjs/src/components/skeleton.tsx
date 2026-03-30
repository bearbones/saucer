import type { ComponentProps } from "react";

/* ------------------------------------------------------------------ */
/*  Base primitive                                                     */
/* ------------------------------------------------------------------ */

export function SkeletonBox({
  className = "",
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={`skeleton-shimmer rounded-md ${className}`}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Post card skeleton                                                 */
/* ------------------------------------------------------------------ */

export function SkeletonPostCard({
  showImage = false,
}: {
  showImage?: boolean;
}) {
  return (
    <div className="flex gap-3 border-b border-[var(--color-border-primary)] px-4 py-3">
      {/* Avatar */}
      <SkeletonBox className="h-10 w-10 shrink-0 rounded-full" />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {/* Name / handle */}
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-3.5 w-24" />
          <SkeletonBox className="h-3 w-20" />
        </div>

        {/* Post text lines */}
        <div className="flex flex-col gap-1.5">
          <SkeletonBox className="h-3 w-full" />
          <SkeletonBox className="h-3 w-[85%]" />
          <SkeletonBox className="h-3 w-[60%]" />
        </div>

        {/* Optional image area */}
        {showImage && (
          <SkeletonBox className="mt-1 h-48 w-full rounded-lg" />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Notification row skeleton                                          */
/* ------------------------------------------------------------------ */

export function SkeletonNotifRow() {
  return (
    <div className="flex items-start gap-3 border-b border-[var(--color-border-primary)] px-4 py-3">
      {/* Reason icon */}
      <SkeletonBox className="h-10 w-10 shrink-0 rounded-full" />

      {/* Avatar */}
      <SkeletonBox className="h-7 w-7 shrink-0 rounded-full" />

      {/* Text lines */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <SkeletonBox className="h-3.5 w-[70%]" />
        <SkeletonBox className="h-3 w-[45%]" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feed list item skeleton                                            */
/* ------------------------------------------------------------------ */

export function SkeletonFeedRow() {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--color-border-primary)] px-4 py-3">
      {/* Feed avatar */}
      <SkeletonBox className="h-10 w-10 shrink-0 rounded-lg" />

      {/* Text lines */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <SkeletonBox className="h-3.5 w-[55%]" />
        <SkeletonBox className="h-3 w-[35%]" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Profile header skeleton                                            */
/* ------------------------------------------------------------------ */

export function SkeletonProfile() {
  return (
    <div className="flex flex-col">
      {/* Banner */}
      <SkeletonBox className="h-28 w-full rounded-none" />

      {/* Avatar overlapping banner */}
      <div className="relative px-4">
        <SkeletonBox className="-mt-10 h-20 w-20 rounded-full ring-4 ring-[var(--color-bg-primary)]" />
      </div>

      <div className="flex flex-col gap-2 px-4 pt-3">
        {/* Name */}
        <SkeletonBox className="h-5 w-36" />
        {/* Handle */}
        <SkeletonBox className="h-3.5 w-28" />
        {/* Bio */}
        <SkeletonBox className="mt-1 h-3 w-[70%]" />

        {/* Stats */}
        <div className="mt-2 flex items-center gap-4">
          <SkeletonBox className="h-3 w-16" />
          <SkeletonBox className="h-3 w-16" />
          <SkeletonBox className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}
