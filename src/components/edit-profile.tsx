"use client";

import { useState } from "react";
import { districts } from "@/lib/data";

export default function EditProfile({
  user,
  onClose,
  onSaved,
}: {
  user: { name: string | null; handle: string | null; bio: string | null; district: string | null };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(user.name ?? "");
  const [handle, setHandle] = useState(user.handle ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [district, setDistrict] = useState(user.district ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          handle: handle.trim() || undefined,
          bio: bio.trim() || undefined,
          district: district || undefined,
        }),
      });
      onSaved();
      onClose();
    } catch {}
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(20,19,15,0.5)" }}>
      <div className="rounded-3xl p-6 mx-4 max-w-sm w-full" style={{ background: "var(--bg-elev)", maxHeight: "80%", overflow: "auto" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="pz-h" style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>Edytuj profil</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 99, border: 0, background: "var(--bg-soft)", color: "var(--ink)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
              Imię i nazwisko
            </label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", height: 44, padding: "0 14px", borderRadius: 14, border: "0.5px solid var(--line)", outline: "none", fontSize: 14, background: "var(--bg-soft)", color: "var(--ink)" }} />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
              Nazwa użytkownika
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14, color: "var(--ink-3)" }}>@</span>
              <input value={handle} onChange={(e) => setHandle(e.target.value.replace(/\s/g, ""))}
                style={{ flex: 1, height: 44, padding: "0 14px", borderRadius: 14, border: "0.5px solid var(--line)", outline: "none", fontSize: 14, background: "var(--bg-soft)", color: "var(--ink)" }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
              Dzielnica
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {districts.map((d) => {
                const active = district === d.value;
                return (
                  <button key={d.value} onClick={() => setDistrict(active ? "" : d.value)}
                    className="pz-chip" data-active={active ? "true" : undefined}
                    style={{ fontSize: 12, padding: "5px 10px" }}>
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
              O mnie
            </label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 14, border: "0.5px solid var(--line)", outline: "none", fontSize: 14, background: "var(--bg-soft)", color: "var(--ink)", resize: "none" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} className="pz-btn ghost" style={{ flex: 1 }}>Anuluj</button>
          <button onClick={save} disabled={saving} className="pz-btn primary" style={{ flex: 1 }}>
            {saving ? "Zapisywanie..." : "Zapisz"}
          </button>
        </div>
      </div>
    </div>
  );
}
