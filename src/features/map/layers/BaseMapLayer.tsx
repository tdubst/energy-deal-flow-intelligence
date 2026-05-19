import { demandHubs } from "../../../data";
import { project } from "../../../services/mapMath";

const texasPath =
  "M169 78 L400 82 L557 105 L764 144 L858 252 L843 365 L764 445 L715 560 L599 590 L520 655 L445 600 L357 598 L312 530 L237 493 L220 410 L150 358 L121 270 L88 211 Z";

const corridorLines = [
  [
    [-101.4, 35],
    [-100.9, 32.7],
    [-98.7, 33.2],
    [-97.1, 32.0],
    [-95.4, 29.9],
  ],
  [
    [-103.7, 31.3],
    [-100.9, 32.3],
    [-98.6, 31.9],
    [-96.8, 32.35],
  ],
  [
    [-98.5, 29.45],
    [-97.5, 31.0],
    [-96.8, 32.35],
    [-95.8, 29.53],
  ],
  [
    [-99.2, 27.0],
    [-98.3, 29.8],
    [-95.4, 29.9],
  ],
];

export function BaseMapLayer() {
  const microDots = Array.from({ length: 120 }, (_, index) => ({
    x: 90 + ((index * 47) % 840),
    y: 90 + ((index * 83) % 540),
    r: index % 7 === 0 ? 2.2 : 1.4,
    opacity: 0.22 + (index % 5) * 0.08,
  }));

  return (
    <g>
      <g id="basemap">
        <path className="texas-shape" d={texasPath} />
        <path className="water-shape" d="M118 401 C190 365 234 393 265 360 C310 313 365 374 416 336 C466 299 520 327 572 300 C634 267 690 292 742 260" />
        <path className="water-shape thin" d="M455 610 C495 570 552 562 594 519 C640 472 696 485 744 445" />
        {microDots.map((dot, index) => (
          <circle className="micro-dot" cx={dot.x} cy={dot.y} key={index} opacity={dot.opacity.toFixed(2)} r={dot.r} />
        ))}
        <text className="zone-label" x="210" y="140">Panhandle</text>
        <text className="zone-label" x="315" y="300">West</text>
        <text className="zone-label" x="560" y="250">North</text>
        <text className="zone-label" x="650" y="452">Houston</text>
        <text className="zone-label" x="500" y="500">South</text>
      </g>

      <g id="corridors">
        {corridorLines.map((line, index) => {
          const d = line
            .map(([lng, lat], pointIndex) => {
              const p = project(lng, lat);
              return `${pointIndex === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
            })
            .join(" ");
          return <path className="corridor" d={d} key={index} />;
        })}
      </g>

      <g id="hubs">
        {demandHubs.map((hub) => {
          const p = project(hub.lng, hub.lat);
          return (
            <g key={hub.name}>
              <circle className="hub-glow" cx={p.x} cy={p.y} r="58" />
              <circle cx={p.x} cy={p.y} fill="#d99a22" r="5" />
              <text className="hub-label" x={p.x + 10} y={p.y - 9}>{hub.name}</text>
            </g>
          );
        })}
      </g>
    </g>
  );
}
