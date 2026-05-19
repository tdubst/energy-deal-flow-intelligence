import { owners } from "../../data";
import { formatAcres, formatMoney, formatPct, titleCase } from "../../services/formatters";
import type { MapHover } from "../../types";

export const HoverPanel = ({ hover }: { hover: MapHover | null }) => {
  if (!hover) return null;
  const position = hover.position;

  if (hover.type === "project") {
    const project = hover.project;
    return (
      <div className="hover-panel hover-panel--compact" style={{ left: Math.min(position.x + 22, window.innerWidth - 340), top: Math.max(position.y - 40, 80) }}>
        <div className="hover-title">
          <strong>{project.name}</strong>
          <span>{project.type}</span>
        </div>
        <div className="hover-grid">
          <span>County</span>
          <strong>{project.county}</strong>
          <span>Capacity</span>
          <strong>{project.mw} MW</strong>
          <span>POI</span>
          <strong>{project.poi}</strong>
          <span>Stage</span>
          <strong>{project.stage}</strong>
        </div>
      </div>
    );
  }

  if (hover.type === "transmission") {
    const line = hover.line;
    return (
      <div className="hover-panel hover-panel--compact" style={{ left: Math.min(position.x + 22, window.innerWidth - 340), top: Math.max(position.y - 40, 80) }}>
        <div className="hover-title">
          <strong>{line.voltage}kV Transmission</strong>
          <span>{line.inferred === "Y" ? "Inferred" : "Reported"}</span>
        </div>
        <div className="hover-owner">{line.owner}</div>
      </div>
    );
  }

  if (hover.type === "flood") {
    const zone = hover.zone;
    return (
      <div className="hover-panel hover-panel--compact" style={{ left: Math.min(position.x + 22, window.innerWidth - 340), top: Math.max(position.y - 40, 80) }}>
        <div className="hover-title">
          <strong>FEMA Flood Zone {zone.femaZone ?? "Unknown"}</strong>
          <span>{titleCase(zone.risk)}</span>
        </div>
        <div className="hover-grid">
          <span>SFHA</span>
          <strong>{zone.sfha || "N/A"}</strong>
          <span>Subtype</span>
          <strong>{zone.zoneSubtype || "None"}</strong>
          <span>Source</span>
          <strong>FEMA NFHL</strong>
        </div>
      </div>
    );
  }

  const parcel = hover.parcel;
  const owner = owners.find((entity) => entity.parcelId === parcel.id);
  const ownerName = parcel.owner ?? owner?.owner ?? "Owner enrichment pending";

  return (
    <div className="hover-panel" style={{ left: Math.min(position.x + 22, window.innerWidth - 340), top: Math.max(position.y - 40, 80) }}>
      <div className="hover-title">
        <strong>{parcel.id.toUpperCase()}</strong>
        <span>{titleCase(parcel.ownerBucket)}</span>
      </div>
      <div className="hover-owner">{ownerName}</div>
      <div className="hover-grid">
        <span>Acreage</span>
        <strong>{formatAcres(parcel.acres)}</strong>
        <span>Score</span>
        <strong>{parcel.score}</strong>
        <span>345kV Proximity</span>
        <strong>{parcel.nearest345Miles.toFixed(2)} mi</strong>
        <span>Buildable</span>
        <strong>{formatAcres(parcel.developableAcres)} / {formatPct(parcel.buildabilityFactor)}</strong>
        <span>Flood Risk</span>
        <strong>{titleCase(parcel.floodRisk)}</strong>
        <span>Estimated Upside</span>
        <strong>{formatMoney(parcel.screeningUpsideBaseM)}</strong>
        <span>Source</span>
        <strong>{parcel.sourceName ?? "County parcel overlay"}</strong>
      </div>
      <p>
        Strategic fit: {parcel.nearest345Miles < 1 ? "near-grid land-control target" : "secondary assembly watch"}.
      </p>
    </div>
  );
};
