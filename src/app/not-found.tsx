import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg)", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
      <h1 className="pz-h" style={{ margin: "0 0 8px", fontSize: "var(--text-xl)", fontWeight: 700, letterSpacing: "-0.025em", color: "var(--ink)" }}>
        Nie znaleziono
      </h1>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-3)", margin: "0 0 20px", maxWidth: 300 }}>
        Ta strona nie istnieje lub została przeniesiona
      </p>
      <Link href="/" className="pz-btn primary" style={{ height: 44, fontSize: 13, padding: "0 24px", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
        Wróć do strony głównej
      </Link>
    </div>
  );
}
