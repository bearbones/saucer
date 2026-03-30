import { User, Users } from "lucide-react";

const GRADIENT_PAIRS = [
  ["#6366f1", "#8b5cf6"], // indigo -> violet
  ["#3b82f6", "#06b6d4"], // blue -> cyan
  ["#14b8a6", "#22c55e"], // teal -> green
  ["#f59e0b", "#ef4444"], // amber -> red
  ["#ec4899", "#a855f7"], // pink -> purple
  ["#06b6d4", "#3b82f6"], // cyan -> blue
  ["#8b5cf6", "#ec4899"], // violet -> pink
  ["#22c55e", "#14b8a6"], // green -> teal
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const SIZE_MAP = {
  xs: "h-7 w-7",
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
  "2xl": "h-20 w-20",
} as const;

const ICON_SIZE_MAP = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 28,
  "2xl": 36,
} as const;

type AvatarSize = keyof typeof SIZE_MAP;

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: AvatarSize;
  fallbackType?: "user" | "group";
  className?: string;
}

export function Avatar({
  src,
  alt,
  size = "md",
  fallbackType = "user",
  className = "",
}: AvatarProps) {
  const sizeClass = SIZE_MAP[size];
  const iconSize = ICON_SIZE_MAP[size];

  if (src) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={src}
        alt={alt}
        className={`${sizeClass} rounded-full object-cover ${className}`}
      />
    );
  }

  const hash = hashString(alt || "default");
  const pair = GRADIENT_PAIRS[hash % GRADIENT_PAIRS.length]!;
  const Icon = fallbackType === "group" ? Users : User;

  return (
    <div
      className={`${sizeClass} flex flex-shrink-0 items-center justify-center rounded-full ${className}`}
      style={{
        background: `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`,
      }}
    >
      <Icon size={iconSize} className="text-white/50" strokeWidth={1.5} />
    </div>
  );
}
