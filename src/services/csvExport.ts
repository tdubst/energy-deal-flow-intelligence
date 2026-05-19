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

## Executive Summary
Battery tells you where. Ownership tells you whether you can close.

${opportunity.thesis}

## Why This Corridor Matters Now
${opportunity.leadIndicator}. The signal is strongest when BESS/storage activity, 345kV transmission proximity, parcel scale, flood risk, and owner/entity diligence converge before headline demand reprices the corridor.

## Signal Stack
- Signal: BESS / storage queue activity.
- Corridor: transmission-proven 345kV context.
- Parcel: screened parcel universe with acreage, proximity, flood risk, and upside.
- Ownership: owner/entity enrichment and call complexity.
- Action: diligence-ready owner/outreach workflow.

## Investment Thesis
Convert queue intelligence into owner-verified land-control diligence before the broader market prices the corridor.

## Estimated Value
$${opportunity.valueCreationM}M screening value creation.

## Parcel Screen
${parcelLines || "- Parcel layer pending for this corridor."}

## Risks
${opportunity.risks.map((risk) => `- ${risk}`).join("\n")}

## Risk / Mitigation
Validate through source refresh, POI confirmation, owner outreach, FEMA NFHL flood review, and interconnection milestone monitoring.

## Source Standard
Parcel, flood, transmission, and owner/entity overlays preserve source names, fetch dates, and generated JSON outputs for client diligence traceability.

## Next Actions
- Verify owner, confirm POI, begin outreach sequencing.
${opportunity.nextActions.map((action) => `- ${action}`).join("\n")}
`;
};
