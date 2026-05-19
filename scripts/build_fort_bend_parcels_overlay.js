const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const zipPath = path.join(projectRoot, "data", "raw", "FBCAD-2025-Certified-GIS-Data-Shapefiles-Only.zip");
const shpPath = "FBCAD 2025 Certified GIS Data - Shapefiles Only/CamaSummary/CamaSummary.shp";
const outputPath = path.join(projectRoot, "data", "processed", "fort-bend-parcels-overlay.js");
const transmissionPath = path.join(projectRoot, "data", "raw", "texas", "hifld_transmission.geojson");
const floodPath = path.join(projectRoot, "data", "raw", "fort_bend", "fema_nfhl_flood_hazard_zones.geojson");

const aoi = {
  name: "Avalon BESS / Fort Bend focus area",
  center: { lng: -95.77, lat: 29.53 },
  radiusMiles: 14,
  maxParcels: 90,
};

const usFoot = 0.3048006096012192;
const earthRadius = 6378137.0;
const params = {
  falseEasting: 1968500.0 * usFoot,
  falseNorthing: 13123333.33333333 * usFoot,
  centralMeridian: radians(-99.0),
  standardParallel1: radians(28.38333333333333),
  standardParallel2: radians(30.28333333333333),
  latitudeOfOrigin: radians(27.83333333333333),
};

const n = Math.log(Math.cos(params.standardParallel1) / Math.cos(params.standardParallel2)) /
  Math.log(t(params.standardParallel1) / t(params.standardParallel2));
const f = (Math.cos(params.standardParallel1) * Math.pow(t(params.standardParallel1), n)) / n;
const rho0 = earthRadius * f * Math.pow(t(params.latitudeOfOrigin), -n);

function radians(degrees) {
  return (degrees * Math.PI) / 180;
}

function degrees(rads) {
  return (rads * 180) / Math.PI;
}

function t(phi) {
  return Math.tan(Math.PI / 4 + phi / 2);
}

function projectForward(lng, lat) {
  const theta = n * (radians(lng) - params.centralMeridian);
  const rho = earthRadius * f * Math.pow(t(radians(lat)), -n);
  return {
    x: (params.falseEasting + rho * Math.sin(theta)) / usFoot,
    y: (params.falseNorthing + rho0 - rho * Math.cos(theta)) / usFoot,
  };
}

function projectInverse(xFeet, yFeet) {
  const x = xFeet * usFoot - params.falseEasting;
  const y = rho0 - (yFeet * usFoot - params.falseNorthing);
  const rho = Math.sign(n) * Math.sqrt(x * x + y * y);
  const theta = Math.atan2(x * Math.sign(n), y * Math.sign(n));
  const lat = 2 * Math.atan(Math.pow(rho / (earthRadius * f), -1 / n)) - Math.PI / 2;
  const lng = params.centralMeridian + theta / n;
  return [Number(degrees(lng).toFixed(5)), Number(degrees(lat).toFixed(5))];
}

function distanceMiles(a, b) {
  const latMiles = (a[1] - b[1]) * 69;
  const lngMiles = (a[0] - b[0]) * 69 * Math.cos(radians((a[1] + b[1]) / 2));
  return Math.sqrt(latMiles * latMiles + lngMiles * lngMiles);
}

function pointSegmentDistanceMiles(point, start, end) {
  const latScale = 69;
  const lngScale = 69 * Math.cos(radians(point[1]));
  const px = point[0] * lngScale;
  const py = point[1] * latScale;
  const ax = start[0] * lngScale;
  const ay = start[1] * latScale;
  const bx = end[0] * lngScale;
  const by = end[1] * latScale;
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) return distanceMiles(point, start);
  const tValue = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  const nearest = [ax + tValue * dx, ay + tValue * dy];
  return Math.sqrt((px - nearest[0]) ** 2 + (py - nearest[1]) ** 2);
}

function centroid(points) {
  const totals = points.reduce((sum, point) => ({ lng: sum.lng + point[0], lat: sum.lat + point[1] }), { lng: 0, lat: 0 });
  return [Number((totals.lng / points.length).toFixed(5)), Number((totals.lat / points.length).toFixed(5))];
}

function loadTransmissionLines() {
  if (!fs.existsSync(transmissionPath)) return [];
  const geojson = JSON.parse(fs.readFileSync(transmissionPath, "utf8"));
  const lines = [];
  for (const feature of geojson.features || []) {
    if (Number(feature.properties?.VOLTAGE) !== 345) continue;
    if (feature.geometry?.type === "LineString") lines.push(feature.geometry.coordinates);
    if (feature.geometry?.type === "MultiLineString") lines.push(...feature.geometry.coordinates);
  }
  return lines;
}

function nearestLineMiles(point, lines) {
  let nearest = Infinity;
  for (const line of lines) {
    for (let i = 1; i < line.length; i += 1) {
      nearest = Math.min(nearest, pointSegmentDistanceMiles(point, line[i - 1], line[i]));
    }
  }
  return Number(nearest.toFixed(2));
}

function pointInRing(point, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersects = yi > point[1] !== yj > point[1] && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function normalizeFloodPolygons(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return [geometry.coordinates[0]];
  if (geometry.type === "MultiPolygon") return geometry.coordinates.map((polygon) => polygon[0]);
  return [];
}

function loadFloodZones() {
  if (!fs.existsSync(floodPath)) return [];
  const geojson = JSON.parse(fs.readFileSync(floodPath, "utf8"));
  const zones = [];
  for (const feature of geojson.features || []) {
    const zone = feature.properties?.FLD_ZONE || "UNKNOWN";
    const sfha = feature.properties?.SFHA_TF || "F";
    const risk = sfha === "T" || ["A", "AE", "AH", "AO", "VE", "V"].includes(zone) ? "high" : zone === "X" ? "moderate" : "unknown";
    for (const ring of normalizeFloodPolygons(feature.geometry)) {
      if (ring.length >= 4) zones.push({ zone, risk, ring });
    }
  }
  return zones;
}

function floodRiskForPoint(point, zones) {
  for (const zone of zones) {
    if (pointInRing(point, zone.ring)) return zone.risk;
  }
  return "low";
}

function ringBounds(points) {
  return points.reduce(
    (bounds, point) => ({
      minLng: Math.min(bounds.minLng, point[0]),
      minLat: Math.min(bounds.minLat, point[1]),
      maxLng: Math.max(bounds.maxLng, point[0]),
      maxLat: Math.max(bounds.maxLat, point[1]),
    }),
    { minLng: Infinity, minLat: Infinity, maxLng: -Infinity, maxLat: -Infinity }
  );
}

function floodExposureForParcel(parcelPoints, zones) {
  const bounds = ringBounds(parcelPoints);
  const steps = 7;
  let insideCount = 0;
  let highCount = 0;
  let moderateCount = 0;

  for (let x = 0; x < steps; x += 1) {
    for (let y = 0; y < steps; y += 1) {
      const point = [
        bounds.minLng + ((x + 0.5) / steps) * (bounds.maxLng - bounds.minLng),
        bounds.minLat + ((y + 0.5) / steps) * (bounds.maxLat - bounds.minLat),
      ];
      if (!pointInRing(point, parcelPoints)) continue;
      insideCount += 1;
      let pointRisk = "low";
      for (const zone of zones) {
        if (pointInRing(point, zone.ring)) {
          pointRisk = zone.risk;
          if (pointRisk === "high") break;
        }
      }
      if (pointRisk === "high") highCount += 1;
      if (pointRisk === "moderate") moderateCount += 1;
    }
  }

  if (!insideCount) return { highPct: 0, moderatePct: 0, floodRisk: "low" };
  const highPct = Number((highCount / insideCount).toFixed(2));
  const moderatePct = Number((moderateCount / insideCount).toFixed(2));
  const floodRisk = highPct >= 0.2 ? "high" : highPct > 0 || moderatePct >= 0.25 ? "moderate" : "low";
  return { highPct, moderatePct, floodRisk };
}

function dealValues(parcel, score, exposure) {
  const buildabilityFactor = Math.max(0.15, 1 - exposure.highPct * 0.8 - exposure.moderatePct * 0.35);
  const developableAcres = Number((parcel.acres * buildabilityFactor).toFixed(1));
  const probability = Math.max(0.25, Math.min(0.92, score / 100));
  const spreads = { low: 12000, base: 22000, high: 32000 };
  const value = (spread) => Math.round((developableAcres * spread * probability) / 100000) / 10;
  return {
    developableAcres,
    buildabilityFactor: Number(buildabilityFactor.toFixed(2)),
    screeningUpsideLowM: value(spreads.low),
    screeningUpsideBaseM: value(spreads.base),
    screeningUpsideHighM: value(spreads.high),
  };
}

function polygonAreaSqFt(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    sum += current[0] * next[1] - next[0] * current[1];
  }
  return Math.abs(sum / 2);
}

function simplify(points, maxPoints = 48) {
  if (points.length <= maxPoints) return points;
  const stride = Math.ceil(points.length / maxPoints);
  const sampled = points.filter((_, index) => index % stride === 0);
  const first = sampled[0];
  const last = sampled[sampled.length - 1];
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) sampled.push(first);
  return sampled;
}

function intersects(box, other) {
  return box.xmin <= other.xmax && box.xmax >= other.xmin && box.ymin <= other.ymax && box.ymax >= other.ymin;
}

function readParcels(buffer, focusBox) {
  const parcels = [];
  let offset = 100;
  let index = 0;

  while (offset + 8 < buffer.length) {
    index += 1;
    const contentLengthBytes = buffer.readInt32BE(offset + 4) * 2;
    const start = offset + 8;
    const shapeType = buffer.readInt32LE(start);
    if (shapeType === 5 || shapeType === 15 || shapeType === 25) {
      const box = {
        xmin: buffer.readDoubleLE(start + 4),
        ymin: buffer.readDoubleLE(start + 12),
        xmax: buffer.readDoubleLE(start + 20),
        ymax: buffer.readDoubleLE(start + 28),
      };
      if (intersects(box, focusBox)) {
        const numParts = buffer.readInt32LE(start + 36);
        const numPoints = buffer.readInt32LE(start + 40);
        const partsOffset = start + 44;
        const pointsOffset = partsOffset + numParts * 4;
        const parts = Array.from({ length: numParts }, (_, i) => buffer.readInt32LE(partsOffset + i * 4));
        const rawPoints = Array.from({ length: numPoints }, (_, i) => [
          buffer.readDoubleLE(pointsOffset + i * 16),
          buffer.readDoubleLE(pointsOffset + i * 16 + 8),
        ]);
        const rings = parts.map((partStart, partIndex) => {
          const partEnd = parts[partIndex + 1] || rawPoints.length;
          return rawPoints.slice(partStart, partEnd);
        });
        const largestRing = rings.sort((a, b) => polygonAreaSqFt(b) - polygonAreaSqFt(a))[0] || [];
        const acres = polygonAreaSqFt(largestRing) / 43560;
        if (acres >= 20) {
          const lngLatPoints = simplify(largestRing).map(([x, y]) => projectInverse(x, y));
          parcels.push({
            id: `fbcad_${index}`,
            acres: Number(acres.toFixed(1)),
            score: 0,
            ownerBucket: "unknown",
            centroid: centroid(lngLatPoints),
            nearest345Miles: null,
            points: lngLatPoints,
          });
        }
      }
    }
    offset = start + contentLengthBytes;
  }

  return parcels
    .sort((a, b) => b.acres - a.acres)
    .slice(0, aoi.maxParcels);
}

function main() {
  const center = projectForward(aoi.center.lng, aoi.center.lat);
  const radiusFeet = aoi.radiusMiles * 5280;
  const focusBox = {
    xmin: center.x - radiusFeet,
    ymin: center.y - radiusFeet,
    xmax: center.x + radiusFeet,
    ymax: center.y + radiusFeet,
  };

  const shp = execFileSync("unzip", ["-p", zipPath, shpPath], { maxBuffer: 160 * 1024 * 1024 });
  const transmission345 = loadTransmissionLines();
  const floodZones = loadFloodZones();
  const parcels = readParcels(shp, focusBox).map((parcel, idx) => {
    const nearest345Miles = nearestLineMiles(parcel.centroid, transmission345);
    const exposure = floodExposureForParcel(parcel.points, floodZones);
    const centroidRisk = floodRiskForPoint(parcel.centroid, floodZones);
    const floodRisk = exposure.floodRisk === "low" && centroidRisk !== "low" ? centroidRisk : exposure.floodRisk;
    const acreageScore = Math.min(40, parcel.acres / 60);
    const proximityScore = Math.max(0, 42 - nearest345Miles * 8);
    const rankScore = Math.max(0, 14 - idx * 0.08);
    const floodPenalty = exposure.highPct * 28 + exposure.moderatePct * 10 + (floodRisk === "high" ? 8 : floodRisk === "moderate" ? 3 : 0);
    const score = Math.max(35, Math.min(96, Math.round(acreageScore + proximityScore + rankScore - floodPenalty)));
    const value = dealValues(parcel, score, exposure);
    return {
      ...parcel,
      nearest345Miles,
      floodRisk,
      floodOverlapPct: Number(Math.min(1, exposure.highPct + exposure.moderatePct).toFixed(2)),
      highFloodOverlapPct: exposure.highPct,
      moderateFloodOverlapPct: exposure.moderatePct,
      ...value,
      score,
      ownerBucket: score >= 78 ? "single_or_large" : score >= 60 ? "assembly" : "fragmented",
    };
  }).sort((a, b) => b.score - a.score || b.acres - a.acres);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `const fortBendParcelOverlay = ${JSON.stringify({ aoi, parcels })};\n`,
    "utf8"
  );
  console.log(`Wrote ${parcels.length} Fort Bend parcels to ${path.relative(projectRoot, outputPath)}`);
}

main();
