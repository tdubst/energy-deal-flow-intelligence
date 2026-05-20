import { memo, useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { type GeoJSONSource, type LngLatBoundsLike, type Map as MapLibreMap, type StyleSpecification } from "maplibre-gl";
import { queueProjects } from "../../data";
import type { DealFlowStore } from "../../store/useDealFlowStore";
import type { FloodZone, MapHover, Parcel, QueueProject, TransmissionLine } from "../../types";
import { HoverPanel } from "./HoverPanel";

const MIN_ZOOM = 4.1;
const MAX_ZOOM = 13.2;
const TEXAS_BOUNDS: LngLatBoundsLike = [
  [-106.75, 25.55],
  [-93.35, 36.65],
];
const TEXAS_CENTER = { lng: -99.95, lat: 31.1 };

const corridorFallbacks = {
  "fort-bend": { center: { lng: -95.71, lat: 29.55 }, zoom: 8.4 },
  navarro: { center: { lng: -96.47, lat: 32.09 }, zoom: 8 },
};

const darkInstitutionalStyle: StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    "carto-dark": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    },
  },
  layers: [
    {
      id: "carto-dark",
      type: "raster",
      source: "carto-dark",
      paint: {
        "raster-opacity": 0.72,
        "raster-brightness-min": 0.05,
        "raster-brightness-max": 0.72,
        "raster-saturation": -0.82,
        "raster-contrast": 0.1,
      },
    },
  ],
};

const emptyCollection = (): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: [],
});

const closedRing = (points: [number, number][]) => {
  if (!points.length) return points;
  const first = points[0];
  const last = points[points.length - 1];
  return first[0] === last[0] && first[1] === last[1] ? points : [...points, first];
};

const boundsFromCoordinates = (coordinates: [number, number][]) => {
  if (!coordinates.length) return undefined;
  const bounds = new maplibregl.LngLatBounds(coordinates[0], coordinates[0]);
  coordinates.forEach((coordinate) => bounds.extend(coordinate));
  return bounds;
};

const parcelCollection = (parcels: Parcel[]): GeoJSON.FeatureCollection =>
  ({
    type: "FeatureCollection",
    features: parcels.map((parcel) => ({
      type: "Feature",
      id: parcel.id,
      properties: {
        id: parcel.id,
        ownerBucket: parcel.ownerBucket,
        score: parcel.score,
        acres: parcel.acres,
      },
      geometry: {
        type: "Polygon",
        coordinates: [closedRing(parcel.points)],
      },
    })),
  }) as GeoJSON.FeatureCollection;

const floodCollection = (zones: FloodZone[]): GeoJSON.FeatureCollection =>
  ({
    type: "FeatureCollection",
    features: zones.map((zone) => ({
      type: "Feature",
      id: zone.id,
      properties: {
        id: zone.id,
        risk: zone.risk,
        zone: zone.femaZone ?? "Unknown",
      },
      geometry: {
        type: "Polygon",
        coordinates: [closedRing(zone.points)],
      },
    })),
  }) as GeoJSON.FeatureCollection;

const transmissionCollection = (lines: TransmissionLine[]): GeoJSON.FeatureCollection =>
  ({
    type: "FeatureCollection",
    features: lines.map((line) => ({
      type: "Feature",
      id: line.id,
      properties: {
        id: line.id,
        voltage: line.voltage,
        owner: line.owner,
        inferred: line.inferred,
      },
      geometry: {
        type: "LineString",
        coordinates: line.points,
      },
    })),
  }) as GeoJSON.FeatureCollection;

const projectCollection = (projects: QueueProject[]): GeoJSON.FeatureCollection =>
  ({
    type: "FeatureCollection",
    features: projects.map((project) => ({
      type: "Feature",
      id: project.id,
      properties: {
        id: project.id,
        name: project.name,
        type: project.type,
        mw: project.mw,
      },
      geometry: {
        type: "Point",
        coordinates: project.coordinates,
      },
    })),
  }) as GeoJSON.FeatureCollection;

const flowCoordinates = {
  "fort-bend": [
    [
      [-95.71, 29.55],
      [-95.64, 29.62],
      [-95.45, 29.75],
    ],
    [
      [-95.78, 29.52],
      [-95.71, 29.55],
      [-95.58, 29.7],
    ],
  ],
  navarro: [
    [
      [-96.47, 32.09],
      [-96.32, 32.23],
      [-96.04, 32.55],
    ],
    [
      [-96.58, 32],
      [-96.47, 32.09],
      [-96.29, 32.42],
    ],
  ],
} satisfies Record<"fort-bend" | "navarro", [number, number][][]>;

const flowCollection = (corridor: "fort-bend" | "navarro", scope: DealFlowStore["mapScope"]): GeoJSON.FeatureCollection => {
  const corridors = scope === "selected" ? [corridor] : (["fort-bend", "navarro"] as const);
  return {
    type: "FeatureCollection",
    features: corridors.flatMap((item) =>
      flowCoordinates[item].map((coordinates, index) => ({
        type: "Feature" as const,
        id: `${item}-${index}`,
        properties: { id: `${item}-${index}` },
        geometry: { type: "LineString" as const, coordinates },
      })),
    ),
  };
};

const getSource = (map: MapLibreMap, id: string) => map.getSource(id) as GeoJSONSource | undefined;

const setSourceData = (map: MapLibreMap, id: string, data: GeoJSON.FeatureCollection) => {
  getSource(map, id)?.setData(data);
};

const setLayerVisibility = (map: MapLibreMap, id: string, visible: boolean) => {
  if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
};

const setLayerPaint = (map: MapLibreMap, id: string, property: string, value: unknown) => {
  if (map.getLayer(id)) map.setPaintProperty(id, property, value);
};

const clampOpacity = (value: number) => Math.max(0, Math.min(1, value));

const MapViewportBase = ({
  store,
  overlays,
}: {
  store: DealFlowStore;
  overlays: {
    parcels: Parcel[];
    fortBendParcels: Parcel[];
    navarroParcels: Parcel[];
    transmission: TransmissionLine[];
    floodZones: FloodZone[];
    loading: boolean;
    error: string | null;
  };
}) => {
  const [hover, setHover] = useState<MapHover | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const parcelLookupRef = useRef(new Map<string, Parcel>());
  const projectLookupRef = useRef(new Map<string, QueueProject>());
  const lineLookupRef = useRef(new Map<string, TransmissionLine>());
  const floodLookupRef = useRef(new Map<string, FloodZone>());
  const layer = (id: string) => store.layers.find((item) => item.id === id);
  const corridor = store.selectedOpportunity.id === "navarro-corsicana-corridor" ? "navarro" : "fort-bend";
  const scopeLabel = store.mapScope === "selected" ? "Selected corridor" : store.mapScope === "all-opportunities" ? "All opportunities" : "Texas context";

  const visibleProjects = useMemo(() => {
    if (store.mapScope !== "selected") return queueProjects;
    if (store.selectedOpportunity.id === "navarro-corsicana-corridor") return queueProjects.filter((project) => project.id === "navarro-bess");
    return queueProjects.filter((project) => project.county === "Fort Bend");
  }, [store.mapScope, store.selectedOpportunity.id]);

  const visibleParcels = useMemo(() => {
    if (store.mapScope !== "selected") return overlays.parcels;
    if (store.selectedOpportunity.id === "navarro-corsicana-corridor") return overlays.navarroParcels;
    return overlays.fortBendParcels;
  }, [overlays.fortBendParcels, overlays.navarroParcels, overlays.parcels, store.mapScope, store.selectedOpportunity.id]);

  const visibleFloodZones = useMemo(() => {
    if (store.mapScope !== "selected") return overlays.floodZones;
    return overlays.floodZones.filter((zone) => zone.corridor === corridor || !zone.corridor);
  }, [corridor, overlays.floodZones, store.mapScope]);

  const visibleTransmission = useMemo(() => {
    const bounds =
      store.mapScope === "texas"
        ? { west: -106.8, east: -93.1, south: 25.4, north: 36.8, limit: 260 }
        : store.mapScope === "all-opportunities"
          ? { west: -97.1, east: -95.1, south: 29.1, north: 32.9, limit: 220 }
          : corridor === "navarro"
            ? { west: -97.05, east: -95.85, south: 31.55, north: 32.85, limit: 140 }
            : { west: -96.25, east: -95.15, south: 29.15, north: 30.05, limit: 120 };
    return overlays.transmission
      .filter((line) => line.points.some(([lng, lat]) => lng >= bounds.west && lng <= bounds.east && lat >= bounds.south && lat <= bounds.north))
      .slice(0, bounds.limit);
  }, [corridor, overlays.transmission, store.mapScope]);

  const renderedFloodCount = Math.min(visibleFloodZones.length, store.zoom > 6.8 ? 120 : 70);
  const activeLayerDiagnostics = [
    { id: "projects", label: "Projects", count: visibleProjects.length, enabled: layer("projects")?.enabled },
    { id: "parcels", label: "Parcels", count: visibleParcels.length, enabled: layer("parcels")?.enabled },
    { id: "flood", label: "Flood", count: renderedFloodCount, enabled: layer("flood")?.enabled },
    { id: "transmission", label: "Lines", count: visibleTransmission.length, enabled: layer("transmission")?.enabled },
  ];
  const emptyEnabledLayers = activeLayerDiagnostics.filter((item) => item.enabled && item.count === 0);

  useEffect(() => {
    parcelLookupRef.current = new Map(visibleParcels.map((parcel) => [parcel.id, parcel]));
    projectLookupRef.current = new Map(visibleProjects.map((project) => [project.id, project]));
    lineLookupRef.current = new Map(visibleTransmission.map((line) => [line.id, line]));
    floodLookupRef.current = new Map(visibleFloodZones.map((zone) => [zone.id, zone]));
  }, [visibleFloodZones, visibleParcels, visibleProjects, visibleTransmission]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: darkInstitutionalStyle,
      center: [corridorFallbacks["fort-bend"].center.lng, corridorFallbacks["fort-bend"].center.lat],
      zoom: corridorFallbacks["fort-bend"].zoom,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
    });
    mapRef.current = map;
    map.scrollZoom.enable();
    map.doubleClickZoom.enable();
    map.dragPan.enable();
    map.touchZoomRotate.enable({ around: "center" });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => {
      map.addSource("flood-zones", { type: "geojson", data: emptyCollection() });
      map.addSource("transmission-lines", { type: "geojson", data: emptyCollection() });
      map.addSource("energy-flows", { type: "geojson", data: emptyCollection() });
      map.addSource("parcels", { type: "geojson", data: emptyCollection() });
      map.addSource("projects", { type: "geojson", data: emptyCollection() });

      map.addLayer({
        id: "flood-fill",
        type: "fill",
        source: "flood-zones",
        minzoom: 5.2,
        paint: {
          "fill-color": ["match", ["get", "risk"], "high", "#2563eb", "moderate", "#3b82f6", "#1d4ed8"],
          "fill-opacity": 0.22,
        },
      });
      map.addLayer({
        id: "flood-outline",
        type: "line",
        source: "flood-zones",
        minzoom: 5.2,
        paint: {
          "line-color": "rgba(96,165,250,0.42)",
          "line-width": 0.8,
          "line-opacity": 0.55,
        },
      });
      map.addLayer({
        id: "transmission-glow",
        type: "line",
        source: "transmission-lines",
        paint: {
          "line-color": "#14f1b2",
          "line-width": ["interpolate", ["linear"], ["zoom"], 4, 1.4, 8, 3.2, 12, 5.5],
          "line-opacity": 0.16,
          "line-blur": 5,
        },
      });
      map.addLayer({
        id: "transmission-line",
        type: "line",
        source: "transmission-lines",
        paint: {
          "line-color": ["case", [">=", ["get", "voltage"], 345], "#2dd4bf", "#60a5fa"],
          "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.7, 8, 1.6, 12, 3],
          "line-opacity": 0.72,
        },
      });
      map.addLayer({
        id: "energy-flow",
        type: "line",
        source: "energy-flows",
        minzoom: 5.4,
        paint: {
          "line-color": "#f59e0b",
          "line-width": ["interpolate", ["linear"], ["zoom"], 5, 1.6, 9, 3],
          "line-dasharray": [2, 2],
          "line-opacity": 0.72,
        },
      });
      map.addLayer({
        id: "parcel-fill",
        type: "fill",
        source: "parcels",
        minzoom: 7,
        paint: {
          "fill-color": ["match", ["get", "ownerBucket"], "single_or_large", "#10b981", "assembly", "#f59e0b", "fragmented", "#fb7185", "#2dd4bf"],
          "fill-opacity": 0.17,
        },
      });
      map.addLayer({
        id: "parcel-outline",
        type: "line",
        source: "parcels",
        minzoom: 7,
        paint: {
          "line-color": ["match", ["get", "ownerBucket"], "single_or_large", "#34d399", "assembly", "#f59e0b", "fragmented", "#fb7185", "#2dd4bf"],
          "line-width": ["interpolate", ["linear"], ["zoom"], 7, 0.8, 10, 1.6, 13, 2.4],
          "line-opacity": 0.82,
        },
      });
      map.addLayer({
        id: "parcel-labels",
        type: "symbol",
        source: "parcels",
        minzoom: 9.5,
        layout: {
          "text-field": ["concat", ["to-string", ["get", "score"]], "% / ", ["to-string", ["round", ["get", "acres"]]], " ac"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 11,
        },
        paint: {
          "text-color": "#f8fafc",
          "text-halo-color": "rgba(2,6,23,0.92)",
          "text-halo-width": 1.4,
        },
      });
      map.addLayer({
        id: "project-halo",
        type: "circle",
        source: "projects",
        paint: {
          "circle-color": ["case", ["==", ["get", "type"], "Data Center"], "#22d3ee", "#f59e0b"],
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 13, 8, 20, 12, 30],
          "circle-opacity": 0.12,
          "circle-stroke-color": ["case", ["==", ["get", "type"], "Data Center"], "#22d3ee", "#f59e0b"],
          "circle-stroke-width": 2,
          "circle-stroke-opacity": 0.42,
        },
      });
      map.addLayer({
        id: "project-circle",
        type: "circle",
        source: "projects",
        paint: {
          "circle-color": ["case", ["==", ["get", "type"], "Data Center"], "#22d3ee", "#f59e0b"],
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 5, 8, 8, 12, 12],
          "circle-stroke-color": "#f8fafc",
          "circle-stroke-width": 1.2,
          "circle-opacity": 0.96,
        },
      });
      map.addLayer({
        id: "project-labels",
        type: "symbol",
        source: "projects",
        minzoom: 6.2,
        layout: {
          "text-field": ["concat", ["get", "name"], " · ", ["to-string", ["get", "mw"]], " MW"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 11,
          "text-offset": [1.3, 0],
          "text-anchor": "left",
        },
        paint: {
          "text-color": "#f8fafc",
          "text-halo-color": "rgba(2,6,23,0.94)",
          "text-halo-width": 1.6,
        },
      });

      setMapReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const syncView = () => {
      const center = map.getCenter();
      store.setMapCenter({ lng: center.lng, lat: center.lat });
      store.setZoom(Number(map.getZoom().toFixed(2)));
    };
    map.on("moveend", syncView);
    map.on("zoomend", syncView);
    return () => {
      map.off("moveend", syncView);
      map.off("zoomend", syncView);
    };
  }, [mapReady, store]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    setSourceData(map, "parcels", parcelCollection(visibleParcels));
    setSourceData(map, "flood-zones", floodCollection(visibleFloodZones));
    setSourceData(map, "transmission-lines", transmissionCollection(visibleTransmission));
    setSourceData(map, "projects", projectCollection(visibleProjects));
    setSourceData(map, "energy-flows", flowCollection(corridor, store.mapScope));
  }, [corridor, mapReady, store.mapScope, visibleFloodZones, visibleParcels, visibleProjects, visibleTransmission]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const layerIds = {
      flood: ["flood-fill", "flood-outline"],
      transmission: ["transmission-glow", "transmission-line"],
      flows: ["energy-flow"],
      parcels: ["parcel-fill", "parcel-outline", "parcel-labels"],
      projects: ["project-halo", "project-circle", "project-labels"],
    };
    for (const [id, ids] of Object.entries(layerIds)) ids.forEach((layerId) => setLayerVisibility(map, layerId, layer(id)?.enabled ?? true));
    const emphasis = store.insightMode
      ? [
          { flood: 0.12, parcels: 0.08, transmission: 0.45, flows: 0.12, projects: 0.62 },
          { flood: 0.16, parcels: 0.1, transmission: 1, flows: 0.74, projects: 0.55 },
          { flood: 0.1, parcels: 0.12, transmission: 0.68, flows: 1, projects: 1 },
          { flood: 0.4, parcels: 1, transmission: 0.48, flows: 0.18, projects: 0.52 },
          { flood: 0.34, parcels: 1, transmission: 0.24, flows: 0.12, projects: 0.38 },
        ][store.insightStep] ?? { flood: 0.18, parcels: 0.3, transmission: 0.5, flows: 0.3, projects: 0.6 }
      : { flood: 1, parcels: 1, transmission: 1, flows: 1, projects: 1 };
    setLayerPaint(map, "carto-dark", "raster-opacity", store.insightMode ? 0.48 : 0.72);
    setLayerPaint(map, "flood-fill", "fill-opacity", clampOpacity((layer("flood")?.opacity ?? 1) * 0.42 * emphasis.flood));
    setLayerPaint(map, "flood-outline", "line-opacity", clampOpacity((layer("flood")?.opacity ?? 1) * 0.72 * emphasis.flood));
    setLayerPaint(map, "transmission-glow", "line-opacity", clampOpacity((layer("transmission")?.opacity ?? 1) * 0.18 * emphasis.transmission));
    setLayerPaint(map, "transmission-line", "line-opacity", clampOpacity((layer("transmission")?.opacity ?? 1) * 0.86 * emphasis.transmission));
    setLayerPaint(map, "energy-flow", "line-opacity", clampOpacity((layer("flows")?.opacity ?? 1) * 0.82 * emphasis.flows));
    setLayerPaint(map, "parcel-fill", "fill-opacity", clampOpacity((layer("parcels")?.opacity ?? 1) * 0.28 * emphasis.parcels));
    setLayerPaint(map, "parcel-outline", "line-opacity", clampOpacity((layer("parcels")?.opacity ?? 1) * 0.92 * emphasis.parcels));
    setLayerPaint(map, "parcel-labels", "text-opacity", clampOpacity(emphasis.parcels));
    setLayerPaint(map, "project-halo", "circle-opacity", clampOpacity((layer("projects")?.opacity ?? 1) * 0.14 * emphasis.projects));
    setLayerPaint(map, "project-circle", "circle-opacity", clampOpacity((layer("projects")?.opacity ?? 1) * emphasis.projects));
    setLayerPaint(map, "project-labels", "text-opacity", clampOpacity(emphasis.projects));
  }, [mapReady, store.insightMode, store.insightStep, store.layers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const interactiveLayers = ["project-circle", "parcel-fill", "transmission-line", "flood-fill"];
    const handleMove = (event: maplibregl.MapLayerMouseEvent) => {
      map.getCanvas().style.cursor = "pointer";
      const feature = event.features?.[0];
      const id = String(feature?.properties?.id ?? feature?.id ?? "");
      const position = { x: event.point.x, y: event.point.y };
      if (feature?.layer.id === "project-circle") {
        const project = projectLookupRef.current.get(id);
        if (project) setHover({ type: "project", project, position });
      } else if (feature?.layer.id === "parcel-fill") {
        const parcel = parcelLookupRef.current.get(id);
        if (parcel) setHover({ type: "parcel", parcel, position });
      } else if (feature?.layer.id === "transmission-line") {
        const line = lineLookupRef.current.get(id);
        if (line) setHover({ type: "transmission", line, position });
      } else if (feature?.layer.id === "flood-fill") {
        const zone = floodLookupRef.current.get(id);
        if (zone) setHover({ type: "flood", zone, position });
      }
    };
    const handleLeave = () => {
      map.getCanvas().style.cursor = "";
      setHover(null);
    };
    interactiveLayers.forEach((id) => {
      map.on("mousemove", id, handleMove);
      map.on("mouseleave", id, handleLeave);
    });
    return () => {
      interactiveLayers.forEach((id) => {
        map.off("mousemove", id, handleMove);
        map.off("mouseleave", id, handleLeave);
      });
    };
  }, [mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || store.mapScope !== "selected") return;
    const timer = window.setTimeout(() => fitSelectedCorridor(), 60);
    return () => window.clearTimeout(timer);
  }, [mapReady, store.mapScope, store.selectedOpportunity.id]);

  const fitBounds = (coordinates: [number, number][], fallback: { center: { lng: number; lat: number }; zoom: number }, maxZoom = 9.2, duration = 850) => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = boundsFromCoordinates(coordinates);
    if (bounds) {
      map.fitBounds(bounds, { padding: 86, maxZoom, duration });
    } else {
      map.easeTo({ center: fallback.center, zoom: fallback.zoom, duration });
    }
  };

  const fitSelectedCorridor = () => {
    store.setMapScope("selected");
    const fallback = corridorFallbacks[corridor];
    const coordinates = [
      ...visibleParcels.flatMap((parcel) => parcel.points),
      ...visibleFloodZones.flatMap((zone) => zone.points),
      ...visibleTransmission.flatMap((line) => line.points),
      ...visibleProjects.map((project) => project.coordinates),
    ];
    fitBounds(coordinates, fallback, 8.7);
  };

  const fitTexas = () => {
    const map = mapRef.current;
    store.setMapScope("texas");
    if (map) map.fitBounds(TEXAS_BOUNDS, { padding: 56, duration: 950 });
    else {
      store.setMapCenter(TEXAS_CENTER);
      store.setZoom(MIN_ZOOM);
    }
  };

  const fitAllOpportunities = () => {
    store.setMapScope("all-opportunities");
    fitBounds(
      [
        ...overlays.parcels.flatMap((parcel) => parcel.points),
        ...queueProjects.map((project) => project.coordinates),
      ],
      { center: { lng: -96.1, lat: 30.82 }, zoom: 5.2 },
      6,
    );
  };

  const zoomToParcels = () => {
    const parcels = store.mapScope === "selected" ? visibleParcels : overlays.parcels;
    if (!parcels.length) return;
    store.setMapScope("selected");
    fitBounds(parcels.flatMap((parcel) => parcel.points), corridorFallbacks[corridor], 9.6);
  };

  const fitCinematicCorridor = () => {
    store.setMapScope("selected");
    const coordinates = [
      ...visibleTransmission.flatMap((line) => line.points),
      ...visibleProjects.map((project) => project.coordinates),
      ...visibleParcels.slice(0, 24).flatMap((parcel) => parcel.points),
    ];
    fitBounds(coordinates, corridorFallbacks[corridor], 8.45, 1350);
  };

  const fitCinematicSignal = () => {
    store.setMapScope("selected");
    const coordinates = [...visibleProjects.map((project) => project.coordinates), ...visibleTransmission.slice(0, 24).flatMap((line) => line.points)];
    fitBounds(coordinates, corridorFallbacks[corridor], 8.95, 1400);
  };

  const zoomToCinematicParcels = () => {
    const parcels = store.mapScope === "selected" ? visibleParcels : overlays.parcels;
    if (!parcels.length) return;
    store.setMapScope("selected");
    fitBounds(parcels.flatMap((parcel) => parcel.points), corridorFallbacks[corridor], 9.75, 1350);
  };

  const insightSteps = [
    {
      label: "Texas electrification context",
      kicker: "What are we seeing?",
      annotation: "ERCOT demand pressure",
      detail: "Start broad: electrification and private load growth are changing where transmission-adjacent land becomes strategic.",
      why: "The buyer needs to see this as infrastructure intelligence first, not a generic parcel search.",
      implication: "Action: open the map at grid scale, then look for early storage signals.",
      annotations: ["ERCOT demand pressure"],
      action: () => {
        const map = mapRef.current;
        store.setMapScope("texas");
        if (map) map.fitBounds(TEXAS_BOUNDS, { padding: 58, duration: 1400 });
        else fitTexas();
      },
    },
    {
      label: "BESS as early signal",
      kicker: "Pre-headline signal",
      annotation: "BESS / storage queue",
      detail: "The storage queue marks where developers are already underwriting grid optionality before broader demand becomes visible.",
      why: "Battery tells you where: it is the lead indicator for a corridor worth screening.",
      implication: "Action: use BESS as the first filter, not the final answer.",
      annotations: ["BESS / storage queue"],
      action: fitCinematicSignal,
    },
    {
      label: "345kV corridor validation",
      kicker: "Transmission-proven corridor",
      annotation: "345kV corridor validation",
      detail: "The signal becomes investable when it sits inside a high-voltage corridor with credible delivery context.",
      why: "Transmission context separates directional interest from infrastructure-backed conviction.",
      implication: "Action: validate the corridor before spending diligence time on individual parcels.",
      annotations: ["345kV corridor validation", "delivery context"],
      action: fitCinematicCorridor,
    },
    {
      label: "Parcel narrowing",
      kicker: "Screened parcel universe",
      annotation: "screened parcel universe",
      detail: "The map narrows 170 screened parcels into candidates with acreage, proximity, flood exposure, score, and upside.",
      why: "The investable surface is the overlap between grid access, buildability, acreage, risk, and timing.",
      implication: "Action: move from corridor conviction to a ranked parcel list.",
      annotations: ["screened parcel universe", "FEMA flood screen"],
      action: zoomToCinematicParcels,
    },
    {
      label: "Ownership / executable deal path",
      kicker: "Actionable ownership",
      annotation: "diligence-ready opportunity",
      detail: "Owner/entity enrichment turns the best parcels into tracked diligence items with notes, readiness, and outreach priority.",
      why: "Ownership tells you whether you can close: it converts a map signal into an executable deal path.",
      implication: "Action: verify owner, confirm POI, begin outreach sequencing.",
      annotations: ["diligence-ready opportunity"],
      action: zoomToCinematicParcels,
    },
  ];
  const activeInsightStep = insightSteps[store.insightStep] ?? insightSteps[0];

  const runInsightStep = (step: number) => {
    const nextStep = Math.max(0, Math.min(step, insightSteps.length - 1));
    store.setInsightMode(true);
    store.setInsightStep(nextStep);
    insightSteps[nextStep].action();
  };

  const startInsightMode = () => {
    setIntroVisible(false);
    runInsightStep(0);
  };

  const exploreBatteryTell = () => {
    setIntroVisible(false);
    store.setSelectedOpportunityId("fort-bend-corridor");
    window.setTimeout(() => fitCinematicSignal(), 80);
  };

  const demoSteps = [
    { label: "Texas context", detail: "What are we seeing? Electrification pressure at grid scale.", action: fitTexas },
    { label: "Battery tell", detail: "Why it matters: BESS is the pre-headline signal.", action: () => store.setSelectedOpportunityId("fort-bend-corridor") },
    { label: "Corridor validation", detail: "Confirm the 345kV delivery context before parcel work.", action: fitSelectedCorridor },
    { label: "Parcel narrowing", detail: "Screen acreage, flood risk, score, and upside.", action: zoomToParcels },
    { label: "Ownership path", detail: "Move from signal to owner/outreach action.", action: () => store.setInsightMode(true) },
  ];

  return (
    <div className={`map-viewport ${store.insightMode ? "map-viewport--insight" : ""}`}>
      <div className="map-toolbar">
        <div>
          <span className="eyebrow">Map-first intelligence</span>
          <h1>{store.selectedOpportunity.title}</h1>
          <p>Signal {"->"} Corridor {"->"} Parcel {"->"} Ownership {"->"} Action</p>
        </div>
        <div className="map-navigation">
          <button
            className={`insight-toggle ${store.insightMode ? "insight-toggle--active" : ""}`}
            onClick={() => (store.insightMode ? store.setInsightMode(false) : runInsightStep(store.insightStep))}
          >
            Insight Mode
          </button>
          <div className="fit-controls" aria-label="Map fit controls">
            <button onClick={fitSelectedCorridor}>Fit Corridor</button>
            <button onClick={fitAllOpportunities}>Fit All</button>
            <button onClick={fitTexas}>Fit Texas</button>
            <button onClick={zoomToParcels} disabled={!visibleParcels.length}>
              Parcels
            </button>
          </div>
        </div>
      </div>
      <div className="map-stage">
        {overlays.loading ? <div className="loading-state">Loading external overlays...</div> : null}
        {overlays.error ? <div className="error-state">Overlay fallback active: {overlays.error}</div> : null}
        <div className="maplibre-stage" ref={mapContainerRef} />
      </div>
      <HoverPanel hover={hover} />
      {introVisible && !store.insightMode ? (
        <section className="map-intro-panel">
          <span className="eyebrow">Live demo</span>
          <h2>Track where large-scale energy and data center deals will land before the market does.</h2>
          <p>Battery tells you where. Ownership tells you whether you can close.</p>
          <div className="pattern-block">
            <span>Example pattern</span>
            <strong>BESS filing {"->"} 33 months {"->"} 520-acre data center MOU</strong>
            <small>This platform identifies that signal earlier.</small>
          </div>
          <div className="time-advantage">
            <span>Manual broker workflow: weeks</span>
            <strong>Signal-driven screening: seconds</strong>
          </div>
          <div className="intro-proof-grid">
            <span><strong>2</strong> corridors tracked</span>
            <span><strong>170</strong> parcels screened</span>
            <span><strong>345kV</strong> transmission validated</span>
            <span><strong>Owner</strong> diligence ready</span>
            <span><strong>FEMA</strong> risk screened</span>
            <span><strong>AI</strong> dataset assistant</span>
          </div>
          <p className="built-for-line">Built for infrastructure investors, data center developers, and land aggregators.</p>
          <div className="map-intro-actions">
            <button className="primary-button" onClick={startInsightMode}>Start Insight Mode</button>
            <button className="ghost-button" onClick={exploreBatteryTell}>Explore the Battery Tell</button>
          </div>
          <small className="intro-urgency">Window closes once infrastructure is announced.</small>
        </section>
      ) : null}
      {store.insightMode ? (
        <>
          <div className="insight-annotations" key={`annotations-${store.insightStep}`}>
            {activeInsightStep.annotations.map((annotation, index) => (
              <div className={`insight-annotation insight-annotation--${store.insightStep}-${index}`} key={annotation}>
                <span>{annotation}</span>
              </div>
            ))}
          </div>
          <div className="insight-card" key={`card-${store.insightStep}`}>
            <div className="insight-panel-header">
              <span className="eyebrow">Step {store.insightStep + 1} of {insightSteps.length}</span>
              <button onClick={() => store.setInsightMode(false)}>Exit</button>
            </div>
            <span className="insight-kicker">{activeInsightStep.kicker}</span>
            <strong>{activeInsightStep.label}</strong>
            <p>{activeInsightStep.detail}</p>
            <div className="insight-why">
              <span>Why This Matters</span>
              <p>{activeInsightStep.why}</p>
            </div>
            <div className="insight-why insight-action-line">
              <span>Implied Action</span>
              <p>{activeInsightStep.implication}</p>
            </div>
            <div className="insight-step-dots" aria-label="Insight step selector">
              {insightSteps.map((step, index) => (
                <button
                  aria-label={step.label}
                  className={index === store.insightStep ? "insight-step-dot--active" : ""}
                  key={step.label}
                  onClick={() => runInsightStep(index)}
                />
              ))}
            </div>
            <div className="insight-actions">
              <button onClick={() => runInsightStep(store.insightStep - 1)} disabled={store.insightStep === 0}>
                Back
              </button>
              <button onClick={() => runInsightStep(store.insightStep + 1)} disabled={store.insightStep === insightSteps.length - 1}>
                Next
              </button>
            </div>
          </div>
        </>
      ) : null}
      <div className="demo-flow-panel">
        <span className="eyebrow">Demo flow</span>
        <ol>
          {demoSteps.map((step, index) => (
            <li key={step.label}>
              <button onClick={step.action}>
                <strong>{index + 1}. {step.label}</strong>
                <span>{step.detail}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <div className="map-coverage-panel">
        <div>
          <span className="eyebrow">View</span>
          <strong>{scopeLabel}</strong>
        </div>
        <div className="coverage-grid">
          {activeLayerDiagnostics.map((item) => (
            <span className={item.enabled ? "" : "coverage-muted"} key={item.id}>
              {item.label} <strong>{item.enabled ? item.count : "hidden"}</strong>
            </span>
          ))}
        </div>
        <small>Drag, scroll, double-click, or pinch the map. Parcels reveal at high zoom.</small>
        {overlays.loading ? <small>Overlay JSON loading...</small> : null}
        {emptyEnabledLayers.length ? <small>{emptyEnabledLayers.map((item) => item.label).join(", ")} enabled but no features in this view.</small> : null}
      </div>
      <div className="map-footer">
        <span>{store.selectedOpportunity.valueCreationM}M value screen</span>
        <span>{store.selectedOpportunity.timelineMonths} month signal window</span>
        <span>{visibleParcels.length} parcels · {visibleTransmission.length} lines · zoom {store.zoom.toFixed(1)}</span>
      </div>
    </div>
  );
};

export const MapViewport = memo(MapViewportBase, (previous, next) => {
  const previousStore = previous.store;
  const nextStore = next.store;
  return (
    previousStore.selectedOpportunity.id === nextStore.selectedOpportunity.id &&
    previousStore.zoom === nextStore.zoom &&
    previousStore.mapScope === nextStore.mapScope &&
	    previousStore.mapCenter.lng === nextStore.mapCenter.lng &&
	    previousStore.mapCenter.lat === nextStore.mapCenter.lat &&
	    previousStore.insightMode === nextStore.insightMode &&
	    previousStore.insightStep === nextStore.insightStep &&
	    previousStore.layers === nextStore.layers &&
	    previous.overlays === next.overlays
	  );
});
