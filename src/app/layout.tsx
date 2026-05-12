import type { Metadata } from "next";
import AuthProvider from "@/components/auth-provider";
import TabBar from "@/components/tab-bar";
import "./globals.css";

export const metadata: Metadata = {
  title: "POznaj — Co dziś w Poznaniu",
  description: "Najciekawsze wydarzenia w Poznaniu — filtry po dzielnicy, kategorii i nastroju",
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
    <html lang="pl" className="h-full antialiased">
      <head>
        <meta name="theme-color" content="#FDFCF8" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col pb-20">
        <AuthProvider>
          <main className="flex-1">{children}</main>
          <TabBar />
        </AuthProvider>
      </body>
    </html>
  );
}
