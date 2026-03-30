import { Inter, Orbitron } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "~/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-orbitron",
});

export const metadata = {
  title: "Saucer - a Bluesky client",
  description: "A Bluesky client with group chats.",
  metadataBase: new URL("https://ayylmao.app"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent" as const,
    title: "Saucer",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: "Saucer - a Bluesky client",
    description: "A Bluesky client with group chats.",
    type: "website",
    locale: "en_GB",
    url: "https://ayylmao.app",
    siteName: "Saucer",
  },
};

export const viewport = {
  colorScheme: "dark",
  themeColor: "#000000",
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable}`}>
      <head>
        {/* Prevent flash of wrong theme on load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('saucer-theme');if(t&&t!=='default'){document.documentElement.dataset.theme=t}}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
