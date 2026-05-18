import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import AuthProvider from "@/components/auth-provider";
import ThemeProvider from "@/components/theme-provider";
import TabBar from "@/components/tab-bar";
import PageTransition from "@/components/page-transition";
import OnboardingGate from "@/components/onboarding-gate";
import "./globals.css";

export const metadata: Metadata = {
  title: "POznaj — Nudisz się? Nie dziś.",
  description: "Wydarzenia w Poznaniu, które warto przeżyć. Nie śmietnik — kuratorowane.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "POznaj" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className="h-full">
      <head>
        <meta name="theme-color" content="#FDFCF8" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1A1B20" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />

      </head>
      <body className="h-full overflow-hidden">
        <a href="#main-content" className="pz-skip-link">Przejdź do treści</a>
        <div className="pz-stage">
          <ThemeProvider>
            <AuthProvider>
              <OnboardingGate />
              <PageTransition><div id="main-content" role="main">{children}</div></PageTransition>
              <TabBar />
              <Analytics />
              <SpeedInsights />
            </AuthProvider>
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
