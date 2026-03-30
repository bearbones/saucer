/* eslint-disable-next-line */
import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

import baseConfig from "@graysky/tailwind-config";

export default {
  content: ["./src/**/*.tsx"],
  presets: [baseConfig],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", ...defaultTheme.fontFamily.sans],
        display: ["var(--font-display)", "var(--font-inter)", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        surface: {
          primary: "var(--color-bg-primary)",
          secondary: "var(--color-bg-secondary)",
          tertiary: "var(--color-bg-tertiary)",
          elevated: "var(--color-bg-elevated)",
          hover: "var(--color-bg-hover)",
          active: "var(--color-bg-active)",
        },
        "t-border": {
          primary: "var(--color-border-primary)",
          secondary: "var(--color-border-secondary)",
        },
        content: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          tertiary: "var(--color-text-tertiary)",
          muted: "var(--color-text-muted)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
          muted: "var(--color-accent-muted)",
          text: "var(--color-accent-text)",
        },
        danger: {
          DEFAULT: "var(--color-danger)",
          bg: "var(--color-danger-bg)",
        },
        like: {
          DEFAULT: "var(--color-like)",
          bg: "var(--color-like-bg)",
        },
        repost: {
          DEFAULT: "var(--color-repost)",
          bg: "var(--color-repost-bg)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        elevated: "var(--shadow-elevated)",
        glow: "var(--shadow-glow)",
      },
    },
  },
} satisfies Config;
