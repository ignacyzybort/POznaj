"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { EventData, categoryColors } from "@/lib/data";

const CAT_GLYPH: Record<string, string> = {
  Muzyka: "♪", Kino: "✦", Sztuka: "◆", Sport: "↗", Teatr: "☾",
  Warsztaty: "✺", Konferencje: "◯", Jedzenie: "✿", Inne: "✶",
};

type Style = "collage" | "gradient" | "typographic";

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function rnd(seed: number, i: number): number {
  return (Math.sin(seed * 9301 + i * 49297) + 1) / 2;
}

const CATEGORY_LABEL: Record<string, string> = {
  Kino: "Kino", Muzyka: "Muzyka", Sztuka: "Sztuka", Sport: "Sport",
  Teatr: "Teatr", Warsztaty: "Warsztaty", Konferencje: "Konferencje",
  Jedzenie: "Jedzenie", Inne: "Inne",
};

export default function EventArt({
  event, height = 180, style = "collage", forceArt = false, className = "", layoutId,
}: {
  event: Pick<EventData, "id" | "category" | "title" | "time" | "imageUrl">;
  height?: number;
  style?: Style;
  forceArt?: boolean;
  className?: string;
  layoutId?: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  if (!forceArt && event.imageUrl && !imgFailed) {
    return (
      <motion.div className={`pz-art ${className}`} style={{ height, background: "var(--bg-soft)" }} layoutId={layoutId}>
        <img
          src={event.imageUrl}
          alt={`Zdjęcie wydarzenia: ${event.title}`}
          loading="lazy"
          decoding="async"
          sizes="(max-width: 420px) 100vw, 420px"
          width={420}
          height={Math.round(420 * (height / (height > 200 ? 16 : 9)))}
          className={`pz-img-reveal${imgLoaded ? ' loaded' : ''}`}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </motion.div>
    );
  }

  const tone = categoryColors[event.category] ?? categoryColors.Inne;
  const seed = hashStr(event.id);
  const glyph = CAT_GLYPH[event.category] ?? "✶";
  const label = CATEGORY_LABEL[event.category] ?? event.category;
  const gradientBg = useMemo(
    () => `radial-gradient(circle at ${20 + rnd(seed, 1) * 60}% ${20 + rnd(seed, 2) * 60}%, ${tone.bg}, ${tone.bg} 40%, color-mix(in oklab, ${tone.bg} 60%, black))`,
    [seed, tone.bg],
  );
  const gradientOverlay = useMemo(
    () => `radial-gradient(circle at ${rnd(seed, 3) * 100}% ${rnd(seed, 4) * 100}%, white, transparent 40%)`,
    [seed],
  );


  if (style === "typographic") {
    return (
      <motion.div className="pz-art pz-art-noise" style={{
        height, background: tone.bg, color: tone.fg,
        padding: "14px 16px", display: "flex", alignItems: "flex-end",
      }} layoutId={layoutId}>
        <div style={{ position: "relative", zIndex: 2, lineHeight: 0.88 }}>
          <div className="pz-display" style={{ fontSize: 44, letterSpacing: "-0.04em" }}>
            {event.title.split(" ").slice(0, 3).join(" ")}
          </div>
          <div className="pz-mono" style={{ fontSize: 11, marginTop: 10, opacity: 0.75 }}>
            {label.toUpperCase()} · {event.time ?? ""}
          </div>
        </div>
      </motion.div>
    );
  }

  if (style === "gradient") {
    return (
      <motion.div className={`pz-art ${className}`} style={{
        height,
        background: gradientBg,
        color: tone.fg,
        position: "relative",
      }} layoutId={layoutId}>
        <div style={{
          position: "absolute", inset: 0, opacity: 0.18,
          background: gradientOverlay,
        }} />
        <div style={{
          position: "absolute", right: 14, top: 12, fontSize: 50, opacity: 0.5,
          fontFamily: "serif", lineHeight: 1,
        }}>{glyph}</div>
        <div style={{
          position: "absolute", left: 14, bottom: 12, fontSize: 13,
          fontWeight: 700, letterSpacing: "-0.01em",
        }}>{label}</div>
      </motion.div>
    );
  }

  // collage (default)
  const shapes = useMemo(() => Array.from({ length: 4 }, (_, i) => ({
    x: rnd(seed, i * 7 + 1) * 100,
    y: rnd(seed, i * 7 + 2) * 100,
    r: 20 + rnd(seed, i * 7 + 3) * 30,
    shape: (["circle", "square", "tri", "half"] as const)[i % 4],
    rot: rnd(seed, i * 7 + 4) * 90,
  })), [event.id, seed]);

  const isHero = height > 200;
  const shapeTransition = (i: number) => isHero ? {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { delay: 0.15 + i * 0.1, duration: 0.55, ease: [0.25, 1, 0.5, 1] as [number, number, number, number] },
  } : {};

  return (
    <motion.div className={`pz-art pz-art-noise ${className}`} style={{
      height, background: tone.bg, color: tone.fg, position: "relative",
    }} layoutId={layoutId}>
      <svg
        width="100%" height="100%"
        viewBox="0 0 100 100" preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <pattern id={`dots-${event.id}`} width="3" height="3" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.45" fill="currentColor" opacity="0.55" />
          </pattern>
        </defs>
        {shapes.map((s, i) => {
          const fill = i === 0
            ? `url(#dots-${event.id})`
            : i === 1
              ? "rgba(255,255,255,0.22)"
              : "rgba(0,0,0,0.10)";
          if (s.shape === "circle") {
            return <motion.circle key={i} cx={s.x} cy={s.y} r={s.r / 2.4} fill={fill} {...shapeTransition(i)} />;
          }
          if (s.shape === "square") {
            return (
              <motion.rect key={i}
                    x={s.x - s.r / 3} y={s.y - s.r / 3}
                    width={s.r / 1.5} height={s.r / 1.5}
                    fill={fill} rx="2"
                    transform={`rotate(${s.rot} ${s.x} ${s.y})`}
                    {...shapeTransition(i)} />
            );
          }
          if (s.shape === "tri") {
            const pts = `${s.x},${s.y - s.r / 3} ${s.x + s.r / 3},${s.y + s.r / 3} ${s.x - s.r / 3},${s.y + s.r / 3}`;
            return (
              <motion.polygon key={i} points={pts} fill={fill}
                       transform={`rotate(${s.rot} ${s.x} ${s.y})`}
                       {...shapeTransition(i)} />
            );
          }
          return (
            <motion.path key={i}
                  d={`M ${s.x - s.r / 3} ${s.y} A ${s.r / 3} ${s.r / 3} 0 0 1 ${s.x + s.r / 3} ${s.y} Z`}
                  fill={fill}
                  transform={`rotate(${s.rot} ${s.x} ${s.y})`}
                  {...shapeTransition(i)} />
          );
        })}
      </svg>
      <motion.div style={{
        position: "absolute", left: "50%", top: "50%",
        transform: "translate(-50%, -50%) rotate(-6deg)",
        fontSize: Math.max(64, height * 0.55), lineHeight: 1, fontFamily: "serif",
        opacity: 0.92, mixBlendMode: "multiply",
      }} {...(isHero ? { initial: { scale: 0.6, opacity: 0 }, animate: { scale: 1, opacity: 0.92 }, transition: { delay: 0.4, duration: 0.6, ease: [0.25, 1, 0.5, 1] } } : {})}>{glyph}</motion.div>
      <motion.div style={{
        position: "absolute", left: 12, bottom: 12,
        background: "rgba(255,255,255,0.95)", color: "var(--ink)",
        padding: "5px 10px", borderRadius: 999,
        fontSize: 11, fontWeight: 700, letterSpacing: "-0.005em",
        transform: "rotate(-2deg)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
      }} {...(isHero ? { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.55, duration: 0.45, ease: [0.25, 1, 0.5, 1] } } : {})}>{label}</motion.div>
    </motion.div>
  );
}
