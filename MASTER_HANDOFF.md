# Master Handoff — Energy Deal Flow Intelligence

## Current State
Energy Deal Flow Intelligence is a React + TypeScript + Vite frontend for map-first ERCOT infrastructure intelligence. It preserves the Fort Bend / Avalon BESS demo, CSV exports, parcel overlays, flood/buildability screening, owner/entity notes, and client-facing report flow.

## Architecture
- `src/features/map`: map viewport and reusable overlay layers.
- `src/features/sidebar`: controls, deal pages, opportunity list, and workflow entry points.
- `src/features/reports`: report viewer, parcel details, and diligence context.
- `src/components`: reusable layout and UI primitives.
- `src/services`: map math, filtering, CSV exports, formatting, and opportunity helpers.
- `src/store`: frontend state for filters, layers, selected opportunity, hover state, and diligence queue.
- `src/types`: domain contracts for parcels, projects, lines, flood zones, owners, and opportunities.

## Product Direction
The product should evolve toward an infrastructure intelligence operating system: signal synthesis, corridor intelligence, diligence acceleration, opportunity ranking, narrative generation, and workflow integration.

## Next Sprint
Prioritize browser QA, Vercel deployment, diligence persistence design, real source validation, and additional Texas corridor replication.
