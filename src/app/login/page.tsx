"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackIcon } from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [sending, setSending] = useState(false);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {/* Back button */}
      <div style={{ position: "absolute", top: "calc(54px + var(--safe-t))", left: 14, zIndex: 10 }}>
        <button onClick={() => router.back()} aria-label="Wróć" style={{
          width: 44, height: 44, borderRadius: 99, border: 0,
          background: "var(--bg-elev)", color: "var(--ink)", cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          boxShadow: "var(--shadow-sm)",
        }}>
          <BackIcon size={20} />
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px", maxWidth: 400, margin: "0 auto", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 8px", color: "var(--ink)" }}>
            poznaj<span style={{ color: "var(--sage)" }}>.</span>
          </h1>
          <p style={{ fontSize: 17, color: "var(--ink-3)", margin: 0 }}>
            Co dziś w Poznaniu.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            style={{
              width: "100%", height: 48, borderRadius: 16, border: 0, cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
              fontSize: 14, fontWeight: 700,
              background: "var(--bg-elev)", color: "var(--ink)", boxShadow: "var(--shadow-sm)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Kontynuuj z Google
          </button>

          <button
            onClick={() => signIn("apple", { callbackUrl: "/" })}
            style={{
              width: "100%", height: 48, borderRadius: 16, border: 0, cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
              fontSize: 14, fontWeight: 700,
              background: "var(--bg-elev)", color: "var(--ink)", boxShadow: "var(--shadow-sm)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            Kontynuuj z Apple
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
            <div style={{ flex: 1, height: "0.5px", background: "var(--line)" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-4)" }}>LUB</span>
            <div style={{ flex: 1, height: "0.5px", background: "var(--line)" }} />
          </div>

          {emailSent ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <span style={{ fontSize: 28 }}>📧</span>
              <p style={{ fontSize: 13, fontWeight: 600, marginTop: 8, color: "var(--ink-2)" }}>Sprawdź skrzynkę</p>
              <p style={{ fontSize: 12, marginTop: 4, color: "var(--ink-3)" }}>Wysłaliśmy magiczny link na {email}</p>
              <button onClick={() => setEmailSent(false)} style={{ fontSize: 12, textDecoration: "underline", marginTop: 12, cursor: "pointer", border: 0, background: "none", color: "var(--ink-4)" }}>Inny adres</button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email && !sending) {
                  setSending(true);
                  signIn("resend", { email, callbackUrl: "/" });
                  setEmailSent(true);
                  setSending(false);
                }
              }}
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
            >
              <input
                type="email"
                placeholder="Twój email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%", height: 48, padding: "0 16px", borderRadius: 16, border: 0, outline: "none",
                  fontSize: 14, fontWeight: 500,
                  background: "var(--bg-soft)", color: "var(--ink)",
                }}
              />
              <button
                type="submit"
                disabled={!email || sending}
                style={{
                  width: "100%", height: 48, borderRadius: 16, border: 0, cursor: !email || sending ? "default" : "pointer",
                  fontSize: 14, fontWeight: 700,
                  background: "var(--ink)", color: "var(--bg)",
                  opacity: !email || sending ? 0.4 : 1,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {sending ? <span className="pz-spinner" /> : null}
                Wyślij magiczny link
              </button>
            </form>
          )}
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "0 24px 32px" }}>
        <p style={{ fontSize: 12, color: "var(--ink-4)", margin: 0 }}>
          Szybkie logowanie, żadnych haseł.
        </p>
      </div>
    </div>
  );
}
