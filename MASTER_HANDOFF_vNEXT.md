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
The diligence queue is now positioned as the execution handoff from map intelligence to owner/outreach action. It supports status filtering, priority/score/readiness sorting, pinned watchlist items, editable notes, readiness indicators, risk badges, and CSV export. The visible workflow stages are Signal Detected, Screened, Ownership Verified, Outreach Ready, and Active Diligence. Navarro has queue parity with Fort Bend through owner verification and load-adjacency tasks. This remains frontend/local-state only.

## Refined Demo Positioning
The demo is now framed around the thesis: "Battery tells you where. Ownership tells you whether you can close."

The core product narrative is explicit across the intro, Insight Mode, corridor cards, report panel, and diligence queue:

Signal -> Corridor -> Parcel -> Ownership -> Action

The commercial message is targeted at infrastructure investors, data-center developers, land brokers, and energy developers. The app should read as pre-headline infrastructure deal intelligence, not generic GIS or a consumer SaaS dashboard.

## Live Demo Intro
The map now opens with a lightweight premium intro panel:
- "Track where large-scale energy and data center deals will land before the market does."
- Static outcome anchor: "BESS filing -> 33 months -> 520-acre data center MOU."
- Time advantage: "Manual broker workflow: weeks" vs. "Signal-driven screening: seconds."
- Audience line: built for infrastructure investors, data center developers, and land aggregators.
- Urgency line: "Window closes once infrastructure is announced."
- 2 corridors tracked.
- 170 parcels screened.
- 345kV transmission validated.
- FEMA risk screened.
- Owner diligence ready.
- AI dataset assistant.

Primary CTAs are "Start Insight Mode" and "Explore the Battery Tell." The left rail also includes a compact Signal Stack / Deal Stack card so a viewer can understand the product in under 60 seconds.

## Ask the Dataset Architecture
The demo now includes a lightweight AI-assisted diligence panel in the right report rail. It is designed as an MVP exploration layer, not a full data platform:

- Frontend UI: `src/features/ai/AskDatasetPanel.tsx`.
- Serverless API: `api/ask-dataset.js`.
- Runtime: Vercel Serverless Function.
- Model provider: OpenAI Responses API.
- Required env var: `OPENAI_API_KEY`.
- Optional env var: `OPENAI_MODEL`.
- Default model: `gpt-4.1-mini`.
- No database.
- No authentication.
- No vector database.
- No RAG pipeline.
- No backend persistence.

The frontend packages compact context only:
- selected corridor
- corridor thesis/report summary
- top parcel scores, acres, owner/entity fields, flood risk, proximity, and screened upside
- selected corridor diligence queue items
- opportunity risk list
- FEMA NFHL / HIFLD 230kV+ metadata labels
- top opportunity summaries

The frontend does not send raw GeoJSON, polygon coordinates, full overlay files, basemap state, or large geometry payloads.

If `OPENAI_API_KEY` is missing or the local preview has no API route available, the UI falls back to demo-mode answers generated from loaded frontend context. Demo mode is intentionally labeled so customers can distinguish it from live AI.

## AI Answer Rules
The server prompt instructs the model to:
- answer only from provided compact context
- distinguish facts from inference
- avoid fabricated parcels, owners, sources, or values
- avoid investment-advice framing
- state missing data clearly
- frame outputs as diligence support
- reinforce Signal -> Corridor -> Parcel -> Ownership -> Action where useful

## AI Limitations
- The AI cannot inspect map geometry beyond the compact parcel fields provided.
- It cannot verify live owner contact data or POI deliverability.
- It cannot access external data unless that data is already included in the supplied context.
- Demo-mode answers are deterministic local summaries, not model-generated analysis.
- Hosted live AI requires `OPENAI_API_KEY` in Vercel project environment variables.

## Second Corridor Summary
Navarro / Corsicana is now a complete second ERCOT corridor example with live CAD parcel candidates, owner/entity enrichment from parcel attributes, FEMA flood overlay support, HIFLD transmission context, score parity, report parity, and queue parity. It demonstrates repeatability beyond the Fort Bend demo.

## Deployment Readiness
`npm run build` passes and outputs a production bundle. Vite remains configured with relative assets for Vercel/static hosting. The AI endpoint is a lightweight Vercel serverless function under `api/ask-dataset.js`. Use Vercel Git integration for the shareable external URL. Configure `OPENAI_API_KEY` for live Ask the Dataset responses; without it, the app remains usable in demo mode.

## Performance Considerations
Main app JS remains lightweight relative to the MapLibre vendor chunk. The Ask the Dataset feature sends compact structured context only and excludes raw geometry, so it should not slow map rendering. The next performance step is data-level tiling or corridor-specific overlay loading once additional counties are added.

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
1. Start with the intro panel and state the thesis: battery tells you where; ownership tells you whether you can close.
2. Start Insight Mode to show Texas electrification context.
3. Use BESS/storage as the pre-headline signal.
4. Validate the 345kV corridor before parcel work.
5. Narrow to the screened parcel universe with acreage, flood risk, score, and upside.
6. Show ownership/entity enrichment and the diligence queue as the executable deal path.
7. Switch to Navarro/Corsicana to prove repeatability.
8. Return to Fit All to show the two-corridor portfolio view.

## Insight Mode Narrative Layer
Insight Mode is a lightweight cinematic presentation layer for high-signal corridor storytelling. It keeps MapLibre as the dominant surface, dims both sidebars, reduces supporting UI clutter, and uses a compact semi-transparent story card positioned mid-left over the map. The guided five-step sequence is:
- Texas electrification context.
- BESS as early signal.
- 345kV corridor validation.
- Parcel narrowing.
- Ownership / executable deal path.

Each step answers what the viewer is seeing, why it matters, and what action it implies. The copy now uses stronger commercial language such as pre-headline signal, transmission-proven corridor, screened parcel universe, actionable ownership, and diligence-ready opportunity. Step transitions use longer MapLibre fit durations for a smoother guided feel.

The mode reuses existing map actions and data rather than introducing a separate tour engine. Layer emphasis is handled with simple active/contextual/dimmed opacity weights by step. The annotations are presentation labels, not persisted geographic features.

Insight Mode is best used for client demos and Substack-style narrative screenshots. The next polish step would be georeferenced annotation anchors and monitor-specific placement tuning if customers respond well to the storytelling format.

## Report Standard
Client reports should follow this structure across corridors:
- Executive summary and pre-headline deal signal.
- "Why this corridor matters now."
- Corridor, lead indicator, and client action.
- Investment thesis separated from data confidence.
- Clear next action: verify owner, confirm POI, begin outreach sequencing.
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
- `/api/ask-dataset` returns a live answer when `OPENAI_API_KEY` is set.
- Ask the Dataset gracefully shows demo/disabled behavior when `OPENAI_API_KEY` is absent.
- CARTO/OpenStreetMap basemap tiles load.
- MapLibre drag/pan, scroll zoom, Fit Texas, Fit All, Fit Corridor, and Parcels controls work.
- Fort Bend and Navarro/Corsicana corridors load.
- Layer controls and hover cards work.
- Insight Mode opens, advances, goes back, and exits cleanly.
- Conviction Layer headline, outcome anchor, time-advantage copy, and CTA render in the intro panel.
- Ask the Dataset suggested prompts and answer cards render.
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
1. Complete Vercel hosted deployment through Git integration using the `tdubst` GitHub identity required by the Hobby-tier project, then run hosted Safari/Chrome QA.
2. Add `OPENAI_API_KEY` to Vercel and verify live Ask the Dataset responses.
3. Use the upgraded Fort Bend/Navarro demo in customer outreach and listen for which phrase lands: battery tell, ownership close path, diligence-ready parcel list, or Ask the Dataset.
4. Confirm parcel data licensing language for client redistribution.
5. Add a small provenance drawer or source footnote only if customers ask for source traceability during demos.
6. Add substation points and interconnection milestone provenance only after demo feedback confirms demand.
7. Future AI roadmap: saved Q&A snippets, report-section drafting, source-citation chips, and structured owner-call recommendations. Avoid vector DB/RAG until the dataset grows beyond static corridor context.
8. Keep backend automation out of scope until at least three repeatable corridors justify it.
