# Master Handoff vNEXT — Production-Ready Intelligence Sprint

## Updated Architecture
The frontend remains React + TypeScript + Vite with a map-first, frontend-only architecture. The map engine is now MapLibre GL JS, chosen over Mapbox GL JS to avoid access-token and licensing friction while still providing real slippy-map navigation. Heavy overlay geometry remains in static JSON assets under `public/overlays/` and is loaded at runtime by `useOverlayData`.

MapLibre uses a dark CARTO/OpenStreetMap raster basemap for muted roads, labels, water, and city context. Product intelligence overlays render as native MapLibre GeoJSON sources/layers above that basemap.

## Overlay Loading Strategy
- `fort-bend-parcels.json`: Fort Bend CAD-derived screened parcel candidates with score, acreage, buildability, proximity, and upside.
- `navarro-parcels.json`: Navarro CAD public FeatureServer candidates with owner names, acreage, values where available, proximity, score, and source metadata.
- `fema-flood-zones.json` / `flood-zones.json`: direct FEMA NFHL flood hazard zones from FEMA ArcGIS layer 28.
- `texas-transmission.json`: HIFLD 230kV+ transmission line subset for statewide context.
- `data/overlay_manifest.json`: source tracking file for generated overlays, source URLs, license notes, and refresh commands.

## Workflow Improvements
The diligence queue supports status filtering, priority/score/readiness sorting, pinned watchlist items, editable notes, readiness indicators, risk badges, and CSV export. Navarro now has queue parity with Fort Bend through owner verification and load-adjacency tasks. This remains frontend/local-state only.

## Second Corridor Summary
Navarro / Corsicana is now a complete second ERCOT corridor example with live CAD parcel candidates, owner/entity enrichment from parcel attributes, FEMA flood overlay support, HIFLD transmission context, score parity, report parity, and queue parity. It demonstrates repeatability beyond the Fort Bend demo.

## Deployment Readiness
`npm run build` passes and outputs a production bundle. Vite remains configured with relative assets for Vercel/static hosting. Production preview rendered successfully at `http://127.0.0.1:4174/`. Vercel MCP returned CLI/Git instructions rather than creating a hosted URL, and `npx vercel deploy --yes` failed from this environment because `registry.npmjs.org` could not be resolved. Use Vercel Git integration for the shareable external URL.

## Performance Considerations
Main JS is roughly 223.86 KB after adding direct FEMA, Navarro overlays, and hover stabilization. The next performance step is data-level tiling or corridor-specific overlay loading once additional counties are added.

## Interaction Model
Map rendering order is now fixed as basemap, flood/risk overlays, transmission/corridor overlays, parcel overlays, project markers, then hover tooltip. MapLibre handles drag-to-pan, scroll/trackpad zoom, double-click zoom, and touch zoom. Hover state still uses the typed `MapHover` union, but events now come from MapLibre feature layers instead of SVG hitboxes.

## Map Navigation Model
The map now has three explicit scopes:
- Selected corridor: default working mode for Fort Bend or Navarro/Corsicana.
- All opportunities: shows Fort Bend and Navarro/Corsicana together with all project markers and all parcel candidates.
- Texas context: zooms out for statewide orientation while preserving capped overlay rendering.

Fit controls live in the map toolbar:
- Fit Corridor: reset to the selected opportunity's corridor.
- Fit All: center both demo corridors together.
- Fit Texas: show statewide context.
- Parcels: zoom into the active parcel set for diligence inspection.

Fit controls are shortcuts; freeform map movement is now handled by MapLibre.

## Performance Strategy
The map prioritizes perceived responsiveness over adding new features. Fort Bend parcels, Navarro parcels, FEMA flood zones, HIFLD transmission, project markers, and corridor flow lines now render through MapLibre native GeoJSON layers. Transmission context is still filtered/capped by scope before being sent to the map.

MapLibre is split into its own vendor chunk so the application logic bundle remains small. Fit All and Texas context intentionally expand the rendered overlay scope, but transmission lines remain capped by mode to avoid turning the demo into a slow statewide renderer. Selected corridor mode remains the high-performance diligence mode.

## Zoom-Level Intelligence Model
- Low zoom: Texas/corridor context, project markers, and high-voltage transmission backbone dominate.
- Mid zoom: flood risk, transmission structure, project labels, and corridor flow lines become legible.
- High zoom: parcel polygons, parcel outlines, parcel labels, and parcel hover diligence become available.

## Visibility Model
The map coverage panel reports rendered/available counts for projects, parcels, flood zones, and transmission lines. It also exposes loading and empty-enabled-layer states so the user can tell whether a missing feature is hidden, unavailable, loading, or outside the current view.

## QA Status
Production build passes and local preview loads at `http://127.0.0.1:4174/`. Browser QA confirmed MapLibre map load, Fort Bend startup coverage, Navarro corridor switching, Fit All, Fit Texas, Parcels fit, layer toggle visibility state, recommended demo flow visibility, standardized report sections, and `Add to Queue` workflow creation. In-app synthetic hover/drag events were unreliable in the local browser environment, so free drag, scroll zoom, and hover still need a quick human-cursor pass in Safari and Chrome before client sharing.

## Demo Flow
Use this sequence for a 5-minute client demo:
1. Start with Fit Texas to establish statewide infrastructure context.
2. Fit Fort Bend and show the BESS plus transmission signal.
3. Use Parcels to reveal owner, acreage, score, flood/buildability, and upside.
4. Open the report panel and explain the client action, thesis, data confidence, and parcel screen.
5. Add a parcel to the diligence queue to show workflow handoff.
6. Switch to Navarro/Corsicana to prove repeatability.
7. Return to Fit All to show the two-corridor portfolio view.

## Insight Mode Narrative Layer
Insight Mode is a lightweight cinematic presentation layer for high-signal corridor storytelling. It keeps MapLibre as the dominant surface, dims both sidebars, reduces supporting UI clutter, and uses a compact semi-transparent story card positioned mid-left over the map. The guided five-step sequence is:
- Texas context.
- Corridor focus.
- Signal identification.
- Parcel narrowing.
- Ownership insight.

Each step includes a step indicator, narrative copy, a `Why This Matters` section, Back/Next/Exit controls, and at most one or two high-contrast annotations such as “BESS interconnection signal,” “345kV transmission access,” or “single-owner opportunity.” Step transitions use longer MapLibre fit durations for a smoother guided feel.

The mode reuses existing map actions and data rather than introducing a separate tour engine. Layer emphasis is handled with simple active/contextual/dimmed opacity weights by step. The annotations are presentation labels, not persisted geographic features.

Insight Mode is best used for client demos and Substack-style narrative screenshots. The next polish step would be georeferenced annotation anchors and monitor-specific placement tuning if customers respond well to the storytelling format.

## Report Standard
Client reports should follow this structure across corridors:
- Executive summary and infrastructure signal.
- Corridor, lead indicator, and client action.
- Investment thesis separated from data confidence.
- Metrics for screened upside, primary queue signal, voltage, and parcel focus.
- Parcel screen with owner, score, acreage, proximity, estimated upside, source, flood flag, and queue action.
- Risk and mitigation with evidence standard.
- Diligence workflow and markdown export.

## External Sharing Status
The app is client-demo-ready locally but not yet hosted from this environment. `npm run build` passes and the project is configured as a static Vite frontend, but automatic deployment is currently blocked because this local folder is not a Git repository and has no `.vercel/project.json` project link.

Deployment audit findings:
- Preview URL: not available.
- Production URL: not available.
- Intended GitHub repo: `tdubst/energy-deal-flow-intelligence`.
- Local Git repository initialized on branch `deploy/client-demo-vercel`.
- Local remote `origin` is set to `https://github.com/tdubst/energy-deal-flow-intelligence.git`.
- Local deployment commit exists; confirm current hash with `git rev-parse --short HEAD`.
- GitHub connector could not access the repo and returned repository not found / 404.
- Local `git ls-remote https://github.com/tdubst/energy-deal-flow-intelligence.git HEAD` failed with GitHub authentication failure.
- `git push -u origin deploy/client-demo-vercel` was blocked by environment safety policy as an external data export risk.
- Vercel connector direct deploy returned CLI/Git instructions rather than creating a deployment.
- Vercel team listing returned no teams; project listing failed without a team/project link.
- `public/overlays/*.json` files exist and are not ignored by `.gitignore`.
- No backend or environment variables are required for the current frontend demo.

Recommended deployment path:
1. From the project folder, run `git push -u origin deploy/client-demo-vercel`.
2. Open a PR from `deploy/client-demo-vercel` into the repository default branch.
3. In Vercel, import/connect that GitHub repository if it is not already connected.
4. Configure Vercel:
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
   - Root directory: project root
   - Environment variables: none required
5. Use feature branches or pull requests for preview deployments.
6. Merge to `main` for production deployment unless the repository uses another default branch.
7. After deploy, verify `/overlays/*.json`, MapLibre tiles, report export, CSV export, Insight Mode, Fort Bend, and Navarro workflows load in production.

## Deployment Workflow
Use GitHub + Vercel Git integration as the default release path:
- Feature branch push: Vercel creates a preview deployment.
- Pull request: Vercel attaches a preview URL for review.
- Merge to `main`: Vercel creates/updates production deployment.
- Rollback: use Vercel's deployment history if a production deploy fails QA.

Do not commit credentials. Do not add Vercel tokens, GitHub tokens, `.env*`, or `.vercel/` metadata to the repository. The current `.gitignore` excludes these local-only files plus `node_modules`, `dist`, logs, build info, and backup artifacts.

## Hosted QA Checklist
Run once a preview or production URL exists:
- App loads without console errors.
- Overlay JSON files load from `/overlays/*.json`.
- CARTO/OpenStreetMap basemap tiles load.
- MapLibre drag/pan, scroll zoom, Fit Texas, Fit All, Fit Corridor, and Parcels controls work.
- Fort Bend and Navarro/Corsicana corridors load.
- Layer controls and hover cards work.
- Insight Mode opens, advances, goes back, and exits cleanly.
- Reports render correctly.
- Diligence queue works.
- CSV exports work where browser permissions allow.
- Print/PDF report flow is visible and usable.

## Data Pipeline Standard
Keep the pipeline lightweight until backend automation is justified:
1. Store raw files or source URLs under `data/raw/`.
2. Generate browser-ready static overlays into `public/overlays/`.
3. Track every overlay in `data/overlay_manifest.json` with source URL, fetch date, license note, and refresh command.
4. Preserve raw and processed data separately.
5. Refresh overlays manually with scripts before client demos; automate only after three or more repeatable corridors exist.

## Next Recommended Sprint
1. Complete Vercel hosted deployment through Git integration and run hosted Safari/Chrome QA.
2. Conduct customer outreach with the Fort Bend/Navarro two-corridor demo.
3. Confirm parcel data licensing language for client redistribution.
4. Decide whether the next build sprint is customer-facing narrative polish or lightweight pipeline automation.
5. Add substation points and interconnection milestone provenance only after demo feedback confirms demand.
