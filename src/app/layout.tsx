import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { auth } from "@/lib/auth";
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="pl" className="h-full">
      <head>
        <meta name="theme-color" content="#1A1B20" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180.png" />

      </head>
      <body className="h-full overflow-hidden">
        <a href="#main-content" className="pz-skip-link">Przejdź do treści</a>
        <div className="pz-stage">
          <ThemeProvider>
            <AuthProvider session={session}>
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
