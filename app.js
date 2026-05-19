const state = {
  selectedId: "ercot_bess_019",
  zone: "all",
  minScore: 0,
  search: "",
  iaOnly: false,
  dcOnly: false,
  tellMode: false,
  parcelLayer: true,
  flowLayer: true,
  flowSpeed: 2,
  scanProgress: 100,
  viewBox: { x: 0, y: 0, w: 1000, h: 720 },
  isPanning: false,
  panStart: null,
};

const els = {
  searchInput: document.getElementById("searchInput"),
  scoreRange: document.getElementById("scoreRange"),
  scoreValue: document.getElementById("scoreValue"),
  iaOnly: document.getElementById("iaOnly"),
  dcOnly: document.getElementById("dcOnly"),
  tellMode: document.getElementById("tellMode"),
  parcelLayer: document.getElementById("parcelLayer"),
  flowLayer: document.getElementById("flowLayer"),
  flowSpeed: document.getElementById("flowSpeed"),
  flowSpeedValue: document.getElementById("flowSpeedValue"),
  assetList: document.getElementById("assetList"),
  dealPageList: document.getElementById("dealPageList"),
  detailContent: document.getElementById("detailContent"),
  assetCount: document.getElementById("assetCount"),
  capacityTotal: document.getElementById("capacityTotal"),
  avgScore: document.getElementById("avgScore"),
  resultCount: document.getElementById("resultCount"),
  points: document.getElementById("points"),
  parcels: document.getElementById("parcels"),
  flows: document.getElementById("flows"),
  basemap: document.getElementById("basemap"),
  corridors: document.getElementById("corridors"),
  hubs: document.getElementById("hubs"),
  floods: document.getElementById("floods"),
  flowPanel: document.getElementById("flowPanel"),
  valueTicker: document.getElementById("valueTicker"),
  mapSvg: document.getElementById("mapSvg"),
  zoomIn: document.getElementById("zoomIn"),
  zoomOut: document.getElementById("zoomOut"),
  zoomReset: document.getElementById("zoomReset"),
  zoomValue: document.getElementById("zoomValue"),
  zoomHint: document.getElementById("zoomHint"),
  exportProjects: document.getElementById("exportProjects"),
  exportParcels: document.getElementById("exportParcels"),
};

const formatMw = (value) => Math.round(value).toLocaleString();
const formatMoneyM = (value) => `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
const formatDollars = (value) => value === null || value === undefined ? "n/a" : `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const hasDemand = (asset) => Boolean(asset.demand);
const scoreClass = (score) => (score >= 70 ? "high" : score >= 55 ? "mid" : "low");
const mapBounds = { x: -80, y: 20, w: 1160, h: 820 };
const distMiles = (a, b) => {
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

function project(lng, lat) {
  const x = 70 + ((lng + 106.8) / 13.2) * 850;
  const y = 610 - ((lat - 25.6) / 10.8) * 520;
  return { x, y };
}

function zoomLevel() {
  return 1000 / state.viewBox.w;
}

function clampViewBox(box) {
  const minW = 250;
  const maxW = 1000;
  const ratio = 720 / 1000;
  const w = Math.max(minW, Math.min(maxW, box.w));
  const h = w * ratio;
  const minX = mapBounds.x;
  const minY = mapBounds.y;
  const maxX = mapBounds.x + mapBounds.w - w;
  const maxY = mapBounds.y + mapBounds.h - h;
  return {
    x: Math.max(minX, Math.min(maxX, box.x)),
    y: Math.max(minY, Math.min(maxY, box.y)),
    w,
    h,
  };
}

function applyMapView() {
  const z = zoomLevel();
  els.mapSvg.setAttribute("viewBox", `${state.viewBox.x} ${state.viewBox.y} ${state.viewBox.w} ${state.viewBox.h}`);
  els.zoomValue.textContent = `${z.toFixed(1)}x`;
  els.mapSvg.classList.toggle("zoom-mid", z >= 1.35);
  els.mapSvg.classList.toggle("zoom-deep", z >= 2.2);
  els.zoomHint.textContent =
    z < 1.35
      ? "Statewide view: assets, hubs, and major corridors"
      : z < 2.2
        ? "Regional view: county hotspot and parcel candidates"
        : "Site view: parcel labels, ownership rings, and POI context";
  renderParcels();
  bindLocationHover();
}

function zoomMap(multiplier, anchor = { x: 500, y: 360 }) {
  const nextW = state.viewBox.w / multiplier;
  const nextH = nextW * (720 / 1000);
  const anchorRatioX = (anchor.x - state.viewBox.x) / state.viewBox.w;
  const anchorRatioY = (anchor.y - state.viewBox.y) / state.viewBox.h;
  state.viewBox = clampViewBox({
    x: anchor.x - nextW * anchorRatioX,
    y: anchor.y - nextH * anchorRatioY,
    w: nextW,
    h: nextH,
  });
  applyMapView();
}

function screenToSvgPoint(event) {
  const rect = els.mapSvg.getBoundingClientRect();
  return {
    x: state.viewBox.x + ((event.clientX - rect.left) / rect.width) * state.viewBox.w,
    y: state.viewBox.y + ((event.clientY - rect.top) / rect.height) * state.viewBox.h,
  };
}

function resetMapView() {
  state.viewBox = { x: 0, y: 0, w: 1000, h: 720 };
  applyMapView();
}

function zoomToAsset(asset) {
  const p = project(asset.lng, asset.lat);
  const w = 430;
  const h = w * (720 / 1000);
  state.viewBox = clampViewBox({ x: p.x - w / 2, y: p.y - h / 2, w, h });
  applyMapView();
}

function jitter(asset, index) {
  const same = assets.filter((item) => item.lat === asset.lat && item.lng === asset.lng);
  const position = same.findIndex((item) => item.id === asset.id);
  if (same.length < 2) return { dx: 0, dy: 0 };
  const angle = (position / same.length) * Math.PI * 2;
  const radius = 11 + Math.min(10, same.length * 2);
  return { dx: Math.cos(angle) * radius, dy: Math.sin(angle) * radius };
}

function filteredAssets() {
  const q = state.search.trim().toLowerCase();
  return assets
    .filter((asset) => state.zone === "all" || asset.zone === state.zone)
    .filter((asset) => asset.score >= state.minScore)
    .filter((asset) => !state.iaOnly || Boolean(asset.ia))
    .filter((asset) => !state.dcOnly || hasDemand(asset))
    .filter((asset) => !state.tellMode || (asset.voltage === 345 && Boolean(asset.ia)))
    .filter((asset) => {
      if (!q) return true;
      return [asset.name, asset.county, asset.poi, asset.developer, asset.queueId]
        .join(" ")
        .toLowerCase()
        .includes(q);
    })
    .sort((a, b) => b.score - a.score || b.mw - a.mw);
}

function parcelCandidates(asset) {
  const seed = asset.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const baseAcres = asset.score >= 70 ? 2050 : asset.score >= 60 ? 780 : 420;
  return [
    { id: "p1", label: "single owner", ownerCount: 1, acres: baseAcres, distance: 3.1, flood: "low", score: Math.min(96, asset.score + 12), angle: 0.2 },
    { id: "p2", label: "assembly possible", ownerCount: 2, acres: Math.round(baseAcres * 0.34), distance: 4.8, flood: "mixed", score: Math.max(42, asset.score - 18), angle: 2.5 },
    { id: "p3", label: "assembly possible", ownerCount: 3, acres: Math.round(baseAcres * 0.58), distance: 6.7, flood: "screen", score: Math.max(50, asset.score - 7), angle: 4.2 },
    { id: "p4", label: "assembly risk", ownerCount: 4, acres: Math.round(baseAcres * 0.72 + seed % 90), distance: 2.6, flood: "verify", score: Math.max(46, asset.score - 21), angle: 5.4 },
  ];
}

function renderParcels() {
  els.parcels.innerHTML = "";
  if (!state.parcelLayer || zoomLevel() < 1.35) return;
  const asset = assets.find((item) => item.id === state.selectedId);
  if (!asset) return;
  if (asset.county === "Fort Bend" && typeof fortBendParcelOverlay !== "undefined") {
    renderRealFortBendParcels(asset);
    return;
  }
  const p = project(asset.lng, asset.lat);
  const rows = parcelCandidates(asset);
  els.parcels.innerHTML = rows
    .map((parcel, index) => {
      const radius = 44 + index * 16;
      const cx = p.x + Math.cos(parcel.angle) * radius;
      const cy = p.y + Math.sin(parcel.angle) * radius;
      const w = Math.max(34, Math.min(78, parcel.acres / 38));
      const h = Math.max(26, Math.min(58, parcel.acres / 58));
      const cls = parcel.ownerCount === 1 ? "prime" : parcel.ownerCount >= 4 || parcel.flood === "verify" ? "risk" : "assembly";
      return `
        <g class="parcel-group" data-id="${asset.id}" tabindex="0" role="button" aria-label="${asset.county} parcel candidate ${index + 1}" transform="translate(${cx} ${cy}) rotate(${(index - 1) * 13})">
          <rect class="parcel ${cls}" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="4"></rect>
          <text class="parcel-label" x="${-w / 2 + 5}" y="-2">${parcel.ownerCount} owner${parcel.ownerCount > 1 ? "s" : ""}</text>
          <text class="parcel-label sub" x="${-w / 2 + 5}" y="11">${parcel.acres} ac</text>
        </g>
      `;
    })
    .join("");
}

function renderRealFortBendParcels(asset) {
  els.parcels.innerHTML = fortBendParcelOverlay.parcels
    .map((parcel, index) => {
      const points = parcel.points.map(([lng, lat]) => project(lng, lat));
      const d = points
        .map((point, pointIndex) => `${pointIndex === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
        .join(" ");
      const centroid = points.reduce(
        (sum, point) => ({ x: sum.x + point.x / points.length, y: sum.y + point.y / points.length }),
        { x: 0, y: 0 }
      );
      const cls = parcel.ownerBucket === "single_or_large" ? "prime" : parcel.ownerBucket === "assembly" ? "assembly" : "risk";
      return `
        <g class="parcel-group real-parcel" data-id="${asset.id}" data-parcel-id="${parcel.id}" tabindex="0" role="button" aria-label="Fort Bend parcel ${index + 1}, ${parcel.acres} acres">
          <path class="parcel ${cls}" d="${d} Z"></path>
          <text class="parcel-label" x="${centroid.x.toFixed(1)}" y="${centroid.y.toFixed(1)}">${parcel.score} · ${parcel.acres.toLocaleString()} ac</text>
        </g>
      `;
    })
    .join("");
}

function renderFloods() {
  els.floods.innerHTML = "";
  const asset = assets.find((item) => item.id === state.selectedId);
  if (!asset || asset.county !== "Fort Bend" || zoomLevel() < 1.9 || typeof floodOverlay === "undefined") return;
  els.floods.innerHTML = floodOverlay.zones
    .map((zone) => {
      const d = zone.points
        .map(([lng, lat], index) => {
          const p = project(lng, lat);
          return `${index === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
        })
        .join(" ");
      const cls = zone.sfha === "T" ? "sfha" : "moderate";
      return `<path class="flood-zone ${cls}" d="${d} Z"></path>`;
    })
    .join("");
}

function renderBaseMap() {
  const texasPath =
    "M169 78 L400 82 L557 105 L764 144 L858 252 L843 365 L764 445 L715 560 L599 590 L520 655 L445 600 L357 598 L312 530 L237 493 L220 410 L150 358 L121 270 L88 211 Z";
  const microDots = Array.from({ length: 120 }, (_, index) => {
    const x = 90 + ((index * 47) % 840);
    const y = 90 + ((index * 83) % 540);
    const opacity = 0.22 + ((index % 5) * 0.08);
    return `<circle class="micro-dot" cx="${x}" cy="${y}" r="${index % 7 === 0 ? 2.2 : 1.4}" opacity="${opacity.toFixed(2)}"></circle>`;
  }).join("");

  els.basemap.innerHTML = `
    <path class="texas-shape" d="${texasPath}"></path>
    <path class="water-shape" d="M118 401 C190 365 234 393 265 360 C310 313 365 374 416 336 C466 299 520 327 572 300 C634 267 690 292 742 260" />
    <path class="water-shape thin" d="M455 610 C495 570 552 562 594 519 C640 472 696 485 744 445" />
    ${microDots}
    <text class="zone-label" x="210" y="140">Panhandle</text>
    <text class="zone-label" x="315" y="300">West</text>
    <text class="zone-label" x="560" y="250">North</text>
    <text class="zone-label" x="650" y="452">Houston</text>
    <text class="zone-label" x="500" y="500">South</text>
  `;

  const lines = [
    [[-101.4, 35], [-100.9, 32.7], [-98.7, 33.2], [-97.1, 32.0], [-95.4, 29.9]],
    [[-103.7, 31.3], [-100.9, 32.3], [-98.6, 31.9], [-96.8, 32.35]],
    [[-98.5, 29.45], [-97.5, 31.0], [-96.8, 32.35], [-95.8, 29.53]],
    [[-99.2, 27.0], [-98.3, 29.8], [-95.4, 29.9]],
  ];
  els.corridors.innerHTML = lines
    .map((line) => {
      const d = line
        .map(([lng, lat], i) => {
          const p = project(lng, lat);
          return `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
        })
        .join(" ");
      return `<path class="corridor" d="${d}"></path>`;
    })
    .join("") + renderTransmissionOverlay();

  els.hubs.innerHTML = demandHubs
    .map((hub) => {
      const p = project(hub.lng, hub.lat);
      return `
        <circle class="hub-glow" cx="${p.x}" cy="${p.y}" r="58"></circle>
        <circle cx="${p.x}" cy="${p.y}" r="5" fill="#d99a22"></circle>
        <text class="hub-label" x="${p.x + 10}" y="${p.y - 9}">${hub.name}</text>
      `;
    })
    .join("");
}

function renderTransmissionOverlay() {
  if (typeof transmissionOverlay === "undefined") return "";
  return transmissionOverlay
    .map((line) => {
      const d = line.points
        .map(([lng, lat], index) => {
          const p = project(lng, lat);
          return `${index === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
        })
        .join(" ");
      const cls = line.voltage >= 345 ? "real-transmission high-voltage" : "real-transmission regional-voltage";
      return `<path class="${cls}" d="${d}" data-voltage="${line.voltage}" data-owner="${line.owner}"></path>`;
    })
    .join("");
}

function nearestHub(asset) {
  return demandHubs
    .map((hub) => ({ ...hub, distance: distMiles(asset, hub) }))
    .sort((a, b) => a.distance - b.distance)[0];
}

function arcPath(from, to, lift = 90) {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2 - lift;
  return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
}

function renderFlows(items) {
  els.flows.innerHTML = "";
  els.flowPanel.innerHTML = "";
  els.valueTicker.innerHTML = "";
  if (!state.flowLayer) {
    els.flowPanel.classList.add("hidden");
    els.valueTicker.classList.add("hidden");
    return;
  }

  const selected = assets.find((asset) => asset.id === state.selectedId) || items[0] || assets[0];
  const activeHub = nearestHub(selected);
  const selectedPoint = project(selected.lng, selected.lat);
  const hubPoint = project(activeHub.lng, activeHub.lat);
  const speed = Math.max(1.2, 4.4 - state.flowSpeed * 0.72);
  const watchMonths = selected.ia ? Math.max(1, Math.round((new Date("2026-05-04") - new Date(selected.ia)) / (1000 * 60 * 60 * 24 * 30.4))) : "pre-IA";
  const routes = items
    .filter((asset) => asset.id !== selected.id && asset.score >= 60)
    .slice(0, 5)
    .map((asset, index) => {
      const hub = nearestHub(asset);
      const a = project(asset.lng, asset.lat);
      const b = project(hub.lng, hub.lat);
      return `<path class="flow-route ambient" style="--flow-speed:${speed + index * 0.28}s" d="${arcPath(a, b, 46 + index * 7)}"></path>`;
    });

  els.flows.innerHTML = `
    ${routes.join("")}
    <g class="county-hotspot" data-id="${selected.id}" tabindex="0" role="button" aria-label="${selected.county} County flow intelligence">
      <circle class="county-hover-zone" cx="${selectedPoint.x}" cy="${selectedPoint.y}" r="86"></circle>
      <circle class="county-focus-ring" cx="${selectedPoint.x}" cy="${selectedPoint.y}" r="58"></circle>
      <text class="county-hover-label" x="${selectedPoint.x + 24}" y="${selectedPoint.y - 44}">${selected.county} County</text>
    </g>
    <path class="flow-route primary" style="--flow-speed:${speed}s" d="${arcPath(selectedPoint, hubPoint, 88)}"></path>
    <path class="flow-route primary dashed" d="${arcPath(selectedPoint, hubPoint, 88)}"></path>
    <circle class="energy-target-glow" cx="${hubPoint.x}" cy="${hubPoint.y}" r="52"></circle>
    <circle class="energy-target" cx="${hubPoint.x}" cy="${hubPoint.y}" r="12"></circle>
    <text class="flow-label" x="${(selectedPoint.x + hubPoint.x) / 2 - 42}" y="${(selectedPoint.y + hubPoint.y) / 2 - 52}">
      ${watchMonths === "pre-IA" ? "pre-IA" : `${watchMonths} months`} - ${Math.round(activeHub.distance)} mi
    </text>
  `;

  const valueCreated = Math.round((selected.score * selected.mw) / 760);
  hideFlowPanel();
  els.valueTicker.classList.remove("hidden");
  els.valueTicker.textContent = `$${valueCreated}M WATCH VALUE · ${selected.county.toUpperCase()} · ${watchMonths === "pre-IA" ? "QUEUE SIGNAL" : `${watchMonths} MONTH CLOCK`} · ${Math.round(activeHub.distance)} MI TO LOAD`;
}

function flowPanelMarkup(asset, detail = "Dynamic flow shows the watched path from storage POI to the nearest demand hub.", parcel = null) {
  if (parcel) {
    return `
      <h3>Fort Bend parcel · ${parcel.acres.toLocaleString()} ac</h3>
      <div class="value-callout">
        <b>$ Value</b>
        <strong>${formatMoneyM(parcel.screeningUpsideBaseM)}</strong>
        <span>${formatMoneyM(parcel.screeningUpsideLowM)}-${formatMoneyM(parcel.screeningUpsideHighM)} range</span>
      </div>
      <p>Screening upside estimate from developable acres, 345kV proximity, and flood/buildability risk.</p>
      <div class="flow-kpis">
        <span><strong>${parcel.score}</strong>parcel score</span>
        <span><strong>${parcel.nearest345Miles} mi</strong>to 345kV</span>
        <span><strong>${parcel.floodRisk}</strong>flood risk</span>
      </div>
      <div class="value-band">
        <b>Buildability</b>
        <span>${parcel.developableAcres.toLocaleString()} ac</span>
        <small>${Math.round(parcel.buildabilityFactor * 100)}% buildability factor</small>
      </div>
    `;
  }
  const hub = nearestHub(asset);
  const watchMonths = asset.ia ? Math.max(1, Math.round((new Date("2026-05-04") - new Date(asset.ia)) / (1000 * 60 * 60 * 24 * 30.4))) : "pre-IA";
  const watchValue = Math.round((asset.score * asset.mw) / 760);
  return `
    <h3>${asset.county} County · ${asset.mw.toLocaleString()} MW BESS</h3>
    <div class="value-callout">
      <b>$ Value</b>
      <strong>$${watchValue}M</strong>
      <span>watch value estimate</span>
    </div>
    <p>${detail}</p>
    <div class="flow-kpis">
      <span><strong>${Math.round(hub.distance)} mi</strong>to ${hub.name}</span>
      <span><strong>${watchMonths}</strong>${watchMonths === "pre-IA" ? "watch state" : "mo since IA"}</span>
      <span><strong>${asset.score}</strong>signal score</span>
    </div>
    <div class="ownership-key">
      <b>Ring color = ownership fragmentation</b>
      <span><i class="owner-one"></i>1 owner</span>
      <span><i class="owner-few"></i>2-3 owners</span>
      <span><i class="owner-many"></i>4+ owners</span>
    </div>
  `;
}

function placeFlowPanel(event) {
  if (!event || typeof event.clientX !== "number" || typeof event.clientY !== "number") {
    els.flowPanel.style.left = "18px";
    els.flowPanel.style.top = "18px";
    els.flowPanel.style.right = "auto";
    els.flowPanel.style.bottom = "auto";
    return;
  }
  const wrap = document.querySelector(".map-wrap").getBoundingClientRect();
  const panelWidth = 280;
  const panelHeight = 168;
  const gap = 18;
  const cursorX = event.clientX - wrap.left;
  const cursorY = event.clientY - wrap.top;
  const placeLeft = cursorX + gap + panelWidth < wrap.width;
  const placeBelow = cursorY + gap + panelHeight < wrap.height;
  const left = placeLeft ? cursorX + gap : cursorX - panelWidth - gap;
  const top = placeBelow ? cursorY + gap : cursorY - panelHeight - gap;
  els.flowPanel.style.left = `${Math.max(14, Math.min(wrap.width - panelWidth - 14, left))}px`;
  els.flowPanel.style.top = `${Math.max(14, Math.min(wrap.height - panelHeight - 14, top))}px`;
  els.flowPanel.style.right = "auto";
  els.flowPanel.style.bottom = "auto";
}

function showFlowPanel(asset, detail, event, parcel = null) {
  els.flowPanel.innerHTML = flowPanelMarkup(asset, detail, parcel);
  if (event) placeFlowPanel(event);
  els.flowPanel.classList.remove("hidden");
}

function hideFlowPanel() {
  els.flowPanel.classList.add("hidden");
}

function bindLocationHover() {
  document.querySelectorAll(".asset-point, .county-hotspot, .parcel-group").forEach((node) => {
    const asset = assets.find((item) => item.id === node.dataset.id) || assets.find((item) => item.id === state.selectedId);
    if (!asset) return;
    const parcel = node.dataset.parcelId && typeof fortBendParcelOverlay !== "undefined"
      ? fortBendParcelOverlay.parcels.find((item) => item.id === node.dataset.parcelId)
      : null;
    const detail = node.classList.contains("parcel-group")
      ? "Parcel candidate around the selected POI. Replace this simulated footprint with county parcel geometry in the real-data layer."
      : "Hover signal for this BESS location, including nearest load hub, IA clock, and deal-flow score.";
    node.addEventListener("mouseenter", (event) => showFlowPanel(asset, detail, event, parcel));
    node.addEventListener("mousemove", (event) => placeFlowPanel(event));
    node.addEventListener("mouseleave", hideFlowPanel);
    node.addEventListener("focus", (event) => showFlowPanel(asset, detail, event, parcel));
    node.addEventListener("blur", hideFlowPanel);
  });
}

function renderPoints(items) {
  const visible = new Set(items.map((asset) => asset.id));
  els.points.innerHTML = assets
    .filter((asset) => visible.has(asset.id))
    .map((asset, index) => {
      const p = project(asset.lng, asset.lat);
      const j = jitter(asset, index);
      const r = Math.max(8, Math.min(24, asset.mw / 55));
      const fill = asset.score >= 70 ? "#d99a22" : asset.score >= 55 ? "#0f766e" : "#355c7d";
      const active = asset.id === state.selectedId ? " active" : "";
      return `
        <g class="asset-point${active}" data-id="${asset.id}" tabindex="0" role="button" aria-label="${asset.name} flow intelligence" transform="translate(${p.x + j.dx} ${p.y + j.dy})">
          <circle class="ring" r="${r + 6}"></circle>
          <circle class="core" r="${r}" fill="${fill}"></circle>
          <text x="${r + 7}" y="4">${asset.score}</text>
        </g>
      `;
    })
    .join("");

  document.querySelectorAll(".asset-point").forEach((node) => {
    node.addEventListener("click", () => {
      state.selectedId = node.dataset.id;
      const asset = assets.find((item) => item.id === state.selectedId);
      if (asset && zoomLevel() < 1.35) zoomToAsset(asset);
      render();
    });
  });
}

function renderList(items) {
  els.assetList.innerHTML = items
    .map((asset) => `
      <button class="asset-card ${asset.id === state.selectedId ? "active" : ""}" data-id="${asset.id}">
        <strong>${asset.name}</strong>
        <div class="asset-meta">
          <span class="chip ${asset.score >= 70 ? "gold" : ""}">${asset.score} score</span>
          <span class="chip">${formatMw(asset.mw)} MW</span>
          <span class="chip">${asset.county}</span>
          ${asset.ia ? `<span class="chip gold">IA ${asset.ia}</span>` : ""}
          ${asset.demand ? `<span class="chip red">demand</span>` : ""}
        </div>
      </button>
    `)
    .join("");

  document.querySelectorAll(".asset-card").forEach((card) => {
    card.addEventListener("click", () => {
      state.selectedId = card.dataset.id;
      const asset = assets.find((item) => item.id === state.selectedId);
      if (asset) zoomToAsset(asset);
      render();
    });
  });
}

function dealPageValue(asset) {
  if (asset.county === "Fort Bend" && typeof fortBendParcelOverlay !== "undefined") {
    const total = fortBendParcelOverlay.parcels
      .slice(0, 5)
      .reduce((sum, parcel) => sum + parcel.screeningUpsideBaseM, 0);
    return `${formatMoneyM(total)} parcel upside`;
  }
  return `$${Math.round((asset.score * asset.mw) / 760)}M watch value`;
}

function renderDealPageList() {
  if (!els.dealPageList || typeof dealPages === "undefined") return;
  els.dealPageList.innerHTML = Object.entries(dealPages)
    .map(([assetId, deal]) => {
      const asset = assets.find((item) => item.id === assetId);
      if (!asset) return "";
      return `
        <button class="deal-page-card ${assetId === state.selectedId ? "active" : ""}" data-id="${assetId}">
          <strong>${deal.label}</strong>
          <span>${asset.county} · ${dealPageValue(asset)}</span>
        </button>
      `;
    })
    .join("");

  document.querySelectorAll(".deal-page-card").forEach((card) => {
    card.addEventListener("click", () => {
      state.selectedId = card.dataset.id;
      const asset = assets.find((item) => item.id === state.selectedId);
      if (asset) zoomToAsset(asset);
      render();
    });
  });
}

function parcelRows(asset) {
  if (asset.county === "Fort Bend" && typeof fortBendParcelOverlay !== "undefined") {
    return fortBendParcelOverlay.parcels
      .slice(0, 6)
      .map((row) => `<tr><td>${row.score} score</td><td>${row.developableAcres.toLocaleString()}</td><td>${row.nearest345Miles} mi</td><td>${formatMoneyM(row.screeningUpsideBaseM)}</td></tr>`)
      .join("");
  }
  return parcelCandidates(asset)
    .map((row) => `<tr><td>${row.label}</td><td>${row.acres.toLocaleString()}</td><td>${row.distance} mi</td><td>${row.flood}</td></tr>`)
    .join("");
}

function fortBendTopParcels(limit = 5) {
  if (typeof fortBendParcelOverlay === "undefined") return [];
  return fortBendParcelOverlay.parcels.slice(0, limit);
}

function ownerForParcel(parcelId) {
  if (typeof fortBendOwnerEnrichment === "undefined") return null;
  return fortBendOwnerEnrichment.owners?.[parcelId] || null;
}

function narrativeDealPage(asset, monthsToCOD) {
  const deal = typeof dealPages !== "undefined" ? dealPages[asset.id] : null;
  if (!deal) {
    return `
      <section class="deal-page">
        <p class="eyebrow">Narrative deal page</p>
        <h3>Screening thesis in progress</h3>
        <p>This asset is in the queue watchlist, but it needs POI geocoding, parcel enrichment, and demand-context work before it becomes a client-ready narrative page.</p>
      </section>
    `;
  }
  return `
    <section class="deal-page">
      <p class="eyebrow">Narrative deal page</p>
      <h3>${deal.label}</h3>
      <div class="deal-hero-kpis">
        <span><b>${dealPageValue(asset)}</b>value lens</span>
        <span><b>${asset.confidence}</b>confidence</span>
        <span><b>${monthsToCOD ? `${monthsToCOD} mo` : "TBD"}</b>COD clock</span>
      </div>
      <div class="deal-section">
        <h4>Buyer Fit</h4>
        <p>${deal.customer}</p>
      </div>
      <div class="deal-section">
        <h4>Thesis</h4>
        <p>${deal.thesis}</p>
      </div>
      <div class="deal-section">
        <h4>Why Now</h4>
        <p>${deal.whyNow}</p>
      </div>
      <div class="deal-columns">
        <div>
          <h4>Diligence</h4>
          ${deal.diligence.map((item) => `<p>${item}</p>`).join("")}
        </div>
        <div>
          <h4>Risks</h4>
          ${deal.risks.map((item) => `<p>${item}</p>`).join("")}
        </div>
      </div>
      <div class="deal-action"><strong>Client action</strong><p>${deal.action}</p></div>
    </section>
  `;
}

function renderClientReport(asset) {
  const report = typeof clientGradeReports !== "undefined" ? clientGradeReports[asset.id] : null;
  if (!report) return "";
  const topParcels = fortBendTopParcels(5);
  const totalBase = topParcels.reduce((sum, parcel) => sum + parcel.screeningUpsideBaseM, 0);
  const totalDevelopable = topParcels.reduce((sum, parcel) => sum + parcel.developableAcres, 0);
  return `
    <section class="client-report" id="clientReport">
      <div class="report-header">
        <p class="eyebrow">${report.status}</p>
        <h3>${report.title}</h3>
        <p>${report.oneLine}</p>
      </div>

      <div class="report-actions">
        <button class="action-button" id="printReport" type="button">Print / save PDF</button>
        <span>${report.preparedFor}</span>
      </div>

      <div class="report-metrics">
        <div><span>Top parcel base upside</span><strong>${formatMoneyM(totalBase)}</strong></div>
        <div><span>Top developable acres</span><strong>${Math.round(totalDevelopable).toLocaleString()}</strong></div>
        <div><span>IA date</span><strong>${asset.ia}</strong></div>
        <div><span>Project size</span><strong>${formatMw(asset.mw)} MW</strong></div>
      </div>

      <div class="report-section">
        <h4>Top Parcel Owner Diligence</h4>
        <div class="parcel-brief-list">
          ${topParcels
            .map((parcel, index) => {
              const owner = ownerForParcel(parcel.id);
              return `
                <div class="parcel-brief">
                  <b>#${index + 1} ${parcel.id} · ${owner?.ownerName || "Owner pending"}</b>
                  <span>${parcel.developableAcres.toLocaleString()} buildable ac · ${parcel.nearest345Miles} mi to 345kV · ${parcel.floodRisk} flood risk</span>
                  <small>${formatMoneyM(parcel.screeningUpsideLowM)}-${formatMoneyM(parcel.screeningUpsideHighM)} range · ${owner?.situs || "situs pending"}</small>
                  ${owner ? `<small>CAD ${owner.cadReference} · land ${formatDollars(owner.landValue)} · total ${formatDollars(owner.totalValue)} · ${owner.mailingCity || ""}, ${owner.mailingState || ""}</small>` : ""}
                </div>
              `;
            })
            .join("")}
        </div>
      </div>

      <div class="report-section">
        <h4>Owner / Entity Notes</h4>
        <div class="owner-entity-list">
          ${topParcels
            .map((parcel) => ownerForParcel(parcel.id))
            .filter(Boolean)
            .map((owner) => `
              <div class="owner-entity-row">
                <strong>${owner.ownerName}</strong>
                <span>${owner.entityType} · ${owner.cadReference}</span>
                <p>${owner.legal}</p>
              </div>
            `)
            .join("")}
        </div>
      </div>

      <div class="report-section">
        <h4>Confidence Flags</h4>
        <div class="confidence-list">
          ${report.confidenceFlags
            .map((flag) => `
              <div class="confidence-row">
                <strong>${flag.label}</strong>
                <span>${flag.level}</span>
                <p>${flag.detail}</p>
              </div>
            `)
            .join("")}
        </div>
      </div>

      <div class="report-section">
        <h4>Valuation Method</h4>
        ${report.valuationMethod.map((item) => `<p>${item}</p>`).join("")}
      </div>

      <div class="report-section">
        <h4>Source Links</h4>
        <div class="source-link-list">
          ${report.sourceLinks
            .map((source) => `
              <a href="${source.url}" target="_blank" rel="noreferrer">
                <strong>${source.label}</strong>
                <span>${source.use}</span>
              </a>
            `)
            .join("")}
        </div>
      </div>

      <div class="report-section">
        <h4>Next Diligence</h4>
        ${report.nextDiligence.map((item) => `<p>${item}</p>`).join("")}
      </div>
    </section>
  `;
}

function renderDetail() {
  const asset = assets.find((item) => item.id === state.selectedId) || filteredAssets()[0] || assets[0];
  const notes = signalNotes[asset.id] || ["ERCOT GIS queue signal", "County-level coordinate placeholder", "Needs parcel and flood enrichment"];
  const monthsToCOD = asset.cod ? Math.max(0, Math.round((new Date(asset.cod) - new Date("2026-05-04")) / (1000 * 60 * 60 * 24 * 30.4))) : "";
  els.detailContent.innerHTML = `
    <div class="detail-title">
      <div class="score-orb">${asset.score}</div>
      <p class="eyebrow">${asset.queueId} / ${asset.county} County</p>
      <h2>${asset.name}</h2>
      <div class="chip-row">
        <span class="chip">${formatMw(asset.mw)} MW</span>
        <span class="chip">${asset.voltage || "POI"} kV</span>
        <span class="chip ${asset.ia ? "gold" : ""}">${asset.ia ? "IA signed" : "IA not found"}</span>
      </div>
    </div>

    <div class="detail-kv">
      <div><span>Developer</span><strong>${asset.developer}</strong></div>
      <div><span>Commercial date</span><strong>${asset.cod || "Unknown"}</strong></div>
      <div><span>Demand signal</span><strong>${asset.demand || "Not yet linked"}</strong></div>
      <div><span>Clock</span><strong>${monthsToCOD ? `${monthsToCOD} mo to COD` : "Needs date"}</strong></div>
    </div>

    ${state.tellMode ? `<div class="tell-banner"><strong>Battery Tell mode</strong><span>Showing 345kV BESS projects with signed IA dates. These are the closest matches to the article's watch-window method.</span></div>` : ""}

    <div class="action-row">
      <button class="action-button" id="runParcelScreen">Run parcel screen</button>
      <button class="action-button secondary" id="jumpBestTell">Best tell</button>
    </div>

    <div class="scan-meter" aria-label="Parcel screen progress" style="--scan-progress: ${state.scanProgress}%"><span></span></div>

    ${narrativeDealPage(asset, monthsToCOD)}

    ${renderClientReport(asset)}

    <section class="intel-card">
      <h3>The Tell</h3>
      <p>${asset.voltage === 345 ? "345kV POI, large scale, and corridor demand make this a candidate for parcel screening." : "Large BESS queue signal, but the POI needs more work before it becomes a parcel-screen target."}</p>
    </section>

    <section class="timeline">
      <div class="event"><time>${asset.ia || "Queue"}</time><div><strong>Interconnection clock</strong><p>${asset.ia ? "IA date found. This starts the pre-headline watch window." : "Queue signal found. IA date is the next enrichment target."}</p></div></div>
      <div class="event"><time>${asset.cod || "TBD"}</time><div><strong>Commercial target</strong><p>Use COD and milestone maturity to prioritize near-term corridor research.</p></div></div>
      <div class="event"><time>Next</time><div><strong>Parcel screen</strong><p>Find single-owner parcels over 500 acres within 5 miles of the POI, then layer flood and buildability.</p></div></div>
    </section>

    <section class="intel-card">
      <h3>Signal Notes</h3>
      <p>${notes.join(" / ")}</p>
    </section>

    ${asset.county === "Fort Bend" && typeof fortBendParcelOverlay !== "undefined" ? `<section class="intel-card value-summary"><h3>Top Parcels</h3><p>Ranked by screening score with buildable acreage, 345kV proximity, flood penalty, and estimated upside. Values are screening estimates, not appraisals.</p></section>` : ""}

    <table class="parcel-table">
      <thead><tr><th>Parcel target</th><th>${asset.county === "Fort Bend" ? "Buildable ac" : "Acres"}</th><th>${asset.county === "Fort Bend" ? "345kV" : "POI distance"}</th><th>${asset.county === "Fort Bend" ? "Base upside" : "Flood"}</th></tr></thead>
      <tbody>${parcelRows(asset)}</tbody>
    </table>

    <p class="source-note">${asset.county === "Fort Bend" && typeof fortBendParcelOverlay !== "undefined" ? "Real parcel note: Fort Bend parcel geometry is sourced from FBCAD 2025 Certified GIS shapefiles and filtered around the Avalon focus area. Screening upside uses assumed land-spread values and is not an appraisal." : "Prototype note: asset points use county-level coordinates from the manual workbook. The parcel table is an interaction model, not real parcel data yet. The next real data layer is county parcels + HIFLD transmission + FEMA flood."}</p>
  `;

  document.getElementById("runParcelScreen").addEventListener("click", runParcelScreen);
  document.getElementById("printReport")?.addEventListener("click", () => window.print());
  document.getElementById("jumpBestTell").addEventListener("click", () => {
    state.tellMode = true;
    els.tellMode.checked = true;
    state.selectedId = "ercot_bess_019";
    render();
  });
}

function renderStats(items) {
  const totalMw = items.reduce((sum, asset) => sum + asset.mw, 0);
  const avg = items.length ? items.reduce((sum, asset) => sum + asset.score, 0) / items.length : 0;
  els.assetCount.textContent = items.length;
  els.capacityTotal.textContent = formatMw(totalMw);
  els.avgScore.textContent = Math.round(avg);
  els.resultCount.textContent = `${items.length} shown`;
}

function render() {
  const items = filteredAssets();
  if (!items.find((asset) => asset.id === state.selectedId) && items.length) {
    state.selectedId = items[0].id;
  }
  els.scoreValue.textContent = state.minScore;
  renderStats(items);
  renderDealPageList();
  renderList(items);
  renderFlows(items);
  renderPoints(items);
  renderFloods();
  renderParcels();
  bindLocationHover();
  renderDetail();
}

function runParcelScreen() {
  state.scanProgress = 12;
  render();
  const steps = [38, 67, 95, 100];
  steps.forEach((value, index) => {
    window.setTimeout(() => {
      state.scanProgress = value;
      if (index === steps.length - 1) state.parcelLayer = true;
      els.parcelLayer.checked = state.parcelLayer;
      render();
    }, 260 * (index + 1));
  });
}

function csvValue(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvValue(row[header])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportProjectsCsv() {
  const rows = filteredAssets().map((asset) => ({
    queue_id: asset.queueId,
    project: asset.name,
    county: asset.county,
    zone: asset.zone,
    mw: asset.mw,
    voltage_kv: asset.voltage || "",
    interconnection_agreement_date: asset.ia || "",
    commercial_operation_date: asset.cod || "",
    developer: asset.developer,
    point_of_interconnection: asset.poi,
    score: asset.score,
    demand_signal: asset.demand || "",
    confidence: asset.confidence || "",
    source: "ERCOT April 2026 GIS report, prototype-normalized",
  }));
  downloadCsv("ercot-battery-tell-projects.csv", rows);
}

function exportParcelsCsv() {
  const parcelSource = typeof fortBendParcelOverlay !== "undefined" ? fortBendParcelOverlay.parcels : [];
  const rows = parcelSource.map((parcel, index) => ({
    rank: index + 1,
    parcel_id: parcel.id,
    acres: parcel.acres,
    developable_acres: parcel.developableAcres,
    nearest_345kv_miles: parcel.nearest345Miles,
    flood_risk: parcel.floodRisk,
    flood_overlap_pct: parcel.floodOverlapPct,
    score: parcel.score,
    screening_upside_low_m: parcel.screeningUpsideLowM,
    screening_upside_base_m: parcel.screeningUpsideBaseM,
    screening_upside_high_m: parcel.screeningUpsideHighM,
    buildability_factor: parcel.buildabilityFactor,
    owner_name: ownerForParcel(parcel.id)?.ownerName || "",
    owner_entity_type: ownerForParcel(parcel.id)?.entityType || "",
    owner_mailing_city: ownerForParcel(parcel.id)?.mailingCity || "",
    owner_mailing_state: ownerForParcel(parcel.id)?.mailingState || "",
    owner_cad_reference: ownerForParcel(parcel.id)?.cadReference || "",
    appraised_land_value: ownerForParcel(parcel.id)?.landValue || "",
    appraised_total_value: ownerForParcel(parcel.id)?.totalValue || "",
    situs: ownerForParcel(parcel.id)?.situs || "",
    legal: ownerForParcel(parcel.id)?.legal || "",
    centroid_lng: parcel.centroid?.[0] || "",
    centroid_lat: parcel.centroid?.[1] || "",
    source: "FBCAD 2025 Certified GIS + HIFLD + FEMA NFHL, prototype-normalized",
  }));
  downloadCsv("fort-bend-top-parcels.csv", rows);
}

function bindEvents() {
  els.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    render();
  });
  els.scoreRange.addEventListener("input", (event) => {
    state.minScore = Number(event.target.value);
    render();
  });
  els.iaOnly.addEventListener("change", (event) => {
    state.iaOnly = event.target.checked;
    render();
  });
  els.dcOnly.addEventListener("change", (event) => {
    state.dcOnly = event.target.checked;
    render();
  });
  els.tellMode.addEventListener("change", (event) => {
    state.tellMode = event.target.checked;
    render();
  });
  els.parcelLayer.addEventListener("change", (event) => {
    state.parcelLayer = event.target.checked;
    render();
  });
  els.flowLayer.addEventListener("change", (event) => {
    state.flowLayer = event.target.checked;
    render();
  });
  els.flowSpeed.addEventListener("input", (event) => {
    state.flowSpeed = Number(event.target.value);
    els.flowSpeedValue.textContent = `${state.flowSpeed}x`;
    render();
  });
  els.zoomIn.addEventListener("click", () => zoomMap(1.45));
  els.zoomOut.addEventListener("click", () => zoomMap(1 / 1.45));
  els.zoomReset.addEventListener("click", resetMapView);
  els.exportProjects?.addEventListener("click", exportProjectsCsv);
  els.exportParcels?.addEventListener("click", exportParcelsCsv);
  els.mapSvg.addEventListener("wheel", (event) => {
    event.preventDefault();
    zoomMap(event.deltaY < 0 ? 1.18 : 1 / 1.18, screenToSvgPoint(event));
  }, { passive: false });
  els.mapSvg.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    state.isPanning = true;
    state.panStart = { clientX: event.clientX, clientY: event.clientY, viewBox: { ...state.viewBox } };
    els.mapSvg.setPointerCapture(event.pointerId);
    els.mapSvg.classList.add("is-panning");
  });
  els.mapSvg.addEventListener("pointermove", (event) => {
    if (!state.isPanning || !state.panStart) return;
    const rect = els.mapSvg.getBoundingClientRect();
    const dx = ((event.clientX - state.panStart.clientX) / rect.width) * state.panStart.viewBox.w;
    const dy = ((event.clientY - state.panStart.clientY) / rect.height) * state.panStart.viewBox.h;
    state.viewBox = clampViewBox({
      ...state.panStart.viewBox,
      x: state.panStart.viewBox.x - dx,
      y: state.panStart.viewBox.y - dy,
    });
    applyMapView();
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach((eventName) => {
    els.mapSvg.addEventListener(eventName, () => {
      state.isPanning = false;
      state.panStart = null;
      els.mapSvg.classList.remove("is-panning");
    });
  });
  document.querySelectorAll(".segment").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".segment").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.zone = button.dataset.zone;
      render();
    });
  });
}

renderBaseMap();
bindEvents();
render();
applyMapView();
