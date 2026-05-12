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
    path: "M110,0 L270,0 L300,40 L290,80 L270,100 L230,110 L190,105 L140,110 L115,90 L105,60 Z",
    center: [52.458, 16.920],
    labelX: 205, labelY: 55,
    exitX: 0, exitY: -130,
  },
  {
    id: "Winogrady",
    label: "Winogrady",
    path: "M120,110 L190,108 L240,115 L270,130 L260,170 L230,195 L195,200 L160,195 L135,180 L120,150 Z",
    center: [52.430, 16.935],
    labelX: 195, labelY: 155,
    exitX: 0, exitY: -80,
  },
  {
    id: "Jezyce",
    label: "Jeżyce",
    path: "M25,140 L100,155 L140,165 L160,195 L165,240 L155,270 L130,295 L95,310 L55,300 L30,270 L20,220 L15,180 Z",
    center: [52.418, 16.895],
    labelX: 85, labelY: 225,
    exitX: -130, exitY: 0,
  },
  {
    id: "StareMiasto",
    label: "Stare Miasto",
    path: "M115,200 L195,210 L225,245 L210,285 L195,305 L155,315 L125,300 L105,270 L100,240 L105,215 Z",
    center: [52.408, 16.934],
    labelX: 165, labelY: 260,
    exitX: 0, exitY: 0,
  },
  {
    id: "NoweMiasto",
    label: "Nowe Miasto",
    path: "M220,195 L270,200 L310,210 L340,240 L335,280 L315,310 L275,320 L240,315 L225,295 L215,260 L210,220 Z",
    center: [52.395, 16.965],
    labelX: 275, labelY: 258,
    exitX: 130, exitY: 0,
  },
  {
    id: "Lazarz",
    label: "Łazarz",
    path: "M25,315 L95,310 L135,315 L155,340 L160,375 L145,405 L120,425 L85,430 L50,415 L30,385 L20,350 Z",
    center: [52.393, 16.882],
    labelX: 85, labelY: 370,
    exitX: -110, exitY: 60,
  },
  {
    id: "Grunwald",
    label: "Grunwald",
    path: "M100,370 L195,360 L240,370 L260,405 L250,450 L220,480 L170,490 L130,485 L105,460 L90,425 L95,395 Z",
    center: [52.396, 16.898],
    labelX: 175, labelY: 425,
    exitX: -60, exitY: 80,
  },
  {
    id: "Wilda",
    label: "Wilda",
    path: "M225,310 L280,315 L325,325 L340,365 L330,405 L295,425 L260,415 L235,395 L220,360 L215,335 Z",
    center: [52.381, 16.923],
    labelX: 275, labelY: 370,
    exitX: 80, exitY: 60,
  },
  {
    id: "Rataje",
    label: "Rataje",
    path: "M230,420 L310,410 L350,425 L375,470 L365,520 L340,555 L290,570 L245,550 L225,520 L220,480 Z",
    center: [52.380, 16.970],
    labelX: 300, labelY: 495,
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
