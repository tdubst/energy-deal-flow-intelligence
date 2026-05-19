import { memo } from "react";
import { linePath } from "../../../services/mapMath";
import type { Point } from "../../../types";

interface Props {
  viewport: { width: number; height: number };
  zoom: number;
  center: Point;
  opacity: number;
  corridor: "fort-bend" | "navarro";
}

const paths = {
  "fort-bend": [
    [
      [-95.71, 29.55],
      [-95.64, 29.62],
      [-95.45, 29.75],
    ],
    [
      [-95.78, 29.52],
      [-95.71, 29.55],
      [-95.58, 29.7],
    ],
  ] as [number, number][][],
  navarro: [
    [
      [-96.47, 32.09],
      [-96.32, 32.23],
      [-96.04, 32.55],
    ],
    [
      [-96.58, 32.0],
      [-96.47, 32.09],
      [-96.29, 32.42],
    ],
  ] as [number, number][][],
};

export const EnergyFlowLayer = memo(({ viewport, zoom, center, opacity, corridor }: Props) => (
  <g className="energy-flow-layer" opacity={opacity}>
    {paths[corridor].map((points, index) => (
      <path
        key={index}
        d={linePath(points, viewport, zoom, center)}
        className="energy-flow"
        style={{ animationDelay: `${index * 0.8}s` }}
      />
    ))}
  </g>
));
