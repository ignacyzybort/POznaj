"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { EventData } from "@/lib/data";

const DistrictMap = dynamic(() => import("@/components/district-map"), {
  ssr: false,
  loading: () => (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div className="pz-skeleton pz-skeleton-breath" style={{ width: "88%", height: "60%", borderRadius: 28 }} />
    </div>
  ),
});

export default function MapaClient({ events }: { events: EventData[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <DistrictMap
      events={events}
      selectedDistrict={selected}
      onSelect={setSelected}
      onBack={() => setSelected(null)}
    />
  );
}
