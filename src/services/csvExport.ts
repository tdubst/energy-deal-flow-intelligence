import type { DiligenceItem, Opportunity, Parcel } from "../types";

const download = (filename: string, rows: string[]) => {
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const csv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export const exportParcels = (parcels: Parcel[]) => {
  const rows = [
    ["parcel_id", "county", "owner", "acres", "score", "owner_bucket", "flood_risk", "nearest_345_miles", "base_upside_m", "source_name", "fetch_date"].map(csv).join(","),
    ...parcels.map((p) =>
      [p.id, p.county, p.owner, p.acres, p.score, p.ownerBucket, p.floodRisk, p.nearest345Miles, p.screeningUpsideBaseM, p.sourceName, p.fetchDate].map(csv).join(","),
    ),
  ];
  download("energy-deal-flow-parcels.csv", rows);
};

export const exportDiligenceQueue = (items: DiligenceItem[]) => {
  const rows = [
    ["item", "owner", "status", "priority", "score", "readiness", "notes"].map(csv).join(","),
    ...items.map((item) =>
      [item.label, item.owner, item.status, item.priority, item.score, item.readiness, item.notes].map(csv).join(","),
    ),
  ];
  download("energy-deal-flow-diligence-queue.csv", rows);
};

export const renderOpportunityReport = (opportunity: Opportunity, parcels: Parcel[]) => {
  const parcelLines = parcels
    .map((p) => `- ${p.id}: ${p.owner ?? "owner pending"}, ${p.acres.toFixed(0)} acres, score ${p.score}, ${p.nearest345Miles.toFixed(2)} mi to 345kV, ${p.sourceName ?? "source-backed overlay"}`)
    .join("\n");
  return `# ${opportunity.title}

## Thesis
${opportunity.thesis}

## Signal
${opportunity.leadIndicator}. ${opportunity.timelineMonths}-month lead indicator.

## Estimated Value
$${opportunity.valueCreationM}M screening value creation.

## Parcel Screen
${parcelLines || "- Parcel layer pending for this corridor."}

## Risks
${opportunity.risks.map((risk) => `- ${risk}`).join("\n")}

## Source Standard
Parcel, flood, and transmission overlays preserve source names, fetch dates, and generated JSON outputs for client diligence traceability.

## Next Actions
${opportunity.nextActions.map((action) => `- ${action}`).join("\n")}
`;
};
