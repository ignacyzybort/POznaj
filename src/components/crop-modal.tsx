"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Cropper, { Area } from "react-easy-crop";
import { useEscape } from "@/hooks/use-escape";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { SearchIcon } from "@/components/icons";

export default function CropModal({
  imageUrl,
  aspect,
  onCrop,
  onClose,
}: {
  imageUrl: string;
  aspect: number;
  onCrop: (blob: Blob) => void;
  onClose: () => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropping, setCropping] = useState(false);
  const croppedAreaRef = useRef<Area | null>(null);
  useEscape(onClose);
  const focusTrapRef = useFocusTrap(true);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    croppedAreaRef.current = croppedAreaPixels;
  }, []);

  const applyCrop = async () => {
    const pixels = croppedAreaRef.current;
    if (!pixels) return;
    setCropping(true);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      const canvas = document.createElement("canvas");
      canvas.width = pixels.width;
      canvas.height = pixels.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, pixels.x, pixels.y, pixels.width, pixels.height, 0, 0, pixels.width, pixels.height);

      canvas.toBlob((blob) => {
        if (blob) onCrop(blob);
        setCropping(false);
      }, "image/jpeg", 0.9);
    } catch {
      setCropping(false);
    }
  };

  return (
    <div ref={focusTrapRef} role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--scrim)" }}>
      <div className="rounded-3xl overflow-hidden mx-4 max-w-sm w-full" style={{ background: "var(--bg-elev)" }}>
        <div className="p-4">
          <h2 className="pz-h" style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", textAlign: "center" }}>
            Przytnij zdjęcie
          </h2>
        </div>

        <div style={{ position: "relative", width: "100%", height: 320, background: "var(--ink)" }}>
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom slider */}
        <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <SearchIcon size={14} />
          <label htmlFor="crop-zoom-range" style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--ink-2)", marginBottom: 4 }}>Zoom</label>
          <input
            id="crop-zoom-range"
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: "var(--ink)" }}
          />
          <SearchIcon size={14} />
        </div>

        <div style={{ display: "flex", gap: 10, padding: "12px 16px 20px" }}>
          <button onClick={onClose} className="pz-btn ghost" autoFocus style={{ flex: 1 }}>
            Anuluj
          </button>
          <button onClick={applyCrop} disabled={cropping} className="pz-btn primary" style={{ flex: 1 }}>
            {cropping ? "Przetwarzanie..." : "Zapisz"}
          </button>
        </div>
      </div>
    </div>
  );
}
