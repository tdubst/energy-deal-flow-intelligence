const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const zipPath = path.join(projectRoot, "data", "raw", "FBCAD-2025-Certified-GIS-Data-Shapefiles-Only.zip");
const dbfPath = "FBCAD 2025 Certified GIS Data - Shapefiles Only/CamaSummary/CamaSummary.dbf";
const overlayPath = path.join(projectRoot, "data", "processed", "fort-bend-parcels-overlay.js");
const outputPath = path.join(projectRoot, "data", "processed", "fort-bend-owner-enrichment.js");

const ownerFields = [
  "UID",
  "CAD_Refere",
  "Property_N",
  "X_Referenc",
  "Instrument",
  "Map_Number",
  "Owner_Name",
  "Owner_Addr",
  "Owner_Ad_1",
  "Owner_Ad_2",
  "Owner_City",
  "Owner_Stat",
  "Owner_Zip",
  "Total_Valu",
  "Land_Value",
  "Situs",
  "Legal",
];

function loadTopParcelIds(limit = 10) {
  const text = fs.readFileSync(overlayPath, "utf8");
  const match = text.match(/const fortBendParcelOverlay = (.*);\n?$/s);
  if (!match) throw new Error("Could not parse fort-bend-parcels-overlay.js");
  const overlay = JSON.parse(match[1]);
  return overlay.parcels.slice(0, limit).map((parcel) => Number(parcel.id.replace("fbcad_", "")));
}

function parseFields(buffer, headerLen) {
  const fields = [];
  let cursor = 1;
  for (let offset = 32; offset < headerLen - 1; offset += 32) {
    const name = buffer.slice(offset, offset + 11).toString("ascii").replace(/\0/g, "").trim();
    if (!name) continue;
    const length = buffer[offset + 16];
    fields.push({ name, start: cursor, length });
    cursor += length;
  }
  return fields;
}

function parseNumber(value) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseRecord(record, fields) {
  const output = {};
  for (const field of fields) {
    if (!ownerFields.includes(field.name)) continue;
    const raw = record.slice(field.start, field.start + field.length).toString("utf8").trim();
    output[field.name] = field.name.includes("Valu") ? parseNumber(raw) : raw;
  }
  return output;
}

async function extractRecords(targetIds) {
  const targets = new Set(targetIds);
  const maxTarget = Math.max(...targetIds);
  const records = {};
  const unzip = spawn("unzip", ["-p", zipPath, dbfPath]);

  let buffer = Buffer.alloc(0);
  let headerLen = null;
  let recordLen = null;
  let fields = null;
  let recordIndex = 0;

  return new Promise((resolve, reject) => {
    unzip.on("error", reject);
    unzip.stderr.on("data", (chunk) => process.stderr.write(chunk));
    unzip.stdout.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (headerLen === null && buffer.length >= 32) {
        headerLen = buffer.readUInt16LE(8);
        recordLen = buffer.readUInt16LE(10);
      }
      if (headerLen !== null && fields === null && buffer.length >= headerLen) {
        fields = parseFields(buffer, headerLen);
        buffer = buffer.slice(headerLen);
      }
      while (fields && buffer.length >= recordLen) {
        recordIndex += 1;
        const record = buffer.slice(0, recordLen);
        buffer = buffer.slice(recordLen);
        if (targets.has(recordIndex)) {
          records[`fbcad_${recordIndex}`] = parseRecord(record, fields);
          if (Object.keys(records).length === targets.size || recordIndex >= maxTarget) {
            unzip.kill();
            resolve(records);
            return;
          }
        }
      }
    });
    unzip.on("close", () => resolve(records));
  });
}

function entityType(ownerName) {
  if (!ownerName) return "unknown";
  if (/\b(STATE OF|COUNTY|CITY OF|AUTHORITY|DISTRICT)\b/i.test(ownerName)) {
    return "public_or_government";
  }
  if (/\b(LLC|LP|LTD|INC|CORP|CO\.?|COMPANY|TRUST|PARTNERS|HOLDINGS|VENTURES|INVESTMENTS|FOUNDATION|ESTATE|PARTNERSHIP)\b/i.test(ownerName)) {
    return "entity";
  }
  return "individual_or_family";
}

function normalizeRecord(record) {
  const ownerName = record.Owner_Name || "Unknown owner";
  return {
    uid: record.UID,
    cadReference: record.CAD_Refere,
    propertyNumber: record.Property_N,
    xReference: record.X_Referenc,
    instrument: record.Instrument,
    mapNumber: record.Map_Number,
    ownerName,
    entityType: entityType(ownerName),
    mailingAddress: [record.Owner_Addr, record.Owner_Ad_1, record.Owner_Ad_2].filter(Boolean).join(", "),
    mailingCity: record.Owner_City,
    mailingState: record.Owner_Stat,
    mailingZip: record.Owner_Zip,
    situs: record.Situs,
    legal: record.Legal,
    landValue: record.Land_Value,
    totalValue: record.Total_Valu,
    source: "FBCAD 2025 Certified GIS CamaSummary DBF",
  };
}

async function main() {
  const targetIds = loadTopParcelIds(10);
  const rawRecords = await extractRecords(targetIds);
  const owners = Object.fromEntries(
    Object.entries(rawRecords).map(([parcelId, record]) => [parcelId, normalizeRecord(record)])
  );
  fs.writeFileSync(
    outputPath,
    `const fortBendOwnerEnrichment = ${JSON.stringify({ generatedAt: new Date().toISOString(), owners }, null, 2)};\n`,
    "utf8"
  );
  console.log(`Wrote ${Object.keys(owners).length} owner records to ${path.relative(projectRoot, outputPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
