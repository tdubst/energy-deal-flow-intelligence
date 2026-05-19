import fs from "node:fs";

const OUT_DIR = "public/overlays";
const FETCHED_AT = new Date().toISOString();

const FEMA_NFHL_URL = "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query";
const NAVARRO_PARCELS_URL =
  "https://utility.arcgis.com/usrsvcs/servers/ffae28fe951a4349abca4e107f0fa39a/rest/services/NavarroCADWebService/FeatureServer/0/query";

const corridors = {
  fortBend: {
    bbox: [-95.72, 29.42, -95.54, 29.56],
    source: "FEMA NFHL Flood Hazard Zones, MapServer layer 28",
  },
  navarro: {
    bbox: [-96.62, 31.93, -96.25, 32.22],
    source: "FEMA NFHL Flood Hazard Zones, MapServer layer 28",
  },
};

const queryGeoJson = async (url, params) => {
  const request = new URL(url);
  request.search = new URLSearchParams({
    f: "geojson",
    ...params,
  }).toString();
  const response = await fetch(request);
  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status}: ${request}`);
  }
  return response.json();
};

const firstRing = (geometry) => {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return geometry.coordinates?.[0] ?? [];
  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates ?? [])
      .map((polygon) => polygon?.[0] ?? [])
      .sort((a, b) => b.length - a.length)[0] ?? [];
  }
  return [];
};

const simplifyRing = (ring, maxPoints = 64) => {
  if (ring.length <= maxPoints) return ring;
  const step = Math.ceil(ring.length / maxPoints);
  const reduced = ring.filter((_, index) => index % step === 0);
  const first = reduced[0];
  const last = reduced[reduced.length - 1];
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) reduced.push(first);
  return reduced;
};

const centroid = (ring) => {
  if (!ring.length) return [-96.47, 32.09];
  const sum = ring.reduce((acc, [lng, lat]) => [acc[0] + lng, acc[1] + lat], [0, 0]);
  return [Number((sum[0] / ring.length).toFixed(5)), Number((sum[1] / ring.length).toFixed(5))];
};

const milesBetween = (a, b) => {
  const latMiles = (a[1] - b[1]) * 69;
  const lngMiles = (a[0] - b[0]) * 69 * Math.cos(((a[1] + b[1]) / 2) * Math.PI / 180);
  return Math.hypot(latMiles, lngMiles);
};

const nearestLineMiles = (point, lines) => {
  let best = Number.POSITIVE_INFINITY;
  for (const line of lines) {
    if (line.voltage < 345) continue;
    for (const candidate of line.points) {
      best = Math.min(best, milesBetween(point, candidate));
    }
  }
  return Number(best.toFixed(2));
};

const ownerBucket = (owner = "") => {
  if (/llc|inc|lp|ltd|corp|company|co\\b/i.test(owner)) return "single_or_large";
  if (/et al|heirs|family|estate|trust/i.test(owner)) return "assembly";
  return "fragmented";
};

const riskFromFloodZone = (zone = "", sfha = "") => {
  if (sfha === "T" || ["A", "AE", "AH", "AO", "VE"].includes(zone)) return "high";
  if (["X", "0.2 PCT ANNUAL CHANCE FLOOD HAZARD"].includes(zone)) return "moderate";
  return "low";
};

const scoreParcel = (acres, nearestMiles, bucket, floodRisk) => {
  const sizeScore = Math.min(25, acres / 40);
  const gridScore = Math.max(0, 35 - nearestMiles * 7);
  const ownerScore = bucket === "single_or_large" ? 20 : bucket === "assembly" ? 13 : 7;
  const floodPenalty = floodRisk === "high" ? 12 : floodRisk === "moderate" ? 5 : 0;
  return Math.max(35, Math.min(94, Math.round(35 + sizeScore + gridScore + ownerScore - floodPenalty)));
};

const loadTransmission = () => JSON.parse(fs.readFileSync(`${OUT_DIR}/texas-transmission.json`, "utf8")).lines ?? [];

const buildFemaFloodOverlay = async () => {
  const zones = [];
  for (const [corridor, config] of Object.entries(corridors)) {
    const [xmin, ymin, xmax, ymax] = config.bbox;
    const geojson = await queryGeoJson(FEMA_NFHL_URL, {
      where: "1=1",
      outFields: "DFIRM_ID,FLD_AR_ID,FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE,V_DATUM",
      geometry: `${xmin},${ymin},${xmax},${ymax}`,
      geometryType: "esriGeometryEnvelope",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outSR: "4326",
      returnGeometry: "true",
      resultRecordCount: "120",
    });
    for (const feature of geojson.features ?? []) {
      const ring = simplifyRing(firstRing(feature.geometry), 72);
      if (ring.length < 4) continue;
      const zone = feature.properties?.FLD_ZONE ?? "Unknown";
      zones.push({
        id: `fema_${corridor}_${feature.properties?.FLD_AR_ID ?? zones.length}`,
        corridor,
        risk: riskFromFloodZone(zone, feature.properties?.SFHA_TF),
        femaZone: zone,
        zoneSubtype: feature.properties?.ZONE_SUBTY ?? "",
        sfha: feature.properties?.SFHA_TF ?? "",
        overlapPct: feature.properties?.SFHA_TF === "T" ? 1 : 0.35,
        highOverlapPct: feature.properties?.SFHA_TF === "T" ? 1 : 0,
        sourceUrl: FEMA_NFHL_URL,
        sourceName: config.source,
        fetchDate: FETCHED_AT,
        points: ring.map(([lng, lat]) => [Number(lng.toFixed(5)), Number(lat.toFixed(5))]),
      });
    }
  }
  fs.writeFileSync(`${OUT_DIR}/fema-flood-zones.json`, JSON.stringify({ fetchedAt: FETCHED_AT, sourceUrl: FEMA_NFHL_URL, zones }));
  fs.writeFileSync(`${OUT_DIR}/flood-zones.json`, JSON.stringify({ fetchedAt: FETCHED_AT, sourceUrl: FEMA_NFHL_URL, zones }));
  return zones.length;
};

const buildNavarroParcels = async () => {
  const lines = loadTransmission();
  const [xmin, ymin, xmax, ymax] = corridors.navarro.bbox;
  const geojson = await queryGeoJson(NAVARRO_PARCELS_URL, {
    where: "legal_acreage >= 75",
    outFields: "prop_id_text,prop_id,file_as_name,legal_acreage,land_val,market,legal_desc,situs_city,Deed_Date",
    geometry: `${xmin},${ymin},${xmax},${ymax}`,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outSR: "4326",
    returnGeometry: "true",
    resultRecordCount: "500",
    orderByFields: "legal_acreage DESC",
  });

  const parcels = (geojson.features ?? [])
    .map((feature, index) => {
      const ring = simplifyRing(firstRing(feature.geometry), 64);
      if (ring.length < 4) return null;
      const center = centroid(ring);
      const acres = Number(feature.properties?.legal_acreage ?? 0);
      const owner = String(feature.properties?.file_as_name ?? "Owner pending");
      const bucket = ownerBucket(owner);
      const nearest345Miles = nearestLineMiles(center, lines);
      const floodRisk = nearest345Miles < 1.5 ? "moderate" : "low";
      const buildabilityFactor = floodRisk === "moderate" ? 0.72 : 0.88;
      const developableAcres = Number((acres * buildabilityFactor).toFixed(1));
      const base = Number((developableAcres * 0.012).toFixed(1));
      return {
        id: `navcad_${feature.properties?.prop_id_text ?? feature.properties?.prop_id ?? index}`,
        county: "Navarro",
        sourceParcelId: feature.properties?.prop_id_text ?? feature.properties?.prop_id,
        acres,
        owner,
        landValue: Number(feature.properties?.land_val ?? feature.properties?.market ?? 0),
        score: scoreParcel(acres, nearest345Miles, bucket, floodRisk),
        ownerBucket: bucket,
        centroid: center,
        nearest345Miles,
        points: ring.map(([lng, lat]) => [Number(lng.toFixed(5)), Number(lat.toFixed(5))]),
        floodRisk,
        floodOverlapPct: floodRisk === "moderate" ? 0.35 : 0,
        highFloodOverlapPct: 0,
        moderateFloodOverlapPct: floodRisk === "moderate" ? 0.35 : 0,
        developableAcres,
        buildabilityFactor,
        screeningUpsideLowM: Number((base * 0.65).toFixed(1)),
        screeningUpsideBaseM: base,
        screeningUpsideHighM: Number((base * 1.45).toFixed(1)),
        sourceName: "Navarro CAD Parcels FeatureServer",
        sourceUrl: NAVARRO_PARCELS_URL,
        fetchDate: FETCHED_AT,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 80);

  fs.writeFileSync(
    `${OUT_DIR}/navarro-parcels.json`,
    JSON.stringify({
      fetchedAt: FETCHED_AT,
      sourceUrl: NAVARRO_PARCELS_URL,
      aoi: {
        name: "Navarro / Corsicana 345kV focus area",
        center: { lng: -96.47, lat: 32.09 },
        radiusMiles: 16,
        maxParcels: parcels.length,
      },
      parcels,
    }),
  );
  return parcels.length;
};

const floodCount = await buildFemaFloodOverlay();
const navarroCount = await buildNavarroParcels();
console.log(JSON.stringify({ floodZones: floodCount, navarroParcels: navarroCount, fetchedAt: FETCHED_AT }, null, 2));
