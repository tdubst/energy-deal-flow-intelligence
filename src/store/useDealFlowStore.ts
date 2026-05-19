import { useMemo, useState } from "react";
import { diligenceDefaults, layerDefaults, opportunities } from "../data";
import type { DiligenceItem, DiligenceStatus, LayerSetting, MapScope, Opportunity, Point } from "../types";

export interface DealFlowStore {
  selectedOpportunity: Opportunity;
  setSelectedOpportunityId: (id: string) => void;
  selectedProjectId: string;
  mapCenter: Point;
  setMapCenter: (center: Point) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  mapScope: MapScope;
  setMapScope: (scope: MapScope) => void;
  layers: LayerSetting[];
  setLayerEnabled: (id: string, enabled: boolean) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  diligenceItems: DiligenceItem[];
  updateDiligenceItem: (id: string, patch: Partial<DiligenceItem>) => void;
  addDiligenceItem: (item: DiligenceItem) => void;
  queueFilter: DiligenceStatus | "All";
  setQueueFilter: (status: DiligenceStatus | "All") => void;
  queueSort: "Priority" | "Score" | "Readiness";
  setQueueSort: (sort: "Priority" | "Score" | "Readiness") => void;
  insightMode: boolean;
  setInsightMode: (enabled: boolean) => void;
  insightStep: number;
  setInsightStep: (step: number) => void;
}

const opportunityCenters: Record<string, Point> = {
  "fort-bend-corridor": { lng: -95.71, lat: 29.55 },
  "navarro-corsicana-corridor": { lng: -96.47, lat: 32.09 },
};

export const useDealFlowStore = (): DealFlowStore => {
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(opportunities[0].id);
  const [mapCenter, setMapCenter] = useState<Point>(opportunityCenters[opportunities[0].id]);
  const [zoom, setZoom] = useState(7.1);
  const [mapScope, setMapScope] = useState<MapScope>("selected");
  const [layers, setLayers] = useState(layerDefaults);
  const [diligenceItems, setDiligenceItems] = useState(diligenceDefaults);
  const [queueFilter, setQueueFilter] = useState<DiligenceStatus | "All">("All");
  const [queueSort, setQueueSort] = useState<"Priority" | "Score" | "Readiness">("Priority");
  const [insightMode, setInsightMode] = useState(false);
  const [insightStep, setInsightStep] = useState(0);

  const selectedOpportunity = useMemo(
    () => opportunities.find((opportunity) => opportunity.id === selectedOpportunityId) ?? opportunities[0],
    [selectedOpportunityId],
  );

  const selectOpportunity = (id: string) => {
    setSelectedOpportunityId(id);
    setMapScope("selected");
    setMapCenter(opportunityCenters[id] ?? opportunityCenters[opportunities[0].id]);
    setZoom(id === "fort-bend-corridor" ? 7.1 : 6.2);
  };

  return {
    selectedOpportunity,
    selectedProjectId: selectedOpportunity.primaryProjectId,
    setSelectedOpportunityId: selectOpportunity,
    mapCenter,
    setMapCenter,
    zoom,
    setZoom,
    mapScope,
    setMapScope,
    layers,
    setLayerEnabled: (id, enabled) =>
      setLayers((current) => current.map((layer) => (layer.id === id ? { ...layer, enabled } : layer))),
    setLayerOpacity: (id, opacity) =>
      setLayers((current) => current.map((layer) => (layer.id === id ? { ...layer, opacity } : layer))),
    diligenceItems,
    addDiligenceItem: (item) =>
      setDiligenceItems((current) => {
        if (current.some((existing) => existing.id === item.id)) {
          return current.map((existing) => (existing.id === item.id ? { ...existing, ...item, pinned: true } : existing));
        }
        return [item, ...current];
      }),
    updateDiligenceItem: (id, patch) =>
      setDiligenceItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item))),
    queueFilter,
    setQueueFilter,
    queueSort,
    setQueueSort,
    insightMode,
    setInsightMode,
    insightStep,
    setInsightStep,
  };
};
