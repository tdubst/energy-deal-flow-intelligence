import { useCallback, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, WheelEvent as ReactWheelEvent } from "react";
import type { QueueProject, ViewBox } from "../types";
import { clampViewBox, defaultViewBox, project } from "../services/mapMath";

export function useMapNavigation(viewBox: ViewBox, setViewBox: (viewBox: ViewBox) => void) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [panStart, setPanStart] = useState<{ x: number; y: number; viewBox: ViewBox } | null>(null);

  const zoomMap = useCallback(
    (multiplier: number, anchor = { x: 500, y: 360 }) => {
      const nextW = viewBox.w / multiplier;
      const nextH = nextW * (720 / 1000);
      const anchorRatioX = (anchor.x - viewBox.x) / viewBox.w;
      const anchorRatioY = (anchor.y - viewBox.y) / viewBox.h;
      setViewBox(
        clampViewBox({
          x: anchor.x - nextW * anchorRatioX,
          y: anchor.y - nextH * anchorRatioY,
          w: nextW,
          h: nextH,
        }),
      );
    },
    [setViewBox, viewBox],
  );

  const zoomToProject = useCallback(
    (projectRecord: QueueProject) => {
      const point = project(projectRecord.lng, projectRecord.lat);
      const w = 430;
      const h = w * (720 / 1000);
      setViewBox(clampViewBox({ x: point.x - w / 2, y: point.y - h / 2, w, h }));
    },
    [setViewBox],
  );

  const reset = useCallback(() => setViewBox(defaultViewBox), [setViewBox]);

  const screenToSvgPoint = useCallback(
    (event: ReactMouseEvent<SVGSVGElement> | ReactWheelEvent<SVGSVGElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      return {
        x: viewBox.x + ((event.clientX - rect.left) / rect.width) * viewBox.w,
        y: viewBox.y + ((event.clientY - rect.top) / rect.height) * viewBox.h,
      };
    },
    [viewBox],
  );

  const onWheel = useCallback(
    (event: ReactWheelEvent<SVGSVGElement>) => {
      event.preventDefault();
      zoomMap(event.deltaY > 0 ? 0.86 : 1.16, screenToSvgPoint(event));
    },
    [screenToSvgPoint, zoomMap],
  );

  const onPointerDown = useCallback(
    (event: ReactMouseEvent<SVGSVGElement>) => {
      if (event.button !== 0) return;
      setPanStart({ x: event.clientX, y: event.clientY, viewBox });
    },
    [viewBox],
  );

  const onPointerMove = useCallback(
    (event: ReactMouseEvent<SVGSVGElement>) => {
      if (!panStart) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const dx = ((event.clientX - panStart.x) / rect.width) * panStart.viewBox.w;
      const dy = ((event.clientY - panStart.y) / rect.height) * panStart.viewBox.h;
      setViewBox(clampViewBox({ ...panStart.viewBox, x: panStart.viewBox.x - dx, y: panStart.viewBox.y - dy }));
    },
    [panStart, setViewBox],
  );

  const endPan = useCallback(() => setPanStart(null), []);

  return {
    svgRef,
    zoomMap,
    zoomToProject,
    reset,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp: endPan,
    onPointerLeave: endPan,
  };
}
