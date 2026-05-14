"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { EventData } from "@/lib/data";

const DistrictMap = dynamic(() => import("@/components/district-map"), { ssr: false });

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
