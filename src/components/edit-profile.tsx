"use client";

import { useState, useRef, useEffect } from "react";
import { districts } from "@/lib/data";
import CropModal from "@/components/crop-modal";
import { useEscape } from "@/hooks/use-escape";

export default function EditProfile({
  user,
  onClose,
  onSaved,
}: {
  user: { name: string | null; handle: string | null; bio: string | null; district: string | null; image: string | null; coverImage: string | null };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(user.name ?? "");
  const [handle, setHandle] = useState(user.handle ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [district, setDistrict] = useState(user.district ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.image);
  const [coverPreview, setCoverPreview] = useState<string | null>(user.coverImage);
  const [saving, setSaving] = useState(false);
  useEscape(onClose);
  const [uploading, setUploading] = useState<"avatar" | "cover" | null>(null);
  const [cropTarget, setCropTarget] = useState<"avatar" | "cover" | null>(null);
  const [cropFile, setCropFile] = useState<{ url: string; file: File; type: "avatar" | "cover" } | null>(null);
  const [exiting, setExiting] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const close = () => {
    setExiting(true);
    setTimeout(onClose, 200);
  };

  const upload = async (blob: Blob, type: "avatar" | "cover") => {
    setUploading(type);
    try {
      const form = new FormData();
      form.append("file", blob, `${type}.jpg`);
      form.append("type", type);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          if (type === "avatar") setAvatarPreview(data.url);
          else setCoverPreview(data.url);
          onSaved();
          return;
        }
      }
      const errData = await res.json().catch(() => ({ error: "Unknown error" }));
      console.error("Upload failed:", res.status, errData);
      alert(errData.error || `Błąd przesyłania (${res.status})`);
    } catch (e) {
      console.error("Upload error:", e);
      alert(`Błąd: ${e instanceof Error ? e.message : "nieznany błąd"}`);
    } finally {
      setUploading(null);
    }
  };

  const selectFile = (file: File, type: "avatar" | "cover") => {
    const url = URL.createObjectURL(file);
    setCropFile({ url, file, type });
    setCropTarget(type);
  };

  const handleCrop = (blob: Blob) => {
    if (cropTarget) upload(blob, cropTarget);
    setCropFile(null);
    setCropTarget(null);
  };

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
      close();
    } catch {}
    setSaving(false);
  };

  return (
    <>
      <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center" style={{
        background: "rgba(20,19,15,0.5)",
        animation: exiting ? "pz-fade-out 0.2s ease both" : undefined,
      }}>
        <div className="rounded-3xl p-6 mx-4 max-w-sm w-full" style={{ background: "var(--bg-elev)", maxHeight: "85%", overflowY: "auto" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="pz-h" style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>Edytuj profil</h2>
            <button onClick={close} style={{ width: 44, height: 44, borderRadius: 99, border: 0, background: "var(--bg-soft)", color: "var(--ink)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✕</button>
          </div>

          {/* Avatar upload */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>Zdjęcie profilowe</label>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: 99, overflow: "hidden", background: "var(--bg-soft)", flexShrink: 0 }}>
                {avatarPreview && <img src={avatarPreview} alt="" className="w-full h-full object-cover" />}
              </div>
              <button onClick={() => avatarRef.current?.click()} disabled={uploading === "avatar"}
                style={{ border: 0, padding: "8px 16px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: uploading === "avatar" ? "default" : "pointer", background: "var(--bg-soft)", color: "var(--ink)", opacity: uploading === "avatar" ? 0.5 : 1 }}>
                {uploading === "avatar" ? "Przesyłanie..." : "📷 Zmień"}
              </button>
              <input ref={avatarRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) selectFile(f, "avatar"); }} />
            </div>
          </div>

          {/* Cover upload */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>Zdjęcie w tle</label>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 80, height: 48, borderRadius: 12, overflow: "hidden", background: "var(--bg-soft)", flexShrink: 0 }}>
                {coverPreview && <img src={coverPreview} alt="" className="w-full h-full object-cover" />}
              </div>
              <button onClick={() => coverRef.current?.click()} disabled={uploading === "cover"}
                style={{ border: 0, padding: "8px 16px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: uploading === "cover" ? "default" : "pointer", background: "var(--bg-soft)", color: "var(--ink)", opacity: uploading === "cover" ? 0.5 : 1 }}>
                {uploading === "cover" ? "Przesyłanie..." : "🌅 Zmień"}
              </button>
              <input ref={coverRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) selectFile(f, "cover"); }} />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="edit-name" style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Imię</label>
              <input id="edit-name" value={name} onChange={(e) => setName(e.target.value)}
                style={{ width: "100%", height: 44, padding: "0 14px", borderRadius: 14, border: "0.5px solid var(--line)", outline: "none", fontSize: 14, background: "var(--bg-soft)", color: "var(--ink)" }} />
            </div>
            <div>
              <label htmlFor="edit-handle" style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Nazwa użytkownika</label>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, color: "var(--ink-3)" }}>@</span>
                <input id="edit-handle" value={handle} onChange={(e) => setHandle(e.target.value.replace(/\s/g, ""))}
                  style={{ flex: 1, height: 44, padding: "0 14px", borderRadius: 14, border: "0.5px solid var(--line)", outline: "none", fontSize: 14, background: "var(--bg-soft)", color: "var(--ink)" }} />
              </div>
            </div>
            <div>
              <label htmlFor="edit-district" style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Dzielnica</label>
              <input id="edit-district" type="hidden" value={district} readOnly />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {districts.map((d) => {
                  const active = district === d.value;
                  return (
                    <button key={d.value} onClick={() => setDistrict(active ? "" : d.value)}
                      className="pz-chip" data-active={active ? "true" : undefined}
                      style={{ fontSize: 12, padding: "5px 10px" }}>{d.label}</button>
                  );
                })}
              </div>
            </div>
            <div>
              <label htmlFor="edit-bio" style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>O mnie</label>
              <textarea id="edit-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 14, border: "0.5px solid var(--line)", outline: "none", fontSize: 14, background: "var(--bg-soft)", color: "var(--ink)", resize: "none" }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={close} className="pz-btn ghost" style={{ flex: 1 }}>Anuluj</button>
            <button onClick={save} disabled={saving} className="pz-btn primary" style={{ flex: 1 }}>{saving ? "Zapisywanie..." : "Zapisz"}</button>
          </div>
        </div>
      </div>

      {/* Crop modal */}
      {cropFile && (
        <CropModal
          imageUrl={cropFile.url}
          aspect={cropFile.type === "avatar" ? 1 : 3}
          onCrop={handleCrop}
          onClose={() => { setCropFile(null); setCropTarget(null); }}
        />
      )}
    </>
  );
}
