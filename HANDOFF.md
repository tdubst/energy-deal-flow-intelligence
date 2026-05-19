# Energy Deal Flow Intelligence Handoff

## Project Summary

Energy Deal Flow Intelligence is a map-first MVP for finding pre-headline energy, land, and infrastructure opportunities from public data. The current prototype focuses on ERCOT / Texas battery storage signals and turns those signals into parcel-level diligence around a priority Fort Bend opportunity.

The product thesis is that early infrastructure signals such as interconnection queues, signed interconnection agreements, transmission proximity, parcel scale, ownership, flood/buildability constraints, and local development activity can point to investable opportunities before they become obvious news.

## Current MVP State

The MVP has been refactored from a static browser prototype into a React + TypeScript + Vite app at:

`/Users/TonyWan/Documents/New project/Energy Deal Flow Intelligence/index.html`

It currently includes:

- Interactive ERCOT / Texas BESS map.
- Ranked BESS project list.
- Dynamic energy-flow visualization.
- Zoomable map behavior with more detail at deeper zoom levels.
- Statewide transmission overlay.
- Fort Bend parcel overlay around Avalon BESS.
- FEMA flood/buildability overlay.
- Parcel scoring with buildable acreage, 345kV proximity, flood penalty, and screening upside.
- Hover popup with `$ Value`.
- Exportable project and parcel CSVs.
- Five narrative deal pages.
- Client-grade Fort Bend 345kV land tell report.
- FBCAD owner/entity enrichment for the top Fort Bend parcel candidates.
- TailwindCSS styling entry, typed data contracts, and modular map/report/sidebar architecture.

## Strongest Demo Path

1. Open `index.html`.
2. Click **Fort Bend 345kV land tell** in the Deal Pages section.
3. Show the map around Avalon / Fort Bend.
4. Zoom into the parcel layer.
5. Hover parcels to show score, buildability, flood risk, and `$ Value`.
6. Open the right-side client report.
7. Highlight owner/entity notes such as State of Texas, George Foundation, NRG Texas Power LLC, and other parcel holders.
8. Use **Print / save PDF** for the report view.
9. Use **Export parcels** to produce a diligence CSV.

## Key Files

- `index.html`: Vite app shell loading `src/main.tsx`.
- `package.json`: React, TypeScript, Vite, TailwindCSS, build, dev, and preview scripts.
- `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig*.json`, `vercel.json`: deployable frontend tooling.
- `src/App.tsx`: Top-level app composition.
- `src/components/AppShell.tsx`: Three-column product layout.
- `src/features/sidebar/LeftSidebar.tsx`: Controls, deal pages, ranked opportunities, and CSV export entry points.
- `src/features/map/MapViewport.tsx`: Center map viewport and zoom controls.
- `src/features/map/layers/*`: Reusable layers for transmission, flood, parcel, ERCOT project, base map, and energy-flow overlays.
- `src/features/reports/RightReportPanel.tsx`: Selected opportunity, parcel table, owner/entity notes, narrative deal page, and Fort Bend report.
- `src/hooks/*`: Filtered-project and map-navigation hooks.
- `src/services/*`: CSV export, formatting, map math, project filtering, and parcel helpers.
- `src/store/useDealFlowStore.ts`: Frontend state for filters, selected project, map view, and hover panel.
- `src/types/index.ts`: TypeScript interfaces for Parcel, QueueProject, TransmissionLine, FloodZone, OwnerEntity, and Opportunity.
- `src/data/generated/*`: Generated TypeScript versions of the prior static data and processed overlays.
- `src/index.css`: Tailwind entry plus preserved institutional map/report styling.
- `app.js`, `data.js`, `styles.css`: Legacy static prototype reference files, no longer loaded by Vite.
- `data/processed/fort-bend-parcels-overlay.js`: Processed Fort Bend parcel geometry, scores, flood/buildability metrics, and value bands.
- `data/processed/fort-bend-owner-enrichment.js`: Processed FBCAD owner/entity records for top Fort Bend parcel candidates.
- `data/processed/transmission-overlay.js`: Processed transmission overlay.
- `data/processed/flood-overlay.js`: Processed flood overlay.
- `scripts/build_fort_bend_parcels_overlay.js`: Rebuilds parcel overlay from FBCAD shapefiles, HIFLD, and FEMA data.
- `scripts/build_fort_bend_owner_enrichment.js`: Extracts owner/entity fields from FBCAD CamaSummary DBF for top parcel IDs.
- `scripts/build_transmission_overlay.js`: Rebuilds transmission overlay.
- `scripts/build_flood_overlay.js`: Rebuilds flood overlay.
- `docs/ERCOT Battery Tell Pilot.md`: Commercial pilot package.
- `docs/Fort Bend 345kV Land Tell Report.md`: Standalone client-grade report draft.

## Data Sources Used

- ERCOT Resource Adequacy / GIS-style project data.
- Fort Bend CAD 2025 Certified GIS data.
- FBCAD CamaSummary DBF owner/entity fields.
- HIFLD Electric Power Transmission Lines.
- FEMA National Flood Hazard Layer.

## Current Commercial Positioning

The first sellable product should be the **ERCOT Battery Tell Pilot**.

Target customers:

- Data center site-selection teams.
- Infrastructure and private equity investors.
- Energy developers.
- Land assemblers.
- Power / data-center advisory firms.

Pilot pricing concept:

- Lite corridor screen: `$5,000`.
- ERCOT-wide standard pilot: `$12,500`.
- Premium pilot with custom diligence and briefing: `$25,000`.

The product should be positioned as a deal-screening and pre-headline intelligence tool, not as an appraisal, engineering study, or investment recommendation.

## Known Limitations

- The app is still frontend-only and local, not hosted SaaS.
- Some ERCOT project fields are prototype-normalized and need full source-level validation.
- Parcel work is currently focused on Fort Bend / Avalon, not all Texas.
- Owner/entity records are imported from FBCAD, but deed history and entity trees are not yet verified.
- Dollar values are screening estimates only.
- Exact POI/substation geometry still needs TSP/ERCOT verification.
- Public-owner parcels require a different diligence path than private owner outreach.

## Verification Commands

From `/Users/TonyWan/Documents/New project/Energy Deal Flow Intelligence`:

```bash
npm run build
npm run dev
```

Latest verification:

```bash
npm run build
```

Result: TypeScript and Vite production build passed. Browser smoke test loaded the React app at `http://127.0.0.1:5173/` with the ERCOT/Fort Bend workflow visible. The Vite config uses relative built asset paths, so `dist/index.html` can also be opened directly if localhost is unavailable.

## Recommended Next Steps

1. Run visual QA in the browser against the React/Vite version.
2. Add a **Diligence Queue** section that converts top parcel owners into action items.
3. Move large generated overlay modules to JSON or lazy-loaded chunks if bundle size becomes an issue.
4. Add deed-history enrichment for top FBCAD parcel IDs.
5. Add entity-tree enrichment for LLCs, partnerships, foundations, and public entities.
6. Verify Avalon POI geometry against TSP/ERCOT source records.
7. Host the MVP so it can be shown without relying on a local file path.

## Suggested Product Workflow

For each target opportunity:

1. Identify BESS/interconnection signal.
2. Confirm IA date and project maturity.
3. Map POI and nearby 345kV transmission.
4. Screen large parcels within the corridor.
5. Penalize flood/buildability constraints.
6. Import owner/entity data.
7. Estimate screening upside.
8. Generate narrative deal page.
9. Produce client report and CSV export.
10. Track diligence actions until the opportunity is outreach-ready.
