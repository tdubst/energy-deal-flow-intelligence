const fs = require("fs/promises");
const https = require("https");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const sourcePath = path.join(projectRoot, "data", "sources.json");
const rawDir = path.join(projectRoot, "data", "raw");

async function fetchToFile(url, outputPath) {
  const bytes = await download(url);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, bytes);
  return bytes.length;
}

async function fetchArcgisToFile(source, bbox, outputPath) {
  const pageSize = source.id.includes("fema") ? 250 : 2000;
  const outFields = source.out_fields || "*";
  let offset = 0;
  const features = [];
  let template = null;

  while (true) {
    const url = arcgisQueryUrl(source.url, bbox, offset, pageSize, outFields);
    let page;
    try {
      const bytes = await download(url);
      page = JSON.parse(bytes.toString("utf8"));
      if (page.error) {
        throw new Error(`ArcGIS query failed: ${page.error.message || JSON.stringify(page.error)}`);
      }
    } catch (error) {
      if (features.length && source.id.includes("fema")) break;
      throw error;
    }
    if (!template) {
      template = { ...page, features: [] };
    }
    const pageFeatures = page.features || [];
    features.push(...pageFeatures);
    if (pageFeatures.length < pageSize) break;
    offset += pageSize;
  }

  const output = Buffer.from(JSON.stringify({ ...template, features }, null, 2));
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, output);
  return output.length;
}

function download(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://hazards.fema.gov/" } }, (response) => {
        if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
          response.resume();
          if (redirects > 5) {
            reject(new Error(`Too many redirects: ${url}`));
            return;
          }
          resolve(download(new URL(response.headers.location, url).toString(), redirects + 1));
          return;
        }

        if (response.statusCode < 200 || response.statusCode >= 300) {
          response.resume();
          reject(new Error(`Fetch failed ${response.statusCode}: ${url}`));
          return;
        }

        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

function arcgisQueryUrl(baseUrl, bbox, offset = 0, pageSize = 2000, outFields = "*") {
  const params = new URLSearchParams({
    where: "1=1",
    outFields,
    geometry: bbox.join(","),
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outSR: "4326",
    returnGeometry: "true",
    resultOffset: String(offset),
    resultRecordCount: String(pageSize),
    f: "geojson"
  });
  return `${baseUrl}/query?${params.toString()}`;
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(sourcePath, "utf8"));
  const areaKey = process.argv[2] || manifest.default_area || "fort_bend";
  const sourceFilter = process.argv[3] || "";
  const area = manifest.areas_of_interest?.[areaKey] || manifest.area_of_interest;
  if (!area) {
    throw new Error(`Unknown area of interest: ${areaKey}`);
  }
  await fs.mkdir(rawDir, { recursive: true });

  const fetchedAt = new Date().toISOString();
  const results = [];

  for (const source of manifest.sources) {
    if (sourceFilter && source.id !== sourceFilter) continue;
    if (source.areas && !source.areas.includes(areaKey)) continue;
    const rawPath = source.raw_path.replaceAll("{area}", areaKey);
    const outputPath = path.join(projectRoot, rawPath);
    const isArcgis = source.type.includes("arcgis");
    const bbox = source.id.includes("fema") && area.flood_bbox_wgs84 ? area.flood_bbox_wgs84 : area.bbox_wgs84;
    const bytes = isArcgis
      ? await fetchArcgisToFile(source, bbox, outputPath)
      : await fetchToFile(source.url, outputPath);
    results.push({
      id: source.id,
      output: rawPath,
      bytes,
      fetched_at: fetchedAt,
      source_url: source.url
    });
  }

  await fs.writeFile(
    path.join(rawDir, "fetch_manifest.json"),
    JSON.stringify({ fetched_at: fetchedAt, area_key: areaKey, area_of_interest: area, results }, null, 2)
  );

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
