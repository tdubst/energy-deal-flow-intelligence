import { memo, useMemo } from "react";
import { averagePoint, linePath } from "../../../services/mapMath";
import type { Point, TransmissionLine } from "../../../types";

interface Props {
  lines: TransmissionLine[];
  viewport: { width: number; height: number };
  zoom: number;
  center: Point;
  opacity: number;
  onHover: (line: TransmissionLine, screen: { x: number; y: number }) => void;
  onHoverEnd: () => void;
}

export const TransmissionLayer = memo(({ lines, viewport, zoom, center, opacity, onHover, onHoverEnd }: Props) => {
  const projectedLines = useMemo(
    () =>
      lines.map((line) => ({
        line,
        path: linePath(line.points, viewport, zoom, center),
        point: averagePoint(line.points, viewport, zoom, center),
      })),
    [center, lines, viewport, zoom],
  );

  return (
    <g className="transmission-layer" opacity={opacity}>
      {projectedLines.map(({ line, path, point }) => (
        <g key={`${line.id}-${line.points[0]?.join(":")}`}>
          <path d={path} className={line.voltage >= 345 ? "transmission-line transmission-line--high" : "transmission-line"} />
          {line.voltage >= 345 ? (
            <circle
              cx={point.x}
              cy={point.y}
              r={7}
              className="transmission-hitbox"
              onPointerEnter={() => onHover(line, point)}
              onPointerMove={() => onHover(line, point)}
              onPointerLeave={onHoverEnd}
            />
          ) : null}
        </g>
      ))}
    </g>
  );
});
