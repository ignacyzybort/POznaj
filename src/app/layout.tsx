import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import AuthProvider from "@/components/auth-provider";
import ThemeProvider from "@/components/theme-provider";
import TabBar from "@/components/tab-bar";
import "./globals.css";

export const metadata: Metadata = {
  title: "POznaj — Co dziś w Poznaniu",
  description: "Najciekawsze wydarzenia w Poznaniu",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "POznaj" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className="h-full">
      <head>
        <meta name="theme-color" content="#FDFCF8" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="h-full overflow-hidden">
        <div className="pz-stage">
          <ThemeProvider>
            <AuthProvider>
              {children}
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
