"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { EventData } from "@/lib/data";

const DistrictMap = dynamic(() => import("@/components/district-map"), { ssr: false });

export default function MapPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/events?limit=200").then((r) => r.json()).then((d) => {
      setEvents(d.events ?? []);
    });
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <DistrictMap
        events={events}
        selectedDistrict={selected}
        onSelect={setSelected}
        onBack={() => setSelected(null)}
      />
    </div>
  );
}
