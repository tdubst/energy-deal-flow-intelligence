import { memo, useMemo } from "react";
import { polygonPath, projectPoint } from "../../../services/mapMath";
import type { Parcel, Point } from "../../../types";

interface Props {
  parcels: Parcel[];
  viewport: { width: number; height: number };
  zoom: number;
  center: Point;
  opacity: number;
  onHover: (parcel: Parcel, screen: { x: number; y: number }) => void;
  onHoverEnd: () => void;
}

export const ParcelLayer = memo(({ parcels, viewport, zoom, center, opacity, onHover, onHoverEnd }: Props) => {
  const projectedParcels = useMemo(
    () =>
      parcels.map((parcel) => ({
        parcel,
        point: projectPoint(parcel.centroid[0], parcel.centroid[1], viewport, zoom, center),
        polygon: polygonPath(parcel.points, viewport, zoom, center),
      })),
    [center, parcels, viewport, zoom],
  );

  return (
    <g className="parcel-layer" opacity={opacity}>
      {projectedParcels.map(({ parcel, point, polygon }) => {
        const hitRadius = Math.max(12, Math.min(28, 20 + zoom * 0.8));
        return (
          <g key={parcel.id}>
            <polygon points={polygon} className={`parcel-shape parcel-shape--${parcel.ownerBucket}`} />
            <circle
              cx={point.x}
              cy={point.y}
              r={hitRadius}
              className="parcel-hitbox"
              onPointerEnter={() => onHover(parcel, point)}
              onPointerMove={() => onHover(parcel, point)}
              onPointerLeave={onHoverEnd}
            />
            {zoom > 7.8 ? (
              <text x={point.x} y={point.y} className="parcel-label">
                {parcel.score}% / {parcel.acres.toFixed(0)} ac
              </text>
            ) : null}
          </g>
        );
      })}
    </g>
  );
});
