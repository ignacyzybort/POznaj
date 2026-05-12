export interface DistrictShape {
  id: string;
  label: string;
  path: string;
  center: [number, number];
  labelX: number;
  labelY: number;
  exitX: number;
  exitY: number;
}

export const DISTRICT_SHAPES: DistrictShape[] = [
  {
    id: "Piatkowo",
    label: "Piątkowo",
    path: "M170,20 L230,20 L240,80 L220,110 L180,110 L160,80 Z",
    center: [52.458, 16.920],
    labelX: 200, labelY: 55,
    exitX: 0, exitY: -120,
  },
  {
    id: "Winogrady",
    label: "Winogrady",
    path: "M160,110 L220,110 L240,160 L210,190 L180,190 L150,170 Z",
    center: [52.430, 16.935],
    labelX: 195, labelY: 150,
    exitX: 0, exitY: -80,
  },
  {
    id: "Jezyce",
    label: "Jeżyce",
    path: "M60,170 L150,170 L155,240 L120,270 L70,260 L50,220 Z",
    center: [52.418, 16.895],
    labelX: 100, labelY: 220,
    exitX: -120, exitY: 0,
  },
  {
    id: "StareMiasto",
    label: "Stare Miasto",
    path: "M150,190 L220,190 L230,240 L220,270 L160,270 L140,240 Z",
    center: [52.408, 16.934],
    labelX: 185, labelY: 230,
    exitX: 0, exitY: 0,
  },
  {
    id: "NoweMiasto",
    label: "Nowe Miasto",
    path: "M230,190 L300,190 L310,240 L290,280 L230,270 Z",
    center: [52.395, 16.965],
    labelX: 265, labelY: 235,
    exitX: 120, exitY: 0,
  },
  {
    id: "Lazarz",
    label: "Łazarz",
    path: "M60,270 L140,270 L150,330 L120,360 L80,350 L50,310 Z",
    center: [52.393, 16.882],
    labelX: 100, labelY: 310,
    exitX: -100, exitY: 60,
  },
  {
    id: "Grunwald",
    label: "Grunwald",
    path: "M130,280 L220,280 L230,350 L200,370 L140,360 L120,330 Z",
    center: [52.396, 16.898],
    labelX: 175, labelY: 325,
    exitX: -60, exitY: 80,
  },
  {
    id: "Wilda",
    label: "Wilda",
    path: "M230,280 L290,290 L300,360 L260,380 L230,360 Z",
    center: [52.381, 16.923],
    labelX: 265, labelY: 330,
    exitX: 80, exitY: 60,
  },
  {
    id: "Rataje",
    label: "Rataje",
    path: "M240,370 L310,370 L320,440 L280,460 L240,440 L230,400 Z",
    center: [52.380, 16.970],
    labelX: 275, labelY: 415,
    exitX: 100, exitY: 100,
  },
  {
    id: "Inny",
    label: "Inne",
    path: "M30,40 L80,40 L80,80 L30,80 Z",
    center: [52.408, 16.934],
    labelX: 55, labelY: 65,
    exitX: -140, exitY: -100,
  },
];
