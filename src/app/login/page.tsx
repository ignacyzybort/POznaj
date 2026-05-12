"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <div className="flex-1 flex flex-col justify-center px-6 max-w-sm mx-auto w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight mb-2" style={{ color: "var(--ink)" }}>
            poznaj<span style={{ color: "var(--sage)" }}>.</span>
          </h1>
          <p className="text-lg" style={{ color: "var(--ink-3)" }}>
            Co dziś w Poznaniu.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full h-12 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold border-0 cursor-pointer transition-all active:scale-[0.98]"
            style={{ background: "var(--bg-elev)", color: "var(--ink)", border: "0.5px solid var(--line)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Kontynuuj z Google
          </button>

          <button
            onClick={() => signIn("apple", { callbackUrl: "/" })}
            className="w-full h-12 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold border-0 cursor-pointer transition-all active:scale-[0.98]"
            style={{ background: "var(--bg-elev)", color: "var(--ink)", border: "0.5px solid var(--line)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            Kontynuuj z Apple
          </button>

          <div className="flex items-center gap-3 py-2">
            <div className="flex-1" style={{ height: "0.5px", background: "var(--line)" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--ink-4)" }}>LUB</span>
            <div className="flex-1" style={{ height: "0.5px", background: "var(--line)" }} />
          </div>

          {emailSent ? (
            <div className="text-center py-4">
              <span className="text-3xl">📧</span>
              <p className="text-sm font-medium mt-2" style={{ color: "var(--ink-2)" }}>Sprawdź skrzynkę</p>
              <p className="text-xs mt-1" style={{ color: "var(--ink-3)" }}>Wysłaliśmy magiczny link na {email}</p>
              <button onClick={() => setEmailSent(false)} className="text-xs underline mt-3 cursor-pointer" style={{ color: "var(--ink-4)" }}>Inny adres</button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email) {
                  signIn("resend", { email, callbackUrl: "/" });
                  setEmailSent(true);
                }
              }}
              className="space-y-2"
            >
              <input
                type="email"
                placeholder="Twój email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl text-sm font-medium border-0 outline-none"
                style={{ background: "var(--bg-soft)", color: "var(--ink)" }}
              />
              <button
                type="submit"
                disabled={!email}
                className="w-full h-12 rounded-2xl text-sm font-bold border-0 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-40"
                style={{ background: "var(--ink)", color: "var(--bg)" }}
              >
                Wyślij magiczny link
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="text-center pb-8">
        <p className="text-xs" style={{ color: "var(--ink-4)" }}>
          Bez konta, bez emaila, bez wciskania.
        </p>
      </div>
    </div>
  );
}
