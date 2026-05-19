const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const inputPath = path.join(projectRoot, "data", "raw", "texas", "hifld_transmission.geojson");
const outputPath = path.join(projectRoot, "data", "processed", "transmission-overlay.js");

function normalizeLines(geometry) {
  if (!geometry) return [];
  if (geometry.type === "LineString") return [geometry.coordinates];
  if (geometry.type === "MultiLineString") return geometry.coordinates;
  return [];
}

function simplifyLine(line) {
  if (line.length <= 20) return line;
  const stride = Math.max(1, Math.floor(line.length / 28));
  const simplified = line.filter((_, index) => index % stride === 0);
  const last = line[line.length - 1];
  const tail = simplified[simplified.length - 1];
  if (!tail || tail[0] !== last[0] || tail[1] !== last[1]) simplified.push(last);
  return simplified;
}

function main() {
  const geojson = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const lines = [];

  for (const feature of geojson.features || []) {
    const voltage = Number(feature.properties?.VOLTAGE);
    if (!Number.isFinite(voltage) || voltage < 230) continue;

    for (const line of normalizeLines(feature.geometry)) {
      if (line.length < 2) continue;
      lines.push({
        id: String(feature.properties?.ID || feature.properties?.OBJECTID || lines.length),
        voltage,
        owner: feature.properties?.OWNER || "Not available",
        inferred: feature.properties?.INFERRED || "",
        points: simplifyLine(line).map(([lng, lat]) => [Number(lng.toFixed(5)), Number(lat.toFixed(5))]),
      });
    }
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `const transmissionOverlay = ${JSON.stringify(lines)};\n`,
    "utf8"
  );
  console.log(`Wrote ${lines.length} transmission lines to ${path.relative(projectRoot, outputPath)}`);
}

main();
