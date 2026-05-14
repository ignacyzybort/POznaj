export type Budget = "free" | "cheap" | "student" | null;

export default function BudgetChips({
  active, onToggle,
}: {
  active: Budget;
  onToggle: (b: Budget) => void;
}) {
  const opts: { id: Exclude<Budget, null>; label: string }[] = [
    { id: "free", label: "Darmowe" },
    { id: "cheap", label: "Do 45 zł" },
    { id: "student", label: "Studencka" },
  ];
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {opts.map((o) => (
        <button key={o.id} className="pz-chip" aria-pressed={active === o.id}
                data-active={active === o.id ? "true" : undefined}
                onClick={() => onToggle(active === o.id ? null : o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
