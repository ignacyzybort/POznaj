export default function EmptyState({
  emoji = "✦",
  title,
  subtitle,
  action,
}: {
  emoji?: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "48px 24px", textAlign: "center",
      minHeight: 200, gap: 8,
    }}>
      <span style={{ fontSize: 38, lineHeight: 1, opacity: 0.6 }} aria-hidden="true">{emoji}</span>
      <p style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.015em" }}>{title}</p>
      {subtitle && (
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--ink-3)", maxWidth: 260 }}>{subtitle}</p>
      )}
      {action && (
        <button onClick={action.onClick} className="pz-chip" style={{
          marginTop: 8, border: 0, cursor: "pointer", fontWeight: 600,
          fontSize: "var(--text-sm)", minHeight: 44, padding: "0 20px",
          background: "var(--bg-soft)", color: "var(--ink-2)",
          borderRadius: 99,
        }}>
          {action.label}
        </button>
      )}
    </div>
  );
}
