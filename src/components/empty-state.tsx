export default function EmptyState({
  title = "Hmm, pustki...",
  subtitle = "Albo filtry są zbyt wąskie, albo Poznań dziś odpoczywa. Rozluźnij kryteria!",
  action,
}: {
  title?: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "56px 24px", textAlign: "center",
      minHeight: 240, gap: 10,
    }}>
      <span className="pz-display" aria-hidden="true" style={{
        fontSize: 72, lineHeight: 0.7, marginBottom: 14, color: "var(--ink-4)",
      }}>*</span>
      <p style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.015em" }}>{title}</p>
      {subtitle && (
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--ink-3)", maxWidth: 280, lineHeight: 1.5 }}>{subtitle}</p>
      )}
      {action && (
        <button onClick={action.onClick} className="pz-chip" style={{
          marginTop: 12, border: 0, cursor: "pointer", fontWeight: 600,
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
