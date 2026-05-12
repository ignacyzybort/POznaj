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
    path: "M130,0 L260,0 L280,70 L250,110 L200,120 L150,110 L120,70 Z",
    center: [52.458, 16.920],
    labelX: 200, labelY: 60,
    exitX: 0, exitY: -120,
  },
  {
    id: "Winogrady",
    label: "Winogrady",
    path: "M140,110 L210,120 L250,160 L230,190 L190,200 L150,190 L120,160 Z",
    center: [52.430, 16.935],
    labelX: 185, labelY: 155,
    exitX: 0, exitY: -80,
  },
  {
    id: "Jezyce",
    label: "Jeżyce",
    path: "M30,140 L120,160 L150,190 L160,250 L130,300 L80,310 L40,280 L20,220 Z",
    center: [52.418, 16.895],
    labelX: 85, labelY: 225,
    exitX: -120, exitY: 0,
  },
  {
    id: "StareMiasto",
    label: "Stare Miasto",
    path: "M120,200 L190,210 L210,250 L190,300 L140,310 L110,280 L100,240 Z",
    center: [52.408, 16.934],
    labelX: 155, labelY: 255,
    exitX: 0, exitY: 0,
  },
  {
    id: "NoweMiasto",
    label: "Nowe Miasto",
    path: "M210,200 L300,190 L330,230 L310,300 L240,310 L215,280 L205,240 Z",
    center: [52.395, 16.965],
    labelX: 265, labelY: 250,
    exitX: 120, exitY: 0,
  },
  {
    id: "Lazarz",
    label: "Łazarz",
    path: "M30,320 L120,320 L140,380 L110,430 L60,440 L20,400 L15,360 Z",
    center: [52.393, 16.882],
    labelX: 75, labelY: 375,
    exitX: -100, exitY: 60,
  },
  {
    id: "Grunwald",
    label: "Grunwald",
    path: "M100,370 L210,360 L230,430 L200,480 L140,490 L90,460 L80,400 Z",
    center: [52.396, 16.898],
    labelX: 160, labelY: 425,
    exitX: -60, exitY: 80,
  },
  {
    id: "Wilda",
    label: "Wilda",
    path: "M220,330 L310,320 L330,380 L300,440 L240,430 L215,390 Z",
    center: [52.381, 16.923],
    labelX: 270, labelY: 380,
    exitX: 80, exitY: 60,
  },
  {
    id: "Rataje",
    label: "Rataje",
    path: "M230,420 L330,410 L370,470 L350,540 L290,570 L240,550 L220,480 Z",
    center: [52.380, 16.970],
    labelX: 295, labelY: 490,
    exitX: 100, exitY: 100,
  },
  {
    id: "Inny",
    label: "Inne",
    path: "M340,10 L390,10 L390,50 L340,50 Z",
    center: [52.408, 16.934],
    labelX: 365, labelY: 35,
    exitX: -140, exitY: -100,
  },
];
