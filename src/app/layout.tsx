import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "POznaj — Wydarzenia w Poznaniu",
  description:
    "Najciekawsze wydarzenia w Poznaniu — filtry po dzielnicy, kategorii i nastroju",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "POznaj",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#fafafa" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-amber-100/50">
          <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight bg-gradient-to-br from-amber-500 to-orange-600 bg-clip-text text-transparent">
                poznaj
              </span>
            </a>
            <nav className="flex items-center gap-1">
              <a
                href="/"
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
              >
                🎯 Wydarzenia
              </a>
              <a
                href="/settings"
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
              >
                ⚙️ Preferencje
              </a>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
