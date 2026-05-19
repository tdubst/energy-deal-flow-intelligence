import { memo, useMemo } from "react";
import { averagePoint, polygonPath } from "../../../services/mapMath";
import type { FloodZone, Point } from "../../../types";

interface Props {
  zones: FloodZone[];
  viewport: { width: number; height: number };
  zoom: number;
  center: Point;
  opacity: number;
  onHover: (zone: FloodZone, screen: { x: number; y: number }) => void;
  onHoverEnd: () => void;
}

export const FloodLayer = memo(({ zones, viewport, zoom, center, opacity, onHover, onHoverEnd }: Props) => {
  const projectedZones = useMemo(
    () =>
      zones.slice(0, zoom > 6.8 ? 120 : 70).map((zone) => ({
        zone,
        polygon: polygonPath(zone.points, viewport, zoom, center),
        point: averagePoint(zone.points, viewport, zoom, center),
      })),
    [center, viewport, zoom, zones],
  );

  return (
    <g className="flood-layer" opacity={opacity}>
      {projectedZones.map(({ zone, polygon, point }) => (
        <g key={zone.id}>
          <polygon points={polygon} className={`flood-zone flood-zone--${zone.risk}`} />
          <circle
            cx={point.x}
            cy={point.y}
            r={8}
            className="flood-hitbox"
            onPointerEnter={() => onHover(zone, point)}
            onPointerMove={() => onHover(zone, point)}
            onPointerLeave={onHoverEnd}
          />
        </g>
      ))}
    </g>
  );
});
