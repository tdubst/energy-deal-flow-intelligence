export type OwnerBucket = "single_or_large" | "assembly" | "fragmented";
export type FloodRisk = "low" | "moderate" | "high";
export type DiligenceStatus =
  | "Signal Detected"
  | "Screened"
  | "Ownership Verified"
  | "Outreach Ready"
  | "Active Diligence";
export type DiligencePriority = "High" | "Medium" | "Low";
export type LayerGroup = "Infrastructure" | "Risk" | "Opportunity" | "Development";
export type MapScope = "selected" | "all-opportunities" | "texas";

export interface Point {
  lng: number;
  lat: number;
}

export interface Parcel {
  id: string;
  county?: string;
  sourceParcelId?: string;
  owner?: string;
  landValue?: number;
  acres: number;
  score: number;
  ownerBucket: OwnerBucket;
  centroid: [number, number];
  nearest345Miles: number;
  points: [number, number][];
  floodRisk: FloodRisk;
  floodOverlapPct: number;
  highFloodOverlapPct: number;
  moderateFloodOverlapPct: number;
  developableAcres: number;
  buildabilityFactor: number;
  screeningUpsideLowM: number;
  screeningUpsideBaseM: number;
  screeningUpsideHighM: number;
  sourceName?: string;
  sourceUrl?: string;
  fetchDate?: string;
}

export interface QueueProject {
  id: string;
  name: string;
  type: "BESS" | "Solar" | "Wind" | "Gas" | "Data Center";
  county: string;
  mw: number;
  stage: string;
  poi: string;
  voltageKv: number;
  interconnectionDate: string;
  owner: string;
  coordinates: [number, number];
  score: number;
  narrative: string;
}

export interface TransmissionLine {
  id: string;
  voltage: number;
  owner: string;
  inferred: "Y" | "N";
  points: [number, number][];
}

export interface FloodZone {
  id: string;
  corridor?: string;
  risk: FloodRisk;
  femaZone?: string;
  zoneSubtype?: string;
  sfha?: string;
  overlapPct: number;
  highOverlapPct: number;
  points: [number, number][];
  sourceName?: string;
  sourceUrl?: string;
  fetchDate?: string;
}

export interface OwnerEntity {
  parcelId: string;
  owner: string;
  ownerType: "public" | "foundation" | "private" | "corporate" | "unknown";
  fragmentation: OwnerBucket;
  callComplexity: string;
}

export interface Opportunity {
  id: string;
  title: string;
  corridor: string;
  geography: string;
  thesis: string;
  primaryProjectId: string;
  parcelIds: string[];
  score: number;
  valueCreationM: number;
  leadIndicator: string;
  timelineMonths: number;
  risks: string[];
  nextActions: string[];
}

export interface LayerSetting {
  id: string;
  label: string;
  group: LayerGroup;
  enabled: boolean;
  opacity: number;
  description: string;
}

export interface DiligenceItem {
  id: string;
  opportunityId: string;
  label: string;
  owner: string;
  status: DiligenceStatus;
  priority: DiligencePriority;
  score: number;
  readiness: number;
  pinned: boolean;
  notes: string;
  riskFlags: string[];
}

export interface OverlayPayload {
  aoi?: {
    name: string;
    center: { lng: number; lat: number };
    radiusMiles: number;
    maxParcels: number;
  };
  parcels?: Parcel[];
  lines?: TransmissionLine[];
  zones?: FloodZone[];
  sourceCount?: number;
}

export type MapHover =
  | { type: "parcel"; parcel: Parcel; position: { x: number; y: number } }
  | { type: "project"; project: QueueProject; position: { x: number; y: number } }
  | { type: "transmission"; line: TransmissionLine; position: { x: number; y: number } }
  | { type: "flood"; zone: FloodZone; position: { x: number; y: number } };
