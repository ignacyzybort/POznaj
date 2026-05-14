"use client";

import { useEffect, useState } from "react";

const COLORS = ["#FF3D7F", "#6E3DFF", "#2860FF", "#C8FF2E", "#FF6B2C", "#FFB627", "#3D5A40", "#FF3823"];
const COUNT = 20;

interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
  size: number;
}

export default function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) { setParticles([]); return; }
    const p: Particle[] = Array.from({ length: COUNT }, (_, i) => ({
      id: i,
      x: 20 + Math.random() * 60,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.3,
      size: 4 + Math.random() * 4,
    }));
    setParticles(p);
    const t = setTimeout(() => setParticles([]), 1200);
    return () => clearTimeout(t);
  }, [active]);

  if (!particles.length) return null;

  return (
    <>
      {particles.map((p) => (
        <span key={p.id} className="pz-confetti"
          style={{
            left: `${p.x}%`, top: "40%",
            width: p.size, height: p.size,
            background: p.color,
            animationDelay: `${p.delay}s`,
          }} />
      ))}
    </>
  );
}
