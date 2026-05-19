import type { Point } from "../types";

export const TEXAS_BOUNDS = {
  minLng: -106.7,
  maxLng: -93.2,
  minLat: 25.5,
  maxLat: 36.7,
};

export const projectPoint = (
  lng: number,
  lat: number,
  viewport: { width: number; height: number },
  zoom: number,
  center: Point,
) => {
  const scale = Math.pow(1.52, zoom - 5.4);
  const spanLng = (TEXAS_BOUNDS.maxLng - TEXAS_BOUNDS.minLng) / scale;
  const spanLat = (TEXAS_BOUNDS.maxLat - TEXAS_BOUNDS.minLat) / scale;
  const minLng = center.lng - spanLng / 2;
  const maxLat = center.lat + spanLat / 2;
  return {
    x: ((lng - minLng) / spanLng) * viewport.width,
    y: ((maxLat - lat) / spanLat) * viewport.height,
  };
};

export const polygonPath = (
  points: [number, number][],
  viewport: { width: number; height: number },
  zoom: number,
  center: Point,
) => points.map(([lng, lat]) => {
  const p = projectPoint(lng, lat, viewport, zoom, center);
  return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
}).join(" ");

export const linePath = (
  points: [number, number][],
  viewport: { width: number; height: number },
  zoom: number,
  center: Point,
) =>
  points
    .map(([lng, lat], index) => {
      const p = projectPoint(lng, lat, viewport, zoom, center);
      return `${index === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    })
    .join(" ");

export const averagePoint = (
  points: [number, number][],
  viewport: { width: number; height: number },
  zoom: number,
  center: Point,
) => {
  if (!points.length) return { x: 0, y: 0 };
  const projected = points.map(([lng, lat]) => projectPoint(lng, lat, viewport, zoom, center));
  const sum = projected.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
  return { x: sum.x / projected.length, y: sum.y / projected.length };
};

export const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);
