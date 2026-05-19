import { assets, fortBendOwnerEnrichment, fortBendParcelOverlay } from "../data";
import type { AppFilters, OwnerEntity, Parcel, QueueParcelCandidate, QueueProject } from "../types";

export function filterProjects(filters: AppFilters) {
  const query = filters.search.trim().toLowerCase();
  return assets
    .filter((asset) => filters.zone === "all" || asset.zone === filters.zone)
    .filter((asset) => asset.score >= filters.minScore)
    .filter((asset) => !filters.iaOnly || asset.ia)
    .filter((asset) => !filters.dcOnly || asset.demand.toLowerCase().includes("data center"))
    .filter((asset) => !filters.tellMode || (Number(asset.voltage) >= 345 && Boolean(asset.ia)))
    .filter((asset) => {
      if (!query) return true;
      return [asset.name, asset.county, asset.developer, asset.poi, asset.queueId].some((value) =>
        String(value).toLowerCase().includes(query),
      );
    })
    .sort((a, b) => b.score - a.score || b.mw - a.mw);
}

export function selectedProjectOrFallback(selectedId: string, projects: QueueProject[]) {
  return projects.find((asset) => asset.id === selectedId) ?? projects[0] ?? assets[0];
}

export function parcelCandidates(asset: QueueProject): QueueParcelCandidate[] {
  if (asset.county === "Fort Bend") {
    return fortBendParcelOverlay.map((parcel) => ({ ...parcel, assetId: asset.id, assetName: asset.name }));
  }

  return Array.from({ length: 5 }).map((_, index) => ({
    id: `${asset.id}-parcel-${index + 1}`,
    assetId: asset.id,
    assetName: asset.name,
    acres: Math.round(170 + asset.mw * 0.85 + index * 38),
    score: Math.max(38, Math.min(92, asset.score - index * 6 + (index === 0 ? 5 : 0))),
    ownerBucket: index < 2 ? "single" : index < 4 ? "fragmented" : "complex",
    centroid: [asset.lng + (index - 2) * 0.038, asset.lat + (index % 2 ? 0.027 : -0.025)],
    nearest345Miles: Number((0.7 + index * 0.55).toFixed(1)),
    points: [
      [asset.lng - 0.036 + index * 0.014, asset.lat - 0.025],
      [asset.lng + 0.02 + index * 0.014, asset.lat - 0.016],
      [asset.lng + 0.029 + index * 0.014, asset.lat + 0.033],
      [asset.lng - 0.026 + index * 0.014, asset.lat + 0.025],
    ],
    floodRisk: index === 0 ? "Low" : index < 4 ? "Moderate" : "High",
    floodOverlapPct: index * 7,
    highFloodOverlapPct: index > 3 ? 9 : 0,
    moderateFloodOverlapPct: index * 5,
    developableAcres: Math.round((170 + asset.mw * 0.85 + index * 38) * (0.9 - index * 0.05)),
    buildabilityFactor: Number((0.9 - index * 0.05).toFixed(2)),
    screeningUpsideLowM: Math.round((asset.score * asset.mw) / 1600 - index * 1.1),
    screeningUpsideBaseM: Math.round((asset.score * asset.mw) / 1040 - index * 1.4),
    screeningUpsideHighM: Math.round((asset.score * asset.mw) / 760 - index * 1.7),
  }));
}

export function ownerForParcel(parcelId: string): OwnerEntity | undefined {
  return fortBendOwnerEnrichment.find((owner) => owner.parcelId === parcelId);
}

export function topParcels(asset: QueueProject) {
  return parcelCandidates(asset)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

export function summaryStats(projects: QueueProject[]) {
  const totalMw = projects.reduce((sum, asset) => sum + asset.mw, 0);
  const highScore = projects.filter((asset) => asset.score >= 70).length;
  const iaCount = projects.filter((asset) => Boolean(asset.ia)).length;
  return { totalMw, highScore, iaCount };
}
