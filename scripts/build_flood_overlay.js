const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const inputPath = path.join(projectRoot, "data", "raw", "fort_bend", "fema_nfhl_flood_hazard_zones.geojson");
const outputPath = path.join(projectRoot, "data", "processed", "flood-overlay.js");

function simplifyRing(ring, maxPoints = 42) {
  if (ring.length <= maxPoints) return ring;
  const stride = Math.ceil(ring.length / maxPoints);
  const sampled = ring.filter((_, index) => index % stride === 0);
  const first = sampled[0];
  const last = sampled[sampled.length - 1];
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) sampled.push(first);
  return sampled;
}

function normalizePolygons(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return [geometry.coordinates];
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  return [];
}

function main() {
  const geojson = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const zones = [];

  for (const feature of geojson.features || []) {
    const zone = feature.properties?.FLD_ZONE || "UNKNOWN";
    const sfha = feature.properties?.SFHA_TF || "F";
    if (!(sfha === "T" || ["A", "AE", "AH", "AO", "VE", "V"].includes(zone))) continue;

    for (const polygon of normalizePolygons(feature.geometry)) {
      const outer = polygon[0] || [];
      if (outer.length < 4) continue;
      zones.push({
        id: `flood_${zones.length + 1}`,
        zone,
        sfha,
        points: simplifyRing(outer).map(([lng, lat]) => [Number(lng.toFixed(5)), Number(lat.toFixed(5))]),
      });
    }
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `const floodOverlay = ${JSON.stringify({ zones: zones.slice(0, 90) })};\n`, "utf8");
  console.log(`Wrote ${Math.min(zones.length, 90)} flood zones to ${path.relative(projectRoot, outputPath)}`);
}

main();
